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

// --- PALETA MAESTRA DE COLORES (SIN BLANCO EN DARK MODE) ---
const getThemeColors = (mode) => {
  const isDark = mode === 'dark';

  return {
    // === FONDOS ===
    // Dark: Negro Obsidiana con tinte rojo imperceptible
    // Light: Gris azulado muy suave
    bg: isDark ? '#050202' : '#F0F2F5', 
    
    // Cards (Efecto cristal en Light, Magma sólido en Dark)
    cardBg: isDark ? '#140505' : '#FFFFFF',
    
    // Elementos (Filas, inputs)
    elementBg: isDark ? '#260a0a' : '#F8F9FA',

    // === TEXTOS (LA REGLA DE ORO: NO BLANCO) ===
    // Dark Text Main: 'Hueso Rojo' (#FFEBEB) o Oro Pálido (#FFF8E1). Usaré un rosado muy pálido casi blanco pero NO blanco.
    textMain: isDark ? '#FFDAD4' : '#1A237E', 
    
    // Dark Text Secondary: Naranja quemado
    textSecondary: isDark ? '#FF8A65' : '#7986CB',

    // Dark Headers: ORO NEÓN para resaltar sobre el rojo
    textHeader: isDark ? '#FFD740' : '#283593',

    // === BORDES Y SEPARADORES ===
    borderColor: isDark ? '#590d0d' : '#E8EAF6',
    
    // === MARCA PRINCIPAL ===
    // Dark: ROJO LÁSER
    primary: isDark ? '#FF3D00' : '#E91E63', 

    // Degradados
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #FF3D00 0%, #D50000 100%)' // Fuego
      : 'linear-gradient(135deg, #FF4081 0%, #880E4F 100%)', // Berry

    // === DINERO (IMPORTANTE) ===
    // Dark: AMARILLO ORO (El dinero brilla en la oscuridad)
    // Light: VERDE ESMERALDA
    money: isDark ? '#FFD600' : '#00C853', 

    // === TABLAS ===
    tableHeaderBg: 'transparent',
    tableHeaderText: isDark ? '#FF5252' : '#9FA8DA', // Rojizo en dark, Lavanda en light

    // === SHADOWS (GLOW NEÓN) ===
    cardShadow: isDark 
        ? '0 0 20px rgba(255, 61, 0, 0.15)' // Resplandor Naranja/Rojo
        : '0 10px 30px rgba(0, 0, 0, 0.05)',

    // === BADGES (ESTADOS) - SIN TEXTO BLANCO ===
    badgeSuccessBg: isDark ? '#1b3320' : '#E8F5E9',
    badgeSuccessTxt: isDark ? '#69F0AE' : '#2E7D32',

    badgeWarnBg: isDark ? '#332b00' : '#FFF8E1',
    badgeWarnTxt: isDark ? '#FFAB00' : '#F57F17',

    badgeDangerBg: isDark ? '#3b0b0b' : '#FFEBEE',
    badgeDangerTxt: isDark ? '#FF5252' : '#C62828',
    
    badgeInfoBg: isDark ? '#0d2b3a' : '#E3F2FD',
    badgeInfoTxt: isDark ? '#40C4FF' : '#1565C0',
  };
};

