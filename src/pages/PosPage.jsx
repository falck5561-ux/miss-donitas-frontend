import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { Plus, Minus, X, Search, Coffee, ShoppingBag, Clock, CreditCard } from 'lucide-react';

// --- MOCKS DE COMPONENTES Y API (Para que funcione sin archivos externos) ---

// 1. Mock API Client
const apiClient = {
  get: async (url) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (url === '/productos') resolve({ data: [
          { id: 1, nombre: 'Café Americano', precio: '119.99', categoria: 'Bebidas Calientes', en_oferta: false },
          { id: 2, nombre: 'Tito Riko', precio: '19.99', categoria: 'Donas', en_oferta: true, descuento_porcentaje: 10, precio_original: '22.21' },
          { id: 3, nombre: 'Frappe Moka', precio: '145.00', categoria: 'Bebidas Frías', en_oferta: false },
          { id: 27, nombre: 'Café Especial', precio: '130.00', categoria: 'Especiales', en_oferta: false }
        ]});
        if (url === '/combos') resolve({ data: [] });
        if (url === '/pedidos') resolve({ data: [
          { id: 101, nombre_cliente: 'Juan Pérez', fecha: new Date().toISOString(), total: '250.00', tipo_orden: 'domicilio', estado: 'Pendiente' }
        ]});
        if (url === '/ventas/hoy') resolve({ data: [] });
      }, 500);
    });
  },
  post: async (url, data) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (url === '/recompensas/buscar-por-email') {
           if (data.email === 'cliente@test.com') {
             resolve({ data: { cliente: { id: 1, nombre: 'Cliente Test' }, recompensas: [{ id: 99, nombre: 'Café Gratis' }] } });
           } else {
             reject({ response: { data: { msg: 'Cliente no encontrado' } } });
           }
        } else if (url === '/ventas') {
          resolve({ data: { success: true } });
        }
      }, 500);
    });
  },
  put: async () => Promise.resolve({ data: {} })
};

// 2. Mock Modales (Simplificados para demostración)
const DetallesPedidoModal = ({ pedido, onClose }) => (
  <div className="modal d-block" style={{background: 'rgba(0,0,0,0.5)'}}>
    <div className="modal-dialog"><div className="modal-content"><div className="modal-header"><h5 className="modal-title">Detalles #{pedido.id}</h5><button className="btn-close" onClick={onClose}></button></div><div className="modal-body"><p>Detalles del pedido...</p></div></div></div>
  </div>
);

