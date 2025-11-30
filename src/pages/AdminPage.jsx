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

// --- PALETA "CHOCOLATE & FRESA" (CONTRASTE GARANTIZADO) ---
const getThemeColors = (mode) => {
  const isDark = mode === 'dark';

  return {
    // === FONDOS ===
    // Light: Crema suave (Vainilla)
    // Dark: Chocolate Amargo Profundo (Casi negro, pero cálido)
    bg: isDark ? '#120b0b' : '#FFFBF0', 
    
    // Cards (Contenedores)
    // Light: Blanco puro
    // Dark: Café muy oscuro
    cardBg: isDark ? '#1F1515' : '#FFFFFF',
    
    // Elementos (Inputs, Filas)
    elementBg: isDark ? '#2E2020' : '#F7F2F9',

    // === TEXTOS (LA CLAVE DEL ARREGLO) ===
    // Light: CAFÉ OSCURO (#3E2723). NUNCA BLANCO.
    // Dark: CREMA (#ECE0DB).
    textMain: isDark ? '#ECE0DB' : '#3E2723', 
    
    // Texto Secundario
    textSecondary: isDark ? '#BCAAA4' : '#8D6E63',

    // Títulos
    // Light: Rosa Mexicano
    // Dark: Naranja/Caramelo
    textHeader: isDark ? '#FFAB40' : '#E91E63',

    // === BORDES ===
    borderColor: isDark ? '#3E2723' : '#FCE4EC',
    
    // === MARCA PRINCIPAL (BOTONES) ===
    primary: '#E91E63', // Rosa Donita siempre se ve bien
    
    // Degradados
    primaryGradient: 'linear-gradient(135deg, #FF4081 0%, #C2185B 100%)',

    // === TABLAS (CORRECCIÓN DE TU IMAGEN) ===
    // Light: Fondo rosa muy pálido para el header, NO NEGRO.
    // Dark: Fondo café oscuro.
    tableHeaderBg: isDark ? '#2E2020' : '#FFF0F5',
    
    // Texto del header de tabla
    tableHeaderText: isDark ? '#FFAB40' : '#880E4F',

    // === DINERO ===
    // Light: Verde Bosque
    // Dark: Dorado
    money: isDark ? '#FFD700' : '#2E7D32', 

    // === SHADOWS ===
    cardShadow: isDark 
        ? '0 10px 40px rgba(0,0,0,0.6)' 
        : '0 10px 40px rgba(233, 30, 99, 0.1)',

    // === BADGES (ESTADOS) ===
    badgeSuccessBg: isDark ? '#1B5E20' : '#E8F5E9',
    badgeSuccessTxt: isDark ? '#69F0AE' : '#2E7D32',

    badgeWarnBg: isDark ? '#3E2723' : '#FFF8E1',
    badgeWarnTxt: isDark ? '#FFAB00' : '#F57F17',

    badgeDangerBg: isDark ? '#3B0B0B' : '#FFEBEE',
    badgeDangerTxt: isDark ? '#FF5252' : '#C62828',
    
    badgeInfoBg: isDark ? '#0D47A1' : '#E3F2FD',
    badgeInfoTxt: isDark ? '#40C4FF' : '#1565C0',
  };
};

