import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
// Asegúrate de tener estas importaciones correctas según tu estructura de carpetas
import ProductModal from '../components/ProductModal';
import ComboModal from '../components/ComboModal';
import SalesReportChart from '../components/SalesReportChart';
import ProductSalesReport from '../components/ProductSalesReport';
import DetallesPedidoModal from '../components/DetallesPedidoModal';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/productService';
import apiClient from '../services/api';
import { useTheme } from '../context/ThemeContext';

// --- PALETA DE COLORES "MISS DONITAS SWEET UI" ---
const themeColors = {
  bg: '#FFF8F0',           // Crema muy suave (Fondo general)
  surface: '#FFFFFF',      // Blanco puro (Tarjetas)
  primary: '#FF80AB',      // Rosa Donita (Botones principales)
  primaryHover: '#F06292', // Rosa más oscuro al pasar mouse
  textMain: '#4E342E',     // Café Chocolate Oscuro (Títulos)
  textSoft: '#795548',     // Café con leche (Subtítulos)
  accent: '#26C6DA',       // Turquesa (Detalles/Editar)
  danger: '#FF5252',       // Rojo coral suave (Eliminar)
  success: '#9CCC65',      // Verde pistacho (Éxito)
  border: '#FFE0B2',       // Borde naranja muy pálido
  shadow: '0 8px 32px rgba(255, 100, 150, 0.15)', // Sombra rosada difusa
};

