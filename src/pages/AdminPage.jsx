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

// --- PALETA MAESTRA: "DULZURA VS. FUEGO" ---
const getThemeColors = (mode) => {
  const isDark = mode === 'dark';

  return {
    // === FONDOS ===
    // Light: Un tono crema/rosado muy suave (como glaseado de vainilla)
    // Dark: Negro puro para contraste máximo
    bg: isDark ? '#000000' : '#FFF9FA', 
    cardBg: isDark ? '#141414' : '#FFFFFF',
    
    // Elementos secundarios (filas de tablas, inputs)
    elementBg: isDark ? '#1F1F1F' : '#F8F1F3',

    // === TEXTOS (PRIORIDAD LEGIBILIDAD) ===
    // Light: Usamos "Chocolate Oscuro" en lugar de negro, combina mejor con el rosa.
    // Dark: Blanco puro.
    textMain: isDark ? '#FFFFFF' : '#3E2723', 
    textSecondary: isDark ? '#B0B0B0' : '#8D6E63',

    // === BORDES ===
    borderColor: isDark ? '#333333' : '#F0E1E6',

    // === MARCA (PRIMARY) ===
    // Light: Rosa Fresa (Dulce)
    // Dark: Rojo Fuego/Naranja (Picante)
    primary: isDark ? '#FF3D00' : '#E91E63',
    
    // Degradado para botones y encabezados
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #FF3D00 0%, #DD2C00 100%)' // Lava
      : 'linear-gradient(135deg, #FF80AB 0%, #F50057 100%)', // Fresa

    // === DINERO / NÚMEROS IMPORTANTES ===
    // Light: Verde dinero clásico (se ve bien sobre blanco)
    // Dark: Amarillo Neón (se ve increíble sobre negro) o Rojo si prefieres "picante"
    // Aquí uso un Verde brillante en light y un Amarillo Oro en Dark para que resalte muchísimo.
    money: isDark ? '#FFD600' : '#00C853',

    // === TABLAS ===
    tableHeaderText: isDark ? '#FF9E80' : '#C2185B',

    // === SOMBRAS ===
    cardShadow: isDark 
        ? '0 10px 40px rgba(255, 61, 0, 0.15)' // Resplandor rojo sutil
        : '0 10px 30px rgba(233, 30, 99, 0.10)', // Sombra rosada suave

    // === BADGES (Estados) ===
    // Configuración segura para que las letras se lean
    badgeSuccessBg: isDark ? '#1B5E20' : '#E8F5E9',
    badgeSuccessTxt: isDark ? '#69F0AE' : '#2E7D32',

    badgeWarnBg: isDark ? '#BF360C' : '#FFF3E0',
    badgeWarnTxt: isDark ? '#FFAB40' : '#EF6C00',

    badgeDangerBg: isDark ? '#B71C1C' : '#FFEBEE',
    badgeDangerTxt: isDark ? '#FF5252' : '#C62828',
    
    badgeInfoBg: isDark ? '#01579B' : '#E1F5FE',
    badgeInfoTxt: isDark ? '#40C4FF' : '#0277BD',
  };
};

