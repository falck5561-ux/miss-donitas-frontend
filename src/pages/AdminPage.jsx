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

// --- PALETA DE COLORES "MISS DONITAS PREMIUM" ---
const themeColors = {
  bg: '#FFFDF5',           // Crema Vainilla (Fondo pantalla)
  cardBg: '#FFFFFF',       // Blanco Puro (Tarjetas)
  textMain: '#5D4037',     // Café Chocolate (Títulos)
  textLight: '#8D6E63',    // Café con Leche (Subtítulos)
  primary: '#FF80AB',      // Rosa Fresa (Botones principales)
  primaryDark: '#F50057',  // Rosa Intenso (Textos destacados)
  secondary: '#FFECB3',    // Amarillo Pastel (Detalles)
  accent: '#26C6DA',       // Turquesa (Botones editar)
  danger: '#EF5350',       // Rojo Suave (Eliminar)
  success: '#66BB6A',      // Verde Suave (Estados)
  border: '#FFF3E0',       // Bordes muy sutiles
  shadow: '0 10px 30px rgba(255, 128, 171, 0.15)', // Sombra rosada difusa
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
    color: themeColors.primaryDark,
    fontWeight: '800',
    fontSize: '2.5rem',
    marginBottom: '10px'
  },
  // Navegación estilo "Píldora Flotante"
  navPillsContainer: {
    backgroundColor: 'white',
    borderRadius: '50px',
    padding: '6px',
    display: 'inline-flex',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    marginBottom: '35px',
    border: `1px solid ${themeColors.border}`
  },
  navLink: {
    color: themeColors.textLight,
    borderRadius: '30px',
    padding: '10px 25px',
    fontWeight: '700',
    border: 'none',
    background: 'transparent',
    transition: 'all 0.3s ease',
  },
  navLinkActive: {
    backgroundColor: themeColors.primary,
    color: 'white',
    boxShadow: '0 4px 12px rgba(255, 128, 171, 0.4)',
  },
  // Tarjeta Principal
  card: {
    backgroundColor: themeColors.cardBg,
    borderRadius: '24px',
    border: 'none',
    boxShadow: themeColors.shadow,
    padding: '35px',
  },
  // Tablas
  tableHeader: {
    backgroundColor: '#FFF0F5', // Rosa muy pálido
    color: themeColors.primaryDark,
    fontWeight: '700',
    borderBottom: 'none',
    textTransform: 'uppercase',
    fontSize: '0.85rem',
    letterSpacing: '1px'
  },
  tableRow: {
    borderBottom: `1px solid ${themeColors.border}`,
    transition: 'background-color 0.2s',
  },
  // Botones
  btnAdd: {
    background: `linear-gradient(45deg, ${themeColors.primary}, #FF4081)`,
    border: 'none',
    borderRadius: '50px',
    color: 'white',
    padding: '12px 25px',
    fontWeight: '700',
    boxShadow: '0 4px 15px rgba(255, 64, 129, 0.25)',
  },
  btnAction: (color, isOutline = true) => ({
    backgroundColor: isOutline ? 'transparent' : color,
    border: isOutline ? `1px solid ${color}` : 'none',
    color: isOutline ? color : 'white',
    borderRadius: '12px',
    padding: '6px 16px',
    fontWeight: '600',
    fontSize: '0.85rem',
    transition: 'all 0.2s',
    marginRight: '6px'
  }),
  badge: (bgColor, textColor) => ({
    backgroundColor: bgColor,
    color: textColor,
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  })
};

