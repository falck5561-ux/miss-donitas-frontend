import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '../services/api';
import AuthContext from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import ProductDetailModal from '../components/ProductDetailModal';

function CombosPage() {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);
  const { agregarProductoAPedido } = useCart();
  const navigate = useNavigate();
  const [selectedCombo, setSelectedCombo] = useState(null);

  useEffect(() => {
    const fetchCombos = async () => {
      try {
        const response = await apiClient.get('/combos');
        setCombos(response.data);
      } catch (err) {
        setError('No se pudieron cargar los combos en este momento.');
        console.error("Error en CombosPage:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCombos();
  }, []);

  const handleAddToCart = (combo, precioFinal) => {
    if (!user) {
      toast.error('Por favor, inicia sesión para añadir al carrito.');
      navigate('/login');
      return;
    }
    
    const itemParaCarrito = {
      ...combo,
      precio: precioFinal,
    };
    
    agregarProductoAPedido(itemParaCarrito);
    navigate('/hacer-un-pedido');
  };

  if (loading) {
    return <div className="text-center p-5"><div className="spinner-border"></div></div>;
  }
  if (error) {
    return <div className="alert alert-danger text-center">{error}</div>;
  }

  return (
    <>
      <motion.div
        className="container section-padding"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-center mb-5">Nuestros Combos Especiales</h1>
        
        {!loading && !error && combos.length === 0 && (
          <div className="text-center p-5 rounded" style={{backgroundColor: 'var(--bs-tertiary-bg)'}}>
            <h3>No hay combos especiales disponibles por el momento.</h3>
          </div>
        )}

        {!loading && !error && combos.length > 0 && (
          <div className="row g-4">
            {combos.map((combo, index) => {
              const esOferta = combo.en_oferta && combo.descuento_porcentaje > 0;
              const precioOriginal = Number(combo.precio);
              let precioFinal = precioOriginal;

              if (esOferta) {
                precioFinal = precioOriginal * (1 - combo.descuento_porcentaje / 100);
              }

              const displayImage = combo.imagen_url || `https://placehold.co/400x300/d7ccc8/4a2c2a?text=${encodeURIComponent(combo.nombre || combo.titulo)}`;

              return (
                <motion.div
                  key={combo.id}
                  className="col-md-6 col-lg-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedCombo(combo)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* --- ¡CORRECCIÓN APLICADA AQUÍ! --- */}
                  {/* Se añade la clase 'en-oferta' si el combo tiene descuento */}
                  <div className={`card h-100 shadow-sm overflow-hidden position-relative ${esOferta ? 'en-oferta' : ''}`}>
                    {esOferta && (
                      <div className="discount-badge">
                        -{combo.descuento_porcentaje}%
                      </div>
                    )}

                    <img
                      src={displayImage}
                      className="card-img-top"
                      alt={combo.nombre || combo.titulo}
                      style={{ height: '220px', objectFit: 'cover' }}
                    />
                    <div className="card-body d-flex flex-column">
                      <h4 className="card-title flex-grow-1">{combo.nombre || combo.titulo}</h4>
                    </div>
                    <div className="card-footer bg-transparent border-top-0 pb-3 d-flex justify-content-between align-items-center">
                      <div>
                        {esOferta ? (
                          <>
                            <span className="text-muted text-decoration-line-through me-2">${precioOriginal.toFixed(2)}</span>
                            <span className="fw-bold fs-4 text-success">${precioFinal.toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="fw-bold fs-4">${precioOriginal.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {selectedCombo && (
        <ProductDetailModal
          product={selectedCombo}
          onClose={() => setSelectedCombo(null)}
          onAddToCart={(product) => {
            const esOferta = product.en_oferta && product.descuento_porcentaje > 0;
            const precioOriginal = Number(product.precio);
            const precioFinal = esOferta ? precioOriginal * (1 - product.descuento_porcentaje / 100) : precioOriginal;
            
            handleAddToCart(product, precioFinal);
            setSelectedCombo(null);
          }}
        />
      )}
    </>
  );
}

export default CombosPage;