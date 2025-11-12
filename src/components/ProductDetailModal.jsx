import React, { useContext, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import AuthContext from '../context/AuthContext';
import { getProductById } from '../services/productService'; 

// (Los estilos no cambian)
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
    overflowY: 'auto',
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
    zIndex: 10,
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderTopLeftRadius: '15px',
    borderTopRightRadius: '15px',
    backgroundColor: 'var(--bs-tertiary-bg)',
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

  const [fullProduct, setFullProduct] = useState(product); 
  const [selectedOptions, setSelectedOptions] = useState({});
  const [totalPrice, setTotalPrice] = useState(0); 
  const [loadingToppings, setLoadingToppings] = useState(true);

  // --- 1. EFECTO PARA BUSCAR DATOS Y DECIDIR ---
  useEffect(() => {
    if (product?.id) {
      setSelectedOptions({}); 
      
      getProductById(product.id)
        .then(data => {
          const tieneOpciones = data.grupos_opciones && data.grupos_opciones.length > 0;

          if (tieneOpciones) {
            // CASO 1: SÍ tiene opciones
            setFullProduct(data); 
            setLoadingToppings(false); // Deja que el modal se renderice
          } else {
            // CASO 2: NO tiene opciones
            onAddToCart(data); // Añade directo
            onClose(); // Cierra el modal (que nunca fue visible)
          }
        })
        .catch(err => {
          console.error("Error al cargar detalles del producto:", err);
          onClose(); 
        });
    }
  }, [product, onAddToCart, onClose]);

  
  // --- 2. EFECTO PARA CALCULAR EL PRECIO TOTAL (Corregido) ---
  useEffect(() => {
    if (!fullProduct) return;

    const basePrice = Number(fullProduct.precio);
    let optionsPrice = 0;
    
    fullProduct.grupos_opciones?.forEach(grupo => {
      const selection = selectedOptions[grupo.id];
      
      if (grupo.tipo_seleccion === 'unico' && selection) {
        optionsPrice += parseFloat(selection.precio_adicional);
      } 
      else if (grupo.tipo_seleccion === 'multiple' && selection) {
        Object.values(selection).forEach(optionObj => {
          optionsPrice += parseFloat(optionObj.precio_adicional);
        });
      }
    });

    setTotalPrice(basePrice + optionsPrice);

  }, [fullProduct, selectedOptions]);

  // --- 3. MANEJADORES DE SELECCIÓN (Sin cambios) ---
  const handleRadioChange = (grupo, opcion) => {
    setSelectedOptions(prev => ({
      ...prev,
      [grupo.id]: opcion
    }));
  };

  const handleCheckboxChange = (grupo, opcion, isChecked) => {
    setSelectedOptions(prev => {
      const currentGroupSelections = prev[grupo.id] || {};
      
      if (isChecked) {
        currentGroupSelections[opcion.id] = opcion;
      } else {
        delete currentGroupSelections[opcion.id];
      }

      return {
        ...prev,
        [grupo.id]: currentGroupSelections
      };
    });
  };

  // --- 4. MANEJADOR PARA AÑADIR AL CARRITO (Corregido) ---
  const handleAddToCart = () => {
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

    const tieneOpciones = opcionesParaCarrito.length > 0;

    const cartProduct = {
      ...fullProduct,
      precio: totalPrice, 
      opcionesSeleccionadas: opcionesParaCarrito,
      cartItemId: tieneOpciones ? `${fullProduct.id}-${Date.now()}` : null 
    };

    onAddToCart(cartProduct);
    onClose(); 
  };


  // --- Renderizado ---
  if (!product) return null; 

  const displayImage = fullProduct.imagen_url
    ? fullProduct.imagen_url
    : `https://placehold.co/500x250/333333/CCCCCC?text=${encodeURIComponent(fullProduct.nombre)}`;
    
  const placeholderImage = `https://placehold.co/500x250/333333/CCCCCC?text=${encodeURIComponent(fullProduct.nombre)}`;

  
  // 🚨 SOLUCIÓN BUG 2 (Estético):
  // Si está cargando, no retornamos NADA.
  // Esto evita el "flash" del spinner en los productos sin opciones.
  // El modal solo se renderizará cuando SÍ tenga opciones y esté listo.
  if (loadingToppings) {
    return null;
  }
  
  // Si no está cargando (y tiene opciones), muestra el modal:
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
        <div style={modalStyles.header}>
          <button style={modalStyles.closeButton} onClick={onClose}>&times;</button>
          <img 
            src={displayImage} 
            alt={fullProduct.nombre} 
            style={modalStyles.productImage}
            onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
          />
        </div>

        <div style={modalStyles.body}>
          <h2 style={modalStyles.productTitle}>{fullProduct.nombre}</h2>
        
          {fullProduct.descripcion && (
            <p style={modalStyles.productDescription}>{fullProduct.descripcion}</p>
          )}

          <div style={modalStyles.optionsContainer}>
            {!loadingToppings && fullProduct.grupos_opciones?.length > 0 && 
              fullProduct.grupos_opciones.map(grupo => (
                <div key={grupo.id} style={modalStyles.optionGroup}>
                  <h5 style={modalStyles.optionGroupTitle}>{grupo.nombre}</h5>
                  
                  {grupo.tipo_seleccion === 'unico' && (
                    <>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name={`grupo-${grupo.id}`}
                          id={`opcion-ninguna-${grupo.id}`}
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
                  
                  {grupo.tipo_seleccion === 'multiple' && grupo.opciones.map(opcion => (
                    <div className="form-check" key={opcion.id}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`opcion-${opcion.id}`}
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

        <div style={modalStyles.footer}>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <span className="fs-3 fw-bold">${totalPrice.toFixed(2)}</span>
              
              {fullProduct.en_oferta && Number(fullProduct.precio_original) > Number(fullProduct.precio) && (
                <span className="text-muted text-decoration-line-through ms-2">${Number(fullProduct.precio_original).toFixed(2)}</span>
              )}
            </div>

            {/*
              * ✅ SOLUCIÓN BUG 1: 
              * Se elimina la condición {(!user || user.rol === 'Cliente') && ...}
              * para que el botón aparezca siempre.
            */}
            <button className="btn btn-primary" onClick={handleAddToCart}>
              {'Hacer Pedido'}
            </button>
            
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
}

export default ProductDetailModal;