// --- KPI CARD ---
const StatCard = ({ title, value, color, icon, styles, colors }) => (
  <div style={{
      ...styles.card, 
      borderLeft: `5px solid ${color}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '25px'
  }}>
    <div>
        <h6 style={{ color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>{title}</h6>
        <h3 style={{ color: colors.textMain, fontWeight: '900', margin: 0, fontSize: '2rem' }}>{value}</h3>
    </div>
    <div style={{ fontSize: '2.5rem', color: color, opacity: 0.8 }}>
      {icon}
    </div>
  </div>
);

function AdminPage() {
  const { theme } = useTheme(); 
  const colors = getThemeColors(theme);
  const isDark = theme === 'dark';

  const styles = {
    container: {
      backgroundColor: colors.bg,
      minHeight: '100vh',
      fontFamily: '"Nunito", sans-serif',
      padding: '40px 20px',
      color: colors.textMain,
      transition: 'all 0.3s ease'
    },
    headerTitle: {
      background: colors.primaryGradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontWeight: '900',
      fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
      marginBottom: '30px',
      textAlign: 'center'
    },
    navPillsContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '10px',
      marginBottom: '40px',
    },
    navLink: {
      color: colors.textSecondary,
      borderRadius: '25px',
      padding: '10px 25px',
      fontWeight: '700',
      border: `2px solid ${colors.borderColor}`,
      background: colors.cardBg,
      transition: 'all 0.2s ease',
    },
    navLinkActive: {
      background: colors.primary,
      borderColor: colors.primary,
      color: 'white',
      boxShadow: '0 4px 15px rgba(233, 30, 99, 0.4)'
    },
    card: {
      backgroundColor: colors.cardBg,
      color: colors.textMain,
      borderRadius: '24px',
      border: `1px solid ${colors.borderColor}`,
      boxShadow: colors.cardShadow,
      padding: '30px',
      marginBottom: '30px',
    },
    // --- TABLAS ARREGLADAS ---
    table: {
       '--bs-table-bg': 'transparent', 
       width: '100%',
       borderCollapse: 'separate', 
       borderSpacing: '0' 
    },
    tableHeader: {
      backgroundColor: colors.tableHeaderBg, // ROSA PÁLIDO O DARK
      color: colors.tableHeaderText,         // ROJO O NARANJA
      fontWeight: '800',
      borderBottom: `2px solid ${colors.borderColor}`,
      textTransform: 'uppercase',
      fontSize: '0.8rem',
      padding: '18px',
      letterSpacing: '1px'
    },
    tableRow: {
       backgroundColor: 'transparent', 
       transition: 'background-color 0.2s',
    },
    tableCell: {
       padding: '20px 18px',
       verticalAlign: 'middle',
       borderBottom: `1px solid ${colors.borderColor}`, 
       color: colors.textMain, // AQUÍ ESTABA EL ERROR ANTES
       fontSize: '0.95rem',
       fontWeight: '600'
    },
    btnAdd: {
      background: colors.primaryGradient,
      border: 'none',
      borderRadius: '50px',
      color: 'white',
      padding: '12px 30px',
      fontWeight: '700',
      boxShadow: '0 5px 15px rgba(233, 30, 99, 0.3)',
      textTransform: 'uppercase'
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
    }),
    btnAction: (color, isOutline = true) => ({
      backgroundColor: isOutline ? 'transparent' : color,
      border: `1px solid ${color}`,
      color: isOutline ? color : 'white',
      borderRadius: '10px',
      padding: '6px 14px',
      fontWeight: '700',
      fontSize: '0.8rem',
      marginRight: '8px',
    }),
    renderBadge: (text, bg, txt) => (
        <span style={{
            backgroundColor: bg,
            color: txt,
            padding: '8px 14px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: '800',
            textTransform: 'uppercase',
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
  
  // Modales
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
        <div className="text-center mb-4 pt-3">
          <h1 style={styles.headerTitle}>🍩 Miss Donitas Admin</h1>
        </div>

        {/* NAV */}
        <div className="d-flex justify-content-center">
          <div style={styles.navPillsContainer}>
            {[
              { id: 'pedidosEnLinea', label: 'Pedidos' },
              { id: 'productos', label: 'Donas & Inventario' },
              { id: 'combos', label: 'Promos' },
              { id: 'reporteGeneral', label: 'Caja' },
              { id: 'reporteProductos', label: 'Top Ventas' }
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

          {/* === INVENTARIO (TABLA QUE SE VEÍA MAL EN LA FOTO) === */}
          {!loading && !error && activeTab === 'productos' && (
            <div>
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                <h3 className="fw-bold m-0" style={{color: colors.textHeader}}>Catálogo de Donas</h3>
                <button style={styles.btnAdd} onClick={() => handleOpenProductModal()}>+ Nueva Dona</button>
              </div>
              <div className="table-responsive">
                <table className="table" style={styles.table}>
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
                            <div className="fw-bold" style={{fontSize: '1.05rem', color: colors.textMain}}>{p.nombre}</div>
                            <small style={{color: colors.textSecondary}}>{p.categoria}</small>
                        </td>
                        <td style={{...styles.tableCell, color: colors.money, fontWeight: '900', fontSize: '1.2rem'}}>
                            ${Number(p.precio).toFixed(2)}
                        </td>
                        <td style={styles.tableCell}>
                            {p.stock <= 5 
                             ? styles.renderBadge(`Bajo: ${p.stock}`, colors.badgeDangerBg, colors.badgeDangerTxt)
                             : <span style={{fontWeight: 'bold', color: colors.textMain}}>{p.stock} pza.</span>}
                        </td>
                        <td style={styles.tableCell}>
                            {p.en_oferta 
                             ? styles.renderBadge(`Oferta -${p.descuento_porcentaje}%`, colors.badgeInfoBg, colors.badgeInfoTxt)
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
               <h3 className="fw-bold m-0" style={{color: colors.textHeader}}>Pedidos Entrantes</h3>
               {pedidos.filter(p => p.estado === 'Pendiente').length > 0 && (
                   <span style={{
                       backgroundColor: colors.primary, color: 'white', padding: '8px 20px', 
                       borderRadius: '30px', fontWeight: 'bold'
                   }}>
                     {pedidos.filter(p => p.estado === 'Pendiente').length} Por Atender
                   </span>
               )}
             </div>
             <div className="table-responsive">
               <table className="table" style={styles.table}>
                 <thead>
                   <tr>
                     <th style={styles.tableHeader}>ID / Cliente</th>
                     <th style={styles.tableHeader}>Total</th>
                     <th style={styles.tableHeader}>Método</th>
                     <th style={styles.tableHeader}>Status</th>
                     <th style={styles.tableHeader}>Acciones</th>
                   </tr>
                 </thead>
                 <tbody>
                   {pedidos.map((p) => (
                     <tr key={p.id} style={styles.tableRow}>
                       <td style={styles.tableCell}>
                          <div className="d-flex align-items-center">
                            <span className="fw-bold me-3" style={{color: colors.primary}}>#{p.id}</span>
                            <div>
                                <div className="fw-bold" style={{color: colors.textMain}}>{p.nombre_cliente}</div>
                                <small style={{color: colors.textSecondary}}>{new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                            </div>
                          </div>
                       </td>
                       <td style={{...styles.tableCell, color: colors.money, fontWeight: '900', fontSize: '1.2rem'}}>
                           ${Number(p.total).toFixed(2)}
                       </td>
                       <td style={styles.tableCell}>
                         {p.tipo_orden === 'domicilio' 
                           ? styles.renderBadge('🛵 Moto', colors.badgeInfoBg, colors.badgeInfoTxt)
                           : styles.renderBadge('🏪 Recoger', colors.badgeWarnBg, colors.badgeWarnTxt)}
                       </td>
                       <td style={styles.tableCell}>
                          {p.estado === 'Pendiente' 
                             ? styles.renderBadge('Pendiente', colors.badgeDangerBg, colors.badgeDangerTxt)
                             : styles.renderBadge(p.estado, colors.elementBg, colors.textMain)}
                       </td>
                       <td style={styles.tableCell}>
                           <div className="d-flex flex-wrap">
                               <button style={styles.btnControl(colors.elementBg, colors.textMain)} onClick={() => {setSelectedOrderDetails(p); setShowDetailsModal(true);}}>Ver</button>
                               {p.estado !== 'Completado' && (
                                   <>
                                        <button style={styles.btnControl(colors.badgeWarnBg, colors.badgeWarnTxt)} onClick={() => handleUpdateStatus(p.id, 'En Preparacion')}>Cocinar</button>
                                        {p.tipo_orden === 'domicilio' 
                                            ? <button style={styles.btnControl(colors.badgeInfoBg, colors.badgeInfoTxt)} onClick={() => handleUpdateStatus(p.id, 'En Camino')}>Moto</button> 
                                            : <button style={styles.btnControl(colors.badgeSuccessBg, colors.badgeSuccessTxt)} onClick={() => handleUpdateStatus(p.id, 'Listo')}>Listo</button>}
                                        <button style={styles.btnControl(colors.textMain, colors.bg)} onClick={() => handleUpdateStatus(p.id, 'Completado')}>OK</button>
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
               <h3 className="fw-bold m-0" style={{color: colors.textHeader}}>Promos Activas</h3>
               <button style={styles.btnAdd} onClick={() => handleOpenComboModal()}>+ Crear Combo</button>
             </div>
             <div className="row g-4">
               {combos.map((combo) => (
                 <div className="col-md-6 col-lg-4" key={combo.id}>
                   <div style={{
                       border: `1px solid ${combo.esta_activo ? colors.borderColor : colors.badgeDangerTxt}`, 
                       borderRadius: '20px', 
                       padding: '20px', 
                       backgroundColor: colors.elementBg, 
                       color: colors.textMain, 
                       height: '100%'
                    }}>
                     <div className="d-flex justify-content-between align-items-start mb-3">
                       <h5 className="fw-bold mb-0" style={{color: colors.textMain}}>{combo.nombre}</h5>
                       {combo.esta_activo 
                           ? styles.renderBadge('ON', colors.badgeSuccessBg, colors.badgeSuccessTxt)
                           : styles.renderBadge('OFF', colors.badgeDangerBg, colors.badgeDangerTxt)}
                     </div>
                     <h4 style={{color: colors.money, fontWeight: '900', fontSize: '1.8rem'}}>${Number(combo.precio).toFixed(2)}</h4>
                     <p style={{color: colors.textSecondary, fontSize: '0.9rem'}}>{combo.descripcion}</p>
                     
                     <div className="mt-3 d-flex gap-2">
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
                     color={colors.money} 
                     icon="💰" 
                     styles={styles} 
                     colors={colors} 
                   />
                 </div>
                 <div className="col-md-6">
                   <StatCard 
                     title="Promedio por Ticket" 
                     value="$150.00" 
                     color={colors.primary} 
                     icon="📈" 
                     styles={styles} 
                     colors={colors} 
                   />
                 </div>
               </div>
               
               <h5 className="mb-4 fw-bold" style={{color: colors.textHeader}}>Gráfica de Ventas</h5>
               <div style={{padding: '20px', backgroundColor: colors.elementBg, borderRadius: '20px', border: `1px solid ${colors.borderColor}`}}>
                    <SalesReportChart reportData={reportData} theme={theme} /> 
               </div>
               
               <div className="mt-5 text-end">
                   <button className="btn btn-outline-danger btn-sm rounded-pill" onClick={() => setShowPurgeModal(true)}>Purgar Datos</button>
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
            <div className="modal-content border-0 rounded-4 overflow-hidden" style={{backgroundColor: colors.cardBg, color: colors.textMain, border: `1px solid ${colors.badgeDangerTxt}`}}>
              <div className="modal-header border-0" style={{backgroundColor: colors.badgeDangerTxt}}><h5 className="modal-title fw-bold text-white">⚠️ Zona de Peligro</h5><button type="button" className="btn-close btn-close-white" onClick={() => setShowPurgeModal(false)}></button></div>
              <div className="modal-body p-4">
                <p>Escribe <strong>ELIMINAR</strong> para confirmar:</p>
                <input 
                    type="text" 
                    className='form-control'
                    style={{backgroundColor: colors.elementBg, color: colors.textMain, border: `1px solid ${colors.borderColor}`}}
                    value={purgeConfirmText} 
                    onChange={(e) => setPurgeConfirmText(e.target.value)} 
                />
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-danger w-100 rounded-pill" onClick={handlePurge} disabled={purgeConfirmText !== 'ELIMINAR'}>Borrar Todo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;