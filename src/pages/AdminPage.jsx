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

// --- PALETA DE COLORES "FUEGO & HIELO" ---
const getThemeColors = (mode) => {
  const isDark = mode === 'dark';

  return {
    // === FONDOS (EXTREMO CONTRASTE) ===
    // Dark: Casi negro absoluto para que el rojo "queme" la pantalla.
    // Light: Blanco humo muy limpio.
    bg: isDark ? '#050505' : '#F4F7FE', 
    
    // Cards
    cardBg: isDark ? '#111111' : '#FFFFFF',
    
    // Elementos (Inputs, filas alternas)
    elementBg: isDark ? '#1A1A1A' : '#F3F4F6',

    // === TEXTOS ===
    // En Dark, texto blanco puro para máxima lectura, el rojo será solo para acentos.
    textMain: isDark ? '#FFFFFF' : '#2B3674', 
    textSecondary: isDark ? '#A3A3A3' : '#A3AED0',

    // === BORDES ===
    // Borde sutil rojo en Dark para delimitar zonas
    borderColor: isDark ? '#333333' : '#E0E5F2',
    
    // === MARCA Y ACENTOS ===
    // Light: Rosa/Magenta (Dulce)
    // Dark: ROJO SANGRE / LAVA (Picante)
    primary: isDark ? '#FF1744' : '#E91E63', 

    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #FF1744 0%, #D50000 100%)' // Fuego puro
      : 'linear-gradient(135deg, #FF4081 0%, #C2185B 100%)', // Fresa dulce

    // === DINERO / NÚMEROS (TU REQUISITO CLAVE) ===
    // Dark: ROJO NEÓN (#FF1744) -> Sin excepción, como pediste.
    // Light: VERDE DINERO (#05CD99) -> Para mantener la frescura en light.
    money: isDark ? '#FF1744' : '#05CD99', 

    // === TABLAS ===
    tableHeaderBg: isDark ? '#1A1A1A' : '#F4F7FE',
    tableHeaderText: isDark ? '#FF1744' : '#A3AED0', // Encabezados rojos en dark

    // === SHADOWS (GLOW) ===
    // El toque "Genial": Sombra roja difusa en dark mode
    cardShadow: isDark 
        ? '0 10px 30px rgba(255, 23, 68, 0.15)' // Resplandor rojo
        : '0 10px 30px rgba(112, 144, 176, 0.12)',

    // === BADGES (ESTADOS) ===
    // Ajustados para armonizar con el rojo
    badgeSuccessBg: isDark ? '#051b11' : '#E6FDF4',
    badgeSuccessTxt: isDark ? '#00E676' : '#05CD99', // Verde brillante en texto

    badgeWarnBg: isDark ? '#261C00' : '#FFF8E1',
    badgeWarnTxt: isDark ? '#FFC400' : '#FF8F00',

    badgeDangerBg: isDark ? '#2A0505' : '#FEE2E2',
    badgeDangerTxt: isDark ? '#FF1744' : '#EF4444',
    
    badgeInfoBg: isDark ? '#001824' : '#E1F5FE',
    badgeInfoTxt: isDark ? '#00B0FF' : '#039BE5',
  };
};

