import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Package, Calendar, Clock, MapPin, ShoppingBag, ChevronRight, Hash } from 'lucide-react';
import CheckoutForm from '../components/CheckoutForm';
import MapSelector from '../components/MapSelector';
import apiClient from '../services/api';
import { useCart } from '../context/CartContext';
import ProductDetailModal from '../components/ProductDetailModal';
import { useTheme } from '../context/ThemeContext';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// --- ESTILOS ---
const styles = {
  recompensasContainer: { padding: '1rem 0' },
  cupon: {
    backgroundColor: '#2a9d8f',
    color: 'white',
    borderRadius: '15px',
    padding: '1.5rem 2rem',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
    borderLeft: '10px dashed #264653',
    position: 'relative',
    marginBottom: '1rem'
  },
  cuponIcon: { fontSize: '3.5rem', marginRight: '2rem' },
  cuponBody: { flexGrow: 1 },
  cuponTitle: { margin: '0', fontSize: '1.5rem', fontWeight: 'bold' },
  cuponDescription: { margin: '0.25rem 0 0', fontSize: '1rem', opacity: 0.9 },
  cuponCantidad: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    backgroundColor: '#e9c46a',
    color: '#264653',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
  },
};

const getTableThemeStyles = (isPicante) => ({
    text: isPicante ? '#FFFFFF' : '#3E2723', 
    cardBg: isPicante ? '#121212' : '#FFFFFF', 
    border: isPicante ? '1px solid #333333' : '1px solid #EFEBE9', 
    accent: isPicante ? '#FF1744' : '#FF4081', 
    muted: isPicante ? '#888888' : '#8D6E63',
    tableHeaderBg: isPicante ? '#1E1E1E' : '#FFF0F5', 
    hoverBg: isPicante ? '#1A1A1A' : '#FAFAFA'
});
  
