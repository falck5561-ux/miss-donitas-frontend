import React, { useContext, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AuthContext from '../context/AuthContext';
import { getProductById } from '../services/productService'; 
import { useTheme } from '../context/ThemeContext';

// Detectar si es móvil (simple check)
const isMobile = window.innerWidth <= 768;

// --- FUNCIÓN DE ESTILOS DINÁMICOS (PICANTE VS NORMAL) ---
const getModalStyles = (isPicante) => ({
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
    width: isMobile ? '95%' : '90%',
    maxWidth: '500px',
    background: isPicante ? '#1E1E1E' : '#FFFFFF', // Fondo oscuro o blanco
    color: isPicante ? '#FFFFFF' : '#333333',     // Texto blanco o oscuro
    borderRadius: '15px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: isPicante ? '0 10px 30px rgba(255, 23, 68, 0.15)' : '0 10px 30px rgba(0,0,0,0.2)',
    border: isPicante ? '1px solid #333' : 'none',
    margin: isMobile ? '10px' : '0',
  },
  header: {
    position: 'relative',
    width: '100%',
    height: isMobile ? '180px' : '250px',
    flexShrink: 0,
  },
  body: {
    padding: '1.5rem',
    overflowY: 'auto',
  },
  footer: {
    padding: '1rem 1.5rem',
    borderTop: isPicante ? '1px solid #333' : '1px solid #dee2e6',
    backgroundColor: isPicante ? '#252525' : '#f8f9fa',
    borderBottomLeftRadius: '15px',
    borderBottomRightRadius: '15px',
  },
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'rgba(0,0,0,0.5)',
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
    zIndex: 10,
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderTopLeftRadius: '15px',
    borderTopRightRadius: '15px',
    backgroundColor: isPicante ? '#333' : '#e9ecef',
  },
  productTitle: {
    fontFamily: "'Playfair Display', serif",
    marginBottom: '0.5rem',
    fontSize: isMobile ? '1.5rem' : '2rem',
    fontWeight: 'bold',
  },
  productDescription: {
    margin: '0.5rem 0 1rem 0',
    fontSize: '0.95rem',
    lineHeight: '1.5',
    color: isPicante ? '#AAAAAA' : '#6c757d',
  },
  optionsContainer: {
    marginTop: '1rem',
  },
  optionGroup: {
    marginBottom: '1rem',
    padding: '0.75rem',
    border: isPicante ? '1px solid #444' : '1px solid #dee2e6',
    borderRadius: '8px',
    backgroundColor: isPicante ? '#2C2C2C' : '#FFFFFF',
  },
  optionGroupTitle: {
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    fontSize: '1rem',
    color: isPicante ? '#FFD700' : '#212529',
  },
  priceTag: {
    color: isPicante ? '#FF1744' : '#000',
    fontWeight: 'bold',
    fontSize: '1.2rem',
  }
});

