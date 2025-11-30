import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
// Importamos todos los iconos necesarios
import { Trash2, Package, Eye, Search, Clock, DollarSign, CreditCard, Receipt, ShoppingBag } from 'lucide-react';
import apiClient from '../services/api';
import DetallesPedidoModal from '../components/DetallesPedidoModal';
import ProductDetailModal from '../components/ProductDetailModal';
import PaymentMethodModal from '../components/PaymentMethodModal';
import { useTheme } from '../context/ThemeContext';

// --- ESTILOS VISUALES ---
const getThemeStyles = (isPicante) => ({
  bg: isPicante ? '#000000' : '#FFF8E1', 
  text: isPicante ? '#FFFFFF' : '#3E2723', 
  cardBg: isPicante ? '#121212' : '#FFFFFF', 
  border: isPicante ? '1px solid #333333' : '1px solid #D7CCC8', 
  accent: isPicante ? '#FF1744' : '#FF4081', 
  muted: isPicante ? '#888888' : '#8D6E63',
  tableHeaderBg: isPicante ? '#1E1E1E' : '#FBE9E7'
});

// Badge de estado
const StatusBadge = ({ status }) => {
  const st = status ? status.toLowerCase() : '';
  let style = { fontSize: '0.75rem', padding: '6px 12px', fontWeight: '800', borderRadius: '50px', textTransform: 'uppercase' };
  let className = 'badge ';

  if (st === 'pendiente') className += 'bg-danger text-white';
  else if (st.includes('preparacion')) className += 'bg-warning text-dark';
  else if (st.includes('camino')) className += 'bg-info text-dark'; 
  else if (st.includes('listo')) className += 'bg-success text-white';
  else if (st === 'completado') className += 'bg-dark text-white';
  else className += 'bg-secondary text-white';
  
  return <span className={className} style={style}>{status}</span>;
};

