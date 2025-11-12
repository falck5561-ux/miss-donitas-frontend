import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
// --- Usando rutas relativas estándar ---
import apiClient from '../services/api';
import DetallesPedidoModal from '../components/DetallesPedidoModal';

// --- NUEVO ---
// 1. Importamos el modal de detalles del producto
import ProductDetailModal from '../components/ProductDetailModal';
// --- CAMBIO 1: Importa el nuevo modal ---
import PaymentMethodModal from '../components/PaymentMethodModal';


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

  // --- NUEVO ---
  // 2. Añadimos el estado para controlar el modal de productos
  const [productoSeleccionadoParaModal, setProductoSeleccionadoParaModal] = useState(null);

  // --- CAMBIO 2: Añadir estado para el modal de pago ---
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
          // Asigna categoría, asegurando que sea string
          const categoria = item.categoria?.nombre || item.categoria || 'General';

          if (item.en_oferta && item.descuento_porcentaje > 0) {
            precioOriginal = precioFinal / (1 - item.descuento_porcentaje / 100);
          }

          return {
            ...item,
            categoria: String(categoria), // Forzar a string por si acaso
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

  const agregarProductoAVenta = (item) => {
    // --- LÓGICA DEL MODAL ---
    // El 'item' que viene del modal de detalles (cuando tiene opciones)
    // puede traer 'opcionesSeleccionadas' y un 'precio' (total) actualizado.
    
    // Si el 'item' viene del modal SIN OPCIONES,
    // 'item.opcionesSeleccionadas' será undefined.
    // Si el 'item' viene del modal CON OPCIONES,
    // 'item.opcionesSeleccionadas' será un array.
    
    const tieneOpciones = item.opcionesSeleccionadas && item.opcionesSeleccionadas.length > 0;
    
    // El precioFinal es el 'precio' que viene del modal (que ya es el total)
    // o el precio base del item.
    const precioFinal = Number(item.precio); 

    setVentaActual(prevVenta => {
      
      // ID Único para el ticket
      // Si tiene opciones, creamos un ID único para que no se agrupe
      // Si NO tiene opciones, usamos el ID normal para que SÍ se agrupe
      const idUnicoTicket = tieneOpciones ? `${item.id}-${Date.now()}` : item.id;
      const esRecompensa = false; // Asumimos que nunca es recompensa al agregar

      const productoExistente = prevVenta.find(p => 
        (p.idUnicoTicket === idUnicoTicket || (!tieneOpciones && p.id === item.id)) && 
        !p.esRecompensa
      );

      if (productoExistente) {
        // Si existe y no tiene opciones, agrupamos
        return prevVenta.map(p =>
          (p.idUnicoTicket === idUnicoTicket || (!tieneOpciones && p.id === item.id)) && !p.esRecompensa 
            ? { ...p, cantidad: p.cantidad + 1 } 
            : p
        );
      }
      
      // Si es nuevo o tiene opciones, lo añadimos como línea nueva
      return [...prevVenta, {
        ...item,
        idUnicoTicket: idUnicoTicket, // Guardamos el ID único
        cantidad: 1,
        precioFinal: parseFloat(precioFinal).toFixed(2),
        esRecompensa: esRecompensa,
        // Guardamos las opciones para mostrarlas en el ticket (si las hay)
        opcionesSeleccionadas: item.opcionesSeleccionadas || [] 
      }];
    });
    
    // Mostramos toast solo si el modal no lo hizo (agregado manual)
    if (!item.opcionesSeleccionadas) {
         toast.success(`${item.nombre} agregado al ticket`);
    }
  };


  const incrementarCantidad = (idUnicoTicket, id, esRecompensa) => {
    if (esRecompensa) return;
    setVentaActual(prev => prev.map(item =>
      (item.idUnicoTicket === idUnicoTicket || item.id === id) && !item.esRecompensa 
        ? { ...item, cantidad: item.cantidad + 1 } 
        : item
    ));
  };

  const decrementarCantidad = (idUnicoTicket, id, esRecompensa) => {
    if (esRecompensa) return;
    setVentaActual(prev => {
      const p = prev.find(item => (item.idUnicoTicket === idUnicoTicket || item.id === id) && !item.esRecompensa);
      
      if (p && p.cantidad === 1) {
        return prev.filter(item => !( (item.idUnicoTicket === idUnicoTicket || item.id === id) && !item.esRecompensa ));
      }
      
      return prev.map(item =>
        (item.idUnicoTicket === idUnicoTicket || item.id === id) && !item.esRecompensa 
          ? { ...item, cantidad: item.cantidad - 1 } 
          : item
      );
    });
  };

  const eliminarProducto = (idUnicoTicket, id, esRecompensa) => {
     setVentaActual(prev => prev.filter(item => 
        !((item.idUnicoTicket === idUnicoTicket || item.id === id) && item.esRecompensa === esRecompensa)
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

  // --- CAMBIO 3: 'handleCobrar' ahora solo abre el modal ---
  const handleCobrar = () => {
    if (ventaActual.length === 0) return toast.error('El ticket está vacío.');
    // Si el ticket no está vacío, abre el modal de pago
    setIsPaymentModalOpen(true);
  };

  // --- CAMBIO 4: Creamos 'handleFinalizarVenta' ---
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
      // --- Usamos el método de pago que viene del modal ---
      metodo_pago: metodoDePago,
      items: itemsParaEnviar,
      clienteId: clienteEncontrado ? clienteEncontrado.cliente.id : null,
      recompensaUsadaId: recompensaAplicadaId
    };

    try {
      await apiClient.post('/ventas', ventaData);
      toast.success('¡Venta registrada con éxito!');
      limpiarVenta();
      setIsPaymentModalOpen(false); // Cerramos el modal de pago
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
    if (!emailCliente) return toast.error('Por favor, ingresa un correo.');
    try {
      const { data } = await apiClient.post('/recompensas/buscar-por-email', { email: emailCliente });
      setClienteEncontrado(data);
      if (data.recompensas.length > 0) { toast.success(`${data.cliente.nombre} tiene ${data.recompensas.length} recompensa(s) disponible(s).`); } else { toast.error(`${data.cliente.nombre} no tiene recompensas.`); }
    } catch (err) {
        setClienteEncontrado(null);
        const errorMsg = err.response?.data?.msg || err.response?.data?.error || 'Error al buscar cliente.';
        toast.error(errorMsg);
    }
  };

  // --- FUNCIÓN 'handleAplicarRecompensa' (Lógica Final) ---
  const handleAplicarRecompensa = (recompensa) => {
    if (recompensaAplicadaId) {
      return toast.error('Ya se aplicó una recompensa en este ticket.');
    }

    let itemParaDescontar = null;
    let precioMaximo = -1;
    const nombreRecompensaLower = recompensa.nombre ? recompensa.nombre.toLowerCase() : '';

    // Buscar "pikulito" o "mojadito"
    if (nombreRecompensaLower.includes('pikulito') || nombreRecompensaLower.includes('mojadito')) {
      const productosElegibles = ['Tito Pikulito', 'Tito Mojadito']; // Buscar por nombre exacto

      ventaActual.forEach(item => {
        if (productosElegibles.includes(item.nombre) && !item.esRecompensa && Number(item.precioFinal) > precioMaximo) {
          precioMaximo = Number(item.precioFinal);
          itemParaDescontar = item;
        }
      });

      if (!itemParaDescontar) {
        return toast.error('Añade un Tito Pikulito o Tito Mojadito al ticket para aplicar la recompensa.');
      }

    } else if (nombreRecompensaLower.includes('café') || nombreRecompensaLower.includes('frappe')) {
      // Lógica vieja para café/frappe
      const productosElegibles = ['Café Americano', 'Frappe Coffee'];

      ventaActual.forEach(item => {
        if (productosElegibles.includes(item.nombre) && !item.esRecompensa && Number(item.precioFinal) > precioMaximo) {
          precioMaximo = Number(item.precioFinal);
          itemParaDescontar = item;
        }
      });

      if (!itemParaDescontar) {
        return toast.error('Añade un Café o Frappe al ticket para aplicar la recompensa.');
      }
    } else {
      console.warn("Recompensa no reconocida:", recompensa.nombre);
      return toast.error('No se reconoce el tipo de recompensa.');
    }

    // Aplicar descuento
    setVentaActual(prevVenta => {
      let itemModificado = false;
      return prevVenta.map(item => {
        if (!itemModificado && (item.idUnicoTicket === itemParaDescontar.idUnicoTicket || item.id === itemParaDescontar.id) && !item.esRecompensa) {
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

  // --- NUEVO ---
  // 3. Handlers para el modal de producto
  const handleProductClick = (item) => {
    setProductoSeleccionadoParaModal(item);
  };

  const handleCloseProductModal = () => {
    setProductoSeleccionadoParaModal(null);
  };
  
  // --- Render Contenido ---
  const renderContenido = () => {
    if (loading) return <div className="text-center"><div className="spinner-border" role="status"></div></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    // --- Pestaña Pedidos en Línea ---
    if (activeTab === 'pedidos') {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="mb-4">Gestión de Pedidos en Línea</h1>
          {pedidos.length === 0 ? <p>No hay pedidos pendientes.</p> : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead><tr><th>ID</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Tipo</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {pedidos.map((pedido) => (
                    <tr key={pedido.id}>
                      <td>#{pedido.id}</td><td>{pedido.nombre_cliente || 'N/A'}</td><td>{new Date(pedido.fecha).toLocaleString()}</td><td>${Number(pedido.total).toFixed(2)}</td>
                      <td><span className={`badge ${pedido.tipo_orden === 'domicilio' ? 'bg-info text-dark' : 'bg-secondary'}`}>{pedido.tipo_orden?.charAt(0).toUpperCase() + pedido.tipo_orden?.slice(1)}</span></td>
                      <td>{pedido.estado}</td>
                      <td>
                        <button className="btn btn-sm btn-info me-2 mb-1" onClick={() => handleShowDetails(pedido)}>Ver</button>
                        <button className="btn btn-sm btn-warning me-2 mb-1" onClick={() => handleUpdateStatus(pedido.id, 'En Preparacion')}>Preparar</button>
                        <button className="btn btn-sm btn-primary me-2 mb-1" onClick={() => handleUpdateStatus(pedido.id, 'En Camino')}>En Camino</button>
                         <button className="btn btn-sm btn-light me-2 mb-1" onClick={() => handleUpdateStatus(pedido.id, 'Listo para Recoger')}>Listo</button>
                        <button className="btn btn-sm btn-success mb-1" onClick={() => handleUpdateStatus(pedido.id, 'Completado')}>Entregado</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      );
    }

    // --- Pestaña Punto de Venta (POS) ---
    if (activeTab === 'pos') {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="row">
          {/* Columna de Menú */}
          <div className="col-md-7">
            <h2>Menú de Productos</h2>
            <div className="row g-3">
              {menuItems.map(item => (
                <div key={item.id} className="col-md-4 col-lg-3">
                  {/* --- CAMBIO --- */}
                  {/* 4. El onClick ahora llama a handleProductClick */}
                  <motion.div whileHover={{ scale: 1.05 }} className={`card h-100 text-center ${item.en_oferta ? 'border-danger' : ''}`} onClick={() => handleProductClick(item)} style={{ cursor: 'pointer', position: 'relative' }}>
                    {item.en_oferta && (<span className="badge bg-danger" style={{ position: 'absolute', top: '10px', right: '10px' }}>-{Number(item.descuento_porcentaje || 0).toFixed(0)}%</span>)}
                    <div className="card-body d-flex flex-column justify-content-center pt-4">
                      <h5 className="card-title">{item.nombre}</h5>
                      {item.en_oferta ? (
                        <p className="card-text">
                          <del className="text-muted me-2">${Number(item.precio_original).toFixed(2)}</del>
                          <strong>${Number(item.precio).toFixed(2)}</strong>
                        </p>
                      ) : (
                        <p className="card-text">${Number(item.precio).toFixed(2)}</p>
                      )}
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
          {/* Columna de Ticket */}
          <div className="col-md-5">
            <div className="card position-sticky" style={{ top: '20px' }}>
              <div className="card-body">
                <h3 className="card-title text-center">Ticket de Venta</h3>
                <hr />
                {/* Buscar Cliente */}
                <form onSubmit={handleBuscarCliente} className="d-flex mb-3">
                  <input type="email" className="form-control me-2" placeholder="Buscar cliente por correo..." value={emailCliente} onChange={(e) => setEmailCliente(e.target.value)} />
                  <button type="submit" className="btn btn-info">Buscar</button>
                </form>
                {/* Mostrar Info Cliente y Recompensas */}
                {clienteEncontrado && (
                  <div className="alert alert-secondary">
                    <p className="mb-1"><strong>Cliente:</strong> {clienteEncontrado.cliente.nombre}</p>
                    {clienteEncontrado.recompensas.length > 0 ? (
                      clienteEncontrado.recompensas.map(rec => (
                        <div key={rec.id} className="mt-2">
                          <p className="mb-1 small">{rec.nombre}</p>
                          <button
                            className="btn btn-sm btn-success w-100"
                            onClick={() => handleAplicarRecompensa(rec)}
                            disabled={recompensaAplicadaId !== null}
                          >
                            {recompensaAplicadaId === rec.id ? 'Recompensa Aplicada' : (recompensaAplicadaId ? 'Ya se aplicó otra' : 'Aplicar Recompensa')}
                          </button>
                        </div>
                      ))
                    ) : (<p className="mb-0">Este cliente no tiene recompensas disponibles.</p>)}
                  </div>
                )}
                <hr />
                {/* Lista de Items en el Ticket */}
                <ul className="list-group list-group-flush" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {ventaActual.length === 0 && <li className="list-group-item text-center text-muted">El ticket está vacío</li>}
                  
                  {ventaActual.map((item) => (
                    <li key={item.idUnicoTicket} className="list-group-item d-flex align-items-center justify-content-between p-1">
                      
                      <div className="me-auto" style={{ paddingRight: '10px' }}>
                        <span className={`me-auto ${item.esRecompensa ? 'text-success fw-bold' : ''}`}>{item.nombre}</span>
                        {/* --- NUEVO: Mostrar opciones en el ticket --- */}
                        {item.opcionesSeleccionadas && item.opcionesSeleccionadas.length > 0 && (
                          <ul className="list-unstyled small text-muted mb-0" style={{ marginTop: '-3px' }}>
                            {item.opcionesSeleccionadas.map(opcion => (
                              <li key={opcion.id}>+ {opcion.nombre}</li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="d-flex align-items-center">
                        <button className="btn btn-outline-secondary btn-sm" onClick={() => decrementarCantidad(item.idUnicoTicket, item.id, item.esRecompensa)} disabled={item.esRecompensa}>-</button>
                        <span className="mx-2">{item.cantidad}</span>
                        <button className="btn btn-outline-secondary btn-sm" onClick={() => incrementarCantidad(item.idUnicoTicket, item.id, item.esRecompensa)} disabled={item.esRecompensa}>+</button>
                      </div>
                      <span className="mx-3" style={{ minWidth: '60px', textAlign: 'right' }}>${(item.cantidad * Number(item.precioFinal)).toFixed(2)}</span>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => eliminarProducto(item.idUnicoTicket, item.id, item.esRecompensa)} >&times;</button>
                    </li>
                  ))}
                </ul>
                <hr />
                {/* Total y Botones */}
                <h4>Total: ${totalVenta.toFixed(2)}</h4>
                <div className="d-grid gap-2 mt-3">
                  {/* --- CAMBIO 5: Confirmado, onClick llama a handleCobrar --- */}
                  <button className="btn btn-success" onClick={handleCobrar} disabled={ventaActual.length === 0}>Cobrar</button>
                  <button className="btn btn-danger" onClick={limpiarVenta}>Cancelar Venta</button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    // --- Pestaña Historial de Ventas POS del Día ---
    if (activeTab === 'historial') {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="mb-4">Ventas del Punto de Venta (Hoy)</h1>
          {ventasDelDia.length === 0 ? <p>No se han registrado ventas en el POS hoy.</p> : (
            <div className="list-group">
              {ventasDelDia.map(venta => (
                <div key={venta.id} className="list-group-item">
                  <div className="d-flex w-100 justify-content-between">
                    <h5 className="mb-1">Venta #{venta.id} (Empleado: {venta.nombre_empleado || 'N/A'})</h5>
                    <small>{new Date(venta.fecha).toLocaleTimeString()}</small>
                  </div>
                  <p className="mb-1">Total: <strong>${Number(venta.total).toFixed(2)}</strong></p>
                  <small>Método de Pago: {venta.metodo_pago}</small>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      );
    }
  };

  // --- Render Principal ---
  return (
    <div>
      {/* Navegación por Pestañas */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item"><button className={`nav-link ${activeTab === 'pedidos' ? 'active' : ''}`} onClick={() => setActiveTab('pedidos')}>Pedidos en Línea</button></li>
        <li className="nav-item"><button className={`nav-link ${activeTab === 'pos' ? 'active' : ''}`} onClick={() => setActiveTab('pos')}>Punto de Venta</button></li>
        <li className="nav-item"><button className={`nav-link ${activeTab === 'historial' ? 'active' : ''}`} onClick={() => setActiveTab('historial')}>Ventas del Día (POS)</button></li>
      </ul>
      
      {/* Contenido de la Pestaña Activa */}
      {renderContenido()}
      
      {/* Modal para Detalles del Pedido */}
      {showDetailsModal && (<DetallesPedidoModal pedido={selectedOrderDetails} onClose={handleCloseDetailsModal} />)}

      {/* --- NUEVO --- */}
      {/* 5. Renderizamos el modal de producto aquí */}
      {productoSeleccionadoParaModal && (
        <ProductDetailModal
          product={productoSeleccionadoParaModal}
          onClose={handleCloseProductModal}
          onAddToCart={agregarProductoAVenta} 
        />
      )}

      {/* --- CAMBIO 6: Renderizar el nuevo modal de pago --- */}
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