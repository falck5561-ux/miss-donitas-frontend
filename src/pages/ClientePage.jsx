import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';
import MapSelector from '../components/MapSelector';
import apiClient from '../services/api';
import { useCart } from '../context/CartContext';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "pk_test_51SFnF0ROWvZ0m785J38J20subms9zeVw92xxsdct2OVzHbIXF8Kueajcp4jxJblwBhozD1xDljC2UG1qDNOGOxTX00UiDpoLCI");

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

const notify = (type, message) => {
  switch (type) {
    case 'success':
      toast.success(message);
      break;
    case 'error':
      toast.error(message);
      break;
    default:
      toast(message);
      break;
  }
};

function ClientePage() {
  const {
    pedidoActual,
    subtotal,
    incrementarCantidad,
    decrementarCantidad,
    eliminarProducto,
    limpiarPedido,
    agregarProductoAPedido
  } = useCart();

  const [activeTab, setActiveTab] = useState('crear');
  const [ordenExpandida, setOrdenExpandida] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
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

  const totalFinal = subtotal + costoEnvio;

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
          };
        };

        const productosEstandarizados = productosRes.data.map(estandarizarItem);
        const combosEstandarizados = combosRes.data.map(estandarizarItem);

        setMenuItems([...productosEstandarizados, ...combosEstandarizados]);

        if (direccionRes.data) {
          setDireccionGuardada(direccionRes.data);
        }

      } catch (err) {
        console.error("Error cargando datos iniciales:", err);
        setError('No se pudieron cargar los productos en este momento.');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [activeTab]);

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
        setError('No se pudieron cargar los datos de la pestaña.');
        console.error("Error en fetchTabData:", err);
      } finally {
        setLoading(false);
      }
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
  };

  const handleLocationSelect = async (location) => {
    setDireccion(location);
    setCalculandoEnvio(true);
    setCostoEnvio(0);
    try {
      const res = await apiClient.post('/pedidos/calcular-envio', { lat: location.lat, lng: location.lng });
      setCostoEnvio(res.data.deliveryCost);
      notify('success', `Costo de envío: $${res.data.deliveryCost.toFixed(2)}`);
    } catch (err) {
      notify('error', err.response?.data?.msg || 'No se pudo calcular el costo de envío.');
      setDireccion(null);
    } finally {
      setCalculandoEnvio(false);
    }
  };

  const usarDireccionGuardada = () => {
    if (direccionGuardada) {
      handleLocationSelect(direccionGuardada);
      if (direccionGuardada.referencia) {
        setReferencia(direccionGuardada.referencia);
      }
      notify('success', 'Usando dirección guardada.');
    }
  };

  const handleProcederAlPago = async () => {
    if (totalFinal <= 0) return;
    if (tipoOrden === 'domicilio' && !direccion) { return notify('error', 'Por favor, selecciona o escribe tu ubicación.'); }
    if (calculandoEnvio) { return notify('error', 'Espera a que termine el cálculo del envío.'); }
    setPaymentLoading(true);
    try {
      const productosParaEnviar = pedidoActual.map(({ id, cantidad, precio, nombre }) => ({ id, cantidad, precio: Number(precio), nombre }));
      const pedidoData = {
        total: totalFinal,
        productos: productosParaEnviar,
        tipo_orden: tipoOrden,
        costo_envio: costoEnvio,
        direccion_entrega: tipoOrden === 'domicilio' ? direccion?.description : null,
        latitude: tipoOrden === 'domicilio' ? direccion?.lat : null,
        longitude: tipoOrden === 'domicilio' ? direccion?.lng : null,
        referencia: tipoOrden === 'domicilio' ? referencia : null
      };
      setDatosParaCheckout(pedidoData);

      const res = await apiClient.post('/payments/create-payment-intent', { amount: totalFinal });

      setShowCartModal(false);
      setModalView('cart');
      setClientSecret(res.data.clientSecret);
      setShowPaymentModal(true);
    } catch (err) {
      notify('error', 'No se pudo iniciar el proceso de pago.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleContinue = () => {
    if (tipoOrden !== 'domicilio') {
      handleProcederAlPago();
    } else {
      setModalView('address');
    }
  };

  const handleSuccessfulPayment = async () => {
    if (guardarDireccion && direccion) {
      try {
        const datosParaGuardar = { ...direccion, referencia };
        await apiClient.put('/usuarios/mi-direccion', datosParaGuardar);
        notify('success', 'Dirección y referencia guardadas.');
        setDireccionGuardada(datosParaGuardar);
      } catch (err) {
        notify('error', 'No se pudo guardar la dirección y referencia.');
      }
    }
    notify('success', '¡Pedido realizado y pagado con éxito!');
    limpiarPedidoCompleto();
    setShowPaymentModal(false);
    setClientSecret('');
    setActiveTab('ver');
  };

  const getStatusBadge = (estado) => { switch (estado) { case 'Pendiente': return 'bg-warning text-dark'; case 'En Preparacion': return 'bg-info text-dark'; case 'Listo para Recoger': return 'bg-success text-white'; case 'Completado': return 'bg-secondary text-white'; case 'En Camino': return 'bg-primary text-white'; default: return 'bg-light text-dark'; } };
  const handleToggleDetalle = (pedidoId) => { setOrdenExpandida(ordenExpandida === pedidoId ? null : pedidoId); };
  const totalItemsEnCarrito = pedidoActual.reduce((sum, item) => sum + item.cantidad, 0);

  // --- COMPONENTE INTERNO REUTILIZABLE PARA MOSTRAR EL CONTENIDO DEL CARRITO ---
  const CarritoContent = ({ isModal }) => (
    <>
      <div className={isModal ? "modal-body" : "card-body"}>
        {!isModal && (
          <>
            <h3 className="card-title text-center">Mi Pedido</h3>
            <hr />
          </>
        )}
        <ul className="list-group list-group-flush">
          {pedidoActual.length === 0 && <li className="list-group-item text-center text-muted">Tu carrito está vacío</li>}
          {pedidoActual.map((item) => (
            <li key={item.id} className="list-group-item d-flex align-items-center justify-content-between p-1">
              <span className="me-auto">{item.nombre}</span>
              <div className="d-flex align-items-center">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => decrementarCantidad(item.id)}>-</button>
                <span className="mx-2">{item.cantidad}</span>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => incrementarCantidad(item.id)}>+</button>
              </div>
              <span className="mx-3" style={{ minWidth: '60px', textAlign: 'right' }}>${(item.cantidad * Number(item.precio)).toFixed(2)}</span>
              <button className="btn btn-outline-danger btn-sm" onClick={() => eliminarProducto(item.id)}>&times;</button>
            </li>
          ))}
        </ul>
        <hr />
        <h5>Elige una opción:</h5>
        <div className="form-check"><input className="form-check-input" type="radio" name={isModal ? "tipoOrdenModal" : "tipoOrden"} id={isModal ? "llevarModal" : "llevar"} value="llevar" checked={tipoOrden === 'llevar'} onChange={(e) => setTipoOrden(e.target.value)} /><label className="form-check-label" htmlFor={isModal ? "llevarModal" : "llevar"}>Para Recoger</label></div>
        <div className="form-check"><input className="form-check-input" type="radio" name={isModal ? "tipoOrdenModal" : "tipoOrden"} id={isModal ? "localModal" : "local"} value="local" checked={tipoOrden === 'local'} onChange={(e) => setTipoOrden(e.target.value)} /><label className="form-check-label" htmlFor={isModal ? "localModal" : "local"}>Para Comer Aquí</label></div>
        <div className="form-check"><input className="form-check-input" type="radio" name={isModal ? "tipoOrdenModal" : "tipoOrden"} id={isModal ? "domicilioModal" : "domicilio"} value="domicilio" checked={tipoOrden === 'domicilio'} onChange={(e) => setTipoOrden(e.target.value)} /><label className="form-check-label" htmlFor={isModal ? "domicilioModal" : "domicilio"}>Entrega a Domicilio</label></div>

        {/* ============================================= */}
        {/* === INICIO DE LA CORRECCIÓN PARA ESCRITORIO === */}
        {/* ============================================= */}

        {/* Este bloque SÓLO se mostrará si es "domicilio" Y NO estamos en el modal de móvil */}
        {tipoOrden === 'domicilio' && !isModal && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3">
            <hr />
            {direccionGuardada && (<button className="btn btn-outline-info w-100 mb-3" onClick={usarDireccionGuardada}>Usar mi dirección guardada</button>)}

            <label className="form-label">Busca tu dirección:</label>
            <MapSelector onLocationSelect={handleLocationSelect} initialAddress={direccion} />

            <div className="mt-3">
              <label htmlFor="referenciaDesktop" className="form-label">Referencia:</label>
              <input type="text" id="referenciaDesktop" className="form-control" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
            </div>

            <div className="form-check mt-3">
              <input className="form-check-input" type="checkbox" id="guardarDireccionDesktop" checked={guardarDireccion} onChange={(e) => setGuardarDireccion(e.target.checked)} />
              <label className="form-check-label" htmlFor="guardarDireccionDesktop">Guardar dirección</label>
            </div>
          </motion.div>
        )}

        {/* =========================================== */}
        {/* === FIN DE LA CORRECCIÓN PARA ESCRITORIO === */}
        {/* =========================================== */}

        <hr />
        <p className="d-flex justify-content-between">Subtotal: <span>${subtotal.toFixed(2)}</span></p>
        {tipoOrden === 'domicilio' && (<motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="d-flex justify-content-between">Costo de Envío: {calculandoEnvio ? <span className="spinner-border spinner-border-sm"></span> : <span>${costoEnvio.toFixed(2)}</span>}</motion.p>)}
        <h4>Total: ${totalFinal.toFixed(2)}</h4>
      </div>

      {/* ========================================== */}
      {/* === INICIO DE LA CORRECCIÓN DEL BOTÓN === */}
      {/* ========================================== */}
      <div className={isModal ? "modal-footer d-grid gap-2" : "card-footer d-grid gap-2 mt-auto"}>

        {isModal ? (
          // Lógica de botón para MODAL (móvil) - Sigue como estaba
          <button
            className="btn btn-primary"
            onClick={handleContinue}
            disabled={pedidoActual.length === 0 || paymentLoading}
          >
            {tipoOrden === 'domicilio' ? 'Siguiente' : 'Proceder al Pago'}
          </button>
        ) : (
          // Lógica de botón para DESKTOP - Va directo al pago
          <button
            className="btn btn-primary"
            onClick={handleProcederAlPago}
            disabled={pedidoActual.length === 0 || paymentLoading || (tipoOrden === 'domicilio' && !direccion) || calculandoEnvio}
          >
            {paymentLoading ? 'Iniciando...' : 'Proceder al Pago'}
          </button>
        )}

        <button className="btn btn-outline-danger" onClick={limpiarPedidoCompleto}>Vaciar Carrito</button>
      </div>
      {/* ======================================== */}
      {/* === FIN DE LA CORRECCIÓN DEL BOTÓN === */}
      {/* ======================================== */}
    </>
  );

  return (
    <div>
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item"><button className={`nav-link ${activeTab === 'crear' ? 'active' : ''}`} onClick={() => setActiveTab('crear')}>Hacer un Pedido</button></li>
        <li className="nav-item"><button className={`nav-link ${activeTab === 'ver' ? 'active' : ''}`} onClick={() => setActiveTab('ver')}>Mis Pedidos</button></li>
        <li className="nav-item"><button className={`nav-link ${activeTab === 'recompensas' ? 'active' : ''}`} onClick={() => setActiveTab('recompensas')}>Mis Recompensas</button></li>
      </ul>

      {loading && <div className="text-center"><div className="spinner-border" role="status"></div></div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && activeTab === 'crear' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="row">
          <div className="col-md-8">
            <h2>Elige tus Productos</h2>
            <div className="row g-3">
              {menuItems?.map(item => (
                <div key={item.id} className="col-6 col-md-4 col-lg-3">
                  <div className="card h-100 text-center shadow-sm" onClick={() => agregarProductoAPedido(item)} style={{ cursor: 'pointer' }}>
                    <div className="card-body d-flex flex-column justify-content-center pt-4">
                      <h5 className="card-title">{item.nombre}</h5>
                      {item.en_oferta ? (
                        <div>
                          <span className="text-muted text-decoration-line-through me-2">${Number(item.precio_original).toFixed(2)}</span>
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
          </div>

          <div className="col-md-4 d-none d-md-block">
            <div className="card shadow-sm position-sticky" style={{ top: '20px' }}>
              <CarritoContent isModal={false} />
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'crear' && pedidoActual.length > 0 && (
        <button className="boton-carrito-flotante d-md-none" onClick={() => setShowCartModal(true)}>
          🛒 <span className="badge-carrito">{totalItemsEnCarrito}</span>
        </button>
      )}

      {showCartModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="modal-dialog modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{modalView === 'cart' ? 'Mi Pedido' : 'Dirección de Entrega'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowCartModal(false); setModalView('cart'); }}></button>
              </div>
              {modalView === 'cart' ? (
                <CarritoContent isModal={true} />
              ) : (
                <>
                  <div className="modal-body">
                    {direccionGuardada && (<button className="btn btn-outline-info w-100 mb-3" onClick={usarDireccionGuardada}>Usar mi dirección guardada</button>)}
                    <label className="form-label">Busca tu dirección:</label>
                    <MapSelector onLocationSelect={handleLocationSelect} initialAddress={direccion} />
                    <div className="mt-3"><label htmlFor="referenciaModal" className="form-label">Referencia:</label><input type="text" id="referenciaModal" className="form-control" value={referencia} onChange={(e) => setReferencia(e.target.value)} /></div>
                    <div className="form-check mt-3"><input className="form-check-input" type="checkbox" id="guardarDireccionModal" checked={guardarDireccion} onChange={(e) => setGuardarDireccion(e.target.checked)} /><label className="form-check-label" htmlFor="guardarDireccionModal">Guardar dirección</label></div>
                  </div>
                  <div className="modal-footer d-flex justify-content-between">
                    <button className="btn btn-secondary" onClick={() => setModalView('cart')}>Volver</button>
                    <button className="btn btn-primary" onClick={handleProcederAlPago} disabled={!direccion || paymentLoading || calculandoEnvio}>{paymentLoading ? 'Iniciando...' : 'Confirmar y Pagar'}</button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {!loading && activeTab === 'ver' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2>Mis Pedidos</h2>
          {(!Array.isArray(misPedidos) || misPedidos.length === 0) ? (
            <p className="text-center">No has realizado ningún pedido.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {misPedidos?.map(p => (
                    <React.Fragment key={p.id}>
                      <tr style={{ cursor: 'pointer' }} onClick={() => handleToggleDetalle(p.id)}>
                        <td>#{p.id}</td>
                        <td>{new Date(p.fecha).toLocaleString('es-MX')}</td>
                        <td>{p.tipo_orden}</td>
                        <td><span className={`badge ${getStatusBadge(p.estado)}`}>{p.estado}</span></td>
                        <td className="text-end">${Number(p.total).toFixed(2)}</td>
                      </tr>
                      {ordenExpandida === p.id && (
                        <tr>
                          <td colSpan="5">
                            <motion.div className="detalle-pedido-productos" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.3 }}>
                              <h5 className="mb-3">Detalle del Pedido #{p.id}</h5>
                              {p.productos?.map(producto => (
                                <div key={`${p.id}-${producto.nombre}`} className="detalle-pedido-item">
                                  <span>{producto.cantidad}x {producto.nombre}</span>
                                  <span>${(producto.cantidad * Number(producto.precio)).toFixed(2)}</span>
                                </div>
                              ))}
                              {p.costo_envio > 0 && (
                                <div className="detalle-pedido-item mt-2 pt-2 border-top">
                                  <span className="fw-bold">Costo de Envío</span>
                                  <span className="fw-bold">${Number(p.costo_envio).toFixed(2)}</span>
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
          )}
        </motion.div>
      )}

      {!loading && activeTab === 'recompensas' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2>Mis Recompensas</h2>
          {misRecompensas?.length === 0 ? (
            <div className="no-recompensas-box">
              <h3>Aún no tienes recompensas</h3>
              <p>¡Sigue comprando para ganar bebidas gratis y más sorpresas!</p>
            </div>
          ) : (
            <div className="row g-4">
              {misRecompensas?.map(recompensa => (
                <div key={recompensa.id} className="col-12">
                  <div style={styles.cupon}>
                    <div style={styles.cuponIcon}>🎁</div>
                    <div style={styles.cuponBody}>
                      <h4 style={styles.cuponTitle}>{recompensa.nombre}</h4>
                      <p style={styles.cuponDescription}>{recompensa.descripcion}</p>
                    </div>
                    <div style={styles.cuponCantidad}>
                      Tienes {recompensa.cantidad}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {showPaymentModal && clientSecret && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Finalizar Compra</h5>
                <button type="button" className="btn-close" onClick={() => setShowPaymentModal(false)}></button>
              </div>
              <div className="modal-body">
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm
                    handleSuccess={handleSuccessfulPayment}
                    total={totalFinal}
                    datosPedido={datosParaCheckout}
                  />
                </Elements>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default ClientePage;