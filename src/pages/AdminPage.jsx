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

// --- ESTILOS VISUALES REFINADOS ---
const getThemeStyles = (isPicante) => ({
  bg: isPicante ? '#121212' : '#F8F9FA', // Fondo general
  text: isPicante ? '#E0E0E0' : '#333333',
  // Fondo de las tarjetas (ahora más sutil)
  cardBg: isPicante ? '#1A1A1A' : '#FFFFFF', 
  // Bordes más suaves
  border: isPicante ? '1px solid #2D2D2D' : '1px solid #F0F0F0',
  // Acento (Botones/Links)
  accent: isPicante ? '#FF1744' : '#0d6efd', 
  muted: isPicante ? '#888888' : '#999999',
  // Sombra más elegante y difuminada
  shadow: isPicante ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)'
});

// --- BADGES (Etiquetas de estado) ---
const StatusBadge = ({ status, type }) => {
  let badgeClass = 'badge rounded-pill px-3 py-2 fw-bold ';
  if (type === 'order') {
     if (status === 'Pendiente') badgeClass += 'bg-danger text-white';
     else if (status === 'En Preparacion') badgeClass += 'bg-warning text-dark';
     else if (status === 'En Camino') badgeClass += 'bg-info text-white';
     else if (status === 'Listo') badgeClass += 'bg-success text-white';
     else if (status === 'Completado') badgeClass += 'bg-secondary text-white';
  } else if (type === 'boolean') {
     badgeClass += status ? 'bg-success text-white' : 'bg-secondary text-white opacity-50';
  }
  return <span className={badgeClass} style={{fontSize: '0.7rem', letterSpacing: '0.5px'}}>{status === true ? 'ACTIVO' : status === false ? 'INACTIVO' : status}</span>;
};