function PosPage() {
  const { theme } = useTheme();
  const isPicante = theme === 'picante';
  const styles = getThemeStyles(isPicante);

  // --- ESTADOS ---
  const [activeTab, setActiveTab] = useState('pos');
  const [menuItems, setMenuItems] = useState([]);
  const [ventaActual, setVentaActual] = useState([]);
  const [totalVenta, setTotalVenta] = useState(0);
  const [pedidos, setPedidos] = useState([]);
  const [ventasDelDia, setVentasDelDia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modales
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [productoSeleccionadoParaModal, setProductoSeleccionadoParaModal] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Cliente y Recompensas POS
  const [emailCliente, setEmailCliente] = useState('');
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [recompensaAplicadaId, setRecompensaAplicadaId] = useState(null);

  // --- CARGA DE DATOS ---
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'pos') {
        const [productosRes, combosRes] = await Promise.all([
          apiClient.get('/productos'),
          apiClient.get('/combos'),
        ]);

        const estandarizarItem = (item) => {
          const precioFinal = Number(item.precio);
          let precioOriginal = precioFinal;
          const categoria = item.categoria?.nombre || item.categoria || 'General';

          if (item.en_oferta && item.descuento_porcentaje > 0) {
            precioOriginal = precioFinal / (1 - item.descuento_porcentaje / 100);
          }

          return {
            ...item,
            categoria: String(categoria),
            precio: precioFinal,
            precio_original: precioOriginal,
            nombre: item.nombre || item.titulo,
          };
        };

        const productosEstandarizados = productosRes.data.map(estandarizarItem);
        const combosEstandarizados = combosRes.data.map(estandarizarItem);
        setMenuItems([...productosEstandarizados, ...combosEstandarizados]);

      } else if (activeTab === 'pedidos') {
        const res = await apiClient.get('/pedidos');
        setPedidos(res.data);
      } else if (activeTab === 'historial') {
        const res = await apiClient.get('/ventas/hoy');
        setVentasDelDia(res.data);
      }
    } catch (err) {
      setError(`No se pudieron cargar los datos.`);
      console.error("Error en fetchData:", err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  useEffect(() => {
    const nuevoTotal = ventaActual.reduce((sum, item) => sum + (item.cantidad * Number(item.precioFinal)), 0);
    setTotalVenta(nuevoTotal);
  }, [ventaActual]);

  // --- CÁLCULO DEL TOTAL DEL DÍA (Basado en el dinero de los tickets) ---
  const resumenDia = useMemo(() => {
      const totalDinero = ventasDelDia.reduce((acc, venta) => acc + Number(venta.total || 0), 0);
      return {
          totalDinero,
          totalTickets: ventasDelDia.length
      };
  }, [ventasDelDia]);


  // --- LOGICA POS ---
  const agregarProductoAVenta = (item) => {
    let idUnicoTicket;
    const opciones = item.opcionesSeleccionadas || [];

    if (opciones.length > 0) {
      const firmaToppings = opciones.map(op => op.id).sort((a, b) => a - b).join('-');
      idUnicoTicket = `${item.id}-OPC-${firmaToppings}`;
    } else {
      idUnicoTicket = String(item.id);
    }
    
    const precioFinal = Number(item.precio); 

    setVentaActual(prevVenta => {
      const indiceExistente = prevVenta.findIndex(p => p.idUnicoTicket === idUnicoTicket && !p.esRecompensa);

      if (indiceExistente >= 0) {
        const nuevaVenta = [...prevVenta];
        nuevaVenta[indiceExistente] = { ...nuevaVenta[indiceExistente], cantidad: nuevaVenta[indiceExistente].cantidad + 1 };
        return nuevaVenta;
      } else {
        return [...prevVenta, {
          ...item,
          idUnicoTicket: idUnicoTicket,
          cantidad: 1,
          precioFinal: parseFloat(precioFinal).toFixed(2),
          esRecompensa: false,
          opcionesSeleccionadas: opciones
        }];
      }
    });
    
    if (!item.cartItemId) toast.success(`${item.nombre} agregado`);
  };

  const incrementarCantidad = (idUnicoTicket, esRecompensa) => {
    if (esRecompensa) return;
    setVentaActual(prev => prev.map(item => (String(item.idUnicoTicket) === String(idUnicoTicket)) && !item.esRecompensa ? { ...item, cantidad: item.cantidad + 1 } : item));
  };

  const decrementarCantidad = (idUnicoTicket, esRecompensa) => {
    if (esRecompensa) return;
    setVentaActual(prev => {
      const p = prev.find(item => String(item.idUnicoTicket) === String(idUnicoTicket) && !item.esRecompensa);
      if (p && p.cantidad === 1) return prev.filter(item => !(String(item.idUnicoTicket) === String(idUnicoTicket) && !item.esRecompensa));
      return prev.map(item => (String(item.idUnicoTicket) === String(idUnicoTicket)) && !item.esRecompensa ? { ...item, cantidad: item.cantidad - 1 } : item);
    });
  };

  const eliminarProducto = (idUnicoTicket, esRecompensa) => {
    setVentaActual(prev => prev.filter(item => !(String(item.idUnicoTicket) === String(idUnicoTicket) && item.esRecompensa === esRecompensa)));
    if (esRecompensa) setRecompensaAplicadaId(null);
  };

  const limpiarVenta = () => {
    setVentaActual([]);
    setEmailCliente('');
    setClienteEncontrado(null);
    setRecompensaAplicadaId(null);
  };

  const handleCobrar = () => {
    if (ventaActual.length === 0) return toast.error('El ticket está vacío.');
    setIsPaymentModalOpen(true);
  };

  const handleFinalizarVenta = async (metodoDePago) => {
    if (ventaActual.length === 0) return toast.error('El ticket está vacío.');

    const itemsParaEnviar = ventaActual.map(({ id, cantidad, precioFinal, opcionesSeleccionadas, nombre }) => ({
        id, cantidad, precio: Number(precioFinal), nombre: nombre, 
        opciones: opcionesSeleccionadas ? opcionesSeleccionadas.map(op => op.nombre).join(', ') : null
    }));

    const ventaData = {
      total: totalVenta,
      metodo_pago: metodoDePago,
      items: itemsParaEnviar,
      clienteId: clienteEncontrado ? clienteEncontrado.cliente.id : null,
      recompensaUsadaId: recompensaAplicadaId
    };

    try {
      await apiClient.post('/ventas', ventaData);
      toast.success('¡Venta registrada con éxito!');
      limpiarVenta();
      setIsPaymentModalOpen(false);
      // Si estamos en la pestaña historial, recargamos
      if (activeTab === 'historial') fetchData();
    } catch (err) {
        console.error(err);
        toast.error('Error al registrar la venta.');
    }
  };

  // --- FUNCIÓN CORREGIDA PARA VER DETALLES ---
  const handleShowDetails = async (venta) => {
      // 1. Datos iniciales para que el modal abra rápido
      let datosIniciales = { 
          ...venta,
          estado: venta.estado || 'Completado',
          tipo_orden: venta.tipo_orden || 'mostrador',
          nombre_cliente: venta.nombre_cliente || 'Venta de Mostrador'
      };
      
      // Abrimos modal con lo que tenemos
      setSelectedOrderDetails(datosIniciales);
      setShowDetailsModal(true);

      // 2. Verificamos si tiene productos
      const tieneProductos = (datosIniciales.items && datosIniciales.items.length > 0) || 
                             (datosIniciales.venta_detalles && datosIniciales.venta_detalles.length > 0);

      // 3. Si no tiene productos, los pedimos al servidor
      if (!tieneProductos) {
          try {
              // CORRECCIÓN: Si estamos en la pestaña 'pedidos', buscamos en la tabla de pedidos
              // Si estamos en 'historial', buscamos en la tabla de ventas
              const endpoint = activeTab === 'pedidos' 
                  ? `/pedidos/${venta.id}` 
                  : `/ventas/${venta.id}`;

              const res = await apiClient.get(endpoint);

              if (res.data) {
                  const datosCompletos = { 
                      ...datosIniciales, 
                      ...res.data,
                      // Unificamos donde vienen los productos
                      items: res.data.items || res.data.venta_detalles || res.data.detalles || []
                  };
                  setSelectedOrderDetails(datosCompletos);
              }
          } catch (error) {
              console.error("Error cargando detalles extra:", error);
          }
      }

  const handleCloseDetailsModal = () => { setShowDetailsModal(false); setSelectedOrderDetails(null); };

  const handleUpdateStatus = async (pedidoId, nuevoEstado) => { try { await apiClient.put(`/pedidos/${pedidoId}/estado`, { estado: nuevoEstado }); fetchData(); toast.success(`Pedido #${pedidoId} actualizado.`); } catch (err) { toast.error('No se pudo actualizar el estado.'); } };

  const renderActionButtons = (p) => {
      const status = p.estado ? p.estado.toLowerCase().trim() : '';
      if (status === 'pendiente') {
          return <button className="btn btn-sm text-white fw-bold rounded-pill px-3" style={{backgroundColor: styles.accent, border:'none'}} onClick={() => handleUpdateStatus(p.id, 'En Preparacion')}>👨‍🍳 Preparar</button>;
      }
      if (status.includes('preparacion') || status === 'preparando') {
          if (p.tipo_orden === 'domicilio') return <button className="btn btn-sm btn-info text-white fw-bold rounded-pill px-3" onClick={() => handleUpdateStatus(p.id, 'En Camino')}>🛵 Enviar</button>;
          else return <button className="btn btn-sm btn-success text-white fw-bold rounded-pill px-3" onClick={() => handleUpdateStatus(p.id, 'Listo')}>🥡 Listo</button>;
      }
      if (status.includes('listo') || status === 'en camino') {
          return <button className="btn btn-sm btn-dark text-white fw-bold rounded-pill px-3" onClick={() => handleUpdateStatus(p.id, 'Completado')}>✅ Finalizar</button>;
      }
      return null; 
  };

  const handleBuscarCliente = async (e) => {
    e.preventDefault();
    setRecompensaAplicadaId(null);
    if (!emailCliente) return toast.error('Ingresa un correo.');
    try {
      const { data } = await apiClient.post('/recompensas/buscar-por-email', { email: emailCliente });
      setClienteEncontrado(data);
      if (data.recompensas.length > 0) toast.success(`Cliente encontrado.`); else toast.error('Sin recompensas.');
    } catch (err) { setClienteEncontrado(null); toast.error('Cliente no encontrado.'); }
  };

  const handleAplicarRecompensa = (recompensa) => {
    if (recompensaAplicadaId) return toast.error('Solo una recompensa por ticket.');
    let itemParaDescontar = null;
    let precioMaximo = -1;
    const nombreRecompensaLower = recompensa.nombre ? recompensa.nombre.toLowerCase() : '';

    if (nombreRecompensaLower.includes('pikulito') || nombreRecompensaLower.includes('mojadito')) {
      const productosElegibles = ['Tito Pikulito', 'Tito Mojadito']; 
      ventaActual.forEach(item => {
        if (productosElegibles.includes(item.nombre) && !item.esRecompensa && Number(item.precioFinal) > precioMaximo) {
          precioMaximo = Number(item.precioFinal);
          itemParaDescontar = item;
        }
      });
      if (!itemParaDescontar) return toast.error('Añade un Tito Pikulito o Mojadito para aplicar.');
    } else {
        ventaActual.forEach(item => {
            if (!item.esRecompensa && Number(item.precioFinal) > precioMaximo) {
                precioMaximo = Number(item.precioFinal);
                itemParaDescontar = item;
            }
        });
    }

    if(itemParaDescontar) {
        setVentaActual(prevVenta => {
            let itemModificado = false;
            return prevVenta.map(item => {
              if (!itemModificado && String(item.idUnicoTicket) === String(itemParaDescontar.idUnicoTicket) && !item.esRecompensa) {
                itemModificado = true;
                return { ...item, precioFinal: "0.00", nombre: `${item.nombre} (🎁)`, esRecompensa: true };
              }
              return item;
            });
        });
        setRecompensaAplicadaId(recompensa.id);
        toast.success('¡Recompensa aplicada!');
    } else { toast.error('No hay producto elegible.'); }
  };

  const handleProductClick = (item) => setProductoSeleccionadoParaModal(item);
  const handleCloseProductModal = () => setProductoSeleccionadoParaModal(null);
  
  const renderContenido = () => {
    if (loading) return <div className="text-center py-5"><div className="spinner-border" style={{color: styles.accent}} role="status"></div></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    // --- PESTAÑA: PEDIDOS EN LINEA ---
    if (activeTab === 'pedidos') {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="p-4 rounded-3 shadow-sm" style={{backgroundColor: styles.cardBg, border: styles.border}}>
              <div className="mb-4">
                  <h4 className="fw-bold m-0">Gestión de Pedidos en Línea</h4>
                  <p className="small m-0" style={{color: styles.muted}}>Controla los pedidos entrantes de la web</p>
              </div>
              
              {pedidos.length === 0 ? <div className="text-center py-5 text-muted">No hay pedidos pendientes.</div> : (
                <div className="table-responsive">
                  <table className="table align-middle mb-0" style={{color: styles.text}}>
                    <thead style={{backgroundColor: styles.tableHeaderBg}}>
                        <tr style={{borderBottom: styles.border}}>
                            <th className="py-3 ps-3">ID</th>
                            <th>Cliente / Hora</th>
                            <th>Total</th>
                            <th>Tipo</th>
                            <th>Estado</th>
                            <th className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                      {pedidos.map((p) => (
                        <tr key={p.id} style={{borderBottom: `1px solid ${isPicante ? '#222' : '#f0f0f0'}`}}>
                          <td className="ps-3 fw-bold" style={{color: styles.accent}}>#{p.id}</td>
                          <td><div className="fw-bold">{p.nombre_cliente || 'N/A'}</div><small style={{color: styles.muted}}>{new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small></td>
                          <td className="fw-bold">${Number(p.total).toFixed(2)}</td>
                          <td>{p.tipo_orden === 'domicilio' ? <span className="badge bg-info text-dark rounded-pill">🛵 Moto</span> : <span className="badge bg-secondary text-white rounded-pill">👜 Local</span>}</td>
                          <td><StatusBadge status={p.estado} /></td>
                          <td className="text-center">
                            <div className="d-flex justify-content-center gap-2">
                                <button className="btn btn-sm d-flex align-items-center gap-1 fw-bold rounded-pill px-3" style={{border: `1px solid ${styles.muted}`, color: styles.text}} onClick={() => handleShowDetails(p)}>
                                    <Eye size={14}/> Ver
                                </button>
                                {renderActionButtons(p)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </motion.div>
      );
    }

    // --- PESTAÑA: PUNTO DE VENTA (POS) ---
    if (activeTab === 'pos') {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="row g-4">
          <div className="col-md-7">
            <div className="p-3 rounded-3 shadow-sm h-100" style={{backgroundColor: styles.cardBg, border: styles.border}}>
                <h4 className="mb-4 fw-bold">Menú</h4>
                <div className="row g-3">
                {menuItems.map(item => (
                    <div key={item.id} className="col-md-4 col-lg-3">
                    <motion.div whileHover={{ scale: 1.02 }} className="card h-100 text-center border-0 shadow-sm" onClick={() => handleProductClick(item)} 
                        style={{ cursor: 'pointer', backgroundColor: isPicante ? '#222' : '#FFF', border: item.en_oferta ? `1px solid ${styles.accent}` : styles.border }}>
                        {item.en_oferta && (<span className="badge bg-danger position-absolute top-0 end-0 m-2">OFERTA</span>)}
                        <div className="card-body d-flex flex-column justify-content-center p-3">
                        <div className="d-flex justify-content-center mb-3">
                            <Package size={40} className="text-secondary" strokeWidth={1.5} />
                        </div>
                        <h6 className="card-title fw-bold mb-1" style={{fontSize: '0.9rem'}}>{item.nombre}</h6>
                        <div className="fw-bold" style={{color: styles.accent}}>${Number(item.precio).toFixed(2)}</div>
                        </div>
                    </motion.div>
                    </div>
                ))}
                </div>
            </div>
          </div>

          <div className="col-md-5">
            <div className="card position-sticky shadow-sm border-0" style={{ top: '20px', backgroundColor: styles.cardBg, border: styles.border }}>
              <div className="card-body p-4">
                <h4 className="card-title text-center fw-bold mb-3">Ticket de Venta</h4>
                <form onSubmit={handleBuscarCliente} className="d-flex mb-3 gap-2">
                    <div className="input-group">
                        <span className="input-group-text bg-transparent" style={{borderColor: styles.border}}><Search size={16} color={styles.muted}/></span>
                        <input type="email" className="form-control shadow-none" placeholder="Email cliente..." value={emailCliente} onChange={(e) => setEmailCliente(e.target.value)} style={{backgroundColor: isPicante ? '#222' : '#FFF', color: styles.text, border: styles.border, borderLeft: 'none'}}/>
                    </div>
                </form>
                {clienteEncontrado && (
                  <div className="p-2 mb-3 rounded border" style={{borderColor: styles.accent, backgroundColor: isPicante ? '#220000' : '#FFF0F5'}}>
                    <p className="mb-1 small"><strong>Cliente:</strong> {clienteEncontrado.cliente.nombre}</p>
                    {clienteEncontrado.recompensas.map(rec => (
                        <button key={rec.id} className="btn btn-sm btn-success w-100 mt-1" onClick={() => handleAplicarRecompensa(rec)} disabled={recompensaAplicadaId !== null}>🎁 Usar: {rec.nombre}</button>
                    ))}
                  </div>
                )}
                <hr style={{borderColor: styles.muted}} />
                <ul className="list-group list-group-flush mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {ventaActual.length === 0 && <div className="text-center text-muted py-4">Ticket vacío</div>}
                  {ventaActual.map((item) => (
                    <li key={item.idUnicoTicket} className="list-group-item d-flex align-items-center justify-content-between p-2" style={{backgroundColor: 'transparent', color: styles.text, borderBottom: `1px solid ${isPicante ? '#333' : '#eee'}`}}>
                      <div className="me-auto" style={{lineHeight: '1.2'}}>
                        <div className={item.esRecompensa ? 'text-success fw-bold' : 'fw-bold'}>{item.nombre}</div>
                        {item.opcionesSeleccionadas && <small className="text-muted">{item.opcionesSeleccionadas.map(o => o.nombre).join(', ')}</small>}
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <button className="btn btn-sm btn-outline-secondary px-2 py-0" onClick={() => decrementarCantidad(item.idUnicoTicket, item.esRecompensa)} disabled={item.esRecompensa}>-</button>
                        <span className="fw-bold">{item.cantidad}</span>
                        <button className="btn btn-sm btn-outline-secondary px-2 py-0" onClick={() => incrementarCantidad(item.idUnicoTicket, item.esRecompensa)} disabled={item.esRecompensa}>+</button>
                      </div>
                      <div className="text-end ms-3 d-flex align-items-center gap-3" style={{minWidth: '50px'}}>
                          <div className="fw-bold">${(item.cantidad * Number(item.precioFinal)).toFixed(2)}</div>
                          <button onClick={() => eliminarProducto(item.idUnicoTicket, item.esRecompensa)} className="btn btn-link p-0 text-danger" title="Eliminar del ticket">
                             <Trash2 size={16} />
                          </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="h5 m-0">Total:</span>
                    <span className="h3 m-0 fw-bold" style={{color: styles.accent}}>${totalVenta.toFixed(2)}</span>
                </div>
                <div className="d-grid gap-2">
                  <button className="btn btn-lg text-white fw-bold" style={{backgroundColor: styles.accent}} onClick={handleCobrar} disabled={ventaActual.length === 0}>COBRAR</button>
                  <button className="btn btn-outline-danger" onClick={limpiarVenta}>CANCELAR</button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    // --- PESTAÑA: HISTORIAL (CORREGIDA) ---
    if (activeTab === 'historial') {
      const { totalDinero, totalTickets } = resumenDia;

      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Banner de resumen */}
          <div className="row mb-4">
              <div className="col-md-12">
                  <div className="p-4 rounded-3 shadow-sm d-flex justify-content-between align-items-center" style={{backgroundColor: styles.accent, color: '#FFF'}}>
                      <div>
                        <h2 className="fw-bold m-0">${totalDinero.toFixed(2)}</h2>
                        <span className="opacity-75">Ventas Totales de Hoy</span>
                      </div>
                      <div className="text-end opacity-75">
                         <h5 className="m-0">{totalTickets}</h5>
                         <small>Tickets Generados</small>
                      </div>
                  </div>
              </div>
          </div>

          <div className="p-4 rounded-3 shadow-sm" style={{backgroundColor: styles.cardBg, border: styles.border}}>
              <h4 className="fw-bold mb-4">Historial de Tickets de Hoy</h4>
              {ventasDelDia.length === 0 ? <p className="text-muted">No se han registrado ventas hoy.</p> : (
                <div className="list-group">
                  {ventasDelDia.map(venta => (
                    <motion.div 
                        key={venta.id} 
                        whileHover={{ backgroundColor: isPicante ? '#222' : '#F9F9F9' }}
                        onClick={() => handleShowDetails(venta)}
                        className="list-group-item border-0 border-bottom p-3 d-flex align-items-center justify-content-between" 
                        style={{backgroundColor: 'transparent', color: styles.text, borderColor: isPicante ? '#333' : '#eee', cursor: 'pointer'}}
                    >
                        {/* Izquierda: Info básica */}
                        <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{width:'50px', height:'50px', backgroundColor: isPicante ? '#333' : '#f0f0f0'}}>
                                <Receipt size={24} color={styles.accent} />
                            </div>
                            <div>
                                <h5 className="mb-0 fw-bold">Ticket #{venta.id}</h5>
                                <div className="d-flex gap-3 text-muted small">
                                    <span className="d-flex align-items-center gap-1"><Clock size={12}/> {new Date(venta.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    {venta.cliente && <span>Cliente: {venta.cliente.nombre}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Derecha: Totales y Acciones */}
                        <div className="text-end">
                            <h5 className="mb-0 fw-bold" style={{color: styles.accent}}>${Number(venta.total).toFixed(2)}</h5>
                            <div className="d-flex align-items-center justify-content-end gap-2 mt-1">
                                <span className="badge bg-secondary rounded-pill text-white" style={{fontSize:'0.65rem'}}>
                                    {venta.metodo_pago === 'efectivo' ? <DollarSign size={10} /> : <CreditCard size={10} />}
                                    {' '}{venta.metodo_pago}
                                </span>
                                <span className="text-primary fw-bold small">Ver Detalles &rarr;</span>
                            </div>
                        </div>
                    </motion.div>
                  ))}
                </div>
              )}
          </div>
        </motion.div>
      );
    }
  };

  return (
    <div style={{ backgroundColor: styles.bg, minHeight: '100vh', color: styles.text, fontFamily: "'Nunito', sans-serif" }}>
      <div className="container-fluid px-4 py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 className="fw-bold m-0" style={{color: styles.accent, fontFamily: "'Fredoka One', cursive"}}>Miss Donitas POS</h2>
                <p className="m-0 small text-muted">Sistema de Punto de Venta & Pedidos</p>
            </div>
            <div>
                <span className="badge rounded-pill px-3 py-2" style={{backgroundColor: styles.cardBg, color: styles.text, border: styles.border}}>
                    {isPicante ? '🔥 MODO PICANTE' : '🍩 MODO DONA'}
                </span>
            </div>
        </div>

        <div className="d-flex gap-2 mb-4 overflow-auto pb-2">
            {[
                {id: 'pos', label: '🖥️ PUNTO DE VENTA'},
                {id: 'pedidos', label: '🛎️ PEDIDOS ONLINE'},
                {id: 'historial', label: '📊 VENTAS DE HOY'}
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="btn fw-bold px-4 rounded-pill shadow-none"
                    style={{
                        backgroundColor: activeTab === tab.id ? styles.accent : styles.cardBg,
                        color: activeTab === tab.id ? '#FFF' : styles.text,
                        border: activeTab === tab.id ? 'none' : styles.border
                    }}
                >
                    {tab.label}
                </button>
            ))}
        </div>
        
        {renderContenido()}
      </div>

      {showDetailsModal && (<DetallesPedidoModal pedido={selectedOrderDetails} onClose={handleCloseDetailsModal} isPicante={isPicante} />)}

      {productoSeleccionadoParaModal && (
        <ProductDetailModal
          product={productoSeleccionadoParaModal}
          onClose={handleCloseProductModal}
          onAddToCart={agregarProductoAVenta} 
        />
      )}

      {isPaymentModalOpen && (
        <PaymentMethodModal
          total={totalVenta}
          onClose={() => setIsPaymentModalOpen(false)}
          onSelectPayment={handleFinalizarVenta} 
        />
      )}
    </div>
  );
}

export default PosPage;