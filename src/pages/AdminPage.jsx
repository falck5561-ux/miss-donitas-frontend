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

// --- NUEVA PALETA DE ALTO CONTRASTE ---
const getThemeColors = (mode) => {
  const isDark = mode === 'dark';

  return {
    isDark, // Flag útil para lógica
    // FONDOS
    bg: isDark ? '#000000' : '#F2F4F8',        // Negro absoluto vs Gris azulado muy claro
    cardBg: isDark ? '#141414' : '#FFFFFF',    // Gris muy oscuro vs Blanco puro
    elementBg: isDark ? '#262626' : '#F8F9FA', // Para inputs y filas alternas
    
    // TEXTOS (LA CLAVE PARA QUE SE VEA BIEN)
    textMain: isDark ? '#FFFFFF' : '#111111',       // Blanco puro en dark
    textSecondary: isDark ? '#D4D4D4' : '#555555',  // Gris claro en dark
    textMuted: isDark ? '#A0A0A0' : '#888888',
    
    // BORDES
    borderColor: isDark ? '#404040' : '#DEE2E6',

    // COLOR PRINCIPAL (BOTONES Y ACENTOS)
    primary: isDark ? '#FF3D00' : '#E91E63', // Naranja/Rojo Neón en Dark (Se ve mucho más que el rojo oscuro)
    primaryGradient: isDark 
      ? 'linear-gradient(90deg, #FF3D00 0%, #DD2C00 100%)' // Fuego Brillante
      : 'linear-gradient(90deg, #FF4081 0%, #C2185B 100%)', // Rosa Intenso
    
    // DINERO / NÚMEROS IMPORTANTES
    // En Dark usamos un rojo casi naranja (#FF5252) porque el rojo puro (#FF0000) no se lee bien sobre negro.
    money: isDark ? '#FF5252' : '#00C853', 

    // ESTADOS (Badges) - Fondo oscuro/Texto brillante en Dark Mode
    badgeSuccessBg: isDark ? '#1B5E20' : '#D1E7DD',
    badgeSuccessTxt: isDark ? '#69F0AE' : '#0F5132', // Verde neón en dark

    badgePendingBg: isDark ? '#3E2723' : '#FFF3CD',
    badgePendingTxt: isDark ? '#FFAB40' : '#856404', // Naranja neón en dark

    badgeDangerBg: isDark ? '#B71C1C' : '#F8D7DA',
    badgeDangerTxt: isDark ? '#FF8A80' : '#842029', // Rojo claro en dark
    
    shadow: isDark ? '0 8px 32px rgba(0,0,0,0.8)' : '0 8px 30px rgba(0,0,0,0.08)',
  };
};

// --- ESTILOS GLOBALES FORZADOS (Para arreglar Bootstrap) ---
const GlobalFixes = ({ colors }) => (
  <style>{`
    .table { --bs-table-color: ${colors.textMain}; --bs-table-bg: transparent; }
    .table td, .table th { border-bottom-color: ${colors.borderColor}; color: ${colors.textMain}; }
    .btn-close { filter: ${colors.isDark ? 'invert(1) grayscale(100%) brightness(200%)' : 'none'}; }
    .form-control { background-color: ${colors.elementBg}; color: ${colors.textMain}; border-color: ${colors.borderColor}; }
    .form-control:focus { background-color: ${colors.elementBg}; color: ${colors.textMain}; border-color: ${colors.primary}; box-shadow: 0 0 0 0.25rem ${colors.primary}40; }
    /* Scrollbar personalizada */
    ::-webkit-scrollbar { width: 10px; }
    ::-webkit-scrollbar-track { background: ${colors.bg}; }
    ::-webkit-scrollbar-thumb { background: ${colors.borderColor}; border-radius: 5px; }
    ::-webkit-scrollbar-thumb:hover { background: ${colors.primary}; }
  `}</style>
);

// --- COMPONENTES AUXILIARES ---

