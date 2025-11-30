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

// --- PALETA DE COLORES "DEEP NEPTUNE & CLEAN SLATE" ---
const getThemeColors = (mode) => {
  const isDark = mode === 'dark';

  return {
    // FONDOS
    bg: isDark ? '#0B1121' : '#F1F5F9',         // Azul muy oscuro vs Gris azulado muy claro
    cardBg: isDark ? '#151F32' : '#FFFFFF',     // Azul medianoche vs Blanco puro
    elementBg: isDark ? '#1E293B' : '#F8FAFC',  // Elementos internos
    hoverBg: isDark ? '#334155' : '#F1F5F9',

    // TEXTOS (Legibilidad Prioritaria)
    textMain: isDark ? '#F8FAFC' : '#0F172A',       // Casi blanco vs Casi negro
    textSecondary: isDark ? '#94A3B8' : '#64748B',  // Gris azulado medio (para subtítulos)
    textMuted: isDark ? '#475569' : '#94A3B8',      // Gris apagado (para detalles menores)

    // BORDES Y SEPARADORES
    borderColor: isDark ? '#334155' : '#E2E8F0',

    // MARCA Y ACENTOS
    primary: '#6366F1', // Indigo vibrante (funciona bien en ambos)
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)' // Indigo neón
      : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', // Indigo sólido

    // TABLAS
    tableHeaderBg: isDark ? '#0F172A' : '#F8FAFC',
    tableHeaderText: isDark ? '#A5B4FC' : '#475569', // Indigo claro vs Gris oscuro

    // ESTADOS (SISTEMA SEMÁFORO VIBRANTE)
    success: '#10B981', // Emerald
    successBg: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5',
    
    warning: '#F59E0B', // Amber
    warningBg: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
    
    danger: '#EF4444', // Red
    dangerBg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
    
    info: '#06B6D4',    // Cyan
    infoBg: isDark ? 'rgba(6, 182, 212, 0.2)' : '#CFFAFE',

    // DINERO (Siempre debe resaltar)
    money: isDark ? '#34D399' : '#059669', // Verde neón en dark, Verde bosque en light
  };
};