// --- COMPONENTE KPI (Tarjeta de Métricas) ---
const StatCard = ({ title, value, color, icon, styles, colors }) => (
  <div style={{
      ...styles.card, 
      borderBottom: `4px solid ${colors.money}`, // Borde siempre del color del dinero (Rojo en dark)
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center',
      textAlign: 'center',
      height: '100%',
      position: 'relative',
      overflow: 'hidden'
  }}>
    {/* Fondo decorativo sutil */}
    <div style={{
        position: 'absolute', top: '-20px', right: '-20px', fontSize: '8rem', 
        opacity: 0.05, color: colors.textMain, pointerEvents: 'none'
    }}>{icon}</div>

    <div style={{ fontSize: '2.5rem', marginBottom: '10px', color: colors.money }}>
      {icon}
    </div>
    <h6 style={{ color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>{title}</h6>
    
    {/* EL VALOR: Aquí aplicamos el color "money" (Rojo en Dark) */}
    <h3 style={{ color: colors.money, fontWeight: '900', margin: 0, fontSize: '2.8rem', fontFamily: 'monospace' }}>{value}</h3>
  </div>
);

// --- MODAL CONFIRMACIÓN ---
const ConfirmationModal = ({ show, onClose, onConfirm, title, message, colors }) => {
    if (!show) return null;
    return (
      <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(5px)', zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ borderRadius: '20px', border: `1px solid ${colors.borderColor}`, backgroundColor: colors.cardBg, boxShadow: colors.cardShadow }}>
            <div className="modal-header border-0 pb-0 pt-4 px-4">
              <h5 className="modal-title fw-bold" style={{ color: colors.textMain }}>{title}</h5>
              <button type="button" className="btn-close" style={{filter: colors.bg === '#050505' ? 'invert(1)' : 'none'}} onClick={onClose}></button>
            </div>
            <div className="modal-body px-4 pt-3 pb-4">
              <p style={{color: colors.textSecondary, fontSize: '1.1rem'}}>{message}</p>
            </div>
            <div className="modal-footer border-0 px-4 pb-4">
              <button className="btn rounded-pill px-4 fw-bold" style={{backgroundColor: colors.elementBg, color: colors.textMain, border: `1px solid ${colors.borderColor}`}} onClick={onClose}>Cancelar</button>
              <button className="btn rounded-pill px-4 fw-bold text-white shadow" style={{backgroundColor: colors.primary, border: 'none'}} onClick={onConfirm}>Confirmar</button>
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
      fontFamily: '"DM Sans", "Nunito", sans-serif', // Fuente más moderna
      padding: '40px 20px',
      color: colors.textMain,
      transition: 'all 0.4s ease'
    },
    headerTitle: {
      background: colors.primaryGradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontWeight: '900',
      fontSize: 'clamp(2.5rem, 5vw, 4rem)',
      marginBottom: '10px',
      letterSpacing: '-2px',
      textShadow: isDark ? '0 0 30px rgba(255, 23, 68, 0.4)' : 'none' // Glow en el título
    },
    navPillsContainer: {
      backgroundColor: colors.cardBg,
      borderRadius: '50px',
      padding: '6px',
      display: 'inline-flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '5px',
      marginBottom: '40px',
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
      transition: 'all 0.3s ease',
      fontSize: '0.9rem'
    },
    navLinkActive: {
      background: colors.primaryGradient,
      color: 'white',
      boxShadow: isDark ? '0 0 15px rgba(255, 23, 68, 0.5)' : '0 4px 15px rgba(233, 30, 99, 0.3)',
    },
    card: {
      backgroundColor: colors.cardBg,
      color: colors.textMain,
      borderRadius: '20px',
      border: `1px solid ${colors.borderColor}`,
      boxShadow: colors.cardShadow,
      padding: '35px',
      marginBottom: '30px',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease'
    },
    // --- ESTILOS DE TABLA ---
    table: {
       '--bs-table-bg': 'transparent', 
       '--bs-table-color': colors.textMain,
       '--bs-table-border-color': colors.borderColor,
       width: '100%',
       borderCollapse: 'separate', 
       borderSpacing: '0 10px'
    },
    tableHeader: {
      backgroundColor: 'transparent',
      color: colors.tableHeaderText,
      fontWeight: '800',
      border: 'none',
      textTransform: 'uppercase',
      fontSize: '0.75rem',
      letterSpacing: '1.5px',
      padding: '15px'
    },
    tableRow: {
       backgroundColor: colors.elementBg,
       boxShadow: isDark ? '0 4px 10px rgba(0,0,0,0.3)' : '0 2px 5px rgba(0,0,0,0.02)',
       borderRadius: '12px',
       transition: 'transform 0.2s',
    },
    tableCell: {
       padding: '20px 20px',
       verticalAlign: 'middle',
       border: 'none', 
       color: colors.textMain,
       firstTopLeftRadius: '12px',
    },
    input: {
       backgroundColor: colors.elementBg,
       color: colors.textMain,
       border: `1px solid ${colors.borderColor}`,
       padding: '14px 20px',
       borderRadius: '15px',
       width: '100%',
       outline: 'none',
       fontSize: '1rem',
       fontWeight: '600',
    },
    // --- BOTONES ---
    btnAdd: {
      background: colors.primaryGradient,
      border: 'none',
      borderRadius: '50px',
      color: 'white',
      padding: '12px 35px',
      fontWeight: '800',
      fontSize: '0.9rem',
      letterSpacing: '1px',
      boxShadow: isDark ? '0 0 20px rgba(255, 23, 68, 0.4)' : '0 5px 20px rgba(233, 30, 99, 0.3)',
      textTransform: 'uppercase'
    },
    btnControl: (bgColor, textColor) => ({
        backgroundColor: bgColor,
        color: textColor,
        border: 'none',
        padding: '8px 14px',
        borderRadius: '8px',
        fontWeight: '700',
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        marginRight: '6px',
        marginBottom: '6px',
        cursor: 'pointer'
    }),
    btnAction: (color, isOutline = true) => ({
      backgroundColor: isOutline ? 'transparent' : color,
      border: `2px solid ${color}`,
      color: isOutline ? color : 'white',
      borderRadius: '10px',
      padding: '6px 16px',
      fontWeight: '700',
      fontSize: '0.8rem',
      marginRight: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }),
    renderBadge: (text, bg, txt) => (
        <span style={{
            backgroundColor: bg,
            color: txt,
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '0.7rem',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            border: `1px solid ${txt}20` // Borde muy sutil
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
        
        {/* HEADER */}
        <div className="text-center mb-5 pt-3">
          <h1 style={styles.headerTitle}>🍩 Miss Donitas Admin</h1>
          <div style={{
              display: 'inline-block',
              padding: '8px 24px',
              borderRadius: '30px',
              background: isDark ? 'rgba(255, 23, 68, 0.1)' : 'rgba(233, 30, 99, 0.1)',
              border: `1px solid ${isDark ? colors.primary : 'transparent'}`,
              boxShadow: isDark ? '0 0 15px rgba(255, 23, 68, 0.3)' : 'none'
          }}>
            <p style={{color: colors.primary, fontWeight: '800', margin: 0, fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase'}}>
               {isDark ? '🔥 MODO PICANTE ACTIVADO' : '🧁 MODO DULCE'}
            </p>
          </div>
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
                <button className="btn" style={styles.btnAdd} onClick={() => handleOpenProductModal()}>+ Nuevo Producto</button>
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
                      <tr key={p.id} style={styles.tableRow}>
                        <td style={{...styles.tableCell, borderRadius: '12px 0 0 12px'}}>
                            <div className="fw-bold" style={{color: colors.textMain, fontSize: '1.05rem'}}>{p.nombre}</div>
                            <small style={{color: colors.textSecondary}}>{p.categoria}</small>
                        </td>
                        {/* PRECIO: USAMOS LA VARIABLE COLORS.MONEY (ROJO EN DARK) */}
                        <td style={{...styles.tableCell, color: colors.money, fontWeight: '900', fontSize: '1.25rem', fontFamily: 'monospace'}}>
                            ${Number(p.precio).toFixed(2)}
                        </td>
                        <td style={styles.tableCell}>
                            {p.stock <= 5 
                             ? styles.renderBadge(`Bajo: ${p.stock}`, colors.badgeDangerBg, colors.badgeDangerTxt)
                             : <span style={{color: colors.textMain, fontWeight: 'bold'}}>{p.stock} u.</span>}
                        </td>
                        <td style={styles.tableCell}>
                            {p.en_oferta 
                             ? styles.renderBadge(`-${p.descuento_porcentaje}%`, colors.badgeInfoBg, colors.badgeInfoTxt)
                             : <span style={{color: colors.textSecondary, fontSize: '0.9rem'}}>Normal</span>}
                        </td>
                        <td style={{...styles.tableCell, borderRadius: '0 12px 12px 0'}} className="text-center">
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
                   <span style={{
                       backgroundColor: colors.primary, color: 'white', padding: '10px 20px', 
                       borderRadius: '30px', fontWeight: 'bold', boxShadow: `0 0 15px ${colors.primary}`
                   }}>
                     {pedidos.filter(p => p.estado === 'Pendiente').length} PEDIDOS PENDIENTES
                   </span>
               )}
             </div>
             <div className="table-responsive">
               <table className="table" style={styles.table}>
                 <thead>
                   <tr>
                     <th style={{...styles.tableHeader, borderRadius: '15px 0 0 15px'}}>ID / Cliente</th>
                     <th style={styles.tableHeader}>Total (MXN)</th>
                     <th style={styles.tableHeader}>Método</th>
                     <th style={styles.tableHeader}>Status</th>
                     <th style={{...styles.tableHeader, borderRadius: '0 15px 15px 0'}}>Control de Cocina</th>
                   </tr>
                 </thead>
                 <tbody>
                   {pedidos.map((p) => (
                     <tr key={p.id} style={styles.tableRow}>
                       <td style={{...styles.tableCell, borderRadius: '12px 0 0 12px'}}>
                          <div className="d-flex align-items-center">
                            <span className="fw-bold me-3 px-2 py-1 rounded" style={{color: colors.primary, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.elementBg, border: `1px solid ${colors.borderColor}`}}>#{p.id}</span>
                            <div>
                                <div className="fw-bold" style={{color: colors.textMain}}>{p.nombre_cliente}</div>
                                <small style={{color: colors.textSecondary}}>{new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                            </div>
                          </div>
                       </td>
                       {/* TOTAL DINERO EN ROJO EN DARK MODE */}
                       <td style={{...styles.tableCell, color: colors.money, fontWeight: '900', fontSize: '1.3rem', fontFamily: 'monospace'}}>${Number(p.total).toFixed(2)}</td>
                       <td style={styles.tableCell}>
                         {p.tipo_orden === 'domicilio' 
                           ? styles.renderBadge('🛵 Domicilio', colors.badgeInfoBg, colors.badgeInfoTxt)
                           : styles.renderBadge('🏪 Recoger', colors.badgeWarnBg, colors.badgeWarnTxt)}
                       </td>
                       <td style={styles.tableCell}>
                          {p.estado === 'Pendiente' 
                             ? styles.renderBadge('⏳ Pendiente', colors.badgeDangerBg, colors.badgeDangerTxt)
                             : (p.estado === 'Completado' 
                                ? styles.renderBadge('✅ Entregado', colors.badgeSuccessBg, colors.badgeSuccessTxt)
                                : styles.renderBadge(p.estado, colors.elementBg, colors.textMain))}
                       </td>
                       <td style={{...styles.tableCell, borderRadius: '0 12px 12px 0'}}>
                           <div className="d-flex flex-wrap">
                               <button style={styles.btnControl(colors.elementBg, colors.textMain)} onClick={() => {setSelectedOrderDetails(p); setShowDetailsModal(true);}}>Ver</button>
                               {p.estado !== 'Completado' && (
                                   <>
                                       <button style={styles.btnControl(colors.badgeWarnBg, colors.badgeWarnTxt)} onClick={() => handleUpdateStatus(p.id, 'En Preparacion')}>Prep</button>
                                       {p.tipo_orden === 'domicilio' 
                                            ? <button style={styles.btnControl(colors.badgeInfoBg, colors.badgeInfoTxt)} onClick={() => handleUpdateStatus(p.id, 'En Camino')}>Moto</button> 
                                            : <button style={styles.btnControl(colors.badgeSuccessBg, colors.badgeSuccessTxt)} onClick={() => handleUpdateStatus(p.id, 'Listo')}>Listo</button>}
                                       <button style={styles.btnControl(colors.badgeSuccessTxt, isDark ? 'black' : 'white')} onClick={() => handleUpdateStatus(p.id, 'Completado')}>OK</button>
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
                       border: `1px solid ${combo.esta_activo ? colors.borderColor : colors.badgeDangerTxt}`, 
                       borderRadius: '20px', 
                       padding: '25px', 
                       backgroundColor: colors.elementBg, 
                       color: colors.textMain, 
                       boxShadow: colors.cardShadow,
                       position: 'relative',
                       overflow: 'hidden'
                    }}>
                     <div style={{position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: combo.esta_activo ? colors.badgeSuccessTxt : colors.badgeDangerTxt}}></div>
                     
                     <div className="d-flex justify-content-between align-items-start mb-3 ps-2">
                       <h5 className="fw-bold mb-0" style={{color: colors.textMain}}>{combo.nombre}</h5>
                       {combo.esta_activo 
                           ? styles.renderBadge('ACTIVO', colors.badgeSuccessBg, colors.badgeSuccessTxt)
                           : styles.renderBadge('OCULTO', colors.badgeDangerBg, colors.badgeDangerTxt)}
                     </div>
                     {/* PRECIO ROJO */}
                     <h4 style={{color: colors.money, fontWeight: '800', fontSize: '2rem', paddingLeft: '8px', fontFamily: 'monospace'}}>${Number(combo.precio).toFixed(2)}</h4>
                     <p className="ps-2" style={{color: colors.textSecondary, fontSize: '0.9rem'}}>{combo.descripcion || 'Sin descripción'}</p>
                     
                     <div className="mt-4 d-flex gap-2 ps-2">
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
                     color={colors.money} // ROJO EN DARK
                     icon="🔥" 
                     styles={styles} 
                     colors={colors} 
                   />
                 </div>
                 <div className="col-md-6">
                   <StatCard 
                     title="Ticket Promedio" 
                     value="$150.00" 
                     color={colors.primary} 
                     icon="📈" 
                     styles={styles} 
                     colors={colors} 
                   />
                 </div>
               </div>
               
               <h5 className="mb-4 fw-bold" style={{color: colors.textMain}}>Rendimiento Visual</h5>
               <div style={{padding: '25px', backgroundColor: colors.elementBg, borderRadius: '20px', border: `1px solid ${colors.borderColor}`}}>
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
      <ConfirmationModal show={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmAction} title={confirmTitle} message={confirmMessage} colors={colors} />

      {/* MODAL PURGAR */}
      {showPurgeModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060, backdropFilter: 'blur(10px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 overflow-hidden" style={{backgroundColor: colors.cardBg, color: colors.textMain, border: `1px solid ${colors.primary}`, boxShadow: `0 0 50px ${colors.primary}50`}}>
              <div className="modal-header text-white border-0" style={{backgroundColor: '#D50000'}}><h5 className="modal-title fw-bold">⚠️ ZONA DE PELIGRO</h5><button type="button" className="btn-close btn-close-white" onClick={() => setShowPurgeModal(false)}></button></div>
              <div className="modal-body p-4">
                <p>Esta acción borrará todo el historial. Escribe <strong>ELIMINAR</strong> para confirmar:</p>
                <input 
                    type="text" 
                    style={styles.input}
                    value={purgeConfirmText} 
                    onChange={(e) => setPurgeConfirmText(e.target.value)} 
                    placeholder="ELIMINAR"
                />
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-danger w-100 rounded-pill shadow-lg fw-bold" onClick={handlePurge} disabled={purgeConfirmText !== 'ELIMINAR'}>CONFIRMAR DESTRUCCIÓN</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;