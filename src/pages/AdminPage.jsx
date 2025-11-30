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

// --- PALETA DE COLORES "PREMIUM SLATE" (Mejorada visualmente) ---
const getThemeColors = (mode) => {
  const isDark = mode === 'dark';

  return {
    // FONDOS: Usamos tonos 'Slate' (Gris azulado) para que se vea moderno, no negro puro aburrido.
    bg: isDark ? '#0F172A' : '#F3F4F6',        // Slate 900 vs Gray 100
    cardBg: isDark ? '#1E293B' : '#FFFFFF',    // Slate 800 vs Blanco
    elementBg: isDark ? '#334155' : '#F9FAFB', // Slate 700 vs Gray 50
    
    // TEXTOS: Blanco brillante en dark mode
    textMain: isDark ? '#F1F5F9' : '#111827',  // Slate 100 vs Gray 900
    textSecondary: isDark ? '#94A3B8' : '#6B7280', // Slate 400 vs Gray 500
    
    // BORDES
    borderColor: isDark ? '#334155' : '#E5E7EB', // Slate 700 vs Gray 200

    // MARCA
    primary: '#EC4899', 
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #F472B6 0%, #DB2777 100%)'  // Rosa más brillante en oscuro
      : 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)', // Rosa estándar en claro

    // TABLAS
    tableHeaderBg: isDark ? '#0F172A' : '#E5E7EB', 
    tableHeaderText: isDark ? '#F472B6' : '#374151', // Rosa neón en dark para los headers

    // ESTADOS Y DINERO
    accent: '#06B6D4',      // Cyan
    danger: '#EF4444',      // Rojo
    success: '#10B981',     // Verde Esmeralda (Para dinero)
    warning: '#F59E0B',     // Ámbar
    
    // BOTONES
    btnTextDark: '#111827', 
    btnTextLight: '#FFFFFF',
    
    money: isDark ? '#34D399' : '#059669', // Verde brillante en dark, verde oscuro en light
  };
};