// --- TARJETA DE ESTADÍSTICAS (KPI) ---
const StatCard = ({ title, value, icon, styles, colors }) => (
  <div style={{
      ...styles.card, 
      borderLeft: `5px solid ${colors.primary}`, // Acento lateral
      display: 'flex', 
      alignItems: 'center',
      justifyContent: 'space-between',
      overflow: 'hidden',
      position: 'relative'
  }}>
    <div>
        <h6 style={{ color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', marginBottom: '5px' }}>{title}</h6>
        {/* El Valor usa el color de dinero para resaltar */}
        <h3 style={{ color: colors.money, fontWeight: '900', margin: 0, fontSize: '2.2rem', fontFamily: 'monospace' }}>{value}</h3>
    </div>
    
    <div style={{ 
        backgroundColor: colors.elementBg, 
        width: '60px', height: '60px', 
        borderRadius: '50%', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.8rem',
        color: colors.primary
    }}>
        {icon}
    </div>
  </div>
);

// --- MODAL GENÉRICO ---
const ConfirmationModal = ({ show, onClose, onConfirm, title, message, colors }) => {
    if (!show) return null;
    return (
      <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ borderRadius: '20px', border: `1px solid ${colors.borderColor}`, backgroundColor: colors.cardBg, boxShadow: colors.cardShadow }}>
            <div className="modal-header border-0 pb-0 pt-4 px-4">
              <h5 className="modal-title fw-bold" style={{ color: colors.textMain }}>{title}</h5>
              <button type="button" className="btn-close" style={{filter: colors.bg === '#000000' ? 'invert(1)' : 'none'}} onClick={onClose}></button>
            </div>
            <div className="modal-body px-4 pt-3 pb-4">
              <p style={{color: colors.textSecondary, fontSize: '1.1rem'}}>{message}</p>
            </div>
            <div className="modal-footer border-0 px-4 pb-4">
              <button className="btn rounded-pill px-4 fw-bold" style={{backgroundColor: colors.elementBg, color: colors.textMain}} onClick={onClose}>Cancelar</button>
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
      transition: 'all 0.3s ease'
    },
    headerTitle: {
      background: colors.primaryGradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontWeight: '900',
      fontSize: 'clamp(2rem, 5vw, 3.5rem)',
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
    },
    navLinkActive: {
      background: colors.primaryGradient,
      color: '#FFFFFF', // Siempre blanco al estar activo
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    },
    card: {
      backgroundColor: colors.cardBg,
      color: colors.textMain,
      borderRadius: '24px',
      border: `1px solid ${colors.borderColor}`,
      boxShadow: colors.cardShadow,
      padding: '30px',
      marginBottom: '30px'
    },
    // --- TABLAS MEJORADAS ---
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
      border: 'none',
      textTransform: 'uppercase',
      fontSize: '0.8rem',
      letterSpacing: '1px',
      padding: '16px'
    },
    tableCell: {
       padding: '16px',
       color: colors.textMain, // Forzamos el color principal
       borderBottom: `1px solid ${colors.borderColor}`,
       verticalAlign: 'middle'
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
      padding: '12px 30px',
      fontWeight: '700',
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
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
      borderRadius: '10px',
      padding: '6px 14px',
      fontWeight: '700',
      fontSize: '0.8rem',
      marginRight: '5px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }),
    // Renderizado seguro de badges
    badge: (text, bg, txt) => (
        <span style={{
            backgroundColor: bg,
            color: txt,
            padding: '5px 12px',
            borderRadius: '8px',
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
        
        {/* HEADER */}
        <div className="text-center mb-5 pt-3">
          <h1 style={styles.headerTitle}>🍩 Miss Donitas Admin</h1>
          <div style={{
              display: 'inline-block',
              padding: '6px 20px',
              borderRadius: '20px',
              backgroundColor: colors.elementBg,
              border: `1px solid ${colors.primary}`,
              color: colors.primary,
              fontWeight: 'bold',
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '2px'
          }}>
            {isDark ? '🔥 Modo Picante' : '🧁 Modo Donería'}
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

      {/* MODALES */}
      <ProductModal show={showProductModal} handleClose={() => setShowProductModal(false)} handleSave={handleSaveProducto} productoActual={productoActual} />
      <ComboModal show={showComboModal} handleClose={() => setShowComboModal(false)} handleSave={handleSaveCombo} comboActual={comboActual} />
      {showDetailsModal && (<DetallesPedidoModal pedido={selectedOrderDetails} onClose={() => setShowDetailsModal(false)} />)}
      <ConfirmationModal show={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmAction} title={confirmTitle} message={confirmMessage} colors={colors} />

      {/* MODAL PURGAR */}
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