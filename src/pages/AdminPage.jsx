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

// --- ESTILOS VISUALES (LA PALETA DE MISS DONITAS) ---
const styles = {
  container: { backgroundColor: '#FFF8E7', minHeight: '100vh', color: '#5D4037' },
  mainTitle: { color: '#D81B60', fontWeight: 'bold', letterSpacing: '1px' },
  navLinkActive: { backgroundColor: '#FF8BA7', color: 'white', borderRadius: '20px', fontWeight: 'bold' },
  navLink: { color: '#5D4037', borderRadius: '20px' },
  tableHeader: { backgroundColor: '#FFC1E3', color: '#880E4F', borderBottom: '2px solid #F48FB1' },
  tableRow: { borderBottom: '1px solid #FFE0B2' },
  btnAdd: { backgroundColor: '#FF4081', border: 'none', borderRadius: '25px', padding: '10px 20px', fontWeight: '600' },
  btnEdit: { backgroundColor: '#FFF', border: '1px solid #FF4081', color: '#FF4081', borderRadius: '15px' },
  btnDelete: { backgroundColor: '#FFF', border: '1px solid #d32f2f', color: '#d32f2f', borderRadius: '15px' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '20px', boxShadow: '0 4px 15px rgba(255, 183, 197, 0.3)', border: 'none', padding: '20px' }
};