const styles = {
  container: {
    backgroundColor: themeColors.bg,
    minHeight: '100vh',
    width: '100%',
    fontFamily: '"Nunito", "Poppins", sans-serif', // Fuente sugerida redondeada
    padding: '40px 20px',
    color: themeColors.textMain,
    position: 'absolute', // Forzar cobertura total
    top: 0,
    left: 0,
    overflowX: 'hidden'
  },
  headerContainer: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  headerTitle: {
    color: themeColors.textMain,
    fontWeight: '900',
    fontSize: '3rem',
    marginBottom: '5px',
    letterSpacing: '-1px',
    textShadow: '2px 2px 0px #FFECB3'
  },
  headerSubtitle: {
    color: themeColors.textSoft,
    fontSize: '1.1rem',
    fontWeight: '600'
  },
  // Navegación estilo "Cápsula Flotante"
  navContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '30px'
  },
  navPills: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '50px',
    padding: '8px',
    display: 'inline-flex',
    boxShadow: '0 10px 25px rgba(78, 52, 46, 0.05)',
    border: `1px solid ${themeColors.border}`
  },
  navLink: {
    color: themeColors.textSoft,
    borderRadius: '40px',
    padding: '12px 30px',
    fontWeight: '700',
    border: 'none',
    background: 'transparent',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    fontSize: '0.95rem'
  },
  navLinkActive: {
    backgroundColor: themeColors.primary,
    color: 'white',
    transform: 'scale(1.05)',
    boxShadow: '0 4px 15px rgba(255, 128, 171, 0.4)',
  },
  // Tarjeta Principal (Donde va el contenido)
  mainCard: {
    backgroundColor: themeColors.surface,
    borderRadius: '30px',
    border: `1px solid #FFF0F5`,
    boxShadow: themeColors.shadow,
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  // Estilos de Tabla Mejorados
  tableContainer: {
    borderRadius: '20px',
    overflow: 'hidden',
    border: `1px solid ${themeColors.border}`
  },
  tableHeader: {
    backgroundColor: '#FFF3E0', // Naranja crema muy suave
    color: themeColors.textMain,
    fontWeight: '800',
    textTransform: 'uppercase',
    fontSize: '0.8rem',
    letterSpacing: '1px',
    borderBottom: 'none',
    padding: '18px'
  },
  tableCell: {
    padding: '20px',
    verticalAlign: 'middle',
    color: themeColors.textSoft,
    fontWeight: '600',
    borderBottom: `1px solid #FFF8E1`
  },
  // Botones
  btnAdd: {
    background: `linear-gradient(135deg, ${themeColors.primary}, #FF4081)`,
    border: 'none',
    borderRadius: '15px',
    color: 'white',
    padding: '12px 25px',
    fontWeight: '700',
    boxShadow: '0 8px 20px rgba(255, 64, 129, 0.25)',
    transition: 'transform 0.2s',
    cursor: 'pointer'
  },
  btnAction: (color) => ({
    backgroundColor: `${color}15`, // Color con 15% de opacidad para el fondo
    color: color,
    border: 'none',
    borderRadius: '10px',
    padding: '8px 12px',
    fontWeight: '700',
    fontSize: '0.85rem',
    marginRight: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }),
  badge: (bg, text) => ({
    backgroundColor: bg,
    color: text,
    padding: '6px 12px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  })
};

// --- COMPONENTES UI REUTILIZABLES ---

const StatCard = ({ title, value, icon, color }) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '25px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    border: `1px solid ${color}30`,
    borderBottom: `5px solid ${color}`,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <div style={{ fontSize: '2.5rem', marginBottom: '10px', lineHeight: 1 }}>{icon}</div>
    <div style={{ color: '#90A4AE', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</div>
    <div style={{ color: themeColors.textMain, fontWeight: '900', fontSize: '1.8rem', marginTop: '5px' }}>{value}</div>
  </div>
);

// --- MODAL PERSONALIZADO SIMPLE ---
const ConfirmationModal = ({ show, onClose, onConfirm, title, message }) => {
  if (!show) return null;
  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(78, 52, 46, 0.4)', backdropFilter: 'blur(5px)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0" style={{ borderRadius: '25px', padding: '10px' }}>
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold" style={{ color: themeColors.textMain }}>{title}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p className="text-muted fw-bold mb-0">{message}</p>
          </div>
          <div className="modal-footer border-0 pt-0">
            <button className="btn btn-light rounded-pill fw-bold text-muted" onClick={onClose}>Cancelar</button>
            <button className="btn rounded-pill fw-bold text-white shadow-sm" style={{ backgroundColor: themeColors.danger }} onClick={onConfirm}>Confirmar Acción</button>
          </div>
        </div>
      </div>
    </div>
  );
};

function AdminPage() {
  const { theme } = useTheme(); // Aunque no lo usemos visualmente, lo mantenemos por si la lógica lo requiere

  const [activeTab, setActiveTab] = useState('pedidosEnLinea');
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Modales y Estados
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
  
  // --- HANDLERS (Iguales a tu lógica original) ---
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
      toast.success(`🍩 Producto ${action} con éxito!`); fetchData(); handleCloseProductModal();
    } catch (err) { toast.error(`Error al guardar.`); }
  };

  const handleDeleteProducto = (producto) => {
    setConfirmTitle('Ocultar Dulzura');
    setConfirmMessage(`¿Estás seguro de ocultar "${producto.nombre}" del menú?`);
    setConfirmAction(() => async () => {
      try { await deleteProduct(producto.id); toast.success(`"${producto.nombre}" ahora está oculto.`); fetchData(); } 
      catch (err) { toast.error('Error al desactivar.'); }
      setShowConfirmModal(false); 
    });
    setShowConfirmModal(true);
  };

  const handleOpenComboModal = (combo = null) => { setComboActual(combo); setShowComboModal(true); };
  const handleCloseComboModal = () => { setShowComboModal(false); setComboActual(null); };
  const handleSaveCombo = async (combo) => {
    try { if (combo.id) { await apiClient.put(`/combos/${combo.id}`, combo); } else { await apiClient.post('/combos', combo); }
      toast.success(`🎁 Combo guardado.`); fetchData(); handleCloseComboModal();
    } catch (err) { toast.error(`Error al guardar.`); }
  };
  const handleDeleteCombo = (combo) => {
    setConfirmTitle('Ocultar Combo');
    setConfirmMessage(`¿Ocultar "${combo.nombre}"?`);
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
      
      {/* HEADER */}
      <div style={styles.headerContainer}>
        <h1 style={styles.headerTitle}>Miss Donitas <span style={{fontSize:'1.5rem', verticalAlign:'middle'}}>🍩</span></h1>
        <p style={styles.headerSubtitle}>Panel de Control & Administración</p>
      </div>

      {/* NAVEGACIÓN TIPO PÍLDORA */}
      <div style={styles.navContainer}>
        <div style={styles.navPills}>
          {[
            { id: 'pedidosEnLinea', label: '🛎️ Pedidos', count: pedidos.filter(p=>p.estado === 'Pendiente').length },
            { id: 'productos', label: '🍩 Menú' },
            { id: 'combos', label: '🎁 Combos' },
            { id: 'reporteGeneral', label: '📊 Ventas' },
            { id: 'reporteProductos', label: '📈 Top Productos' }
          ].map(tab => (
            <button 
              key={tab.id}
              style={activeTab === tab.id ? {...styles.navLink, ...styles.navLinkActive} : styles.navLink}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.count > 0 && <span className="badge bg-white text-danger ms-2 rounded-pill">{tab.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* TARJETA PRINCIPAL DE CONTENIDO */}
      <div style={styles.mainCard}>
        
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-pink" style={{color: themeColors.primary, width: '3rem', height: '3rem'}} role="status"></div>
            <p className="mt-3 text-muted fw-bold">Horneando datos...</p>
          </div>
        )}
        
        {error && <div className="alert alert-danger rounded-4 shadow-sm border-0">{error}</div>}

        {/* === SECCIÓN: PRODUCTOS === */}
        {!loading && !error && activeTab === 'productos' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4 ps-2 pe-2">
              <div>
                <h3 className="fw-bold m-0" style={{color: themeColors.textMain}}>Inventario</h3>
                <small className="text-muted">Gestiona tus sabores</small>
              </div>
              <button style={styles.btnAdd} onClick={() => handleOpenProductModal()}>
                + Crear Nuevo
              </button>
            </div>
            
            <div style={styles.tableContainer}>
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>Producto</th>
                      <th style={styles.tableHeader}>Precio</th>
                      <th style={styles.tableHeader}>Stock</th>
                      <th style={styles.tableHeader}>Estado</th>
                      <th style={{...styles.tableHeader, textAlign: 'right'}}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((p) => (
                      <tr key={p.id} style={{backgroundColor: 'white'}}>
                        <td style={styles.tableCell}>
                          <div className="d-flex align-items-center">
                            <div style={{width:'40px', height:'40px', borderRadius:'10px', backgroundColor:'#FFEBEE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', marginRight:'15px'}}>🍩</div>
                            <div>
                              <div style={{color: themeColors.textMain, fontWeight:'bold'}}>{p.nombre}</div>
                              <small className="text-muted">{p.categoria}</small>
                            </div>
                          </div>
                        </td>
                        <td style={styles.tableCell}>
                          <span style={{color: themeColors.primary, fontWeight:'800', fontSize:'1.1rem'}}>${Number(p.precio).toFixed(2)}</span>
                        </td>
                        <td style={styles.tableCell}>
                          {p.stock <= 5 
                            ? <span style={styles.badge('#FFEBEE', '#D32F2F')}>⚠️ Bajo: {p.stock}</span> 
                            : <span style={{fontWeight:'700', color: themeColors.success}}>{p.stock} u.</span>}
                        </td>
                        <td style={styles.tableCell}>
                          {p.en_oferta 
                            ? <span style={styles.badge('#E3F2FD', '#1976D2')}>🔥 Oferta -{p.descuento_porcentaje}%</span> 
                            : <span style={styles.badge('#F5F5F5', '#9E9E9E')}>Normal</span>}
                        </td>
                        <td style={{...styles.tableCell, textAlign: 'right'}}>
                          <button style={styles.btnAction(themeColors.accent)} onClick={() => handleOpenProductModal(p)}>Editar</button>
                          <button style={styles.btnAction(themeColors.danger)} onClick={() => handleDeleteProducto(p)}>Borrar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* === SECCIÓN: PEDIDOS === */}
        {!loading && !error && activeTab === 'pedidosEnLinea' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4 ps-2 pe-2">
              <div>
                <h3 className="fw-bold m-0" style={{color: themeColors.textMain}}>Pedidos Entrantes</h3>
                <small className="text-muted">Ordena por llegada</small>
              </div>
            </div>
            <div style={styles.tableContainer}>
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}># Orden</th>
                      <th style={styles.tableHeader}>Cliente</th>
                      <th style={styles.tableHeader}>Total</th>
                      <th style={styles.tableHeader}>Tipo</th>
                      <th style={styles.tableHeader}>Estado</th>
                      <th style={{...styles.tableHeader, textAlign: 'right'}}>Gestión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.map((p) => (
                      <tr key={p.id} style={{backgroundColor: p.estado === 'Pendiente' ? '#FFFDE7' : 'white'}}>
                        <td style={styles.tableCell}>#{p.id}</td>
                        <td style={styles.tableCell}>
                          <div style={{fontWeight:'bold', color: themeColors.textMain}}>{p.nombre_cliente}</div>
                          <small>{new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                        </td>
                        <td style={styles.tableCell}>
                          <span style={{backgroundColor:'#E0F2F1', color:'#00695C', padding:'4px 8px', borderRadius:'8px', fontWeight:'800'}}>${Number(p.total).toFixed(2)}</span>
                        </td>
                        <td style={styles.tableCell}>
                          {p.tipo_orden === 'domicilio' 
                            ? <span style={styles.badge('#E1F5FE', '#0277BD')}>🛵 Domicilio</span> 
                            : <span style={styles.badge('#FFF3E0', '#EF6C00')}>🏪 Recoger</span>}
                        </td>
                        <td style={styles.tableCell}>
                          <span className={`badge rounded-pill ${
                            p.estado === 'Pendiente' ? 'bg-warning text-dark' : 
                            p.estado === 'Completado' ? 'bg-success' : 'bg-secondary'
                          }`} style={{padding:'8px 12px'}}>
                            {p.estado}
                          </span>
                        </td>
                        <td style={{...styles.tableCell, textAlign: 'right'}}>
                          <button className="btn btn-sm btn-light rounded-pill border fw-bold me-2" onClick={() => handleShowDetails(p)}>Ver</button>
                          {p.estado !== 'Completado' && (
                             <button className="btn btn-sm rounded-pill border-0 fw-bold text-white shadow-sm" style={{backgroundColor: themeColors.accent}} onClick={() => handleUpdateStatus(p.id, 'En Preparacion')}>Cocinar</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* === SECCIÓN: COMBOS === */}
        {!loading && !error && activeTab === 'combos' && (
          <div>
             <div className="d-flex justify-content-between align-items-center mb-4 ps-2 pe-2">
              <h3 className="fw-bold m-0" style={{color: themeColors.textMain}}>Promociones</h3>
              <button style={styles.btnAdd} onClick={() => handleOpenComboModal()}>+ Nuevo Combo</button>
            </div>
            <div className="row g-4">
              {combos.map((combo) => (
                <div className="col-md-6 col-lg-4" key={combo.id}>
                  <div style={{
                    border: `1px solid ${combo.esta_activo ? themeColors.border : '#FFEBEE'}`, 
                    borderRadius: '25px', 
                    padding: '30px', 
                    backgroundColor: combo.esta_activo ? 'white' : '#FFEBEE',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                    opacity: combo.esta_activo ? 1 : 0.7
                  }}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="fw-bold mb-0 text-dark">{combo.nombre}</h5>
                      <span style={combo.esta_activo ? styles.badge('#E8F5E9', '#2E7D32') : styles.badge('#FFCDD2', '#C62828')}>
                        {combo.esta_activo ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <div style={{color: themeColors.textSoft, fontSize:'0.9rem', marginBottom:'15px'}}>{combo.descripcion || 'Sin descripción'}</div>
                    <h4 style={{color: themeColors.primary, fontWeight: '800', fontSize: '2rem'}}>${Number(combo.precio).toFixed(2)}</h4>
                    
                    <div className="mt-4 d-flex">
                      <button style={{...styles.btnAction(themeColors.accent), width:'100%', textAlign:'center'}} onClick={() => handleOpenComboModal(combo)}>Editar</button>
                      {combo.esta_activo && (
                        <button style={{...styles.btnAction(themeColors.danger), width:'100%', textAlign:'center'}} onClick={() => handleDeleteCombo(combo)}>Ocultar</button>
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
                    <div className="col-md-4"><StatCard title="Promedio Ticket" value="$150.00" color={themeColors.primary} icon="📈" /></div>
                  </div>
                  <h5 className="mb-4 fw-bold ps-2" style={{color: themeColors.textMain}}>Rendimiento de Ventas</h5>
                  <div className="p-3 bg-white rounded-4 border">
                    <SalesReportChart reportData={reportData} /> 
                  </div>
              </div>
            ) : <p className="text-center py-5 text-muted">No hay datos aún.</p>}
            
            <div className="mt-5 p-4 rounded-4" style={{backgroundColor: '#FFEBEE', border: '1px dashed #EF5350'}}>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-danger fw-bold m-0">Zona de Peligro</h6>
                  <p className="small text-muted m-0">Acciones destructivas.</p>
                </div>
                <button className="btn btn-outline-danger rounded-pill btn-sm fw-bold" onClick={() => setShowPurgeModal(true)}>Purgar Datos</button>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'reporteProductos' && <ProductSalesReport />}
      </div>

      {/* MODALES */}
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

      {/* Modal Purga Manual (Estilo Peligro) */}
      {showPurgeModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header bg-danger text-white border-0"><h5 className="modal-title fw-bold">⚠️ BORRADO DEFINITIVO</h5><button type="button" className="btn-close btn-close-white" onClick={() => setShowPurgeModal(false)}></button></div>
              <div className="modal-body bg-white p-4">
                <p>Escribe <strong>ELIMINAR</strong> para confirmar el borrado de todo el historial.</p>
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