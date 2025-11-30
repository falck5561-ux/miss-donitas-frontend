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

// --- COMPONENTE AUXILIAR: BADGES DE ESTADO ---
const StatusBadge = ({ status, type }) => {
  let badgeClass = 'badge rounded-pill px-3 py-2 shadow-sm ';
  
  if (type === 'order') {
     if (status === 'Pendiente') badgeClass += 'bg-danger text-white';
     else if (status === 'En Preparacion') badgeClass += 'bg-warning text-dark';
     else if (status === 'En Camino') badgeClass += 'bg-info text-white';
     else if (status === 'Listo') badgeClass += 'bg-success text-white';
     else if (status === 'Completado') badgeClass += 'bg-dark border border-secondary text-white';
  } else if (type === 'boolean') {
     badgeClass += status ? 'bg-success text-white' : 'bg-secondary text-white';
  }

  return <span className={badgeClass} style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>{status === true ? 'ACTIVO' : status === false ? 'INACTIVO' : status}</span>;
};

// --- COMPONENTE PRINCIPAL ---
function AdminPage() {
  const { theme } = useTheme(); 
  const isPicante = theme === 'picante';

  // --- ESTADOS ---
  const [activeTab, setActiveTab] = useState('pedidosEnLinea');
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // --- MODALES ---
  const [showProductModal, setShowProductModal] = useState(false);
  const [productoActual, setProductoActual] = useState(null);
  const [showComboModal, setShowComboModal] = useState(false);
  const [comboActual, setComboActual] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // --- CARGA DE DATOS ---
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'productos') { const res = await getProducts(); setProductos(res); } 
      else if (activeTab === 'reporteGeneral') { const res = await apiClient.get('/ventas/reporte'); setReportData(res.data); } 
      else if (activeTab === 'pedidosEnLinea') { const res = await apiClient.get('/pedidos'); setPedidos(res.data); } 
      else if (activeTab === 'combos') { const res = await apiClient.get('/combos/admin/todos'); setCombos(res.data); }
    } catch (err) { console.error('Error cargando datos'); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  // --- HANDLERS ---
  const handleOpenProductModal = (p = null) => { setProductoActual(p ? { ...p, imagenes: p.imagen_url ? [p.imagen_url] : [] } : null); setShowProductModal(true); };
  const handleSaveProducto = async (p) => { try { const d = { ...p, imagen_url: p.imagenes?.[0] || null }; delete d.imagenes; if (d.id) await updateProduct(d.id, d); else await createProduct(d); toast.success('Guardado con éxito'); fetchData(); setShowProductModal(false); } catch { toast.error('Error al guardar'); } };
  const handleDeleteProducto = async (id) => { if(window.confirm('¿Estás seguro de ocultar este producto?')) { await deleteProduct(id); fetchData(); }};
  const handleOpenComboModal = (c = null) => { setComboActual(c); setShowComboModal(true); };
  const handleSaveCombo = async (c) => { try { if(c.id) await apiClient.put(`/combos/${c.id}`, c); else await apiClient.post('/combos', c); toast.success('Combo guardado'); fetchData(); setShowComboModal(false); } catch { toast.error('Error al guardar combo'); } };
  const handleDeleteCombo = async (c) => { if(window.confirm('¿Desactivar combo?')) { await apiClient.patch(`/combos/${c.id}/desactivar`); toast.success('Desactivado'); fetchData(); }};
  const handleUpdateStatus = async (id, est) => { try { await apiClient.put(`/pedidos/${id}/estado`, { estado: est }); toast.success(`Pedido actualizado a: ${est}`); fetchData(); } catch { toast.error('Error actualizando estado'); } };

  return (
    <div className="container-fluid px-4 py-5 admin-container">
      
      {/* HEADER PRINCIPAL */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h1 className="display-5 fw-bold mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>Panel de Control</h1>
          <p className="text-muted mb-0">Gestión completa de tu negocio</p>
        </div>
        <div>
            {/* BADGE DE MODO */}
            <span className={`badge ${isPicante ? 'bg-danger shadow' : 'bg-primary'} rounded-pill px-4 py-2 text-uppercase`} style={{fontSize: '0.85rem', letterSpacing: '1px'}}>
                {isPicante ? '🔥 Modo Picante' : '🍩 Modo Dona'}
            </span>
        </div>
      </div>

      {/* MENÚ DE NAVEGACIÓN (TABS) */}
      <div className="d-flex justify-content-start mb-4 overflow-auto pb-2">
        <div className="btn-group shadow-sm rounded-pill" role="group" aria-label="Tabs Admin">
            {[
                { id: 'pedidosEnLinea', label: '🛎️ Pedidos', count: pedidos.filter(p => p.estado === 'Pendiente').length },
                { id: 'productos', label: '🍩 Inventario', count: 0 },
                { id: 'combos', label: '🎁 Combos', count: 0 },
                { id: 'reporteGeneral', label: '📊 Finanzas', count: 0 },
                { id: 'reporteProductos', label: '📈 Métricas', count: 0 }
            ].map(tab => (
                <button
                    key={tab.id}
                    type="button"
                    className={`btn px-4 py-2 fw-bold ${activeTab === tab.id ? (isPicante ? 'btn-danger' : 'btn-primary') : (isPicante ? 'btn-outline-secondary text-white' : 'btn-outline-primary')}`}
                    onClick={() => setActiveTab(tab.id)}
                    style={{ transition: 'all 0.2s', border: activeTab !== tab.id ? '1px solid transparent' : undefined }}
                >
                    {tab.label} {tab.count > 0 && <span className="badge bg-white text-dark ms-2 rounded-pill">{tab.count}</span>}
                </button>
            ))}
        </div>
      </div>

      {/* TARJETA DE CONTENIDO PRINCIPAL */}
      <div className="card shadow-lg border-0" style={{ minHeight: '600px', borderRadius: '20px' }}>
        <div className="card-body p-4 p-md-5">
            
            {loading && <div className="text-center py-5"><div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status"></div><p className="mt-3 text-muted">Cargando datos...</p></div>}

            {/* === SECCIÓN DE PEDIDOS === */}
            {!loading && activeTab === 'pedidosEnLinea' && (
                <div className="table-responsive">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h3 className="fw-bold m-0">Pedidos Entrantes</h3>
                        <span className="text-muted">Mostrando últimos pedidos</span>
                    </div>
                    <table className="table align-middle table-hover">
                        <thead className={isPicante ? 'border-secondary' : 'bg-light'}>
                            <tr>
                                <th className="py-3">ID</th>
                                <th>Cliente / Hora</th>
                                <th>Total</th>
                                <th>Tipo</th>
                                <th>Estado</th>
                                <th className="text-end">Control</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pedidos.map(p => (
                                <tr key={p.id}>
                                    <td className="fw-bold text-primary">#{p.id}</td>
                                    <td>
                                        <div className="fw-bold">{p.nombre_cliente}</div>
                                        <small className="text-muted">{new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                                    </td>
                                    <td className="fw-bolder fs-5" style={{ color: isPicante ? '#FF1744' : '#00C853', fontFamily: 'monospace' }}>
                                      ${Number(p.total).toFixed(2)}
                                    </td>
                                    <td>{p.tipo_orden === 'domicilio' ? <span className="badge bg-info text-dark">🛵 Moto</span> : <span className="badge bg-warning text-dark">🏪 Local</span>}</td>
                                    <td><StatusBadge status={p.estado} type="order"/></td>
                                    <td className="text-end">
                                        <button className="btn btn-sm btn-light rounded-pill me-2 border" onClick={() => {setSelectedOrderDetails(p); setShowDetailsModal(true);}}>Ver</button>
                                        
                                        {p.estado === 'Pendiente' && <button className="btn btn-sm btn-warning rounded-pill fw-bold" onClick={() => handleUpdateStatus(p.id, 'En Preparacion')}>👨‍🍳 Preparar</button>}
                                        
                                        {p.estado === 'En Preparacion' && (p.tipo_orden === 'domicilio' 
                                            ? <button className="btn btn-sm btn-info text-white rounded-pill fw-bold" onClick={() => handleUpdateStatus(p.id, 'En Camino')}>🛵 Enviar</button> 
                                            : <button className="btn btn-sm btn-success rounded-pill fw-bold" onClick={() => handleUpdateStatus(p.id, 'Listo')}>🥡 Listo</button>)}
                                        
                                        {(p.estado === 'En Camino' || p.estado === 'Listo') && <button className="btn btn-sm btn-success rounded-pill fw-bold px-3" onClick={() => handleUpdateStatus(p.id, 'Completado')}>✅ Finalizar</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* === SECCIÓN DE INVENTARIO (PRODUCTOS) === */}
            {!loading && activeTab === 'productos' && (
                <div>
                     <div className="d-flex justify-content-between align-items-center mb-4">
                        <h3 className="fw-bold m-0">Inventario de Productos</h3>
                        <button className={`btn ${isPicante ? 'btn-danger' : 'btn-primary'} rounded-pill px-4 shadow-sm fw-bold`} onClick={() => handleOpenProductModal()}>+ Nuevo Producto</button>
                    </div>
                    <div className="table-responsive">
                        <table className="table align-middle table-hover">
                            <thead className={isPicante ? 'border-secondary' : 'bg-light'}>
                                <tr>
                                    <th className="py-3">Producto</th>
                                    <th>Categoría</th>
                                    <th>Precio</th>
                                    <th>Stock</th>
                                    <th className="text-end">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productos.map(p => (
                                    <tr key={p.id}>
                                        <td>
                                            <div className="fw-bold">{p.nombre}</div>
                                            {p.en_oferta && <span className="badge bg-success" style={{fontSize: '0.65rem'}}>EN OFERTA</span>}
                                        </td>
                                        <td className="text-muted">{p.categoria}</td>
                                        <td className="fw-bold fs-5" style={{ color: isPicante ? '#00E676' : '#212529', fontFamily: 'monospace' }}>
                                          ${Number(p.precio).toFixed(2)}
                                        </td>
                                        <td>
                                            {p.stock <= 5 
                                                ? <span className="badge bg-danger rounded-pill px-3">BAJO: {p.stock}</span> 
                                                : <span className="badge bg-secondary bg-opacity-25 text-body rounded-pill px-3">{p.stock} u.</span>}
                                        </td>
                                        <td className="text-end">
                                            {/* BOTONES DE ACCIÓN MEJORADOS */}
                                            <button className="btn-action-edit me-2" onClick={() => handleOpenProductModal(p)}>
                                                ✏️ Editar
                                            </button>
                                            <button className="btn-action-delete" onClick={() => handleDeleteProducto(p.id)}>
                                                👁️ Ocultar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* === SECCIÓN DE COMBOS === */}
            {!loading && activeTab === 'combos' && (
                <div>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h3 className="fw-bold m-0">Combos & Promociones</h3>
                        <button className={`btn ${isPicante ? 'btn-danger' : 'btn-primary'} rounded-pill px-4 shadow-sm fw-bold`} onClick={() => handleOpenComboModal()}>+ Nuevo Combo</button>
                    </div>
                    <div className="row g-4">
                        {combos.map(combo => (
                            <div className="col-md-6 col-lg-4" key={combo.id}>
                                <div className={`card h-100 ${combo.esta_activo ? (isPicante ? 'border-success' : 'border-primary') : 'border-danger opacity-75'}`} style={{borderWidth: '2px', borderRadius: '16px', background: 'transparent'}}>
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h5 className="card-title fw-bold mb-0 text-truncate">{combo.nombre}</h5>
                                            <StatusBadge status={combo.esta_activo} type="boolean" />
                                        </div>
                                        <h2 className="display-6 fw-bold mb-3" style={{ color: isPicante ? '#FF1744' : '#212529' }}>
                                          ${Number(combo.precio).toFixed(2)}
                                        </h2>
                                        <p className="card-text text-muted small" style={{minHeight: '40px'}}>{combo.descripcion || 'Sin descripción detallada.'}</p>
                                        
                                        <div className="mt-3 d-flex gap-2">
                                            <button className="btn btn-outline-secondary btn-sm flex-fill rounded-pill fw-bold" onClick={() => handleOpenComboModal(combo)}>✏️ Editar</button>
                                            {combo.esta_activo && <button className="btn btn-outline-danger btn-sm flex-fill rounded-pill fw-bold" onClick={() => handleDeleteCombo(combo)}>👁️ Ocultar</button>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* === SECCIÓN DE FINANZAS === */}
            {!loading && activeTab === 'reporteGeneral' && (
                <div>
                    <h3 className="fw-bold mb-4">Resumen Financiero</h3>
                    <div className="row g-4 mb-5">
                        <div className="col-md-6 col-lg-5">
                            <div className={`p-4 rounded-4 border ${isPicante ? 'border-danger' : 'border-success'} text-center`} style={{background: isPicante ? '#1a0505' : '#f0fff4'}}>
                                <h6 className={`fw-bold text-uppercase ${isPicante ? 'text-danger' : 'text-success'}`}>Ventas Totales (Histórico)</h6>
                                <h1 className="display-3 fw-bold mb-0" style={{ color: isPicante ? '#FF1744' : '#198754', textShadow: isPicante ? '0 0 20px rgba(255,23,68,0.3)' : 'none' }}>
                                    ${reportData.reduce((acc, curr) => acc + Number(curr.total_ventas), 0).toFixed(2)}
                                </h1>
                            </div>
                        </div>
                        <div className="col-md-6 col-lg-7 d-flex align-items-center">
                            <div className="ps-md-4">
                                <h5>💡 <strong>Insight Rápido</strong></h5>
                                <p className="text-muted">Este gráfico muestra el rendimiento de ventas por día. Usa esta información para planear tu inventario de donas para los días pico.</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border rounded-4 shadow-sm" style={{background: isPicante ? '#1E1E1E' : '#FFFFFF'}}>
                         <SalesReportChart reportData={reportData} theme={theme} />
                    </div>
                </div>
            )}

             {activeTab === 'reporteProductos' && <ProductSalesReport />}

        </div>
      </div>

      {/* MODALES CONECTADOS */}
      <ProductModal show={showProductModal} handleClose={() => setShowProductModal(false)} handleSave={handleSaveProducto} productoActual={productoActual} />
      <ComboModal show={showComboModal} handleClose={() => setShowComboModal(false)} handleSave={handleSaveCombo} comboActual={comboActual} />
      {showDetailsModal && <DetallesPedidoModal pedido={selectedOrderDetails} onClose={() => setShowDetailsModal(false)} />}

    </div>
  );
}

export default AdminPage;