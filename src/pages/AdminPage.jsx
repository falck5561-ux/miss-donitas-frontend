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

// --- PALETA DE COLORES INTELIGENTE (ALTO CONTRASTE) ---
const getThemeColors = (mode) => {
  const isDark = mode === 'dark';

  return {
    // === FONDOS ===
    // Light: Crema suave (más limpio que el rosado anterior)
    // Dark: Gris Carbono Profundo (Mejor que negro puro #000 para leer)
    bg: isDark ? '#121212' : '#F9F9F9', 
    
    // Cards
    cardBg: isDark ? '#1E1E1E' : '#FFFFFF',
    
    // Elementos (Inputs, filas alternas)
    elementBg: isDark ? '#2C2C2C' : '#F3F4F6',

    // === TEXTOS (PRIORIDAD LEGIBILIDAD) ===
    // Dark: BLANCO PURO. El rojo sobre negro cansa la vista.
    // Light: CHOCOLATE OSCURO. Da el toque de "Donas".
    textMain: isDark ? '#FFFFFF' : '#2D2424', 
    
    // Subtextos
    textSecondary: isDark ? '#B0B0B0' : '#6c757d',

    // === BORDES ===
    // Dark: Gris acero para separar secciones sutilmente
    // Light: Gris muy suave
    borderColor: isDark ? '#424242' : '#DEE2E6',

    // === MARCA Y ACENTOS ===
    // El color principal de la marca
    primary: '#E91E63', // Rosa vibrante
    
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #FF5252 0%, #D50000 100%)' // Gradiente Lava (Rojo intenso)
      : 'linear-gradient(135deg, #FF4081 0%, #C2185B 100%)', // Gradiente Fresa

    // === DINERO (NUMEROS) ===
    // Dark: AMARILLO ORO (#FFD700). Sobre negro, el amarillo se ve increíble (Fuego).
    // Light: VERDE ESMERALDA. Clásico para dinero.
    money: isDark ? '#FFD700' : '#198754', 

    // === TABLAS ===
    tableHeaderBg: isDark ? '#252525' : '#E9ECEF',
    tableHeaderText: isDark ? '#FF5252' : '#495057', // Encabezados rojos en dark

    // === ESTADOS (Badges) ===
    // Ajustados para que el texto NUNCA se pierda
    badgeSuccessBg: isDark ? '#1B5E20' : '#D1E7DD',
    badgeSuccessTxt: isDark ? '#69F0AE' : '#0F5132',

    badgeWarnBg: isDark ? '#3E2723' : '#FFF3CD',
    badgeWarnTxt: isDark ? '#FFAB00' : '#664D03',

    badgeDangerBg: isDark ? '#370000' : '#F8D7DA',
    badgeDangerTxt: isDark ? '#FF8A80' : '#842029',
    
    badgeInfoBg: isDark ? '#013142' : '#CFF4FC',
    badgeInfoTxt: isDark ? '#4FC3F7' : '#055160',
  };
};

