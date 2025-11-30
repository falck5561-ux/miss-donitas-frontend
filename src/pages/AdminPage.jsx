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

// --- 1. PALETA DE COLORES DEFINITIVA (PROFESIONAL) ---
const getThemeColors = (mode) => {
  const isDark = mode === 'dark';

  return {
    // FONDOS
    bg: isDark ? '#121212' : '#F4F6F8', // Gris Mate vs Blanco Humo
    cardBg: isDark ? '#1E1E1E' : '#FFFFFF', // Tarjetas oscuras vs Blancas puras
    elementBg: isDark ? '#2D2D2D' : '#F8F9FA', // Inputs y elementos secundarios

    // TEXTOS (CONTRASTE MÁXIMO)
    textMain: isDark ? '#E0E0E0' : '#212121', // Blanco hueso vs Negro casi puro
    textSecondary: isDark ? '#A0A0A0' : '#666666', // Gris medio
    
    // BORDES
    borderColor: isDark ? '#404040' : '#D1D5DB',

    // MARCA
    primary: '#E91E63', // Rosa Donitas
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)' 
      : 'linear-gradient(135deg, #FF80AB 0%, #F50057 100%)',

    // DINERO (Siempre visible)
    money: isDark ? '#81C784' : '#2E7D32', // Verde claro en dark, Verde oscuro en light
    
    // ESTADOS
    success: isDark ? '#66BB6A' : '#28A745',
    warning: isDark ? '#FFA726' : '#FFC107',
    danger: isDark ? '#EF5350' : '#DC3545',
    info: isDark ? '#42A5F5' : '#17A2B8',
  };
};

