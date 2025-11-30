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

// --- PALETA DE COLORES PERSONALIZADA (DONERÍA VS PICANTE) ---
const getThemeColors = (mode) => {
  const isDark = mode === 'dark';

  return {
    // === FONDOS ===
    // Light: "Lavender Blush" (Rosado muy pálido, parece glaseado) 
    // Dark: "Void Black" (Negro puro para el modo picante)
    bg: isDark ? '#000000' : '#FFF0F5', 
    
    // Cards
    // Light: Blanco puro
    // Dark: Gris muy oscuro casi negro
    cardBg: isDark ? '#0a0a0a' : '#FFFFFF',
    
    // Elementos internos
    elementBg: isDark ? '#1a1a1a' : '#FFF5F8',

    // === TEXTOS (VISIBILIDAD TOTAL) ===
    // Light: Color Chocolate (#3E2723) - Mucho mejor para donas que el negro.
    // Dark: Blanco Puro (#FFFFFF) - Contraste máximo contra el fondo negro.
    textMain: isDark ? '#FFFFFF' : '#3E2723', 
    
    // Subtextos
    textSecondary: isDark ? '#B0B0B0' : '#8D6E63', // Gris plata vs Café claro

    // === BORDES ===
    // Dark: Rojo Intenso
    // Light: Rosado suave
    borderColor: isDark ? '#800000' : '#F8BBD0',

    // === MARCA PRINCIPAL ===
    // Light: Rosa Mexicano / Fresa (#E91E63)
    // Dark: Rojo Fuego / Picante (#FF0000)
    primary: isDark ? '#FF0000' : '#E91E63', 
    
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #FF0000 0%, #800000 100%)' // Gradiente Vampiro
      : 'linear-gradient(135deg, #FF4081 0%, #C2185B 100%)', // Gradiente Fresa

    // === TABLAS ===
    tableHeaderBg: isDark ? '#1a1a1a' : '#FCE4EC',
    tableHeaderText: isDark ? '#FF0000' : '#880E4F', // Rojo texto vs Vino

    // === DINERO (NUMEROS) ===
    // Dark: ROJO SANGRE/NEÓN (Tu requerimiento)
    // Light: VERDE DINERO (Para que resalte sobre lo dulce)
    money: isDark ? '#FF1744' : '#2E7D32', 

    // === ESTADOS ===
    // Adaptamos los badges para que combinen
    badgeSuccessBg: isDark ? '#003300' : '#E8F5E9',
    badgeSuccessTxt: isDark ? '#00FF00' : '#1B5E20',

    badgeWarnBg: isDark ? '#331a00' : '#FFF8E1',
    badgeWarnTxt: isDark ? '#FFAE00' : '#FF6F00',

    badgeDangerBg: isDark ? '#330000' : '#FFEBEE',
    badgeDangerTxt: isDark ? '#FF0000' : '#C62828',
    
    badgeInfoBg: isDark ? '#001a33' : '#E3F2FD',
    badgeInfoTxt: isDark ? '#00BFFF' : '#0277BD',
  };
};

