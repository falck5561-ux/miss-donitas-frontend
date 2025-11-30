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

// --- PALETA DE COLORES DEFINITIVA (ALTO CONTRASTE) ---
const getThemeColors = (mode) => {
  const isDark = mode === 'dark';
  
  return {
    // FONDOS - Negro absoluto vs Blanco
    bg: isDark ? '#000000' : '#F8F9FA',          
    cardBg: isDark ? '#1A1A1A' : '#FFFFFF',      // Tarjeta: Gris casi negro vs Blanco puro
    elementBg: isDark ? '#2D2D2D' : '#F1F3F5',   // Inputs/Items: Gris oscuro vs Gris claro
    
    // TEXTOS - Blanco puro vs Negro casi puro
    textMain: isDark ? '#FFFFFF' : '#212529',     
    textLight: isDark ? '#ADB5BD' : '#6C757D',   
    
    // BORDES
    borderColor: isDark ? '#424242' : '#DEE2E6',

    // ACENTOS DE MARCA
    primary: '#FF4081',
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #D81B60 0%, #FF4081 100%)' 
      : 'linear-gradient(135deg, #FF80AB 0%, #F50057 100%)',
      
    // TABLAS
    tableHeaderBg: isDark ? '#333333' : '#E9ECEF',
    tableHeaderText: isDark ? '#FF80AB' : '#495057',

    // ESTADOS
    accent: isDark ? '#40C4FF' : '#00BCD4',      
    danger: isDark ? '#FF5252' : '#DC3545',      
    success: isDark ? '#69F0AE' : '#28A745',     
    
    // BOTONES DE FLUJO
    btnPrepare: '#FFC107', 
    btnWay: '#FF4081', 
    btnReady: isDark ? '#6C757D' : '#ADB5BD', 
    btnDone: '#28A745',    
    btnView: '#17A2B8',    
  };
};

// --- COMPONENTES AUXILIARES CON ESTILOS FORZADOS ---

