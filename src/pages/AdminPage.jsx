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

// --- PALETA DE COLORES CORREGIDA (SOLUCIÓN DE CONTRASTE) ---
const getThemeColors = (mode) => {
  const isDark = mode === 'dark';
  
  return {
    // FONDOS
    bg: isDark ? '#121212' : '#F8F9FA',           // Fondo principal (Negro suave material)
    cardBg: isDark ? '#1E1E1E' : '#FFFFFF',       // Tarjetas (Gris muy oscuro para elevar)
    elementBg: isDark ? '#2C2C2C' : '#F1F3F5',    // Inputs y elementos secundarios
    
    // TEXTOS - Contrastes máximos
    textMain: isDark ? '#FFFFFF' : '#212529',     // Blanco Puro vs Negro Intenso
    textSecondary: isDark ? '#E0E0E0' : '#495057', // Texto secundario muy claro en dark
    textLight: isDark ? '#B0B0B0' : '#6C757D',    // Texto terciario
    
    // BORDES
    borderColor: isDark ? '#404040' : '#DEE2E6',

    // ACENTOS
    primary: '#FF4081',
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #EC407A 0%, #D81B60 100%)' // Más brillante en dark para resaltar
      : 'linear-gradient(135deg, #FF80AB 0%, #F50057 100%)',
      
    // TABLAS
    tableHeaderBg: isDark ? '#2D2D2D' : '#E9ECEF',
    tableHeaderText: isDark ? '#FF80AB' : '#495057',

    // ESTADOS
    accent: isDark ? '#40C4FF' : '#00BCD4',      
    danger: isDark ? '#FF5252' : '#DC3545',      
    success: isDark ? '#69F0AE' : '#28A745',     
    
    // BOTONES
    btnPrepare: '#FFC107', 
    btnWay: '#FF4081', 
    btnReady: isDark ? '#E0E0E0' : '#ADB5BD', 
    btnDone: '#28A745',    
    btnView: '#17A2B8',    
  };
};

