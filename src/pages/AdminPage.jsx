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

// --- SISTEMA DE DISEÑO "DONUT UI" ---
const getThemeColors = (mode) => {
  const isDark = mode === 'dark';

  return {
    // Bases
    bg: isDark ? '#0f172a' : '#f1f5f9', // Slate 900 vs Slate 100
    surface: isDark ? '#1e293b' : '#ffffff', // Slate 800 vs White
    surfaceHighlight: isDark ? '#334155' : '#f8fafc', // Slate 700 vs Slate 50

    // Textos
    textMain: isDark ? '#f8fafc' : '#0f172a', // Slate 50 vs Slate 900
    textMuted: isDark ? '#94a3b8' : '#64748b', // Slate 400 vs Slate 500
    
    // Marca (Brand) - Degradado Berry/Purple
    brand: '#ec4899', // Pink 500
    brandGradient: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', // Pink to Violet
    
    // Bordes
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    
    // Semánticos
    success: isDark ? '#10b981' : '#059669', // Emerald
    warning: isDark ? '#f59e0b' : '#d97706', // Amber
    danger: isDark ? '#ef4444' : '#dc2626', // Red
    info: isDark ? '#3b82f6' : '#2563eb', // Blue

    // Sombras
    shadowSm: isDark ? '0 1px 2px 0 rgba(0,0,0,0.5)' : '0 1px 2px 0 rgba(0,0,0,0.05)',
    shadowLg: isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    glow: isDark ? '0 0 20px rgba(236, 72, 153, 0.3)' : '0 4px 20px rgba(236, 72, 153, 0.15)',
  };
};

// --- COMPONENTES UI REUTILIZABLES ---

const Badge = ({ children, color, colors }) => (
  <span style={{
    backgroundColor: `${color}20`, // 20% de opacidad del color
    color: color,
    padding: '6px 12px',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    border: `1px solid ${color}40`,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  }}>
    {children}
  </span>
);

const IconButton = ({ icon, onClick, color, colors }) => (
  <button 
    onClick={onClick}
    style={{
      background: 'transparent',
      border: 'none',
      color: color || colors.textMuted,
      padding: '8px',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceHighlight; e.currentTarget.style.color = color || colors.textMain; }}
    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = color || colors.textMuted; }}
  >
    {icon}
  </button>
);

