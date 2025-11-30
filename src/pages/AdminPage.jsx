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

// --- PALETA DE COLORES (DONUT SHOP VS MODO PICANTE) ---
const getThemeStyles = (isPicante) => ({
  // FONDO: Negro absoluto (Picante) vs Crema Vainilla (Dona)
  bg: isPicante ? '#000000' : '#FFF8E1', 
  
  // TEXTO: Blanco (Picante) vs Café Chocolate (Dona)
  text: isPicante ? '#FFFFFF' : '#3E2723', 
  
  // TARJETAS: Gris oscuro (Picante) vs Blanco Puro (Dona)
  cardBg: isPicante ? '#121212' : '#FFFFFF', 
  
  // BORDES: Gris (Picante) vs Café con leche (Dona) -> LÍNEAS VISIBLES
  border: isPicante ? '1px solid #333333' : '1px solid #D7CCC8', 
  
  // ACENTO PRINCIPAL: Rojo Neón (Picante) vs Rosa Fresa (Dona)
  accent: isPicante ? '#FF1744' : '#FF4081', 
  
  // COLOR SECUNDARIO: Para textos suaves
  muted: isPicante ? '#888888' : '#8D6E63',
  
  // TABLA HEADER:
  tableHeaderBg: isPicante ? '#1E1E1E' : '#FBE9E7' // Un rosita muy pálido para encabezados
});