// --- COMPONENTE KPI MEJORADO (VISUALMENTE IMPACTANTE) ---
const StatCard = ({ title, value, color, icon, styles, colors }) => (
  <div style={{
      ...styles.card, 
      border: `1px solid ${colors.borderColor}`,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      minHeight: '180px'
  }}>
    {/* Círculo de fondo brillante */}
    <div style={{
        position: 'absolute', top: '-20%', right: '-10%', 
        width: '150px', height: '150px', borderRadius: '50%',
        backgroundColor: color, opacity: 0.1, filter: 'blur(30px)'
    }}></div>

    <div className="d-flex align-items-center mb-3">
        <div style={{
            backgroundColor: `${color}20`, // 20% opacidad
            padding: '12px',
            borderRadius: '12px',
            color: color,
            fontSize: '2rem',
            marginRight: '15px'
        }}>
            {icon}
        </div>
        <h6 style={{ 
            color: colors.textSecondary, 
            fontWeight: '700', 
            textTransform: 'uppercase', 
            fontSize: '0.85rem', 
            letterSpacing: '1px',
            margin: 0
        }}>{title}</h6>
    </div>
    
    {/* EL VALOR (NÚMERO) */}
    <h3 style={{ 
        color: colors.textMain, // Usa el color "Hueso Rojo" u Oro, NO BLANCO
        fontWeight: '900', 
        margin: 0, 
        fontSize: '3rem', 
        fontFamily: '"JetBrains Mono", monospace', // Fuente tipo ticket
        textShadow: colors.bg === '#050202' ? `0 0 10px ${color}40` : 'none'
    }}>{value}</h3>
  </div>
);

