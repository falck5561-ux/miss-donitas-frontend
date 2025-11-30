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

// --- ESTILOS DINÁMICOS (Para limpiar el JSX) ---
const getThemeStyles = (isPicante) => ({
  bg: isPicante ? '#121212' : '#F4F6F9', // Fondo general más suave
  text: isPicante ? '#FFFFFF' : '#212529',
  cardBg: isPicante ? '#1E1E1E' : '#FFFFFF',
  accent: isPicante ? '#FF1744' : '#E91E63', // Rosa fuerte en modo claro
  border: isPicante ? '1px solid #333' : '1px solid #E0E0E0',
  tableHeader: isPicante ? '#2C2C2C' : '#E9ECEF',
  muted: isPicante ? '#B0B0B0' : '#6c757d'
});

// --- COMPONENTE AUXILIAR: BADGES MEJORADOS ---
const StatusBadge = ({ status, type }) => {
  let badgeClass = 'badge rounded-pill px-3 py-2 fw-bold ';
  
  const styles = {
    letterSpacing: '0.5px',
    fontSize: '0.7rem'
  };

  if (type === 'order') {
     if (status === 'Pendiente') badgeClass += 'bg-danger text-white shadow-sm';
     else if (status === 'En Preparacion') badgeClass += 'bg-warning text-dark';
     else if (status === 'En Camino') badgeClass += 'bg-info text-white';
     else if (status === 'Listo') badgeClass += 'bg-success text-white';
     else if (status === 'Completado') badgeClass += 'bg-secondary text-white';
  } else if (type === 'boolean') {
     badgeClass += status ? 'bg-success text-white' : 'bg-secondary text-white opacity-75';
  }

  return <span className={badgeClass} style={styles}>{status === true ? 'ACTIVO' : status === false ? 'INACTIVO' : status}</span>;
};

