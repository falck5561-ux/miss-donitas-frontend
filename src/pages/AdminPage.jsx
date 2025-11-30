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

// --- NUEVA PALETA DE COLORES (MODERNA Y ALTO CONTRASTE) ---
const getThemeColors = (mode) => {
  const isDark = mode === 'dark';

  return {
    // FONDOS: Usamos escala "Slate" (Gris azulado) que es más premium que el negro puro
    bg: isDark ? '#0F172A' : '#F3F4F6', 
    cardBg: isDark ? '#1E293B' : '#FFFFFF',
    elementBg: isDark ? '#334155' : '#F9FAFB',
    
    // TEXTOS: Blanco puro en dark mode para máxima legibilidad
    textMain: isDark ? '#F8FAFC' : '#111827', 
    textSecondary: isDark ? '#94A3B8' : '#6B7280',
    textHeader: isDark ? '#F472B6' : '#DB2777', // Rosa moderno

    // BORDES Y SEPARADORES
    borderColor: isDark ? '#334155' : '#E5E7EB',
    
    // ACCIONES
    primary: '#EC4899', // Rosa vibrante
    primaryHover: '#DB2777',
    
    // ESTADOS (Pasteles en light, Neón suave en dark)
    successBg: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7',
    successTxt: isDark ? '#4ADE80' : '#166534',
    
    warnBg: isDark ? 'rgba(234, 179, 8, 0.2)' : '#FEF9C3',
    warnTxt: isDark ? '#FACC15' : '#854D0E',
    
    dangerBg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
    dangerTxt: isDark ? '#F87171' : '#991B1B',
    
    infoBg: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE',
    infoTxt: isDark ? '#60A5FA' : '#1E40AF',

    // SOMBRAS (Suaves y difusas)
    shadow: isDark 
      ? '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)'
      : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  };
};