// --- 2. COMPONENTE KPI (Tarjeta de Métricas) ---
const StatCard = ({ title, value, color, icon, styles, colors }) => (
  <div style={{
      ...styles.card, 
      borderBottom: `4px solid ${color}`,
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      height: '100%'
  }}>
    <div style={{ fontSize: '2.5rem', marginBottom: '10px', color: color }}>
      {icon}
    </div>
    <h6 style={{ color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>{title}</h6>
    <h3 style={{ color: colors.textMain, fontWeight: '800', margin: 0, fontSize: '2rem' }}>{value}</h3>
  </div>
);

// --- 3. MODAL CONFIRMACIÓN (Interno) ---
const ConfirmationModal = ({ show, onClose, onConfirm, title, message, colors }) => {
    if (!show) return null;
    return (
      <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ borderRadius: '15px', border: `1px solid ${colors.borderColor}`, backgroundColor: colors.cardBg, color: colors.textMain }}>
            <div className="modal-header border-0 pb-0 pt-4 px-4">
              <h5 className="modal-title fw-bold">{title}</h5>
              <button type="button" className="btn-close" style={{filter: colors.bg === '#121212' ? 'invert(1)' : 'none'}} onClick={onClose}></button>
            </div>
            <div className="modal-body px-4 pt-3 pb-4">
              <p style={{fontSize: '1.1rem'}}>{message}</p>
            </div>
            <div className="modal-footer border-0 px-4 pb-4">
              <button className="btn btn-secondary rounded-pill" onClick={onClose}>Cancelar</button>
              <button className="btn btn-danger rounded-pill" onClick={onConfirm}>Confirmar</button>
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

  // --- 4. ESTILOS JS ---
  const styles = {
    container: {
      backgroundColor: colors.bg,
      minHeight: '100vh',
      fontFamily: '"Nunito", sans-serif',
      padding: '30px 20px',
      color: colors.textMain,
      transition: 'background-color 0.3s ease'
    },
    headerTitle: {
      color: colors.primary,
      fontWeight: '900',
      fontSize: '2.5rem',
      marginBottom: '5px',
    },
    navPillsContainer: {
      backgroundColor: colors.cardBg,
      borderRadius: '50px',
      padding: '5px',
      display: 'inline-flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '5px',
      marginBottom: '30px',
      border: `1px solid ${colors.borderColor}`,
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
    },
    navLink: {
      color: colors.textSecondary,
      borderRadius: '25px',
      padding: '8px 20px',
      fontWeight: '600',
      border: 'none',
      background: 'transparent',
      transition: 'all 0.2s',
    },
    navLinkActive: {
      background: colors.primary,
      color: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    },
    card: {
      backgroundColor: colors.cardBg,
      color: colors.textMain,
      borderRadius: '16px',
      border: `1px solid ${colors.borderColor}`,
      boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)',
      padding: '25px',
      marginBottom: '20px'
    },
    table: {
       width: '100%',
       borderCollapse: 'separate', 
       borderSpacing: '0' 
    },
    tableHeader: {
      backgroundColor: colors.elementBg,
      color: colors.textMain,
      fontWeight: '700',
      textTransform: 'uppercase',
      fontSize: '0.8rem',
      padding: '12px',
      borderBottom: `2px solid ${colors.borderColor}`
    },
    tableCell: {
       padding: '16px 12px',
       verticalAlign: 'middle',
       color: colors.textMain,
       borderBottom: `1px solid ${colors.borderColor}`
    },
    btnAction: (color, isOutline = true) => ({
      backgroundColor: isOutline ? 'transparent' : color,
      border: `1px solid ${color}`,
      color: isOutline ? color : 'white',
      borderRadius: '8px',
      padding: '6px 12px',
      fontWeight: '600',
      fontSize: '0.8rem',
      marginRight: '5px',
      cursor: 'pointer'
    }),
    badge: (bg, txt) => ({
        backgroundColor: bg,
        color: txt,
        padding: '5px 10px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: '700',
        textTransform: 'uppercase'
    })
  };

  const [activeTab, setActiveTab] = useState('pedidosEnLinea');
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(false);
  
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
    setLoading(true);
    try {
      if (activeTab === 'productos') { const res = await getProducts(); setProductos(res); } 
      else if (activeTab === 'reporteGeneral') { const res = await apiClient.get('/ventas/reporte'); setReportData(res.data); } 
      else if (activeTab === 'pedidosEnLinea') { const res = await apiClient.get('/pedidos'); setPedidos(res.data); } 
      else if (activeTab === 'combos') { const res = await apiClient.get('/combos/admin/todos'); setCombos(res.data); }
    } catch (err) { console.error(err); } 
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
      {/* !!! PARCHE CSS GLOBAL !!! 
          Esto soluciona el problema de los Modales Blancos y Inputs Invisibles 
          inyectando estilos que Bootstrap no puede ignorar.
      */}
      <style>{`
        .modal-content {
          background-color: ${colors.cardBg} !important;
          color: ${colors.textMain} !important;
          border: 1px solid ${colors.borderColor} !important;
        }
        .form-control, .form-select {
          background-color: ${colors.elementBg} !important;
          color: ${colors.textMain} !important;
          border-color: ${colors.borderColor} !important;
        }
        .form-control:focus, .form-select:focus {
          background-color: ${colors.elementBg} !important;
          color: ${colors.textMain} !important;
          border-color: ${colors.primary} !important;
          box-shadow: 0 0 0 0.25rem rgba(233, 30, 99, 0.25) !important;
        }
        /* Para corregir los placeholders en dark mode */
        ::placeholder {
          color: ${colors.textSecondary} !important;
          opacity: 0.7 !important;
        }
        .btn-close {
            filter: ${isDark ? 'invert(1)' : 'none'};
        }
      `}</style>

      <div className="container-fluid px-md-5">
        
        {/* HEADER */}
        <div className="text-center mb-5 pt-3">
          <h1 style={styles.headerTitle}>🍩 Miss Donitas Admin</h1>
          <span className="badge rounded-pill" style={{backgroundColor: isDark ? '#333' : '#E0E0E0', color: isDark ? '#FFF' : '#333'}}>
            {isDark ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}
          </span>
        </div>

        {/* NAV */}
        <div className="d-flex justify-content-center">
          <div style={styles.navPillsContainer}>
            {[
              { id: 'pedidosEnLinea', label: 'Pedidos' },
              { id: 'productos', label: 'Productos' },
              { id: 'combos', label: 'Combos' },
              { id: 'reporteGeneral', label: 'Reportes' },
              { id: 'reporteProductos', label: 'Métricas' }
            ].map(tab => (
              <button key={tab.id} style={activeTab === tab.id ? {...styles.navLink, ...styles.navLinkActive} : styles.navLink} onClick={() => setActiveTab(tab.id)}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* CARD PRINCIPAL */}
        <div style={styles.card}>
          
          {loading && <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>}

          {/* === INVENTARIO === */}
          {!loading && activeTab === 'productos' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold m-0">Inventario</h3>
                <button className="btn text-white fw-bold rounded-pill" style={{backgroundColor: colors.primary}} onClick={() => handleOpenProductModal()}>+ Nuevo</button>
              </div>
              <div className="table-responsive">
                <table className="table align-middle" style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>Producto</th>
                      <th style={styles.tableHeader}>Precio</th>
                      <th style={styles.tableHeader}>Stock</th>
                      <th style={styles.tableHeader}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((p) => (
                      <tr key={p.id}>
                        <td style={styles.tableCell}>
                            <div className="fw-bold">{p.nombre}</div>
                            <small style={{color: colors.textSecondary}}>{p.categoria}</small>
                        </td>
                        <td style={{...styles.tableCell, color: colors.money, fontWeight: 'bold', fontSize: '1.1rem'}}>
                            ${Number(p.precio).toFixed(2)}
                        </td>
                        <td style={styles.tableCell}>
                            {p.stock <= 5 
                             ? <span style={styles.badge(colors.danger, 'white')}>Bajo: {p.stock}</span>
                             : <span>{p.stock} u.</span>}
                        </td>
                        <td style={styles.tableCell}>
                          <button style={styles.btnAction(colors.info, true)} onClick={() => handleOpenProductModal(p)}>Editar</button>
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
          {!loading && activeTab === 'pedidosEnLinea' && (
             <div>
             <div className="d-flex justify-content-between align-items-center mb-4">
               <h3 className="fw-bold m-0">Pedidos</h3>
               <span className="badge bg-danger rounded-pill">
                  {pedidos.filter(p => p.estado === 'Pendiente').length} Pendientes
               </span>
             </div>
             <div className="table-responsive">
               <table className="table align-middle" style={styles.table}>
                 <thead>
                   <tr>
                     <th style={styles.tableHeader}>ID / Cliente</th>
                     <th style={styles.tableHeader}>Total</th>
                     <th style={styles.tableHeader}>Estado</th>
                     <th style={styles.tableHeader}>Acciones</th>
                   </tr>
                 </thead>
                 <tbody>
                   {pedidos.map((p) => (
                     <tr key={p.id}>
                       <td style={styles.tableCell}>
                          <span className="fw-bold me-2" style={{color: colors.primary}}>#{p.id}</span>
                          {p.nombre_cliente}
                       </td>
                       <td style={{...styles.tableCell, color: colors.money, fontWeight: 'bold'}}>${Number(p.total).toFixed(2)}</td>
                       <td style={styles.tableCell}>
                          <span style={styles.badge(
                              p.estado === 'Completado' ? colors.success : 
                              p.estado === 'Pendiente' ? colors.warning : colors.elementBg,
                              p.estado === 'Pendiente' ? '#333' : 'white'
                          )}>
                              {p.estado}
                          </span>
                       </td>
                       <td style={styles.tableCell}>
                           <button className="btn btn-sm btn-outline-secondary rounded-pill me-2" onClick={() => {setSelectedOrderDetails(p); setShowDetailsModal(true);}}>Ver</button>
                           {p.estado !== 'Completado' && (
                               <button className="btn btn-sm btn-success rounded-pill text-white" onClick={() => handleUpdateStatus(p.id, 'Completado')}>OK</button>
                           )}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
          )}

          {/* === COMBOS === */}
          {!loading && activeTab === 'combos' && (
             <div>
             <div className="d-flex justify-content-between align-items-center mb-4">
               <h3 className="fw-bold m-0">Combos</h3>
               <button className="btn text-white fw-bold rounded-pill" style={{backgroundColor: colors.primary}} onClick={() => handleOpenComboModal()}>+ Nuevo</button>
             </div>
             <div className="row g-4">
               {combos.map((combo) => (
                 <div className="col-md-6 col-lg-4" key={combo.id}>
                   <div style={{
                       border: `1px solid ${colors.borderColor}`, 
                       borderRadius: '16px', 
                       padding: '20px', 
                       backgroundColor: colors.elementBg, 
                       color: colors.textMain
                    }}>
                     <div className="d-flex justify-content-between align-items-start mb-2">
                       <h5 className="fw-bold mb-0">{combo.nombre}</h5>
                       {combo.esta_activo 
                           ? <span style={styles.badge(colors.success, 'white')}>ACTIVO</span>
                           : <span style={styles.badge(colors.danger, 'white')}>OCULTO</span>}
                     </div>
                     <h3 style={{color: colors.primary, fontWeight: '800'}}>${Number(combo.precio).toFixed(2)}</h3>
                     
                     <div className="mt-3 d-flex gap-2">
                       <button className="btn btn-sm w-100" style={{border: `1px solid ${colors.info}`, color: colors.info}} onClick={() => handleOpenComboModal(combo)}>Editar</button>
                       {combo.esta_activo && <button className="btn btn-sm btn-outline-danger w-100" onClick={() => handleDeleteCombo(combo)}>Ocultar</button>}
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           </div>
          )}

          {/* === REPORTES === */}
          {!loading && activeTab === 'reporteGeneral' && (
            <div>
               <div className="row mb-5 g-4">
                 <div className="col-md-6">
                   <StatCard title="Ventas Totales" value={`$${reportData.reduce((acc, curr) => acc + Number(curr.total_ventas), 0).toFixed(2)}`} color={colors.success} icon="💰" styles={styles} colors={colors} />
                 </div>
                 <div className="col-md-6">
                   <StatCard title="Promedio Venta" value="$150.00" color={colors.info} icon="📈" styles={styles} colors={colors} />
                 </div>
               </div>
               <div style={{padding: '20px', backgroundColor: colors.elementBg, borderRadius: '16px', border: `1px solid ${colors.borderColor}`}}>
                    <SalesReportChart reportData={reportData} theme={theme} /> 
               </div>
               <div className="mt-4 text-end">
                   <button className="btn btn-danger btn-sm rounded-pill" onClick={() => setShowPurgeModal(true)}>Purgar Datos</button>
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
            <div className="modal-content border-0 rounded-4 overflow-hidden" style={{backgroundColor: colors.cardBg, color: colors.textMain, border: `1px solid ${colors.borderColor}`}}>
              <div className="modal-header text-white border-0" style={{backgroundColor: colors.danger}}><h5 className="modal-title fw-bold">⚠️ Borrar Todo</h5><button type="button" className="btn-close" onClick={() => setShowPurgeModal(false)}></button></div>
              <div className="modal-body p-4">
                <input type="text" className="form-control" value={purgeConfirmText} onChange={(e) => setPurgeConfirmText(e.target.value)} placeholder="Escribe ELIMINAR" />
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-danger w-100 rounded-pill" onClick={handlePurge} disabled={purgeConfirmText !== 'ELIMINAR'}>Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;