// --- COMPONENTE PRINCIPAL ---
function AdminPage() {
  const { theme } = useTheme(); 
  const isPicante = theme === 'picante';
  const styles = getThemeStyles(isPicante);

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

  // --- FETCH DATA ---
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

  // --- HANDLERS ---
  const handleOpenProductModal = (p = null) => { 
      setProductoActual(p ? { ...p, imagenes: p.imagen_url ? [p.imagen_url] : [] } : null); 
      setShowProductModal(true); 
  };
  const handleSaveProducto = async (p) => { try { const d = { ...p, imagen_url: p.imagenes?.[0] || null }; delete d.imagenes; if (d.id) await updateProduct(d.id, d); else await createProduct(d); toast.success('Guardado'); fetchData(); setShowProductModal(false); } catch { toast.error('Error'); } };
  const handleDeleteProducto = async (id) => { if(window.confirm('¿Ocultar producto?')) { await deleteProduct(id); fetchData(); }};
  
  const handleOpenComboModal = (c = null) => { setComboActual(c); setShowComboModal(true); };
  const handleSaveCombo = async (c) => { try { if(c.id) await apiClient.put(`/combos/${c.id}`, c); else await apiClient.post('/combos', c); toast.success('Guardado'); fetchData(); setShowComboModal(false); } catch { toast.error('Error'); } };
  const handleDeleteCombo = async (c) => { if(window.confirm('¿Desactivar combo?')) { await apiClient.patch(`/combos/${c.id}/desactivar`); toast.success('Desactivado'); fetchData(); }};
  
  const handleUpdateStatus = async (id, est) => { try { await apiClient.put(`/pedidos/${id}/estado`, { estado: est }); toast.success(`Estado: ${est}`); fetchData(); } catch { toast.error('Error'); } };

  return (
    <div style={{ backgroundColor: styles.bg, minHeight: '100vh', color: styles.text, transition: 'all 0.3s ease' }}>
      
      <div className="container-fluid px-4 py-5">
        
        {/* HEADER FLUIDO */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-5">
          <div>
            <h1 className="fw-bold m-0" style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '-0.5px' }}>Miss Donitas Admin</h1>
            <p className="m-0" style={{color: styles.muted}}>Panel de control general</p>
          </div>
          <div>
             <span className="badge rounded-pill px-4 py-2 text-uppercase shadow-sm" 
                   style={{backgroundColor: styles.cardBg, color: styles.text, border: `1px solid ${styles.accent}`}}>
                {isPicante ? '🔥 Modo Picante' : '🍩 Modo Dona'}
             </span>
          </div>
        </div>

        {/* MENU DE NAVEGACION (TABS MODERNAS) */}
        <div className="mb-4 overflow-auto pb-2">
          <div className="d-flex gap-2">
            {[
                { id: 'pedidosEnLinea', label: '🛎️ Pedidos', count: pedidos.filter(p => p.estado === 'Pendiente').length },
                { id: 'productos', label: '🍩 Inventario', count: 0 },
                { id: 'combos', label: '🎁 Combos', count: 0 },
                { id: 'reporteGeneral', label: '📊 Finanzas', count: 0 },
                { id: 'reporteProductos', label: '📈 Métricas', count: 0 }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="btn fw-bold rounded-pill px-4 py-2"
                    style={{
                        backgroundColor: activeTab === tab.id ? styles.accent : 'transparent',
                        color: activeTab === tab.id ? '#FFF' : styles.muted,
                        border: activeTab === tab.id ? 'none' : styles.border,
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {tab.label} {tab.count > 0 && <span className="badge bg-white text-dark ms-2 rounded-pill">{tab.count}</span>}
                </button>
            ))}
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL (Sin marco de tarjeta rígido, estilo Dashboard abierto) */}
        <div className="fade-in-up">
           
           {loading && <div className="text-center py-5"><div className="spinner-border" style={{color: styles.accent}} role="status"></div></div>}

           {/* === TABLA PEDIDOS === */}
           {!loading && activeTab === 'pedidosEnLinea' && (
               <div className="p-4 rounded-4 shadow-sm" style={{backgroundColor: styles.cardBg, border: isPicante ? 'none' : styles.border}}>
                   <div className="d-flex justify-content-between align-items-center mb-3">
                        <h4 className="fw-bold m-0">Pedidos Recientes</h4>
                   </div>
                   <div className="table-responsive">
                       <table className="table align-middle" style={{color: styles.text}}>
                           <thead style={{backgroundColor: styles.tableHeader, color: styles.muted, textTransform: 'uppercase', fontSize: '0.8rem'}}>
                               <tr>
                                   <th className="py-3 ps-3">Orden</th>
                                   <th>Cliente</th>
                                   <th>Total</th>
                                   <th>Tipo</th>
                                   <th>Estado</th>
                                   <th className="text-end pe-3">Acciones</th>
                               </tr>
                           </thead>
                           <tbody style={{borderTop: 'none'}}>
                               {pedidos.map(p => (
                                   <tr key={p.id} style={{borderBottom: styles.border}}>
                                       <td className="ps-3 fw-bold" style={{color: styles.accent}}>#{p.id}</td>
                                       <td>
                                            <div className="fw-bold">{p.nombre_cliente}</div>
                                            <small style={{color: styles.muted}}>{new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                                       </td>
                                       <td className="fw-bold fs-5">${Number(p.total).toFixed(2)}</td>
                                       <td>{p.tipo_orden === 'domicilio' ? '🛵 Moto' : '🏪 Local'}</td>
                                       <td><StatusBadge status={p.estado} type="order"/></td>
                                       <td className="text-end pe-3">
                                            <button className="btn btn-sm btn-light rounded-pill border me-2" onClick={() => {setSelectedOrderDetails(p); setShowDetailsModal(true);}}>Ver</button>
                                            {p.estado === 'Pendiente' && <button className="btn btn-sm fw-bold text-white rounded-pill" style={{backgroundColor: styles.accent}} onClick={() => handleUpdateStatus(p.id, 'En Preparacion')}>Preparar</button>}
                                            {p.estado === 'En Preparacion' && <button className="btn btn-sm btn-success fw-bold text-white rounded-pill" onClick={() => handleUpdateStatus(p.id, p.tipo_orden === 'domicilio' ? 'En Camino' : 'Listo')}>Avanzar</button>}
                                            {(p.estado === 'En Camino' || p.estado === 'Listo') && <button className="btn btn-sm btn-outline-success fw-bold rounded-pill" onClick={() => handleUpdateStatus(p.id, 'Completado')}>Finalizar</button>}
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
               </div>
           )}

           {/* === TABLA PRODUCTOS === */}
           {!loading && activeTab === 'productos' && (
               <div className="p-4 rounded-4 shadow-sm" style={{backgroundColor: styles.cardBg, border: isPicante ? 'none' : styles.border}}>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="fw-bold m-0">Catálogo</h4>
                        <button className="btn rounded-pill px-4 fw-bold text-white shadow" style={{backgroundColor: styles.accent}} onClick={() => handleOpenProductModal()}>+ Nuevo</button>
                    </div>
                    <div className="table-responsive">
                        <table className="table align-middle" style={{color: styles.text}}>
                            <thead style={{backgroundColor: styles.tableHeader, color: styles.muted, textTransform: 'uppercase', fontSize: '0.8rem'}}>
                                <tr>
                                    <th className="py-3 ps-3">Nombre</th>
                                    <th>Categoría</th>
                                    <th>Precio</th>
                                    <th>Stock</th>
                                    <th className="text-end pe-3">Opciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productos.map(p => (
                                    <tr key={p.id} style={{borderBottom: styles.border}}>
                                        <td className="ps-3 fw-bold">{p.nombre} {p.en_oferta && <span className="badge bg-success ms-1" style={{fontSize: '0.6rem'}}>OFERTA</span>}</td>
                                        <td style={{color: styles.muted}}>{p.categoria}</td>
                                        <td className="fw-bold" style={{color: styles.accent}}>${Number(p.precio).toFixed(2)}</td>
                                        <td>{p.stock <= 5 ? <span className="text-danger fw-bold">Bajo ({p.stock})</span> : <span>{p.stock}</span>}</td>
                                        <td className="text-end pe-3">
                                            <button className="btn btn-sm btn-link text-decoration-none" style={{color: styles.text}} onClick={() => handleOpenProductModal(p)}>Editar</button>
                                            <button className="btn btn-sm btn-link text-danger text-decoration-none" onClick={() => handleDeleteProducto(p.id)}>Ocultar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
               </div>
           )}

           {/* === COMBOS (GRID) === */}
           {!loading && activeTab === 'combos' && (
               <div>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="fw-bold m-0">Combos Activos</h4>
                        <button className="btn rounded-pill px-4 fw-bold text-white shadow" style={{backgroundColor: styles.accent}} onClick={() => handleOpenComboModal()}>+ Crear Combo</button>
                    </div>
                    <div className="row g-4">
                        {combos.map(combo => (
                            <div className="col-md-6 col-lg-4" key={combo.id}>
                                <div className="h-100 p-4 rounded-4 shadow-sm position-relative" 
                                     style={{backgroundColor: styles.cardBg, border: combo.esta_activo ? `1px solid ${styles.accent}` : styles.border, opacity: combo.esta_activo ? 1 : 0.7}}>
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h5 className="fw-bold mb-0">{combo.nombre}</h5>
                                        <StatusBadge status={combo.esta_activo} type="boolean" />
                                    </div>
                                    <h2 className="fw-bold mb-3" style={{color: styles.accent}}>${Number(combo.precio).toFixed(2)}</h2>
                                    <p className="small mb-4" style={{color: styles.muted, minHeight: '40px'}}>{combo.descripcion}</p>
                                    <div className="d-flex gap-2">
                                        <button className="btn btn-sm btn-outline-secondary flex-fill rounded-pill" onClick={() => handleOpenComboModal(combo)}>Editar</button>
                                        {combo.esta_activo && <button className="btn btn-sm btn-outline-danger flex-fill rounded-pill" onClick={() => handleDeleteCombo(combo)}>Desactivar</button>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
               </div>
           )}

           {/* === REPORTES === */}
           {!loading && activeTab === 'reporteGeneral' && (
               <div className="p-4 rounded-4 shadow-sm" style={{backgroundColor: styles.cardBg, border: isPicante ? 'none' : styles.border}}>
                   <h4 className="fw-bold mb-4">Reporte Financiero</h4>
                   <div className="mb-4">
                        <h1 className="display-4 fw-bold" style={{color: styles.accent}}>
                            ${reportData.reduce((acc, curr) => acc + Number(curr.total_ventas), 0).toFixed(2)}
                        </h1>
                        <span style={{color: styles.muted}}>Ventas totales acumuladas</span>
                   </div>
                   <div style={{height: '400px'}}>
                        <SalesReportChart reportData={reportData} theme={theme} />
                   </div>
               </div>
           )}
           
           {!loading && activeTab === 'reporteProductos' && <ProductSalesReport />}

        </div>
      </div>

      {/* MODALES - NOTA: Pasamos isPicante para arreglar el diseño interno en el siguiente paso */}
      <ProductModal 
        show={showProductModal} 
        handleClose={() => setShowProductModal(false)} 
        handleSave={handleSaveProducto} 
        productoActual={productoActual} 
        isPicante={isPicante} 
      />
      
      <ComboModal 
        show={showComboModal} 
        handleClose={() => setShowComboModal(false)} 
        handleSave={handleSaveCombo} 
        comboActual={comboActual} 
        isPicante={isPicante}
      />
      
      {showDetailsModal && <DetallesPedidoModal pedido={selectedOrderDetails} onClose={() => setShowDetailsModal(false)} />}

    </div>
  );
}

export default AdminPage;