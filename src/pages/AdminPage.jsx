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

// --- SISTEMA DE DISEÑO "MISS DONITAS PREMIUM" ---
const themeColors = {
  bg: '#FFFDF5',          // Crema Vainilla muy suave
  cardBg: '#FFFFFF',      // Blanco puro
  textMain: '#4E342E',    // Café Chocolate Oscuro
  textLight: '#795548',   // Café con leche
  primary: '#FF80AB',     // Rosa Fresa
  primaryLight: '#FFF0F5',// Rosa Pastel muy claro (fondos)
  accent: '#26C6DA',      // Turquesa suave (para editar/ver)
  danger: '#EF5350',      // Rojo suave
  success: '#66BB6A',     // Verde suave
  shadow: '0 10px 30px rgba(255, 128, 171, 0.15)', // Sombra rosada difusa
  shadowHover: '0 15px 35px rgba(255, 128, 171, 0.25)',
};

const styles = {
  container: {
    backgroundColor: themeColors.bg,
    minHeight: '100vh',
    fontFamily: '"Nunito", "Segoe UI", sans-serif',
    padding: '40px 20px',
    color: themeColors.textMain,
  },
  headerTitle: {
    color: '#D81B60',
    fontWeight: '800',
    fontSize: '2.5rem',
    textShadow: '2px 2px 0px #FFE0B2',
    marginBottom: '10px'
  },
  card: {
    backgroundColor: themeColors.cardBg,
    borderRadius: '24px',
    border: 'none',
    boxShadow: themeColors.shadow,
    padding: '30px',
    transition: 'all 0.3s ease',
  },
  navPillsContainer: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: '50px',
    padding: '8px',
    display: 'inline-flex',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    marginBottom: '30px'
  },
  navLink: {
    color: themeColors.textLight,
    borderRadius: '30px',
    padding: '10px 25px',
    fontWeight: '600',
    border: 'none',
    background: 'transparent',
    transition: 'all 0.3s ease',
  },
  navLinkActive: {
    backgroundColor: themeColors.primary,
    color: 'white',
    boxShadow: '0 4px 10px rgba(255, 128, 171, 0.4)',
  },
  // Tablas
  tableHeader: {
    backgroundColor: themeColors.primaryLight,
    color: '#D81B60',
    fontWeight: '700',
    borderBottom: 'none',
    borderRadius: '15px'
  },
  tableRow: {
    borderBottom: '1px solid #FFF3E0',
    transition: 'background-color 0.2s',
  },
  // Botones
  btnMain: {
    background: 'linear-gradient(45deg, #FF80AB, #FF4081)',
    border: 'none',
    borderRadius: '50px',
    color: 'white',
    padding: '12px 30px',
    fontWeight: 'bold',
    boxShadow: '0 4px 15px rgba(255, 64, 129, 0.3)',
  },
  btnAction: (color) => ({
    backgroundColor: 'white',
    border: `2px solid ${color}`,
    color: color,
    borderRadius: '12px',
    padding: '5px 15px',
    fontWeight: '600',
    fontSize: '0.85rem',
    transition: 'all 0.2s'
  }),
  badge: (bgColor, textColor) => ({
    backgroundColor: bgColor,
    color: textColor,
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '700',
    border: '1px solid rgba(0,0,0,0.05)'
  })
};