const StatCard = ({ title, value, icon, colors }) => (
  <div style={{
    backgroundColor: colors.cardBg,
    borderRadius: '16px',
    padding: '25px',
    border: `1px solid ${colors.borderColor}`,
    boxShadow: colors.shadow,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  }}>
    <div>
      <h6 style={{ color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '5px' }}>
        {title}
      </h6>
      <h2 style={{ color: colors.money, margin: 0, fontWeight: '900', fontSize: '2.2rem' }}>
        {value}
      </h2>
    </div>
    <div style={{ 
      fontSize: '2.5rem', 
      color: colors.primary, 
      opacity: 0.8,
      backgroundColor: colors.elementBg,
      padding: '15px',
      borderRadius: '12px'
    }}>
      {icon}
    </div>
  </div>
);

const Badge = ({ children, bg, txt }) => (
  <span style={{
    backgroundColor: bg,
    color: txt,
    padding: '5px 12px',
    borderRadius: '50px',
    fontWeight: '800',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'inline-block'
  }}>
    {children}
  </span>
);

const ConfirmationModal = ({ show, onClose, onConfirm, title, message, colors }) => {
  if (!show) return null;
  return (
    <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1055 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ backgroundColor: colors.cardBg, color: colors.textMain, border: `1px solid ${colors.borderColor}` }}>
          <div className="modal-header border-0">
            <h5 className="modal-title fw-bold">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p style={{ color: colors.textSecondary }}>{message}</p>
          </div>
          <div className="modal-footer border-0">
            <button className="btn" style={{ color: colors.textMain, fontWeight: 'bold' }} onClick={onClose}>Cancelar</button>
            <button className="btn btn-danger rounded-pill px-4 fw-bold" onClick={onConfirm}>Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

