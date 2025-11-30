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

// --- PALETA DE COLORES DE ALTO CONTRASTE ---
const getThemeColors = (mode) => {
  const isDark = mode === 'dark';

  return {
    // FONDOS
    bg: isDark ? '#000000' : '#F3F4F6',          // Fondo de pantalla (Negro puro en dark)
    containerBg: isDark ? '#111111' : '#FFFFFF', // Fondo del contenedor principal (Gris muy oscuro vs Blanco)
    itemBg: isDark ? '#1F1F1F' : '#F9FAFB',      // Fondo de las tarjetitas (Combos/Items)
    
    // TEXTOS
    textMain: isDark ? '#FFFFFF' : '#000000',    // Blanco puro vs Negro puro
    textSecondary: isDark ? '#BBBBBB' : '#555555',
    
    // PRECIOS (Siempre visibles)
    money: isDark ? '#00FF00' : '#DC2626',       // Verde Neón en oscuro, Rojo en claro (para contraste)

    // BORDES
    borderColor: isDark ? '#333333' : '#E5E7EB',

    // ACCIONES
    primary: '#EC4899', 
    primaryGradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
    
    // TABLAS
    tableHeaderBg: isDark ? '#1F1F1F' : '#E5E7EB', 
    tableHeaderText: isDark ? '#EC4899' : '#374151',

    // BADGES
    accent: '#06B6D4',      
    danger: '#EF4444',      
    success: '#10B981',    
    warning: '#F59E0B',
    
    // BOTONES
    btnText: '#FFFFFF', // Texto siempre blanco en botones de acción
  };
};

