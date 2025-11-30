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

// --- GESTIÓN DE COLORES (DUAL THEME) ---
const getThemeColors = (mode) => {
  const isDark = mode === 'dark';
  
  return {
    // Fondos
    bg: isDark ? '#1a1212' : '#FFFDF5',          // Chocolate oscuro vs Crema Vainilla
    cardBg: isDark ? '#2b1f1f' : '#FFFFFF',      // Café oscuro vs Blanco
    
    // Textos
    textMain: isDark ? '#fff1e6' : '#5D4037',    // Crema casi blanco vs Café fuerte
    textLight: isDark ? '#d7ccc8' : '#8D6E63',   // Café claro vs Café leche
    
    // Botones y Acentos
    primary: isDark ? '#ff1744' : '#FF80AB',     // Rojo Neón vs Rosa Fresa
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #d50000 0%, #ff1744 100%)' // Fuego
      : 'linear-gradient(135deg, #FF80AB 0%, #F50057 100%)', // Dulce
      
    // Estados y Acciones
    accent: isDark ? '#00e5ff' : '#26C6DA',      // Cian Brillante vs Turquesa
    danger: isDark ? '#ff5252' : '#EF5350',      // Rojo Alerta
    success: isDark ? '#00e676' : '#66BB6A',     // Verde Neón vs Verde Suave
    
    // Detalles UI
    border: isDark ? '#4e342e' : '#FFF3E0',
    shadow: isDark 
      ? '0 10px 30px rgba(0,0,0,0.5)'            // Sombra fuerte nocturna
      : '0 10px 30px rgba(255, 128, 171, 0.15)', // Sombra suave rosada
      
    // Tablas
    tableHeaderBg: isDark ? '#3e2723' : '#FFF0F5',
    tableHeaderText: isDark ? '#ffccbc' : '#880E4F',
    badgeText: isDark ? '#ffffff' : '#5D4037'
  };
};

