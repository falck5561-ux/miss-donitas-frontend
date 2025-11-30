import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  FiShoppingBag, FiBox, FiLayers, FiPieChart, FiTrendingUp, 
  FiEdit2, FiTrash2, FiEyeOff, FiCheckCircle, FiClock, FiAlertCircle 
} from 'react-icons/fi'; // Asegúrate de tener react-icons instalado, si no, quita los iconos.
import ProductModal from '../components/ProductModal';
import ComboModal from '../components/ComboModal';
import SalesReportChart from '../components/SalesReportChart';
import ProductSalesReport from '../components/ProductSalesReport';
import DetallesPedidoModal from '../components/DetallesPedidoModal';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/productService';
import apiClient from '../services/api';
import { useTheme } from '../context/ThemeContext';

// --- DEFINICIÓN DE TEMAS (PALETAS) ---
const getPalettes = (mode) => {
  const isDark = mode === 'dark';

  return {
    // Fondo principal
    bg: isDark ? '#1A1212' : '#FFFDF5', // Chocolate muy oscuro vs Crema Vainilla
    // Fondo de tarjetas
    cardBg: isDark ? '#2D2424' : '#FFFFFF', // Chocolate oscuro vs Blanco
    // Textos
    textMain: isDark ? '#FFF3E0' : '#4E342E', // Crema claro vs Café oscuro
    textLight: isDark ? '#D7CCC8' : '#8D6E63', // Café con leche vs Café medio
    // Botones y Acciones
    primary: isDark ? '#FF1744' : '#FF80AB', // Rojo Picante vs Rosa Fresa
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #FF1744 0%, #D50000 100%)' // Gradiente Fuego
      : 'linear-gradient(135deg, #FF80AB 0%, #F50057 100%)', // Gradiente Dulce
    secondary: isDark ? '#3E2723' : '#FFECB3',
    // Acciones específicas
    accent: isDark ? '#00E5FF' : '#26C6DA', // Turquesa neón vs Turquesa suave
    danger: isDark ? '#FF5252' : '#EF5350',
    success: isDark ? '#00C853' : '#66BB6A',
    // Elementos de UI
    border: isDark ? '#4E342E' : '#FFF3E0',
    shadow: isDark 
      ? '0 10px 30px rgba(0, 0, 0, 0.5)' 
      : '0 10px 30px rgba(255, 128, 171, 0.15)',
    // Tablas
    tableHeaderBg: isDark ? '#3E2723' : '#FFF0F5',
    tableHeaderText: isDark ? '#FFAB91' : '#880E4F',
    hoverRow: isDark ? '#3E2723' : '#FFF8E1'
  };
};