// --- STATCARD ---
const StatCard = ({ title, value, color, icon, styles, colors }) => (
  <div style={{
      ...styles.cardItem, // Usamos estilo propio, NO className="card"
      borderBottom: `4px solid ${color}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%'
  }}>
    <div style={{
      fontSize: '2.5rem', marginBottom: '1rem', color: color,
      background: colors.bg, borderRadius: '50%', width: '70px', height: '70px',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>{icon}</div>
    <h6 style={{ color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', fontSize: '0.8rem' }}>{title}</h6>
    <h3 style={{ color: colors.textMain, fontWeight: '800', margin: 0, fontSize: '2rem' }}>{value}</h3>
  </div>
);

function AdminPage() {
  const { theme } = useTheme(); 
  const colors = getThemeColors(theme);

  const styles = {
    wrapper: {
      backgroundColor: colors.bg,
      minHeight: '100vh',
      padding: '30px 15px',
      fontFamily: '"Nunito", sans-serif',
      transition: 'all 0.3s ease'
    },
    // CONTENEDOR PRINCIPAL (El cuadro blanco grande de tu foto)
    mainContainer: {
      backgroundColor: colors.containerBg, // Ahora se vuelve OSCURO en dark mode
      color: colors.textMain,
      borderRadius: '24px',
      padding: '30px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      border: `1px solid ${colors.borderColor}`
    },
    // Estilo para tarjetas pequeñas (Combos)
    cardItem: {
      backgroundColor: colors.itemBg, // Gris oscuro en dark mode
      borderRadius: '16px',
      padding: '20px',
      border: `1px solid ${colors.borderColor}`,
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
    },
    headerTitle: {
      background: colors.primaryGradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontWeight: '900',
      fontSize: 'clamp(2rem, 5vw, 3rem)',
      marginBottom: '10px',
    },
    navLink: {
      color: colors.textSecondary,
      borderRadius: '20px',
      padding: '8px 20px',
      fontWeight: '700',
      border: 'none',
      background: 'transparent',
      transition: 'all 0.2s',
      cursor: 'pointer'
    },
    navLinkActive: {
      background: colors.primaryGradient,
      color: 'white',
      boxShadow: '0 4px 12px rgba(236, 72, 153, 0.4)',
    },
    table: {
       width: '100%',
       borderCollapse: 'separate', 
       borderSpacing: '0 10px' // Separación entre filas
    },
    tableHeader: {
      backgroundColor: colors.tableHeaderBg,
      color: colors.tableHeaderText,
      fontWeight: '800',
      textTransform: 'uppercase',
      fontSize: '0.8rem',
      padding: '15px',
      border: 'none'
    },
    tableCell: {
       backgroundColor: colors.itemBg, // Fondo de cada fila
       padding: '15px',
       verticalAlign: 'middle',
       color: colors.textMain, 
       borderTop: `1px solid ${colors.borderColor}`,
       borderBottom: `1px solid ${colors.borderColor}`,
       fontWeight: '600'
    },
    // Botón verde/rojo de los combos
    badgeBtn: (isActive) => ({
        backgroundColor: isActive ? colors.success : colors.danger,
        color: 'white',
        padding: '5px 12px',
        borderRadius: '10px',
        fontSize: '0.7rem',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        border: 'none'
    }),
    actionBtn: {
        border: `1px solid ${colors.borderColor}`,
        backgroundColor: 'transparent',
        color: colors.textMain,
        padding: '5px 15px',
        borderRadius: '8px',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        width: '100%'
    }
  };

  const [activeTab, setActiveTab] = useState('pedidosEnLinea');
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estados de Modales
  const [showProductModal, setShowProductModal] = useState(false);
  const [productoActual, setProductoActual] = useState(null);
  const [showComboModal, setShowComboModal] = useState(false);
  const [comboActual, setComboActual] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');

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
  
  // Handlers Simplificados
  const handleOpenProductModal = (p = null) => { setProductoActual(p ? { ...p, imagenes: p.imagen_url ? [p.imagen_url] : [] } : null); setShowProductModal(true); };
  const handleSaveProducto = async (p) => { try { const d = { ...p, imagen_url: p.imagenes?.[0] || null }; delete d.imagenes; if (d.id) await updateProduct(d.id, d); else await createProduct(d); toast.success('Guardado'); fetchData(); setShowProductModal(false); } catch { toast.error('Error'); } };
  const handleDeleteProducto = async (p) => { if(window.confirm(`¿Ocultar ${p.nombre}?`)) { await deleteProduct(p.id); fetchData(); } };
  const handleOpenComboModal = (c = null) => { setComboActual(c); setShowComboModal(true); };
  const handleSaveCombo = async (c) => { try { if(c.id) await apiClient.put(`/combos/${c.id}`, c); else await apiClient.post('/combos', c); toast.success('Combo guardado'); fetchData(); setShowComboModal(false); } catch { toast.error('Error'); } };
  const handleDeleteCombo = async (c) => { if(window.confirm(`¿Ocultar ${c.nombre}?`)) { await apiClient.patch(`/combos/${c.id}/desactivar`); fetchData(); } };
  const handleUpdateStatus = async (id, est) => { try { await apiClient.put(`/pedidos/${id}/estado`, { estado: est }); toast.success('Estado actualizado'); fetchData(); } catch { toast.error('Error'); } };
  const handlePurge = async () => { if(purgeConfirmText !== 'ELIMINAR') return toast.error('Escribe ELIMINAR'); await apiClient.delete('/pedidos/purgar'); setShowPurgeModal(false); fetchData(); };

  return (
    <div style={styles.wrapper}>
      <div className="container-fluid px-md-5">
        
        <div className="text-center mb-4">
          <h1 style={styles.headerTitle}>🍩 Administración Miss Donitas</h1>
        </div>

        {/* MENU NAVEGACION */}
        <div className="d-flex justify-content-center mb-4">
          <div style={{ backgroundColor: colors.containerBg, padding: '5px', borderRadius: '30px', border: `1px solid ${colors.borderColor}`, display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
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

        {/* CONTENEDOR PRINCIPAL - Aquí estaba el error, quitamos clases de bootstrap */}
        <div style={styles.mainContainer}>
          
          {loading && <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>}

          {/* === COMBOS (Tu problema principal en la foto) === */}
          {!loading && activeTab === 'combos' && (
             <div>
               <div className="d-flex justify-content-between align-items-center mb-4">
                 <h3 className="fw-bold m-0" style={{color: colors.textMain}}>Combos & Promociones</h3>
                 <button className="btn text-white rounded-pill fw-bold" style={{background: colors.primaryGradient}} onClick={() => handleOpenComboModal()}>+ Nuevo Combo</button>
               </div>
               <div className="row g-4">
                 {combos.map((combo) => (
                   <div className="col-md-6 col-lg-4" key={combo.id}>
                     {/* TARJETA INDIVIDUAL DE COMBO */}
                     <div style={styles.cardItem}>
                       <div className="d-flex justify-content-between align-items-center mb-3">
                         <h5 className="fw-bold m-0" style={{color: colors.textMain}}>{combo.nombre}</h5>
                         <span style={styles.badgeBtn(combo.esta_activo)}>
                             {combo.esta_activo ? 'ACTIVO' : 'OCULTO'}
                         </span>
                       </div>
                       {/* PRECIO EN VERDE NEÓN PARA VERSE EN NEGRO */}
                       <h4 style={{color: colors.money, fontWeight: '900', fontSize: '1.8rem'}}>${Number(combo.precio).toFixed(2)}</h4>
                       
                       <div className="mt-4 d-flex gap-2">
                         <button style={{...styles.actionBtn, borderColor: colors.accent, color: colors.accent}} onClick={() => handleOpenComboModal(combo)}>Editar</button>
                         {combo.esta_activo && <button style={{...styles.actionBtn, borderColor: colors.danger, color: colors.danger}} onClick={() => handleDeleteCombo(combo)}>Ocultar</button>}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          )}

          {/* === PRODUCTOS === */}
          {!loading && activeTab === 'productos' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold m-0" style={{color: colors.textMain}}>Inventario</h3>
                <button className="btn text-white rounded-pill fw-bold" style={{background: colors.primaryGradient}} onClick={() => handleOpenProductModal()}>+ Nuevo</button>
              </div>
              <div className="table-responsive">
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{...styles.tableHeader, borderRadius: '10px 0 0 10px'}}>Producto</th>
                      <th style={styles.tableHeader}>Precio</th>
                      <th style={styles.tableHeader}>Stock</th>
                      <th style={{...styles.tableHeader, borderRadius: '0 10px 10px 0', textAlign: 'center'}}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((p) => (
                      <tr key={p.id}>
                        <td style={{...styles.tableCell, borderRadius: '10px 0 0 10px'}}>
                            <div style={{color: colors.textMain}}>{p.nombre}</div>
                            <small style={{color: colors.textSecondary}}>{p.categoria}</small>
                        </td>
                        <td style={{...styles.tableCell, color: colors.money, fontSize: '1.1rem'}}>${Number(p.precio).toFixed(2)}</td>
                        <td style={styles.tableCell}>
                             <span style={{color: p.stock < 5 ? colors.danger : colors.textMain, fontWeight: 'bold'}}>{p.stock} u.</span>
                        </td>
                        <td style={{...styles.tableCell, borderRadius: '0 10px 10px 0', textAlign: 'center'}}>
                          <button className="btn btn-sm btn-outline-info me-2" onClick={() => handleOpenProductModal(p)}>✏️</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteProducto(p)}>👁️</button>
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
                 <span className="badge bg-danger rounded-pill px-3 py-2">{pedidos.filter(p => p.estado === 'Pendiente').length} Pendientes</span>
               </div>
               <div className="table-responsive">
                 <table style={styles.table}>
                   <thead>
                     <tr>
                       <th style={{...styles.tableHeader, borderRadius: '10px 0 0 10px'}}>ID / Cliente</th>
                       <th style={styles.tableHeader}>Total</th>
                       <th style={styles.tableHeader}>Estado</th>
                       <th style={{...styles.tableHeader, borderRadius: '0 10px 10px 0'}}>Control</th>
                     </tr>
                   </thead>
                   <tbody>
                     {pedidos.map((p) => (
                       <tr key={p.id}>
                         <td style={{...styles.tableCell, borderRadius: '10px 0 0 10px'}}>
                            <span style={{color: colors.primary, fontWeight: 'bold'}}>#{p.id}</span>
                            <div style={{color: colors.textMain}}>{p.nombre_cliente}</div>
                         </td>
                         <td style={{...styles.tableCell, color: colors.money, fontWeight: '900', fontSize: '1.2rem'}}>${Number(p.total).toFixed(2)}</td>
                         <td style={styles.tableCell}>
                            <span className="badge" style={{backgroundColor: p.estado === 'Pendiente' ? '#FFC107' : (p.estado === 'Completado' ? '#198754' : '#0DCAF0'), color: 'black'}}>{p.estado}</span>
                         </td>
                         <td style={{...styles.tableCell, borderRadius: '0 10px 10px 0'}}>
                             <button className="btn btn-sm btn-primary rounded-pill px-3" onClick={() => {setSelectedOrderDetails(p); setShowDetailsModal(true);}}>Ver Detalles</button>
                             {p.estado === 'Pendiente' && <button className="btn btn-sm btn-success rounded-pill ms-2" onClick={() => handleUpdateStatus(p.id, 'Completado')}>✅</button>}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
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
                   <StatCard title="Promedio Venta" value="$150.00" color={colors.accent} icon="📈" styles={styles} colors={colors} />
                 </div>
               </div>
               <div style={{...styles.cardItem, padding: '20px'}}>
                    <h5 style={{color: colors.textMain, marginBottom: '20px'}}>Rendimiento</h5>
                    <SalesReportChart reportData={reportData} theme={theme} /> 
               </div>
               <div className="mt-4 text-end">
                   <button className="btn btn-outline-danger btn-sm rounded-pill" onClick={() => setShowPurgeModal(true)}>⚠️ Purgar Datos</button>
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

      {/* MODAL PURGAR (Arreglado para dark mode) */}
      {showPurgeModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ backgroundColor: colors.containerBg, color: colors.textMain, border: `1px solid ${colors.borderColor}` }}>
              <div className="modal-header border-0"><h5 className="fw-bold">⚠️ Borrar Todo</h5><button type="button" className="btn-close" style={{filter: isDark ? 'invert(1)' : 'none'}} onClick={() => setShowPurgeModal(false)}></button></div>
              <div className="modal-body">
                <p>Escribe <strong>ELIMINAR</strong>:</p>
                <input type="text" className="form-control" style={{backgroundColor: colors.itemBg, color: colors.textMain, border: `1px solid ${colors.borderColor}`}} value={purgeConfirmText} onChange={(e) => setPurgeConfirmText(e.target.value)} />
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-danger w-100" onClick={handlePurge}>Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;