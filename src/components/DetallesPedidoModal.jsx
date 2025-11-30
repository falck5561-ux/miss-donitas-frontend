import React from 'react';
import { useTheme } from '../context/ThemeContext';

// --- COLORES EXACTOS ---
const getModalColors = (mode) => {
  const isPicante = mode === 'picante';
  
  return {
    overlay: 'rgba(0, 0, 0, 0.85)',
    bg: isPicante ? '#1E1E1E' : '#FFF8E1', 
    textMain: isPicante ? '#FFFFFF' : '#3E2723',
    textLight: isPicante ? '#B0B0B0' : '#8D6E63',
    border: isPicante ? '#333333' : '#D7CCC8',
    cardBg: isPicante ? '#2C2C2C' : '#FFFFFF',
    accent: isPicante ? '#FF1744' : '#FF4081',
    mapBtnBg: '#1976D2',
    mapBtnText: '#FFFFFF',
    closeBtnBg: isPicante ? '#FF1744' : '#FF4081',
    closeBtnText: '#FFFFFF'
  };
};

const DetallesPedidoModal = ({ pedido, onClose }) => {
  const { theme } = useTheme();
  const colors = getModalColors(theme);

  if (!pedido) return null;

  const listaProductos = pedido.detalles_pedido || pedido.productos || pedido.detalles || pedido.items || [];
  
  // DETECTAR SI ES VENTA POS (MOSTRADOR)
  // Si tipo_orden es 'mostrador' o el cliente es genérico de mostrador
  const isPosSale = pedido.tipo_orden === 'mostrador' || pedido.nombre_cliente === 'Venta de Mostrador';

  // URL Mapa (Solo para domicilios reales)
  let mapUrl = '';
  if (!isPosSale && (pedido.latitude && pedido.longitude)) {
    mapUrl = `https://www.google.com/maps/search/?api=1&query=${pedido.latitude},${pedido.longitude}`;
  } else if (!isPosSale && (pedido.direccion_entrega || pedido.direccion)) {
    const dir = pedido.direccion_entrega || pedido.direccion;
    mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dir + ", Campeche, Mexico")}`;
  }

  const styles = {
    overlay: {
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: colors.overlay,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1050, backdropFilter: 'blur(3px)'
    },
    modal: {
      backgroundColor: colors.bg,
      width: '95%', maxWidth: '500px', // Un poco más angosto para parecer ticket
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      maxHeight: '90vh'
    },
    header: {
      padding: '20px', 
      backgroundColor: colors.bg,
      borderBottom: `2px solid ${colors.border}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    title: { margin: 0, fontSize: '1.2rem', fontWeight: '800', color: colors.accent, textTransform: 'uppercase' },
    closeX: { background: 'none', border: 'none', fontSize: '2rem', color: colors.textMain, cursor: 'pointer', lineHeight: 0.8 },
    body: { padding: '20px', overflowY: 'auto' },
    row: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem', color: colors.textMain },
    label: { fontWeight: 'bold', color: colors.textLight, textTransform: 'uppercase', fontSize: '0.75rem' },
    sectionHeader: { 
      marginTop: '20px', marginBottom: '10px', paddingBottom: '5px',
      borderBottom: `1px solid ${colors.border}`, 
      fontWeight: 'bold', color: colors.textMain, textTransform: 'uppercase', fontSize: '0.85rem'
    },
    productRow: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'start',
      marginBottom: '10px', paddingBottom: '10px', borderBottom: `1px dashed ${colors.border}`
    },
    footer: {
      padding: '20px', borderTop: `2px solid ${colors.border}`,
      backgroundColor: colors.cardBg,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    totalPrice: { fontSize: '1.8rem', fontWeight: '900', color: colors.textMain },
    closeBtn: {
      backgroundColor: colors.closeBtnBg, color: colors.closeBtnText, border: 'none',
      padding: '10px 30px', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer'
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div style={styles.header}>
          <h3 style={styles.title}>{isPosSale ? 'TICKET DE VENTA' : `PEDIDO #${pedido.id}`}</h3>
          <button style={styles.closeX} onClick={onClose}>×</button>
        </div>

        {/* BODY */}
        <div style={styles.body}>
          
          <div style={styles.row}>
            <div>
                <span style={styles.label}>CLIENTE</span><br/>
                <span style={{fontWeight: 'bold'}}>{pedido.nombre_cliente}</span>
            </div>
            <div style={{textAlign: 'right'}}>
                <span style={styles.label}>HORA</span><br/>
                <span style={{fontWeight: 'bold'}}>{new Date(pedido.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          </div>

          {!isPosSale && (
             <div style={{marginTop: '10px', textAlign: 'center'}}>
                <span className="badge bg-secondary">{pedido.estado ? pedido.estado.toUpperCase() : 'ESTADO DESCONOCIDO'}</span>
             </div>
          )}

          {/* LISTA DE PRODUCTOS (LIMPIA, SIN EMOJIS) */}
          <div style={styles.sectionHeader}>DETALLE DE PRODUCTOS</div>
          
          {listaProductos.map((prod, idx) => {
              const opciones = prod.opciones || prod.selectedOptions || [];
              // Manejo de precio si viene como string o número
              const precioUnitario = Number(prod.precio || prod.precio_unitario || 0);
              const subtotal = precioUnitario * prod.cantidad;

              return (
                <div key={idx} style={styles.productRow}>
                  <div style={{flex: 1, paddingRight: '10px'}}>
                    <div style={{fontWeight: 'bold', color: colors.textMain}}>
                      {prod.cantidad} x {prod.nombre || prod.nombre_producto}
                    </div>
                    {/* Toppings solo texto */}
                    {opciones.length > 0 && (
                      <div style={{fontSize: '0.8rem', color: colors.textLight, fontStyle: 'italic'}}>
                         {/* Si opciones es array de objetos o string */}
                         {Array.isArray(opciones) 
                            ? opciones.map(op => op.nombre).join(', ') 
                            : opciones}
                      </div>
                    )}
                  </div>
                  <div style={{fontWeight: 'bold', color: colors.textMain}}>
                     ${subtotal.toFixed(2)}
                  </div>
                </div>
              );
          })}

          {/* SOLO MOSTRAR DATOS DE ENTREGA SI ES PEDIDO WEB (NO POS) */}
          {!isPosSale && (
            <>
                <div style={styles.sectionHeader}>DATOS DE ENTREGA</div>
                {pedido.tipo_orden === 'domicilio' ? (
                    <div style={{fontSize: '0.9rem', color: colors.textMain}}>
                        <p style={{marginBottom: '5px'}}><strong>Dirección:</strong> {pedido.direccion_entrega || pedido.direccion}</p>
                        {pedido.referencia && <p style={{marginBottom: '5px'}}><strong>Ref:</strong> {pedido.referencia}</p>}
                        {mapUrl && <a href={mapUrl} target="_blank" rel="noopener noreferrer" style={{color: colors.accent, fontWeight:'bold', textDecoration:'none'}}>📍 Ver Mapa</a>}
                    </div>
                ) : (
                    <div style={{textAlign: 'center', padding: '10px', backgroundColor: colors.cardBg, borderRadius: '8px', border: `1px dashed ${colors.border}`}}>
                        <strong style={{color: colors.textMain}}>RECOGER EN TIENDA</strong>
                    </div>
                )}
            </>
          )}

        </div>

        {/* FOOTER */}
        <div style={styles.footer}>
          <div>
            <span style={styles.label}>TOTAL PAGADO</span>
            <div style={styles.totalPrice}>${Number(pedido.total).toFixed(2)}</div>
            {isPosSale && pedido.metodo_pago && <small style={{color: colors.textLight, textTransform: 'uppercase'}}>{pedido.metodo_pago}</small>}
          </div>
          <button style={styles.closeBtn} onClick={onClose}>CERRAR</button>
        </div>

      </div>
    </div>
  );
};

export default DetallesPedidoModal;