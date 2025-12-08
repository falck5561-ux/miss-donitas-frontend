import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { X, MapPin, Phone, Package, ShoppingBag, Bike, User, Clock, Navigation, AlertTriangle, CreditCard, DollarSign } from 'lucide-react';

const getModalColors = (mode) => {
  const isPicante = mode === 'picante';
  return {
    overlay: 'rgba(0, 0, 0, 0.85)',
    bg: isPicante ? '#1E1E1E' : '#FFFFFF',
    textMain: isPicante ? '#FFFFFF' : '#3E2723',
    textLight: isPicante ? '#B0B0B0' : '#8D6E63',
    border: isPicante ? '#333333' : '#E0E0E0',
    cardBg: isPicante ? '#2C2C2C' : '#F8F9FA',
    accent: isPicante ? '#FF1744' : '#FF4081',
    mapBtnBg: '#4285F4',
    mapBtnText: '#FFFFFF',
    closeBtnBg: isPicante ? '#FF1744' : '#FF4081',
    closeBtnText: '#FFFFFF'
  };
};

const DetallesPedidoModal = ({ pedido, onClose, isPicante }) => {
  const { theme } = useTheme();
  const currentTheme = isPicante ? 'picante' : theme;
  const colors = getModalColors(currentTheme);

  if (!pedido) return null;

  // --- 1. LÓGICA DE DETECCIÓN DE PAGO ---
  const parsearDatosPago = (referencia) => {
      if (!referencia || !referencia.includes('Paga con:')) return null;
      try {
          const pagaConMatch = referencia.match(/Paga con: \$([0-9.]+)/);
          const cambioMatch = referencia.match(/Cambio: \$([0-9.]+)/);
          if (pagaConMatch && cambioMatch) {
              return {
                  pagaCon: parseFloat(pagaConMatch[1]).toFixed(2),
                  cambio: parseFloat(cambioMatch[1]).toFixed(2)
              };
          }
          return null;
      } catch (e) { return null; }
  };

  const datosPago = parsearDatosPago(pedido.referencia);
  const esEfectivo = !!datosPago;

  // --- 2. BÚSQUEDA ROBUSTA DE PRODUCTOS ---
  const listaProductos = 
      pedido.items || 
      pedido.detalles_pedido || 
      pedido.productos || 
      pedido.detalles || 
      pedido.venta_detalles || 
      [];

  // --- 3. DETECTAR VENTA DE MOSTRADOR ---
  const esVentaMostrador = 
      pedido.tipo_orden === 'mostrador' || 
      pedido.nombre_cliente === 'Venta de Mostrador' ||
      !pedido.tipo_orden; 

  // Generar URL de Google Maps
  let mapUrl = '';
  if (pedido.latitude && pedido.longitude) {
    mapUrl = `https://www.google.com/maps/search/?api=1&query=${pedido.latitude},${pedido.longitude}`;
  } else if (pedido.direccion_entrega || pedido.direccion) {
    const dir = pedido.direccion_entrega || pedido.direccion;
    mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dir + ", Campeche, Mexico")}`;
  }

  const styles = {
    overlay: {
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: colors.overlay,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1050, backdropFilter: 'blur(5px)'
    },
    modal: {
      backgroundColor: colors.bg,
      width: '95%', maxWidth: '500px',
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      maxHeight: '90vh'
    },
    header: {
      padding: '20px 24px', 
      borderBottom: `1px solid ${colors.border}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    title: { margin: 0, fontSize: '1.25rem', fontWeight: '800', color: colors.textMain, display: 'flex', alignItems: 'center', gap: '10px' },
    
    body: { padding: '24px', overflowY: 'auto' },
    
    infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' },
    infoItem: { display: 'flex', flexDirection: 'column' },
    label: { fontWeight: '700', color: colors.textLight, textTransform: 'uppercase', fontSize: '0.7rem', marginBottom: '4px', letterSpacing: '0.5px' },
    value: { fontWeight: '600', fontSize: '1rem', color: colors.textMain, display: 'flex', alignItems: 'center', gap: '6px' },
    
    badge: {
      padding: '4px 12px', borderRadius: '50px', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase',
      backgroundColor: pedido.estado === 'Pendiente' ? '#FF5252' : (pedido.estado?.includes('Completado') ? '#212121' : '#FB8C00'),
      color: '#FFFFFF', alignSelf: 'flex-start', display: 'inline-block'
    },

    sectionHeader: { 
      marginTop: '25px', marginBottom: '15px', 
      display: 'flex', alignItems: 'center', gap: '8px',
      fontWeight: '800', color: colors.accent, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.5px'
    },
    productCard: {
      backgroundColor: colors.cardBg, 
      padding: '12px 16px', 
      borderRadius: '12px', marginBottom: '8px',
      border: `1px solid ${colors.border}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    
    deliveryBox: {
      backgroundColor: colors.cardBg, padding: '20px',
      borderRadius: '12px',
      border: `1px solid ${colors.border}`
    },
    mapBtn: {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%',
      backgroundColor: colors.mapBtnBg, color: colors.mapBtnText,
      padding: '12px', borderRadius: '10px', textDecoration: 'none',
      fontWeight: '600', marginTop: '15px', fontSize: '0.9rem'
    },

    // ESTILOS NUEVOS PARA ALERTAS DE PAGO
    alertBox: {
        padding: '15px', borderRadius: '12px', marginBottom: '20px',
        backgroundColor: esEfectivo ? '#FFF3CD' : '#D1E7DD',
        border: `1px solid ${esEfectivo ? '#FFEEBA' : '#BADBCC'}`,
        color: esEfectivo ? '#856404' : '#0F5132'
    },

    footer: {
      padding: '20px 24px', borderTop: `1px solid ${colors.border}`,
      backgroundColor: colors.bg,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    totalLabel: { display:'block', fontSize:'0.8rem', color: colors.textLight, fontWeight: '700', textTransform: 'uppercase' },
    totalPrice: { fontSize: '1.75rem', fontWeight: '800', color: colors.textMain, lineHeight: 1 },
    closeBtn: {
      backgroundColor: colors.closeBtnBg, color: colors.closeBtnText, border: 'none',
      padding: '10px 24px', borderRadius: '50px', fontWeight: '700', fontSize: '0.95rem',
      cursor: 'pointer', boxShadow: '0 4px 12px rgba(255, 64, 129, 0.2)'
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        
        {/* ENCABEZADO */}
        <div style={styles.header}>
          <h3 style={styles.title}>
            <span style={{color: colors.accent}}>#</span>{pedido.id}
            <div style={styles.badge}>{pedido.estado}</div>
          </h3>
          <button style={{background:'none', border:'none', cursor:'pointer', color: colors.textMain}} onClick={onClose}>
             <X size={24} />
          </button>
        </div>

        {/* CONTENIDO */}
        <div style={styles.body}>
          
          {/* --- ALERTA DE PAGO PARA EL ADMIN --- */}
          {esEfectivo ? (
              <div style={styles.alertBox}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px', fontWeight:'bold', marginBottom:'10px', fontSize:'1.1rem'}}>
                      <AlertTriangle size={20}/> ⚠️ COBRO PENDIENTE (EFECTIVO)
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                      <div>
                          <small style={{display:'block', opacity:0.8}}>Cliente paga con:</small>
                          <strong style={{fontSize:'1.2rem'}}>${datosPago.pagaCon}</strong>
                      </div>
                      <div>
                          <small style={{display:'block', opacity:0.8}}>LLEVAR CAMBIO DE:</small>
                          <strong style={{fontSize:'1.2rem', color:'#dc3545'}}>${datosPago.cambio}</strong>
                      </div>
                  </div>
              </div>
          ) : (
             <div style={{...styles.alertBox, marginBottom: '20px', padding: '10px', display:'flex', alignItems:'center', gap:'10px'}}>
                 <CreditCard size={20}/> 
                 <span style={{fontWeight:'bold'}}>✅ PAGADO CON TARJETA</span>
             </div>
          )}

          <div style={styles.infoGrid}>
             <div style={styles.infoItem}>
                <span style={styles.label}>Cliente</span>
                <span style={styles.value}>
                    <User size={16} color={colors.textLight} /> 
                    {pedido.nombre_cliente}
                </span>
             </div>
             <div style={styles.infoItem}>
                <span style={styles.label}>Hora</span>
                <span style={styles.value}>
                    <Clock size={16} color={colors.textLight} />
                    {new Date(pedido.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
             </div>
          </div>

          <div style={styles.sectionHeader}>
            <Package size={18} /> Productos ({listaProductos.length})
          </div>
          
          {listaProductos.length === 0 ? (
             <div style={{textAlign:'center', color: colors.textLight, padding: '20px', fontStyle:'italic'}}>
                No se encontraron detalles de productos.
             </div>
          ) : (
            listaProductos.map((prod, idx) => {
                let textoOpciones = "";
                const rawOpciones = prod.opciones || prod.selectedOptions;

                if (Array.isArray(rawOpciones)) {
                    textoOpciones = rawOpciones.map(op => (typeof op === 'string' ? op : op.nombre)).join(', ');
                } else if (typeof rawOpciones === 'string') {
                    textoOpciones = rawOpciones;
                }

                const precioUnitario = Number(prod.precio || prod.precio_unitario || 0);
                const subtotal = precioUnitario * prod.cantidad;

                return (
                  <div key={idx} style={styles.productCard}>
                    <div style={{flex: 1}}>
                      <div style={{fontSize: '1rem', fontWeight: '700', color: colors.textMain}}>
                        {prod.cantidad} x {prod.nombre || prod.nombre_producto}
                      </div>
                      
                      {textoOpciones && (
                        <div style={{fontSize: '0.8rem', color: colors.textLight, marginTop:'2px'}}>
                           {textoOpciones}
                        </div>
                      )}
                    </div>
                    
                    <div style={{fontWeight: '700', fontSize: '1rem', color: colors.textMain}}>
                       ${subtotal.toFixed(2)}
                    </div>
                  </div>
                );
            })
          )}

          {/* --- OCULTAMOS SI ES MOSTRADOR --- */}
          {!esVentaMostrador && (
            <>
              <div style={styles.sectionHeader}>
                 <Bike size={18}/> Datos de Entrega
              </div>

              <div style={styles.deliveryBox}>
                <div style={{marginBottom: '15px'}}>
                  <span style={styles.label}>Dirección</span>
                  <div style={{fontSize:'1rem', color: colors.textMain, marginTop: '4px', lineHeight: '1.4', display:'flex', gap: '8px'}}>
                    <MapPin size={18} className="flex-shrink-0" style={{marginTop:'3px', color: colors.accent}}/>
                    {pedido.direccion_entrega || pedido.direccion || "Sin dirección registrada"}
                  </div>
                </div>
                
                {(pedido.referencia) && (
                   <div style={{marginBottom: '15px', paddingLeft: '26px'}}>
                     <span style={styles.label}>Referencia</span>
                     <div style={{fontStyle:'italic', color: colors.textLight, fontSize: '0.9rem'}}>"{pedido.referencia}"</div>
                   </div>
                )}
                
                <div style={{marginBottom: '5px', display:'flex', alignItems:'center', gap: '8px'}}>
                   <Phone size={16} color={colors.textLight}/>
                   <span style={{color: colors.textMain, fontWeight: '600'}}>{pedido.telefono || 'Sin teléfono'}</span>
                </div>

                {mapUrl && (
                  <a href={mapUrl} target="_blank" rel="noopener noreferrer" style={styles.mapBtn}>
                    <Navigation size={18} /> ABRIR EN MAPAS
                  </a>
                )}
              </div>
            </>
          )}
        </div>

        <div style={styles.footer}>
          <div>
            <span style={styles.totalLabel}>{esEfectivo ? "Total a Cobrar" : "Total Pagado"}</span>
            <span style={styles.totalPrice}>${Number(pedido.total).toFixed(2)}</span>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>CERRAR</button>
        </div>

      </div>
    </div>
  );
};

export default DetallesPedidoModal;