// --- COMPONENTE DE TARJETA FLOTANTE (REUTILIZABLE) ---
const StatCard = ({ title, value, color }) => (
  <div style={{...styles.card, padding: '20px', textAlign: 'center', borderBottom: `4px solid ${color}`}}>
    <h6 style={{color: '#9E9E9E', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px'}}>{title}</h6>
    <h3 style={{color: color, fontWeight: 'bold', margin: 0}}>{value}</h3>
  </div>
);

// --- MODAL DE CONFIRMACIÓN (ESTÉTICA MINIMALISTA) ---
const ConfirmationModal = ({ show, onClose, onConfirm, title, message }) => {
  if (!show) return null;
  return (
    <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(93, 64, 55, 0.4)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
          <div className="modal-header border-0 pb-0 pt-4 px-4">
            <h5 className="modal-title fw-bold" style={{ color: themeColors.textMain }}>{title}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body px-4 pt-2 pb-4">
            <p className="text-muted mb-0" style={{fontSize: '1.1rem'}}>{message}</p>
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-light rounded-pill px-4 fw-bold" onClick={onClose}>Cancelar</button>
            <button className="btn btn-danger rounded-pill px-4 fw-bold shadow-sm" onClick={onConfirm}>Confirmar</button>
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
  
  // --- HANDLERS ---
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
      toast.success(`Producto ${action} con éxito.`); fetchData(); handleCloseProductModal();
    } catch (err) { toast.error(`Error al guardar.`); }
  };
  
  const handleDeleteProducto = (producto) => {
    setConfirmTitle('Desactivar Producto');
    setConfirmMessage(`¿Ocultar "${producto.nombre}" del menú?`);
    setConfirmAction(() => async () => {
      try { await deleteProduct(producto.id); toast.success(`"${producto.nombre}" ocultado.`); fetchData(); } 
      catch (err) { toast.error('Error al desactivar.'); }
      setShowConfirmModal(false); 
    });
    setShowConfirmModal(true);
  };

  const handleOpenComboModal = (combo = null) => { setComboActual(combo); setShowComboModal(true); };
  const handleCloseComboModal = () => { setShowComboModal(false); setComboActual(null); };
  const handleSaveCombo = async (combo) => {
    try { if (combo.id) { await apiClient.put(`/combos/${combo.id}`, combo); } else { await apiClient.post('/combos', combo); }
      toast.success(`Combo guardado.`); fetchData(); handleCloseComboModal();
    } catch (err) { toast.error(`Error al guardar.`); }
  };
  const handleDeleteCombo = (combo) => {
    setConfirmTitle('Desactivar Combo');
    setConfirmMessage(`¿Ocultar "${combo.nombre}" del menú?`);
    setConfirmAction(() => async () => {
      try { await apiClient.patch(`/combos/${combo.id}/desactivar`); toast.success('Combo ocultado.'); fetchData(); } 
      catch (err) { toast.error('Error al desactivar.'); }
      setShowConfirmModal(false);
    });
    setShowConfirmModal(true);
  };

  const handleUpdateStatus = async (pedidoId, nuevoEstado) => {
    try { await apiClient.put(`/pedidos/${pedidoId}/estado`, { estado: nuevoEstado }); toast.success(`Pedido #${pedidoId} actualizado.`); fetchData(); } 
    catch (err) { toast.error('Error actualizando estado.'); }
  };
  const handleShowDetails = (pedido) => { setSelectedOrderDetails(pedido); setShowDetailsModal(true); };
  const handleCloseDetailsModal = () => { setShowDetailsModal(false); setSelectedOrderDetails(null); };
  const handlePurgePedidos = async () => {
    if (purgeConfirmText !== 'ELIMINAR') return toast.error('Escribe ELIMINAR para confirmar.');
    try { await apiClient.delete('/pedidos/purgar'); toast.success('Historial borrado.'); setShowPurgeModal(false); setPurgeConfirmText(''); if (activeTab === 'pedidosEnLinea') fetchData(); else setActiveTab('pedidosEnLinea'); } 
    catch (error) { toast.error('Error al eliminar.'); }
  };

  return (
    <div style={styles.container}>
      <div className="container">
        
        {/* HEADER */}
        <div className="text-center mb-5">
          <h1 style={styles.headerTitle}>🍩 Panel Miss Donitas</h1>
          <p className="text-muted" style={{fontSize: '1.1rem'}}>Gestiona tus pedidos y productos con dulzura.</p>
        </div>

        {/* NAVEGACIÓN */}
        <div className="d-flex justify-content-center">
          <div style={styles.navPillsContainer}>
            {[
              { id: 'pedidosEnLinea', label: '🛎️ Pedidos' },
              { id: 'productos', label: '🍩 Productos' },
              { id: 'combos', label: '🎁 Combos' },
              { id: 'reporteGeneral', label: '📊 Reportes' },
              { id: 'reporteProductos', label: '📈 Por Producto' }
            ].map(tab => (
              <button 
                key={tab.id}
                style={activeTab === tab.id ? styles.navLinkActive : styles.navLink}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ÁREA DE CONTENIDO */}
        <div style={styles.card}>
          
          {loading && <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>}
          {error && <div className="alert alert-danger rounded-4">{error}</div>}

          {/* === PRODUCTOS === */}
          {!loading && !error && activeTab === 'productos' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold m-0" style={{color: themeColors.textMain}}>Mis Productos</h3>
                <button className="shadow-sm btn" style={styles.btnMain} onClick={() => handleOpenProductModal()}>
                  + Agregar Producto
                </button>
              </div>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th style={{...styles.tableHeader, borderTopLeftRadius: '15px', paddingLeft: '20px'}}>Producto</th>
                      <th style={styles.tableHeader}>Precio</th>
                      <th style={styles.tableHeader}>Stock</th>
                      <th style={styles.tableHeader}>Estado</th>
                      <th style={{...styles.tableHeader, borderTopRightRadius: '15px', textAlign: 'center'}}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((p) => (
                      <tr key={p.id} style={styles.tableRow}>
                        <td style={{paddingLeft: '20px'}}>
                          <div className="fw-bold" style={{fontSize: '1.05rem'}}>{p.nombre}</div>
                          <small className="text-muted">{p.categoria}</small>
                        </td>
                        <td style={{color: '#D81B60', fontWeight: 'bold'}}>${Number(p.precio).toFixed(2)}</td>
                        <td>
                          {p.stock <= 5 ? <span style={styles.badge('#FFEBEE', '#D32F2F')}>Bajo: {p.stock}</span> : <span className="text-muted">{p.stock} u.</span>}
                        </td>
                        <td>
                          {p.en_oferta ? <span style={styles.badge('#E8F5E9', '#2E7D32')}>Oferta -{p.descuento_porcentaje}%</span> : <span style={styles.badge('#F5F5F5', '#9E9E9E')}>Normal</span>}
                        </td>
                        <td className="text-center">
                          <button style={{...styles.btnAction(themeColors.accent), marginRight: '8px'}} onClick={() => handleOpenProductModal(p)}>Editar</button>
                          <button style={styles.btnAction(themeColors.danger)} onClick={() => handleDeleteProducto(p)}>Ocultar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === PEDIDOS === */}
          {!loading && !error && activeTab === 'pedidosEnLinea' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold m-0" style={{color: themeColors.textMain}}>Pedidos Activos</h3>
                <span className="badge bg-danger rounded-pill px-3 py-2">{pedidos.filter(p => p.estado === 'Pendiente').length} Pendientes</span>
              </div>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th style={{...styles.tableHeader, borderTopLeftRadius: '15px', paddingLeft: '20px'}}>ID</th>
                      <th style={styles.tableHeader}>Cliente</th>
                      <th style={styles.tableHeader}>Total</th>
                      <th style={styles.tableHeader}>Tipo</th>
                      <th style={styles.tableHeader}>Estado</th>
                      <th style={{...styles.tableHeader, borderTopRightRadius: '15px', textAlign: 'center'}}>Gestión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.map((p) => (
                      <tr key={p.id} style={styles.tableRow}>
                        <td className="fw-bold ps-4 text-muted">#{p.id}</td>
                        <td>
                          <div className="fw-bold">{p.nombre_cliente}</div>
                          <small className="text-muted">{new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                        </td>
                        <td className="fw-bold" style={{color: themeColors.primary}}>${Number(p.total).toFixed(2)}</td>
                        <td>
                          {p.tipo_orden === 'domicilio' 
                            ? <span style={styles.badge('#E3F2FD', '#1565C0')}>🛵 Domicilio</span> 
                            : <span style={styles.badge('#FFF3E0', '#EF6C00')}>🏪 Recoger</span>}
                        </td>
                        <td>
                          <span className={`badge rounded-pill border ${
                            p.estado === 'Pendiente' ? 'bg-warning text-dark' : 
                            p.estado === 'Completado' ? 'bg-success text-white' : 'bg-light text-dark'
                          }`}>{p.estado}</span>
                        </td>
                        <td className="text-center">
                          <button className="btn btn-sm btn-light rounded-pill border me-2" onClick={() => handleShowDetails(p)}>👁️ Ver</button>
                          {p.estado !== 'Completado' && (
                             <button className="btn btn-sm btn-primary rounded-pill border-0" style={{backgroundColor: themeColors.accent}} onClick={() => handleUpdateStatus(p.id, 'En Preparacion')}>👨‍🍳 Cocinar</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === COMBOS === */}
          {!loading && !error && activeTab === 'combos' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold m-0" style={{color: themeColors.textMain}}>Combos & Promos</h3>
                <button className="shadow-sm btn" style={styles.btnMain} onClick={() => handleOpenComboModal()}>+ Nuevo Combo</button>
              </div>
              <div className="row g-4">
                {combos.map((combo) => (
                  <div className="col-md-6 col-lg-4" key={combo.id}>
                    <div style={{
                      border: `1px solid ${combo.esta_activo ? '#E0F2F1' : '#FFEBEE'}`, 
                      borderRadius: '20px', 
                      padding: '20px', 
                      backgroundColor: combo.esta_activo ? '#FAFAFA' : '#FFF5F5',
                      opacity: combo.esta_activo ? 1 : 0.7
                    }}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="fw-bold mb-0">{combo.nombre}</h5>
                        <span style={combo.esta_activo ? styles.badge('#E8F5E9', '#2E7D32') : styles.badge('#FFEBEE', '#C62828')}>
                          {combo.esta_activo ? 'Activo' : 'Oculto'}
                        </span>
                      </div>
                      <h4 style={{color: themeColors.primary, fontWeight: '800'}}>${Number(combo.precio).toFixed(2)}</h4>
                      <div className="mt-3 d-flex gap-2">
                        <button style={{...styles.btnAction(themeColors.accent), flex:1}} onClick={() => handleOpenComboModal(combo)}>Editar</button>
                        {combo.esta_activo && (
                          <button style={{...styles.btnAction(themeColors.danger), flex:1}} onClick={() => handleDeleteCombo(combo)}>Ocultar</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === REPORTES === */}
          {!loading && !error && activeTab === 'reporteGeneral' && (
            <div>
              {reportData.length > 0 ? (
                <div>
                   <div className="row mb-4">
                      <div className="col-md-4"><StatCard title="Total Ventas" value={`$${reportData.reduce((acc, curr) => acc + Number(curr.total_ventas), 0).toFixed(2)}`} color={themeColors.success} /></div>
                      <div className="col-md-4"><StatCard title="Transacciones" value={reportData.reduce((acc, curr) => acc + Number(curr.cantidad_pedidos), 0)} color={themeColors.accent} /></div>
                      <div className="col-md-4"><StatCard title="Ticket Promedio" value="$150.00" color={themeColors.primary} /></div>
                   </div>
                   <SalesReportChart reportData={reportData} /> 
                </div>
              ) : <p className="text-center py-5 text-muted">No hay datos suficientes para generar gráficas.</p>}
              
              <div className="mt-5 p-4 rounded-4" style={{backgroundColor: '#FFEBEE', border: '1px dashed #EF5350'}}>
                <h5 className="text-danger fw-bold">⚠️ Zona de Peligro</h5>
                <p className="small text-muted">Aquí puedes reiniciar la base de datos de pedidos de prueba.</p>
                <button className="btn btn-outline-danger rounded-pill btn-sm" onClick={() => setShowPurgeModal(true)}>Purgar Historial</button>
              </div>
            </div>
          )}
          {activeTab === 'reporteProductos' && <ProductSalesReport />}

        </div>
      </div>

      {/* Modales Auxiliares */}
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
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 overflow-hidden">
              <div className="modal-header bg-danger text-white"><h5 className="modal-title">⚠️ Confirmación</h5><button type="button" className="btn-close btn-close-white" onClick={() => setShowPurgeModal(false)}></button></div>
              <div className="modal-body bg-light p-4">
                <p>Escribe <strong>ELIMINAR</strong> para confirmar el borrado total:</p>
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