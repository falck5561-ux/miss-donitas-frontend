import React from 'react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

function ProductCard({ product, index, onCardClick }) {
  const precioConDescuento = Number(product.precio) * (1 - (product.descuento_porcentaje || 0) / 100);
  
  const images = product.imagen_url ? [product.imagen_url] : [];
  const hasImages = images.length > 0;
  const hasMultipleImages = images.length > 1;

  // =======================================================
  // === ¡AQUÍ ESTÁ LA CORRECCIÓN DE IMÁGENES! ===
  // =======================================================
  // Esta función ahora genera una URL a un servicio de placeholders.
  // Esto evita los errores 404 y se ve mucho más profesional.
  const getPlaceholderImage = (productName) => {
    // Codificamos el nombre para que se pueda usar en una URL
    const encodedName = encodeURIComponent(productName);
    // Creamos una URL que genera una imagen con el nombre del producto
    return `https://placehold.co/400x400/333333/CCCCCC?text=${encodedName}`;
  };

  return (
    <motion.div 
      key={product.id} 
      className="col" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: index * 0.05 }}
    >
      <div 
        className={`card h-100 shadow-sm position-relative ${product.en_oferta ? 'en-oferta' : ''}`}
        onClick={() => onCardClick(product)}
        style={{ cursor: 'pointer' }}
      >
        {product.en_oferta && (<span className="discount-badge">-{product.descuento_porcentaje}%</span>)}
        
        {hasMultipleImages ? (
          <Swiper modules={[Navigation, Pagination]} spaceBetween={0} slidesPerView={1} navigation pagination={{ clickable: true }} className="card-img-top" style={{ height: '200px' }}>
            {images.map((url, i) => (
              <SwiperSlide key={i}>
                <img 
                  src={url} 
                  className="img-fluid" 
                  alt={`${product.nombre} ${i + 1}`} 
                  style={{ height: '200px', width: '100%', objectFit: 'cover' }} 
                  // Fallback por si la URL de la imagen principal también se rompe
                  onError={(e) => { e.target.onerror = null; e.target.src = getPlaceholderImage(product.nombre); }}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <img 
            // ✅ CORRECCIÓN: Ahora la fuente de la imagen es la URL real o el placeholder generado.
            src={hasImages ? images[0] : getPlaceholderImage(product.nombre)} 
            className="card-img-top" 
            alt={product.nombre} 
            style={{ height: '200px', objectFit: 'cover' }}
            // Fallback por si la URL de la imagen principal se rompe
            onError={(e) => { e.target.onerror = null; e.target.src = getPlaceholderImage(product.nombre); }}
          />
        )}
        
        <div className="card-body d-flex flex-column">
          <h5 className="card-title text-center flex-grow-1">{product.nombre}</h5>
        </div>
        
        <div className="card-footer bg-transparent border-top-0 pb-3 text-center">
          {product.en_oferta && product.descuento_porcentaje > 0 ? (
            <div>
              <span className="text-muted text-decoration-line-through me-2">${Number(product.precio).toFixed(2)}</span>
              <span className="fw-bold fs-5" style={{color: '#28a745'}}>${precioConDescuento.toFixed(2)}</span>
            </div>
          ) : (<span className="fw-bold fs-5">${Number(product.precio).toFixed(2)}</span>)}
        </div>
      </div>
    </motion.div>
  );
}

export default ProductCard;