function ProductDetailModal({ product, onClose, onAddToCart }) {
  const { user } = useContext(AuthContext); 
  const { theme } = useTheme(); 
  const isPicante = theme === 'picante';
  const styles = getModalStyles(isPicante);

  const [fullProduct, setFullProduct] = useState(product); 
  const [selectedOptions, setSelectedOptions] = useState({});
  const [totalPrice, setTotalPrice] = useState(0); 
  const [loadingToppings, setLoadingToppings] = useState(true);

  // --- 1. CARGA DE DATOS + LÓGICA DE APERTURA ---
  useEffect(() => {
    if (product?.id) {
      setSelectedOptions({}); 
      
      // Función auxiliar para procesar y decidir
      const processProductData = (data) => {
          // Unificación de campos (Combos vs Productos)
          const productoCompleto = {
             ...data,
             descripcion: data.descripcion || data.description || product.descripcion || '',
             nombre: data.nombre || data.titulo || product.nombre,
             categoria: data.categoria || product.categoria || (data.titulo ? 'Combos' : 'General')
          };

          const tieneOpciones = productoCompleto.grupos_opciones && productoCompleto.grupos_opciones.length > 0;
          
          // === CORRECCIÓN CLAVE ===
          // Abrimos el modal si tiene opciones O SI ES UN COMBO (para ver qué trae)
          const esCombo = productoCompleto.categoria === 'Combos';
          const debeAbrirModal = tieneOpciones || esCombo; 

          if (debeAbrirModal) {
            // CASO 1: Renderizar el Modal
            setFullProduct(productoCompleto); 
            setLoadingToppings(false); 
          } else {
            // CASO 2: Agregar directo (Producto simple sin opciones)
            onAddToCart(productoCompleto); 
            onClose(); 
          }
      };

      // Si ya viene completo desde el componente padre (ej: tiene grupos_opciones), usamos eso
      if (product.grupos_opciones && product.grupos_opciones.length > 0) {
         processProductData(product);
      } else {
         // Si no, buscamos en el backend
         getProductById(product.id)
            .then(data => processProductData(data))
            .catch(err => {
              console.error("Error al cargar detalles:", err);
              // Fallback: intentar abrir con lo que tenemos
              setFullProduct(product);
              setLoadingToppings(false);
            });
      }
    }
  }, [product, onAddToCart, onClose]);

  
  // --- 2. CÁLCULO DE PRECIO ---
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

  // --- 3. HANDLERS ---
  const handleRadioChange = (grupo, opcion) => {
    setSelectedOptions(prev => ({ ...prev, [grupo.id]: opcion }));
  };

  const handleCheckboxChange = (grupo, opcion, isChecked) => {
    setSelectedOptions(prev => {
      const currentGroupSelections = prev[grupo.id] || {};
      if (isChecked) currentGroupSelections[opcion.id] = opcion;
      else delete currentGroupSelections[opcion.id];
      return { ...prev, [grupo.id]: currentGroupSelections };
    });
  };

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


  // --- RENDERIZADO ---
  if (!product) return null; 

  // Selección de imagen con fallback
  const displayImage = fullProduct.imagen_url || (fullProduct.imagenes && fullProduct.imagenes[0])
    ? (fullProduct.imagen_url || fullProduct.imagenes[0])
    : `https://placehold.co/500x250/333333/CCCCCC?text=${encodeURIComponent(fullProduct.nombre || 'Producto')}`;
    
  const placeholderImage = `https://placehold.co/500x250/333333/CCCCCC?text=${encodeURIComponent(fullProduct.nombre || 'Producto')}`;

  if (loadingToppings) {
    return null; // Spinner opcional
  }
  
  return (
    <motion.div
      style={styles.backdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
    >
      <motion.div
        style={styles.content}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.header}>
          <button style={styles.closeButton} onClick={onClose}>&times;</button>
          <img 
            src={displayImage} 
            alt={fullProduct.nombre} 
            style={styles.productImage}
            onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
          />
        </div>

        <div style={styles.body}>
          <h2 style={styles.productTitle}>{fullProduct.nombre}</h2>
        
          {fullProduct.descripcion && (
            <p style={styles.productDescription}>{fullProduct.descripcion}</p>
          )}

          <div style={styles.optionsContainer}>
            {!loadingToppings && fullProduct.grupos_opciones?.length > 0 && 
              fullProduct.grupos_opciones.map(grupo => (
                <div key={grupo.id} style={styles.optionGroup}>
                  <h5 style={styles.optionGroupTitle}>{grupo.nombre}</h5>
                  
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
                            <span className="text-success">+${parseFloat(opcion.precio_adicional).toFixed(2)}</span>
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
                        <span className="text-success">+${parseFloat(opcion.precio_adicional).toFixed(2)}</span>
                      </label>
                    </div>
                  ))}
                </div>
            ))}
          </div>
        </div>

        <div style={styles.footer}>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <span style={styles.priceTag}>${totalPrice.toFixed(2)}</span>
              {fullProduct.en_oferta && Number(fullProduct.precio_original) > Number(fullProduct.precio) && (
                <span className="text-muted text-decoration-line-through ms-2" style={{ fontSize: '0.9rem' }}>
                    ${Number(fullProduct.precio_original).toFixed(2)}
                </span>
              )}
            </div>

            <button 
                className={`btn ${isPicante ? 'btn-danger' : 'btn-primary'}`} 
                onClick={handleAddToCart}
            >
              Agregar al Pedido
            </button>
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
}

export default ProductDetailModal;