function AdminPage() {
  const { theme } = useTheme(); 
  const isPicante = theme === 'picante';
  const styles = getThemeStyles(isPicante);

  const [activeTab, setActiveTab] = useState('pedidosEnLinea');
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modales
  const [showProductModal, setShowProductModal] = useState(false);
  const [productoActual, setProductoActual] = useState(null);
  const [showComboModal, setShowComboModal] = useState(false);
  const [comboActual, setComboActual] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

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
  const handleSaveProducto = async (p) => { try { const d = { ...p, imagen_url: p.imagenes?.[0] || null }; delete d.imagenes; if (d.id) await updateProduct(d.id, d); else await createProduct(d); toast.success('Guardado'); fetchData(); setShowProductModal(false); } catch { toast.error('Error'); } };
  const handleDeleteProducto = async (id) => { if(window.confirm('¿Ocultar producto?')) { await deleteProduct(id); fetchData(); }};
  const handleOpenComboModal = (c = null) => { setComboActual(c); setShowComboModal(true); };
  const handleSaveCombo = async (c) => { try { if(c.id) await apiClient.put(`/combos/${c.id}`, c); else await apiClient.post('/combos', c); toast.success('Guardado'); fetchData(); setShowComboModal(false); } catch { toast.error('Error'); } };
  const handleDeleteCombo = async (c) => { if(window.confirm('¿Desactivar combo?')) { await apiClient.patch(`/combos/${c.id}/desactivar`); toast.success('Desactivado'); fetchData(); }};
  const handleUpdateStatus = async (id, est) => { try { await apiClient.put(`/pedidos/${id}/estado`, { estado: est }); toast.success(`Estado: ${est}`); fetchData(); } catch { toast.error('Error'); } };

  return (
    <div style={{ backgroundColor: styles.bg, minHeight: '100vh', color: styles.text, transition: 'background 0.3s ease' }}>
      
      <div className="container-fluid px-4 py-5">
        
        {/* HEADER */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-5">
          <div>
            <h2 className="fw-bold m-0" style={{ fontFamily: 'Playfair Display, serif' }}>Panel de Control</h2>
            <p className="m-0 small" style={{color: styles.muted}}>Administración general</p>
          </div>
          <div className={`px-3 py-1 rounded-pill small fw-bold border ${isPicante ? 'text-danger border-danger' : 'text-primary border-primary'}`}>
             {isPicante ? 'MODO PICANTE' : 'MODO DONA'}
          </div>
        </div>

        {/* TABS DE NAVEGACIÓN */}
        <div className="mb-5 overflow-auto pb-1">
          <div className="d-flex gap-3">
            {[
                { id: 'pedidosEnLinea', label: 'Pedidos', icon: '🛎️' },
                { id: 'productos', label: 'Inventario', icon: '🍩' },
                { id: 'combos', label: 'Combos', icon: '🎁' },
                { id: 'reporteGeneral', label: 'Finanzas', icon: '📊' },
                { id: 'reporteProductos', label: 'Métricas', icon: '📈' }
            ].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="btn d-flex align-items-center gap-2 px-4 py-2 rounded-pill"
                        style={{
                            backgroundColor: isActive ? styles.accent : 'transparent',
                            color: isActive ? '#FFF' : styles.muted,
                            border: isActive ? 'none' : styles.border,
                            fontWeight: isActive ? '700' : '500',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span>{tab.icon}</span> {tab.label}
                    </button>
                )
            })}
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL */}
        <div>
           {loading && <div className="text-center py-5"><div className="spinner-border" style={{color: styles.accent}} role="status"></div></div>}

           {/* PEDIDOS */}
           {!loading && activeTab === 'pedidosEnLinea' && (
               <div className="p-4 rounded-4" style={{backgroundColor: styles.cardBg, boxShadow: styles.shadow}}>
                   <h5 className="fw-bold mb-4">Pedidos Recientes</h5>
                   <div className="table-responsive">
                       <table className="table align-middle" style={{color: styles.text}}>
                           <thead style={{borderBottom: `2px solid ${styles.border}`, borderColor: isPicante ? '#333' : '#eee'}}>
                               <tr>
                                   <th className="pb-3 fw-bold small text-uppercase" style={{color: styles.muted}}>Orden</th>
                                   <th className="pb-3 fw-bold small text-uppercase" style={{color: styles.muted}}>Cliente</th>
                                   <th className="pb-3 fw-bold small text-uppercase" style={{color: styles.muted}}>Total</th>
                                   <th className="pb-3 fw-bold small text-uppercase" style={{color: styles.muted}}>Estado</th>
                                   <th className="pb-3 text-end fw-bold small text-uppercase" style={{color: styles.muted}}>Acciones</th>
                               </tr>
                           </thead>
                           <tbody>
                               {pedidos.map(p => (
                                   <tr key={p.id} style={{borderBottom: styles.border}}>
                                       <td className="py-3 fw-bold" style={{color: styles.accent}}>#{p.id}</td>
                                       <td className="py-3">
                                            <div className="fw-bold">{p.nombre_cliente}</div>
                                            <small style={{color: styles.muted, fontSize: '0.75rem'}}>{new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                                       </td>
                                       <td className="py-3 fw-bold">${Number(p.total).toFixed(2)}</td>
                                       <td className="py-3"><StatusBadge status={p.estado} type="order"/></td>
                                       <td className="py-3 text-end">
                                            <button className="btn btn-sm btn-link text-decoration-none" style={{color: styles.muted}} onClick={() => {setSelectedOrderDetails(p); setShowDetailsModal(true);}}>Ver</button>
                                            {p.estado === 'Pendiente' && <button className="btn btn-sm text-white px-3 rounded-pill fw-bold ms-2" style={{backgroundColor: styles.accent}} onClick={() => handleUpdateStatus(p.id, 'En Preparacion')}>Atender</button>}
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
               </div>
           )}

           {/* PRODUCTOS */}
           {!loading && activeTab === 'productos' && (
               <div className="p-4 rounded-4" style={{backgroundColor: styles.cardBg, boxShadow: styles.shadow}}>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="fw-bold m-0">Catálogo</h5>
                        <button className="btn btn-sm px-4 py-2 rounded-pill fw-bold text-white shadow-sm" style={{backgroundColor: styles.accent}} onClick={() => handleOpenProductModal()}>+ Nuevo Producto</button>
                    </div>
                    <div className="table-responsive">
                        <table className="table align-middle" style={{color: styles.text}}>
                            <thead style={{borderBottom: `2px solid ${styles.border}`}}>
                                <tr>
                                    <th className="pb-3 fw-bold small text-uppercase ps-3" style={{color: styles.muted}}>Nombre</th>
                                    <th className="pb-3 fw-bold small text-uppercase" style={{color: styles.muted}}>Categoría</th>
                                    <th className="pb-3 fw-bold small text-uppercase" style={{color: styles.muted}}>Precio</th>
                                    <th className="pb-3 fw-bold small text-uppercase" style={{color: styles.muted}}>Stock</th>
                                    <th className="pb-3 text-end fw-bold small text-uppercase pe-3" style={{color: styles.muted}}>Opciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productos.map(p => (
                                    <tr key={p.id} style={{borderBottom: styles.border}}>
                                        <td className="ps-3 py-3 fw-bold">{p.nombre}</td>
                                        <td style={{color: styles.muted}}>{p.categoria}</td>
                                        <td className="fw-bold" style={{color: styles.accent}}>${Number(p.precio).toFixed(2)}</td>
                                        <td>{p.stock}</td>
                                        <td className="text-end pe-3">
                                            <button className="btn btn-sm btn-link text-decoration-none me-2" style={{color: styles.text}} onClick={() => handleOpenProductModal(p)}>Editar</button>
                                            <button className="btn btn-sm btn-link text-decoration-none text-danger opacity-75" onClick={() => handleDeleteProducto(p.id)}>Ocultar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
               </div>
           )}

           {/* COMBOS */}
           {!loading && activeTab === 'combos' && (
               <div>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="fw-bold m-0">Combos</h4>
                        <button className="btn rounded-pill px-4 text-white shadow-sm" style={{backgroundColor: styles.accent}} onClick={() => handleOpenComboModal()}>+ Nuevo Combo</button>
                    </div>
                    <div className="row g-4">
                        {combos.map(combo => (
                            <div className="col-md-6 col-lg-4" key={combo.id}>
                                <div className="h-100 p-4 rounded-4" style={{backgroundColor: styles.cardBg, boxShadow: styles.shadow, border: combo.esta_activo ? 'none' : `1px solid ${styles.accent}`}}>
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h5 className="fw-bold mb-0">{combo.nombre}</h5>
                                        <StatusBadge status={combo.esta_activo} type="boolean" />
                                    </div>
                                    <h2 className="fw-bold mb-3" style={{color: styles.accent}}>${Number(combo.precio).toFixed(2)}</h2>
                                    <p className="small mb-4" style={{color: styles.muted}}>{combo.descripcion || 'Sin descripción'}</p>
                                    <div className="d-flex gap-2">
                                        <button className="btn btn-sm btn-light flex-fill rounded-pill border" onClick={() => handleOpenComboModal(combo)}>Editar</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
               </div>
           )}

           {/* REPORTES */}
           {!loading && activeTab === 'reporteGeneral' && (
               <div className="p-4 rounded-4" style={{backgroundColor: styles.cardBg, boxShadow: styles.shadow}}>
                   <h4 className="fw-bold mb-4">Reporte Financiero</h4>
                   <SalesReportChart reportData={reportData} theme={theme} />
               </div>
           )}
           
           {!loading && activeTab === 'reporteProductos' && <ProductSalesReport />}

        </div>
      </div>

      <ProductModal show={showProductModal} handleClose={() => setShowProductModal(false)} handleSave={handleSaveProducto} productoActual={productoActual} isPicante={isPicante} />
      <ComboModal show={showComboModal} handleClose={() => setShowComboModal(false)} handleSave={handleSaveCombo} comboActual={comboActual} isPicante={isPicante} />
      {showDetailsModal && <DetallesPedidoModal pedido={selectedOrderDetails} onClose={() => setShowDetailsModal(false)} />}
    </div>
  );
}

export default AdminPage;