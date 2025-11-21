import React from 'react';
import { useTheme } from '../context/ThemeContext';

function DetallesPedidoModal({ pedido, onClose }) {
  if (!pedido) return null;

  const { theme } = useTheme();
  const productos = Array.isArray(pedido.productos) ? pedido.productos : [];

  // Lógica para mapas
  let googleMapsUrl = '';
  if (pedido.latitude && pedido.longitude) {
    googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${pedido.latitude},${pedido.longitude}`;
  } else if (pedido.direccion_entrega) {
    googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pedido.direccion_entrega)}`;
  }

  // Estilos dinámicos
  const modalClass = theme === 'dark' ? 'modal-content text-bg-dark' : 'modal-content';
  const closeButtonClass = theme === 'dark' ? 'btn-close btn-close-white' : 'btn-close';
  const mutedTextColor = theme === 'dark' ? 'text-white-50' : 'text-muted';
  const borderClass = theme === 'dark' ? 'border-secondary' : '';

  return (
    <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className={modalClass}>
          
          <div className={`modal-header ${borderClass}`}>
            <h5 className="modal-title">Detalles del Pedido #{pedido.id}</h5>
            <button type="button" className={closeButtonClass} onClick={onClose}></button>
          </div>

          <div className="modal-body">
            {/* --- INFORMACIÓN GENERAL --- */}
            <div className="d-flex justify-content-between mb-1">
              <span className={mutedTextColor}>Cliente:</span>
              <span className="fw-bold">{pedido.nombre_cliente}</span>
            </div>
            <div className="d-flex justify-content-between mb-1">
              <span className={mutedTextColor}>Fecha:</span>
              <span>{new Date(pedido.fecha).toLocaleString()}</span>
            </div>
            <div className="d-flex justify-content-between mb-3">
              <span className={mutedTextColor}>Estado:</span>
              {/* Badge de estado simple */}
              <span className="badge bg-warning text-dark">{pedido.estado}</span>
            </div>
            
            <hr className={borderClass} />

            {/* --- LISTA DE PRODUCTOS (CORREGIDO) --- */}
            <h6 className="mb-3">Productos:</h6>
            <ul className="list-group list-group-flush">
              {productos.map((prod, index) => {
                // Lógica segura para obtener la imagen (string o array)
                const imagenSrc = Array.isArray(prod.imagenes) && prod.imagenes.length > 0 
                  ? prod.imagenes[0] 
                  : (typeof prod.imagen === 'string' ? prod.imagen : null);

                // Detectar opciones/toppings (puede venir como 'opciones' o 'selectedOptions')
                const opcionesList = prod.opciones || prod.selectedOptions || [];

                return (
                  <li key={index} className={`list-group-item d-flex align-items-start p-2 ${theme === 'dark' ? 'bg-dark text-white border-secondary' : ''}`}>
                    
                    {/* 1. IMAGEN DEL PRODUCTO */}
                    <div className="me-3" style={{ width: '60px', height: '60px', flexShrink: 0 }}>
                      {imagenSrc ? (
                        <img 
                          src={imagenSrc} 
                          alt={prod.nombre} 
                          className="img-fluid rounded" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="bg-secondary rounded w-100 h-100 d-flex align-items-center justify-content-center text-white small">
                          Sin img
                        </div>
                      )}
                    </div>

                    {/* 2. DETALLES (Nombre + Toppings) */}
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between fw-bold">
                        <span>{prod.cantidad}x {prod.nombre}</span>
                        <span>${(Number(prod.precio) * prod.cantidad).toFixed(2)}</span>
                      </div>
                      
                      {/* Renderizado de Toppings */}
                      {opcionesList.length > 0 && (
                        <div className={`small ${mutedTextColor} mt-1`}>
                          {opcionesList.map((op, i) => (
                            <span key={i}>
                              • {op.nombre} {Number(op.precio_adicional || op.precio) > 0 ? `(+$${Number(op.precio_adicional || op.precio)})` : ''} 
                              {i < opcionesList.length - 1 ? <br/> : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            
            {/* --- ENVÍO --- */}
            {pedido.tipo_orden === 'domicilio' && (
              <>
                <hr className={borderClass} />
                <h6 className="mb-2">Entrega:</h6>
                <div className={`p-2 rounded border ${borderClass}`}>
                  <p className="mb-1 small"><strong>Dir:</strong> {pedido.direccion_entrega}</p>
                  {pedido.referencia && <p className="mb-1 small text-muted">Ref: {pedido.referencia}</p>}
                  {googleMapsUrl && (
                    <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm w-100 mt-1">
                      <i className="bi bi-geo-alt-fill"></i> Ver Mapa
                    </a>
                  )}
                </div>
              </>
            )}

            <hr className={borderClass} />
            
            {/* --- TOTAL --- */}
            <div className="d-flex justify-content-between align-items-center mt-2">
              <h5 className="mb-0">Total a Pagar:</h5>
              <h4 className="mb-0 text-success fw-bold">${Number(pedido.total).toFixed(2)}</h4>
            </div>
          </div>

          <div className={`modal-footer ${borderClass}`}>
            <button type="button" className="btn btn-secondary w-100" onClick={onClose}>
              Cerrar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default DetallesPedidoModal;