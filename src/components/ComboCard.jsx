// Archivo: src/components/ComboCard.jsx

import React, { useContext } from 'react'; // 1. Importa useContext
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; // 2. Importa useNavigate para la redirección
import { CartContext } from '../context/CartContext'; // 3. Importa tu contexto del carrito (asegúrate de que la ruta sea correcta)

function ComboCard({ combo }) {
  const navigate = useNavigate(); // 4. Inicializa el hook de navegación
  const { agregarAlCarrito } = useContext(CartContext); // 5. Obtiene la función para agregar al carrito desde el contexto

  // --- LÓGICA DE PRECIOS Y DESCUENTOS (sin cambios) ---
  const precioOriginal = parseFloat(combo.precio || 0);
  const precioFinal = parseFloat(combo.precio_final || precioOriginal);
  const tieneDescuento = precioOriginal > precioFinal;
  let descuento = 0;
  if (tieneDescuento && precioOriginal > 0) {
    descuento = ((precioOriginal - precioFinal) / precioOriginal) * 100;
  }
  const imageUrl = combo.imagen_url || `https://placehold.co/400x300/2a2a2a/f5f5f5?text=${combo.nombre}`;

  // --- NUEVA FUNCIÓN PARA EL BOTÓN ---
  const handleBuyClick = (e) => {
    // 6. ¡CLAVE! Detiene la propagación para evitar dobles notificaciones
    e.stopPropagation();

    // 7. Agrega el combo al carrito
    agregarAlCarrito(combo);

    // (Opcional) Aquí puedes llamar a una función para mostrar una notificación si la tienes
    // mostrarNotificacion(`${combo.nombre} agregado al carrito!`);

    // 8. Redirige al usuario a la página de su pedido
    navigate('/hacer-un-pedido'); // Asegúrate de que esta sea la ruta correcta
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      className="col"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.4 }}
    >
      <div className="product-card">
        <div className="card-image-container">
          <img src={imageUrl} alt={combo.nombre} />
          {tieneDescuento && (
            <span className="discount-badge">-{descuento.toFixed(0)}%</span>
          )}
        </div>

        <div className="card-body">
          <h3 className="card-title">{combo.nombre || 'Nombre no disponible'}</h3>
          
          <div className="card-price">
            {tieneDescuento ? (
              <>
                <span className="original-price">${precioOriginal.toFixed(2)}</span>
                <span className="discounted-price">${precioFinal.toFixed(2)}</span>
              </>
            ) : (
              <span className="discounted-price">${precioFinal.toFixed(2)}</span>
            )}
          </div>
          
          {/* 9. Asigna la nueva función al evento onClick del botón */}
          <button className="btn-buy" onClick={handleBuyClick}>
            ¡Lo Quiero!
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default ComboCard;