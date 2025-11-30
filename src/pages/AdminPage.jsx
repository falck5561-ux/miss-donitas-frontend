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

// --- PALETA DE COLORES (ENFOQUE: VISIBILIDAD) ---
const getThemeColors = (mode) => {
  const isDark = mode === 'dark';

  return {
    // === FONDOS ===
    bg: isDark ? '#121212' : '#F3F4F6', // Gris muy oscuro vs Gris muy claro
    cardBg: isDark ? '#1E1E1E' : '#FFFFFF', // Carta oscura vs Blanca pura
    elementBg: isDark ? '#2D2D2D' : '#F9FAFB', // Elementos internos (inputs, filas)

    // === TEXTOS (CONTRASTE MÁXIMO) ===
    textMain: isDark ? '#FFFFFF' : '#111827', // Blanco puro vs Negro casi puro
    textSecondary: isDark ? '#A0A0A0' : '#4B5563', // Gris medio para subtítulos

    // === BORDES ===
    borderColor: isDark ? '#404040' : '#E5E7EB',

    // === ACENTOS DE MARCA ===
    // Dark: Rojo Intenso (Visible sobre negro)
    // Light: Rosa Fuerte (Visible sobre blanco)
    primary: isDark ? '#FF5252' : '#DB2777', 
    
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #FF5252 0%, #D32F2F 100%)' 
      : 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',

    // === DINERO / NÚMEROS ===
    // Dark: Oro/Amarillo (Resalta mucho)
    // Light: Verde Esmeralda (Clásico y legible)
    money: isDark ? '#FFD700' : '#059669',

    // === TABLAS ===
    tableHeaderText: isDark ? '#FF8A80' : '#9D174D',

    // === SOMBRAS ===
    cardShadow: isDark 
        ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
        : '0 4px 6px rgba(0, 0, 0, 0.05)',

    // === BADGES (Estados) ===
    // Textos oscuros en fondos claros para modo Light
    // Textos claros en fondos oscuros para modo Dark
    badgeSuccessBg: isDark ? '#064E3B' : '#D1FAE5',
    badgeSuccessTxt: isDark ? '#6EE7B7' : '#065F46',

    badgeWarnBg: isDark ? '#78350F' : '#FEF3C7',
    badgeWarnTxt: isDark ? '#FCD34D' : '#92400E',

    badgeDangerBg: isDark ? '#7F1D1D' : '#FEE2E2',
    badgeDangerTxt: isDark ? '#FCA5A5' : '#B91C1C',
    
    badgeInfoBg: isDark ? '#0C4A6E' : '#E0F2FE',
    badgeInfoTxt: isDark ? '#7DD3FC' : '#075985',
  };
};

