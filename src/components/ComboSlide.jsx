import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';

function ComboSlide({ combo, getPedidoUrl }) {
  const precioConDescuento = Number(combo.precio) * (1 - combo.descuento_porcentaje / 100);
  const hasImages = combo.imagenes && combo.imagenes.length > 0;

  return (
    <SwiperSlide key={combo.id}>
      <div className={`row g-0 align-items-center combo-slide-content ${combo.en_oferta ? 'en-oferta' : ''}`}>
        <div className="col-lg-7 position-relative">
          {combo.en_oferta && (
            <span className="discount-badge" style={{ top: '20px', right: '20px' }}>
              -{combo.descuento_porcentaje}%
            </span>
          )}
          {hasImages ? (
            <Swiper modules={[Pagination]} pagination={{ clickable: true }} loop={true} className="combo-image-swiper">
              {combo.imagenes.map((url, i) => (
                <SwiperSlide key={i}>
                  <img src={url} className="img-fluid" alt={`${combo.titulo} ${i + 1}`} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="combo-placeholder-image"><span>Combo</span></div>
          )}
        </div>
        <div className="col-lg-5 p-5 text-center">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <h3 className="display-5">{combo.titulo}</h3>
            <p className="lead my-4">{combo.descripcion}</p>
            {combo.en_oferta && combo.descuento_porcentaje > 0 ? (
              <div>
                <span className="text-muted text-decoration-line-through me-2">${Number(combo.precio).toFixed(2)}</span>
                <h2 className="my-3 d-inline" style={{ color: '#28a745', fontWeight: 'bold' }}>${precioConDescuento.toFixed(2)}</h2>
              </div>
            ) : (
              <h2 className="my-3" style={{ color: '#28a745', fontWeight: 'bold' }}>${Number(combo.precio).toFixed(2)}</h2>
            )}
            <Link to={getPedidoUrl()} className="btn btn-primary btn-lg mt-3">¡Lo Quiero!</Link>
          </motion.div>
        </div>
      </div>
    </SwiperSlide>
  );
}
export default ComboSlide;