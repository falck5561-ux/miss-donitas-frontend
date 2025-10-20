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

const styles = { /* Tus estilos se mantienen igual */ };

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
  
  // Este estado ahora guardará tanto productos como combos
  const [menuItems, setMenuItems] = useState([]); 

  const [tipoOrden, setTipoOrden] = useState('llevar');
  const [direccion, setDireccion] = useState(null);
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [calculandoEnvio, setCalculandoEnvio] = useState(false);
  const [misPedidos, setMisPedidos] = useState([]);
  const [misRecompensas, setMisRecompensas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // ... (el resto de tus estados se mantienen igual)
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

  // --- ¡CAMBIO PRINCIPAL AQUÍ! ---
  // Este useEffect ahora pide productos Y combos, y los une.
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError('');
      try {
        const [productosRes, combosRes, direccionRes] = await Promise.allSettled([
          apiClient.get('/productos'),
          apiClient.get('/combos'), // Pide los combos activos
          apiClient.get('/usuarios/mi-direccion')
        ]);

        let combinedMenu = [];

        // Procesar productos
        if (productosRes.status === 'fulfilled') {
          const productosData = productosRes.value.data.map(p => ({...p, tipo: 'producto'}));
          combinedMenu = [...combinedMenu, ...productosData];
        } else {
          console.error("Error cargando productos:", productosRes.reason);
        }

        // Procesar y estandarizar combos
        if (combosRes.status === 'fulfilled') {
          const combosData = combosRes.value.data.map(c => ({
            id: `combo-${c.id}`, // ID único
            nombre: c.titulo,    // Estandarizar 'titulo' a 'nombre'
            precio: c.precio,
            descripcion: c.descripcion,
            imagenes: c.imagenes,
            en_oferta: c.descuento_porcentaje > 0,
            descuento_porcentaje: c.descuento_porcentaje,
            tipo: 'combo'
          }));
          combinedMenu = [...combinedMenu, ...combosData];
        } else {
          console.error("Error cargando combos:", combosRes.reason);
        }

        if (combinedMenu.length > 0) {
          setMenuItems(combinedMenu);
        } else {
          throw new Error('No se pudieron cargar los productos. Por favor, intenta más tarde.');
        }

        if (direccionRes.status === 'fulfilled' && direccionRes.value.data) {
          setDireccionGuardada(direccionRes.value.data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // ... (El resto de tus useEffect y funciones se mantienen igual)
  // ... (El useEffect para fetchTabData es correcto)
  
  const limpiarPedidoCompleto = () => {
    limpiarPedido();
    // ...
  };

  // ... (El resto de tus funciones como handleLocationSelect, handleProcederAlPago, etc., se mantienen igual)
  
  return (
    <div>
      {/* ... (Tu JSX de Tabs, loading, error, etc., se mantiene igual) ... */}

      {!loading && activeTab === 'crear' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="row">
          <div className="col-md-8">
            <h2>Elige tus Productos</h2>
            <div className="row g-3">
              {/* --- CAMBIO AQUÍ --- */}
              {/* Ahora mapeamos sobre 'menuItems', que tiene productos y combos */}
              {menuItems?.map(item => {
                const precioConDescuento = item.en_oferta 
                  ? Number(item.precio) * (1 - item.descuento_porcentaje / 100)
                  : Number(item.precio);
                
                return (
                  <div key={item.id} className="col-md-4 col-lg-3">
                    <div 
                      className={`card h-100 text-center shadow-sm position-relative ${item.en_oferta ? 'en-oferta' : ''}`}
                      onClick={() => agregarProductoAPedido(item)} 
                      style={{ cursor: 'pointer' }}
                    >
                      {item.en_oferta && <span className="discount-badge">-{item.descuento_porcentaje}%</span>}
                      <div className="card-body d-flex flex-column justify-content-center pt-4">
                        <h5 className="card-title">{item.nombre}</h5> {/* Usamos 'nombre' que ya está estandarizado */}
                        
                        {item.en_oferta ? (
                          <div>
                            <span className="text-muted text-decoration-line-through me-2">${Number(item.precio).toFixed(2)}</span>
                            <span className="card-text fw-bold fs-5">${precioConDescuento.toFixed(2)}</span>
                          </div>
                        ) : (
                          <p className="card-text fw-bold fs-5">${Number(item.precio).toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="col-md-4 columna-carrito-escritorio">
            {/* ... (Tu JSX del carrito a la derecha se mantiene igual) ... */}
          </div>
        </motion.div>
      )}

      {/* ... (El resto de tu JSX para "Mis Pedidos", "Recompensas" y Modales se mantiene igual) ... */}
    </div>
  );
}

export default ClientePage;

