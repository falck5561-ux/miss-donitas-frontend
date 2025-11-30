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

// --- PALETA DE COLORES CORREGIDA (FONDO DE TARJETAS INTERNAS) ---
const getThemeColors = (mode) => {
  const isDark = mode === 'dark';
  
  return {
    // FONDOS
    bg: isDark ? '#000000' : '#F3F4F6',          // Fondo de toda la pantalla
    cardBg: isDark ? '#121212' : '#FFFFFF',      // Tarjeta GRANDE (Contenedor principal)
    innerCardBg: isDark ? '#252525' : '#FFFFFF', // TARJETAS PEQUEÑAS (Combos/Reportes) <- ESTO FALLABA
    
    // TEXTOS
    textMain: isDark ? '#FFFFFF' : '#111827',    // Texto principal (Blanco vs Negro fuerte)
    textSecondary: isDark ? '#A3A3A3' : '#4B5563', // Texto secundario
    
    // BORDES
    borderColor: isDark ? '#404040' : '#E5E7EB',

    // ACENTOS
    primary: '#FF4081',
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #D81B60 0%, #FF4081 100%)' 
      : 'linear-gradient(135deg, #FF80AB 0%, #F50057 100%)',
      
    // TABLAS
    tableHeaderBg: isDark ? '#1F2937' : '#F9FAFB',
    tableHeaderText: isDark ? '#F472B6' : '#9D174D',

    // ESTADOS
    accent: isDark ? '#38BDF8' : '#0EA5E9',      
    danger: isDark ? '#F87171' : '#EF4444',      
    success: isDark ? '#4ADE80' : '#22C55E',     
    
    // BOTONES
    btnPrepare: '#FBBF24', 
    btnWay: '#F472B6', 
    btnReady: isDark ? '#6B7280' : '#9CA3AF', 
    btnDone: '#34D399',    
    btnView: '#60A5FA',    
  };
};