// Corregido: Ahora recibe 'colors' y fuerza el fondo y color de texto
const StatCard = ({ title, value, color, icon, styles, colors }) => (
  <div style={{
      ...styles.card, 
      backgroundColor: colors.cardBg, // FORZADO
      color: colors.textMain,         // FORZADO
      textAlign: 'center', 
      borderBottom: `4px solid ${color}`, 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center'
  }}>
    <div style={{fontSize: '2.5rem', marginBottom: '10px'}}>{icon}</div>
    <h6 style={{color: colors.textLight, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold'}}>{title}</h6>
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
            <button type="button" className="btn-close" style={{filter: themeColors.bg === '#000000' ? 'invert(1)' : 'none'}} onClick={onClose}></button>
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
  const colors = getThemeColors(theme);

  // --- ESTILOS ---
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
      color: colors.textLight,
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
    // TARJETA PRINCIPAL: Estilos críticos
    card: {
      backgroundColor: colors.cardBg, // Se asegura que sea OSCURO en modo dark
      color: colors.textMain,         // Se asegura que el texto sea BLANCO en modo dark
      borderRadius: '24px',
      border: `1px solid ${colors.borderColor}`,
      boxShadow: theme === 'dark' ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)',
      padding: '35px',
    },
    // TABLAS: Hack para anular Bootstrap
    table: {
        color: colors.textMain,
        borderColor: colors.borderColor,
        backgroundColor: 'transparent', 
        '--bs-table-bg': 'transparent', 
        '--bs-table-color': colors.textMain
    },
    tableHeader: {
      backgroundColor: colors.tableHeaderBg,
      color: colors.tableHeaderText,
      fontWeight: '800',
      borderBottom: 'none',
      textTransform: 'uppercase',
      fontSize: '0.85rem',
      letterSpacing: '1px',
      padding: '15px'
    },
    tableRow: {
      borderBottom: `1px solid ${colors.borderColor}`,
      verticalAlign: 'middle',
      backgroundColor: 'transparent' // Importante
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

        {/* CARD PRINCIPAL - ESTILOS APLICADOS EXPLÍCITAMENTE */}
        <div style={styles.card}>
          
          {loading && <div className="text-center py-5"><div className="spinner-border" style={{color: colors.primary}} role="status"></div></div>}
          {error && <div className="alert alert-danger">{error}</div>}

          {/* === PRODUCTOS === */}
          {!loading && !error && activeTab === 'productos' && (
            <div>
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                {/* Título con color forzado */}
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
                      <tr key={p.id} style={styles.tableRow}>
                        <td style={{padding: '15px'}}>
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
                            : <span style={styles.badge(theme === 'dark' ? '#424242' : '#F5F5F5', theme === 'dark' ? '#BDBDBD' : '#757575', theme === 'dark' ? '#757575' : 'transparent')}>Normal</span>}
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

          {/* === PEDIDOS === */}
          {!loading && !error && activeTab === 'pedidosEnLinea' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                {/* Título con color forzado */}
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
                      <tr key={p.id} style={styles.tableRow}>
                        <td style={{padding: '15px'}}>
                           <div className="d-flex align-items-center">
                             <span className="fw-bold me-3" style={{color: colors.primary}}>#{p.id}</span>
                             <div>
                               <div className="fw-bold" style={{color: colors.textMain}}>{p.nombre_cliente}</div>
                               <small style={{color: colors.textLight}}>{new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                             </div>
                           </div>
                        </td>
                        <td className="fw-bold" style={{color: colors.textMain}}>${Number(p.total).toFixed(2)}</td>
                        <td>
                          {p.tipo_orden === 'domicilio' 
                            ? <span style={styles.badge(theme === 'dark' ? '#004D40' : '#E0F7FA', theme === 'dark' ? '#64FFDA' : '#0097A7', theme === 'dark' ? '#00BCD4' : 'transparent')}>🛵 Domicilio</span> 
                            : <span style={styles.badge(theme === 'dark' ? '#BF360C' : '#FFF3E0', theme === 'dark' ? '#FFAB40' : '#F57C00', theme === 'dark' ? '#FF9800' : 'transparent')}>🏪 Recoger</span>}
                        </td>
                        <td>
                           <span className="badge rounded-pill" style={{
                             backgroundColor: p.estado === 'Pendiente' ? colors.btnPrepare : (p.estado === 'Completado' ? colors.success : colors.accent), 
                             color: p.estado === 'Pendiente' ? '#212121' : (theme === 'dark' ? '#000' : '#FFF'), 
                             padding: '6px 12px'
                           }}>{p.estado}</span>
                        </td>
                        <td>
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

          {/* === COMBOS (Corregido: Tarjetas con fondo explícito) === */}
          {!loading && !error && activeTab === 'combos' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                {/* Título forzado */}
                <h3 className="fw-bold m-0" style={{color: colors.textMain}}>Combos & Promociones</h3>
                <button className="shadow-sm btn" style={styles.btnAdd} onClick={() => handleOpenComboModal()}>+ Nuevo Combo</button>
              </div>
              <div className="row g-4">
                {combos.map((combo) => (
                  <div className="col-md-6 col-lg-4" key={combo.id}>
                    {/* Tarjeta individual con colores forzados */}
                    <div style={{
                      border: `1px solid ${combo.esta_activo ? colors.success : colors.danger}`, 
                      borderRadius: '20px', 
                      padding: '25px', 
                      backgroundColor: colors.elementBg, // FORZADO: Gris oscuro en modo noche
                      color: colors.textMain,          // FORZADO: Texto blanco
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

          {/* === REPORTES (Corregido: StatCards con colores pasados explícitamente) === */}
          {!loading && !error && activeTab === 'reporteGeneral' && (
            <div>
               <div className="row mb-5 g-4">
                  {/* Se pasa 'colors' a StatCard */}
                  <div className="col-md-6"><StatCard title="Ventas Totales" value={`$${reportData.reduce((acc, curr) => acc + Number(curr.total_ventas), 0).toFixed(2)}`} color={colors.success} icon="💰" styles={styles} colors={colors} /></div>
                  <div className="col-md-6"><StatCard title="Promedio Venta" value="$150.00" color={colors.primary} icon="📈" styles={styles} colors={colors} /></div>
               </div>
               {/* Título forzado */}
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

      {/* MODAL PURGAR */}
      {showPurgeModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 overflow-hidden" style={{backgroundColor: colors.cardBg, color: colors.textMain}}>
              <div className="modal-header text-white border-0" style={{backgroundColor: colors.danger}}><h5 className="modal-title fw-bold">⚠️ Borrar Todo</h5><button type="button" className="btn-close btn-close-white" onClick={() => setShowPurgeModal(false)}></button></div>
              <div className="modal-body p-4">
                <p>Escribe <strong>ELIMINAR</strong> para confirmar:</p>
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