// --- COMPONENTE DE TARJETA DE ESTADÍSTICA ---
const StatCard = ({ title, value, color, icon, themeColors }) => (
  <div style={{
    backgroundColor: themeColors.cardBg,
    borderRadius: '24px',
    boxShadow: themeColors.shadow,
    padding: '25px',
    textAlign: 'center',
    borderBottom: `4px solid ${color}`,
    height: '100%',
    transition: 'transform 0.2s',
    color: themeColors.textMain
  }}>
    <div style={{ fontSize: '2.5rem', marginBottom: '15px', color: color, opacity: 0.8 }}>{icon}</div>
    <h6 style={{ color: themeColors.textLight, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>{title}</h6>
    <h3 style={{ fontWeight: '800', margin: 0, fontSize: '2rem' }}>{value}</h3>
  </div>
);

function AdminPage() {
  const { theme } = useTheme(); // Asumo que devuelve 'light' o 'dark'
  const themeColors = getPalettes(theme);

  // --- ESTILOS DINÁMICOS ---
  const styles = {
    container: {
      backgroundColor: themeColors.bg,
      minHeight: '100vh',
      fontFamily: '"Nunito", "Segoe UI", sans-serif',
      padding: '40px 20px',
      color: themeColors.textMain,
      transition: 'background-color 0.3s ease, color 0.3s ease'
    },
    headerTitle: {
      background: themeColors.primaryGradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontWeight: '900',
      fontSize: '3rem',
      marginBottom: '10px',
      letterSpacing: '-1px'
    },
    navPillsContainer: {
      backgroundColor: themeColors.cardBg,
      borderRadius: '50px',
      padding: '8px',
      display: 'inline-flex',
      boxShadow: themeColors.shadow,
      marginBottom: '40px',
      border: `1px solid ${themeColors.border}`,
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '5px'
    },
    navLink: {
      color: themeColors.textLight,
      borderRadius: '30px',
      padding: '10px 25px',
      fontWeight: '700',
      border: 'none',
      background: 'transparent',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    navLinkActive: {
      background: themeColors.primaryGradient,
      color: '#FFFFFF', // Siempre blanco para contraste en el botón activo
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      transform: 'translateY(-1px)'
    },
    card: {
      backgroundColor: themeColors.cardBg,
      borderRadius: '24px',
      border: `1px solid ${themeColors.border}`,
      boxShadow: themeColors.shadow,
      padding: '35px',
      transition: 'background-color 0.3s ease'
    },
    tableHeader: {
      backgroundColor: themeColors.tableHeaderBg,
      color: themeColors.tableHeaderText,
      fontWeight: '800',
      borderBottom: 'none',
      textTransform: 'uppercase',
      fontSize: '0.85rem',
      letterSpacing: '1px',
      padding: '15px'
    },
    tableRow: {
      borderBottom: `1px solid ${themeColors.border}`,
      color: themeColors.textMain,
    },
    btnAdd: {
      background: themeColors.primaryGradient,
      border: 'none',
      borderRadius: '50px',
      color: 'white',
      padding: '12px 30px',
      fontWeight: '700',
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'transform 0.2s'
    },
    btnAction: (color, isOutline = true) => ({
      backgroundColor: isOutline ? 'transparent' : color,
      border: isOutline ? `1px solid ${color}` : 'none',
      color: isOutline ? color : 'white',
      borderRadius: '12px',
      padding: '8px 16px',
      fontWeight: '700',
      fontSize: '0.8rem',
      transition: 'all 0.2s',
      marginRight: '6px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px'
    }),
    badge: (bgColor, textColor, borderColor) => ({
      backgroundColor: bgColor,
      color: textColor,
      border: `1px solid ${borderColor || 'transparent'}`,
      padding: '6px 14px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: '800',
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
      display: 'inline-block'
    })
  };

  // --- ESTADOS Y LÓGICA ---
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
  
  // Confirmaciones
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'productos') {
        const res = await getProducts();
        setProductos(res);
      } else if (activeTab === 'reporteGeneral') {
        const res = await apiClient.get('/ventas/reporte');
        setReportData(res.data);
      } else if (activeTab === 'pedidosEnLinea') {
        const res = await apiClient.get('/pedidos');
        setPedidos(res.data);
      } else if (activeTab === 'combos') {
        const res = await apiClient.get('/combos/admin/todos');
        setCombos(res.data);
      }
    } catch (err) {
      setError(`No se pudieron cargar los datos.`);
      console.error("Error en fetchData:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [activeTab]);
  
  // --- HANDLERS (Igual que antes) ---
  const handleOpenProductModal = (producto = null) => {
    if (producto) {
      const productoParaModal = { ...producto, imagenes: producto.imagen_url ? [producto.imagen_url] : [] };
      setProductoActual(productoParaModal);
    } else { setProductoActual(null); }
    setShowProductModal(true); 
  };
  const handleCloseProductModal = () => { setShowProductModal(false); setProductoActual(null); };
  const handleSaveProducto = async (producto) => {
    const action = producto.id ? 'actualizado' : 'creado';
    const datosParaEnviar = { ...producto, imagen_url: (producto.imagenes && producto.imagenes.length > 0) ? producto.imagenes[0] : null };
    delete datosParaEnviar.imagenes; 
    try {
      if (datosParaEnviar.id) { await updateProduct(datosParaEnviar.id, datosParaEnviar); } else { await createProduct(datosParaEnviar); }
      toast.success(`Producto ${action} con éxito.`); fetchData(); handleCloseProductModal();
    } catch (err) { toast.error(`Error al guardar.`); }
  };
  const handleDeleteProducto = (producto) => {
    setConfirmTitle('Desactivar Producto');
    setConfirmMessage(`¿Ocultar "${producto.nombre}" del menú de clientes?`);
    setConfirmAction(() => async () => {
      try { await deleteProduct(producto.id); toast.success(`"${producto.nombre}" ocultado.`); fetchData(); } 
      catch (err) { toast.error('Error al desactivar.'); }
      setShowConfirmModal(false); 
    });
    setShowConfirmModal(true);
  };

  const handleOpenComboModal = (combo = null) => { setComboActual(combo); setShowComboModal(true); };
  const handleCloseComboModal = () => { setShowComboModal(false); setComboActual(null); };
  const handleSaveCombo = async (combo) => {
    try { if (combo.id) { await apiClient.put(`/combos/${combo.id}`, combo); } else { await apiClient.post('/combos', combo); }
      toast.success(`Combo guardado.`); fetchData(); handleCloseComboModal();
    } catch (err) { toast.error(`Error al guardar.`); }
  };
  const handleDeleteCombo = (combo) => {
    setConfirmTitle('Desactivar Combo');
    setConfirmMessage(`¿Ocultar el combo "${combo.nombre}"?`);
    setConfirmAction(() => async () => {
      try { await apiClient.patch(`/combos/${combo.id}/desactivar`); toast.success('Combo ocultado.'); fetchData(); } 
      catch (err) { toast.error('Error al desactivar.'); }
      setShowConfirmModal(false);
    });
    setShowConfirmModal(true);
  };

  const handleUpdateStatus = async (pedidoId, nuevoEstado) => {
    try { await apiClient.put(`/pedidos/${pedidoId}/estado`, { estado: nuevoEstado }); toast.success(`Pedido #${pedidoId} actualizado.`); fetchData(); } 
    catch (err) { toast.error('Error actualizando estado.'); }
  };
  const handleShowDetails = (pedido) => { setSelectedOrderDetails(pedido); setShowDetailsModal(true); };
  const handleCloseDetailsModal = () => { setShowDetailsModal(false); setSelectedOrderDetails(null); };
  const handlePurgePedidos = async () => {
    if (purgeConfirmText !== 'ELIMINAR') return toast.error('Escribe ELIMINAR para confirmar.');
    try { await apiClient.delete('/pedidos/purgar'); toast.success('Historial borrado.'); setShowPurgeModal(false); setPurgeConfirmText(''); if (activeTab === 'pedidosEnLinea') fetchData(); else setActiveTab('pedidosEnLinea'); } 
    catch (error) { toast.error('Error al eliminar.'); }
  };

  // --- RENDER ---
  return (
    <div style={styles.container}>
      <div className="container">
        
        {/* HEADER */}
        <div className="text-center mb-5">
          <h1 style={styles.headerTitle}>🍩 Panel Miss Donitas</h1>
          <p style={{color: themeColors.textLight, fontSize: '1.1rem'}}>Administración en tiempo real</p>
        </div>

        {/* NAVEGACIÓN */}
        <div className="d-flex justify-content-center">
          <div style={styles.navPillsContainer}>
            {[
              { id: 'pedidosEnLinea', label: 'Pedidos', icon: <FiShoppingBag className="me-2"/> },
              { id: 'productos', label: 'Productos', icon: <FiBox className="me-2"/> },
              { id: 'combos', label: 'Combos', icon: <FiLayers className="me-2"/> },
              { id: 'reporteGeneral', label: 'Reportes', icon: <FiPieChart className="me-2"/> },
              { id: 'reporteProductos', label: 'Métricas', icon: <FiTrendingUp className="me-2"/> }
            ].map(tab => (
              <button 
                key={tab.id}
                style={activeTab === tab.id ? {...styles.navLink, ...styles.navLinkActive} : styles.navLink}
                onClick={() => setActiveTab(tab.id)}
              >
                <div className="d-flex align-items-center">
                    {tab.icon} {tab.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL */}
        <div style={styles.card}>
          
          {loading && <div className="text-center py-5"><div className="spinner-border" style={{color: themeColors.primary}} role="status"></div></div>}
          {error && <div className="alert alert-danger rounded-4">{error}</div>}

          {/* === PRODUCTOS === */}
          {!loading && !error && activeTab === 'productos' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <h3 className="fw-bold m-0" style={{color: themeColors.textMain}}>Inventario de Dulzura</h3>
                <button style={styles.btnAdd} onClick={() => handleOpenProductModal()}>
                  + Nuevo Producto
                </button>
              </div>
              <div className="table-responsive">
                <table className="table" style={{borderCollapse: 'separate', borderSpacing: '0 10px'}}>
                  <thead>
                    <tr>
                      <th style={{...styles.tableHeader, borderTopLeftRadius: '15px'}}>Producto</th>
                      <th style={styles.tableHeader}>Precio</th>
                      <th style={styles.tableHeader}>Stock</th>
                      <th style={styles.tableHeader}>Estado</th>
                      <th style={{...styles.tableHeader, borderTopRightRadius: '15px', textAlign: 'center'}}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((p) => (
                      <tr key={p.id} style={{...styles.tableRow, backgroundColor: themeColors.cardBg}}>
                        <td className="align-middle p-3">
                          <div className="fw-bold" style={{fontSize: '1rem', color: themeColors.textMain}}>{p.nombre}</div>
                          <small style={{color: themeColors.textLight}}>{p.categoria}</small>
                        </td>
                        <td className="align-middle fw-bold" style={{color: themeColors.primary}}>${Number(p.precio).toFixed(2)}</td>
                        <td className="align-middle">
                          {p.stock <= 5 
                            ? <span style={styles.badge(theme === 'dark' ? '#3E2723' : '#FFEBEE', theme === 'dark' ? '#FF5252' : '#D32F2F', '#D32F2F')}>Bajo: {p.stock}</span> 
                            : <span style={{color: themeColors.textLight, fontWeight: 'bold'}}>{p.stock} u.</span>}
                        </td>
                        <td className="align-middle">
                          {p.en_oferta 
                            ? <span style={styles.badge(theme === 'dark' ? '#0D47A1' : '#E3F2FD', theme === 'dark' ? '#80D8FF' : '#1976D2', '#1976D2')}>Oferta -{p.descuento_porcentaje}%</span> 
                            : <span style={styles.badge(theme === 'dark' ? '#212121' : '#F5F5F5', theme === 'dark' ? '#9E9E9E' : '#757575', '#9E9E9E')}>Normal</span>}
                        </td>
                        <td className="align-middle text-center">
                          <button style={styles.btnAction(themeColors.accent, true)} onClick={() => handleOpenProductModal(p)}><FiEdit2/> Editar</button>
                          <button style={styles.btnAction(themeColors.danger, true)} onClick={() => handleDeleteProducto(p)}><FiEyeOff/> Ocultar</button>
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
                <h3 className="fw-bold m-0" style={{color: themeColors.textMain}}>Pedidos Entrantes</h3>
                <span style={{backgroundColor: themeColors.danger, color: '#FFF', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold'}}>
                    {pedidos.filter(p => p.estado === 'Pendiente').length} Por Atender
                </span>
              </div>
              <div className="table-responsive">
                <table className="table" style={{borderCollapse: 'separate', borderSpacing: '0 10px'}}>
                  <thead>
                    <tr>
                      <th style={{...styles.tableHeader, borderTopLeftRadius: '15px'}}>Orden</th>
                      <th style={styles.tableHeader}>Cliente</th>
                      <th style={styles.tableHeader}>Total</th>
                      <th style={styles.tableHeader}>Tipo</th>
                      <th style={styles.tableHeader}>Status</th>
                      <th style={{...styles.tableHeader, borderTopRightRadius: '15px', textAlign: 'center'}}>Control</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.map((p) => (
                      <tr key={p.id} style={{...styles.tableRow, backgroundColor: themeColors.cardBg}}>
                        <td className="align-middle p-3">
                            <span style={{color: themeColors.textLight, fontWeight: '800'}}>#{p.id}</span>
                        </td>
                        <td className="align-middle">
                          <div className="fw-bold" style={{color: themeColors.textMain}}>{p.nombre_cliente}</div>
                          <small style={{color: themeColors.textLight}}>{new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                        </td>
                        <td className="align-middle fw-bold" style={{color: themeColors.primary, fontSize: '1.1rem'}}>${Number(p.total).toFixed(2)}</td>
                        <td className="align-middle">
                          {p.tipo_orden === 'domicilio' 
                            ? <span style={styles.badge(theme === 'dark' ? '#006064' : '#E0F7FA', theme === 'dark' ? '#84FFFF' : '#0097A7', '#0097A7')}>🛵 Domicilio</span> 
                            : <span style={styles.badge(theme === 'dark' ? '#E65100' : '#FFF3E0', theme === 'dark' ? '#FFCC80' : '#F57C00', '#F57C00')}>🏪 Recoger</span>}
                        </td>
                        <td className="align-middle">
                            {/* Lógica de colores para estados */}
                           {(() => {
                               let bg = themeColors.border;
                               let text = themeColors.textLight;
                               if(p.estado === 'Pendiente') { bg = '#FFAB00'; text = '#212121'; }
                               else if(p.estado === 'Completado') { bg = themeColors.success; text = '#FFF'; }
                               else { bg = themeColors.accent; text = '#FFF'; }
                               
                               return <span className="badge rounded-pill" style={{backgroundColor: bg, color: text, padding: '8px 12px'}}>{p.estado}</span>;
                           })()}
                        </td>
                        <td className="align-middle text-center">
                          <button className="btn btn-sm btn-light rounded-pill border me-2 fw-bold" onClick={() => handleShowDetails(p)} style={{color: '#555'}}>Ver Detalle</button>
                          {p.estado !== 'Completado' && (
                             <button 
                                className="btn btn-sm rounded-pill border-0 fw-bold shadow-sm text-white" 
                                style={{background: themeColors.primaryGradient}} 
                                onClick={() => handleUpdateStatus(p.id, 'En Preparacion')}
                             >
                                Cocinar
                             </button>
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
          {!loading && !error && activeTab === 'combos' && (
            <div>
               <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <h3 className="fw-bold m-0" style={{color: themeColors.textMain}}>Combos & Promociones</h3>
                <button style={styles.btnAdd} onClick={() => handleOpenComboModal()}>+ Nuevo Combo</button>
              </div>
              <div className="row g-4">
                {combos.map((combo) => (
                  <div className="col-md-6 col-lg-4" key={combo.id}>
                    <div style={{
                      border: `1px solid ${combo.esta_activo ? themeColors.success : themeColors.border}`, 
                      borderRadius: '20px', 
                      padding: '25px', 
                      backgroundColor: themeColors.cardBg,
                      opacity: combo.esta_activo ? 1 : 0.6,
                      boxShadow: themeColors.shadow
                    }}>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h5 className="fw-bold mb-0" style={{color: themeColors.textMain}}>{combo.nombre}</h5>
                        <span style={combo.esta_activo 
                            ? styles.badge(theme === 'dark' ? '#1B5E20' : '#E8F5E9', theme === 'dark' ? '#69F0AE' : '#2E7D32', '#2E7D32') 
                            : styles.badge(theme === 'dark' ? '#3E2723' : '#FFEBEE', theme === 'dark' ? '#EF9A9A' : '#C62828', '#C62828')}>
                          {combo.esta_activo ? 'ACTIVO' : 'OCULTO'}
                        </span>
                      </div>
                      <h4 style={{color: themeColors.primary, fontWeight: '800', fontSize: '1.8rem'}}>${Number(combo.precio).toFixed(2)}</h4>
                      <div className="mt-4 d-flex gap-2">
                        <button style={{...styles.btnAction(themeColors.accent, true), flex:1}} onClick={() => handleOpenComboModal(combo)}><FiEdit2/> Editar</button>
                        {combo.esta_activo && (
                          <button style={{...styles.btnAction(themeColors.danger, true), flex:1}} onClick={() => handleDeleteCombo(combo)}><FiEyeOff/> Ocultar</button>
                        )}
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
              {reportData.length > 0 ? (
                <div>
                   <div className="row mb-5 g-4">
                      <div className="col-md-4"><StatCard title="Ventas Totales" value={`$${reportData.reduce((acc, curr) => acc + Number(curr.total_ventas), 0).toFixed(2)}`} color={themeColors.success} icon={<FiTrendingUp/>} themeColors={themeColors} /></div>
                      <div className="col-md-4"><StatCard title="Transacciones" value={reportData.reduce((acc, curr) => acc + Number(curr.cantidad_pedidos), 0)} color={themeColors.accent} icon={<FiShoppingBag/>} themeColors={themeColors} /></div>
                      <div className="col-md-4"><StatCard title="Promedio Venta" value="$150.00" color={themeColors.primary} icon={<FiPieChart/>} themeColors={themeColors} /></div>
                   </div>
                   <h5 className="mb-4 fw-bold" style={{color: themeColors.textMain}}>Gráfica de Rendimiento</h5>
                   <div style={{padding: '20px', backgroundColor: theme === 'dark' ? '#3E2723' : '#FAFAFA', borderRadius: '20px'}}>
                      <SalesReportChart reportData={reportData} theme={theme} /> 
                   </div>
                </div>
              ) : <p className="text-center py-5 text-muted">Aún no hay suficientes ventas para generar gráficas.</p>}
              
              <div className="mt-5 p-4 rounded-4" style={{backgroundColor: theme === 'dark' ? '#210000' : '#FFEBEE', border: `1px dashed ${themeColors.danger}`}}>
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div>
                    <h5 className="fw-bold m-0" style={{color: themeColors.danger}}>Zona de Peligro</h5>
                    <p className="small m-0" style={{color: themeColors.textLight}}>Acciones irreversibles para la base de datos.</p>
                  </div>
                  <button className="btn btn-outline-danger rounded-pill btn-sm fw-bold px-4" onClick={() => setShowPurgeModal(true)}>
                    <FiTrash2 className="me-2"/>Purgar Historial
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'reporteProductos' && <ProductSalesReport />}

        </div>
      </div>

      {/* MODALES AUXILIARES */}
      <ProductModal show={showProductModal} handleClose={handleCloseProductModal} handleSave={handleSaveProducto} productoActual={productoActual} />
      <ComboModal show={showComboModal} handleClose={handleCloseComboModal} handleSave={handleSaveCombo} comboActual={comboActual} />
      {showDetailsModal && (<DetallesPedidoModal pedido={selectedOrderDetails} onClose={handleCloseDetailsModal} />)}

      {/* CONFIRMACIÓN MODAL (GENÉRICO) */}
      {showConfirmModal && (
         <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content" style={{ borderRadius: '24px', border: 'none', backgroundColor: themeColors.cardBg, color: themeColors.textMain }}>
                    <div className="modal-body p-4 text-center">
                        <FiAlertCircle size={50} color={themeColors.primary} className="mb-3"/>
                        <h4 className="fw-bold mb-2">{confirmTitle}</h4>
                        <p style={{color: themeColors.textLight}}>{confirmMessage}</p>
                        <div className="d-flex justify-content-center gap-2 mt-4">
                            <button className="btn btn-light rounded-pill px-4 fw-bold" onClick={() => setShowConfirmModal(false)}>Cancelar</button>
                            <button className="btn text-white rounded-pill px-4 fw-bold" style={{backgroundColor: themeColors.danger}} onClick={confirmAction}>Confirmar</button>
                        </div>
                    </div>
                </div>
            </div>
         </div>
      )}

      {/* PURGAR MODAL */}
      {showPurgeModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 overflow-hidden shadow-lg">
              <div className="modal-header text-white border-0" style={{backgroundColor: '#D32F2F'}}><h5 className="modal-title fw-bold">⚠️ BORRADO TOTAL</h5><button type="button" className="btn-close btn-close-white" onClick={() => setShowPurgeModal(false)}></button></div>
              <div className="modal-body bg-white p-4 text-dark">
                <p className="mb-2">Estás a punto de borrar <strong>TODO el historial de pedidos</strong>. Esto no se puede deshacer.</p>
                <p className="small text-muted mb-3">Escribe <strong>ELIMINAR</strong> para confirmar:</p>
                <input type="text" className="form-control" value={purgeConfirmText} onChange={(e) => setPurgeConfirmText(e.target.value)} />
              </div>
              <div className="modal-footer bg-white border-0">
                <button type="button" className="btn btn-secondary rounded-pill" onClick={() => setShowPurgeModal(false)}>Cancelar</button>
                <button type="button" className="btn btn-danger rounded-pill shadow-sm" onClick={handlePurgePedidos} disabled={purgeConfirmText !== 'ELIMINAR'}>Borrar Todo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;