// --- COMPONENTE TARJETA DE ESTADÍSTICA ---
const StatCard = ({ title, value, color, icon, styles }) => (
  <div style={{...styles.card, textAlign: 'center', borderBottom: `4px solid ${color}`, height: '100%'}}>
    <div style={{fontSize: '2.5rem', marginBottom: '10px'}}>{icon}</div>
    <h6 style={{...styles.textLight, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold'}}>{title}</h6>
    <h3 style={{color: color, fontWeight: '800', margin: 0, fontSize: '2rem'}}>{value}</h3>
  </div>
);

// --- MODAL DE CONFIRMACIÓN ---
const ConfirmationModal = ({ show, onClose, onConfirm, title, message, themeColors }) => {
  if (!show) return null;
  return (
    <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ borderRadius: '24px', border: 'none', backgroundColor: themeColors.cardBg, boxShadow: themeColors.shadow }}>
          <div className="modal-header border-0 pb-0 pt-4 px-4">
            <h5 className="modal-title fw-bold" style={{ color: themeColors.textMain }}>{title}</h5>
            <button type="button" className="btn-close" style={{filter: themeColors.bg === '#1a1212' ? 'invert(1)' : 'none'}} onClick={onClose}></button>
          </div>
          <div className="modal-body px-4 pt-3 pb-4">
            <p style={{color: themeColors.textLight, fontSize: '1.05rem'}}>{message}</p>
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-light rounded-pill px-4 fw-bold" onClick={onClose}>Cancelar</button>
            <button className="btn rounded-pill px-4 fw-bold shadow-sm text-white" style={{backgroundColor: themeColors.danger, border: 'none'}} onClick={onConfirm}>Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

function AdminPage() {
  const { theme } = useTheme(); 
  const colors = getThemeColors(theme); // Obtenemos la paleta actual

  // --- ESTILOS DINÁMICOS ---
  const styles = {
    container: {
      backgroundColor: colors.bg,
      minHeight: '100vh',
      fontFamily: '"Nunito", "Segoe UI", sans-serif',
      padding: '40px 20px',
      color: colors.textMain,
      transition: 'all 0.3s ease'
    },
    headerTitle: {
      background: colors.primaryGradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontWeight: '900',
      fontSize: '2.8rem',
      marginBottom: '10px',
      letterSpacing: '-1px'
    },
    navPillsContainer: {
      backgroundColor: colors.cardBg,
      borderRadius: '50px',
      padding: '8px',
      display: 'inline-flex',
      boxShadow: colors.shadow,
      marginBottom: '35px',
      border: `1px solid ${colors.border}`
    },
    navLink: {
      color: colors.textLight,
      borderRadius: '30px',
      padding: '10px 25px',
      fontWeight: '700',
      border: 'none',
      background: 'transparent',
      transition: 'all 0.3s ease',
    },
    navLinkActive: {
      background: colors.primaryGradient,
      color: 'white',
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    },
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: '24px',
      border: `1px solid ${colors.border}`,
      boxShadow: colors.shadow,
      padding: '35px',
      color: colors.textMain
    },
    tableHeader: {
      backgroundColor: colors.tableHeaderBg,
      color: colors.tableHeaderText,
      fontWeight: '700',
      borderBottom: 'none',
      textTransform: 'uppercase',
      fontSize: '0.85rem',
      letterSpacing: '1px'
    },
    tableRow: {
      borderBottom: `1px solid ${colors.border}`,
      color: colors.textMain,
    },
    btnAdd: {
      background: colors.primaryGradient,
      border: 'none',
      borderRadius: '50px',
      color: 'white',
      padding: '12px 25px',
      fontWeight: '700',
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
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
    badge: (bgColor, textColor, borderColor) => ({
      backgroundColor: bgColor,
      color: textColor,
      border: `1px solid ${borderColor || 'transparent'}`,
      padding: '6px 14px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: '800',
      letterSpacing: '0.5px',
      textTransform: 'uppercase'
    })
  };

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
        
        {/* HEADER */}
        <div className="text-center mb-5">
          <h1 style={styles.headerTitle}>🍩 Administración Miss Donitas</h1>
        </div>

        {/* NAVEGACIÓN */}
        <div className="d-flex justify-content-center">
          <div style={styles.navPillsContainer}>
            {[
              { id: 'pedidosEnLinea', label: '🛎️ Pedidos' },
              { id: 'productos', label: '🍩 Productos' },
              { id: 'combos', label: '🎁 Combos' },
              { id: 'reporteGeneral', label: '📊 Reportes' },
              { id: 'reporteProductos', label: '📈 Métricas' }
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

        {/* CONTENEDOR PRINCIPAL */}
        <div style={styles.card}>
          
          {loading && <div className="text-center py-5"><div className="spinner-border" style={{color: colors.primary}} role="status"></div></div>}
          {error && <div className="alert alert-danger rounded-4">{error}</div>}

          {/* === SECCIÓN: PRODUCTOS === */}
          {!loading && !error && activeTab === 'productos' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold m-0" style={{color: colors.textMain}}>Inventario de Dulzura</h3>
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
                          <div className="fw-bold" style={{fontSize: '1rem', color: colors.textMain}}>{p.nombre}</div>
                          <small style={{color: colors.textLight}}>{p.categoria}</small>
                        </td>
                        <td style={{color: colors.primary, fontWeight: '800'}}>${Number(p.precio).toFixed(2)}</td>
                        <td>
                          {p.stock <= 5 
                            ? <span style={styles.badge(theme === 'dark' ? '#3E2723' : '#FFEBEE', theme === 'dark' ? '#FF5252' : '#D32F2F', theme === 'dark' ? '#FF5252' : 'transparent')}>Bajo: {p.stock}</span> 
                            : <span style={{color: colors.textLight, fontWeight:'bold'}}>{p.stock} u.</span>}
                        </td>
                        <td>
                          {p.en_oferta 
                            ? <span style={styles.badge(theme === 'dark' ? '#0D47A1' : '#E3F2FD', theme === 'dark' ? '#80D8FF' : '#1976D2', theme === 'dark' ? '#448AFF' : 'transparent')}>Oferta -{p.descuento_porcentaje}%</span> 
                            : <span style={styles.badge(theme === 'dark' ? '#212121' : '#F5F5F5', theme === 'dark' ? '#9E9E9E' : '#757575', theme === 'dark' ? '#424242' : 'transparent')}>Normal</span>}
                        </td>
                        <td className="text-center">
                          <button style={styles.btnAction(colors.accent, true)} onClick={() => handleOpenProductModal(p)}>Editar</button>
                          <button style={styles.btnAction(colors.danger, true)} onClick={() => handleDeleteProducto(p)}>Ocultar</button>
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
                <h3 className="fw-bold m-0" style={{color: colors.textMain}}>Pedidos Entrantes</h3>
                <span className="badge rounded-pill px-3 py-2 shadow-sm" style={{backgroundColor: colors.danger, color: 'white'}}>
                  {pedidos.filter(p => p.estado === 'Pendiente').length} Por Atender
                </span>
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
                        <td className="fw-bold ps-4" style={{color: colors.textLight}}>#{p.id}</td>
                        <td>
                          <div className="fw-bold" style={{color: colors.textMain}}>{p.nombre_cliente}</div>
                          <small style={{color: colors.textLight}}>{new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                        </td>
                        <td className="fw-bold" style={{color: colors.primary}}>${Number(p.total).toFixed(2)}</td>
                        <td>
                          {p.tipo_orden === 'domicilio' 
                            ? <span style={styles.badge(theme === 'dark' ? '#006064' : '#E0F7FA', theme === 'dark' ? '#84FFFF' : '#0097A7', theme === 'dark' ? '#00BCD4' : 'transparent')}>🛵 Domicilio</span> 
                            : <span style={styles.badge(theme === 'dark' ? '#E65100' : '#FFF3E0', theme === 'dark' ? '#FFCC80' : '#F57C00', theme === 'dark' ? '#FF9800' : 'transparent')}>🏪 Recoger</span>}
                        </td>
                        <td>
                            {/* Lógica de colores para estados */}
                           {(() => {
                               let bg = colors.border;
                               let text = colors.textLight;
                               if(p.estado === 'Pendiente') { bg = '#FFAB00'; text = '#212121'; }
                               else if(p.estado === 'Completado') { bg = colors.success; text = theme === 'dark' ? '#000' : '#FFF'; }
                               else { bg = colors.accent; text = theme === 'dark' ? '#000' : '#FFF'; }
                               return <span className="badge rounded-pill" style={{backgroundColor: bg, color: text, padding: '6px 12px'}}>{p.estado}</span>;
                           })()}
                        </td>
                        <td className="text-center">
                          <button className="btn btn-sm btn-light rounded-pill border me-2 fw-bold" onClick={() => handleShowDetails(p)}>Ver Detalle</button>
                          {p.estado !== 'Completado' && (
                             <button className="btn btn-sm rounded-pill border-0 fw-bold shadow-sm text-white" style={{background: colors.primaryGradient}} onClick={() => handleUpdateStatus(p.id, 'En Preparacion')}>Cocinar</button>
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
                <h3 className="fw-bold m-0" style={{color: colors.textMain}}>Combos & Promociones</h3>
                <button className="shadow-sm btn" style={styles.btnAdd} onClick={() => handleOpenComboModal()}>+ Nuevo Combo</button>
              </div>
              <div className="row g-4">
                {combos.map((combo) => (
                  <div className="col-md-6 col-lg-4" key={combo.id}>
                    <div style={{
                      border: `1px solid ${combo.esta_activo ? colors.success : colors.danger}`, 
                      borderRadius: '20px', 
                      padding: '25px', 
                      backgroundColor: colors.cardBg,
                      opacity: combo.esta_activo ? 1 : 0.75,
                      transition: 'all 0.2s',
                      boxShadow: colors.shadow
                    }}>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h5 className="fw-bold mb-0" style={{color: colors.textMain}}>{combo.nombre}</h5>
                        <span style={combo.esta_activo 
                            ? styles.badge(theme === 'dark' ? '#1B5E20' : '#E8F5E9', theme === 'dark' ? '#69F0AE' : '#2E7D32', theme === 'dark' ? '#00E676' : 'transparent') 
                            : styles.badge(theme === 'dark' ? '#3E2723' : '#FFEBEE', theme === 'dark' ? '#EF9A9A' : '#C62828', theme === 'dark' ? '#D50000' : 'transparent')}>
                          {combo.esta_activo ? 'ACTIVO' : 'OCULTO'}
                        </span>
                      </div>
                      <h4 style={{color: colors.primary, fontWeight: '800', fontSize: '1.8rem'}}>${Number(combo.precio).toFixed(2)}</h4>
                      <div className="mt-4 d-flex gap-2">
                        <button style={{...styles.btnAction(colors.accent, true), flex:1}} onClick={() => handleOpenComboModal(combo)}>Editar</button>
                        {combo.esta_activo && (
                          <button style={{...styles.btnAction(colors.danger, true), flex:1}} onClick={() => handleDeleteCombo(combo)}>Ocultar</button>
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
                      <div className="col-md-4"><StatCard title="Ventas Totales" value={`$${reportData.reduce((acc, curr) => acc + Number(curr.total_ventas), 0).toFixed(2)}`} color={colors.success} icon="💰" styles={styles} /></div>
                      <div className="col-md-4"><StatCard title="Transacciones" value={reportData.reduce((acc, curr) => acc + Number(curr.cantidad_pedidos), 0)} color={colors.accent} icon="🧾" styles={styles} /></div>
                      <div className="col-md-4"><StatCard title="Promedio Venta" value="$150.00" color={colors.primary} icon="📈" styles={styles} /></div>
                   </div>
                   <h5 className="mb-4 fw-bold" style={{color: colors.textMain}}>Gráfica de Rendimiento</h5>
                   <div style={{padding: '20px', backgroundColor: theme === 'dark' ? '#2b1f1f' : '#FAFAFA', borderRadius: '20px', border: `1px solid ${colors.border}`}}>
                        <SalesReportChart reportData={reportData} theme={theme} /> 
                   </div>
                </div>
              ) : <p className="text-center py-5 text-muted">Aún no hay suficientes ventas para generar gráficas.</p>}
              
              <div className="mt-5 p-4 rounded-4" style={{backgroundColor: theme === 'dark' ? '#3E2723' : '#FFEBEE', border: `1px dashed ${colors.danger}`}}>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h5 className="fw-bold m-0" style={{color: colors.danger}}>Zona de Mantenimiento</h5>
                    <p className="small m-0" style={{color: colors.textLight}}>Acciones irreversibles para la base de datos.</p>
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
        themeColors={colors}
      />

      {showPurgeModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 overflow-hidden shadow-lg">
              <div className="modal-header text-white border-0" style={{backgroundColor: colors.danger}}><h5 className="modal-title fw-bold">⚠️ Zona de Peligro</h5><button type="button" className="btn-close btn-close-white" onClick={() => setShowPurgeModal(false)}></button></div>
              <div className="modal-body p-4" style={{backgroundColor: colors.cardBg, color: colors.textMain}}>
                <p className="mb-2">Estás a punto de borrar <strong>TODO el historial de pedidos</strong>. Esto no se puede deshacer.</p>
                <p className="small text-muted mb-3">Escribe <strong>ELIMINAR</strong> para confirmar:</p>
                <input type="text" className="form-control" value={purgeConfirmText} onChange={(e) => setPurgeConfirmText(e.target.value)} />
              </div>
              <div className="modal-footer border-0" style={{backgroundColor: colors.cardBg}}>
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