// --- COMPONENTE KPI ---
const StatCard = ({ title, value, color, icon, styles, colors }) => (
  <div style={{
      ...styles.card, 
      borderBottom: `4px solid ${color}`, // Borde abajo estilo ticket
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center',
      textAlign: 'center'
  }}>
    <div style={{
      fontSize: '2.5rem', 
      marginBottom: '10px',
      color: color
    }}>
      {icon}
    </div>
    <h6 style={{ color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>{title}</h6>
    {/* Forzamos el color del texto principal */}
    <h3 style={{ color: colors.textMain, fontWeight: '900', margin: 0, fontSize: '2.2rem' }}>{value}</h3>
  </div>
);

// --- MODAL CONFIRMACIÓN ---
const ConfirmationModal = ({ show, onClose, onConfirm, title, message, colors }) => {
    if (!show) return null;
    return (
      <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ borderRadius: '20px', border: `2px solid ${colors.borderColor}`, backgroundColor: colors.cardBg }}>
            <div className="modal-header border-0 pb-0 pt-4 px-4">
              <h5 className="modal-title fw-bold" style={{ color: colors.textMain }}>{title}</h5>
              <button type="button" className="btn-close" style={{filter: colors.bg === '#000000' ? 'invert(1)' : 'none'}} onClick={onClose}></button>
            </div>
            <div className="modal-body px-4 pt-3 pb-4">
              <p style={{color: colors.textMain, fontSize: '1.1rem'}}>{message}</p>
            </div>
            <div className="modal-footer border-0 px-4 pb-4">
              <button className="btn rounded-pill px-4 fw-bold" style={{backgroundColor: colors.elementBg, color: colors.textMain}} onClick={onClose}>Cancelar</button>
              <button className="btn rounded-pill px-4 fw-bold text-white" style={{backgroundColor: '#D32F2F'}} onClick={onConfirm}>Confirmar</button>
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
      fontFamily: '"Nunito", "Fredoka", sans-serif', // Fredoka es una fuente muy "redonda" tipo dona, si no la tienes usa Nunito
      padding: '30px 20px',
      color: colors.textMain,
      transition: 'all 0.3s ease'
    },
    headerTitle: {
      background: colors.primaryGradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontWeight: '900',
      fontSize: '3rem',
      marginBottom: '10px',
      textShadow: isDark ? '0 0 10px rgba(255,0,0,0.5)' : 'none' // Resplandor rojo en dark
    },
    navPillsContainer: {
      backgroundColor: colors.cardBg,
      borderRadius: '50px',
      padding: '8px',
      display: 'inline-flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '10px',
      marginBottom: '40px',
      border: `1px solid ${colors.borderColor}`,
      boxShadow: isDark ? '0 0 15px rgba(255, 0, 0, 0.2)' : '0 4px 15px rgba(233, 30, 99, 0.1)'
    },
    navLink: {
      color: colors.textSecondary,
      borderRadius: '25px',
      padding: '10px 25px',
      fontWeight: '700',
      border: 'none',
      background: 'transparent',
      transition: 'all 0.2s',
      fontSize: '1rem'
    },
    navLinkActive: {
      background: colors.primaryGradient,
      color: 'white',
      boxShadow: isDark ? '0 0 10px #FF0000' : '0 4px 10px rgba(233, 30, 99, 0.4)',
    },
    card: {
      backgroundColor: colors.cardBg,
      color: colors.textMain,
      borderRadius: '24px',
      border: `1px solid ${colors.borderColor}`,
      boxShadow: isDark ? '0 0 20px rgba(255, 0, 0, 0.1)' : '0 10px 30px rgba(233, 30, 99, 0.05)',
      padding: '35px',
    },
    // --- ESTILOS DE TABLA ---
    table: {
       '--bs-table-bg': 'transparent', 
       '--bs-table-color': colors.textMain,
       '--bs-table-border-color': colors.borderColor,
       width: '100%',
       marginBottom: 0,
       borderCollapse: 'separate', 
       borderSpacing: '0' 
    },
    tableHeader: {
      backgroundColor: colors.tableHeaderBg,
      color: colors.tableHeaderText,
      fontWeight: '800',
      borderBottom: `2px solid ${colors.borderColor}`,
      textTransform: 'uppercase',
      fontSize: '0.85rem',
      letterSpacing: '0.05em',
      padding: '20px 15px'
    },
    tableRow: {
        backgroundColor: 'transparent',
        transition: 'background-color 0.2s'
    },
    tableCell: {
       padding: '20px 15px',
       verticalAlign: 'middle',
       color: colors.textMain, // Forzamos blanco en dark, chocolate en light
       borderBottom: `1px solid ${colors.borderColor}`
    },
    // --- BOTONES ---
    btnAdd: {
      background: colors.primaryGradient,
      border: 'none',
      borderRadius: '15px',
      color: 'white',
      padding: '12px 28px',
      fontWeight: '700',
      fontSize: '1rem',
      boxShadow: isDark ? '0 0 10px #FF0000' : '0 5px 15px rgba(233, 30, 99, 0.3)'
    },
    btnControl: (bgColor, textColor) => ({
        backgroundColor: bgColor,
        color: textColor,
        border: 'none',
        padding: '8px 14px',
        borderRadius: '8px',
        fontWeight: '700',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        marginRight: '6px',
        marginBottom: '6px',
        border: isDark ? `1px solid ${textColor}` : 'none' // Borde fino en dark mode
    }),
    btnAction: (color, isOutline = true) => ({
      backgroundColor: isOutline ? 'transparent' : color,
      border: `1px solid ${color}`,
      color: isOutline ? color : 'white',
      borderRadius: '10px',
      padding: '8px 18px',
      fontWeight: '700',
      fontSize: '0.85rem',
      marginRight: '8px',
      cursor: 'pointer'
    }),
    // Helper para badges
    renderBadge: (text, bg, txt) => (
        <span style={{
            backgroundColor: bg,
            color: txt,
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            border: isDark ? `1px solid ${txt}` : 'none' // Borde neón en dark
        }}>
            {text}
        </span>
    ),
    input: {
        backgroundColor: colors.elementBg,
        color: colors.textMain,
        border: `1px solid ${colors.borderColor}`,
        padding: '12px',
        borderRadius: '12px',
        width: '100%',
        outline: 'none',
        fontSize: '1rem'
    }
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
          <p style={{color: colors.textSecondary, fontWeight: '700', fontSize: '1.2rem', letterSpacing: '2px', textTransform: 'uppercase'}}>
             {isDark ? '🔥 MODO PICANTE ACTIVADO 🔥' : '🧁 Panel de Control Dulce'}
          </p>
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
                <button className="btn" style={styles.btnAdd} onClick={() => handleOpenProductModal()}>+ Nuevo Producto</button>
              </div>
              <div className="table-responsive">
                <table className="table align-middle" style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>Producto</th>
                      <th style={styles.tableHeader}>Precio</th>
                      <th style={styles.tableHeader}>Stock</th>
                      <th style={styles.tableHeader}>Estado</th>
                      <th style={{...styles.tableHeader, textAlign: 'center'}}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((p) => (
                      <tr key={p.id} style={styles.tableRow}>
                        <td style={styles.tableCell}>
                            <div className="fw-bold" style={{color: colors.textMain, fontSize: '1.1rem'}}>{p.nombre}</div>
                            <small style={{color: colors.textSecondary}}>{p.categoria}</small>
                        </td>
                        {/* PRECIO: ROJO SANGRE EN DARK, VERDE EN LIGHT */}
                        <td style={{...styles.tableCell, color: colors.money, fontWeight: '900', fontSize: '1.2rem', fontFamily: 'monospace'}}>
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
                          <button style={styles.btnAction(isDark ? '#00BFFF' : '#039BE5', true)} onClick={() => handleOpenProductModal(p)}>Editar</button>
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
                     <th style={styles.tableHeader}>ID / Cliente</th>
                     <th style={styles.tableHeader}>Total</th>
                     <th style={styles.tableHeader}>Tipo</th>
                     <th style={styles.tableHeader}>Estado</th>
                     <th style={styles.tableHeader}>Control</th>
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
                       {/* TOTAL EN ROJO PARA MODO PICANTE */}
                       <td style={{...styles.tableCell, color: colors.money, fontWeight: '900', fontSize: '1.3rem'}}>${Number(p.total).toFixed(2)}</td>
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
                                       <button style={styles.btnControl(isDark ? '#006400' : '#2E7D32', 'white')} onClick={() => handleUpdateStatus(p.id, 'Completado')}>OK</button>
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
                       border: `2px solid ${combo.esta_activo ? (isDark ? '#00FF00' : '#4CAF50') : (isDark ? '#FF0000' : '#F44336')}`, 
                       borderRadius: '20px', 
                       padding: '25px', 
                       backgroundColor: colors.elementBg, 
                       color: colors.textMain, 
                       boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
                    }}>
                     <div className="d-flex justify-content-between align-items-start mb-3">
                       <h5 className="fw-bold mb-0" style={{color: colors.textMain}}>{combo.nombre}</h5>
                       {combo.esta_activo 
                            ? styles.renderBadge('ACTIVO', colors.badgeSuccessBg, colors.badgeSuccessTxt)
                            : styles.renderBadge('OCULTO', colors.badgeDangerBg, colors.badgeDangerTxt)}
                     </div>
                     <h4 style={{color: colors.primary, fontWeight: '800', fontSize: '2rem'}}>${Number(combo.precio).toFixed(2)}</h4>
                     <p style={{color: colors.textSecondary, fontSize: '0.9rem'}}>{combo.descripcion || 'Sin descripción'}</p>
                     
                     <div className="mt-4 d-flex gap-2">
                       <button style={{...styles.btnAction(isDark ? '#00BFFF' : '#039BE5', true), flex:1}} onClick={() => handleOpenComboModal(combo)}>Editar</button>
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
                     color={isDark ? '#00FF00' : '#43A047'} 
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
      <ConfirmationModal show={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmAction} title={confirmTitle} message={confirmMessage} colors={colors} />

      {/* MODAL PURGAR */}
      {showPurgeModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 overflow-hidden" style={{backgroundColor: colors.cardBg, color: colors.textMain, border: `2px solid ${colors.borderColor}`}}>
              <div className="modal-header text-white border-0" style={{backgroundColor: colors.badgeDangerTxt}}><h5 className="modal-title fw-bold">⚠️ Borrar Todo</h5><button type="button" className="btn-close btn-close-white" onClick={() => setShowPurgeModal(false)}></button></div>
              <div className="modal-body p-4">
                <p>Escribe <strong>ELIMINAR</strong> para confirmar:</p>
                <input 
                    type="text" 
                    style={styles.input}
                    value={purgeConfirmText} 
                    onChange={(e) => setPurgeConfirmText(e.target.value)} 
                    placeholder="ELIMINAR"
                />
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