function AdminPage() {
  const { theme } = useTheme(); 
  const colors = getThemeColors(theme);

  // Estilos inline baseados en la paleta generada
  const styles = {
    container: {
      backgroundColor: colors.bg,
      minHeight: '100vh',
      fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      padding: '40px 20px',
      color: colors.textMain,
      transition: 'background-color 0.3s ease'
    },
    title: {
      background: colors.primaryGradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontWeight: '900',
      fontSize: '2.5rem',
      marginBottom: '0',
    },
    navPill: (isActive) => ({
      backgroundColor: isActive ? colors.primary : 'transparent',
      color: isActive ? '#FFFFFF' : colors.textSecondary,
      border: isActive ? 'none' : `1px solid ${colors.borderColor}`,
      borderRadius: '30px',
      padding: '10px 24px',
      margin: '0 5px 10px 5px',
      fontWeight: '700',
      transition: 'all 0.2s',
      cursor: 'pointer'
    }),
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: '24px',
      padding: '30px',
      border: `1px solid ${colors.borderColor}`,
      boxShadow: colors.shadow,
      marginTop: '30px'
    },
    headerRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '25px'
    },
    // Botones de acción
    btnMain: {
        background: colors.primaryGradient,
        border: 'none',
        color: 'white',
        padding: '10px 25px',
        borderRadius: '50px',
        fontWeight: 'bold',
        boxShadow: `0 4px 15px ${colors.primary}66` // Sombra con color
    },
    btnGhost: {
        background: 'transparent',
        border: `2px solid ${colors.borderColor}`,
        color: colors.textMain,
        padding: '6px 15px',
        borderRadius: '12px',
        fontWeight: '600',
        fontSize: '0.85rem',
        marginRight: '8px'
    }
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
    } catch (err) { setError('Error de conexión con el servidor.'); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  // Handlers
  const handleOpenProductModal = (p = null) => { setProductoActual(p ? { ...p, imagenes: p.imagen_url ? [p.imagen_url] : [] } : null); setShowProductModal(true); };
  const handleSaveProducto = async (p) => { try { const d = { ...p, imagen_url: p.imagenes?.[0] || null }; delete d.imagenes; if (d.id) await updateProduct(d.id, d); else await createProduct(d); toast.success('Guardado'); fetchData(); setShowProductModal(false); } catch { toast.error('Error'); } };
  const handleDeleteProducto = (p) => { setConfirmTitle('Ocultar Producto'); setConfirmMessage(`¿Ocultar "${p.nombre}"?`); setConfirmAction(() => async () => { await deleteProduct(p.id); toast.success('Ocultado'); fetchData(); setShowConfirmModal(false); }); setShowConfirmModal(true); };
  const handleOpenComboModal = (c = null) => { setComboActual(c); setShowComboModal(true); };
  const handleSaveCombo = async (c) => { try { if(c.id) await apiClient.put(`/combos/${c.id}`, c); else await apiClient.post('/combos', c); toast.success('Guardado'); fetchData(); setShowComboModal(false); } catch { toast.error('Error'); } };
  const handleDeleteCombo = (c) => { setConfirmTitle('Desactivar Combo'); setConfirmMessage(`¿Ocultar "${c.nombre}"?`); setConfirmAction(() => async () => { await apiClient.patch(`/combos/${c.id}/desactivar`); toast.success('Desactivado'); fetchData(); setShowConfirmModal(false); }); setShowConfirmModal(true); };
  const handleUpdateStatus = async (id, est) => { try { await apiClient.put(`/pedidos/${id}/estado`, { estado: est }); toast.success(`Pedido #${id}: ${est}`); fetchData(); } catch { toast.error('Error'); } };
  const handlePurge = async () => { if(purgeConfirmText !== 'ELIMINAR') return toast.error('Escribe ELIMINAR'); await apiClient.delete('/pedidos/purgar'); toast.success('Historial Eliminado'); setShowPurgeModal(false); fetchData(); };

  return (
    <>
      <GlobalFixes colors={colors} /> {/* AQUÍ SE INYECTA LA CORRECCIÓN DE BOOTSTRAP */}
      
      <div style={styles.container}>
        <div className="container-fluid px-lg-5">
          
          {/* HEADER */}
          <div className="text-center mb-5">
            <h1 style={styles.title}>Miss Donitas Admin</h1>
            <p style={{ color: colors.primary, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem' }}>
              {theme === 'dark' ? '🔥 MODO PICANTE (DARK)' : '🧁 MODO DULCE (LIGHT)'}
            </p>
          </div>

          {/* TABS */}
          <div className="d-flex justify-content-center flex-wrap mb-4">
            {[
              { id: 'pedidosEnLinea', label: '🛎️ Pedidos' },
              { id: 'productos', label: '🍩 Inventario' },
              { id: 'combos', label: '🎁 Combos' },
              { id: 'reporteGeneral', label: '📊 Finanzas' },
              { id: 'reporteProductos', label: '📈 Ranking' }
            ].map(tab => (
              <button 
                key={tab.id} 
                style={styles.navPill(activeTab === tab.id)} 
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ÁREA DE CONTENIDO */}
          <div style={styles.card}>
            
            {loading && <div className="text-center py-5"><div className="spinner-border" style={{color: colors.primary}} role="status"></div></div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* TABLA: PRODUCTOS */}
            {!loading && !error && activeTab === 'productos' && (
              <div>
                <div style={styles.headerRow}>
                  <h3 className="fw-bold m-0">Inventario</h3>
                  <button style={styles.btnMain} onClick={() => handleOpenProductModal()}>+ Nuevo</button>
                </div>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th style={{color: colors.textSecondary}}>PRODUCTO</th>
                        <th style={{color: colors.textSecondary}}>PRECIO</th>
                        <th style={{color: colors.textSecondary}}>STOCK</th>
                        <th style={{color: colors.textSecondary}}>ESTADO</th>
                        <th className="text-end" style={{color: colors.textSecondary}}>ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productos.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <div className="fw-bold">{p.nombre}</div>
                            <small style={{color: colors.textSecondary}}>{p.categoria}</small>
                          </td>
                          <td style={{ color: colors.money, fontWeight: '900', fontSize: '1.1rem' }}>
                            ${Number(p.precio).toFixed(2)}
                          </td>
                          <td>
                            {p.stock <= 5 
                              ? <Badge bg={colors.badgeDangerBg} txt={colors.badgeDangerTxt}>Bajo: {p.stock}</Badge> 
                              : <span className="fw-bold" style={{color: colors.textMain}}>{p.stock} u.</span>}
                          </td>
                          <td>
                            {p.en_oferta 
                              ? <Badge bg={colors.badgeSuccessBg} txt={colors.badgeSuccessTxt}>Oferta</Badge> 
                              : <span style={{color: colors.textSecondary}}>Normal</span>}
                          </td>
                          <td className="text-end">
                            <button style={styles.btnGhost} onClick={() => handleOpenProductModal(p)}>Editar</button>
                            <button style={{...styles.btnGhost, color: colors.badgeDangerTxt, borderColor: colors.badgeDangerTxt}} onClick={() => handleDeleteProducto(p)}>Ocultar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TABLA: PEDIDOS */}
            {!loading && !error && activeTab === 'pedidosEnLinea' && (
              <div>
                <div style={styles.headerRow}>
                  <h3 className="fw-bold m-0">Pedidos Entrantes</h3>
                  {pedidos.filter(p => p.estado === 'Pendiente').length > 0 && 
                    <Badge bg={colors.primary} txt="#FFF">{pedidos.filter(p => p.estado === 'Pendiente').length} Pendientes</Badge>
                  }
                </div>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th style={{color: colors.textSecondary}}>CLIENTE</th>
                        <th style={{color: colors.textSecondary}}>TOTAL</th>
                        <th style={{color: colors.textSecondary}}>TIPO</th>
                        <th style={{color: colors.textSecondary}}>ESTADO</th>
                        <th style={{color: colors.textSecondary}}>ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidos.map((p) => (
                        <tr key={p.id}>
                          <td>
                             <span style={{color: colors.primary, fontWeight: 'bold'}}>#{p.id}</span>
                             <div className="fw-bold">{p.nombre_cliente}</div>
                             <small style={{color: colors.textSecondary}}>{new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                          </td>
                          <td style={{ color: colors.money, fontWeight: '900', fontSize: '1.2rem' }}>
                            ${Number(p.total).toFixed(2)}
                          </td>
                          <td>
                            {p.tipo_orden === 'domicilio' 
                              ? <span style={{color: colors.textMain}}>🛵 Domicilio</span> 
                              : <span style={{color: colors.textMain}}>🏪 Recoger</span>}
                          </td>
                          <td>
                             {p.estado === 'Pendiente' && <Badge bg={colors.badgeDangerBg} txt={colors.badgeDangerTxt}>Pendiente</Badge>}
                             {p.estado === 'En Preparacion' && <Badge bg={colors.badgePendingBg} txt={colors.badgePendingTxt}>Cocinando</Badge>}
                             {p.estado === 'En Camino' && <Badge bg={colors.badgePendingBg} txt={colors.badgePendingTxt}>En Camino</Badge>}
                             {p.estado === 'Listo' && <Badge bg={colors.badgeSuccessBg} txt={colors.badgeSuccessTxt}>Listo</Badge>}
                             {p.estado === 'Completado' && <span style={{color: colors.textSecondary, fontWeight:'bold'}}>✓ Completado</span>}
                          </td>
                          <td>
                             <button className="btn btn-sm btn-light rounded-pill me-1" onClick={() => {setSelectedOrderDetails(p); setShowDetailsModal(true);}}>Ver</button>
                             {p.estado !== 'Completado' && (
                               <>
                                 <button className="btn btn-sm btn-outline-warning rounded-pill me-1" onClick={() => handleUpdateStatus(p.id, 'En Preparacion')}>Prep</button>
                                 {p.tipo_orden === 'domicilio' 
                                   ? <button className="btn btn-sm btn-outline-info rounded-pill me-1" onClick={() => handleUpdateStatus(p.id, 'En Camino')}>Moto</button>
                                   : <button className="btn btn-sm btn-outline-success rounded-pill me-1" onClick={() => handleUpdateStatus(p.id, 'Listo')}>Listo</button>
                                 }
                                 <button className="btn btn-sm btn-success rounded-pill" onClick={() => handleUpdateStatus(p.id, 'Completado')}>OK</button>
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

            {/* TABLA: COMBOS (GRID) */}
            {!loading && !error && activeTab === 'combos' && (
               <div>
                  <div style={styles.headerRow}>
                    <h3 className="fw-bold m-0">Combos</h3>
                    <button style={styles.btnMain} onClick={() => handleOpenComboModal()}>+ Nuevo Combo</button>
                  </div>
                  <div className="row g-4">
                    {combos.map((combo) => (
                      <div className="col-md-6 col-lg-4" key={combo.id}>
                        <div style={{
                          border: `1px solid ${combo.esta_activo ? colors.borderColor : colors.badgeDangerTxt}`,
                          borderRadius: '16px',
                          padding: '20px',
                          backgroundColor: colors.elementBg
                        }}>
                          <div className="d-flex justify-content-between mb-2">
                             <h5 className="fw-bold m-0">{combo.nombre}</h5>
                             {combo.esta_activo ? <Badge bg={colors.badgeSuccessBg} txt={colors.badgeSuccessTxt}>ON</Badge> : <Badge bg={colors.badgeDangerBg} txt={colors.badgeDangerTxt}>OFF</Badge>}
                          </div>
                          <h3 style={{color: colors.money, fontWeight: '800'}}>${Number(combo.precio).toFixed(2)}</h3>
                          <p style={{color: colors.textSecondary, fontSize: '0.9rem'}}>{combo.descripcion || 'Sin descripción'}</p>
                          <div className="d-flex gap-2 mt-3">
                             <button className="btn btn-sm w-100 fw-bold" style={{border: `1px solid ${colors.textSecondary}`, color: colors.textMain}} onClick={() => handleOpenComboModal(combo)}>Editar</button>
                             {combo.esta_activo && <button className="btn btn-sm btn-outline-danger w-100 fw-bold" onClick={() => handleDeleteCombo(combo)}>Ocultar</button>}
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
                <div className="row g-4 mb-5">
                   <div className="col-md-6">
                      <StatCard title="Total Ventas" value={`$${reportData.reduce((acc, c) => acc + Number(c.total_ventas), 0).toFixed(2)}`} icon="💰" colors={colors} />
                   </div>
                   <div className="col-md-6">
                      <StatCard title="Promedio Pedido" value="$150.00" icon="📊" colors={colors} />
                   </div>
                </div>
                <h5 className="fw-bold mb-3">Gráfico de Rendimiento</h5>
                <div style={{backgroundColor: colors.elementBg, padding: '20px', borderRadius: '16px'}}>
                    <SalesReportChart reportData={reportData} theme={theme} />
                </div>
                <div className="mt-5 text-end">
                  <button className="btn btn-outline-danger btn-sm" onClick={() => setShowPurgeModal(true)}>⚠️ Purgar Base de Datos</button>
                </div>
              </div>
            )}
            {activeTab === 'reporteProductos' && <ProductSalesReport />}

          </div>
        </div>

        {/* MODALES CONECTADOS */}
        <ProductModal show={showProductModal} handleClose={() => setShowProductModal(false)} handleSave={handleSaveProducto} productoActual={productoActual} />
        <ComboModal show={showComboModal} handleClose={() => setShowComboModal(false)} handleSave={handleSaveCombo} comboActual={comboActual} />
        {showDetailsModal && (<DetallesPedidoModal pedido={selectedOrderDetails} onClose={() => setShowDetailsModal(false)} />)}
        <ConfirmationModal show={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmAction} title={confirmTitle} message={confirmMessage} colors={colors} />

        {/* MODAL DE PURGA */}
        {showPurgeModal && (
          <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ backgroundColor: colors.cardBg, color: colors.textMain, border: '1px solid #FF0000' }}>
                <div className="modal-header bg-danger text-white border-0">
                  <h5 className="modal-title fw-bold">PELIGRO: BORRADO TOTAL</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowPurgeModal(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <p>Escribe <strong>ELIMINAR</strong> para confirmar:</p>
                  <input type="text" className="form-control" style={{backgroundColor: colors.elementBg, color: colors.textMain, borderColor: colors.borderColor}} value={purgeConfirmText} onChange={(e) => setPurgeConfirmText(e.target.value)} />
                </div>
                <div className="modal-footer border-0">
                  <button className="btn btn-danger w-100 fw-bold" onClick={handlePurge} disabled={purgeConfirmText !== 'ELIMINAR'}>DESTRUIR DATOS</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

export default AdminPage;