const StatCard = ({ title, value, icon, colors }) => (
  <div style={{
    backgroundColor: colors.surface,
    padding: '24px',
    borderRadius: '24px',
    border: `1px solid ${colors.border}`,
    boxShadow: colors.shadowSm,
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{ position: 'relative', zIndex: 2 }}>
      <p style={{ color: colors.textMuted, fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{title}</p>
      <h3 style={{ color: colors.textMain, fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>{value}</h3>
    </div>
    {/* Icono de fondo decorativo */}
    <div style={{
      position: 'absolute',
      right: '-10px',
      bottom: '-10px',
      fontSize: '6rem',
      opacity: 0.05,
      filter: 'grayscale(100%)',
      userSelect: 'none'
    }}>
      {icon}
    </div>
  </div>
);

// --- COMPONENTE PRINCIPAL ---
function AdminPage() {
  const { theme } = useTheme(); 
  const colors = getThemeColors(theme);
  const isDark = theme === 'dark';

  // ESTILOS DINÁMICOS
  const s = {
    container: {
      backgroundColor: colors.bg,
      minHeight: '100vh',
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', // Fuente recomendada, si no usa sans-serif
      padding: '40px 24px',
      color: colors.textMain,
      transition: 'background-color 0.4s ease'
    },
    headerTitle: {
      background: colors.brandGradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontWeight: '900',
      fontSize: '3rem',
      letterSpacing: '-1.5px',
      marginBottom: '10px'
    },
    navContainer: {
      display: 'flex',
      justifyContent: 'center',
      gap: '8px',
      padding: '6px',
      backgroundColor: colors.surface,
      borderRadius: '20px',
      border: `1px solid ${colors.border}`,
      boxShadow: colors.shadowSm,
      marginBottom: '40px',
      flexWrap: 'wrap'
    },
    navItem: (active) => ({
      padding: '10px 24px',
      borderRadius: '14px',
      border: 'none',
      backgroundColor: active ? colors.textMain : 'transparent', // Invertimos colores para el activo
      color: active ? colors.bg : colors.textMuted,
      fontWeight: active ? '700' : '600',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      fontSize: '0.95rem'
    }),
    card: {
      backgroundColor: 'transparent', // Usamos el fondo global o transparente para las tablas flotantes
    },
    // Estilo de tabla flotante (Rows separated)
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0 12px' 
    },
    rowCard: {
      backgroundColor: colors.surface,
      boxShadow: colors.shadowSm,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    },
    th: {
      color: colors.textMuted,
      fontWeight: '700',
      fontSize: '0.8rem',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      padding: '0 24px 10px 24px',
      border: 'none'
    },
    td: {
      padding: '20px 24px',
      borderTop: `1px solid ${colors.border}`,
      borderBottom: `1px solid ${colors.border}`,
      whiteSpace: 'nowrap'
    },
    tdFirst: {
      borderLeft: `1px solid ${colors.border}`,
      borderRadius: '16px 0 0 16px'
    },
    tdLast: {
      borderRight: `1px solid ${colors.border}`,
      borderRadius: '0 16px 16px 0'
    },
    actionBtn: {
      background: colors.brandGradient,
      border: 'none',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '14px',
      fontWeight: '700',
      boxShadow: colors.glow,
      cursor: 'pointer'
    }
  };

  const [activeTab, setActiveTab] = useState('pedidosEnLinea');
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // States Modales
  const [showProductModal, setShowProductModal] = useState(false);
  const [productoActual, setProductoActual] = useState(null);
  const [showComboModal, setShowComboModal] = useState(false);
  const [comboActual, setComboActual] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');
  // Simplificado confirmación para el ejemplo
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      if (activeTab === 'productos') { const res = await getProducts(); setProductos(res); } 
      else if (activeTab === 'reporteGeneral') { const res = await apiClient.get('/ventas/reporte'); setReportData(res.data); } 
      else if (activeTab === 'pedidosEnLinea') { const res = await apiClient.get('/pedidos'); setPedidos(res.data); } 
      else if (activeTab === 'combos') { const res = await apiClient.get('/combos/admin/todos'); setCombos(res.data); }
    } catch (err) { setError('Error conectando con el servidor.'); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [activeTab]);
  
  // Handlers Simplificados
  const handleOpenProductModal = (p = null) => { setProductoActual(p ? { ...p, imagenes: p.imagen_url ? [p.imagen_url] : [] } : null); setShowProductModal(true); };
  const handleSaveProducto = async (p) => { 
      try { 
          const d = { ...p, imagen_url: p.imagenes?.[0] || null }; delete d.imagenes; 
          if (d.id) await updateProduct(d.id, d); else await createProduct(d); 
          toast.success('Guardado'); fetchData(); setShowProductModal(false); 
      } catch { toast.error('Error'); } 
  };
  const handleDeleteProducto = async (p) => { if(window.confirm('¿Ocultar producto?')) { await deleteProduct(p.id); fetchData(); }};
  const handleOpenComboModal = (c = null) => { setComboActual(c); setShowComboModal(true); };
  const handleSaveCombo = async (c) => { try { if(c.id) await apiClient.put(`/combos/${c.id}`, c); else await apiClient.post('/combos', c); toast.success('Guardado'); fetchData(); setShowComboModal(false); } catch { toast.error('Error'); } };
  const handleDeleteCombo = async (c) => { if(window.confirm('¿Desactivar combo?')) { await apiClient.patch(`/combos/${c.id}/desactivar`); fetchData(); }};
  const handleUpdateStatus = async (id, est) => { try { await apiClient.put(`/pedidos/${id}/estado`, { estado: est }); toast.success(`Pedido #${id}: ${est}`); fetchData(); } catch { toast.error('Error'); } };
  const handlePurge = async () => { if(purgeConfirmText !== 'ELIMINAR') return toast.error('Escribe ELIMINAR'); await apiClient.delete('/pedidos/purgar'); toast.success('Datos purgados'); setShowPurgeModal(false); fetchData(); };

  return (
    <div style={s.container}>
      <div className="container-fluid px-lg-5">
        
        {/* HEADER */}
        <div className="text-center mb-5">
          <h1 style={s.headerTitle}>Miss Donitas Admin</h1>
          <p style={{color: colors.textMuted, fontSize: '1.1rem'}}>Panel de Control & Gestión</p>
        </div>

        {/* NAVEGACIÓN TIPO DOCK */}
        <div className="d-flex justify-content-center">
          <div style={s.navContainer}>
            {[
              { id: 'pedidosEnLinea', label: '🛎️ Pedidos', count: pedidos.filter(p => p.estado === 'Pendiente').length },
              { id: 'productos', label: '🍩 Inventario' },
              { id: 'combos', label: '🎁 Combos' },
              { id: 'reporteGeneral', label: '📊 Dashboard' },
              { id: 'reporteProductos', label: '📈 Métricas' }
            ].map(tab => (
              <button 
                key={tab.id} 
                style={s.navItem(activeTab === tab.id)} 
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {tab.count > 0 && <span style={{marginLeft: '8px', backgroundColor: colors.brand, color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7em'}}>{tab.count}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENIDO */}
        <div style={s.card}>
          
          {loading && <div className="text-center py-5"><div className="spinner-border" style={{color: colors.brand}} role="status"></div></div>}
          
          {/* === INVENTARIO === */}
          {!loading && !error && activeTab === 'productos' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4 px-2">
                <h3 className="fw-bold m-0" style={{color: colors.textMain}}>Catálogo de Donas</h3>
                <button style={s.actionBtn} onClick={() => handleOpenProductModal()}>+ Nuevo Producto</button>
              </div>
              <div className="table-responsive">
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Producto</th>
                      <th style={s.th}>Precio</th>
                      <th style={s.th}>Inventario</th>
                      <th style={s.th}>Estado</th>
                      <th style={{...s.th, textAlign: 'right'}}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((p) => (
                      <tr key={p.id} style={{position: 'relative'}}>
                        {/* Truco para el estilo de tarjeta en filas */}
                        <td style={{...s.td, ...s.tdFirst, backgroundColor: colors.surface}}>
                            <div className="d-flex align-items-center gap-3">
                                <div style={{width: '40px', height: '40px', borderRadius: '10px', background: colors.surfaceHighlight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'}}>🍩</div>
                                <div>
                                    <div style={{fontWeight: '700', fontSize: '1rem'}}>{p.nombre}</div>
                                    <div style={{color: colors.textMuted, fontSize: '0.85rem'}}>{p.categoria}</div>
                                </div>
                            </div>
                        </td>
                        <td style={{...s.td, backgroundColor: colors.surface}}>
                            <span style={{fontWeight: '800', fontSize: '1.1rem', color: colors.textMain}}>${Number(p.precio).toFixed(2)}</span>
                        </td>
                        <td style={{...s.td, backgroundColor: colors.surface}}>
                            {p.stock <= 5 
                             ? <Badge color={colors.danger} colors={colors}>Bajo: {p.stock}</Badge> 
                             : <span style={{color: colors.textMuted, fontWeight: '600'}}>{p.stock} uds.</span>}
                        </td>
                        <td style={{...s.td, backgroundColor: colors.surface}}>
                            {p.en_oferta 
                             ? <Badge color={colors.brand} colors={colors}>Oferta {p.descuento_porcentaje}%</Badge> 
                             : <span style={{color: colors.textMuted, fontSize: '0.9rem'}}>Normal</span>}
                        </td>
                        <td style={{...s.td, ...s.tdLast, backgroundColor: colors.surface, textAlign: 'right'}}>
                           <div className="d-flex justify-content-end gap-2">
                                <IconButton icon="✏️" colors={colors} onClick={() => handleOpenProductModal(p)} />
                                <IconButton icon="👁️‍🗨️" color={colors.danger} colors={colors} onClick={() => handleDeleteProducto(p)} />
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* === PEDIDOS === */}
          {!loading && !error && activeTab === 'pedidosEnLinea' && (
             <>
             <div className="d-flex justify-content-between align-items-center mb-4 px-2">
               <div>
                   <h3 className="fw-bold m-0" style={{color: colors.textMain}}>Monitor de Cocina</h3>
                   <p style={{color: colors.textMuted, margin: 0}}>Gestión en tiempo real</p>
               </div>
             </div>
             <div className="table-responsive">
               <table style={s.table}>
                 <thead>
                   <tr>
                     <th style={s.th}>Orden</th>
                     <th style={s.th}>Cliente</th>
                     <th style={s.th}>Detalles</th>
                     <th style={s.th}>Estado Actual</th>
                     <th style={{...s.th, textAlign: 'right'}}>Control</th>
                   </tr>
                 </thead>
                 <tbody>
                   {pedidos.map((p) => (
                     <tr key={p.id}>
                       <td style={{...s.td, ...s.tdFirst, backgroundColor: colors.surface}}>
                          <span style={{fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.1rem', color: colors.brand}}>#{p.id}</span>
                       </td>
                       <td style={{...s.td, backgroundColor: colors.surface}}>
                          <div style={{fontWeight: '700'}}>{p.nombre_cliente}</div>
                          <div style={{color: colors.textMuted, fontSize: '0.8rem'}}>{new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                       </td>
                       <td style={{...s.td, backgroundColor: colors.surface}}>
                          <div className="d-flex gap-2 align-items-center">
                            <span style={{fontWeight: '800', color: colors.textMain}}>${Number(p.total).toFixed(2)}</span>
                            {p.tipo_orden === 'domicilio' 
                                ? <Badge color={colors.info} colors={colors}>🛵 Moto</Badge>
                                : <Badge color={colors.warning} colors={colors}>🏪 Local</Badge>}
                          </div>
                       </td>
                       <td style={{...s.td, backgroundColor: colors.surface}}>
                            {p.estado === 'Pendiente' && <Badge color={colors.danger} colors={colors}>⏳ Pendiente</Badge>}
                            {p.estado === 'En Preparacion' && <Badge color={colors.warning} colors={colors}>🔥 Cocinando</Badge>}
                            {p.estado === 'En Camino' && <Badge color={colors.info} colors={colors}>💨 En Ruta</Badge>}
                            {p.estado === 'Listo' && <Badge color={colors.success} colors={colors}>🛍️ Listo</Badge>}
                            {p.estado === 'Completado' && <Badge color={colors.textMuted} colors={colors}>✅ Finalizado</Badge>}
                       </td>
                       <td style={{...s.td, ...s.tdLast, backgroundColor: colors.surface, textAlign: 'right'}}>
                           <div className="d-flex justify-content-end gap-2">
                               <button className="btn btn-sm" style={{backgroundColor: colors.surfaceHighlight, color: colors.textMain, border: 'none', borderRadius: '8px'}} onClick={() => {setSelectedOrderDetails(p); setShowDetailsModal(true);}}>Ver</button>
                               {p.estado !== 'Completado' && (
                                   <>
                                    <button className="btn btn-sm" style={{backgroundColor: `${colors.warning}20`, color: colors.warning, border: 'none', borderRadius: '8px', fontWeight: 'bold'}} onClick={() => handleUpdateStatus(p.id, 'En Preparacion')}>Prep</button>
                                    {p.tipo_orden === 'domicilio' 
                                        ? <button className="btn btn-sm" style={{backgroundColor: `${colors.info}20`, color: colors.info, border: 'none', borderRadius: '8px', fontWeight: 'bold'}} onClick={() => handleUpdateStatus(p.id, 'En Camino')}>Moto</button>
                                        : <button className="btn btn-sm" style={{backgroundColor: `${colors.success}20`, color: colors.success, border: 'none', borderRadius: '8px', fontWeight: 'bold'}} onClick={() => handleUpdateStatus(p.id, 'Listo')}>Listo</button>
                                    }
                                    <button className="btn btn-sm" style={{backgroundColor: colors.textMain, color: colors.bg, border: 'none', borderRadius: '8px', fontWeight: 'bold'}} onClick={() => handleUpdateStatus(p.id, 'Completado')}>OK</button>
                                   </>
                               )}
                           </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </>
          )}

          {/* === COMBOS === */}
          {!loading && !error && activeTab === 'combos' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4 px-2">
                <h3 className="fw-bold m-0" style={{color: colors.textMain}}>Promociones</h3>
                <button style={s.actionBtn} onClick={() => handleOpenComboModal()}>+ Nuevo Combo</button>
              </div>
              <div className="row g-4">
                {combos.map((c) => (
                  <div className="col-md-6 col-xl-4" key={c.id}>
                    <div style={{
                        backgroundColor: colors.surface, 
                        padding: '25px', 
                        borderRadius: '24px', 
                        border: `1px solid ${colors.border}`,
                        boxShadow: colors.shadowSm,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}>
                        <div>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <h4 style={{color: colors.textMain, fontWeight: '700'}}>{c.nombre}</h4>
                                {c.esta_activo ? <Badge color={colors.success} colors={colors}>Activo</Badge> : <Badge color={colors.textMuted} colors={colors}>Inactivo</Badge>}
                            </div>
                            <h2 style={{color: colors.brand, fontWeight: '800', marginBottom: '15px'}}>${Number(c.precio).toFixed(2)}</h2>
                            <p style={{color: colors.textMuted}}>{c.descripcion}</p>
                        </div>
                        <div className="d-flex gap-2 mt-3 pt-3 border-top" style={{borderColor: colors.border}}>
                             <button className="btn w-100 fw-bold" style={{backgroundColor: colors.surfaceHighlight, color: colors.textMain, border: 'none', borderRadius: '12px'}} onClick={() => handleOpenComboModal(c)}>Editar</button>
                             {c.esta_activo && <button className="btn w-100 fw-bold" style={{backgroundColor: `${colors.danger}20`, color: colors.danger, border: 'none', borderRadius: '12px'}} onClick={() => handleDeleteCombo(c)}>Ocultar</button>}
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* === REPORTES === */}
          {!loading && !error && activeTab === 'reporteGeneral' && (
            <div style={{maxWidth: '1000px', margin: '0 auto'}}>
                <div className="row g-4 mb-5">
                    <div className="col-md-6">
                        <StatCard 
                            title="Ventas Totales" 
                            value={`$${reportData.reduce((acc, curr) => acc + Number(curr.total_ventas), 0).toFixed(2)}`} 
                            icon="💰"
                            colors={colors}
                        />
                    </div>
                    <div className="col-md-6">
                        <StatCard 
                            title="Ticket Promedio" 
                            value="$145.00" 
                            icon="📈"
                            colors={colors}
                        />
                    </div>
                </div>

                <div style={{backgroundColor: colors.surface, padding: '30px', borderRadius: '24px', border: `1px solid ${colors.border}`, boxShadow: colors.shadowSm}}>
                    <h5 style={{color: colors.textMain, fontWeight: 'bold', marginBottom: '25px'}}>Análisis de Ventas</h5>
                    <SalesReportChart reportData={reportData} theme={theme} />
                </div>

                <div className="mt-5 text-center">
                    <button onClick={() => setShowPurgeModal(true)} style={{background: 'transparent', border: `1px dashed ${colors.danger}`, color: colors.danger, padding: '10px 20px', borderRadius: '50px', fontWeight: 'bold', opacity: 0.7}}>
                        ⚠️ Zona de Peligro: Purgar Datos
                    </button>
                </div>
            </div>
          )}
          
          {activeTab === 'reporteProductos' && <ProductSalesReport />}

        </div>
      </div>

      {/* MODALES: Se pasan colors para que mantengan la consistencia */}
      <ProductModal show={showProductModal} handleClose={() => setShowProductModal(false)} handleSave={handleSaveProducto} productoActual={productoActual} colors={colors} />
      <ComboModal show={showComboModal} handleClose={() => setShowComboModal(false)} handleSave={handleSaveCombo} comboActual={comboActual} colors={colors} />
      {showDetailsModal && (<DetallesPedidoModal pedido={selectedOrderDetails} onClose={() => setShowDetailsModal(false)} colors={colors} />)}

      {/* MODAL PURGAR */}
      {showPurgeModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 p-4" style={{backgroundColor: colors.surface, borderRadius: '24px', border: `1px solid ${colors.border}`, boxShadow: colors.shadowLg}}>
              <h4 style={{color: colors.danger, fontWeight: '900', textAlign: 'center'}}>PELIGRO: BORRAR TODO</h4>
              <p style={{color: colors.textMuted, textAlign: 'center', margin: '20px 0'}}>Esta acción eliminará <b>todo el historial de pedidos</b>. Escribe "ELIMINAR" para continuar.</p>
              <input 
                autoFocus
                className="form-control text-center fw-bold"
                style={{backgroundColor: colors.bg, color: colors.textMain, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '15px'}}
                value={purgeConfirmText}
                onChange={(e) => setPurgeConfirmText(e.target.value)}
              />
              <div className="d-flex gap-2 mt-4">
                  <button className="btn w-100 fw-bold" style={{backgroundColor: colors.surfaceHighlight, color: colors.textMain, borderRadius: '12px', padding: '12px'}} onClick={() => setShowPurgeModal(false)}>Cancelar</button>
                  <button className="btn w-100 fw-bold" style={{backgroundColor: colors.danger, color: 'white', borderRadius: '12px'}} onClick={handlePurge} disabled={purgeConfirmText !== 'ELIMINAR'}>BORRAR</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;