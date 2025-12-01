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

// --- ESTILOS REFINADOS ---
const getThemeStyles = (isPicante) => ({
  // Fondo general
  bg: isPicante ? '#000000' : '#FFF8E1', 
  
  // Texto
  text: isPicante ? '#E0E0E0' : '#3E2723', 
  textMuted: isPicante ? '#9E9E9E' : '#8D6E63',

  // Contenedores (Cards)
  cardBg: isPicante ? '#121212' : '#FFFFFF', 
  
  // Bordes (Líneas sutiles)
  border: isPicante ? '1px solid #2C2C2C' : '1px solid #EFEBE9',
  
  // Encabezado de la tabla (Para que no se vea vacía)
  tableHeaderBg: isPicante ? '#1A1A1A' : '#FBE9E7',
  
  // Acentos
  accent: isPicante ? '#FF1744' : '#FF4081', 
});

// --- BADGES ---
const StatusBadge = ({ status, type }) => {
  const style = { 
    fontSize: '0.75rem', 
    padding: '8px 12px', 
    fontWeight: '800', 
    borderRadius: '12px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  };
  
  let className = 'badge ';
  if (type === 'order') {
     if (status === 'Pendiente') className += 'bg-danger text-white shadow-sm';
     else if (status === 'En Preparacion') className += 'bg-warning text-dark';
     else if (status === 'En Camino') className += 'bg-info text-dark'; 
     else if (status === 'Listo') className += 'bg-success text-white';
     else if (status === 'Completado') className += 'bg-dark border border-secondary text-white';
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
  
  // Actualizar estado y recargar datos
  const handleUpdateStatus = async (id, est) => { 
      try { 
          await apiClient.put(`/pedidos/${id}/estado`, { estado: est }); 
          toast.success(`Pedido actualizado a: ${est}`); 
          fetchData(); // Recarga la lista para ver el cambio
      } catch { 
          toast.error('Error al actualizar estado'); 
      } 
  };

  // --- FUNCIÓN CORREGIDA: LOGICA DEL BOTÓN DE ACCIÓN ---
  const renderActionButtons = (p) => {
      // Normalizamos el string por si viene con espacios
      const status = p.estado ? p.estado.trim() : '';
      const isDelivery = p.tipo_orden === 'domicilio';

      // 1. Si está PENDIENTE -> Pasar a EN PREPARACION
      if (status === 'Pendiente') {
          return (
            <button className="btn fw-bold text-white rounded-pill px-3 shadow-sm" 
                    style={{backgroundColor: styles.accent}} 
                    onClick={() => handleUpdateStatus(p.id, 'En Preparacion')}>
                👨‍🍳 Preparar
            </button>
          );
      }

      // 2. Si está EN PREPARACION -> Pasar a LISTO (Local) o EN CAMINO (Domicilio)
      if (status === 'En Preparacion') {
          if (isDelivery) {
              return (
                <button className="btn btn-info text-dark fw-bold rounded-pill px-3 shadow-sm" 
                        onClick={() => handleUpdateStatus(p.id, 'En Camino')}>
                    🛵 Enviar Repartidor
                </button>
              );
          } else {
              return (
                <button className="btn btn-success text-white fw-bold rounded-pill px-3 shadow-sm" 
                        onClick={() => handleUpdateStatus(p.id, 'Listo')}>
                    🥡 Marcar Listo
                </button>
              );
          }
      }

      // 3. Si está LISTO o EN CAMINO -> FINALIZAR
      if (status === 'Listo' || status === 'En Camino') {
          return (
            <button className="btn btn-dark text-white fw-bold rounded-pill px-3 shadow-sm border border-secondary" 
                    onClick={() => handleUpdateStatus(p.id, 'Completado')}>
                ✅ Finalizar Orden
            </button>
          );
      }

      // 4. Si ya está completado
      if (status === 'Completado') {
          return <span className="text-muted small fw-bold">- Completado -</span>;
      }

      return null;
  };

  return (
    <div style={{ backgroundColor: styles.bg, minHeight: '100vh', color: styles.text, fontFamily: "'Nunito', sans-serif" }}>
      
      <div className="container-fluid px-4 py-5">
        
        {/* HEADER */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-5">
          <div>
            <h1 className="fw-bold m-0" style={{ fontFamily: "'Fredoka One', cursive", letterSpacing: '1px', fontSize: '2.5rem', color: styles.accent }}>
              🍩 Miss Donitas Admin
            </h1>
          </div>
          <div className="d-flex align-items-center gap-3">
             <span className="fw-bold px-3 py-2 rounded" style={{backgroundColor: styles.cardBg, border: styles.border, color: styles.text}}>
                {isPicante ? '🔥 MODO PICANTE' : '🍩 MODO DONA'}
             </span>
          </div>
        </div>

        {/* TABS */}
        <div className="mb-4 overflow-auto pb-2">
          <div className="d-flex gap-2">
            {[
                { id: 'pedidosEnLinea', label: '🛎️ PEDIDOS' },
                { id: 'productos', label: '🍩 INVENTARIO' },
                { id: 'combos', label: '🎁 COMBOS' },
                { id: 'reporteGeneral', label: '📊 FINANZAS' },
                { id: 'reporteProductos', label: '📈 MÉTRICAS' }
            ].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="btn fw-bold px-4 py-2 rounded-pill shadow-none"
                        style={{
                            backgroundColor: isActive ? styles.accent : 'transparent',
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
        <div className="p-0 rounded-4 shadow-sm overflow-hidden" style={{backgroundColor: styles.cardBg, border: styles.border}}>
           {loading && <div className="text-center py-5"><div className="spinner-border" style={{color: styles.accent}} role="status"></div></div>}

           {/* --- TABLA PEDIDOS (CORREGIDA) --- */}
           {!loading && activeTab === 'pedidosEnLinea' && (
               <div>
                   {/* Header de la Tabla */}
                   <div className="p-4 border-bottom" style={{borderColor: isPicante ? '#333' : '#EFEBE9'}}>
                       <h4 className="fw-bold m-0" style={{color: styles.text}}>Últimos Pedidos</h4>
                       <p className="m-0 small" style={{color: styles.textMuted}}>Gestiona los pedidos entrantes en tiempo real</p>
                   </div>
                   
                   <div className="table-responsive">
                       <table className="table align-middle mb-0" style={{color: styles.text}}>
                           <thead style={{backgroundColor: styles.tableHeaderBg}}>
                               <tr style={{borderBottom: styles.border}}>
                                   <th className="py-4 ps-4 text-uppercase small" style={{color: styles.textMuted}}># Orden</th>
                                   <th className="py-4 text-uppercase small" style={{color: styles.textMuted}}>Cliente</th>
                                   <th className="py-4 text-uppercase small" style={{color: styles.textMuted}}>Total</th>
                                   <th className="py-4 text-uppercase small" style={{color: styles.textMuted}}>Estado</th>
                                   {/* Centramos la columna acciones */}
                                   <th className="py-4 pe-4 text-center text-uppercase small" style={{color: styles.textMuted, width: '250px'}}>Acciones</th>
                               </tr>
                           </thead>
                           <tbody>
                               {pedidos.map(p => (
                                   <tr key={p.id} style={{borderBottom: `1px solid ${isPicante ? '#222' : '#f0f0f0'}`}}>
                                           
                                           {/* ID Destacado */}
                                           <td className="ps-4 py-4">
                                                <span className="fw-bold fs-5" style={{color: styles.accent}}>#{p.id}</span>
                                           </td>
                                           
                                           {/* Cliente con Info Extra */}
                                           <td className="py-4">
                                                <div className="fw-bold fs-6">{p.nombre_cliente}</div>
                                                <div className="d-flex align-items-center gap-2 mt-1">
                                                    <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-2">
                                                        ⏰ {new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                    {p.tipo_orden === 'domicilio' && <span className="small text-info">🛵 Moto</span>}
                                                </div>
                                           </td>
                                           
                                           {/* Total Grande */}
                                           <td className="py-4">
                                                <span className="fw-bolder fs-5" style={{letterSpacing: '-0.5px'}}>${Number(p.total).toFixed(2)}</span>
                                           </td>
                                           
                                           {/* Badge Estado */}
                                           <td className="py-4">
                                                <StatusBadge status={p.estado} type="order"/>
                                           </td>
                                           
                                           {/* Acciones CON LOGICA DINAMICA */}
                                           <td className="pe-4 py-4 text-center">
                                                <div className="d-flex justify-content-center align-items-center gap-2">
                                                    <button 
                                                        className="btn btn-sm fw-bold rounded-pill px-3" 
                                                        style={{border: `1px solid ${styles.text}`, color: styles.text, backgroundColor: 'transparent'}} 
                                                        onClick={() => {setSelectedOrderDetails(p); setShowDetailsModal(true);}}
                                                    >
                                                        Ver
                                                    </button>
                                                    
                                                    {/* LLAMADA A LA FUNCIÓN QUE CORRIGE EL ERROR */}
                                                    {renderActionButtons(p)}
                                                </div>
                                           </td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
                   {pedidos.length === 0 && (
                       <div className="text-center py-5">
                           <h5 style={{color: styles.textMuted}}>No hay pedidos pendientes</h5>
                       </div>
                   )}
               </div>
           )}

           {/* --- TABLA INVENTARIO --- */}
           {!loading && activeTab === 'productos' && (
               <div>
                    <div className="d-flex justify-content-between align-items-center p-4 border-bottom" style={{borderColor: isPicante ? '#333' : '#EFEBE9'}}>
                        <h4 className="fw-bold m-0" style={{color: styles.text}}>Inventario de Donas</h4>
                        <button className="btn rounded-pill px-4 py-2 fw-bold text-white shadow-sm" style={{backgroundColor: styles.accent}} onClick={() => handleOpenProductModal()}>+ Nuevo Producto</button>
                    </div>
                    <div className="table-responsive">
                        <table className="table align-middle mb-0" style={{color: styles.text}}>
                            <thead style={{backgroundColor: styles.tableHeaderBg}}>
                                <tr style={{borderBottom: styles.border}}>
                                    <th className="py-3 ps-4 text-uppercase small" style={{color: styles.textMuted}}>Producto</th>
                                    <th className="py-3 text-uppercase small" style={{color: styles.textMuted}}>Categoría</th>
                                    <th className="py-3 text-uppercase small" style={{color: styles.textMuted}}>Precio</th>
                                    <th className="py-3 text-uppercase small" style={{color: styles.textMuted}}>Stock</th>
                                    <th className="py-3 pe-4 text-center text-uppercase small" style={{color: styles.textMuted}}>Gestión</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productos.map(p => (
                                    <tr key={p.id} style={{borderBottom: `1px solid ${isPicante ? '#222' : '#f0f0f0'}`}}>
                                            <td className="ps-4 py-3 fw-bold fs-6">{p.nombre}</td>
                                            <td className="py-3" style={{color: styles.textMuted}}>{p.categoria}</td>
                                            <td className="py-3 fw-bold" style={{color: styles.accent}}>${Number(p.precio).toFixed(2)}</td>
                                            <td className="py-3 fw-bold">{p.stock}</td>
                                            <td className="pe-4 py-3 text-center">
                                                <button className="btn btn-sm fw-bold me-2 px-3 rounded-pill" style={{color: styles.text, border: styles.border}} onClick={() => handleOpenProductModal(p)}>Editar</button>
                                                <button className="btn btn-sm btn-danger opacity-75 fw-bold px-3 rounded-pill" onClick={() => handleDeleteProducto(p.id)}>Ocultar</button>
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
               <div className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="fw-bold m-0">Combos Activos</h4>
                        <button className="btn rounded-pill px-4 fw-bold text-white shadow-sm" style={{backgroundColor: styles.accent}} onClick={() => handleOpenComboModal()}>+ Nuevo Combo</button>
                    </div>
                    <div className="row g-4">
                        {combos.map(combo => (
                            <div className="col-md-6 col-lg-4" key={combo.id}>
                                <div className="h-100 p-4 rounded-4" style={{backgroundColor: isPicante ? '#1A1A1A' : '#F9F9F9', border: styles.border}}>
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h5 className="fw-bold mb-0">{combo.nombre}</h5>
                                        <StatusBadge status={combo.esta_activo} type="boolean" />
                                    </div>
                                    <h2 className="fw-bold mb-3" style={{color: styles.accent}}>${Number(combo.precio).toFixed(2)}</h2>
                                    <p className="small mb-4" style={{color: styles.textMuted, minHeight: '40px'}}>{combo.descripcion || 'Sin descripción'}</p>
                                    <button className="btn w-100 fw-bold rounded-pill" style={{border: `1px solid ${styles.text}`, color: styles.text}} onClick={() => handleOpenComboModal(combo)}>Editar</button>
                                </div>
                            </div>
                        ))}
                    </div>
               </div>
           )}

           {/* --- REPORTES --- */}
           {!loading && activeTab === 'reporteGeneral' && (
               <div className="p-4">
                   <h4 className="fw-bold mb-4">Reporte Financiero</h4>
                   <SalesReportChart reportData={reportData} theme={theme} />
               </div>
           )}
           
           {!loading && activeTab === 'reporteProductos' && <ProductSalesReport />}

        </div>
      </div>

      <ProductModal show={showProductModal} handleClose={() => setShowProductModal(false)} handleSave={handleSaveProducto} productoActual={productoActual} isPicante={isPicante} />
      <ComboModal show={showComboModal} handleClose={() => setShowComboModal(false)} handleSave={handleSaveCombo} comboActual={comboActual} isPicante={isPicante} />
      {showDetailsModal && <DetallesPedidoModal pedido={selectedOrderDetails} onClose={() => setShowDetailsModal(false)} isPicante={isPicante} />}
    </div>
  );
}

export default AdminPage;