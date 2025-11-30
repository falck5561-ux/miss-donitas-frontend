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

// --- COMPONENTE AUXILIAR PARA BADGES (ETIQUETAS) ---
const StatusBadge = ({ status, type }) => {
  let badgeClass = 'badge rounded-pill px-3 py-2 ';
  
  if (type === 'order') {
     if (status === 'Pendiente') badgeClass += 'bg-danger text-white'; // Rojo intenso
     else if (status === 'En Preparacion') badgeClass += 'bg-warning text-dark';
     else if (status === 'En Camino') badgeClass += 'bg-info text-dark';
     else if (status === 'Listo') badgeClass += 'bg-success text-white';
     else if (status === 'Completado') badgeClass += 'bg-dark border border-secondary text-white';
  } else if (type === 'boolean') {
     badgeClass += status ? 'bg-success bg-opacity-75 text-white' : 'bg-secondary bg-opacity-75 text-white';
  }

  return <span className={badgeClass}>{status === true ? 'ACTIVO' : status === false ? 'INACTIVO' : status}</span>;
};

// --- COMPONENTE PRINCIPAL ---
function AdminPage() {
  // Obtenemos el tema actual ('dona' o 'picante')
  const { theme } = useTheme(); 
  const isPicante = theme === 'picante';

  // Estados
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

  // Carga de datos
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

  // Manejadores (Handlers)
  const handleOpenProductModal = (p = null) => { setProductoActual(p ? { ...p, imagenes: p.imagen_url ? [p.imagen_url] : [] } : null); setShowProductModal(true); };
  const handleSaveProducto = async (p) => { try { const d = { ...p, imagen_url: p.imagenes?.[0] || null }; delete d.imagenes; if (d.id) await updateProduct(d.id, d); else await createProduct(d); toast.success('Guardado'); fetchData(); setShowProductModal(false); } catch { toast.error('Error'); } };
  const handleDeleteProducto = async (id) => { if(window.confirm('¿Ocultar producto?')) { await deleteProduct(id); fetchData(); }};
  const handleOpenComboModal = (c = null) => { setComboActual(c); setShowComboModal(true); };
  const handleSaveCombo = async (c) => { try { if(c.id) await apiClient.put(`/combos/${c.id}`, c); else await apiClient.post('/combos', c); toast.success('Guardado'); fetchData(); setShowComboModal(false); } catch { toast.error('Error'); } };
  const handleUpdateStatus = async (id, est) => { try { await apiClient.put(`/pedidos/${id}/estado`, { estado: est }); toast.success(`Estado actualizado`); fetchData(); } catch { toast.error('Error'); } };

  return (
    <div className="container-fluid px-4 py-5 admin-container">
      
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h1 className="display-5 fw-bold mb-0">Panel de Control</h1>
          <p className="text-muted mb-0">Gestión en tiempo real</p>
        </div>
        <div className="d-flex align-items-center gap-2">
            {/* Badge indicador de modo */}
            <span className={`badge ${isPicante ? 'bg-danger shadow-lg' : 'bg-primary'} rounded-pill px-3 py-2`} style={{fontSize: '0.9rem'}}>
                {isPicante ? '🔥 MODO PICANTE' : '🍩 MODO DONA'}
            </span>
        </div>
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <ul className="nav nav-tabs mb-4 border-bottom-0 gap-2">
        {[
            { id: 'pedidosEnLinea', label: '🛎️ Pedidos', count: pedidos.filter(p => p.estado === 'Pendiente').length },
            { id: 'productos', label: '🍩 Inventario' },
            { id: 'combos', label: '🎁 Combos' },
            { id: 'reporteGeneral', label: '📊 Finanzas' },
            { id: 'reporteProductos', label: '📈 Métricas' }
        ].map(tab => (
            <li className="nav-item" key={tab.id}>
                <button 
                    className={`nav-link ${activeTab === tab.id ? 'active fw-bold' : ''}`} 
                    onClick={() => setActiveTab(tab.id)}
                    style={{ 
                        fontSize: '1rem', 
                        position: 'relative',
                        // Si es Picante y Activo, forzar color rojo
                        color: (isPicante && activeTab === tab.id) ? '#FF1744' : undefined,
                        borderColor: (isPicante && activeTab === tab.id) ? '#FF1744' : undefined
                    }}
                >
                    {tab.label}
                    {tab.count > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{tab.count}</span>}
                </button>
            </li>
        ))}
      </ul>

      {/* CONTENIDO PRINCIPAL */}
      <div className="card shadow border-0" style={{ minHeight: '500px' }}>
        <div className="card-body p-4">
            
            {loading && <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>}

            {/* TABLA PEDIDOS */}
            {!loading && activeTab === 'pedidosEnLinea' && (
                <div className="table-responsive">
                    <div className="d-flex justify-content-between mb-3">
                        <h3 className="fw-bold">Pedidos Entrantes</h3>
                    </div>
                    <table className="table align-middle table-hover">
                        <thead>
                            <tr>
                                <th># ID</th>
                                <th>Cliente</th>
                                <th>Total</th>
                                <th>Tipo</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pedidos.map(p => (
                                <tr key={p.id}>
                                    <td className="fw-bold text-primary">#{p.id}</td>
                                    <td>
                                        <div className="fw-bold">{p.nombre_cliente}</div>
                                        <small className="text-muted">{new Date(p.fecha).toLocaleTimeString()}</small>
                                    </td>
                                    {/* PRECIO: ROJO NEÓN EN MODO PICANTE */}
                                    <td className="fw-bolder fs-5" style={{ color: isPicante ? '#FF1744' : '#00C853' }}>
                                      ${Number(p.total).toFixed(2)}
                                    </td>
                                    <td>{p.tipo_orden === 'domicilio' ? '🛵 Moto' : '🏪 Local'}</td>
                                    <td><StatusBadge status={p.estado} type="order"/></td>
                                    <td>
                                        <button className="btn btn-sm btn-outline-primary me-2 rounded-pill" onClick={() => {setSelectedOrderDetails(p); setShowDetailsModal(true);}}>Ver</button>
                                        {p.estado === 'Pendiente' && <button className="btn btn-sm btn-warning rounded-pill" onClick={() => handleUpdateStatus(p.id, 'En Preparacion')}>Preparar</button>}
                                        {p.estado === 'En Preparacion' && (p.tipo_orden === 'domicilio' ? <button className="btn btn-sm btn-info text-white rounded-pill" onClick={() => handleUpdateStatus(p.id, 'En Camino')}>Enviar</button> : <button className="btn btn-sm btn-success rounded-pill" onClick={() => handleUpdateStatus(p.id, 'Listo')}>Listo</button>)}
                                        {(p.estado === 'En Camino' || p.estado === 'Listo') && <button className="btn btn-sm btn-success rounded-pill" onClick={() => handleUpdateStatus(p.id, 'Completado')}>Finalizar</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* TABLA PRODUCTOS */}
            {!loading && activeTab === 'productos' && (
                <div>
                     <div className="d-flex justify-content-between mb-3">
                        <h3 className="fw-bold">Inventario</h3>
                        <button className="btn btn-primary rounded-pill" onClick={() => handleOpenProductModal()}>+ Nuevo Producto</button>
                    </div>
                    <div className="table-responsive">
                        <table className="table align-middle table-hover">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th>Precio</th>
                                    <th>Stock</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productos.map(p => (
                                    <tr key={p.id}>
                                        <td className="fw-bold">{p.nombre}</td>
                                        <td className="text-muted">{p.categoria}</td>
                                        {/* PRECIO: VERDE NEÓN EN MODO PICANTE (Para distinguir de pedidos) */}
                                        <td className="fw-bold fs-5" style={{ color: isPicante ? '#00E676' : '#212529' }}>
                                          ${Number(p.precio).toFixed(2)}
                                        </td>
                                        <td>{p.stock <= 5 ? <span className="badge bg-danger">BAJO: {p.stock}</span> : <span className="badge border text-muted">{p.stock}</span>}</td>
                                        <td>
                                            <button className="btn btn-sm btn-link text-decoration-none" onClick={() => handleOpenProductModal(p)}>Editar</button>
                                            <button className="btn btn-sm btn-link text-danger text-decoration-none" onClick={() => handleDeleteProducto(p.id)}>Ocultar</button>
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
                    <div className="d-flex justify-content-between mb-4">
                        <h3 className="fw-bold">Promociones</h3>
                        <button className="btn btn-primary rounded-pill" onClick={() => handleOpenComboModal()}>+ Nuevo Combo</button>
                    </div>
                    <div className="row g-4">
                        {combos.map(combo => (
                            <div className="col-md-6 col-lg-4" key={combo.id}>
                                <div className={`card h-100 ${combo.esta_activo ? (isPicante ? 'border-success' : 'border-primary') : 'border-danger'}`} style={{borderWidth: '1px'}}>
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h5 className="card-title fw-bold mb-0">{combo.nombre}</h5>
                                            <StatusBadge status={combo.esta_activo} type="boolean" />
                                        </div>
                                        <h2 className="display-6 fw-bold mb-3" style={{ color: isPicante ? '#FF1744' : '#212529' }}>
                                          ${Number(combo.precio).toFixed(2)}
                                        </h2>
                                        <p className="card-text text-muted">{combo.descripcion}</p>
                                        <div className="mt-3 d-flex gap-2">
                                            <button className="btn btn-outline-secondary btn-sm flex-fill" onClick={() => handleOpenComboModal(combo)}>Editar</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* REPORTES */}
            {!loading && activeTab === 'reporteGeneral' && (
                <div>
                    <h3 className="fw-bold mb-4">Resumen Financiero</h3>
                    <div className="row g-4 mb-4">
                        <div className="col-md-6 col-lg-4">
                            <div className={`p-4 rounded-3 border ${isPicante ? 'border-danger bg-dark' : 'bg-success bg-opacity-10 border-success'} text-center`}>
                                <h6 className={isPicante ? 'text-danger fw-bold' : 'text-success fw-bold'}>VENTAS TOTALES</h6>
                                {/* Dinero gigante y legible */}
                                <h2 className="fw-bolder display-5 mb-0" style={{ color: isPicante ? '#00E676' : '#198754' }}>
                                    ${reportData.reduce((acc, curr) => acc + Number(curr.total_ventas), 0).toFixed(2)}
                                </h2>
                            </div>
                        </div>
                    </div>
                    <div className={`p-3 border rounded-3 ${isPicante ? 'bg-dark border-secondary' : 'bg-light'}`}>
                         <SalesReportChart reportData={reportData} theme={theme} />
                    </div>
                </div>
            )}

             {activeTab === 'reporteProductos' && <ProductSalesReport />}

        </div>
      </div>

      {/* MODALES */}
      <ProductModal show={showProductModal} handleClose={() => setShowProductModal(false)} handleSave={handleSaveProducto} productoActual={productoActual} />
      <ComboModal show={showComboModal} handleClose={() => setShowComboModal(false)} handleSave={handleSaveCombo} comboActual={comboActual} />
      {showDetailsModal && <DetallesPedidoModal pedido={selectedOrderDetails} onClose={() => setShowDetailsModal(false)} />}

    </div>
  );
}

export default AdminPage;