// --- MODAL DE CONFIRMACIÓN (ESTÉTICA MINIMALISTA) ---
const ConfirmationModal = ({ show, onClose, onConfirm, title, message }) => {
  if (!show) return null;
  return (
    <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(93, 64, 55, 0.3)', backdropFilter: 'blur(3px)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div className="modal-header border-0 pb-0 pt-4 px-4 bg-white">
            <h5 className="modal-title fw-bold" style={{ color: themeColors.primaryDark }}>{title}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body px-4 pt-3 pb-4 bg-white">
            <p className="text-muted mb-0" style={{fontSize: '1.05rem', lineHeight: '1.6'}}>{message}</p>
          </div>
          <div className="modal-footer border-0 px-4 pb-4 bg-white">
            <button className="btn btn-light rounded-pill px-4 fw-bold text-muted" onClick={onClose}>Cancelar</button>
            <button className="btn btn-danger rounded-pill px-4 fw-bold shadow-sm" style={{backgroundColor: themeColors.danger, border: 'none'}} onClick={onConfirm}>Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- TARJETA DE ESTADÍSTICA ---
const StatCard = ({ title, value, color, icon }) => (
  <div style={{...styles.card, padding: '25px', textAlign: 'center', borderBottom: `4px solid ${color}`, height: '100%'}}>
    <div style={{fontSize: '2rem', marginBottom: '10px'}}>{icon}</div>
    <h6 style={{color: '#9E9E9E', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold'}}>{title}</h6>
    <h3 style={{color: color, fontWeight: '800', margin: 0}}>{value}</h3>
  </div>
);

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
    setConfirmMessage(`¿Ocultar "${producto.nombre}" del menú de clientes?`);
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
    setConfirmMessage(`¿Ocultar el combo "${combo.nombre}"?`);
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
        
        {/* HEADER CON EFECTO DE TEXTO ELEGANTE */}
        <div className="text-center mb-5">
          <h1 style={styles.headerTitle}>🍩 Administración Miss Donitas</h1>
        </div>

        {/* NAVEGACIÓN CENTRADA */}
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
                style={activeTab === tab.id ? {...styles.navLink, ...styles.navLinkActive} : styles.navLink}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL FLOTANTE */}
        <div style={styles.card}>
          
          {loading && <div className="text-center py-5"><div className="spinner-border text-danger" role="status"></div></div>}
          {error && <div className="alert alert-danger rounded-4">{error}</div>}

          {/* === SECCIÓN: PRODUCTOS === */}
          {!loading && !error && activeTab === 'productos' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold m-0" style={{color: themeColors.textMain}}>Inventario de Dulzura</h3>
                <button className="shadow-sm btn" style={styles.btnAdd} onClick={() => handleOpenProductModal()}>
                  + Agregar Producto
                </button>
              </div>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th style={{...styles.tableHeader, borderTopLeftRadius: '15px', paddingLeft: '20px'}}>Nombre</th>
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
                          <div className="fw-bold" style={{fontSize: '1rem', color: themeColors.textMain}}>{p.nombre}</div>
                          <small style={{color: themeColors.textLight}}>{p.categoria}</small>
                        </td>
                        <td style={{color: themeColors.primaryDark, fontWeight: '800'}}>${Number(p.precio).toFixed(2)}</td>
                        <td>
                          {p.stock <= 5 ? <span style={styles.badge('#FFEBEE', '#D32F2F')}>Bajo: {p.stock}</span> : <span style={{color: themeColors.textLight}}>{p.stock} u.</span>}
                        </td>
                        <td>
                          {p.en_oferta ? <span style={styles.badge('#E3F2FD', '#1976D2')}>Oferta -{p.descuento_porcentaje}%</span> : <span style={styles.badge('#F5F5F5', '#9E9E9E')}>Normal</span>}
                        </td>
                        <td className="text-center">
                          <button style={styles.btnAction(themeColors.accent, true)} onClick={() => handleOpenProductModal(p)}>Editar</button>
                          <button style={styles.btnAction(themeColors.danger, true)} onClick={() => handleDeleteProducto(p)}>Ocultar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === SECCIÓN: PEDIDOS === */}
          {!loading && !error && activeTab === 'pedidosEnLinea' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold m-0" style={{color: themeColors.textMain}}>Pedidos Entrantes</h3>
                <span className="badge bg-danger rounded-pill px-3 py-2 shadow-sm">{pedidos.filter(p => p.estado === 'Pendiente').length} Por Atender</span>
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
                        <td className="fw-bold ps-4" style={{color: themeColors.textLight}}>#{p.id}</td>
                        <td>
                          <div className="fw-bold">{p.nombre_cliente}</div>
                          <small className="text-muted">{new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                        </td>
                        <td className="fw-bold" style={{color: themeColors.primary}}>${Number(p.total).toFixed(2)}</td>
                        <td>
                          {p.tipo_orden === 'domicilio' 
                            ? <span style={styles.badge('#E0F7FA', '#0097A7')}>🛵 Domicilio</span> 
                            : <span style={styles.badge('#FFF3E0', '#F57C00')}>🏪 Recoger</span>}
                        </td>
                        <td>
                          <span className={`badge rounded-pill border ${
                            p.estado === 'Pendiente' ? 'bg-warning text-dark' : 
                            p.estado === 'Completado' ? 'bg-success text-white' : 'bg-light text-dark'
                          }`}>{p.estado}</span>
                        </td>
                        <td className="text-center">
                          <button className="btn btn-sm btn-light rounded-pill border me-2 fw-bold" onClick={() => handleShowDetails(p)}>Ver Detalle</button>
                          {p.estado !== 'Completado' && (
                             <button className="btn btn-sm btn-primary rounded-pill border-0 fw-bold shadow-sm" style={{backgroundColor: themeColors.accent}} onClick={() => handleUpdateStatus(p.id, 'En Preparacion')}>Cocinar</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === SECCIÓN: COMBOS === */}
          {!loading && !error && activeTab === 'combos' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold m-0" style={{color: themeColors.textMain}}>Combos & Promociones</h3>
                <button className="shadow-sm btn" style={styles.btnAdd} onClick={() => handleOpenComboModal()}>+ Nuevo Combo</button>
              </div>
              <div className="row g-4">
                {combos.map((combo) => (
                  <div className="col-md-6 col-lg-4" key={combo.id}>
                    <div style={{
                      border: `1px solid ${combo.esta_activo ? '#E0F2F1' : '#FFEBEE'}`, 
                      borderRadius: '20px', 
                      padding: '25px', 
                      backgroundColor: combo.esta_activo ? '#FAFAFA' : '#FFF5F5',
                      opacity: combo.esta_activo ? 1 : 0.8,
                      transition: 'transform 0.2s',
                      cursor: 'default'
                    }}>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h5 className="fw-bold mb-0 text-dark">{combo.nombre}</h5>
                        <span style={combo.esta_activo ? styles.badge('#E8F5E9', '#2E7D32') : styles.badge('#FFEBEE', '#C62828')}>
                          {combo.esta_activo ? 'ACTIVO' : 'OCULTO'}
                        </span>
                      </div>
                      <h4 style={{color: themeColors.primaryDark, fontWeight: '800', fontSize: '1.8rem'}}>${Number(combo.precio).toFixed(2)}</h4>
                      <div className="mt-4 d-flex gap-2">
                        <button style={{...styles.btnAction(themeColors.accent, true), flex:1}} onClick={() => handleOpenComboModal(combo)}>Editar</button>
                        {combo.esta_activo && (
                          <button style={{...styles.btnAction(themeColors.danger, true), flex:1}} onClick={() => handleDeleteCombo(combo)}>Ocultar</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === SECCIÓN: REPORTES === */}
          {!loading && !error && activeTab === 'reporteGeneral' && (
            <div>
              {reportData.length > 0 ? (
                <div>
                   <div className="row mb-5 g-4">
                      <div className="col-md-4"><StatCard title="Ventas Totales" value={`$${reportData.reduce((acc, curr) => acc + Number(curr.total_ventas), 0).toFixed(2)}`} color={themeColors.success} icon="💰" /></div>
                      <div className="col-md-4"><StatCard title="Transacciones" value={reportData.reduce((acc, curr) => acc + Number(curr.cantidad_pedidos), 0)} color={themeColors.accent} icon="🧾" /></div>
                      <div className="col-md-4"><StatCard title="Promedio Venta" value="$150.00" color={themeColors.primary} icon="📈" /></div>
                   </div>
                   <h5 className="mb-4 fw-bold" style={{color: themeColors.textMain}}>Gráfica de Rendimiento</h5>
                   <SalesReportChart reportData={reportData} /> 
                </div>
              ) : <p className="text-center py-5 text-muted">Aún no hay suficientes ventas para generar gráficas.</p>}
              
              <div className="mt-5 p-4 rounded-4" style={{backgroundColor: '#FFEBEE', border: '1px dashed #EF5350'}}>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h5 className="text-danger fw-bold m-0">Zona de Mantenimiento</h5>
                    <p className="small text-muted m-0">Acciones irreversibles para la base de datos.</p>
                  </div>
                  <button className="btn btn-outline-danger rounded-pill btn-sm fw-bold" onClick={() => setShowPurgeModal(true)}>Purgar Historial</button>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'reporteProductos' && <ProductSalesReport />}

        </div>
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
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 overflow-hidden shadow-lg">
              <div className="modal-header bg-danger text-white border-0"><h5 className="modal-title fw-bold">⚠️ Zona de Peligro</h5><button type="button" className="btn-close btn-close-white" onClick={() => setShowPurgeModal(false)}></button></div>
              <div className="modal-body bg-white p-4">
                <p className="mb-2">Estás a punto de borrar <strong>TODO el historial de pedidos</strong>. Esto no se puede deshacer.</p>
                <p className="small text-muted mb-3">Escribe <strong>ELIMINAR</strong> para confirmar:</p>
                <input type="text" className="form-control" value={purgeConfirmText} onChange={(e) => setPurgeConfirmText(e.target.value)} />
              </div>
              <div className="modal-footer bg-white border-0">
                <button type="button" className="btn btn-secondary rounded-pill" onClick={() => setShowPurgeModal(false)}>Cancelar</button>
                <button type="button" className="btn btn-danger rounded-pill shadow-sm" onClick={handlePurgePedidos} disabled={purgeConfirmText !== 'ELIMINAR'}>Borrar Todo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;