// --- MODAL DE CONFIRMACIÓN (DISEÑO CLEAN) ---
const ConfirmationModal = ({ show, onClose, onConfirm, title, message }) => {
  if (!show) return null;
  return (
    <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(93, 64, 55, 0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ borderRadius: '20px', border: 'none', overflow: 'hidden' }}>
          <div className="modal-header" style={{ backgroundColor: '#FFF8E7', borderBottom: '1px solid #FFE0B2' }}>
            <h5 className="modal-title" style={{ color: '#D81B60' }}>{title}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body" style={{ color: '#5D4037' }}>
            <p className="mb-0">{message}</p>
          </div>
          <div className="modal-footer" style={{ borderTop: 'none' }}>
            <button type="button" className="btn btn-light rounded-pill px-4" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn btn-danger rounded-pill px-4" onClick={onConfirm}>Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

function AdminPage() {
  const { theme } = useTheme(); 

  const [activeTab, setActiveTab] = useState('pedidosEnLinea');
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Modales
  const [showProductModal, setShowProductModal] = useState(false);
  const [productoActual, setProductoActual] = useState(null);
  const [showComboModal, setShowComboModal] = useState(false);
  const [comboActual, setComboActual] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  
  // Confirmaciones
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');
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
        const res = await apiClient.get('/combos/admin/todos');
        setCombos(res.data);
      }
    } catch (err) {
      setError(`No se pudieron cargar los datos.`);
      console.error("Error en fetchData:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [activeTab]);
  
  // --- HANDLERS PRODUCTOS ---
  const handleOpenProductModal = (producto = null) => {
    if (producto) {
      const productoParaModal = { ...producto, imagenes: producto.imagen_url ? [producto.imagen_url] : [] };
      setProductoActual(productoParaModal);
    } else { setProductoActual(null); }
    setShowProductModal(true); 
  };
  const handleCloseProductModal = () => { setShowProductModal(false); setProductoActual(null); };
  
  const handleSaveProducto = async (producto) => {
    const action = producto.id ? 'actualizado' : 'creado';
    const datosParaEnviar = { ...producto, imagen_url: (producto.imagenes && producto.imagenes.length > 0) ? producto.imagenes[0] : null };
    delete datosParaEnviar.imagenes; 
    try {
      if (datosParaEnviar.id) { await updateProduct(datosParaEnviar.id, datosParaEnviar); } else { await createProduct(datosParaEnviar); }
      toast.success(`Producto ${action} con éxito.`);
      fetchData();
      handleCloseProductModal();
    } catch (err) { toast.error(`No se pudo guardar el producto.`); }
  };
  
  const handleDeleteProducto = (producto) => {
    setConfirmTitle('Desactivar Producto');
    setConfirmMessage(`¿Seguro que quieres desactivar "${producto.nombre}"?`);
    setConfirmAction(() => async () => {
      try { await deleteProduct(producto.id); toast.success(`"${producto.nombre}" desactivado.`); fetchData(); } 
      catch (err) { toast.error('Error al desactivar.'); }
      setShowConfirmModal(false); 
    });
    setShowConfirmModal(true);
  };

  // --- HANDLERS COMBOS ---
  const handleOpenComboModal = (combo = null) => { setComboActual(combo); setShowComboModal(true); };
  const handleCloseComboModal = () => { setShowComboModal(false); setComboActual(null); };
  const handleSaveCombo = async (combo) => {
    try { if (combo.id) { await apiClient.put(`/combos/${combo.id}`, combo); } else { await apiClient.post('/combos', combo); }
      toast.success(`Combo guardado.`); fetchData(); handleCloseComboModal();
    } catch (err) { toast.error(`Error al guardar combo.`); }
  };
  const handleDeleteCombo = (combo) => {
    setConfirmTitle('Desactivar Combo');
    setConfirmMessage(`¿Seguro que quieres desactivar "${combo.nombre}"?`);
    setConfirmAction(() => async () => {
      try { await apiClient.patch(`/combos/${combo.id}/desactivar`); toast.success('Combo desactivado.'); fetchData(); } 
      catch (err) { toast.error('Error al desactivar.'); }
      setShowConfirmModal(false);
    });
    setShowConfirmModal(true);
  };

  // --- HANDLERS PEDIDOS ---
  const handleUpdateStatus = async (pedidoId, nuevoEstado) => {
    try { await apiClient.put(`/pedidos/${pedidoId}/estado`, { estado: nuevoEstado }); toast.success(`Pedido #${pedidoId} actualizado.`); fetchData(); } 
    catch (err) { toast.error('Error actualizando estado.'); }
  };
  const handleShowDetails = (pedido) => { setSelectedOrderDetails(pedido); setShowDetailsModal(true); };
  const handleCloseDetailsModal = () => { setShowDetailsModal(false); setSelectedOrderDetails(null); };

  const handlePurgePedidos = async () => {
    if (purgeConfirmText !== 'ELIMINAR') return toast.error('Texto incorrecto.');
    try { await apiClient.delete('/pedidos/purgar'); toast.success('Historial eliminado.'); setShowPurgeModal(false); setPurgeConfirmText(''); if (activeTab === 'pedidosEnLinea') fetchData(); else setActiveTab('pedidosEnLinea'); } 
    catch (error) { toast.error('Error al eliminar.'); }
  };

  return (
    <div style={styles.container} className="p-4">
      {/* HEADER DE LA PÁGINA */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <h1 style={styles.mainTitle}>🍩 Administración Miss Donitas</h1>
      </div>

      {/* NAVEGACIÓN ESTÉTICA */}
      <ul className="nav nav-pills mb-4 d-flex justify-content-center gap-3" style={{backgroundColor: 'transparent'}}>
        {[
          { id: 'pedidosEnLinea', label: 'Pedidos Online' },
          { id: 'productos', label: 'Mis Productos' },
          { id: 'combos', label: 'Combos' },
          { id: 'reporteGeneral', label: 'Reportes' },
          { id: 'reporteProductos', label: 'Por Producto' }
        ].map(tab => (
          <li className="nav-item" key={tab.id}>
            <button 
              className="nav-link px-4 shadow-sm" 
              style={activeTab === tab.id ? styles.navLinkActive : {...styles.navLink, backgroundColor: 'white'}}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* CONTENIDO PRINCIPAL EN TARJETA */}
      <div className="container-fluid" style={styles.card}>
        
        {loading && <div className="text-center py-5"><div className="spinner-border text-danger" role="status"></div></div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {/* --- VISTA DE PRODUCTOS --- */}
        {!loading && !error && activeTab === 'productos' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 style={{ color: '#5D4037' }}>Lista de Productos</h3>
              <button className="shadow-sm btn text-white" style={styles.btnAdd} onClick={() => handleOpenProductModal()}>
                + Nuevo Producto
              </button>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead style={styles.tableHeader}>
                  <tr>
                    <th className="py-3 ps-3 rounded-start">ID</th>
                    <th className="py-3">Nombre</th>
                    <th className="py-3">Precio</th>
                    <th className="py-3">Oferta</th>
                    <th className="py-3">Stock</th>
                    <th className="py-3">Categoría</th>
                    <th className="py-3 rounded-end text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((p) => (
                    <tr key={p.id} style={styles.tableRow}>
                      <td className="ps-3 fw-bold text-muted">#{p.id}</td>
                      <td className="fw-semibold">{p.nombre}</td>
                      <td style={{color: '#D81B60'}}>${Number(p.precio).toFixed(2)}</td>
                      <td>{p.en_oferta ? <span className="badge bg-danger rounded-pill">-{p.descuento_porcentaje}%</span> : <span className="text-muted small">No</span>}</td>
                      <td>{p.stock}</td>
                      <td><span className="badge bg-secondary bg-opacity-10 text-dark rounded-pill px-3">{p.categoria}</span></td>
                      <td className="text-center">
                        <button className="btn btn-sm me-2 shadow-sm" style={styles.btnEdit} onClick={() => handleOpenProductModal(p)}>
                          ✎ Editar
                        </button>
                        <button className="btn btn-sm shadow-sm" style={styles.btnDelete} onClick={() => handleDeleteProducto(p)}>
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* --- VISTA DE PEDIDOS --- */}
        {!loading && !error && activeTab === 'pedidosEnLinea' && (
          <div>
            <h3 className="mb-4" style={{ color: '#5D4037' }}>Pedidos Entrantes</h3>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead style={styles.tableHeader}>
                  <tr><th className="py-3 ps-3 rounded-start">ID</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Tipo</th><th>Estado</th><th className="rounded-end text-center">Acciones</th></tr>
                </thead>
                <tbody>
                  {pedidos.map((pedido) => (
                    <tr key={pedido.id} style={styles.tableRow}>
                      <td className="ps-3 fw-bold">#{pedido.id}</td>
                      <td>{pedido.nombre_cliente}</td>
                      <td>{new Date(pedido.fecha).toLocaleDateString()} <small className="text-muted">{new Date(pedido.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small></td>
                      <td className="fw-bold" style={{color: '#D81B60'}}>${Number(pedido.total).toFixed(2)}</td>
                      <td><span className={`badge rounded-pill ${pedido.tipo_orden === 'domicilio' ? 'bg-info text-dark' : 'bg-warning text-dark'}`}>{pedido.tipo_orden.toUpperCase()}</span></td>
                      <td><span className="badge bg-light text-dark border">{pedido.estado}</span></td>
                      <td className="text-center">
                        <div className="btn-group shadow-sm" role="group">
                          <button className="btn btn-sm btn-outline-dark" onClick={() => handleShowDetails(pedido)}>Ver</button>
                          <button className="btn btn-sm btn-outline-primary" onClick={() => handleUpdateStatus(pedido.id, 'En Preparacion')}>Cocinar</button>
                          <button className="btn btn-sm btn-outline-success" onClick={() => handleUpdateStatus(pedido.id, 'Completado')}>Listo</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VISTA DE COMBOS --- */}
        {!loading && !error && activeTab === 'combos' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 style={{ color: '#5D4037' }}>Lista de Combos</h3>
              <button className="shadow-sm btn text-white" style={styles.btnAdd} onClick={() => handleOpenComboModal()}>
                + Nuevo Combo
              </button>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead style={styles.tableHeader}>
                  <tr><th className="py-3 ps-3 rounded-start">ID</th><th>Nombre</th><th>Precio</th><th>Visible</th><th className="rounded-end text-center">Acciones</th></tr>
                </thead>
                <tbody>
                  {combos.map((combo) => (
                    <tr key={combo.id} style={styles.tableRow} className={!combo.esta_activo ? 'opacity-50' : ''}>
                      <td className="ps-3">#{combo.id}</td>
                      <td className="fw-semibold">{combo.nombre}</td>
                      <td style={{color: '#D81B60'}}>${Number(combo.precio).toFixed(2)}</td>
                      <td><span className={`badge rounded-pill ${combo.esta_activo ? 'bg-success' : 'bg-secondary'}`}>{combo.esta_activo ? 'Activo' : 'Oculto'}</span></td>
                      <td className="text-center">
                        <button className="btn btn-sm me-2 shadow-sm" style={styles.btnEdit} onClick={() => handleOpenComboModal(combo)}>✎ Editar</button>
                        {combo.esta_activo && <button className="btn btn-sm shadow-sm" style={styles.btnDelete} onClick={() => handleDeleteCombo(combo)}>✕</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* --- REPORTES --- */}
        {!loading && !error && activeTab === 'reporteGeneral' && (
          <div>
            {reportData.length > 0 ? <SalesReportChart reportData={reportData} /> : <p className="text-center text-muted py-5">No hay ventas registradas aún.</p>}
            <div className="mt-5 p-4 border border-danger border-opacity-25 rounded bg-danger bg-opacity-10">
              <h5 className="text-danger">Zona de Peligro</h5>
              <button className="btn btn-outline-danger btn-sm mt-2" onClick={() => setShowPurgeModal(true)}>⚠️ Borrar Historial de Pedidos</button>
            </div>
          </div>
        )}
        {activeTab === 'reporteProductos' && <ProductSalesReport />}

      </div>

      {/* MODALES AUXILIARES */}
      <ProductModal show={showProductModal} handleClose={handleCloseProductModal} handleSave={handleSaveProducto} productoActual={productoActual} />
      <ComboModal show={showComboModal} handleClose={handleCloseComboModal} handleSave={handleSaveCombo} comboActual={comboActual} />
      {showDetailsModal && (<DetallesPedidoModal pedido={selectedOrderDetails} onClose={handleCloseDetailsModal} />)}

      <ConfirmationModal
        show={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction}
        title={confirmTitle}
        message={confirmMessage}
      />

      {showPurgeModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 overflow-hidden">
              <div className="modal-header bg-danger text-white"><h5 className="modal-title">⚠️ Acción Irreversible</h5><button type="button" className="btn-close btn-close-white" onClick={() => setShowPurgeModal(false)}></button></div>
              <div className="modal-body bg-light">
                <p>Escribe <strong>ELIMINAR</strong> para borrar todo el historial:</p>
                <input type="text" className="form-control" value={purgeConfirmText} onChange={(e) => setPurgeConfirmText(e.target.value)} />
              </div>
              <div className="modal-footer bg-light border-0">
                <button type="button" className="btn btn-secondary rounded-pill" onClick={() => setShowPurgeModal(false)}>Cancelar</button>
                <button type="button" className="btn btn-danger rounded-pill" onClick={handlePurgePedidos} disabled={purgeConfirmText !== 'ELIMINAR'}>Borrar Todo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;