const ProductDetailModal = ({ product, onClose, onAddToCart }) => {
  // Simula añadir producto simple
  return (
    <div className="modal d-block" style={{background: 'rgba(0,0,0,0.5)'}}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{product.nombre}</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p>¿Añadir {product.nombre} al ticket?</p>
            <button className="btn btn-primary w-100" onClick={() => { onAddToCart(product); onClose(); }}>Añadir sin Opciones</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentMethodModal = ({ total, onClose, onSelectPayment }) => (
  <div className="modal d-block" style={{background: 'rgba(0,0,0,0.5)'}}>
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Cobrar ${total.toFixed(2)}</h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>
        <div className="modal-body d-grid gap-2">
          <button className="btn btn-outline-primary" onClick={() => onSelectPayment('Efectivo')}>Efectivo</button>
          <button className="btn btn-outline-primary" onClick={() => onSelectPayment('Tarjeta')}>Tarjeta</button>
        </div>
      </div>
    </div>
  </div>
);

// --- COMPONENTE PRINCIPAL CORREGIDO ---

function PosPage() {
  const [activeTab, setActiveTab] = useState('pos');
  const [menuItems, setMenuItems] = useState([]);
  const [ventaActual, setVentaActual] = useState([]);
  const [totalVenta, setTotalVenta] = useState(0);
  const [pedidos, setPedidos] = useState([]);
  const [ventasDelDia, setVentasDelDia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [emailCliente, setEmailCliente] = useState('');
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [recompensaAplicadaId, setRecompensaAplicadaId] = useState(null);

  // Estado para controlar el modal de productos
  const [productoSeleccionadoParaModal, setProductoSeleccionadoParaModal] = useState(null);
  // Estado para el modal de pago
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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

  // Calcula el total cada vez que cambia la ventaActual
  useEffect(() => {
    const nuevoTotal = ventaActual.reduce((sum, item) => sum + (item.cantidad * Number(item.precioFinal)), 0);
    setTotalVenta(nuevoTotal);
  }, [ventaActual]);

  // 🚨 CORRECCIÓN DE AGRUPAMIENTO (STACKING) PARA EL POS 🚨
  const agregarProductoAVenta = (item) => {
    let idUnicoTicket;
    
    // Detectamos si viene con opciones (del Modal)
    const opciones = item.opcionesSeleccionadas || [];

    if (opciones.length > 0) {
      // SI TIENE TOPPINGS:
      const firmaToppings = opciones
        .map(op => op.id)
        .sort((a, b) => a - b) 
        .join('-');
      
      idUnicoTicket = `${item.id}-OPC-${firmaToppings}`;
    } else {
      // SI ES SIMPLE (Sin toppings):
      idUnicoTicket = String(item.id);
    }
    
    const precioFinal = Number(item.precio); 

    setVentaActual(prevVenta => {
      // Buscamos si ya existe un producto con esta MISMA huella digital
      const indiceExistente = prevVenta.findIndex(p => p.idUnicoTicket === idUnicoTicket && !p.esRecompensa);

      if (indiceExistente >= 0) {
        // ¡YA EXISTE! -> Es idéntico, así que solo sumamos 1 a la cantidad.
        const nuevaVenta = [...prevVenta];
        nuevaVenta[indiceExistente] = {
          ...nuevaVenta[indiceExistente],
          cantidad: nuevaVenta[indiceExistente].cantidad + 1
        };
        return nuevaVenta;
      } else {
        // NO EXISTE -> Creamos nueva fila.
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
    
    if (!item.cartItemId) { 
       toast.success(`${item.nombre} agregado`);
    }
  };

  // 🚨 CORRECCIÓN CRÍTICA: Usar SOLO idUnicoTicket y esRecompensa
  const incrementarCantidad = (idUnicoTicket, esRecompensa) => {
    if (esRecompensa) return;
    setVentaActual(prev => prev.map(item =>
      (String(item.idUnicoTicket) === String(idUnicoTicket)) && !item.esRecompensa 
        ? { ...item, cantidad: item.cantidad + 1 } 
        : item
    ));
  };

  const decrementarCantidad = (idUnicoTicket, esRecompensa) => {
    if (esRecompensa) return;
    setVentaActual(prev => {
      const p = prev.find(item => String(item.idUnicoTicket) === String(idUnicoTicket) && !item.esRecompensa);
      
      if (p && p.cantidad === 1) {
        return prev.filter(item => !(String(item.idUnicoTicket) === String(idUnicoTicket) && !item.esRecompensa));
      }
      
      return prev.map(item =>
        (String(item.idUnicoTicket) === String(idUnicoTicket)) && !item.esRecompensa 
          ? { ...item, cantidad: item.cantidad - 1 } 
          : item
      );
    });
  };

  const eliminarProducto = (idUnicoTicket, esRecompensa) => {
     setVentaActual(prev => prev.filter(item => 
       !(String(item.idUnicoTicket) === String(idUnicoTicket) && item.esRecompensa === esRecompensa)
     ));
     if (esRecompensa) {
       setRecompensaAplicadaId(null);
     }
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
        id,
        cantidad,
        precio: Number(precioFinal),
        nombre: nombre, 
        opciones: opcionesSeleccionadas 
            ? opcionesSeleccionadas.map(op => op.nombre).join(', ') 
            : null
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
      // Simular actualización historial
      const nuevaVenta = {
          id: Math.floor(Math.random() * 1000),
          fecha: new Date().toISOString(),
          total: totalVenta,
          metodo_pago: metodoDePago,
          nombre_empleado: 'Tú'
      };
      setVentasDelDia(prev => [nuevaVenta, ...prev]);
      
      limpiarVenta();
      setIsPaymentModalOpen(false);
      if (activeTab === 'historial') {
        fetchData();
      }
    } catch (err) {
        console.error("Error al registrar venta:", err.response?.data || err.message);
        toast.error('Error al registrar la venta.');
    }
  };

  const handleUpdateStatus = async (pedidoId, nuevoEstado) => { try { await apiClient.put(`/pedidos/${pedidoId}/estado`, { estado: nuevoEstado }); fetchData(); toast.success(`Pedido #${pedidoId} actualizado.`); } catch (err) { toast.error('No se pudo actualizar el estado.'); } };
  const handleShowDetails = (pedido) => { setSelectedOrderDetails(pedido); setShowDetailsModal(true); };
  const handleCloseDetailsModal = () => { setShowDetailsModal(false); setSelectedOrderDetails(null); };

  const handleBuscarCliente = async (e) => {
    e.preventDefault();
    setRecompensaAplicadaId(null);
    if (!emailCliente) return toast.error('Por favor, ingresa un correo (prueba cliente@test.com).');
    try {
      const { data } = await apiClient.post('/recompensas/buscar-por-email', { email: emailCliente });
      setClienteEncontrado(data);
      if (data.recompensas.length > 0) { toast.success(`${data.cliente.nombre} tiene ${data.recompensas.length} recompensa(s) disponible(s).`); } else { toast.error(`${data.cliente.nombre} no tiene recompensas.`); }
    } catch (err) {
        setClienteEncontrado(null);
        const errorMsg = err.response?.data?.msg || err.response?.data?.error || 'Error al buscar cliente (Usa cliente@test.com).';
        toast.error(errorMsg);
    }
  };

  const handleAplicarRecompensa = (recompensa) => {
    if (recompensaAplicadaId) {
      return toast.error('Ya se aplicó una recompensa en este ticket.');
    }

    let itemParaDescontar = null;
    let precioMaximo = -1;
    const nombreRecompensaLower = recompensa.nombre ? recompensa.nombre.toLowerCase() : '';

    // Simplificado para demo: acepta cualquier café
    const productosElegibles = ['Café Americano', 'Frappe Moka', 'Café Especial'];
    ventaActual.forEach(item => {
      if (productosElegibles.some(p => item.nombre.includes('Café') || item.nombre.includes('Frappe')) && !item.esRecompensa && Number(item.precioFinal) > precioMaximo) {
        precioMaximo = Number(item.precioFinal);
        itemParaDescontar = item;
      }
    });

    if (!itemParaDescontar) return toast.error('Añade un Café o Frappe al ticket para aplicar la recompensa.');

    setVentaActual(prevVenta => {
      let itemModificado = false;
      return prevVenta.map(item => {
        if (!itemModificado && String(item.idUnicoTicket) === String(itemParaDescontar.idUnicoTicket) && !item.esRecompensa) {
          itemModificado = true;
          return {
            ...item,
            precioFinal: "0.00",
            nombre: `${item.nombre} (Recompensa)`,
            esRecompensa: true
          };
        }
        return item;
      });
    });

    setRecompensaAplicadaId(recompensa.id);
    toast.success('¡Recompensa aplicada!');
  };

  // Handlers para el modal de producto
  const handleProductClick = (item) => {
    setProductoSeleccionadoParaModal(item);
  };

  const handleCloseProductModal = () => {
    setProductoSeleccionadoParaModal(null);
  };
  
  // --- Render Contenido ---
  const renderContenido = () => {
    if (loading) return <div className="d-flex justify-content-center p-5"><div className="spinner-border text-primary" role="status"></div></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    // --- Pestaña Pedidos en Línea ---
    if (activeTab === 'pedidos') {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="mb-4 fw-bold" style={{fontFamily: 'Playfair Display'}}>Gestión de Pedidos</h1>
          {pedidos.length === 0 ? <p>No hay pedidos pendientes.</p> : (
            <div className="card shadow-sm">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light"><tr><th>ID</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Tipo</th><th>Estado</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {pedidos.map((pedido) => (
                      <tr key={pedido.id}>
                        <td>#{pedido.id}</td><td>{pedido.nombre_cliente || 'N/A'}</td><td>{new Date(pedido.fecha).toLocaleTimeString()}</td><td>${Number(pedido.total).toFixed(2)}</td>
                        <td><span className={`badge ${pedido.tipo_orden === 'domicilio' ? 'bg-info text-dark' : 'bg-secondary'}`}>{pedido.tipo_orden?.charAt(0).toUpperCase() + pedido.tipo_orden?.slice(1)}</span></td>
                        <td><span className="badge bg-warning text-dark">{pedido.estado}</span></td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleShowDetails(pedido)}>Ver</button>
                          <button className="btn btn-sm btn-primary" onClick={() => handleUpdateStatus(pedido.id, 'Completado')}>Completar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      );
    }

    // --- Pestaña Punto de Venta (POS) ---
    if (activeTab === 'pos') {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="row g-4">
          {/* Columna de Menú */}
          <div className="col-md-7 col-lg-8">
            <h2 className="mb-3 fw-bold" style={{fontFamily: 'Playfair Display'}}>Menú</h2>
            <div className="row g-3">
              {menuItems.map(item => (
                <div key={item.id} className="col-6 col-md-4 col-lg-3">
                  <motion.div 
                    whileHover={{ scale: 1.03 }} 
                    whileTap={{ scale: 0.98 }}
                    className={`card h-100 border-0 shadow-sm ${item.en_oferta ? 'border border-danger' : ''}`} 
                    onClick={() => handleProductClick(item)} 
                    style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                  >
                    {item.en_oferta && (<span className="badge bg-danger position-absolute top-0 end-0 m-2">-{Number(item.descuento_porcentaje || 0).toFixed(0)}%</span>)}
                    <div className="card-body d-flex flex-column justify-content-center align-items-center text-center p-3">
                      <div className="bg-light rounded-circle p-3 mb-3">
                         <Coffee size={32} className="text-secondary" />
                      </div>
                      <h6 className="card-title fw-bold mb-1">{item.nombre}</h6>
                      <p className="card-text text-muted small mb-2">{item.categoria}</p>
                      {item.en_oferta ? (
                        <div className="mt-auto">
                          <small className="text-muted text-decoration-line-through me-2">${Number(item.precio_original).toFixed(2)}</small>
                          <strong className="text-danger">${Number(item.precio).toFixed(2)}</strong>
                        </div>
                      ) : (
                        <strong className="mt-auto text-primary">${Number(item.precio).toFixed(2)}</strong>
                      )}
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Columna de Ticket */}
          <div className="col-md-5 col-lg-4">
            <div className="card border-0 shadow position-sticky" style={{ top: '80px', maxHeight: 'calc(100vh - 100px)' }}>
              <div className="card-header bg-white py-3">
                <h4 className="card-title text-center mb-0 fw-bold" style={{fontFamily: 'Playfair Display'}}>Ticket de Venta</h4>
              </div>
              <div className="card-body d-flex flex-column p-0">
                
                {/* Buscador Cliente */}
                <div className="p-3 border-bottom bg-light">
                    <form onSubmit={handleBuscarCliente} className="input-group">
                    <span className="input-group-text bg-white border-end-0"><Search size={18} /></span>
                    <input type="email" className="form-control border-start-0 ps-0" placeholder="Email cliente..." value={emailCliente} onChange={(e) => setEmailCliente(e.target.value)} />
                    <button type="submit" className="btn btn-dark">Buscar</button>
                    </form>
                    {clienteEncontrado && (
                    <motion.div initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} className="mt-2 p-2 bg-white rounded border small">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <strong>{clienteEncontrado.cliente.nombre}</strong>
                            <span className="badge bg-success">{clienteEncontrado.recompensas.length} Rewards</span>
                        </div>
                        {clienteEncontrado.recompensas.length > 0 && !recompensaAplicadaId && (
                            <button className="btn btn-xs btn-outline-success w-100 py-0" onClick={() => handleAplicarRecompensa(clienteEncontrado.recompensas[0])}>Usar Recompensa</button>
                        )}
                        {recompensaAplicadaId && <div className="text-success text-center fw-bold"><small>✓ Recompensa Aplicada</small></div>}
                    </motion.div>
                    )}
                </div>

                {/* Lista Scrollable */}
                <div className="flex-grow-1 overflow-auto p-0" style={{ minHeight: '200px' }}>
                  <ul className="list-group list-group-flush">
                    {ventaActual.length === 0 && (
                        <div className="text-center py-5 text-muted opacity-50">
                            <ShoppingBag size={48} className="mb-2" />
                            <p>El ticket está vacío</p>
                        </div>
                    )}
                    
                    {ventaActual.map((item) => (
                      <li key={item.idUnicoTicket} className={`list-group-item d-flex align-items-center p-2 ${item.esRecompensa ? 'bg-success-subtle' : ''}`}>
                        <div className="flex-grow-1 lh-sm">
                          <div className={`fw-bold ${item.esRecompensa ? 'text-success' : 'text-dark'}`}>{item.nombre}</div>
                          {item.opcionesSeleccionadas && item.opcionesSeleccionadas.length > 0 && (
                            <small className="text-muted">
                              {item.opcionesSeleccionadas.map(op => op.nombre).join(', ')}
                            </small>
                          )}
                        </div>

                        <div className="d-flex align-items-center bg-light rounded border mx-2">
                          {/* BOTÓN RESTAR CORREGIDO */}
                          <button 
                            className="btn btn-link btn-sm text-dark p-1 text-decoration-none"
                            onClick={() => decrementarCantidad(item.idUnicoTicket, item.esRecompensa)} 
                            disabled={item.esRecompensa}
                          >
                            <Minus size={14} />
                          </button>

                          <span className="px-2 fw-bold small">{item.cantidad}</span>

                          {/* BOTÓN SUMAR CORREGIDO */}
                          <button 
                            className="btn btn-link btn-sm text-dark p-1 text-decoration-none"
                            onClick={() => incrementarCantidad(item.idUnicoTicket, item.esRecompensa)} 
                            disabled={item.esRecompensa}
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="text-end" style={{minWidth: '60px'}}>
                            <div className="fw-bold">${(item.cantidad * Number(item.precioFinal)).toFixed(2)}</div>
                        </div>
                          
                        {/* BOTÓN ELIMINAR CORREGIDO */}
                        <button 
                            className="btn btn-link text-danger btn-sm ms-1 p-1" 
                            onClick={() => eliminarProducto(item.idUnicoTicket, item.esRecompensa)} 
                        >
                            <X size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer Totales */}
                <div className="p-3 bg-light border-top">
                    <div className="d-flex justify-content-between mb-3">
                        <span className="h5 mb-0 text-muted">Total</span>
                        <span className="h4 mb-0 fw-bold text-primary">${totalVenta.toFixed(2)}</span>
                    </div>
                    <div className="d-grid gap-2">
                        <button className="btn btn-success py-2 fw-bold shadow-sm" onClick={handleCobrar} disabled={ventaActual.length === 0}>
                             COBRAR TICKET
                        </button>
                        {ventaActual.length > 0 && (
                            <button className="btn btn-outline-danger btn-sm" onClick={limpiarVenta}>Cancelar Venta</button>
                        )}
                    </div>
                </div>

              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    // --- Pestaña Historial ---
    if (activeTab === 'historial') {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="mb-4">Historial Diario</h1>
          <div className="list-group shadow-sm">
            {ventasDelDia.length === 0 ? <div className="p-5 text-center text-muted">No hay ventas registradas hoy.</div> : 
             ventasDelDia.map(venta => (
              <div key={venta.id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3">
                <div>
                  <div className="d-flex align-items-center mb-1">
                    <span className="badge bg-primary rounded-pill me-2">#{venta.id}</span>
                    <span className="fw-bold text-dark">${Number(venta.total).toFixed(2)}</span>
                  </div>
                  <small className="text-muted"><Clock size={12} className="me-1"/> {new Date(venta.fecha).toLocaleTimeString()} • {venta.metodo_pago}</small>
                </div>
                <CreditCard size={20} className="text-muted" />
              </div>
            ))}
          </div>
        </motion.div>
      );
    }
  };

  // --- Render Principal ---
  return (
    <div className="container-fluid p-0">
      <Toaster position="top-center" />
      {/* Navegación */}
      <div className="bg-white border-bottom shadow-sm mb-4 sticky-top" style={{zIndex: 1020}}>
        <div className="container">
            <ul className="nav nav-pills nav-fill py-2">
                <li className="nav-item"><button className={`nav-link rounded-pill ${activeTab === 'pedidos' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('pedidos')}>Pedidos Web</button></li>
                <li className="nav-item"><button className={`nav-link rounded-pill ${activeTab === 'pos' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('pos')}>Punto de Venta</button></li>
                <li className="nav-item"><button className={`nav-link rounded-pill ${activeTab === 'historial' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('historial')}>Corte de Caja</button></li>
            </ul>
        </div>
      </div>
      
      {/* Contenido */}
      <div className="container pb-5">
        {renderContenido()}
      </div>
      
      {/* Modales */}
      {showDetailsModal && (<DetallesPedidoModal pedido={selectedOrderDetails} onClose={handleCloseDetailsModal} />)}

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