// --- TARJETA KPI ---
const StatCard = ({ title, value, icon, styles, colors }) => (
  <div style={{
      ...styles.card, 
      borderLeft: `5px solid ${colors.primary}`,
      display: 'flex', 
      alignItems: 'center',
      justifyContent: 'space-between'
  }}>
    <div>
        <h6 style={{ color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', marginBottom: '5px' }}>{title}</h6>
        <h3 style={{ color: colors.money, fontWeight: '900', margin: 0, fontSize: '2.2rem', fontFamily: 'monospace' }}>{value}</h3>
    </div>
    <div style={{ fontSize: '2.5rem' }}>{icon}</div>
  </div>
);

// --- MODAL CONFIRMACIÓN ---
const ConfirmationModal = ({ show, onClose, onConfirm, title, message, colors }) => {
    if (!show) return null;
    return (
      <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(2px)', zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ borderRadius: '15px', border: `1px solid ${colors.borderColor}`, backgroundColor: colors.cardBg, boxShadow: colors.cardShadow }}>
            <div className="modal-header border-0 pb-0 pt-4 px-4">
              <h5 className="modal-title fw-bold" style={{ color: colors.textMain }}>{title}</h5>
              <button type="button" className="btn-close" style={{filter: colors.bg === '#121212' ? 'invert(1)' : 'none'}} onClick={onClose}></button>
            </div>
            <div className="modal-body px-4 pt-3 pb-4">
              <p style={{color: colors.textSecondary, fontSize: '1.1rem'}}>{message}</p>
            </div>
            <div className="modal-footer border-0 px-4 pb-4">
              <button className="btn rounded-pill px-4 fw-bold" style={{backgroundColor: colors.elementBg, color: colors.textMain, border: `1px solid ${colors.borderColor}`}} onClick={onClose}>Cancelar</button>
              <button className="btn rounded-pill px-4 fw-bold text-white shadow" style={{backgroundColor: colors.primary}} onClick={onConfirm}>Confirmar</button>
            </div>
          </div>
        </div>
      </div>
    );
};

function AdminPage() {
  const { theme } = useTheme(); 
  const colors = getThemeColors(theme);
  const isDark = theme === 'dark';

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
      gap: '10px',
      marginBottom: '30px',
      border: `1px solid ${colors.borderColor}`,
      boxShadow: colors.cardShadow
    },
    navLink: {
      color: colors.textSecondary,
      borderRadius: '30px',
      padding: '10px 25px',
      fontWeight: '700',
      border: 'none',
      background: 'transparent',
      transition: 'all 0.2s ease',
    },
    navLinkActive: {
      background: colors.primaryGradient,
      color: '#FFFFFF',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    },
    card: {
      backgroundColor: colors.cardBg,
      color: colors.textMain,
      borderRadius: '20px',
      border: `1px solid ${colors.borderColor}`,
      boxShadow: colors.cardShadow,
      padding: '30px',
      marginBottom: '30px'
    },
    table: {
       '--bs-table-bg': 'transparent', 
       '--bs-table-color': colors.textMain,
       '--bs-table-border-color': colors.borderColor,
       width: '100%',
       verticalAlign: 'middle'
    },
    tableHeader: {
      backgroundColor: colors.elementBg,
      color: colors.tableHeaderText,
      fontWeight: '800',
      borderBottom: `2px solid ${colors.borderColor}`,
      textTransform: 'uppercase',
      fontSize: '0.8rem',
      letterSpacing: '1px',
      padding: '15px'
    },
    tableCell: {
       padding: '15px',
       color: colors.textMain,
       borderBottom: `1px solid ${colors.borderColor}`
    },
    input: {
       backgroundColor: colors.elementBg,
       color: colors.textMain,
       border: `1px solid ${colors.borderColor}`,
       padding: '12px 20px',
       borderRadius: '12px',
       width: '100%',
       outline: 'none',
       fontWeight: '600'
    },
    btnAdd: {
      background: colors.primaryGradient,
      border: 'none',
      borderRadius: '50px',
      color: 'white',
      padding: '10px 30px',
      fontWeight: '700',
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
      textTransform: 'uppercase',
      fontSize: '0.85rem'
    },
    btnControl: (bgColor, textColor) => ({
        backgroundColor: bgColor,
        color: textColor,
        border: 'none',
        padding: '6px 12px',
        borderRadius: '8px',
        fontWeight: '700',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        marginRight: '5px',
        marginBottom: '5px',
        cursor: 'pointer'
    }),
    btnAction: (color, isOutline = true) => ({
      backgroundColor: isOutline ? 'transparent' : color,
      border: `1px solid ${color}`,
      color: isOutline ? color : 'white',
      borderRadius: '8px',
      padding: '6px 14px',
      fontWeight: '700',
      fontSize: '0.8rem',
      marginRight: '5px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }),
    badge: (text, bg, txt) => (
        <span style={{
            backgroundColor: bg,
            color: txt,
            padding: '5px 12px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            border: `1px solid ${txt}40`
        }}>
            {text}
        </span>
    )
  };

  const [activeTab, setActiveTab] = useState('pedidosEnLinea');
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Modales states
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
  
  // Handlers
  const handleOpenProductModal = (p = null) => { setProductoActual(p ? { ...p, imagenes: p.imagen_url ? [p.imagen_url] : [] } : null); setShowProductModal(true); };
  const handleSaveProducto = async (p) => { try { const d = { ...p, imagen_url: p.imagenes?.[0] || null }; delete d.imagenes; if (d.id) await updateProduct(d.id, d); else await createProduct(d); toast.success('Producto guardado'); fetchData(); setShowProductModal(false); } catch { toast.error('Error al guardar'); } };
  const handleDeleteProducto = (p) => { setConfirmTitle('Ocultar Producto'); setConfirmMessage(`¿Ocultar "${p.nombre}"?`); setConfirmAction(() => async () => { await deleteProduct(p.id); toast.success('Ocultado'); fetchData(); setShowConfirmModal(false); }); setShowConfirmModal(true); };
  const handleOpenComboModal = (c = null) => { setComboActual(c); setShowComboModal(true); };
  const handleSaveCombo = async (c) => { try { if(c.id) await apiClient.put(`/combos/${c.id}`, c); else await apiClient.post('/combos', c); toast.success('Combo guardado'); fetchData(); setShowComboModal(false); } catch { toast.error('Error'); } };
  const handleDeleteCombo = (c) => { setConfirmTitle('Ocultar Combo'); setConfirmMessage(`¿Ocultar "${c.nombre}"?`); setConfirmAction(() => async () => { await apiClient.patch(`/combos/${c.id}/desactivar`); toast.success('Ocultado'); fetchData(); setShowConfirmModal(false); }); setShowConfirmModal(true); };
  const handleUpdateStatus = async (id, est) => { try { await apiClient.put(`/pedidos/${id}/estado`, { estado: est }); toast.success(`#${id}: ${est}`); fetchData(); } catch { toast.error('Error'); } };
  const handlePurge = async () => { if(purgeConfirmText !== 'ELIMINAR') return toast.error('Escribe ELIMINAR'); await apiClient.delete('/pedidos/purgar'); toast.success('Historial borrado'); setShowPurgeModal(false); fetchData(); };

  return (
    <div style={styles.container}>
      <div className="container-fluid px-md-5">
        
        {/* HEADER LIMPIO (Sin texto de modos) */}
        <div className="text-center mb-5 pt-3">
          <h1 style={styles.headerTitle}>🍩 Miss Donitas Admin</h1>
        </div>

        {/* NAV */}
        <div className="d-flex justify-content-center">
          <div style={styles.navPillsContainer}>
            {[
              { id: 'pedidosEnLinea', label: '🛎️ Pedidos' },
              { id: 'productos', label: '🍩 Inventario' },
              { id: 'combos', label: '🎁 Promos' },
              { id: 'reporteGeneral', label: '📊 Finanzas' },
              { id: 'reporteProductos', label: '📈 Ranking' }
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

          {/* === INVENTARIO === */}
          {!loading && !error && activeTab === 'productos' && (
            <div>
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                <h3 className="fw-bold m-0" style={{color: colors.textMain}}>Inventario de Donas</h3>
                <button className="btn shadow-sm" style={styles.btnAdd} onClick={() => handleOpenProductModal()}>+ Nuevo Producto</button>
              </div>
              <div className="table-responsive">
                <table className="table" style={styles.table}>
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
                        <td style={styles.tableCell}>
                            <div className="fw-bold" style={{fontSize: '1rem'}}>{p.nombre}</div>
                            <small style={{color: colors.textSecondary}}>{p.categoria}</small>
                        </td>
                        <td style={{...styles.tableCell, color: colors.money, fontWeight: '900', fontSize: '1.1rem'}}>
                            ${Number(p.precio).toFixed(2)}
                        </td>
                        <td style={styles.tableCell}>
                            {p.stock <= 5 
                             ? styles.badge(`Bajo: ${p.stock}`, colors.badgeDangerBg, colors.badgeDangerTxt)
                             : <span style={{color: colors.textMain, fontWeight: '600'}}>{p.stock} u.</span>}
                        </td>
                        <td style={styles.tableCell}>
                            {p.en_oferta 
                             ? styles.badge(`-${p.descuento_porcentaje}%`, colors.badgeInfoBg, colors.badgeInfoTxt)
                             : <span style={{color: colors.textSecondary}}>Normal</span>}
                        </td>
                        <td style={styles.tableCell} className="text-center">
                          <button style={styles.btnAction(colors.textSecondary, true)} onClick={() => handleOpenProductModal(p)}>Editar</button>
                          <button style={styles.btnAction(colors.primary, true)} onClick={() => handleDeleteProducto(p)}>Ocultar</button>
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
               <h3 className="fw-bold m-0" style={{color: colors.textMain}}>Monitor de Pedidos</h3>
               {pedidos.filter(p => p.estado === 'Pendiente').length > 0 && (
                   <span style={{backgroundColor: colors.primary, color: 'white', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold'}}>
                     {pedidos.filter(p => p.estado === 'Pendiente').length} PENDIENTES
                   </span>
               )}
             </div>
             <div className="table-responsive">
               <table className="table" style={styles.table}>
                 <thead>
                   <tr>
                     <th style={{...styles.tableHeader, borderRadius: '15px 0 0 15px'}}>ID / Cliente</th>
                     <th style={styles.tableHeader}>Total</th>
                     <th style={styles.tableHeader}>Método</th>
                     <th style={styles.tableHeader}>Status</th>
                     <th style={{...styles.tableHeader, borderRadius: '0 15px 15px 0'}}>Control de Cocina</th>
                   </tr>
                 </thead>
                 <tbody>
                   {pedidos.map((p) => (
                     <tr key={p.id}>
                       <td style={styles.tableCell}>
                          <div className="d-flex align-items-center">
                            <span className="fw-bold me-3 px-2 rounded" style={{color: colors.primary, border: `1px solid ${colors.borderColor}`}}>#{p.id}</span>
                            <div>
                                <div className="fw-bold">{p.nombre_cliente}</div>
                                <small style={{color: colors.textSecondary}}>{new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                            </div>
                          </div>
                       </td>
                       <td style={{...styles.tableCell, color: colors.money, fontWeight: '900', fontSize: '1.2rem'}}>
                           ${Number(p.total).toFixed(2)}
                       </td>
                       <td style={styles.tableCell}>
                         {p.tipo_orden === 'domicilio' 
                           ? styles.badge('🛵 Domicilio', colors.badgeInfoBg, colors.badgeInfoTxt)
                           : styles.badge('🏪 Recoger', colors.badgeWarnBg, colors.badgeWarnTxt)}
                       </td>
                       <td style={styles.tableCell}>
                          {p.estado === 'Pendiente' 
                             ? styles.badge('⏳ Pendiente', colors.badgeDangerBg, colors.badgeDangerTxt)
                             : (p.estado === 'Completado' 
                                ? styles.badge('✅ Entregado', colors.badgeSuccessBg, colors.badgeSuccessTxt)
                                : styles.badge(p.estado, colors.elementBg, colors.textMain))}
                       </td>
                       <td style={styles.tableCell}>
                           <div className="d-flex flex-wrap">
                               <button style={styles.btnControl(colors.elementBg, colors.textMain)} onClick={() => {setSelectedOrderDetails(p); setShowDetailsModal(true);}}>Ver</button>
                               {p.estado !== 'Completado' && (
                                   <>
                                           <button style={styles.btnControl(colors.badgeWarnBg, colors.badgeWarnTxt)} onClick={() => handleUpdateStatus(p.id, 'En Preparacion')}>Prep</button>
                                           {p.tipo_orden === 'domicilio' 
                                                ? <button style={styles.btnControl(colors.badgeInfoBg, colors.badgeInfoTxt)} onClick={() => handleUpdateStatus(p.id, 'En Camino')}>Moto</button> 
                                                : <button style={styles.btnControl(colors.badgeSuccessBg, colors.badgeSuccessTxt)} onClick={() => handleUpdateStatus(p.id, 'Listo')}>Listo</button>}
                                           <button style={styles.btnControl(colors.textMain, colors.cardBg)} onClick={() => handleUpdateStatus(p.id, 'Completado')}>OK</button>
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
               <button className="btn" style={styles.btnAdd} onClick={() => handleOpenComboModal()}>+ Nuevo Combo</button>
             </div>
             <div className="row g-4">
               {combos.map((combo) => (
                 <div className="col-md-6 col-lg-4" key={combo.id}>
                   <div style={{
                        border: `1px solid ${colors.borderColor}`, 
                        borderRadius: '20px', 
                        padding: '25px', 
                        backgroundColor: colors.elementBg, 
                        color: colors.textMain,
                        boxShadow: 'none'
                    }}>
                     <div className="d-flex justify-content-between align-items-start mb-3">
                       <h5 className="fw-bold mb-0" style={{color: colors.textMain}}>{combo.nombre}</h5>
                       {combo.esta_activo 
                           ? styles.badge('ACTIVO', colors.badgeSuccessBg, colors.badgeSuccessTxt)
                           : styles.badge('OCULTO', colors.badgeDangerBg, colors.badgeDangerTxt)}
                     </div>
                     <h4 style={{color: colors.money, fontWeight: '800', fontSize: '1.8rem'}}>${Number(combo.precio).toFixed(2)}</h4>
                     <p style={{color: colors.textSecondary, fontSize: '0.9rem'}}>{combo.descripcion}</p>
                     
                     <div className="mt-4 d-flex gap-2">
                       <button style={{...styles.btnAction(colors.textSecondary, true), flex:1}} onClick={() => handleOpenComboModal(combo)}>Editar</button>
                       {combo.esta_activo && <button style={{...styles.btnAction(colors.primary, true), flex:1}} onClick={() => handleDeleteCombo(combo)}>Ocultar</button>}
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
                 <div className="col-md-6">
                   <StatCard 
                     title="Ventas Totales" 
                     value={`$${reportData.reduce((acc, curr) => acc + Number(curr.total_ventas), 0).toFixed(2)}`} 
                     icon="💰" 
                     styles={styles} 
                     colors={colors} 
                   />
                 </div>
                 <div className="col-md-6">
                   <StatCard 
                     title="Ticket Promedio" 
                     value="$150.00" 
                     icon="📈" 
                     styles={styles} 
                     colors={colors} 
                   />
                 </div>
               </div>
               
               <h5 className="mb-4 fw-bold" style={{color: colors.textMain}}>Rendimiento Visual</h5>
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

      {/* MODALES: IMPORTANTE - PASAMOS COLORS A TODOS */}
      <ProductModal show={showProductModal} handleClose={() => setShowProductModal(false)} handleSave={handleSaveProducto} productoActual={productoActual} colors={colors} />
      <ComboModal show={showComboModal} handleClose={() => setShowComboModal(false)} handleSave={handleSaveCombo} comboActual={comboActual} colors={colors} />
      
      {showDetailsModal && (<DetallesPedidoModal pedido={selectedOrderDetails} onClose={() => setShowDetailsModal(false)} colors={colors} />)}
      
      <ConfirmationModal show={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmAction} title={confirmTitle} message={confirmMessage} colors={colors} />

      {/* MODAL PURGAR (Interno) */}
      {showPurgeModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 overflow-hidden" style={{backgroundColor: colors.cardBg, color: colors.textMain, border: `1px solid ${colors.borderColor}`}}>
              <div className="modal-header text-white border-0" style={{backgroundColor: '#D50000'}}><h5 className="modal-title fw-bold">⚠️ BORRAR BASE DE DATOS</h5><button type="button" className="btn-close btn-close-white" onClick={() => setShowPurgeModal(false)}></button></div>
              <div className="modal-body p-4">
                <p>Esta acción no se puede deshacer. Escribe <strong>ELIMINAR</strong> para confirmar:</p>
                <input 
                    type="text" 
                    style={styles.input}
                    value={purgeConfirmText} 
                    onChange={(e) => setPurgeConfirmText(e.target.value)} 
                    placeholder="ELIMINAR"
                />
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-danger w-100 rounded-pill shadow-sm fw-bold" onClick={handlePurge} disabled={purgeConfirmText !== 'ELIMINAR'}>Confirmar Destrucción</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;