// --- BADGES (Etiquetas de estado) ---
const StatusBadge = ({ status, type }) => {
  let style = { fontSize: '0.8rem', padding: '6px 12px', fontWeight: 'bold', borderRadius: '50px' };
  let className = 'badge ';

  if (type === 'order') {
     if (status === 'Pendiente') className += 'bg-danger text-white'; // Rojo urgencia
     else if (status === 'En Preparacion') className += 'bg-warning text-dark';
     else if (status === 'En Camino') className += 'bg-info text-dark'; 
     else if (status === 'Listo') className += 'bg-success text-white';
     else if (status === 'Completado') className += 'bg-dark text-white';
  } else {
     className += status ? 'bg-success text-white' : 'bg-secondary text-white';
  }
  return <span className={className} style={style}>{status === true ? 'ACTIVO' : status === false ? 'INACTIVO' : status}</span>;
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
    <div style={{ backgroundColor: styles.bg, minHeight: '100vh', color: styles.text, transition: 'background 0.3s ease', fontFamily: "'Nunito', sans-serif" }}>
      
      <div className="container-fluid px-4 py-5">
        
        {/* HEADER */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-5">
          <div>
            <h1 className="fw-bold m-0" style={{ fontFamily: "'Fredoka One', cursive", letterSpacing: '1px', fontSize: '2.5rem', color: styles.accent }}>
              🍩 Miss Donitas Admin
            </h1>
            <p className="m-0 fw-bold" style={{color: styles.muted}}>Panel de Control General</p>
          </div>
          <div className="d-flex align-items-center gap-3">
             <span className="fw-bold px-3 py-2 rounded" style={{backgroundColor: styles.cardBg, border: styles.border, color: styles.text}}>
                {isPicante ? '🔥 MODO PICANTE' : '🍩 MODO DONA'}
             </span>
          </div>
        </div>

        {/* NAVEGACIÓN (TABS) - Botones Rosas, no azules */}
        <div className="mb-4 overflow-auto pb-2">
          <div className="d-flex gap-2">
            {[
                { id: 'pedidosEnLinea', label: '🛎️ Pedidos' },
                { id: 'productos', label: '🍩 Inventario' },
                { id: 'combos', label: '🎁 Combos' },
                { id: 'reporteGeneral', label: '📊 Finanzas' },
                { id: 'reporteProductos', label: '📈 Métricas' }
            ].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="btn fw-bold px-4 py-2 rounded-pill shadow-none"
                        style={{
                            backgroundColor: isActive ? styles.accent : styles.cardBg,
                            color: isActive ? '#FFFFFF' : styles.text,
                            border: isActive ? 'none' : styles.border,
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.label}
                    </button>
                )
            })}
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL */}
        <div className="p-4 rounded-3 shadow-sm" style={{backgroundColor: styles.cardBg, border: styles.border}}>
           {loading && <div className="text-center py-5"><div className="spinner-border" style={{color: styles.accent}} role="status"></div></div>}

           {/* --- TABLA PEDIDOS --- */}
           {!loading && activeTab === 'pedidosEnLinea' && (
               <div>
                   <h4 className="fw-bold mb-4" style={{color: styles.text}}>Pedidos Recientes</h4>
                   <div className="table-responsive">
                       <table className="table align-middle mb-0" style={{color: styles.text, borderColor: isPicante ? '#333' : '#D7CCC8'}}>
                           <thead style={{backgroundColor: styles.tableHeaderBg}}>
                               <tr>
                                   <th className="py-3 ps-3">ORDEN</th>
                                   <th>CLIENTE</th>
                                   <th>TOTAL</th>
                                   <th>ESTADO</th>
                                   <th className="text-end pe-3">ACCIONES</th>
                               </tr>
                           </thead>
                           <tbody>
                               {pedidos.map(p => (
                                   // AQUÍ ESTÁN LAS LÍNEAS VISIBLES (borderBottom)
                                   <tr key={p.id} style={{borderBottom: styles.border}}>
                                       <td className="ps-3 fw-bold" style={{color: styles.accent, fontSize: '1.1rem'}}>#{p.id}</td>
                                       <td>
                                            <div className="fw-bold">{p.nombre_cliente}</div>
                                            <small style={{color: styles.muted}}>{new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                                       </td>
                                       <td className="fw-bold fs-5">${Number(p.total).toFixed(2)}</td>
                                       <td><StatusBadge status={p.estado} type="order"/></td>
                                       <td className="text-end pe-3">
                                            {/* BOTÓN VER GRANDE Y CLARO */}
                                            <button 
                                                className="btn fw-bold rounded-pill px-4 me-2" 
                                                style={{border: `2px solid ${styles.accent}`, color: styles.accent, backgroundColor: 'transparent'}} 
                                                onClick={() => {setSelectedOrderDetails(p); setShowDetailsModal(true);}}
                                            >
                                                VER DETALLES
                                            </button>
                                            
                                            {p.estado === 'Pendiente' && (
                                                <button className="btn fw-bold text-white rounded-pill px-4" style={{backgroundColor: styles.accent}} onClick={() => handleUpdateStatus(p.id, 'En Preparacion')}>
                                                    PREPARAR
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

           {/* --- TABLA INVENTARIO --- */}
           {!loading && activeTab === 'productos' && (
               <div>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="fw-bold m-0" style={{color: styles.text}}>Catálogo de Donas</h4>
                        <button className="btn rounded-pill px-4 py-2 fw-bold text-white shadow-sm" style={{backgroundColor: styles.accent}} onClick={() => handleOpenProductModal()}>+ NUEVO PRODUCTO</button>
                    </div>
                    <div className="table-responsive">
                        <table className="table align-middle" style={{color: styles.text, borderColor: isPicante ? '#333' : '#D7CCC8'}}>
                            <thead style={{backgroundColor: styles.tableHeaderBg}}>
                                <tr>
                                    <th className="py-3 ps-3">NOMBRE</th>
                                    <th>CATEGORÍA</th>
                                    <th>PRECIO</th>
                                    <th>STOCK</th>
                                    <th className="text-end pe-3">OPCIONES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productos.map(p => (
                                    <tr key={p.id} style={{borderBottom: styles.border}}>
                                        <td className="ps-3 fw-bold">{p.nombre}</td>
                                        <td style={{color: styles.muted}}>{p.categoria}</td>
                                        <td className="fw-bold" style={{color: styles.accent}}>${Number(p.precio).toFixed(2)}</td>
                                        <td className="fw-bold">{p.stock}</td>
                                        <td className="text-end pe-3">
                                            <button className="btn btn-sm fw-bold me-2" style={{color: styles.text, border: styles.border}} onClick={() => handleOpenProductModal(p)}>EDITAR</button>
                                            <button className="btn btn-sm btn-danger opacity-75 fw-bold" onClick={() => handleDeleteProducto(p.id)}>OCULTAR</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
               </div>
           )}

           {/* --- COMBOS --- */}
           {!loading && activeTab === 'combos' && (
               <div>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="fw-bold m-0">Combos y Promos</h4>
                        <button className="btn rounded-pill px-4 fw-bold text-white shadow-sm" style={{backgroundColor: styles.accent}} onClick={() => handleOpenComboModal()}>+ NUEVO COMBO</button>
                    </div>
                    <div className="row g-4">
                        {combos.map(combo => (
                            <div className="col-md-6 col-lg-4" key={combo.id}>
                                <div className="h-100 p-4 rounded-3" style={{backgroundColor: styles.cardBg, border: styles.border}}>
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h5 className="fw-bold mb-0">{combo.nombre}</h5>
                                        <StatusBadge status={combo.esta_activo} type="boolean" />
                                    </div>
                                    <h2 className="fw-bold mb-3" style={{color: styles.accent}}>${Number(combo.precio).toFixed(2)}</h2>
                                    <p className="small mb-4" style={{color: styles.muted}}>{combo.descripcion}</p>
                                    <button className="btn w-100 fw-bold" style={{border: `1px solid ${styles.text}`, color: styles.text}} onClick={() => handleOpenComboModal(combo)}>EDITAR COMBO</button>
                                </div>
                            </div>
                        ))}
                    </div>
               </div>
           )}

           {/* --- REPORTES --- */}
           {!loading && activeTab === 'reporteGeneral' && (
               <div>
                   <h4 className="fw-bold mb-4">Reporte Financiero</h4>
                   <SalesReportChart reportData={reportData} theme={theme} />
               </div>
           )}
           
           {!loading && activeTab === 'reporteProductos' && <ProductSalesReport />}

        </div>
      </div>

      {/* MODALES PASANDO LA PROP isPicante PARA CONTROLAR COLORES */}
      <ProductModal show={showProductModal} handleClose={() => setShowProductModal(false)} handleSave={handleSaveProducto} productoActual={productoActual} isPicante={isPicante} />
      <ComboModal show={showComboModal} handleClose={() => setShowComboModal(false)} handleSave={handleSaveCombo} comboActual={comboActual} isPicante={isPicante} />
      {showDetailsModal && <DetallesPedidoModal pedido={selectedOrderDetails} onClose={() => setShowDetailsModal(false)} />}
    </div>
  );
}

export default AdminPage;