// --- COMPONENTE KPI MEJORADO ---
const StatCard = ({ title, value, icon, colors, styles }) => (
  <div style={{
      backgroundColor: colors.cardBg,
      borderRadius: '16px',
      padding: '24px',
      boxShadow: colors.shadow,
      border: `1px solid ${colors.borderColor}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
  }}>
    <div>
        <p style={{ color: colors.textSecondary, fontSize: '0.875rem', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase' }}>{title}</p>
        <h3 style={{ color: colors.textMain, fontWeight: '800', margin: 0, fontSize: '1.8rem' }}>{value}</h3>
    </div>
    <div style={{ 
        width: '50px', height: '50px', borderRadius: '12px', 
        backgroundColor: colors.elementBg, display: 'flex', 
        alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' 
    }}>
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
      fontFamily: '"Inter", "Segoe UI", sans-serif', // Fuente más limpia
      padding: '20px',
      color: colors.textMain,
      transition: 'background-color 0.3s ease'
    },
    // Eliminamos el efecto "Card Gigante", ahora es un contenedor invisible
    mainWrapper: {
      maxWidth: '1400px',
      margin: '0 auto',
    },
    headerTitle: {
      color: colors.textMain,
      fontWeight: '800',
      fontSize: '2rem',
      letterSpacing: '-0.5px',
      marginBottom: '0'
    },
    // Navegación estilo "Pestañas flotantes"
    navContainer: {
      display: 'flex',
      gap: '8px',
      overflowX: 'auto',
      paddingBottom: '10px',
      marginBottom: '25px',
      borderBottom: `1px solid ${colors.borderColor}`
    },
    navLink: (isActive) => ({
      backgroundColor: isActive ? colors.primary : 'transparent',
      color: isActive ? '#fff' : colors.textSecondary,
      padding: '10px 20px',
      borderRadius: '8px',
      fontWeight: '600',
      border: 'none',
      fontSize: '0.95rem',
      cursor: 'pointer',
      transition: 'all 0.2s',
      whiteSpace: 'nowrap'
    }),
    // Contenedor de contenido limpio
    contentSection: {
      backgroundColor: colors.cardBg,
      borderRadius: '20px',
      border: `1px solid ${colors.borderColor}`,
      boxShadow: colors.shadow,
      padding: '30px',
      marginBottom: '30px'
    },
    // TABLAS LIMPIAS
    table: {
       width: '100%',
       borderCollapse: 'separate',
       borderSpacing: '0 8px' // Espacio entre filas
    },
    tableHeader: {
      color: colors.textSecondary,
      fontWeight: '700',
      textTransform: 'uppercase',
      fontSize: '0.75rem',
      padding: '15px',
      borderBottom: 'none',
      letterSpacing: '0.05em'
    },
    tableRow: {
       backgroundColor: isDark ? colors.elementBg : '#fff',
       transition: 'transform 0.1s',
       boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    },
    tableCell: {
       padding: '16px 15px',
       verticalAlign: 'middle',
       color: colors.textMain,
       borderTop: `1px solid ${colors.borderColor}`,
       borderBottom: `1px solid ${colors.borderColor}`,
       fontSize: '0.95rem'
    },
    // Celdas bordes redondeados
    firstCell: { borderRadius: '12px 0 0 12px', borderLeft: `1px solid ${colors.borderColor}` },
    lastCell: { borderRadius: '0 12px 12px 0', borderRight: `1px solid ${colors.borderColor}` },

    // BOTONES
    btnPrimary: {
      background: colors.primary,
      color: 'white',
      border: 'none',
      padding: '10px 24px',
      borderRadius: '10px',
      fontWeight: '600',
      boxShadow: `0 4px 12px ${isDark ? 'rgba(236, 72, 153, 0.4)' : 'rgba(236, 72, 153, 0.2)'}`,
      transition: 'transform 0.1s'
    },
    btnAction: (textColor, borderColor) => ({
        padding: '6px 12px',
        borderRadius: '8px',
        border: `1px solid ${borderColor}`,
        color: textColor,
        backgroundColor: 'transparent',
        fontSize: '0.8rem',
        fontWeight: '600',
        marginRight: '8px',
        cursor: 'pointer'
    }),
    badge: (bg, txt) => ({
        backgroundColor: bg,
        color: txt,
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: '700',
        display: 'inline-block'
    }),
    // INPUTS (Arreglo para modo oscuro)
    input: {
        backgroundColor: colors.elementBg,
        border: `1px solid ${colors.borderColor}`,
        color: colors.textMain,
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
  const handleSaveProducto = async (p) => { try { const d = { ...p, imagen_url: p.imagenes?.[0] || null }; delete d.imagenes; if (d.id) await updateProduct(d.id, d); else await createProduct(d); toast.success('Guardado con éxito'); fetchData(); setShowProductModal(false); } catch { toast.error('Error al guardar'); } };
  const handleDeleteProducto = (p) => { setConfirmTitle('Ocultar Producto'); setConfirmMessage(`¿Ocultar "${p.nombre}"?`); setConfirmAction(() => async () => { await deleteProduct(p.id); toast.success('Producto ocultado'); fetchData(); setShowConfirmModal(false); }); setShowConfirmModal(true); };
  const handleOpenComboModal = (c = null) => { setComboActual(c); setShowComboModal(true); };
  const handleSaveCombo = async (c) => { try { if(c.id) await apiClient.put(`/combos/${c.id}`, c); else await apiClient.post('/combos', c); toast.success('Combo guardado'); fetchData(); setShowComboModal(false); } catch { toast.error('Error'); } };
  const handleDeleteCombo = (c) => { setConfirmTitle('Ocultar Combo'); setConfirmMessage(`¿Ocultar "${c.nombre}"?`); setConfirmAction(() => async () => { await apiClient.patch(`/combos/${c.id}/desactivar`); toast.success('Ocultado'); fetchData(); setShowConfirmModal(false); }); setShowConfirmModal(true); };
  const handleUpdateStatus = async (id, est) => { try { await apiClient.put(`/pedidos/${id}/estado`, { estado: est }); toast.success(`Pedido #${id}: ${est}`); fetchData(); } catch { toast.error('Error'); } };
  const handlePurge = async () => { if(purgeConfirmText !== 'ELIMINAR') return toast.error('Escribe ELIMINAR'); await apiClient.delete('/pedidos/purgar'); toast.success('Historial borrado'); setShowPurgeModal(false); fetchData(); };

  return (
    <div style={styles.container}>
      <div style={styles.mainWrapper}>
        
        {/* HEADER LIMPIO */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 style={styles.headerTitle}>Miss Donitas <span style={{color: colors.primary}}>.</span></h1>
            <p style={{color: colors.textSecondary, margin: 0}}>Panel de Administración</p>
          </div>
          <div style={{textAlign: 'right'}}>
             {/* Aquí podrías poner el toggle de tema si no está en el navbar global */}
          </div>
        </div>

        {/* NAVEGACIÓN TIPO TABS (Sin cajas) */}
        <div style={styles.navContainer}>
            {[
              { id: 'pedidosEnLinea', label: '🛎️ Pedidos' },
              { id: 'productos', label: '🍩 Inventario' },
              { id: 'combos', label: '🎁 Promociones' },
              { id: 'reporteGeneral', label: '📊 Finanzas' },
              { id: 'reporteProductos', label: '📈 Métricas' }
            ].map(tab => (
              <button 
                key={tab.id} 
                style={styles.navLink(activeTab === tab.id)} 
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div>
          {loading && <div className="text-center py-5"><div className="spinner-border" style={{color: colors.primary}} role="status"></div></div>}
          {error && <div className="alert alert-danger">{error}</div>}

          {/* TABLA INVENTARIO */}
          {!loading && !error && activeTab === 'productos' && (
            <div style={styles.contentSection}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold m-0" style={{color: colors.textMain}}>Catálogo de Productos</h4>
                <button style={styles.btnPrimary} onClick={() => handleOpenProductModal()}>+ Nuevo Producto</button>
              </div>
              <div className="table-responsive">
                <table style={styles.table}>
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
                        <td style={{...styles.tableCell, ...styles.firstCell}}>
                            <div className="fw-bold">{p.nombre}</div>
                            <small style={{color: colors.textSecondary}}>{p.categoria}</small>
                        </td>
                        <td style={styles.tableCell}>${Number(p.precio).toFixed(2)}</td>
                        <td style={styles.tableCell}>
                             {p.stock <= 5 
                                ? <span style={styles.badge(colors.dangerBg, colors.dangerTxt)}>Bajo: {p.stock}</span> 
                                : <span style={{color: colors.textSecondary}}>{p.stock} u.</span>}
                        </td>
                        <td style={styles.tableCell}>
                            {p.en_oferta 
                                ? <span style={styles.badge(colors.infoBg, colors.infoTxt)}>Oferta -{p.descuento_porcentaje}%</span> 
                                : <span style={{color: colors.textSecondary, fontSize: '0.85rem'}}>Normal</span>}
                        </td>
                        <td style={{...styles.tableCell, ...styles.lastCell, textAlign: 'right'}}>
                          <button style={styles.btnAction(colors.textSecondary, colors.borderColor)} onClick={() => handleOpenProductModal(p)}>Editar</button>
                          <button style={styles.btnAction(colors.dangerTxt, colors.dangerBg)} onClick={() => handleDeleteProducto(p)}>Ocultar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABLA PEDIDOS */}
          {!loading && !error && activeTab === 'pedidosEnLinea' && (
             <div style={styles.contentSection}>
             <div className="d-flex justify-content-between align-items-center mb-4">
               <div>
                  <h4 className="fw-bold m-0" style={{color: colors.textMain}}>Pedidos Activos</h4>
                  <p style={{color: colors.textSecondary, fontSize: '0.9rem', margin: 0}}>Gestiona las órdenes entrantes</p>
               </div>
               <span style={styles.badge(colors.primary, '#fff')}>
                 {pedidos.filter(p => p.estado === 'Pendiente').length} Pendientes
               </span>
             </div>
             <div className="table-responsive">
               <table style={styles.table}>
                 <thead>
                   <tr>
                     <th style={styles.tableHeader}>Orden</th>
                     <th style={styles.tableHeader}>Total</th>
                     <th style={styles.tableHeader}>Tipo</th>
                     <th style={styles.tableHeader}>Estado</th>
                     <th style={{...styles.tableHeader, textAlign: 'right'}}>Control</th>
                   </tr>
                 </thead>
                 <tbody>
                   {pedidos.map((p) => (
                     <tr key={p.id} style={styles.tableRow}>
                       <td style={{...styles.tableCell, ...styles.firstCell}}>
                          <div className="d-flex align-items-center gap-3">
                             <div style={{backgroundColor: colors.elementBg, padding: '8px', borderRadius: '8px', fontWeight: 'bold', color: colors.primary}}>#{p.id}</div>
                             <div>
                                 <div className="fw-bold">{p.nombre_cliente}</div>
                                 <small style={{color: colors.textSecondary}}>{new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                             </div>
                          </div>
                       </td>
                       <td style={{...styles.tableCell, fontWeight: '800'}}>${Number(p.total).toFixed(2)}</td>
                       <td style={styles.tableCell}>
                         {p.tipo_orden === 'domicilio' 
                           ? <span style={styles.badge(colors.infoBg, colors.infoTxt)}>🛵 Moto</span> 
                           : <span style={styles.badge(colors.warnBg, colors.warnTxt)}>🏪 Local</span>}
                       </td>
                       <td style={styles.tableCell}>
                          <span style={styles.badge(
                              p.estado === 'Pendiente' ? colors.dangerBg : (p.estado === 'Completado' ? colors.successBg : colors.elementBg),
                              p.estado === 'Pendiente' ? colors.dangerTxt : (p.estado === 'Completado' ? colors.successTxt : colors.textMain)
                          )}>
                              {p.estado}
                          </span>
                       </td>
                       <td style={{...styles.tableCell, ...styles.lastCell, textAlign: 'right'}}>
                           <button style={styles.btnAction(colors.textMain, colors.borderColor)} onClick={() => {setSelectedOrderDetails(p); setShowDetailsModal(true);}}>Ver</button>
                           {p.estado !== 'Completado' && (
                               <>
                                   <button style={styles.btnAction(colors.warnTxt, colors.warnBg)} onClick={() => handleUpdateStatus(p.id, 'En Preparacion')}>Prep</button>
                                   {p.tipo_orden === 'domicilio' 
                                       ? <button style={styles.btnAction(colors.infoTxt, colors.infoBg)} onClick={() => handleUpdateStatus(p.id, 'En Camino')}>Moto</button> 
                                       : <button style={styles.btnAction(colors.successTxt, colors.successBg)} onClick={() => handleUpdateStatus(p.id, 'Listo')}>Listo</button>}
                                   <button style={{...styles.btnAction('white', colors.successTxt), backgroundColor: colors.successTxt, border: 'none'}} onClick={() => handleUpdateStatus(p.id, 'Completado')}>✓</button>
                               </>
                           )}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
          )}

          {/* COMBOS (GRID) */}
          {!loading && !error && activeTab === 'combos' && (
             <div>
             <div className="d-flex justify-content-between align-items-center mb-4">
               <h4 className="fw-bold" style={{color: colors.textMain}}>Combos & Promociones</h4>
               <button style={styles.btnPrimary} onClick={() => handleOpenComboModal()}>+ Nuevo Combo</button>
             </div>
             <div className="row g-4">
               {combos.map((combo) => (
                 <div className="col-md-6 col-lg-4" key={combo.id}>
                   <div style={{
                       backgroundColor: colors.cardBg, 
                       borderRadius: '16px', 
                       padding: '25px', 
                       border: `1px solid ${colors.borderColor}`,
                       boxShadow: colors.shadow,
                       opacity: combo.esta_activo ? 1 : 0.7
                   }}>
                     <div className="d-flex justify-content-between mb-3">
                       <h5 className="fw-bold mb-0" style={{color: colors.textMain}}>{combo.nombre}</h5>
                       {combo.esta_activo 
                           ? <span style={styles.badge(colors.successBg, colors.successTxt)}>ACTIVO</span>
                           : <span style={styles.badge(colors.elementBg, colors.textSecondary)}>INACTIVO</span>}
                     </div>
                     <h3 style={{color: colors.primary, fontWeight: '800'}}>${Number(combo.precio).toFixed(2)}</h3>
                     <p style={{color: colors.textSecondary, fontSize: '0.9rem'}}>{combo.descripcion}</p>
                     <div className="mt-4 d-flex gap-2">
                       <button style={{...styles.btnAction(colors.textMain, colors.borderColor), width: '100%'}} onClick={() => handleOpenComboModal(combo)}>Editar</button>
                       {combo.esta_activo && <button style={{...styles.btnAction(colors.dangerTxt, colors.dangerBg), width: '100%'}} onClick={() => handleDeleteCombo(combo)}>Ocultar</button>}
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           </div>
          )}

          {/* REPORTES */}
          {!loading && !error && activeTab === 'reporteGeneral' && (
            <div>
               <div className="row mb-4 g-4">
                 <div className="col-md-6">
                   <StatCard 
                     title="Ventas Totales" 
                     value={`$${reportData.reduce((acc, curr) => acc + Number(curr.total_ventas), 0).toFixed(2)}`} 
                     icon="💰" 
                     colors={colors} 
                     styles={styles} 
                   />
                 </div>
                 <div className="col-md-6">
                   <StatCard 
                     title="Promedio por Ticket" 
                     value="$150.00" 
                     icon="📈" 
                     colors={colors} 
                     styles={styles} 
                   />
                 </div>
               </div>
               
               <div style={styles.contentSection}>
                    <h5 className="mb-4 fw-bold" style={{color: colors.textMain}}>Rendimiento de Ventas</h5>
                    <SalesReportChart reportData={reportData} theme={theme} /> 
               </div>
               
               <div className="mt-4 text-end">
                   <button className="btn btn-outline-danger rounded-pill btn-sm" onClick={() => setShowPurgeModal(true)}>Opciones Avanzadas (Purgar)</button>
               </div>
            </div>
          )}
          {activeTab === 'reporteProductos' && <ProductSalesReport />}

        </div>
      </div>

      {/* MODALES PASADOS */}
      <ProductModal show={showProductModal} handleClose={() => setShowProductModal(false)} handleSave={handleSaveProducto} productoActual={productoActual} />
      <ComboModal show={showComboModal} handleClose={() => setShowComboModal(false)} handleSave={handleSaveCombo} comboActual={comboActual} />
      {showDetailsModal && (<DetallesPedidoModal pedido={selectedOrderDetails} onClose={() => setShowDetailsModal(false)} />)}
      <ConfirmationModal show={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmAction} title={confirmTitle} message={confirmMessage} colors={colors} />

      {/* MODAL PURGAR (ESTILO CORREGIDO) */}
      {showPurgeModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 overflow-hidden" style={{backgroundColor: colors.cardBg, color: colors.textMain, borderRadius: '24px'}}>
              <div className="modal-header border-0 p-4 pb-0">
                  <h5 className="modal-title fw-bold text-danger">⚠️ Zona de Peligro</h5>
                  <button type="button" className="btn-close" style={{filter: isDark ? 'invert(1)' : 'none'}} onClick={() => setShowPurgeModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <p style={{color: colors.textSecondary}}>Esta acción eliminará <strong>todos</strong> los pedidos del historial. No se puede deshacer.</p>
                <label className="mb-2 fw-bold" style={{fontSize: '0.8rem', textTransform: 'uppercase'}}>Escribe "ELIMINAR" para confirmar:</label>
                <input 
                    type="text" 
                    style={styles.input}
                    value={purgeConfirmText} 
                    onChange={(e) => setPurgeConfirmText(e.target.value)} 
                    placeholder="ELIMINAR"
                />
              </div>
              <div className="modal-footer border-0 p-4 pt-0">
                <button className="btn btn-danger w-100 py-3 rounded-pill fw-bold" onClick={handlePurge} disabled={purgeConfirmText !== 'ELIMINAR'}>Confirmar Borrado</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Pequeño componente helper para el Modal de Confirmación si no lo tienes externo
const ConfirmationModal = ({ show, onClose, onConfirm, title, message, colors }) => {
    if (!show) return null;
    return (
      <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1055 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ borderRadius: '20px', backgroundColor: colors.cardBg, color: colors.textMain, border: `1px solid ${colors.borderColor}` }}>
            <div className="modal-body p-4 text-center">
              <h5 className="fw-bold mb-3">{title}</h5>
              <p style={{color: colors.textSecondary}}>{message}</p>
              <div className="d-flex justify-content-center gap-2 mt-4">
                <button className="btn px-4 rounded-pill fw-bold" style={{backgroundColor: colors.elementBg, color: colors.textMain}} onClick={onClose}>Cancelar</button>
                <button className="btn btn-primary px-4 rounded-pill fw-bold" onClick={onConfirm}>Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};

export default AdminPage;