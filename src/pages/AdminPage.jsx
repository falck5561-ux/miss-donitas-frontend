import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ProductModal from '../components/ProductModal';
import ComboModal from '../components/ComboModal';
import SalesReportChart from '../components/SalesReportChart';
import ProductSalesReport from '../components/ProductSalesReport';
import DetallesPedidoModal from '../components/DetallesPedidoModal';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/productService';
import apiClient from '../services/api';
import { useTheme } from '../context/ThemeContext';

// --- SUSTITUYE TU "ConfirmationModal" POR ESTE ---
const ConfirmationModal = ({ show, onClose, onConfirm, title, message }) => {
  if (!show) return null;

  // 🎨 ESTILO FORZADO: Crema y Café (Ignoramos el modo oscuro para que se vea lindo)
  const modalStyle = { backgroundColor: '#FFF8E7', color: '#5D4037', border: '1px solid #E0C097' };
  const borderStyle = { borderColor: '#E0C097' };

  return (
    <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={modalStyle}>
          <div className="modal-header" style={borderStyle}>
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p>{message}</p>
          </div>
          <div className="modal-footer" style={borderStyle}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn btn-danger" onClick={onConfirm}>Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

function AdminPage() {
  const { theme } = useTheme(); // Obtenemos el tema actual

  // ... (otros estados sin cambios)
  const [activeTab, setActiveTab] = useState('pedidosEnLinea');
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [productoActual, setProductoActual] = useState(null);
  const [showComboModal, setShowComboModal] = useState(false);
  const [comboActual, setComboActual] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');

  // --- NUEVOS ESTADOS para manejar el contenido dinámico del modal ---
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'productos') {
        const res = await getProducts();
        setProductos(res);
      } else if (activeTab === 'reporteGeneral') {
        const res = await apiClient.get('/ventas/reporte');
        setReportData(res.data);
      } else if (activeTab === 'pedidosEnLinea') {
        const res = await apiClient.get('/pedidos');
        setPedidos(res.data);
      } else if (activeTab === 'combos') {
        
        // ================== CAMBIO AQUÍ (1 de 3) ==================
        // Ahora usamos la nueva ruta del backend para traer
        // TODOS los combos (activos e inactivos) a este panel.
        const res = await apiClient.get('/combos/admin/todos');
        // ==========================================================

        setCombos(res.data);
      }
    } catch (err) {
      setError(`No se pudieron cargar los datos.`);
      console.error("Error en fetchData:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);
  
  const handleOpenProductModal = (producto = null) => {
    if (producto) {
      const productoParaModal = {
        ...producto,
        imagenes: producto.imagen_url ? [producto.imagen_url] : []
      };
      setProductoActual(productoParaModal);
    } else {
      setProductoActual(null);
    }
    setShowProductModal(true); 
  };
  
  const handleCloseProductModal = () => { setShowProductModal(false); setProductoActual(null); };
  
  const handleSaveProducto = async (producto) => {
    const action = producto.id ? 'actualizado' : 'creado';
    const datosParaEnviar = {
      ...producto,
      imagen_url: (producto.imagenes && producto.imagenes.length > 0) ? producto.imagenes[0] : null,
    };
    delete datosParaEnviar.imagenes; 

    try {
      if (datosParaEnviar.id) {
        await updateProduct(datosParaEnviar.id, datosParaEnviar);
      } else {
        await createProduct(datosParaEnviar);
      }
      toast.success(`Producto ${action} con éxito.`);
      fetchData();
      handleCloseProductModal();
    } catch (err) { toast.error(`No se pudo guardar el producto.`); }
  };
  
  // ✅ MEJORA: La función ahora establece un título y mensaje específicos antes de abrir el modal
  const handleDeleteProducto = (producto) => {
    setConfirmTitle('Desactivar Producto');
    setConfirmMessage(`¿Seguro que quieres desactivar "${producto.nombre}"? Ya no aparecerá en el menú de clientes.`);
    setConfirmAction(() => async () => {
      try {
        await deleteProduct(producto.id);
        toast.success(`"${producto.nombre}" desactivado con éxito.`);
        fetchData();
      } catch (err) { 
        toast.error(err.response?.data?.msg || 'No se pudo desactivar el producto.');
      }
      setShowConfirmModal(false); // Cierra el modal después de la acción
    });
    setShowConfirmModal(true);
  };

  const handleOpenComboModal = (combo = null) => { setComboActual(combo); setShowComboModal(true); };
  const handleCloseComboModal = () => { setShowComboModal(false); setComboActual(null); };
  const handleSaveCombo = async (combo) => {
    const action = combo.id ? 'actualizado' : 'creado';
    try {
      if (combo.id) { await apiClient.put(`/combos/${combo.id}`, combo); } else { await apiClient.post('/combos', combo); }
      toast.success(`Combo ${action} con éxito.`);
      fetchData();
      handleCloseComboModal();
    } catch (err) { toast.error(`No se pudo guardar el combo.`); }
  };

  // ================== CAMBIO AQUÍ (2 de 3) ==================
  // Esta es la función que se llama al pulsar "Eliminar" en un combo.
  const handleDeleteCombo = (combo) => {
    
    // 1. Cambiamos el Título y Mensaje para que digan "Desactivar"
    setConfirmTitle('Desactivar Combo');
    // Usamos 'nombre' (de la DB) en lugar de 'titulo' (del mapeo frontend)
    setConfirmMessage(`¿Seguro que quieres desactivar "${combo.nombre}"? Ya no será visible para los clientes.`);
    
    setConfirmAction(() => async () => {
      try {
        
        // 2. Cambiamos el método de 'delete' a 'patch'
        // 3. Cambiamos la URL a la nueva ruta '/desactivar'
        await apiClient.patch(`/combos/${combo.id}/desactivar`);
        
        toast.success('Combo desactivado con éxito.');
        fetchData(); // Recarga la lista
      } catch (err) { 
        // Mostramos el error del backend si existe
        toast.error(err.response?.data?.msg || 'No se pudo desactivar el combo.'); 
      }
      setShowConfirmModal(false);
    });
    setShowConfirmModal(true);
  };
  // ==========================================================
  
  const handleUpdateStatus = async (pedidoId, nuevoEstado) => {
    try {
      await apiClient.put(`/pedidos/${pedidoId}/estado`, { estado: nuevoEstado });
      toast.success(`Pedido #${pedidoId} actualizado.`);
      fetchData();
    } catch (err) { 
      console.error("Error al actualizar estado:", err.response?.data || err.message);
      toast.error('No se pudo actualizar el estado.'); 
    }
  };
  const handleShowDetails = (pedido) => { setSelectedOrderDetails(pedido); setShowDetailsModal(true); };
  const handleCloseDetailsModal = () => { setShowDetailsModal(false); setSelectedOrderDetails(null); };

  const handlePurgePedidos = async () => {
    if (purgeConfirmText !== 'ELIMINAR') {
      return toast.error('El texto de confirmación no coincide.');
    }
    try {
      await apiClient.delete('/pedidos/purgar');
      toast.success('¡Historial de pedidos eliminado con éxito!');
      setShowPurgeModal(false);
      setPurgeConfirmText('');
      if (activeTab === 'pedidosEnLinea') {
        fetchData(); 
      } else {
        setActiveTab('pedidosEnLinea');
      }
    } catch (error) {
      toast.error('Ocurrió un error al eliminar los pedidos.');
    }
  };

  return (
    <div>
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item"><button className={`nav-link ${activeTab === 'pedidosEnLinea' ? 'active' : ''}`} onClick={() => setActiveTab('pedidosEnLinea')}>Pedidos en Línea</button></li>
        <li className="nav-item"><button className={`nav-link ${activeTab === 'productos' ? 'active' : ''}`} onClick={() => setActiveTab('productos')}>Gestión de Productos</button></li>
        <li className="nav-item"><button className={`nav-link ${activeTab === 'combos' ? 'active' : ''}`} onClick={() => setActiveTab('combos')}>Gestión de Combos</button></li>
        <li className="nav-item"><button className={`nav-link ${activeTab === 'reporteGeneral' ? 'active' : ''}`} onClick={() => setActiveTab('reporteGeneral')}>Reporte General</button></li>
        <li className="nav-item"><button className={`nav-link ${activeTab === 'reporteProductos' ? 'active' : ''}`} onClick={() => setActiveTab('reporteProductos')}>Reporte por Producto</button></li>
      </ul>

      {loading && <div className="text-center"><div className="spinner-border" role="status"></div></div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && activeTab === 'productos' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>Gestión de Productos</h1>
            <button className="btn btn-primary" onClick={() => handleOpenProductModal()}>Añadir Nuevo Producto</button>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-dark">
                <tr><th>ID</th><th>Nombre</th><th>Precio</th><th>Oferta</th><th>Stock</th><th>Categoría</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td><td>{p.nombre}</td><td>${Number(p.precio).toFixed(2)}</td><td>{p.en_oferta ? `${p.descuento_porcentaje}%` : 'No'}</td>
                    <td>{p.stock}</td><td>{p.categoria}</td>
                    <td>
                      <button className="btn btn-sm btn-info text-white me-2" onClick={() => handleOpenProductModal(p)}>Editar</button>
                      {/* ✅ MEJORA: Pasamos el objeto 'p' completo para usar su nombre en el mensaje */}
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteProducto(p)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* ... (el resto del código de las otras pestañas no cambia y se omite por brevedad) ... */}
      {!loading && !error && activeTab === 'pedidosEnLinea' && (
        <div>
          <h1 className="mb-4">Gestión de Pedidos en Línea</h1>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-dark">
                <tr><th>ID</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Tipo</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {pedidos.map((pedido) => (
                  <tr key={pedido.id}>
                    <td>#{pedido.id}</td>
                    <td>{pedido.nombre_cliente}</td>
                    <td>{new Date(pedido.fecha).toLocaleString()}</td>
                    <td>${Number(pedido.total).toFixed(2)}</td>
                    <td><span className={`badge ${pedido.tipo_orden === 'domicilio' ? 'bg-info text-dark' : 'bg-secondary'}`}>{pedido.tipo_orden.charAt(0).toUpperCase() + pedido.tipo_orden.slice(1)}</span></td>
                    <td>{pedido.estado}</td>
                    <td>
                      <button className="btn btn-sm btn-info me-2" onClick={() => handleShowDetails(pedido)}>Ver Pedido</button>
                      <button className="btn btn-sm btn-warning me-2" onClick={() => handleUpdateStatus(pedido.id, 'En Preparacion')}>Preparar</button>
                      <button className="btn btn-sm btn-success me-2" onClick={() => handleUpdateStatus(pedido.id, 'Completado')}>Completado</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================== CAMBIO AQUÍ (3 de 3) ================== */}
      {!loading && !error && activeTab === 'combos' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>Gestión de Combos</h1>
            <button className="btn btn-primary" onClick={() => handleOpenComboModal()}>Añadir Nuevo Combo</button>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-dark">
                {/* Añadimos la columna "Visible" */}
                <tr><th>ID</th><th>Nombre</th><th>Precio</th><th>Visible</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {combos.map((combo) => (
                  // Si el combo está inactivo, le ponemos una clase para atenuarlo
                  <tr key={combo.id} className={!combo.esta_activo ? 'text-muted opacity-50' : ''}>
                    <td>{combo.id}</td>
                    {/* Usamos 'nombre' que viene de la DB (la nueva ruta ya no manda 'titulo') */}
                    <td>{combo.nombre}</td>
                    <td>${Number(combo.precio).toFixed(2)}</td>
                    {/* Mostramos el estado de visibilidad */}
                    <td>
                      <span className={`badge ${combo.esta_activo ? 'bg-success' : 'bg-danger'}`}>
                        {combo.esta_activo ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-info text-white me-2" onClick={() => handleOpenComboModal(combo)}>Editar</button>
                      {/* Solo mostramos "Eliminar" si el combo está activo */}
                      {combo.esta_activo && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteCombo(combo)}>Eliminar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* ========================================================== */}
      
      {!loading && !error && activeTab === 'reporteGeneral' && (
        <div>
          {reportData.length > 0 ? <SalesReportChart reportData={reportData} /> : <p className="text-center">No hay datos de ventas para mostrar.</p>}
          <div className="mt-5 p-4 border border-danger rounded">
            <h3 className="text-danger">Zona de Peligro</h3>
            <p>Las acciones en esta área son permanentes y no se pueden deshacer.</p>
            <button className="btn btn-danger" onClick={() => setShowPurgeModal(true)}>Eliminar Historial de Pedidos en Línea</button>
          </div>
        </div>
      )}
      {activeTab === 'reporteProductos' && <ProductSalesReport />}

      <ProductModal show={showProductModal} handleClose={handleCloseProductModal} handleSave={handleSaveProducto} productoActual={productoActual} />
      <ComboModal show={showComboModal} handleClose={handleCloseComboModal} handleSave={handleSaveCombo} comboActual={comboActual} />
      {showDetailsModal && (<DetallesPedidoModal pedido={selectedOrderDetails} onClose={handleCloseDetailsModal} />)}

      {/* ✅ MEJORA: El modal ahora usa los estados dinámicos para el título y el mensaje */}
      <ConfirmationModal
        show={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction}
        title={confirmTitle}
        message={confirmMessage}
        theme={theme}
      />

      {showPurgeModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header"><h5 className="modal-title text-danger">⚠️ ¡Acción Irreversible!</h5><button type="button" className="btn-close" onClick={() => setShowPurgeModal(false)}></button></div>
              <div className="modal-body">
                <p>Estás a punto de eliminar <strong>todos los pedidos en línea</strong> de la base de datos. Esta acción no se puede deshacer.</p>
                <p>Para confirmar, por favor escribe <strong>ELIMINAR</strong> en el siguiente campo:</p>
                <input type="text" className="form-control" value={purgeConfirmText} onChange={(e) => setPurgeConfirmText(e.target.value)} placeholder="ELIMINAR" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPurgeModal(false)}>Cancelar</button>
                <button type="button" className="btn btn-danger" onClick={handlePurgePedidos} disabled={purgeConfirmText !== 'ELIMINAR'}>Entiendo las consecuencias, eliminar todo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;

