import React, { useContext, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AuthContext from '../context/AuthContext';
// --- NUEVA IMPORTACIÓN ---
import { getProductById } from '../services/productService'; 

const modalStyles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1050,
  },
  content: {
    width: '90%',
    maxWidth: '500px',
    background: 'var(--bs-card-bg)',
    borderRadius: '15px',
    // CAMBIO: Aumentamos la altura máxima y permitimos scroll
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    color: 'var(--bs-body-color)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  },
  header: {
    position: 'relative',
    width: '100%',
    height: '250px',
  },
  body: {
    padding: '1.5rem 2rem 2rem 2rem',
    overflowY: 'auto', // Permite scroll si el contenido es mucho
  },
  footer: {
    padding: '1.5rem 2rem',
    borderTop: '1px solid var(--bs-border-color)',
    backgroundColor: 'var(--bs-tertiary-bg)',
    borderBottomLeftRadius: '15px',
    borderBottomRightRadius: '15px',
  },
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(5px)',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
    color: 'white',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    zIndex: 10, // Asegura que esté sobre la imagen
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderTopLeftRadius: '15px',
    borderTopRightRadius: '15px',
    backgroundColor: 'var(--bs-tertiary-bg)', // Color de fondo mientras carga
  },
  productTitle: {
    fontFamily: "'Playfair Display', serif",
    marginBottom: '0.5rem',
  },
  productDescription: {
    margin: '1rem 0',
    fontSize: '1rem',
    lineHeight: '1.6',
  },
  // --- NUEVOS ESTILOS PARA OPCIONES ---
  optionsContainer: {
    marginTop: '1.5rem',
  },
  optionGroup: {
    marginBottom: '1.5rem',
    padding: '1rem',
    border: '1px solid var(--bs-border-color)',
    borderRadius: '8px',
  },
  optionGroupTitle: {
    fontWeight: 'bold',
    marginBottom: '0.75rem',
    fontSize: '1.1rem',
    color: 'var(--bs-heading-color)',
  },
};

