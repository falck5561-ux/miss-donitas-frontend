import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, ShoppingBag, Trash2, Plus, Minus, CreditCard, Banknote, Phone, Home } from 'lucide-react';

const CarritoContent = ({
  isModal,
  pedidoActual,
  decrementarCantidad,
  incrementarCantidad,
  eliminarProducto,
  tipoOrden,
  setTipoOrden,
  direccionGuardada,
  usarDireccionGuardada,
  handleLocationSelect,
  direccion,
  referencia,
  setReferencia,
  guardarDireccion,
  setGuardarDireccion,
  subtotal,
  costoEnvio, 
  costoEnvioAplicado, // Recibimos el aplicado (que puede ser 0 si es gratis)
  calculandoEnvio,
  totalFinal,
  handleContinue,
  handleProcederAlPago,
  paymentLoading,
  limpiarPedidoCompleto,
  telefono,
  setTelefono,
  metodoPago,
  setMetodoPago,
  montoPago,
  setMontoPago,
  cambio
}) => {

  const costoEnvioParaMostrar = costoEnvioAplicado !== undefined ? costoEnvioAplicado : costoEnvio;

  return (
    <div className={isModal ? "modal-body" : "card-body"}>
      {!isModal && <h4 className="fw-bold mb-3">Tu Pedido</h4>}

      {/* --- LISTA DE PRODUCTOS --- */}
      {pedidoActual.length === 0 ? (
        <p className="text-muted text-center">Tu canasta está vacía.</p>
      ) : (
        <ul className="list-group list-group-flush mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {pedidoActual.map((item, index) => (
            <li key={index} className="list-group-item px-0 py-2 border-0 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center" style={{ flex: 1 }}>
                 {/* Controles de cantidad */}
                <div className="d-flex flex-column align-items-center me-2 bg-light rounded-pill p-1">
                    <button className="btn btn-sm p-0 text-muted" onClick={() => incrementarCantidad(item.id)}><Plus size={14}/></button>
                    <span className="fw-bold small my-1">{item.cantidad}</span>
                    <button className="btn btn-sm p-0 text-muted" onClick={() => decrementarCantidad(item.id)}><Minus size={14}/></button>
                </div>
                <div>
                  <h6 className="mb-0 text-truncate" style={{ maxWidth: '140px' }}>{item.nombre}</h6>
                  <div className="text-muted small">${Number(item.precio).toFixed(2)}</div>
                  {item.opcionesSeleccionadas && item.opcionesSeleccionadas.length > 0 && (
                      <small className="text-muted d-block fst-italic" style={{fontSize: '0.75rem'}}>
                          {item.opcionesSeleccionadas.map(op => op.nombre).join(', ')}
                      </small>
                  )}
                </div>
              </div>
              <div className="d-flex align-items-center">
                 <span className="fw-bold me-3">${(item.cantidad * Number(item.precio)).toFixed(2)}</span>
                 <button className="btn btn-link text-danger p-0" onClick={() => eliminarProducto(item.id)}>
                    <Trash2 size={16} />
                 </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* --- TIPO DE ENTREGA --- */}
      {pedidoActual.length > 0 && (
        <>
          <div className="btn-group w-100 mb-3" role="group">
            <input type="radio" className="btn-check" name="tipoOrden" id="delivery" autoComplete="off" checked={tipoOrden === 'domicilio'} onChange={() => setTipoOrden('domicilio')} />
            <label className={`btn ${tipoOrden === 'domicilio' ? 'btn-primary' : 'btn-outline-primary'}`} htmlFor="delivery">
                <MapPin size={18} className="me-2" /> Domicilio
            </label>

            <input type="radio" className="btn-check" name="tipoOrden" id="pickup" autoComplete="off" checked={tipoOrden === 'llevar'} onChange={() => setTipoOrden('llevar')} />
            <label className={`btn ${tipoOrden === 'llevar' ? 'btn-primary' : 'btn-outline-primary'}`} htmlFor="pickup">
                <ShoppingBag size={18} className="me-2" /> Para Llevar
            </label>
          </div>
          
          {/* --- DATOS DE CONTACTO --- */}
          <div className="mb-3">
             <label className="form-label small fw-bold text-muted"><Phone size={14} className="me-1"/>Teléfono de contacto</label>
             <input 
                type="tel" 
                className="form-control" 
                placeholder="Ej: 9811234567" 
                value={telefono} 
                onChange={(e) => setTelefono(e.target.value)} 
                maxLength={10}
             />
          </div>

          {/* --- DATOS DE DIRECCIÓN (Si es domicilio y NO estamos en el modal) --- */}
          {/* Nota: En el modal la dirección se pide en el paso 2 ('address'), aquí lo mostramos si es inline */}
          {!isModal && tipoOrden === 'domicilio' && (
             <div className="mb-3 p-2 bg-light rounded">
                {direccion ? (
                    <div className="small text-success"><MapPin size={14}/> {direccion.description}</div>
                ) : (
                    <div className="small text-danger">Selecciona tu ubicación al continuar</div>
                )}
             </div>
          )}
          
          {/* --- MÉTODO DE PAGO --- */}
          <div className="mb-3">
             <label className="form-label small fw-bold text-muted">Método de Pago</label>
             <div className="d-flex gap-2">
                 <button className={`btn flex-fill d-flex align-items-center justify-content-center gap-2 ${metodoPago === 'tarjeta' ? 'btn-dark' : 'btn-outline-secondary'}`} 
                         onClick={() => setMetodoPago('tarjeta')}>
                     <CreditCard size={16}/> Tarjeta
                 </button>
                 <button className={`btn flex-fill d-flex align-items-center justify-content-center gap-2 ${metodoPago === 'efectivo' ? 'btn-success text-white' : 'btn-outline-secondary'}`} 
                         onClick={() => setMetodoPago('efectivo')}>
                     <Banknote size={16}/> Efectivo
                 </button>
             </div>
          </div>

          {/* --- CAMBIO (Solo Efectivo) --- */}
          {metodoPago === 'efectivo' && (
              <div className="mb-3">
                  <label className="form-label small">¿Con cuánto pagas?</label>
                  <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input type="number" className="form-control" placeholder="Monto entregado" value={montoPago} onChange={(e) => setMontoPago(e.target.value)} />
                  </div>
                  {Number(montoPago) > 0 && (
                      <div className={`small mt-1 ${cambio >= 0 ? 'text-success' : 'text-danger'}`}>
                          Cambio: ${cambio >= 0 ? cambio.toFixed(2) : 'Insuficiente'}
                      </div>
                  )}
              </div>
          )}

          {/* --- TOTALES --- */}
          <div className="border-top pt-3 mt-2">
            <div className="d-flex justify-content-between mb-1 text-muted small">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {tipoOrden === 'domicilio' && (
              <div className="d-flex justify-content-between mb-1 text-muted small">
                <span>Envío {calculandoEnvio && <span className="spinner-border spinner-border-sm"></span>}</span>
                <span className={costoEnvioParaMostrar === 0 ? "text-success fw-bold" : ""}>
                    {costoEnvioParaMostrar === 0 ? "GRATIS" : `$${Number(costoEnvioParaMostrar).toFixed(2)}`}
                </span>
              </div>
            )}
            <div className="d-flex justify-content-between fs-5 fw-bold mt-2">
              <span>Total</span>
              <span>${totalFinal.toFixed(2)}</span>
            </div>
          </div>
          
          {/* --- BOTONES DE ACCIÓN --- */}
          <div className="d-grid gap-2 mt-4">
            {/* Si es Modal, usamos handleContinue o Pagar dependiendo del estado */}
            {isModal ? (
                <button 
                  className="btn btn-primary py-2 fw-bold" 
                  onClick={handleContinue}
                  disabled={calculandoEnvio || (tipoOrden === 'domicilio' && !direccion && false)} // Dejamos pasar para seleccionar direcc en el modal view
                >
                  {tipoOrden === 'domicilio' ? 'Continuar a Dirección' : (metodoPago === 'efectivo' ? 'Realizar Pedido' : 'Pagar con Tarjeta')}
                </button>
            ) : (
                // Si NO es modal (versión desktop lateral), accionamos directamente
                 <button 
                  className="btn btn-primary py-2 fw-bold" 
                  onClick={handleProcederAlPago} // En desktop asumimos que la dirección se selecciona via el mapa lateral si existiera, o abre modal
                  disabled={calculandoEnvio || paymentLoading}
                >
                   {paymentLoading ? 'Procesando...' : (metodoPago === 'efectivo' ? 'Confirmar Pedido' : 'Ir a Pagar')}
                </button>
            )}
            
            <button className="btn btn-outline-danger btn-sm" onClick={limpiarPedidoCompleto}>
               Vaciar canasta
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CarritoContent;