// --- COMPONENTE TARJETA ESTADÍSTICA (Asegurando herencia de color) ---
const StatCard = ({ title, value, color, icon, styles, colors }) => (
  <div style={{
      ...styles.card, 
      backgroundColor: colors.cardBg, 
      color: colors.textMain, 
      textAlign: 'center', 
      borderBottom: `4px solid ${color}`, 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center'
  }}>
    <div style={{fontSize: '2.5rem', marginBottom: '10px'}}>{icon}</div>
    <h6 style={{color: colors.textLight, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold'}}>{title}</h6>
    {/* Forzamos el color del valor para que se vea siempre */}
    <h3 style={{color: color, fontWeight: '800', margin: 0, fontSize: '2rem'}}>{value}</h3>
  </div>
);

const ConfirmationModal = ({ show, onClose, onConfirm, title, message, themeColors }) => {
  if (!show) return null;
  return (
    <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ borderRadius: '24px', border: `1px solid ${themeColors.borderColor}`, backgroundColor: themeColors.cardBg, color: themeColors.textMain, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
          <div className="modal-header border-0 pb-0 pt-4 px-4">
            <h5 className="modal-title fw-bold" style={{ color: themeColors.textMain }}>{title}</h5>
            <button type="button" className="btn-close" style={{filter: themeColors.bg === '#121212' ? 'invert(1)' : 'none'}} onClick={onClose}></button>
          </div>
          <div className="modal-body px-4 pt-3 pb-4">
            <p style={{color: themeColors.textSecondary, fontSize: '1.05rem'}}>{message}</p>
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
  const colors = getThemeColors(theme);

  // --- ESTILOS DEFINITIVOS ---
  const styles = {
    container: {
      backgroundColor: colors.bg,
      minHeight: '100vh',
      fontFamily: '"Nunito", "Segoe UI", sans-serif',
      padding: '40px 20px',
      color: colors.textMain,
      transition: 'background-color 0.3s ease, color 0.3s ease'
    },
    headerTitle: {
      background: colors.primaryGradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontWeight: '900',
      fontSize: 'clamp(2rem, 5vw, 3rem)',
      marginBottom: '10px',
      letterSpacing: '-1px'
    },
    navPillsContainer: {
      backgroundColor: colors.cardBg,
      borderRadius: '50px',
      padding: '8px',
      display: 'inline-flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '5px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      marginBottom: '35px',
      border: `1px solid ${colors.borderColor}`
    },
    navLink: {
      color: colors.textSecondary, // Color visible en dark mode
      borderRadius: '30px',
      padding: '10px 20px',
      fontWeight: '700',
      border: 'none',
      background: 'transparent',
      transition: 'all 0.3s ease',
    },
    navLinkActive: {
      background: colors.primaryGradient,
      color: 'white',
      boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    },
    card: {
      backgroundColor: colors.cardBg,
      color: colors.textMain,
      borderRadius: '24px',
      border: `1px solid ${colors.borderColor}`,
      boxShadow: theme === 'dark' ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)',
      padding: '35px',
    },
    // CORRECCIÓN DE TABLAS: Forzamos el color en el CSS base de la tabla
    table: {
       color: colors.textMain, // CRUCIAL
       borderColor: colors.borderColor,
       '--bs-table-color': colors.textMain, // Override Bootstrap Variable
       '--bs-table-bg': 'transparent',
       '--bs-table-border-color': colors.borderColor
    },
    tableHeader: {
      backgroundColor: colors.tableHeaderBg,
      color: colors.tableHeaderText, // Color específico para headers
      fontWeight: '800',
      borderBottom: 'none',
      textTransform: 'uppercase',
      fontSize: '0.85rem',
      letterSpacing: '1px',
      padding: '15px'
    },
    // CORRECCIÓN CELDAS: Estilo base para TDs
    tableCell: {
        padding: '15px',
        color: colors.textMain, // Forzamos blanco en modo oscuro
        borderBottom: `1px solid ${colors.borderColor}`
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
    btnControl: (bgColor, textColor = 'white') => ({
        backgroundColor: bgColor,
        color: textColor,
        border: 'none',
        padding: '6px 12px',
        borderRadius: '8px',
        fontWeight: '700',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
        marginRight: '5px',
        marginBottom: '5px',
        whiteSpace: 'nowrap'
    }),
    btnAction: (color, isOutline = true) => ({
      backgroundColor: isOutline ? 'transparent' : color,
      border: isOutline ? `1px solid ${color}` : 'none',
      color: isOutline ? color : 'white',
      borderRadius: '12px',
      padding: '8px 16px',
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
  
  const [showProductModal, setShowProductModal] = useState(false);
  const [productoActual, setProductoActual] = useState(null);
  const [showComboModal, setShowComboModal] = useState(false);
  const [comboActual, setComboActual] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      if (activeTab === 'productos') { const res = await getProducts(); setProductos(res); } 
      else if (activeTab === 'reporteGeneral') { const res = await apiClient.get('/ventas/reporte'); setReportData(res.data); } 
      else if (activeTab === 'pedidosEnLinea') { const res = await apiClient.get('/pedidos'); setPedidos(res.data); } 
      else if (activeTab === 'combos') { const res = await apiClient.get('/combos/admin/todos'); setCombos(res.data); }
    } catch (err) { setError(`Error de conexión.`); console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [activeTab]);
  
  const handleOpenProductModal = (p = null) => { setProductoActual(p ? { ...p, imagenes: p.imagen_url ? [p.imagen_url] : [] } : null); setShowProductModal(true); };
  const handleSaveProducto = async (p) => { 
    try { const d = { ...p, imagen_url: p.imagenes?.[0] || null }; delete d.imagenes; 
    if (d.id) await updateProduct(d.id, d); else await createProduct(d);
    toast.success('Producto guardado'); fetchData(); setShowProductModal(false); } catch { toast.error('Error al guardar'); } 
  };
  const handleDeleteProducto = (p) => { setConfirmTitle('Ocultar Producto'); setConfirmMessage(`¿Ocultar "${p.nombre}"?`); setConfirmAction(() => async () => { await deleteProduct(p.id); toast.success('Ocultado'); fetchData(); setShowConfirmModal(false); }); setShowConfirmModal(true); };
  
  const handleOpenComboModal = (c = null) => { setComboActual(c); setShowComboModal(true); };
  const handleSaveCombo = async (c) => { try { if(c.id) await apiClient.put(`/combos/${c.id}`, c); else await apiClient.post('/combos', c); toast.success('Combo guardado'); fetchData(); setShowComboModal(false); } catch { toast.error('Error'); } };
  const handleDeleteCombo = (c) => { setConfirmTitle('Ocultar Combo'); setConfirmMessage(`¿Ocultar "${c.nombre}"?`); setConfirmAction(() => async () => { await apiClient.patch(`/combos/${c.id}/desactivar`); toast.success('Ocultado'); fetchData(); setShowConfirmModal(false); }); setShowConfirmModal(true); };

  const handleUpdateStatus = async (id, est) => { try { await apiClient.put(`/pedidos/${id}/estado`, { estado: est }); toast.success(`#${id}: ${est}`); fetchData(); } catch { toast.error('Error'); } };
  const handlePurge = async () => { if(purgeConfirmText !== 'ELIMINAR') return toast.error('Escribe ELIMINAR'); await apiClient.delete('/pedidos/purgar'); toast.success('Historial borrado'); setShowPurgeModal(false); fetchData(); };

  return (
    <div style={styles.container}>
      <div className="container-fluid px-md-5">
        
        {/* HEADER */}
        <div className="text-center mb-4 pt-3">
          <h1 style={styles.headerTitle}>🍩 Administración Miss Donitas</h1>
        </div>

        {/* NAV */}
        <div className="d-flex justify-content-center">
          <div style={styles.navPillsContainer}>
            {[
              { id: 'pedidosEnLinea', label: '🛎️ Pedidos' },
              { id: 'productos', label: '🍩 Productos' },
              { id: 'combos', label: '🎁 Combos' },
              { id: 'reporteGeneral', label: '📊 Reportes' },
              { id: 'reporteProductos', label: '📈 Métricas' }
            ].map(tab => (
              <button key={tab.id} style={activeTab === tab.id ? {...styles.navLink, ...styles.navLinkActive} : styles.navLink} onClick={() => setActiveTab(tab.id)}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* CARD PRINCIPAL */}
        <div style={styles.card}>
          
          {loading && <div className="text-center py-5"><div className="spinner-border" style={{color: colors.primary}} role="status"></div></div>}
          {error && <div className="alert alert-danger">{error}</div>}

          {/* === PRODUCTOS === */}
          {!loading && !error && activeTab === 'productos' && (
            <div>
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                <h3 className="fw-bold m-0" style={{color: colors.textMain}}>Inventario</h3>
                <button className="shadow-sm btn" style={styles.btnAdd} onClick={() => handleOpenProductModal()}>+ Nuevo Producto</button>
              </div>
              <div className="table-responsive">
                <table className="table align-middle" style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{...styles.tableHeader, borderRadius: '15px 0 0 15px'}}>Producto</th>
                      <th style={styles.tableHeader}>Precio</th>
                      <th style={styles.tableHeader}>Stock</th>
                      <th style={styles.tableHeader}>Estado</th>
                      <th style={{...styles.tableHeader, borderRadius: '0 15px 15px 0', textAlign: 'center'}}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((p) => (
                      <tr key={p.id}>
                        {/* APLICANDO styles.tableCell EN CADA TD PARA FORZAR EL COLOR */}
                        <td style={styles.tableCell}>
                          <div className="fw-bold" style={{fontSize: '1rem', color: colors.textMain}}>{p.nombre}</div>
                          <small style={{color: colors.textSecondary}}>{p.categoria}</small>
                        </td>
                        <td style={{...styles.tableCell, color: colors.primary, fontWeight: '800'}}>${Number(p.precio).toFixed(2)}</td>
                        <td style={styles.tableCell}>
                          {p.stock <= 5 
                            ? <span style={styles.badge(theme === 'dark' ? '#3E2723' : '#FFEBEE', theme === 'dark' ? '#FF5252' : '#D32F2F', theme === 'dark' ? '#FF5252' : 'transparent')}>Bajo: {p.stock}</span> 
                            : <span style={{color: colors.textSecondary, fontWeight:'bold'}}>{p.stock} u.</span>}
                        </td>
                        <td style={styles.tableCell}>
                          {p.en_oferta 
                            ? <span style={styles.badge(theme === 'dark' ? '#0D47A1' : '#E3F2FD', theme === 'dark' ? '#80D8FF' : '#1976D2', theme === 'dark' ? '#448AFF' : 'transparent')}>Oferta -{p.descuento_porcentaje}%</span> 
                            : <span style={styles.badge(theme === 'dark' ? '#424242' : '#F5F5F5', theme === 'dark' ? '#BDBDBD' : '#757575', theme === 'dark' ? '#757575' : 'transparent')}>Normal</span>}
                        </td>
                        <td style={styles.tableCell} className="text-center">
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

          {/* === PEDIDOS === */}
          {!loading && !error && activeTab === 'pedidosEnLinea' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold m-0" style={{color: colors.textMain}}>Pedidos Entrantes</h3>
                <span className="badge rounded-pill px-3 py-2 shadow-sm" style={{backgroundColor: colors.danger, color: 'white'}}>
                  {pedidos.filter(p => p.estado === 'Pendiente').length} Por Atender
                </span>
              </div>
              <div className="table-responsive">
                <table className="table align-middle" style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{...styles.tableHeader, borderRadius: '15px 0 0 15px'}}>ID / Cliente</th>
                      <th style={styles.tableHeader}>Total</th>
                      <th style={styles.tableHeader}>Tipo</th>
                      <th style={styles.tableHeader}>Estado</th>
                      <th style={{...styles.tableHeader, borderRadius: '0 15px 15px 0'}}>Control</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.map((p) => (
                      <tr key={p.id}>
                        {/* APLICANDO styles.tableCell PARA FORZAR EL COLOR BLANCO */}
                        <td style={styles.tableCell}>
                           <div className="d-flex align-items-center">
                             <span className="fw-bold me-3" style={{color: colors.primary}}>#{p.id}</span>
                             <div>
                               <div className="fw-bold" style={{color: colors.textMain}}>{p.nombre_cliente}</div>
                               <small style={{color: colors.textSecondary}}>{new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                             </div>
                           </div>
                        </td>
                        <td style={{...styles.tableCell, fontWeight: 'bold', color: colors.textMain}}>${Number(p.total).toFixed(2)}</td>
                        <td style={styles.tableCell}>
                          {p.tipo_orden === 'domicilio' 
                            ? <span style={styles.badge(theme === 'dark' ? '#004D40' : '#E0F7FA', theme === 'dark' ? '#64FFDA' : '#0097A7', theme === 'dark' ? '#00BCD4' : 'transparent')}>🛵 Domicilio</span> 
                            : <span style={styles.badge(theme === 'dark' ? '#BF360C' : '#FFF3E0', theme === 'dark' ? '#FFAB40' : '#F57C00', theme === 'dark' ? '#FF9800' : 'transparent')}>🏪 Recoger</span>}
                        </td>
                        <td style={styles.tableCell}>
                           <span className="badge rounded-pill" style={{
                             backgroundColor: p.estado === 'Pendiente' ? colors.btnPrepare : (p.estado === 'Completado' ? colors.success : colors.accent), 
                             color: p.estado === 'Pendiente' ? '#212121' : (theme === 'dark' ? '#000' : '#FFF'), 
                             padding: '6px 12px'
                           }}>{p.estado}</span>
                        </td>
                        <td style={styles.tableCell}>
                            <div className="d-flex flex-wrap">
                                <button style={styles.btnControl(colors.btnView)} onClick={() => {setSelectedOrderDetails(p); setShowDetailsModal(true);}}>Ver</button>
                                {p.estado !== 'Completado' && (
                                    <>
                                        <button style={styles.btnControl(colors.btnPrepare, '#212121')} onClick={() => handleUpdateStatus(p.id, 'En Preparacion')}>Prep</button>
                                        {p.tipo_orden === 'domicilio' ? (
                                            <button style={styles.btnControl(colors.btnWay)} onClick={() => handleUpdateStatus(p.id, 'En Camino')}>Moto</button>
                                        ) : (
                                            <button style={styles.btnControl(colors.btnReady, '#212121')} onClick={() => handleUpdateStatus(p.id, 'Listo')}>Listo</button>
                                        )}
                                        <button style={styles.btnControl(colors.btnDone)} onClick={() => handleUpdateStatus(p.id, 'Completado')}>OK</button>
                                    </>
                                )}
                            </div>
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
                      backgroundColor: colors.elementBg, 
                      color: colors.textMain, // Forzado
                      opacity: combo.esta_activo ? 1 : 0.75,
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
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

          {/* === REPORTES === */}
          {!loading && !error && activeTab === 'reporteGeneral' && (
            <div>
               <div className="row mb-5 g-4">
                  <div className="col-md-6"><StatCard title="Ventas Totales" value={`$${reportData.reduce((acc, curr) => acc + Number(curr.total_ventas), 0).toFixed(2)}`} color={colors.success} icon="💰" styles={styles} colors={colors} /></div>
                  <div className="col-md-6"><StatCard title="Promedio Venta" value="$150.00" color={colors.primary} icon="📈" styles={styles} colors={colors} /></div>
               </div>
               
               <h5 className="mb-4 fw-bold" style={{color: colors.textMain}}>Gráfica de Rendimiento</h5>
               <div style={{padding: '20px', backgroundColor: colors.elementBg, borderRadius: '20px', border: `1px solid ${colors.borderColor}`}}>
                    <SalesReportChart reportData={reportData} theme={theme} /> 
               </div>
               
               <div className="mt-5 text-end">
                   <button className="btn btn-outline-danger btn-sm rounded-pill" onClick={() => setShowPurgeModal(true)}>Zona de Peligro (Purgar)</button>
               </div>
            </div>
          )}
          {activeTab === 'reporteProductos' && <ProductSalesReport />}

        </div>
      </div>

      {/* MODALES */}
      <ProductModal show={showProductModal} handleClose={() => setShowProductModal(false)} handleSave={handleSaveProducto} productoActual={productoActual} />
      <ComboModal show={showComboModal} handleClose={() => setShowComboModal(false)} handleSave={handleSaveCombo} comboActual={comboActual} />
      {showDetailsModal && (<DetallesPedidoModal pedido={selectedOrderDetails} onClose={() => setShowDetailsModal(false)} />)}
      
      <ConfirmationModal show={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmAction} title={confirmTitle} message={confirmMessage} themeColors={colors} />

      {/* MODAL PURGAR (Corrección de inputs oscuros) */}
      {showPurgeModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 overflow-hidden" style={{backgroundColor: colors.cardBg, color: colors.textMain}}>
              <div className="modal-header text-white border-0" style={{backgroundColor: colors.danger}}><h5 className="modal-title fw-bold">⚠️ Borrar Todo</h5><button type="button" className="btn-close btn-close-white" onClick={() => setShowPurgeModal(false)}></button></div>
              <div className="modal-body p-4">
                <p>Escribe <strong>ELIMINAR</strong> para confirmar:</p>
                {/* Input con fondo oscuro y letra clara */}
                <input type="text" className="form-control" style={{backgroundColor: colors.elementBg, color: colors.textMain, border: `1px solid ${colors.borderColor}`}} value={purgeConfirmText} onChange={(e) => setPurgeConfirmText(e.target.value)} />
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-danger w-100 rounded-pill" onClick={handlePurge} disabled={purgeConfirmText !== 'ELIMINAR'}>Confirmar Borrado</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;