// --- COMPONENTE KPI (Tarjeta de Métricas) ---
const StatCard = ({ title, value, color, icon, styles, colors }) => (
  <div style={{
      ...styles.card, 
      borderBottom: `5px solid ${color}`, // Borde inferior grueso
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center',
      textAlign: 'center',
      height: '100%'
  }}>
    <div style={{ fontSize: '3rem', marginBottom: '15px', color: color }}>
      {icon}
    </div>
    <h6 style={{ color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1.5px' }}>{title}</h6>
    {/* El valor usa textMain para asegurar contraste máximo */}
    <h3 style={{ color: colors.textMain, fontWeight: '900', margin: 0, fontSize: '2.5rem' }}>{value}</h3>
  </div>
);

// --- MODAL CONFIRMACIÓN ---
const ConfirmationModal = ({ show, onClose, onConfirm, title, message, colors }) => {
    if (!show) return null;
    return (
      <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(3px)', zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ borderRadius: '24px', border: `1px solid ${colors.borderColor}`, backgroundColor: colors.cardBg, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div className="modal-header border-0 pb-0 pt-4 px-4">
              <h5 className="modal-title fw-bold" style={{ color: colors.textMain }}>{title}</h5>
              <button type="button" className="btn-close" style={{filter: colors.bg === '#121212' ? 'invert(1)' : 'none'}} onClick={onClose}></button>
            </div>
            <div className="modal-body px-4 pt-3 pb-4">
              <p style={{color: colors.textSecondary, fontSize: '1.1rem'}}>{message}</p>
            </div>
            <div className="modal-footer border-0 px-4 pb-4">
              <button className="btn rounded-pill px-4 fw-bold" style={{backgroundColor: colors.elementBg, color: colors.textMain, border: `1px solid ${colors.borderColor}`}} onClick={onClose}>Cancelar</button>
              <button className="btn rounded-pill px-4 fw-bold text-white shadow" style={{backgroundColor: '#D32F2F', border: 'none'}} onClick={onConfirm}>Confirmar</button>
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
      fontSize: 'clamp(2rem, 5vw, 3.5rem)', // Responsivo
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
      gap: '8px',
      marginBottom: '40px',
      border: `1px solid ${colors.borderColor}`,
      boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.05)'
    },
    navLink: {
      color: colors.textSecondary,
      borderRadius: '30px',
      padding: '10px 24px',
      fontWeight: '700',
      border: 'none',
      background: 'transparent',
      transition: 'all 0.3s ease',
      fontSize: '0.95rem'
    },
    navLinkActive: {
      background: colors.primaryGradient,
      color: 'white',
      boxShadow: '0 4px 15px rgba(233, 30, 99, 0.4)',
      transform: 'translateY(-2px)'
    },
    card: {
      backgroundColor: colors.cardBg,
      color: colors.textMain,
      borderRadius: '24px',
      border: `1px solid ${colors.borderColor}`,
      boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.6)' : '0 10px 40px rgba(0,0,0,0.05)',
      padding: '35px',
      marginBottom: '30px'
    },
    // --- ESTILOS DE TABLA ROBUSTOS ---
    table: {
       '--bs-table-bg': 'transparent', 
       '--bs-table-color': colors.textMain,
       '--bs-table-border-color': colors.borderColor,
       width: '100%',
       borderCollapse: 'separate', 
       borderSpacing: '0 8px' // Espacio entre filas
    },
    tableHeader: {
      backgroundColor: colors.tableHeaderBg,
      color: colors.tableHeaderText,
      fontWeight: '800',
      border: 'none',
      textTransform: 'uppercase',
      fontSize: '0.8rem',
      letterSpacing: '1px',
      padding: '15px'
    },
    tableRow: {
       backgroundColor: 'transparent',
       transition: 'transform 0.2s ease',
    },
    tableCell: {
       padding: '20px 15px',
       verticalAlign: 'middle',
       backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'transparent', // Sutil fondo en filas dark
       color: colors.textMain, // Forzamos color para evitar herencias de bootstrap
       borderBottom: `1px solid ${colors.borderColor}`,
       borderTop: `1px solid ${colors.borderColor}`,
    },
    // --- ELEMENTOS DE FORMULARIO (INPUTS) ---
    // Esto arregla el problema de "no se ve cuando escribo"
    input: {
       backgroundColor: colors.elementBg,
       color: colors.textMain,
       border: `1px solid ${colors.borderColor}`,
       padding: '12px 16px',
       borderRadius: '12px',
       width: '100%',
       outline: 'none',
       fontSize: '1rem',
       fontWeight: '500',
       transition: 'border-color 0.2s'
    },
    // --- BOTONES ---
    btnAdd: {
      background: colors.primaryGradient,
      border: 'none',
      borderRadius: '50px',
      color: 'white',
      padding: '12px 30px',
      fontWeight: '700',
      fontSize: '1rem',
      boxShadow: '0 5px 20px rgba(233, 30, 99, 0.3)'
    },
    btnControl: (bgColor, textColor) => ({
        backgroundColor: bgColor,
        color: textColor,
        border: 'none',
        padding: '8px 16px',
        borderRadius: '10px',
        fontWeight: '700',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        marginRight: '6px',
        marginBottom: '6px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
    }),
    btnAction: (color, isOutline = true) => ({
      backgroundColor: isOutline ? 'transparent' : color,
      border: `2px solid ${color}`,
      color: isOutline ? color : 'white',
      borderRadius: '12px',
      padding: '8px 20px',
      fontWeight: '700',
      fontSize: '0.85rem',
      marginRight: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }),
    // Helper para badges (etiquetas)
    renderBadge: (text, bg, txt) => (
        <span style={{
            backgroundColor: bg,
            color: txt,
            padding: '8px 16px',
            borderRadius: '30px',
            fontSize: '0.75rem',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'inline-block',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
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
              padding: '10px 20px',
              borderRadius: '20px',
              backgroundColor: isDark ? 'rgba(255, 82, 82, 0.1)' : 'rgba(233, 30, 99, 0.1)',
              border: `1px solid ${isDark ? colors.primary : 'transparent'}`
          }}>
            <p style={{color: isDark ? '#FF8A80' : colors.primary, fontWeight: '800', margin: 0, fontSize: '0.9rem', letterSpacing: '2px', textTransform: 'uppercase'}}>
               {isDark ? '🔥 MODO PICANTE (DARK)' : '🧁 MODO DULCE (LIGHT)'}
            </p>
          </div>
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

          {/* === INVENTARIO === */}
          {!loading && !error && activeTab === 'productos' && (
            <div>
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                <h3 className="fw-bold m-0" style={{color: colors.textMain}}>Inventario de Donas</h3>
                <button className="btn shadow-sm" style={styles.btnAdd} onClick={() => handleOpenProductModal()}>+ Nuevo Producto</button>
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
                        <td style={styles.tableCell}>
                            <div className="fw-bold" style={{color: colors.textMain, fontSize: '1.05rem'}}>{p.nombre}</div>
                            <small style={{color: colors.textSecondary}}>{p.categoria}</small>
                        </td>
                        {/* PRECIO: Amarillo en Dark, Verde en Light */}
                        <td style={{...styles.tableCell, color: colors.money, fontWeight: '900', fontSize: '1.2rem'}}>
                            ${Number(p.precio).toFixed(2)}
                        </td>
                        <td style={styles.tableCell}>
                            {p.stock <= 5 
                             ? styles.renderBadge(`Bajo: ${p.stock}`, colors.badgeDangerBg, colors.badgeDangerTxt)
                             : <span style={{color: colors.textMain, fontWeight: 'bold'}}>{p.stock} u.</span>}
                        </td>
                        <td style={styles.tableCell}>
                            {p.en_oferta 
                             ? styles.renderBadge(`Oferta -${p.descuento_porcentaje}%`, colors.badgeInfoBg, colors.badgeInfoTxt)
                             : styles.renderBadge('Normal', colors.elementBg, colors.textSecondary)}
                        </td>
                        <td style={styles.tableCell} className="text-center">
                          <button style={styles.btnAction(isDark ? '#4FC3F7' : '#039BE5', true)} onClick={() => handleOpenProductModal(p)}>Editar</button>
                          <button style={styles.btnAction(colors.badgeDangerTxt, true)} onClick={() => handleDeleteProducto(p)}>Ocultar</button>
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
               {pedidos.filter(p => p.estado === 'Pendiente').length > 0 && (
                   styles.renderBadge(`${pedidos.filter(p => p.estado === 'Pendiente').length} Por Atender`, colors.badgeDangerBg, colors.badgeDangerTxt)
               )}
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
                       <td style={styles.tableCell}>
                          <div className="d-flex align-items-center">
                            <span className="fw-bold me-3 px-2 py-1 rounded" style={{color: colors.primary, backgroundColor: colors.elementBg, border: `1px solid ${colors.borderColor}`}}>#{p.id}</span>
                            <div>
                                <div className="fw-bold" style={{color: colors.textMain}}>{p.nombre_cliente}</div>
                                <small style={{color: colors.textSecondary}}>{new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                            </div>
                          </div>
                       </td>
                       {/* TOTAL DINERO */}
                       <td style={{...styles.tableCell, color: colors.money, fontWeight: '900', fontSize: '1.2rem'}}>${Number(p.total).toFixed(2)}</td>
                       <td style={styles.tableCell}>
                         {p.tipo_orden === 'domicilio' 
                           ? styles.renderBadge('🛵 Domicilio', colors.badgeInfoBg, colors.badgeInfoTxt)
                           : styles.renderBadge('🏪 Recoger', colors.badgeWarnBg, colors.badgeWarnTxt)}
                       </td>
                       <td style={styles.tableCell}>
                          {p.estado === 'Pendiente' 
                             ? styles.renderBadge('⏳ Pendiente', colors.badgeWarnBg, colors.badgeWarnTxt)
                             : (p.estado === 'Completado' 
                                ? styles.renderBadge('✅ Completado', colors.badgeSuccessBg, colors.badgeSuccessTxt)
                                : styles.renderBadge(p.estado, colors.elementBg, colors.textMain))}
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
                                       <button style={styles.btnControl(isDark ? '#1B5E20' : '#2E7D32', 'white')} onClick={() => handleUpdateStatus(p.id, 'Completado')}>OK</button>
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
                       border: `1px solid ${combo.esta_activo ? colors.borderColor : colors.badgeDangerTxt}`, 
                       borderRadius: '24px', 
                       padding: '30px', 
                       backgroundColor: colors.elementBg, 
                       color: colors.textMain, 
                       boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)',
                       position: 'relative',
                       overflow: 'hidden'
                    }}>
                     {/* Indicador visual de estado */}
                     <div style={{position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', backgroundColor: combo.esta_activo ? colors.badgeSuccessTxt : colors.badgeDangerTxt}}></div>
                     
                     <div className="d-flex justify-content-between align-items-start mb-3 ps-2">
                       <h5 className="fw-bold mb-0" style={{color: colors.textMain}}>{combo.nombre}</h5>
                       {combo.esta_activo 
                           ? styles.renderBadge('ACTIVO', colors.badgeSuccessBg, colors.badgeSuccessTxt)
                           : styles.renderBadge('OCULTO', colors.badgeDangerBg, colors.badgeDangerTxt)}
                     </div>
                     <h4 style={{color: colors.primary, fontWeight: '800', fontSize: '2.2rem', paddingLeft: '8px'}}>${Number(combo.precio).toFixed(2)}</h4>
                     <p className="ps-2" style={{color: colors.textSecondary, fontSize: '0.95rem'}}>{combo.descripcion || 'Sin descripción'}</p>
                     
                     <div className="mt-4 d-flex gap-2 ps-2">
                       <button style={{...styles.btnAction(isDark ? '#4FC3F7' : '#039BE5', true), flex:1}} onClick={() => handleOpenComboModal(combo)}>Editar</button>
                       {combo.esta_activo && <button style={{...styles.btnAction(colors.badgeDangerTxt, true), flex:1}} onClick={() => handleDeleteCombo(combo)}>Ocultar</button>}
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
                     color={colors.money} 
                     icon="💰" 
                     styles={styles} 
                     colors={colors} 
                   />
                 </div>
                 <div className="col-md-6">
                   <StatCard 
                     title="Promedio Venta" 
                     value="$150.00" 
                     color={colors.primary} 
                     icon="📈" 
                     styles={styles} 
                     colors={colors} 
                   />
                 </div>
               </div>
               
               <h5 className="mb-4 fw-bold" style={{color: colors.textMain}}>Gráfica de Rendimiento</h5>
               <div style={{padding: '25px', backgroundColor: colors.elementBg, borderRadius: '24px', border: `1px solid ${colors.borderColor}`}}>
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
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060, backdropFilter: 'blur(5px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 overflow-hidden" style={{backgroundColor: colors.cardBg, color: colors.textMain, border: `1px solid ${colors.borderColor}`, boxShadow: '0 20px 50px rgba(0,0,0,0.5)'}}>
              <div className="modal-header text-white border-0" style={{backgroundColor: '#D32F2F'}}><h5 className="modal-title fw-bold">⚠️ Borrar Todo</h5><button type="button" className="btn-close btn-close-white" onClick={() => setShowPurgeModal(false)}></button></div>
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
                <button className="btn btn-danger w-100 rounded-pill shadow" onClick={handlePurge} disabled={purgeConfirmText !== 'ELIMINAR'}>Confirmar Borrado Definitivo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;