// --- MODAL CONFIRMACIÓN ---
const ConfirmationModal = ({ show, onClose, onConfirm, title, message, colors }) => {
    if (!show) return null;
    return (
      <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)', zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ 
              borderRadius: '24px', 
              border: `1px solid ${colors.primary}`, 
              backgroundColor: colors.cardBg, 
              boxShadow: `0 0 50px ${colors.primary}30` 
          }}>
            <div className="modal-header border-0 pb-0 pt-4 px-4">
              <h4 className="modal-title fw-bold" style={{ color: colors.textHeader }}>{title}</h4>
              <button type="button" className="btn-close" style={{ backgroundColor: colors.textSecondary, opacity: 0.5 }} onClick={onClose}></button>
            </div>
            <div className="modal-body px-4 pt-3 pb-4">
              <p style={{color: colors.textMain, fontSize: '1.1rem'}}>{message}</p>
            </div>
            <div className="modal-footer border-0 px-4 pb-4">
              <button className="btn rounded-pill px-4 fw-bold" style={{backgroundColor: 'transparent', color: colors.textSecondary, border: `1px solid ${colors.borderColor}`}} onClick={onClose}>Cancelar</button>
              <button className="btn rounded-pill px-4 fw-bold shadow" style={{backgroundColor: colors.primary, color: colors.bg === '#050202' ? '#000' : '#FFF', border: 'none'}} onClick={onConfirm}>Confirmar</button>
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
      fontFamily: '"Manrope", "Nunito", sans-serif',
      padding: '40px 20px',
      color: colors.textMain,
      transition: 'background-color 0.4s ease'
    },
    headerTitle: {
      background: colors.primaryGradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontWeight: '900',
      fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
      marginBottom: '10px',
      letterSpacing: '-2px',
      filter: isDark ? 'drop-shadow(0 0 15px rgba(255, 61, 0, 0.4))' : 'none'
    },
    navPillsContainer: {
      backgroundColor: colors.elementBg,
      borderRadius: '20px',
      padding: '8px',
      display: 'inline-flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '8px',
      marginBottom: '40px',
      border: `1px solid ${colors.borderColor}`,
    },
    navLink: {
      color: colors.textSecondary,
      borderRadius: '14px',
      padding: '12px 24px',
      fontWeight: '700',
      border: 'none',
      background: 'transparent',
      transition: 'all 0.3s ease',
      fontSize: '0.95rem'
    },
    navLinkActive: {
      background: colors.primary,
      color: isDark ? '#000000' : '#FFFFFF', // Texto negro en botón activo dark para contraste máximo
      boxShadow: isDark ? `0 0 20px ${colors.primary}` : '0 4px 10px rgba(0,0,0,0.1)',
      transform: 'scale(1.05)'
    },
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: '24px',
      border: `1px solid ${colors.borderColor}`,
      boxShadow: colors.cardShadow,
      padding: '40px',
      marginBottom: '30px',
      transition: 'all 0.3s ease'
    },
    // --- TABLA FUTURISTA ---
    table: {
       '--bs-table-bg': 'transparent', 
       width: '100%',
       borderCollapse: 'separate', 
       borderSpacing: '0 12px' // Separación entre filas
    },
    tableHeader: {
      backgroundColor: 'transparent',
      color: colors.tableHeaderText,
      fontWeight: '800',
      border: 'none',
      textTransform: 'uppercase',
      fontSize: '0.7rem',
      letterSpacing: '2px',
      padding: '0 20px 10px 20px'
    },
    tableRow: {
       backgroundColor: colors.elementBg,
       boxShadow: isDark ? 'none' : '0 2px 5px rgba(0,0,0,0.02)',
       transition: 'transform 0.2s',
       cursor: 'default'
    },
    tableCell: {
       padding: '20px',
       verticalAlign: 'middle',
       borderTop: `1px solid ${colors.borderColor}`,
       borderBottom: `1px solid ${colors.borderColor}`,
       color: colors.textMain,
    },
    // --- CONTROLES ---
    btnAdd: {
      background: colors.primaryGradient,
      border: 'none',
      borderRadius: '16px',
      color: isDark ? '#000' : '#FFF', // Texto negro si el botón es brillante en dark
      padding: '14px 30px',
      fontWeight: '800',
      fontSize: '0.9rem',
      letterSpacing: '0.5px',
      boxShadow: isDark ? `0 0 25px ${colors.primary}60` : '0 10px 20px rgba(233, 30, 99, 0.2)',
    },
    btnAction: (color, isOutline = true) => ({
      backgroundColor: isOutline ? 'transparent' : color,
      border: `1px solid ${color}`,
      color: isOutline ? color : (isDark ? '#000' : '#FFF'),
      borderRadius: '10px',
      padding: '8px 16px',
      fontWeight: '700',
      fontSize: '0.8rem',
      marginRight: '8px',
      transition: 'all 0.2s'
    }),
    renderBadge: (text, bg, txt) => (
        <span style={{
            backgroundColor: bg,
            color: txt,
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            boxShadow: isDark ? `0 0 10px ${txt}20` : 'none',
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
  
  // States Modales...
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
  
  // Handlers...
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
          <h1 style={styles.headerTitle}>🍩 MISS DONITAS</h1>
          <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '10px 30px',
              borderRadius: '50px',
              background: isDark ? 'rgba(255, 61, 0, 0.1)' : 'white',
              border: `1px solid ${isDark ? colors.primary : colors.borderColor}`,
              boxShadow: isDark ? `0 0 20px ${colors.primary}40` : '0 5px 15px rgba(0,0,0,0.05)'
          }}>
            <span style={{fontSize: '1.2rem', marginRight: '10px'}}>{isDark ? '🌶️' : '🍬'}</span>
            <p style={{color: isDark ? colors.textHeader : colors.primary, fontWeight: '900', margin: 0, fontSize: '0.9rem', letterSpacing: '2px', textTransform: 'uppercase'}}>
               {isDark ? 'MODO PICANTE' : 'MODO DULCE'}
            </p>
          </div>
        </div>

        {/* NAV */}
        <div className="d-flex justify-content-center">
          <div style={styles.navPillsContainer}>
            {[
              { id: 'pedidosEnLinea', label: 'PEDIDOS' },
              { id: 'productos', label: 'INVENTARIO' },
              { id: 'combos', label: 'PROMOS' },
              { id: 'reporteGeneral', label: 'FINANZAS' },
              { id: 'reporteProductos', label: 'RANKING' }
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
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-5 gap-3">
                <h3 className="fw-bold m-0" style={{color: colors.textHeader}}>Catálogo Maestro</h3>
                <button style={styles.btnAdd} onClick={() => handleOpenProductModal()}>+ CREAR PRODUCTO</button>
              </div>
              <div className="table-responsive">
                <table className="table" style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{...styles.tableHeader, textAlign: 'left', paddingLeft: '30px'}}>Producto</th>
                      <th style={styles.tableHeader}>Precio Unit.</th>
                      <th style={styles.tableHeader}>Existencia</th>
                      <th style={styles.tableHeader}>Estado</th>
                      <th style={{...styles.tableHeader, textAlign: 'right', paddingRight: '30px'}}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((p) => (
                      <tr key={p.id} style={styles.tableRow}>
                        <td style={{...styles.tableCell, borderRadius: '16px 0 0 16px', borderLeft: `1px solid ${colors.borderColor}`, paddingLeft: '30px'}}>
                            <div className="fw-bold" style={{color: colors.textMain, fontSize: '1.1rem'}}>{p.nombre}</div>
                            <small style={{color: colors.textSecondary, textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '700'}}>{p.categoria}</small>
                        </td>
                        <td style={{...styles.tableCell, color: colors.money, fontWeight: '900', fontSize: '1.2rem', fontFamily: 'monospace'}}>
                            ${Number(p.precio).toFixed(2)}
                        </td>
                        <td style={styles.tableCell}>
                            {p.stock <= 5 
                             ? styles.renderBadge(`${p.stock} RESTANTES`, colors.badgeDangerBg, colors.badgeDangerTxt)
                             : <span style={{color: colors.textMain, fontWeight: 'bold'}}>{p.stock} uds.</span>}
                        </td>
                        <td style={styles.tableCell}>
                            {p.en_oferta 
                             ? styles.renderBadge(`OFERTA -${p.descuento_porcentaje}%`, colors.badgeInfoBg, colors.badgeInfoTxt)
                             : <span style={{color: colors.textSecondary, fontSize: '0.85rem', fontWeight: '600'}}>Precio Regular</span>}
                        </td>
                        <td style={{...styles.tableCell, borderRadius: '0 16px 16px 0', borderRight: `1px solid ${colors.borderColor}`, textAlign: 'right', paddingRight: '30px'}}>
                          <button style={styles.btnAction(colors.textHeader, true)} onClick={() => handleOpenProductModal(p)}>EDITAR</button>
                          <button style={styles.btnAction(colors.primary, false)} onClick={() => handleDeleteProducto(p)}>OCULTAR</button>
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
             <div className="d-flex justify-content-between align-items-center mb-5">
               <h3 className="fw-bold m-0" style={{color: colors.textHeader}}>Monitor de Órdenes</h3>
               {pedidos.filter(p => p.estado === 'Pendiente').length > 0 && (
                   <span style={{
                       backgroundColor: colors.primary, color: isDark ? '#000' : '#FFF', padding: '10px 25px', 
                       borderRadius: '30px', fontWeight: '900', boxShadow: `0 0 20px ${colors.primary}`,
                       fontSize: '0.9rem', letterSpacing: '1px'
                   }}>
                     ⚠️ {pedidos.filter(p => p.estado === 'Pendiente').length} POR ATENDER
                   </span>
               )}
             </div>
             <div className="table-responsive">
               <table className="table" style={styles.table}>
                 <thead>
                   <tr>
                     <th style={{...styles.tableHeader, paddingLeft: '30px'}}>Orden / Cliente</th>
                     <th style={styles.tableHeader}>Monto</th>
                     <th style={styles.tableHeader}>Tipo</th>
                     <th style={styles.tableHeader}>Status</th>
                     <th style={{...styles.tableHeader, textAlign: 'right', paddingRight: '30px'}}>Control de Cocina</th>
                   </tr>
                 </thead>
                 <tbody>
                   {pedidos.map((p) => (
                     <tr key={p.id} style={styles.tableRow}>
                       <td style={{...styles.tableCell, borderRadius: '16px 0 0 16px', borderLeft: `1px solid ${colors.borderColor}`, paddingLeft: '30px'}}>
                          <div className="d-flex align-items-center">
                            <span className="fw-bold me-3 px-3 py-2 rounded-3" style={{
                                color: colors.primary, 
                                backgroundColor: isDark ? '#1a0505' : colors.bg, 
                                border: `1px solid ${colors.primary}40`,
                                fontFamily: 'monospace', fontSize: '1.1rem'
                            }}>#{p.id}</span>
                            <div>
                                <div className="fw-bold" style={{color: colors.textMain, fontSize: '1.05rem'}}>{p.nombre_cliente}</div>
                                <small style={{color: colors.textSecondary}}>{new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                            </div>
                          </div>
                       </td>
                       <td style={{...styles.tableCell, color: colors.money, fontWeight: '900', fontSize: '1.35rem', fontFamily: 'monospace'}}>
                           ${Number(p.total).toFixed(2)}
                       </td>
                       <td style={styles.tableCell}>
                         {p.tipo_orden === 'domicilio' 
                           ? styles.renderBadge('🛵 MOTO', colors.badgeInfoBg, colors.badgeInfoTxt)
                           : styles.renderBadge('🏪 LOCAL', colors.badgeWarnBg, colors.badgeWarnTxt)}
                       </td>
                       <td style={styles.tableCell}>
                          {p.estado === 'Pendiente' 
                             ? styles.renderBadge('⏳ ESPERA', colors.badgeDangerBg, colors.badgeDangerTxt)
                             : (p.estado === 'Completado' 
                                ? styles.renderBadge('✅ LISTO', colors.badgeSuccessBg, colors.badgeSuccessTxt)
                                : styles.renderBadge(p.estado, colors.elementBg, colors.textMain))}
                       </td>
                       <td style={{...styles.tableCell, borderRadius: '0 16px 16px 0', borderRight: `1px solid ${colors.borderColor}`, textAlign: 'right', paddingRight: '30px'}}>
                           <div className="d-flex justify-content-end flex-wrap gap-2">
                               <button className="btn btn-sm" style={{backgroundColor: colors.bg, color: colors.textMain, border: `1px solid ${colors.borderColor}`}} onClick={() => {setSelectedOrderDetails(p); setShowDetailsModal(true);}}>VER</button>
                               {p.estado !== 'Completado' && (
                                   <>
                                        <button className="btn btn-sm fw-bold" style={{backgroundColor: colors.badgeWarnBg, color: colors.badgeWarnTxt, border: 'none'}} onClick={() => handleUpdateStatus(p.id, 'En Preparacion')}>COCINAR</button>
                                        {p.tipo_orden === 'domicilio' 
                                            ? <button className="btn btn-sm fw-bold" style={{backgroundColor: colors.badgeInfoBg, color: colors.badgeInfoTxt, border: 'none'}} onClick={() => handleUpdateStatus(p.id, 'En Camino')}>ENVIAR</button> 
                                            : <button className="btn btn-sm fw-bold" style={{backgroundColor: colors.badgeSuccessBg, color: colors.badgeSuccessTxt, border: 'none'}} onClick={() => handleUpdateStatus(p.id, 'Listo')}>MOSTRADOR</button>}
                                        <button className="btn btn-sm fw-bold" style={{backgroundColor: colors.textMain, color: colors.bg, border: 'none'}} onClick={() => handleUpdateStatus(p.id, 'Completado')}>CERRAR</button>
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
             <div className="d-flex justify-content-between align-items-center mb-5">
               <h3 className="fw-bold m-0" style={{color: colors.textHeader}}>Promociones Activas</h3>
               <button style={styles.btnAdd} onClick={() => handleOpenComboModal()}>+ NUEVO COMBO</button>
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
                       boxShadow: combo.esta_activo ? 'none' : `0 0 20px ${colors.badgeDangerTxt}20`,
                       position: 'relative',
                       overflow: 'hidden',
                       height: '100%'
                    }}>
                     <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', backgroundColor: combo.esta_activo ? colors.badgeSuccessTxt : colors.badgeDangerTxt}}></div>
                     
                     <div className="d-flex justify-content-between align-items-start mb-4">
                       <h5 className="fw-bold mb-0" style={{color: colors.textMain, fontSize: '1.3rem'}}>{combo.nombre}</h5>
                       {combo.esta_activo 
                           ? styles.renderBadge('ON', colors.badgeSuccessBg, colors.badgeSuccessTxt)
                           : styles.renderBadge('OFF', colors.badgeDangerBg, colors.badgeDangerTxt)}
                     </div>
                     
                     <h4 style={{color: colors.money, fontWeight: '900', fontSize: '2.5rem', fontFamily: 'monospace', marginBottom: '15px'}}>${Number(combo.precio).toFixed(2)}</h4>
                     <p style={{color: colors.textSecondary, fontSize: '0.95rem', minHeight: '50px'}}>{combo.descripcion || 'Sin descripción disponible.'}</p>
                     
                     <div className="mt-4 d-flex gap-2">
                       <button style={{...styles.btnAction(colors.textSecondary, true), flex:1}} onClick={() => handleOpenComboModal(combo)}>EDITAR</button>
                       {combo.esta_activo && <button style={{...styles.btnAction(colors.primary, true), flex:1}} onClick={() => handleDeleteCombo(combo)}>OCULTAR</button>}
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
                     title="Ingresos Totales" 
                     value={`$${reportData.reduce((acc, curr) => acc + Number(curr.total_ventas), 0).toFixed(2)}`} 
                     color={colors.money}
                     icon="💰" 
                     styles={styles} 
                     colors={colors} 
                   />
                 </div>
                 <div className="col-md-6">
                   <StatCard 
                     title="Ticket Promedio" 
                     value="$150.00" 
                     color={colors.primary} 
                     icon="📊" 
                     styles={styles} 
                     colors={colors} 
                   />
                 </div>
               </div>
               
               <h5 className="mb-4 fw-bold" style={{color: colors.textHeader}}>Gráfica de Rendimiento</h5>
               <div style={{padding: '30px', backgroundColor: colors.elementBg, borderRadius: '24px', border: `1px solid ${colors.borderColor}`}}>
                    <SalesReportChart reportData={reportData} theme={theme} /> 
               </div>
               
               <div className="mt-5 text-end">
                   <button className="btn btn-outline-danger btn-sm rounded-pill px-4 py-2" onClick={() => setShowPurgeModal(true)}>☢️ Purgar Base de Datos</button>
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
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 1060, backdropFilter: 'blur(10px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 overflow-hidden" style={{backgroundColor: '#1a0000', color: '#ffcccc', border: '1px solid #ff0000', boxShadow: '0 0 100px #ff0000'}}>
              <div className="modal-header border-0" style={{backgroundColor: '#ff0000'}}><h5 className="modal-title fw-bold text-white">⚠️ DESTRUCCIÓN DE DATOS</h5><button type="button" className="btn-close btn-close-white" onClick={() => setShowPurgeModal(false)}></button></div>
              <div className="modal-body p-5 text-center">
                <p className="fs-5 mb-4">Vas a borrar todo el historial. Esta acción es <strong>IRREVERSIBLE</strong>.</p>
                <input 
                    type="text" 
                    className="form-control text-center fs-4 fw-bold"
                    style={{backgroundColor: '#330000', color: '#ff0000', border: '1px solid #ff0000', padding: '15px'}}
                    value={purgeConfirmText} 
                    onChange={(e) => setPurgeConfirmText(e.target.value)} 
                    placeholder="Escribe: ELIMINAR"
                />
              </div>
              <div className="modal-footer border-0 p-4 justify-content-center">
                <button className="btn btn-danger w-100 rounded-pill py-3 fw-bold fs-5 shadow-lg" onClick={handlePurge} disabled={purgeConfirmText !== 'ELIMINAR'}>CONFIRMAR BORRADO</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;