// --- COMPONENTE TABLA ---
const TablaMisPedidos = ({ pedidos, onToggleDetalle, ordenExpandida }) => {
    const { theme } = useTheme();
    const isPicante = theme === 'picante';
    const styles = getTableThemeStyles(isPicante);
  
    if (!pedidos || pedidos.length === 0) {
      return (
          <div className="text-center py-5 rounded-4" style={{backgroundColor: styles.cardBg, border: styles.border}}>
              <Package size={48} className="mb-3 text-muted opacity-50"/>
              <h5 className="fw-bold" style={{color: styles.text}}>Aún no tienes pedidos</h5>
              <p className="small" style={{color: styles.muted}}>Haz tu primer pedido ahora.</p>
          </div>
      );
    }
  
    const StatusBadge = ({ status }) => {
        const st = status ? status.toLowerCase() : '';
        let className = 'badge rounded-pill fw-bold px-3 py-2 ';
        if (st === 'pendiente') className += 'bg-danger text-white';
        else if (st.includes('preparacion')) className += 'bg-warning text-dark';
        else if (st.includes('camino')) className += 'bg-info text-dark'; 
        else if (st.includes('listo')) className += 'bg-success text-white';
        else if (st === 'completado') className += 'bg-dark border border-secondary text-white';
        else className += 'bg-secondary text-white';
        return <span className={className} style={{ fontSize: '0.75rem' }}>{status}</span>;
    };
  
    return (
      <div className="rounded-4 shadow-sm overflow-hidden" style={{ backgroundColor: styles.cardBg, border: styles.border }}>
        <div className="table-responsive">
          <table className="table align-middle mb-0" style={{color: styles.text}}>
            <thead style={{backgroundColor: styles.tableHeaderBg}}>
              <tr>
                <th className="py-4 ps-4 text-uppercase small fw-bold" style={{color: styles.muted}}>ID</th>
                <th className="py-4 text-uppercase small fw-bold" style={{color: styles.muted}}>Fecha</th>
                <th className="py-4 text-uppercase small fw-bold" style={{color: styles.muted}}>Tipo</th>
                <th className="py-4 text-uppercase small fw-bold" style={{color: styles.muted}}>Estado</th>
                <th className="py-4 text-uppercase small fw-bold" style={{color: styles.muted}}>Total</th>
                <th className="py-4 pe-4 text-end text-uppercase small fw-bold" style={{color: styles.muted}}></th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <React.Fragment key={p.id}>
                  <motion.tr 
                    whileHover={{ backgroundColor: styles.hoverBg }}
                    onClick={() => onToggleDetalle(p.id)}
                    style={{ borderBottom: `1px solid ${isPicante ? '#222' : '#f0f0f0'}`, cursor: 'pointer' }}
                  >
                    <td className="ps-4 py-3"><span className="fw-bold" style={{color: styles.text}}>#{p.id}</span></td>
                    <td className="py-3">
                        <div className="d-flex flex-column">
                            <span className="fw-bold d-flex align-items-center gap-2" style={{fontSize: '0.85rem'}}>
                                 <Calendar size={14} className="text-muted"/> {new Date(p.fecha).toLocaleDateString()}
                            </span>
                            <span className="small text-muted d-flex align-items-center gap-2">
                                 <Clock size={12}/> {new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                    </td>
                    <td className="py-3">
                        {p.tipo_orden === 'domicilio' ? 
                          <span className="badge rounded-pill text-dark bg-info bg-opacity-10 border border-info border-opacity-25 px-2 py-1"><MapPin size={12} /> Moto</span> : 
                          <span className="badge rounded-pill text-dark bg-warning bg-opacity-10 border border-warning border-opacity-25 px-2 py-1"><ShoppingBag size={12} /> Local</span>
                        }
                    </td>
                    <td className="py-3"><StatusBadge status={p.estado} /></td>
                    <td className="py-3"><span className="fw-bold" style={{color: styles.accent}}>${Number(p.total).toFixed(2)}</span></td>
                    <td className="pe-4 py-3 text-end"><ChevronRight size={16} color={styles.muted} /></td>
                  </motion.tr>
                  
                  {ordenExpandida === p.id && (
                      <tr style={{backgroundColor: styles.hoverBg}}>
                          <td colSpan="6" className="p-0">
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4">
                                  <h6 className="fw-bold mb-3" style={{color: styles.accent}}>Detalle del Pedido</h6>
                                  <ul className="list-group mb-3">
                                      {p.productos?.map((prod, idx) => (
                                          <li key={idx} className="list-group-item d-flex justify-content-between align-items-center bg-transparent border-0 ps-0 py-1" style={{color: styles.text}}>
                                              <div>
                                                  <span className="fw-bold">{prod.cantidad}x</span> {prod.nombre}
                                                  {prod.opciones && <small className="text-muted d-block fst-italic ms-3">Extra: {prod.opciones}</small>}
                                              </div>
                                              <span>${(prod.cantidad * Number(prod.precio)).toFixed(2)}</span>
                                          </li>
                                      ))}
                                  </ul>
                                  {p.costo_envio > 0 && (
                                      <div className="d-flex justify-content-between border-top pt-2" style={{color: styles.text}}>
                                          <span>Costo de Envío</span>
                                          <span>${Number(p.costo_envio).toFixed(2)}</span>
                                      </div>
                                  )}
                              </motion.div>
                          </td>
                      </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
};

const notify = (type, message) => {
  switch (type) {
    case 'success': toast.success(message); break;
    case 'error': toast.error(message); break;
    default: toast(message); break;
  }
};

// ===================================================================
// ===                       CLIENTE PAGE                          ===
// ===================================================================
function ClientePage() {
  const { pedidoActual, subtotal, incrementarCantidad, decrementarCantidad, eliminarProducto, limpiarPedido, agregarProductoAPedido } = useCart();

  const [activeTab, setActiveTab] = useState('crear');
  const [ordenExpandida, setOrdenExpandida] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [tipoOrden, setTipoOrden] = useState('llevar');
  const [direccion, setDireccion] = useState(null);
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [calculandoEnvio, setCalculandoEnvio] = useState(false);
  const [misPedidos, setMisPedidos] = useState([]);
  const [misRecompensas, setMisRecompensas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [datosParaCheckout, setDatosParaCheckout] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [direccionGuardada, setDireccionGuardada] = useState(null);
  const [guardarDireccion, setGuardarDireccion] = useState(false);
  const [referencia, setReferencia] = useState('');
  const [showCartModal, setShowCartModal] = useState(false);
  const [modalView, setModalView] = useState('cart');
  const [productoSeleccionadoParaModal, setProductoSeleccionadoParaModal] = useState(null);
  const [telefono, setTelefono] = useState(''); // <--- ESTADO DEL TELÉFONO
  
  // --- NUEVOS ESTADOS PARA PAGO ---
  const [metodoPago, setMetodoPago] = useState('tarjeta'); 
  const [montoPago, setMontoPago] = useState('');
  
  // Lógica de Envío Gratis (Mayor a 150)
  const costoEnvioAplicado = (tipoOrden === 'domicilio' && subtotal >= 150) ? 0 : costoEnvio;
  
  // Total Final (Usando el envío gratis si aplica)
  const totalFinal = subtotal + (tipoOrden === 'domicilio' ? costoEnvioAplicado : 0);

  // Cálculo del cambio
  const cambio = montoPago ? (Number(montoPago) - totalFinal) : 0;
  // --- CORRECCIÓN ERROR #301: Memoizar opciones de Stripe ---
  const stripeOptions = useMemo(() => {
    if (!clientSecret) return null;
    return {
      clientSecret,
      appearance: { theme: 'stripe' }
    };
  }, [clientSecret]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (activeTab !== 'crear') return;
      setLoading(true);
      setError('');
      try {
        const [productosRes, combosRes, direccionRes] = await Promise.all([
          apiClient.get('/productos'),
          apiClient.get('/combos'),
          apiClient.get('/usuarios/mi-direccion')
        ]);
        
        const estandarizarItem = (item) => {
          const precioFinal = Number(item.precio);
          let precioOriginal = precioFinal;
          if (item.en_oferta && item.descuento_porcentaje > 0) {
            precioOriginal = precioFinal / (1 - item.descuento_porcentaje / 100);
          }
          return {
            ...item, 
            precio: precioFinal,
            precio_original: precioOriginal,
            nombre: item.nombre || item.titulo,
            categoria: item.categoria || (item.titulo ? 'Combos' : 'General') 
          };
        };
        const productosEstandarizados = productosRes.data.map(estandarizarItem);
        const combosEstandarizados = combosRes.data.map(estandarizarItem);
        setMenuItems([...productosEstandarizados, ...combosEstandarizados]);
        if (direccionRes.data) { setDireccionGuardada(direccionRes.data); }
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError('No se pudieron cargar los productos.');
      } finally { setLoading(false); }
    };
    fetchInitialData();
  }, [activeTab]);

  const categories = ['Todos', ...new Set(menuItems.map(item => item.categoria))];
  const filteredItems = selectedCategory === 'Todos' ? menuItems : menuItems.filter(item => item.categoria === selectedCategory);

  useEffect(() => {
    const fetchTabData = async () => {
      if (activeTab === 'crear') return;
      setLoading(true);
      setError('');
      try {
        if (activeTab === 'ver') {
          const res = await apiClient.get('/pedidos/mis-pedidos');
          setMisPedidos(Array.isArray(res.data) ? res.data : []);
        } else if (activeTab === 'recompensas') {
          const res = await apiClient.get('/recompensas/mis-recompensas');
          setMisRecompensas(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        setError('No se pudieron cargar los datos.');
      } finally { setLoading(false); }
    };
    fetchTabData();
  }, [activeTab]);

  useEffect(() => {
    if (tipoOrden !== 'domicilio') {
      setCostoEnvio(0);
      setDireccion(null);
    }
  }, [tipoOrden]);

  const limpiarPedidoCompleto = () => {
    limpiarPedido();
    setCostoEnvio(0);
    setDireccion(null);
    setGuardarDireccion(false);
    setReferencia('');
    setShowCartModal(false);
    setTelefono(''); // LIMPIAR TELÉFONO
  };

  // Envuelve la función con useCallback para evitar el bucle infinito del error #301
  const handleLocationSelect = useCallback(async (location) => {
    setDireccion(location);
    setCalculandoEnvio(true);
    setCostoEnvio(0);
    try {
      const res = await apiClient.post('/pedidos/calcular-envio', { lat: location.lat, lng: location.lng });
      setCostoEnvio(res.data.deliveryCost);
      notify('success', `Costo de envío: $${res.data.deliveryCost.toFixed(2)}`);
    } catch (err) {
      notify('error', err.response?.data?.msg || 'Error al calcular envío.');
      setDireccion(null);
    } finally { setCalculandoEnvio(false); }
  }, []);

  const usarDireccionGuardada = () => {
    if (direccionGuardada) {
      handleLocationSelect(direccionGuardada);
      
      // 1. Cargar Referencia
      if (direccionGuardada.referencia) { 
          setReferencia(direccionGuardada.referencia); 
      }
      
      // 2. Cargar Teléfono (ESTO ES LO QUE FALTABA)
      if (direccionGuardada.telefono) { 
          setTelefono(direccionGuardada.telefono); 
      }

      notify('success', 'Usando dirección guardada.');
    }
  };

  // ... (tu función handleLocationSelect y usarDireccionGuardada arriba siguen igual) ...

  const handleProcederAlPago = async () => {
    if (totalFinal <= 0) return;
    
    // Validaciones
    if (!telefono || telefono.length < 10) return notify('error', 'Ingresa un teléfono válido.');
    if (tipoOrden === 'domicilio' && !direccion) return notify('error', 'Selecciona tu ubicación.');
    if (calculandoEnvio) return notify('error', 'Calculando envío...');

    // Validación de Efectivo
    if (metodoPago === 'efectivo') {
       if (totalFinal > 500) return notify('error', 'Pedidos mayores a $500 solo con tarjeta.');
       if (!montoPago || Number(montoPago) < totalFinal) return notify('error', 'El monto a pagar es insuficiente.');
    }

    setPaymentLoading(true);

    try {
      // 1. Preparar datos del pedido
      const productosParaEnviar = pedidoActual.map(item => ({ 
        id: item.id, 
        cantidad: item.cantidad, 
        precio: Number(item.precio), 
        nombre: item.nombre,
        opciones: item.opcionesSeleccionadas ? item.opcionesSeleccionadas.map(op => op.nombre).join(', ') : null
      }));

      // Truco: Agregamos el cambio en la referencia para que lo vea el repartidor
      let referenciaFinal = referencia;
      if (metodoPago === 'efectivo') {
         referenciaFinal = `${referencia} (Paga con: $${montoPago}, Cambio: $${cambio.toFixed(2)})`;
      }

      const pedidoData = {
        total: totalFinal,
        productos: productosParaEnviar,
        tipo_orden: tipoOrden,
        telefono: telefono,
        costo_envio: tipoOrden === 'domicilio' ? costoEnvioAplicado : 0, 
        direccion_entrega: tipoOrden === 'domicilio' ? direccion?.description : null,
        latitude: tipoOrden === 'domicilio' ? direccion?.lat : null,
        longitude: tipoOrden === 'domicilio' ? direccion?.lng : null,
        referencia: tipoOrden === 'domicilio' ? referenciaFinal : null
      };
      
      setDatosParaCheckout(pedidoData);

      // 2. SI ES EFECTIVO: CREAR PEDIDO DIRECTAMENTE
      if (metodoPago === 'efectivo') {
          // Usamos apiClient directo para crear el pedido sin pasar por Stripe
          await apiClient.post('/pedidos', pedidoData);
          
          if (guardarDireccion && direccion) {
              apiClient.put('/usuarios/mi-direccion', { ...direccion, referencia, telefono }).catch(console.error);
              setDireccionGuardada({ ...direccion, referencia, telefono });
          }

          toast.dismiss(); // Limpiamos toasts anteriores
          notify('success', `Pedido creado. Prepara $${montoPago} para el cambio.`);
          
          limpiarPedidoCompleto();
          setMontoPago('');
          setActiveTab('ver'); // Te lleva a mis pedidos
      } 
      // 3. SI ES TARJETA: INICIAR STRIPE
      else {
          const res = await apiClient.post('/payments/create-payment-intent', { amount: totalFinal });
          setShowCartModal(false);
          setModalView('cart');
          setClientSecret(res.data.clientSecret);
          setShowPaymentModal(true);
      }

    } catch (err) {
      notify('error', 'Error al procesar el pedido.');
      console.error(err);
    } finally { 
      setPaymentLoading(false); 
    }
  };

  const handleContinue = () => {
    if (tipoOrden !== 'domicilio') { handleProcederAlPago(); } else { setModalView('address'); }
  };

  const handleSuccessfulPayment = () => {
    limpiarPedidoCompleto();
    setShowPaymentModal(false);
    notify('success', '¡Pago procesado con éxito!');
    setActiveTab('ver'); 
  };
  
  // ... resto del componente

  const handleProductClick = (item) => { setProductoSeleccionadoParaModal(item); };
  const handleToggleDetalle = (pedidoId) => { setOrdenExpandida(ordenExpandida === pedidoId ? null : pedidoId); };
  const totalItemsEnCarrito = pedidoActual.reduce((sum, item) => sum + item.cantidad, 0);
  const pageStyle = { pointerEvents: (productoSeleccionadoParaModal || showPaymentModal || showCartModal) ? 'none' : 'auto' };

  
  return (
    <div style={pageStyle}> 
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item"><button className={`nav-link ${activeTab === 'crear' ? 'active' : ''}`} onClick={() => setActiveTab('crear')}>Hacer un Pedido</button></li>
        <li className="nav-item"><button className={`nav-link ${activeTab === 'ver' ? 'active' : ''}`} onClick={() => setActiveTab('ver')}>Mis Pedidos</button></li>
        <li className="nav-item"><button className={`nav-link ${activeTab === 'recompensas' ? 'active' : ''}`} onClick={() => setActiveTab('recompensas')}>Mis Recompensas</button></li>
      </ul>

      {loading && <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* --- PESTAÑA: HACER PEDIDO --- */}
      {!loading && activeTab === 'crear' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="row">
          <div className="col-md-8">
            <h2>Elige tus Productos</h2>
            <div className="d-flex overflow-auto mb-3 pb-2 align-items-center" style={{ whiteSpace: 'nowrap', gap: '10px', scrollbarWidth: 'none' }}>
              {categories.map(cat => (
                <button key={cat} className={`btn rounded-pill px-3 ${selectedCategory === cat ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>
              ))}
            </div>
            {filteredItems.length === 0 ? (
               <p className="text-muted text-center mt-4">No hay productos en esta categoría.</p>
            ) : (
              <div className="row g-3">
                {filteredItems.map(item => (
                  <div key={item.id} className="col-6 col-md-4 col-lg-3">
                    <div className="card h-100 text-center shadow-sm border-0 hover-effect" onClick={() => handleProductClick(item)} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
                      <div className="card-body d-flex flex-column justify-content-center pt-4">
                        <h5 className="card-title">{item.nombre}</h5>
                        {item.en_oferta ? (
                          <div>
                            <span className="text-muted text-decoration-line-through me-2 small">${Number(item.precio_original).toFixed(2)}</span>
                            <span className="card-text fw-bold fs-5 text-success">${Number(item.precio).toFixed(2)}</span>
                          </div>
                        ) : (
                          <p className="card-text fw-bold fs-5">${Number(item.precio).toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="col-md-4 d-none d-md-block">
            <div className="card shadow-sm position-sticky border-0" style={{ top: '20px' }}>
              <CarritoContent
              isModal={false}
              pedidoActual={pedidoActual}
              decrementarCantidad={decrementarCantidad}
              incrementarCantidad={incrementarCantidad}
              eliminarProducto={eliminarProducto}
              tipoOrden={tipoOrden}
              setTipoOrden={setTipoOrden}
              direccionGuardada={direccionGuardada}
              usarDireccionGuardada={usarDireccionGuardada}
              handleLocationSelect={handleLocationSelect}
              direccion={direccion}
              referencia={referencia}
              setReferencia={setReferencia}
              guardarDireccion={guardarDireccion}
              setGuardarDireccion={setGuardarDireccion}
              subtotal={subtotal}
              calculandoEnvio={calculandoEnvio}
              totalFinal={totalFinal}
              handleContinue={handleContinue}
              handleProcederAlPago={handleProcederAlPago}
              paymentLoading={paymentLoading}
              limpiarPedidoCompleto={limpiarPedidoCompleto}
              telefono={telefono}
              setTelefono={setTelefono}
              // --- LO NUEVO QUE FALTABA ---
              costoEnvioReal={costoEnvio}
              costoEnvioAplicado={costoEnvioAplicado}
              metodoPago={metodoPago}
              setMetodoPago={setMetodoPago}
              montoPago={montoPago}
              setMontoPago={setMontoPago}
              cambio={cambio}
            />
            </div>
          </div>
        </motion.div>
      )}

      {/* --- PESTAÑA: MIS PEDIDOS (NUEVA TABLA) --- */}
      {!loading && activeTab === 'ver' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-2">
           <h2 className="mb-4 fw-bold" style={{ fontFamily: "'Fredoka One', cursive" }}>Mis Pedidos</h2>
           <TablaMisPedidos 
             pedidos={misPedidos} 
             onToggleDetalle={handleToggleDetalle} 
             ordenExpandida={ordenExpandida} 
           />
        </motion.div>
      )}

      {/* --- PESTAÑA: MIS RECOMPENSAS --- */}
      {!loading && activeTab === 'recompensas' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2>Mis Recompensas</h2>
          {misRecompensas?.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-3" style={{ fontSize: '4rem' }}>🍩</div>
              <h3>Aún no tienes recompensas</h3>
              <p className="text-muted">¡Sigue comprando para ganar premios!</p>
            </div>
          ) : (
            <div className="row g-4">
              {misRecompensas?.map(recompensa => (
                <div key={recompensa.id} className="col-md-6">
                  <div style={styles.cupon}>
                    <div style={styles.cuponIcon}>🎁</div>
                    <div style={styles.cuponBody}>
                      <h4 style={styles.cuponTitle}>{recompensa.nombre}</h4>
                      <p style={styles.cuponDescription}>{recompensa.descripcion}</p>
                    </div>
                    <div style={styles.cuponCantidad}>x{recompensa.cantidad}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* --- CARRITO FLOTANTE Y MODALES --- */}
      {activeTab === 'crear' && pedidoActual.length > 0 && (
        <button className="boton-carrito-flotante d-md-none" onClick={() => setShowCartModal(true)} style={{ pointerEvents: 'auto' }}>
          🛒 <span className="badge-carrito">{totalItemsEnCarrito}</span>
        </button>
      )}

      {showCartModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', pointerEvents: 'auto', zIndex: 1060 }}>
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="modal-dialog modal-dialog-scrollable modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">{modalView === 'cart' ? 'Tu Canasta' : 'Dirección'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowCartModal(false); setModalView('cart'); }}></button>
              </div>
              {modalView === 'cart' ? (
                <CarritoContent
                  isModal={true}
                  pedidoActual={pedidoActual}
                  decrementarCantidad={decrementarCantidad}
                  incrementarCantidad={incrementarCantidad}
                  eliminarProducto={eliminarProducto}
                  tipoOrden={tipoOrden}
                  setTipoOrden={setTipoOrden}
                  direccionGuardada={direccionGuardada}
                  usarDireccionGuardada={usarDireccionGuardada}
                  handleLocationSelect={handleLocationSelect}
                  direccion={direccion}
                  referencia={referencia}
                  setReferencia={setReferencia}
                  guardarDireccion={guardarDireccion}
                  setGuardarDireccion={setGuardarDireccion}
                  subtotal={subtotal}
                  calculandoEnvio={calculandoEnvio}
                  totalFinal={totalFinal}
                  handleContinue={handleContinue}
                  handleProcederAlPago={handleProcederAlPago}
                  paymentLoading={paymentLoading}
                  limpiarPedidoCompleto={limpiarPedidoCompleto}
                  telefono={telefono}
                  setTelefono={setTelefono}
                  // --- LO NUEVO QUE FALTABA ---
                  costoEnvioReal={costoEnvio}
                  costoEnvioAplicado={costoEnvioAplicado}
                  metodoPago={metodoPago}
                  setMetodoPago={setMetodoPago}
                  montoPago={montoPago}
                  setMontoPago={setMontoPago}
                  cambio={cambio}
                />
              ) : (
                <>
                  <div className="modal-body">
                    {direccionGuardada && (<button className="btn btn-outline-info w-100 mb-3" onClick={usarDireccionGuardada}>Usar mi dirección guardada</button>)}
                    <label className="form-label">Ubicación:</label>
                    <MapSelector onLocationSelect={handleLocationSelect} initialAddress={direccion} />
                    <div className="mt-3">
                      <label className="form-label">Referencia:</label>
                      <input type="text" className="form-control" value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Casa azul, portón negro..." />
                    </div>
                    <div className="form-check mt-3">
                      <input className="form-check-input" type="checkbox" id="guardarDireccionModal" checked={guardarDireccion} onChange={(e) => setGuardarDireccion(e.target.checked)} />
                      <label className="form-check-label" htmlFor="guardarDireccionModal">Guardar para futuros pedidos</label>
                    </div>
                  </div>
                  <div className="modal-footer border-0 d-flex justify-content-between">
                    <button className="btn btn-secondary" onClick={() => setModalView('cart')}>Volver</button>
                    <button className="btn btn-primary" onClick={handleProcederAlPago} disabled={!direccion || paymentLoading || calculandoEnvio}>{paymentLoading ? 'Procesando...' : 'Pagar Ahora'}</button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {productoSeleccionadoParaModal && (
        <div style={{ pointerEvents: 'auto' }}>
          <ProductDetailModal product={productoSeleccionadoParaModal} onClose={() => setProductoSeleccionadoParaModal(null)} onAddToCart={agregarProductoAPedido} />
        </div>
      )}

      {showPaymentModal && clientSecret && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', pointerEvents: 'auto', zIndex: 1070 }}>
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">Pago Seguro</h5>
                <button type="button" className="btn-close" onClick={() => setShowPaymentModal(false)}></button>
              </div>
              <div className="modal-body">
                {/* CORREGIDO: Usamos stripeOptions en lugar del objeto directo */}
{stripeOptions && (
  <Elements stripe={stripePromise} options={stripeOptions}>
    <CheckoutForm handleSuccess={handleSuccessfulPayment} total={totalFinal} datosPedido={datosParaCheckout} />
  </Elements>
)}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div> 
  );
}

export default ClientePage;