// --- COMPONENTE TARJETA KPI (MEJORADA) ---
const StatCard = ({ title, value, color, icon, styles, colors }) => (
  <div style={{
      ...styles.card, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden'
  }}>
    {/* Barra lateral de color */}
    <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', backgroundColor: color}}></div>
    
    <div>
        <h6 style={{ color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', marginBottom: '5px' }}>{title}</h6>
        <h3 style={{ color: colors.textMain, fontWeight: '800', margin: 0, fontSize: '2rem' }}>{value}</h3>
    </div>

    <div style={{
      fontSize: '2rem', 
      color: color,
      background: colors.bg, // Fondo sutil contraste
      width: '60px', height: '60px',
      borderRadius: '16px', // Cuadrado redondeado moderno
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      {icon}
    </div>
  </div>
);

// --- COMPONENTE MODAL CONFIRMACIÓN ---
const ConfirmationModal = ({ show, onClose, onConfirm, title, message, colors }) => {
    if (!show) return null;
    return (
      <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ borderRadius: '20px', border: `1px solid ${colors.borderColor}`, backgroundColor: colors.cardBg, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div className="modal-header border-0 pb-0 pt-4 px-4">
              <h5 className="modal-title fw-bold" style={{ color: colors.textMain }}>{title}</h5>
              <button type="button" className="btn-close" style={{filter: colors.bg === '#0B1121' ? 'invert(1)' : 'none'}} onClick={onClose}></button>
            </div>
            <div className="modal-body px-4 pt-3 pb-4">
              <p style={{color: colors.textSecondary, fontSize: '1rem'}}>{message}</p>
            </div>
            <div className="modal-footer border-0 px-4 pb-4">
              <button className="btn rounded-pill px-4 fw-bold" style={{backgroundColor: colors.elementBg, color: colors.textMain, border: `1px solid ${colors.borderColor}`}} onClick={onClose}>Cancelar</button>
              <button className="btn rounded-pill px-4 fw-bold text-white shadow-sm" style={{backgroundColor: colors.danger}} onClick={onConfirm}>Confirmar</button>
            </div>
          </div>
        </div>
      </div>
    );
};

function AdminPage() {
  const { theme } = useTheme(); 
  const colors = getThemeColors(theme);

  const styles = {
    container: {
      backgroundColor: colors.bg,
      minHeight: '100vh',
      fontFamily: '"Nunito", "Inter", sans-serif',
      padding: '40px 20px',
      color: colors.textMain,
      transition: 'background-color 0.4s ease, color 0.4s ease'
    },
    headerTitle: {
      background: colors.primaryGradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontWeight: '900',
      fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
      marginBottom: '15px',
      letterSpacing: '-1px'
    },
    navPillsContainer: {
      backgroundColor: colors.cardBg,
      borderRadius: '50px',
      padding: '6px',
      display: 'inline-flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '5px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      marginBottom: '40px',
      border: `1px solid ${colors.borderColor}`
    },
    navLink: {
      color: colors.textSecondary,
      borderRadius: '40px',
      padding: '10px 24px',
      fontWeight: '600',
      border: 'none',
      background: 'transparent',
      transition: 'all 0.3s ease',
      fontSize: '0.95rem'
    },
    navLinkActive: {
      background: colors.primaryGradient,
      color: 'white',
      fontWeight: '700',
      boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)',
      transform: 'translateY(-1px)'
    },
    card: {
      backgroundColor: colors.cardBg,
      color: colors.textMain,
      borderRadius: '24px',
      border: `1px solid ${colors.borderColor}`,
      boxShadow: theme === 'dark' ? '0 20px 25px -5px rgba(0, 0, 0, 0.3)' : '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
      padding: '35px',
      transition: 'all 0.3s ease'
    },
    // --- ESTILOS DE TABLA MEJORADOS ---
    table: {
       '--bs-table-bg': 'transparent',
       '--bs-table-color': colors.textMain,
       '--bs-table-border-color': colors.borderColor,
       width: '100%',
       marginBottom: 0,
       borderCollapse: 'separate', 
       borderSpacing: '0 8px' // Separación entre filas para efecto moderno
    },
    tableHeader: {
      backgroundColor: 'transparent',
      color: colors.tableHeaderText,
      fontWeight: '800',
      borderBottom: `2px solid ${colors.borderColor}`,
      textTransform: 'uppercase',
      fontSize: '0.75rem',
      letterSpacing: '1.2px',
      padding: '15px'
    },
    tableRow: {
        backgroundColor: 'transparent',
        transition: 'transform 0.2s'
    },
    tableCell: {
       padding: '20px 15px',
       verticalAlign: 'middle',
       color: colors.textMain,
       borderBottom: `1px solid ${colors.borderColor}`,
       background: 'transparent'
    },
    // --- BOTONES ---
    btnAdd: {
      background: colors.primaryGradient,
      border: 'none',
      borderRadius: '12px',
      color: 'white',
      padding: '12px 24px',
      fontWeight: '700',
      boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    btnControl: (bgColor, textColor) => ({
        backgroundColor: bgColor,
        color: textColor,
        border: 'none',
        padding: '8px 14px',
        borderRadius: '10px',
        fontWeight: '700',
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        marginRight: '6px',
        marginBottom: '4px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        transition: 'transform 0.1s active:scale-95'
    }),
    btnAction: (color, isOutline = true) => ({
      backgroundColor: isOutline ? 'transparent' : color,
      border: `1px solid ${isOutline ? color : 'transparent'}`,
      color: isOutline ? color : 'white',
      borderRadius: '10px',
      padding: '8px 16px',
      fontWeight: '600',
      fontSize: '0.85rem',
      marginRight: '8px',
      transition: 'all 0.2s',
      cursor: 'pointer'
    }),
    // --- BADGES INTELIGENTES ---
    badge: (bgColor, textColor) => ({
      backgroundColor: bgColor,
      color: textColor,
      padding: '6px 14px',
      borderRadius: '30px',
      fontSize: '0.75rem',
      fontWeight: '800',
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
      border: `1px solid ${bgColor}` // Borde sutil del mismo color
    }),
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
          <p style={{color: colors.textSecondary, fontSize: '1.1rem'}}>Panel de Control y Gestión</p>
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
          
          {loading && <div className="text-center py-5"><div className="spinner-border" style={{color: colors.primary, width: '3rem', height: '3rem'}} role="status"></div></div>}
          {error && <div className="alert alert-danger shadow-sm border-0" style={{borderRadius: '12px'}}>{error}</div>}

          {/* === INVENTARIO === */}
          {!loading && !error && activeTab === 'productos' && (
            <div>
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                <h3 className="fw-bold m-0" style={{color: colors.textMain}}>Inventario de Productos</h3>
                <button className="btn" style={styles.btnAdd} onClick={() => handleOpenProductModal()}>
                    <span style={{fontSize: '1.2rem', lineHeight: 0}}>+</span> Nuevo Producto
                </button>
              </div>
              <div className="table-responsive">
                <table className="table" style={styles.table}>
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
                      <tr key={p.id} style={styles.tableRow}>
                        <td style={styles.tableCell}>
                            <div className="fw-bold" style={{fontSize: '1rem', color: colors.textMain}}>{p.nombre}</div>
                            <small style={{color: colors.textSecondary, fontWeight: '500'}}>{p.categoria}</small>
                        </td>
                        {/* PRECIO RESALTADO */}
                        <td style={{...styles.tableCell, color: colors.money, fontWeight: '800', fontSize: '1.1rem', fontFamily: 'monospace'}}>
                            ${Number(p.precio).toFixed(2)}
                        </td>
                        <td style={styles.tableCell}>
                            {p.stock <= 5 
                             ? <span style={styles.badge(colors.dangerBg, colors.danger)}>⚠️ Bajo: {p.stock}</span> 
                             : <span style={{color: colors.textMain, fontWeight: '600'}}>{p.stock} u.</span>}
                        </td>
                        <td style={styles.tableCell}>
                            {p.en_oferta 
                             ? <span style={styles.badge(colors.infoBg, colors.info)}>⚡ Oferta -{p.descuento_porcentaje}%</span> 
                             : <span style={styles.badge(colors.elementBg, colors.textMuted)}>Normal</span>}
                        </td>
                        <td style={{...styles.tableCell, textAlign: 'right'}}>
                          <button style={styles.btnAction(colors.primary, true)} onClick={() => handleOpenProductModal(p)}>Editar</button>
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
               <div>
                   <h3 className="fw-bold m-0" style={{color: colors.textMain}}>Pedidos Entrantes</h3>
                   <p style={{color: colors.textSecondary, margin: 0, fontSize: '0.9rem'}}>Gestiona el flujo de órdenes</p>
               </div>
               {pedidos.filter(p => p.estado === 'Pendiente').length > 0 && (
                   <span className="badge rounded-pill px-3 py-2 shadow-sm animate__animated animate__pulse animate__infinite" style={{backgroundColor: colors.danger, color: 'white', fontSize: '0.9rem'}}>
                     🔥 {pedidos.filter(p => p.estado === 'Pendiente').length} Por Atender
                   </span>
               )}
             </div>
             <div className="table-responsive">
               <table className="table" style={styles.table}>
                 <thead>
                   <tr>
                     <th style={styles.tableHeader}>ID / Cliente</th>
                     <th style={styles.tableHeader}>Total</th>
                     <th style={styles.tableHeader}>Tipo</th>
                     <th style={styles.tableHeader}>Estado</th>
                     <th style={{...styles.tableHeader, textAlign: 'right'}}>Control de Flujo</th>
                   </tr>
                 </thead>
                 <tbody>
                   {pedidos.map((p) => (
                     <tr key={p.id} style={styles.tableRow}>
                       <td style={styles.tableCell}>
                          <div className="d-flex align-items-center">
                            <span className="fw-bold me-3 px-2 py-1 rounded" style={{color: colors.primary, backgroundColor: colors.elementBg, fontFamily: 'monospace'}}>
                                #{p.id}
                            </span>
                            <div>
                                <div className="fw-bold" style={{color: colors.textMain}}>{p.nombre_cliente}</div>
                                <small style={{color: colors.textSecondary}}>
                                    🕒 {new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </small>
                            </div>
                          </div>
                       </td>
                       <td style={{...styles.tableCell, color: colors.money, fontWeight: '900', fontSize: '1.15rem', fontFamily: 'monospace'}}>
                           ${Number(p.total).toFixed(2)}
                       </td>
                       <td style={styles.tableCell}>
                         {p.tipo_orden === 'domicilio' 
                           ? <span style={styles.badge(colors.infoBg, colors.info)}>🛵 Domicilio</span> 
                           : <span style={styles.badge(colors.warningBg, colors.warning)}>🏪 Recoger</span>}
                       </td>
                       <td style={styles.tableCell}>
                          <span style={styles.badge(
                              p.estado === 'Pendiente' ? colors.warningBg : (p.estado === 'Completado' ? colors.successBg : colors.elementBg),
                              p.estado === 'Pendiente' ? colors.warning : (p.estado === 'Completado' ? colors.success : colors.textMain)
                          )}>
                              {p.estado === 'Pendiente' ? '⏳ PENDIENTE' : p.estado.toUpperCase()}
                          </span>
                       </td>
                       <td style={{...styles.tableCell, textAlign: 'right'}}>
                           <div className="d-flex justify-content-end flex-wrap">
                               <button style={styles.btnControl(colors.elementBg, colors.textMain)} onClick={() => {setSelectedOrderDetails(p); setShowDetailsModal(true);}}>👁️ Ver</button>
                               {p.estado !== 'Completado' && (
                                   <>
                                       <button style={styles.btnControl(colors.warningBg, colors.warning)} onClick={() => handleUpdateStatus(p.id, 'En Preparacion')}>👨‍🍳 Prep</button>
                                       {p.tipo_orden === 'domicilio' 
                                            ? <button style={styles.btnControl(colors.infoBg, colors.info)} onClick={() => handleUpdateStatus(p.id, 'En Camino')}>🏍️ Moto</button> 
                                            : <button style={styles.btnControl(colors.elementBg, colors.success)} onClick={() => handleUpdateStatus(p.id, 'Listo')}>📦 Listo</button>}
                                       <button style={styles.btnControl(colors.success, 'white')} onClick={() => handleUpdateStatus(p.id, 'Completado')}>✅ OK</button>
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
               <button className="btn shadow-sm" style={styles.btnAdd} onClick={() => handleOpenComboModal()}>+ Nuevo Combo</button>
             </div>
             <div className="row g-4">
               {combos.map((combo) => (
                 <div className="col-md-6 col-lg-4" key={combo.id}>
                   <div style={{
                       border: `1px solid ${combo.esta_activo ? colors.success : colors.danger}`, 
                       borderRadius: '24px', 
                       padding: '25px', 
                       backgroundColor: colors.elementBg, 
                       color: colors.textMain, 
                       boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
                       position: 'relative',
                       overflow: 'hidden'
                    }}>
                     <div className="d-flex justify-content-between align-items-start mb-3">
                       <h5 className="fw-bold mb-0" style={{color: colors.textMain, zIndex: 2}}>{combo.nombre}</h5>
                       <span style={styles.badge(combo.esta_activo ? colors.successBg : colors.dangerBg, combo.esta_activo ? colors.success : colors.danger)}>
                           {combo.esta_activo ? 'ACTIVO' : 'OCULTO'}
                       </span>
                     </div>
                     <h4 style={{color: colors.primary, fontWeight: '800', fontSize: '2rem'}}>${Number(combo.precio).toFixed(2)}</h4>
                     <p style={{color: colors.textSecondary, fontSize: '0.9rem'}}>{combo.descripcion || 'Sin descripción'}</p>
                     
                     <div className="mt-4 d-flex gap-2">
                       <button style={{...styles.btnAction(colors.primary, true), flex:1}} onClick={() => handleOpenComboModal(combo)}>Editar</button>
                       {combo.esta_activo && <button style={{...styles.btnAction(colors.danger, true), flex:1}} onClick={() => handleDeleteCombo(combo)}>Ocultar</button>}
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
                     color={colors.success} 
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
                   <button className="btn btn-sm px-4 py-2 rounded-pill fw-bold" 
                           style={{color: colors.danger, border: `1px solid ${colors.danger}`, background: 'transparent'}}
                           onClick={() => setShowPurgeModal(true)}>
                       ⚠️ Zona de Peligro (Purgar Datos)
                   </button>
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
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 overflow-hidden" style={{backgroundColor: colors.cardBg, color: colors.textMain, border: `1px solid ${colors.borderColor}`, boxShadow: '0 20px 50px rgba(0,0,0,0.5)'}}>
              <div className="modal-header text-white border-0" style={{backgroundColor: colors.danger, padding: '20px'}}><h5 className="modal-title fw-bold">⚠️ ELIMINACIÓN TOTAL</h5><button type="button" className="btn-close btn-close-white" onClick={() => setShowPurgeModal(false)}></button></div>
              <div className="modal-body p-4">
                <p className="mb-3" style={{fontSize: '1.1rem'}}>Esta acción borrará <strong>todo el historial de pedidos</strong> permanentemente. No hay vuelta atrás.</p>
                <label className="form-label" style={{color: colors.textSecondary, fontSize: '0.9rem'}}>Escribe "ELIMINAR" para confirmar:</label>
                <input 
                    type="text" 
                    style={styles.input}
                    value={purgeConfirmText} 
                    onChange={(e) => setPurgeConfirmText(e.target.value)} 
                    placeholder="ELIMINAR"
                />
              </div>
              <div className="modal-footer border-0 p-4 pt-0">
                <button className="btn btn-danger w-100 rounded-pill py-3 fw-bold shadow" onClick={handlePurge} disabled={purgeConfirmText !== 'ELIMINAR'}>Confirmar Borrado</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;