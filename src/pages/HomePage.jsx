import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMenuData } from '../hooks/useMenuData';
import ProductCard from '../components/ProductCard';
import AuthContext from '../context/AuthContext';
import ProductDetailModal from '../components/ProductDetailModal';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

function HomePage() {
  const { productos, loading, error } = useMenuData();
  const { user } = useContext(AuthContext);
  const { agregarProductoAPedido } = useCart();
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleShowDetails = (product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailModal(false);
    setSelectedProduct(null);
  };

  const handleAddToCartAndNavigate = (product) => {
    agregarProductoAPedido(product);
    handleCloseDetails();
    navigate('/hacer-un-pedido');
  };

  /* =============================================================== */
  /* === INICIO DE LA MODIFICACIÓN: ESTILO DEL HERO SIMPLIFICADO === */
  /* =============================================================== */
  // Tu App.css ya maneja el degradado, el color de texto y la sombra.
  // El estilo en línea ahora solo necesita proveer la imagen de fondo.
  const heroStyle = {
    backgroundImage: `url('/hero-background.jpg')`,
  };
  /* =============================================================== */
  /* === FIN DE LA MODIFICACIÓN === */
  /* =============================================================== */


  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      
      {/* --- INICIO DEL NUEVO HERO "ALINEACIÓN EDITORIAL" --- */}
      {/* Se aplica el 'heroStyle' y las clases CSS. App.css se encarga del resto. */}
      <div className="hero-classic-section hero-full-width" style={heroStyle}>
        
        {/* Contenedor para alinear a la izquierda */}
        <motion.div 
          className="hero-content-left"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2, type: 'spring' }}
        >
          <img 
            src="/miss-donitas-logo.png" 
            alt="Miss Donitas Logo" 
            className="hero-logo-main mb-4" 
          />
          
          <h1 className="display-4 fw-bold">Felicidad en Cada Mordida</h1>
          <p className="fs-4">Donas frescas, postres deliciosos y atrevidas botanas picantes.</p>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/hacer-un-pedido" className="btn btn-primary btn-lg mt-3 shadow-lg">
              ¡Haz tu Pedido!
            </Link>
          </motion.div>
        </motion.div> {/* Fin de hero-content-left */}

      </div>
      {/* --- FIN DEL NUEVO HERO --- */}


      {/* --- El resto del código de la página sigue igual --- */}
      {loading && <div className="text-center my-5"><div className="spinner-border" role="status"></div></div>}
      {error && <div className="alert alert-danger container">{error}</div>}
      
      {!loading && !error && (
        <div className="container section-padding">
          <h2 className="text-center mb-4 display-5">🍩 Elige tu Antojo 🌶️</h2>
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
            {productos.map((producto, index) => (
              <ProductCard 
                key={producto.id} 
                product={producto} 
                index={index}
                onCardClick={handleShowDetails} 
              />
            ))}
          </div>
        </div>
      )}

      {showDetailModal && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={handleCloseDetails}
          onAddToCart={handleAddToCartAndNavigate} 
        />
      )}
    </motion.div>
  );
}

export default HomePage;