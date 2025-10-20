import React from 'react';
// IMPORTANTE: Asegúrate de que la ruta a tu ThemeContext sea la correcta.
import { useTheme } from '../context/ThemeContext'; 

function DetallesPedidoModal({ pedido, onClose }) {
  if (!pedido) return null;

  // Obtenemos el tema actual desde el contexto
  const { theme } = useTheme();

  const productos = Array.isArray(pedido.productos) ? pedido.productos : [];

  let googleMapsUrl = '';
  if (pedido.latitude && pedido.longitude) {
    googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${pedido.latitude},${pedido.longitude}`;
  } else if (pedido.direccion_entrega) {
    googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pedido.direccion_entrega)}`;
  }

  // Definimos clases y estilos que cambiarán según el tema
  const modalClass = theme === 'dark' ? 'modal-content text-bg-dark' : 'modal-content';
  const closeButtonClass = theme === 'dark' ? 'btn-close btn-close-white' : 'btn-close';
  const cardBgStyle = {
    backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
  };
  const mutedTextColor = theme === 'dark' ? 'text-white-50' : 'text-muted';


  return (
    <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className={modalClass}>
          
          <div className="modal-header border-0">
            <h5 className="modal-title">Detalles del Pedido #{pedido.id}</h5>
            <button type="button" className={closeButtonClass} onClick={onClose}></button>
          </div>

          <div className="modal-body pt-0">
            {/* --- SECCIÓN DE INFORMACIÓN GENERAL --- */}
            <div className="d-flex justify-content-between mb-2">
              <span className={mutedTextColor}>Cliente:</span>
              <span className="fw-bold text-end">{pedido.nombre_cliente}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className={mutedTextColor}>Fecha:</span>
              <span className="text-end">{new Date(pedido.fecha).toLocaleString()}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className={mutedTextColor}>Tipo:</span>
              <span className="text-end">{pedido.tipo_orden}</span>
            </div>
            <div className="d-flex justify-content-between mb-3">
              <span className={mutedTextColor}>Estado:</span>
              <span className="fw-bold text-warning text-end">{pedido.estado}</span>
            </div>
            
            <hr />

            {/* --- SECCIÓN DE PRODUCTOS --- */}
            <h6 className="mb-2">Productos:</h6>
            <ul className="list-unstyled mb-3">
              {productos.map((producto, index) => (
                <li key={index} className="d-flex justify-content-between">
                  <span>{producto.cantidad}x {producto.nombre}</span>
                  <span className="text-end">${(producto.cantidad * Number(producto.precio || 0)).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            
            {/* --- SECCIÓN DE ENVÍO (SI APLICA) --- */}
            {pedido.tipo_orden === 'domicilio' && (
              <>
                <hr />
                <h6 className="mb-2">Detalles de Envío:</h6>
                <div className="p-3 rounded" style={cardBgStyle}>
                  <p className="mb-1">
                    <strong>Dirección:</strong> {pedido.direccion_entrega || 'No especificada'}
                  </p>
                  {pedido.referencia && (
                    <p className="mb-2">
                      <strong>Referencia:</strong> {pedido.referencia}
                    </p>
                  )}
                  {googleMapsUrl && (
                    <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-info btn-sm mt-1">
                      Abrir en Google Maps
                    </a>
                  )}
                </div>
              </>
            )}

            <hr />
            
            {/* --- SECCIÓN DE TOTAL --- */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <h5 className="mb-0">Total:</h5>
              <h5 className="mb-0 text-success fw-bold">${Number(pedido.total).toFixed(2)}</h5>
            </div>
          </div>

          <div className="modal-footer border-0">
            <button type="button" className="btn btn-danger w-100" onClick={onClose}>
              Cerrar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default DetallesPedidoModal;