// --- COMPONENTE STATCARD CORREGIDO ---
// Ahora recibe 'themeColors' y usa 'innerCardBg' explícitamente
const StatCard = ({ title, value, color, icon, themeColors }) => (
  <div style={{
      backgroundColor: themeColors.innerCardBg, // <--- AQUÍ ESTÁ LA SOLUCIÓN
      color: themeColors.textMain,
      borderRadius: '16px',
      padding: '24px',
      border: `1px solid ${themeColors.borderColor}`,
      borderBottom: `4px solid ${color}`,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  }}>
    <div style={{fontSize: '2.5rem', marginBottom: '12px'}}>{icon}</div>
    <h6 style={{color: themeColors.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold'}}>{title}</h6>
    <h3 style={{color: color, fontWeight: '800', margin: 0, fontSize: '2.2rem'}}>{value}</h3>
  </div>
);

function AdminPage() {
  const { theme } = useTheme(); 
  const colors = getThemeColors(theme);

  // --- ESTILOS GENERALES ---
  const styles = {
    container: {
      backgroundColor: colors.bg,
      minHeight: '100vh',
      fontFamily: '"Nunito", sans-serif',
      padding: '40px 20px',
      color: colors.textMain,
      transition: 'background-color 0.2s ease'
    },
    headerTitle: {
      background: colors.primaryGradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontWeight: '900',
      fontSize: '2.8rem',
      marginBottom: '10px'
    },
    navPillsContainer: {
      backgroundColor: colors.cardBg,
      borderRadius: '50px',
      padding: '6px',
      display: 'inline-flex',
      border: `1px solid ${colors.borderColor}`,
      marginBottom: '30px'
    },
    navLink: {
      color: colors.textSecondary,
      borderRadius: '25px',
      padding: '10px 24px',
      fontWeight: '700',
      border: 'none',
      background: 'transparent',
      transition: 'all 0.2s',
    },
    navLinkActive: {
      background: colors.primaryGradient,
      color: 'white',
      boxShadow: '0 4px 12px rgba(255, 64, 129, 0.3)',
    },
    // TARJETA PRINCIPAL (CONTENEDOR)
    mainCard: {
      backgroundColor: colors.cardBg,
      color: colors.textMain,
      borderRadius: '24px',
      border: `1px solid ${colors.borderColor}`,
      padding: '30px',
      boxShadow: theme === 'dark' ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)',
    },
    // TABLAS
    tableHeader: {
      backgroundColor: colors.tableHeaderBg,
      color: colors.tableHeaderText,
      fontWeight: '800',
      textTransform: 'uppercase',
      fontSize: '0.8rem',
      letterSpacing: '0.5px',
      padding: '16px',
      borderBottom: `2px solid ${colors.borderColor}`
    },
    tableRow: {
      borderBottom: `1px solid ${colors.borderColor}`,
      color: colors.textMain // Forzar color de texto en filas
    },
    btnAdd: {
      background: colors.primaryGradient,
      border: 'none',
      borderRadius: '50px',
      color: 'white',
      padding: '10px 24px',
      fontWeight: '700',
      boxShadow: '0 4px 12px rgba(255, 64, 129, 0.3)',
    },
    badge: (bgColor, textColor) => ({
      backgroundColor: bgColor,
      color: textColor,
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: '800',
      textTransform: 'uppercase'
    })
  };

  const [activeTab, setActiveTab] = useState('pedidosEnLinea');
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estados Modales
  const [showProductModal, setShowProductModal] = useState(false);
  const [productoActual, setProductoActual] = useState(null);
  const [showComboModal, setShowComboModal] = useState(false);
  const [comboActual, setComboActual] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');
  
  // Fetching
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'productos') { const res = await getProducts(); setProductos(res); } 
      else if (activeTab === 'reporteGeneral') { const res = await apiClient.get('/ventas/reporte'); setReportData(res.data); } 
      else if (activeTab === 'pedidosEnLinea') { const res = await apiClient.get('/pedidos'); setPedidos(res.data); } 
      else if (activeTab === 'combos') { const res = await apiClient.get('/combos/admin/todos'); setCombos(res.data); }
    } catch (err) { console.error(err); toast.error("Error al cargar datos"); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [activeTab]);
  
  // Handlers (Simplificados para brevedad, lógica igual)
  const handleOpenProductModal = (p) => { setProductoActual(p ? { ...p, imagenes: p.imagen_url ? [p.imagen_url] : [] } : null); setShowProductModal(true); };
  const handleSaveProducto = async (p) => { 
    const d = { ...p, imagen_url: p.imagenes?.[0] || null }; delete d.imagenes; 
    try { if (d.id) await updateProduct(d.id, d); else await createProduct(d); toast.success('Guardado'); fetchData(); setShowProductModal(false); } catch { toast.error('Error'); } 
  };
  const handleDeleteProducto = async (id) => { if(window.confirm('¿Ocultar?')) { await deleteProduct(id); toast.success('Ocultado'); fetchData(); }};
  
  const handleOpenComboModal = (c) => { setComboActual(c); setShowComboModal(true); };
  const handleSaveCombo = async (c) => { try { if(c.id) await apiClient.put(`/combos/${c.id}`, c); else await apiClient.post('/combos', c); toast.success('Guardado'); fetchData(); setShowComboModal(false); } catch { toast.error('Error'); } };
  const handleDeleteCombo = async (id) => { if(window.confirm('¿Ocultar?')) { await apiClient.patch(`/combos/${id}/desactivar`); toast.success('Ocultado'); fetchData(); }};

  const handleUpdateStatus = async (id, est) => { try { await apiClient.put(`/pedidos/${id}/estado`, { estado: est }); toast.success('Actualizado'); fetchData(); } catch { toast.error('Error'); } };
  const handlePurge = async () => { if(purgeConfirmText !== 'ELIMINAR') return; await apiClient.delete('/pedidos/purgar'); toast.success('Purgado'); setShowPurgeModal(false); fetchData(); };

  return (
    <div style={styles.container}>
      <div className="container-fluid px-md-5">
        
        {/* TITULO */}
        <div className="text-center mb-4 pt-3">
          <h1 style={styles.headerTitle}>🍩 Administración Miss Donitas</h1>
        </div>

        {/* NAVEGACION */}
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

        {/* TARJETA PRINCIPAL */}
        <div style={styles.mainCard}>
          
          {loading && <div className="text-center py-5"><div className="spinner-border text-danger" role="status"></div></div>}

          {/* === PRODUCTOS === */}
          {!loading && activeTab === 'productos' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold m-0" style={{color: colors.textMain}}>Inventario</h3>
                <button className="btn" style={styles.btnAdd} onClick={() => handleOpenProductModal(null)}>+ Producto</button>
              </div>
              <div className="table-responsive">
                <table className="table" style={{backgroundColor: 'transparent', color: colors.textMain}}>
                  <thead>
                    <tr>
                      <th style={{...styles.tableHeader, borderRadius: '10px 0 0 10px'}}>Producto</th>
                      <th style={styles.tableHeader}>Precio</th>
                      <th style={styles.tableHeader}>Stock</th>
                      <th style={styles.tableHeader}>Estado</th>
                      <th style={{...styles.tableHeader, borderRadius: '0 10px 10px 0', textAlign: 'center'}}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((p) => (
                      <tr key={p.id} style={styles.tableRow}>
                        <td className="align-middle ps-3">
                          <div className="fw-bold">{p.nombre}</div>
                          <small style={{color: colors.textSecondary}}>{p.categoria}</small>
                        </td>
                        <td className="align-middle fw-bold" style={{color: colors.primary}}>${Number(p.precio).toFixed(2)}</td>
                        <td className="align-middle">
                          {p.stock <= 5 
                            ? <span style={styles.badge(colors.danger, '#FFF')}>Bajo: {p.stock}</span> 
                            : <span className="fw-bold" style={{color: colors.textSecondary}}>{p.stock} u.</span>}
                        </td>
                        <td className="align-middle">
                          {p.en_oferta ? <span style={styles.badge(colors.accent, '#FFF')}>Oferta</span> : <span style={styles.badge(colors.borderColor, colors.textSecondary)}>Normal</span>}
                        </td>
                        <td className="align-middle text-center">
                          <button className="btn btn-sm btn-link text-decoration-none" style={{color: colors.accent}} onClick={() => handleOpenProductModal(p)}>Editar</button>
                          <button className="btn btn-sm btn-link text-decoration-none" style={{color: colors.danger}} onClick={() => handleDeleteProducto(p.id)}>Ocultar</button>
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
                <h3 className="fw-bold m-0" style={{color: colors.textMain}}>Pedidos</h3>
                <span className="badge rounded-pill bg-danger px-3 py-2">{pedidos.filter(p => p.estado === 'Pendiente').length} Pendientes</span>
              </div>
              <div className="table-responsive">
                <table className="table" style={{backgroundColor: 'transparent', color: colors.textMain}}>
                  <thead>
                    <tr>
                      <th style={{...styles.tableHeader, borderRadius: '10px 0 0 10px'}}>ID / Cliente</th>
                      <th style={styles.tableHeader}>Total</th>
                      <th style={styles.tableHeader}>Tipo</th>
                      <th style={styles.tableHeader}>Estado</th>
                      <th style={{...styles.tableHeader, borderRadius: '0 10px 10px 0'}}>Control</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.map((p) => (
                      <tr key={p.id} style={styles.tableRow}>
                        <td className="align-middle ps-3">
                           <span className="fw-bold me-2" style={{color: colors.primary}}>#{p.id}</span>
                           <span className="fw-bold">{p.nombre_cliente}</span>
                        </td>
                        <td className="align-middle fw-bold" style={{color: colors.textMain}}>${Number(p.total).toFixed(2)}</td>
                        <td className="align-middle">
                          {p.tipo_orden === 'domicilio' 
                            ? <span style={styles.badge(colors.accent, '#FFF')}>Domicilio</span> 
                            : <span style={styles.badge(colors.btnPrepare, '#000')}>Recoger</span>}
                        </td>
                        <td className="align-middle">
                           <span style={styles.badge(p.estado === 'Pendiente' ? colors.btnPrepare : colors.success, p.estado === 'Pendiente' ? '#000' : '#FFF')}>{p.estado}</span>
                        </td>
                        <td className="align-middle">
                            <div className="d-flex gap-1 flex-wrap">
                                <button className="btn btn-sm text-white fw-bold" style={{backgroundColor: colors.btnView, fontSize: '0.7rem'}} onClick={() => {setSelectedOrderDetails(p); setShowDetailsModal(true);}}>VER</button>
                                {p.estado !== 'Completado' && (
                                    <>
                                        <button className="btn btn-sm fw-bold" style={{backgroundColor: colors.btnPrepare, color: '#000', fontSize: '0.7rem'}} onClick={() => handleUpdateStatus(p.id, 'En Preparacion')}>PREP</button>
                                        <button className="btn btn-sm text-white fw-bold" style={{backgroundColor: colors.btnDone, fontSize: '0.7rem'}} onClick={() => handleUpdateStatus(p.id, 'Completado')}>LISTO</button>
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

          {/* === COMBOS (ARREGLADO) === */}
          {!loading && activeTab === 'combos' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold m-0" style={{color: colors.textMain}}>Combos</h3>
                <button className="btn" style={styles.btnAdd} onClick={() => handleOpenComboModal(null)}>+ Combo</button>
              </div>
              <div className="row g-4">
                {combos.map((combo) => (
                  <div className="col-md-6 col-lg-4" key={combo.id}>
                    <div style={{
                      backgroundColor: colors.innerCardBg, // <--- USO DE COLOR DE FONDO ESPECÍFICO
                      borderRadius: '16px',
                      padding: '24px',
                      border: `1px solid ${combo.esta_activo ? colors.success : colors.borderColor}`,
                      opacity: combo.esta_activo ? 1 : 0.7,
                      color: colors.textMain // Forzar texto del combo
                    }}>
                      <div className="d-flex justify-content-between mb-3">
                        <h5 className="fw-bold mb-0">{combo.nombre}</h5>
                        {combo.esta_activo ? <span style={styles.badge(colors.success, '#FFF')}>ACTIVO</span> : <span style={styles.badge(colors.borderColor, colors.textSecondary)}>OCULTO</span>}
                      </div>
                      <h3 className="fw-bold mb-3" style={{color: colors.primary}}>${Number(combo.precio).toFixed(2)}</h3>
                      <div className="d-flex gap-2">
                        <button className="btn btn-outline-info btn-sm w-100" onClick={() => handleOpenComboModal(combo)}>Editar</button>
                        {combo.esta_activo && <button className="btn btn-outline-danger btn-sm w-100" onClick={() => handleDeleteCombo(combo.id)}>Ocultar</button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === REPORTES (ARREGLADO) === */}
          {!loading && activeTab === 'reporteGeneral' && (
            <div>
               <div className="row mb-5 g-4">
                  {/* Se pasa 'themeColors' para que el StatCard use 'innerCardBg' */}
                  <div className="col-md-6"><StatCard title="Ventas Totales" value={`$${reportData.reduce((acc, curr) => acc + Number(curr.total_ventas), 0).toFixed(2)}`} color={colors.success} icon="💰" themeColors={colors} /></div>
                  <div className="col-md-6"><StatCard title="Promedio Venta" value="$150.00" color={colors.primary} icon="📈" themeColors={colors} /></div>
               </div>
               
               <h5 className="mb-4 fw-bold" style={{color: colors.textMain}}>Gráfica de Rendimiento</h5>
               <div style={{padding: '20px', backgroundColor: colors.innerCardBg, borderRadius: '20px', border: `1px solid ${colors.borderColor}`}}>
                    <SalesReportChart reportData={reportData} theme={theme} /> 
               </div>
               
               <div className="mt-5 text-end">
                   <button className="btn btn-outline-danger btn-sm rounded-pill" onClick={() => setShowPurgeModal(true)}>Zona de Peligro</button>
               </div>
            </div>
          )}
          {activeTab === 'reporteProductos' && <ProductSalesReport />}

        </div>
      </div>

      {/* MODALES AUXILIARES */}
      <ProductModal show={showProductModal} handleClose={() => setShowProductModal(false)} handleSave={handleSaveProducto} productoActual={productoActual} />
      <ComboModal show={showComboModal} handleClose={() => setShowComboModal(false)} handleSave={handleSaveCombo} comboActual={comboActual} />
      {showDetailsModal && (<DetallesPedidoModal pedido={selectedOrderDetails} onClose={() => setShowDetailsModal(false)} />)}
      
      {/* MODAL PURGAR (ESTILO CORREGIDO) */}
      {showPurgeModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4" style={{backgroundColor: colors.cardBg, color: colors.textMain}}>
              <div className="modal-header border-0 text-white" style={{backgroundColor: colors.danger}}><h5 className="fw-bold">⚠️ Borrar Todo</h5><button className="btn-close btn-close-white" onClick={() => setShowPurgeModal(false)}></button></div>
              <div className="modal-body p-4">
                <p>Escribe <strong>ELIMINAR</strong>:</p>
                <input type="text" className="form-control" style={{backgroundColor: colors.bg, color: colors.textMain, border: `1px solid ${colors.borderColor}`}} value={purgeConfirmText} onChange={(e) => setPurgeConfirmText(e.target.value)} />
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