// --- STATCARD CORREGIDA (Números grandes visibles) ---
const StatCard = ({ title, value, color, icon, styles, colors }) => (
  <div style={{
      ...styles.card, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      borderBottom: `4px solid ${color}`,
      height: '100%'
  }}>
    <div style={{
      fontSize: '2.5rem', 
      marginBottom: '1rem', 
      color: color,
      background: colors.elementBg,
      width: '80px', height: '80px',
      borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      {icon}
    </div>
    
    <h6 style={{ color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', fontSize: '0.85rem' }}>{title}</h6>
    
    {/* FORZAMOS el color del texto principal aquí */}
    <h3 style={{ color: colors.textMain, fontWeight: '800', margin: 0, fontSize: '2.2rem' }}>{value}</h3>
  </div>
);

// --- MODAL CONFIRMACIÓN ---
const ConfirmationModal = ({ show, onClose, onConfirm, title, message, colors }) => {
    if (!show) return null;
    return (
      <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(3px)', zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ borderRadius: '16px', border: `1px solid ${colors.borderColor}`, backgroundColor: colors.cardBg, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <div className="modal-header border-0 pb-0 pt-4 px-4">
              <h5 className="modal-title fw-bold" style={{ color: colors.textMain }}>{title}</h5>
              <button type="button" className="btn-close" style={{filter: colors.bg === '#0F172A' ? 'invert(1)' : 'none'}} onClick={onClose}></button>
            </div>
            <div className="modal-body px-4 pt-3 pb-4">
              <p style={{color: colors.textSecondary, fontSize: '1rem'}}>{message}</p>
            </div>
            <div className="modal-footer border-0 px-4 pb-4">
              <button className="btn rounded-pill px-4 fw-bold" style={{backgroundColor: colors.elementBg, color: colors.textMain}} onClick={onClose}>Cancelar</button>
              <button className="btn rounded-pill px-4 fw-bold text-white" style={{backgroundColor: colors.danger}} onClick={onConfirm}>Confirmar</button>
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
      fontFamily: '"Nunito", sans-serif',
      padding: '30px 15px',
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
    },
    navPillsContainer: {
      backgroundColor: colors.cardBg,
      borderRadius: '20px',
      padding: '8px',
      display: 'inline-flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      marginBottom: '35px',
      border: `1px solid ${colors.borderColor}`
    },
    navLink: {
      color: colors.textSecondary,
      borderRadius: '12px',
      padding: '8px 20px',
      fontWeight: '600',
      border: 'none',
      background: 'transparent',
      transition: 'all 0.2s',
    },
    navLinkActive: {
      background: colors.primaryGradient,
      color: 'white',
      fontWeight: '700',
      boxShadow: '0 4px 12px rgba(236, 72, 153, 0.4)',
    },
    card: {
      backgroundColor: colors.cardBg,
      color: colors.textMain,
      borderRadius: '24px',
      border: `1px solid ${colors.borderColor}`,
      boxShadow: theme === 'dark' ? '0 10px 30px rgba(0,0,0,0.5)' : '0 5px 20px rgba(0,0,0,0.05)',
      padding: '30px',
    },
    // Corrección para tablas
    table: {
       '--bs-table-bg': 'transparent',
       '--bs-table-color': colors.textMain,
       '--bs-table-border-color': colors.borderColor,
       width: '100%',
       marginBottom: 0
    },
    tableHeader: {
      backgroundColor: colors.tableHeaderBg,
      color: colors.tableHeaderText,
      fontWeight: '700',
      borderBottom: 'none',
      textTransform: 'uppercase',
      fontSize: '0.8rem',
      letterSpacing: '0.05em',
      padding: '16px'
    },
    tableCell: {
       padding: '16px',
       verticalAlign: 'middle',
       color: colors.textMain, // Importante para que el texto general se vea
       borderBottom: `1px solid ${colors.borderColor}`
    },
    btnAdd: {
      background: colors.primaryGradient,
      border: 'none',
      borderRadius: '50px',
      color: 'white',
      padding: '12px 25px',
      fontWeight: '700',
      boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)',
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
        marginBottom: '5px'
    }),
    btnAction: (color, isOutline = true) => ({
      backgroundColor: isOutline ? 'transparent' : color,
      border: isOutline ? `1px solid ${color}` : 'none',
      color: isOutline ? color : 'white',
      borderRadius: '10px',
      padding: '6px 14px',
      fontWeight: '600',
      fontSize: '0.8rem',
      marginRight: '8px'
    }),
    badge: (bgColor, textColor) => ({
      backgroundColor: bgColor,
      color: textColor,
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: '800',
      letterSpacing: '0.5px',
      textTransform: 'uppercase'
    }),
    input: {
        backgroundColor: colors.elementBg,
        color: colors.textMain,
        border: `1px solid ${colors.borderColor}`,
        padding: '10px',
        borderRadius: '8px',
        width: '100%',
        outline: 'none'
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
        <div className="text-center mb-4 pt-2">
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

          {/* === INVENTARIO === */}
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
                      <th style={{...styles.tableHeader, borderRadius: '12px 0 0 12px'}}>Producto</th>
                      <th style={styles.tableHeader}>Precio</th>
                      <th style={styles.tableHeader}>Stock</th>
                      <th style={styles.tableHeader}>Estado</th>
                      <th style={{...styles.tableHeader, borderRadius: '0 12px 12px 0', textAlign: 'center'}}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((p) => (
                      <tr key={p.id}>
                        <td style={styles.tableCell}>
                            <div className="fw-bold" style={{color: colors.textMain}}>{p.nombre}</div>
                            <small style={{color: colors.textSecondary}}>{p.categoria}</small>
                        </td>
                        {/* PRECIO CON COLOR FORZADO */}
                        <td style={{...styles.tableCell, color: colors.money, fontWeight: '800', fontSize: '1.1rem'}}>${Number(p.precio).toFixed(2)}</td>
                        <td style={styles.tableCell}>
                            {p.stock <= 5 
                             ? <span style={styles.badge(theme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2', colors.danger)}>Bajo: {p.stock}</span> 
                             : <span style={{color: colors.textSecondary, fontWeight: '600'}}>{p.stock} u.</span>}
                        </td>
                        <td style={styles.tableCell}>
                            {p.en_oferta 
                             ? <span style={styles.badge(theme === 'dark' ? 'rgba(6, 182, 212, 0.2)' : '#ECFEFF', colors.accent)}>Oferta -{p.descuento_porcentaje}%</span> 
                             : <span style={styles.badge(colors.elementBg, colors.textSecondary)}>Normal</span>}
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
                     <th style={{...styles.tableHeader, borderRadius: '12px 0 0 12px'}}>ID / Cliente</th>
                     <th style={styles.tableHeader}>Total</th>
                     <th style={styles.tableHeader}>Tipo</th>
                     <th style={styles.tableHeader}>Estado</th>
                     <th style={{...styles.tableHeader, borderRadius: '0 12px 12px 0'}}>Control</th>
                   </tr>
                 </thead>
                 <tbody>
                   {pedidos.map((p) => (
                     <tr key={p.id}>
                       <td style={styles.tableCell}>
                          <div className="d-flex align-items-center">
                            <span className="fw-bold me-3 px-2 py-1 rounded" style={{color: colors.primary, backgroundColor: colors.elementBg}}>#{p.id}</span>
                            <div>
                                <div className="fw-bold" style={{color: colors.textMain}}>{p.nombre_cliente}</div>
                                <small style={{color: colors.textSecondary}}>{new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                            </div>
                          </div>
                       </td>
                       {/* TOTAL EN VERDE O ROSA PARA QUE RESALTE */}
                       <td style={{...styles.tableCell, color: colors.money, fontWeight: '900', fontSize: '1.2rem'}}>${Number(p.total).toFixed(2)}</td>
                       <td style={styles.tableCell}>
                         {p.tipo_orden === 'domicilio' 
                           ? <span style={styles.badge(theme === 'dark' ? 'rgba(6, 182, 212, 0.2)' : '#ECFEFF', colors.accent)}>🛵 Domicilio</span> 
                           : <span style={styles.badge(theme === 'dark' ? 'rgba(245, 158, 11, 0.2)' : '#FFFBEB', colors.warning)}>🏪 Recoger</span>}
                       </td>
                       <td style={styles.tableCell}>
                          <span style={styles.badge(
                              p.estado === 'Pendiente' ? colors.btnPrepare : (p.estado === 'Completado' ? colors.success : colors.elementBg),
                              p.estado === 'Pendiente' ? colors.btnTextDark : (p.estado === 'Completado' ? 'white' : colors.textMain)
                          )}>
                              {p.estado}
                          </span>
                       </td>
                       <td style={styles.tableCell}>
                           <div className="d-flex flex-wrap">
                               <button style={styles.btnControl(colors.btnView, 'white')} onClick={() => {setSelectedOrderDetails(p); setShowDetailsModal(true);}}>Ver</button>
                               {p.estado !== 'Completado' && (
                                   <>
                                       <button style={styles.btnControl(colors.btnPrepare, colors.btnTextDark)} onClick={() => handleUpdateStatus(p.id, 'En Preparacion')}>Prep</button>
                                       {p.tipo_orden === 'domicilio' 
                                            ? <button style={styles.btnControl(colors.btnWay, 'white')} onClick={() => handleUpdateStatus(p.id, 'En Camino')}>Moto</button> 
                                            : <button style={styles.btnControl(colors.btnReady, colors.btnTextDark)} onClick={() => handleUpdateStatus(p.id, 'Listo')}>Listo</button>}
                                       <button style={styles.btnControl(colors.btnDone, 'white')} onClick={() => handleUpdateStatus(p.id, 'Completado')}>OK</button>
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
                       borderRadius: '24px', 
                       padding: '25px', 
                       backgroundColor: colors.elementBg, 
                       color: colors.textMain, 
                       boxShadow: '0 10px 20px rgba(0,0,0,0.05)'
                    }}>
                     <div className="d-flex justify-content-between align-items-start mb-3">
                       <h5 className="fw-bold mb-0" style={{color: colors.textMain}}>{combo.nombre}</h5>
                       <span style={styles.badge(combo.esta_activo ? colors.success : colors.danger, 'white')}>
                           {combo.esta_activo ? 'ACTIVO' : 'OCULTO'}
                       </span>
                     </div>
                     <h4 style={{color: colors.primary, fontWeight: '800', fontSize: '1.8rem'}}>${Number(combo.precio).toFixed(2)}</h4>
                     <div className="mt-4 d-flex gap-2">
                       <button style={{...styles.btnAction(colors.accent, true), flex:1}} onClick={() => handleOpenComboModal(combo)}>Editar</button>
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
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 overflow-hidden" style={{backgroundColor: colors.cardBg, color: colors.textMain, border: `1px solid ${colors.borderColor}`}}>
              <div className="modal-header text-white border-0" style={{backgroundColor: colors.danger}}><h5 className="modal-title fw-bold">⚠️ Borrar Todo</h5><button type="button" className="btn-close btn-close-white" onClick={() => setShowPurgeModal(false)}></button></div>
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