function ProductDetailModal({ product, onClose, onAddToCart }) {
  const { user } = useContext(AuthContext);

  // --- NUEVOS ESTADOS ---
  const [fullProduct, setFullProduct] = useState(product); // Inicia con la data básica
  const [selectedOptions, setSelectedOptions] = useState({}); // Opciones seleccionadas
  const [totalPrice, setTotalPrice] = useState(0); // Precio total calculado
  const [loadingToppings, setLoadingToppings] = useState(true);

  // --- 1. EFECTO PARA BUSCAR LOS DATOS COMPLETOS DEL PRODUCTO (CON TOPPINGS) ---
  useEffect(() => {
    if (product?.id) {
      setLoadingToppings(true);
      setSelectedOptions({}); // Resetea las opciones al cambiar de producto
      
      getProductById(product.id)
        .then(data => {
          setFullProduct(data); // Carga la data completa (incluye 'grupos_opciones')
        })
        .catch(err => {
          console.error("Error al cargar detalles del producto:", err);
          // Si falla, nos quedamos con la data básica del 'product' prop
          setFullProduct(product); 
        })
        .finally(() => {
          setLoadingToppings(false);
        });
    }
  }, [product]); // Se ejecuta cada vez que el 'product' (de la prop) cambia

  // --- 2. EFECTO PARA CALCULAR EL PRECIO TOTAL ---
  useEffect(() => {
    if (!fullProduct) return;

    // Calcula el precio base (con o sin oferta)
    const basePrice = fullProduct.en_oferta && fullProduct.descuento_porcentaje > 0
      ? Number(fullProduct.precio) * (1 - fullProduct.descuento_porcentaje / 100)
      : Number(fullProduct.precio);

    // Calcula el precio de las opciones
    let optionsPrice = 0;
    
    fullProduct.grupos_opciones?.forEach(grupo => {
      const selection = selectedOptions[grupo.id];
      
      if (grupo.tipo_seleccion === 'unico' && selection) {
        optionsPrice += parseFloat(selection.precio_adicional);
      } 
      else if (grupo.tipo_seleccion === 'multiple' && selection) {
        // 'selection' es un objeto { opId1: opObj1, opId2: opObj2 }
        Object.values(selection).forEach(optionObj => {
          optionsPrice += parseFloat(optionObj.precio_adicional);
        });
      }
    });

    setTotalPrice(basePrice + optionsPrice);

  }, [fullProduct, selectedOptions]); // Se recalcula si el producto o las opciones cambian

  // --- 3. MANEJADORES DE SELECCIÓN ---
  const handleRadioChange = (grupo, opcion) => {
    setSelectedOptions(prev => ({
      ...prev,
      [grupo.id]: opcion // 'opcion' es el objeto completo o 'null'
    }));
  };

  const handleCheckboxChange = (grupo, opcion, isChecked) => {
    setSelectedOptions(prev => {
      const currentGroupSelections = prev[grupo.id] || {};
      
      if (isChecked) {
        currentGroupSelections[opcion.id] = opcion; // Agrega el objeto opción
      } else {
        delete currentGroupSelections[opcion.id]; // Elimina la opción
      }

      return {
        ...prev,
        [grupo.id]: currentGroupSelections
      };
    });
  };

  // --- 4. MANEJADOR PARA AÑADIR AL CARRITO ---
  const handleAddToCart = () => {
    // Prepara el array de opciones seleccionadas para el carrito
    const opcionesParaCarrito = [];
    fullProduct.grupos_opciones?.forEach(grupo => {
      const selection = selectedOptions[grupo.id];
      if (grupo.tipo_seleccion === 'unico' && selection) {
        opcionesParaCarrito.push(selection);
      } 
      else if (grupo.tipo_seleccion === 'multiple' && selection) {
        opcionesParaCarrito.push(...Object.values(selection));
      }
    });

    // Crea el objeto final para el carrito
    const cartProduct = {
      ...fullProduct,
      precioFinal: totalPrice, // Envía el precio ya calculado
      opcionesSeleccionadas: opcionesParaCarrito, // Envía un array plano de opciones
      // Añade un ID único para el carrito (importante si se añade el mismo producto con diferentes toppings)
      cartItemId: `${fullProduct.id}-${Date.now()}` 
    };

    onAddToCart(cartProduct);
    onClose(); // Cierra el modal después de añadir
  };

  if (!product) return null; // No renderiza nada si no hay producto

  // Fallbacks de imagen (como en tu código original)
  const displayImage = fullProduct.imagen_url
    ? fullProduct.imagen_url
    : `https://placehold.co/500x250/333333/CCCCCC?text=${encodeURIComponent(fullProduct.nombre)}`;
    
  const placeholderImage = `https://placehold.co/500x250/333333/CCCCCC?text=${encodeURIComponent(fullProduct.nombre)}`;

  return (
    <motion.div
      style={modalStyles.backdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
    >
      <motion.div
        style={modalStyles.content}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- HEADER CON IMAGEN Y BOTÓN DE CERRAR --- */}
        <div style={modalStyles.header}>
          <button style={modalStyles.closeButton} onClick={onClose}>&times;</button>
          <img 
            src={displayImage} 
            alt={fullProduct.nombre} 
            style={modalStyles.productImage}
            onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
          />
        </div>

        {/* --- BODY CON INFO Y OPCIONES (SCROLLABLE) --- */}
        <div style={modalStyles.body}>
          <h2 style={modalStyles.productTitle}>{fullProduct.nombre}</h2>
        
          {fullProduct.descripcion && (
            <p style={modalStyles.productDescription}>{fullProduct.descripcion}</p>
          )}

          {/* --- SECCIÓN DE OPCIONES (TOPPINGS) --- */}
          <div style={modalStyles.optionsContainer}>
            {loadingToppings && (
              <div className="text-center">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Cargando opciones...</span>
                </div>
              </div>
            )}

            {!loadingToppings && fullProduct.grupos_opciones?.map(grupo => (
              <div key={grupo.id} style={modalStyles.optionGroup}>
                <h5 style={modalStyles.optionGroupTitle}>{grupo.nombre}</h5>
                
                {/* --- Render Opciones de SELECCIÓN ÚNICA (Radios) --- */}
                {grupo.tipo_seleccion === 'unico' && (
                  <>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name={`grupo-${grupo.id}`}
                        id={`opcion-ninguna-${grupo.id}`}
                        // Seleccionado si no hay nada en el estado para este grupo
                        checked={!selectedOptions[grupo.id]}
                        onChange={() => handleRadioChange(grupo, null)} 
                      />
                      <label className="form-check-label" htmlFor={`opcion-ninguna-${grupo.id}`}>
                        Sin opción
                      </label>
                    </div>
                    {grupo.opciones.map(opcion => (
                      <div className="form-check" key={opcion.id}>
                        <input
                          className="form-check-input"
                          type="radio"
                          name={`grupo-${grupo.id}`}
                          id={`opcion-${opcion.id}`}
                          // Seleccionado si el ID de esta opción está en el estado
                          checked={selectedOptions[grupo.id]?.id === opcion.id}
                          onChange={() => handleRadioChange(grupo, opcion)}
                        />
                        <label className="form-check-label d-flex justify-content-between" htmlFor={`opcion-${opcion.id}`}>
                          <span>{opcion.nombre}</span>
                          <span className="text-success ms-2">+${parseFloat(opcion.precio_adicional).toFixed(2)}</span>
                        </label>
                      </div>
                    ))}
                  </>
                )}
                
                {/* --- Render Opciones de SELECCIÓN MÚLTIPLE (Checkboxes) --- */}
                {grupo.tipo_seleccion === 'multiple' && grupo.opciones.map(opcion => (
                  <div className="form-check" key={opcion.id}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`opcion-${opcion.id}`}
                      // Seleccionado si la opción existe en el objeto del grupo
                      checked={!!selectedOptions[grupo.id]?.[opcion.id]}
                      onChange={(e) => handleCheckboxChange(grupo, opcion, e.target.checked)}
                    />
                    <label className="form-check-label d-flex justify-content-between" htmlFor={`opcion-${opcion.id}`}>
                      <span>{opcion.nombre}</span>
                      <span className="text-success ms-2">+${parseFloat(opcion.precio_adicional).toFixed(2)}</span>
                    </label>
                  </div>
                ))}
              </div>
            ))}
          </div>

        </div>

        {/* --- FOOTER CON PRECIO Y BOTÓN --- */}
        <div style={modalStyles.footer}>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              {/* --- PRECIO TOTAL DINÁMICO --- */}
              <span className="fs-3 fw-bold">${totalPrice.toFixed(2)}</span>
              {/* Muestra el precio base tachado si hay oferta */}
              {fullProduct.en_oferta && fullProduct.descuento_porcentaje > 0 && (
                <span className="text-muted text-decoration-line-through ms-2">${Number(fullProduct.precio).toFixed(2)}</span>
              )}
            </div>

            {(!user || user.rol === 'Cliente') && (
              // --- BOTÓN DE AÑADIR CON NUEVA FUNCIÓN ---
              <button className="btn btn-primary" onClick={handleAddToCart}>
                Hacer Pedido
              </button>
            )}
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
}

export default ProductDetailModal;
