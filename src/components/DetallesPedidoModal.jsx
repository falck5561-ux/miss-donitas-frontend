import React from 'react';
import { useTheme } from '../context/ThemeContext';
// --- IMPORTAMOS LOS ICONOS ---
import { X, MapPin, Phone, Package, ShoppingBag, Bike, User, Clock, Navigation } from 'lucide-react';

// --- COLORES EXACTOS ---
const getModalColors = (mode) => {
  const isPicante = mode === 'picante';
  
  return {
    overlay: 'rgba(0, 0, 0, 0.85)',
    bg: isPicante ? '#1E1E1E' : '#FFFFFF', // Cambié el fondo claro a blanco puro para más limpieza
    textMain: isPicante ? '#FFFFFF' : '#3E2723',
    textLight: isPicante ? '#B0B0B0' : '#8D6E63',
    border: isPicante ? '#333333' : '#E0E0E0',
    cardBg: isPicante ? '#2C2C2C' : '#F8F9FA', // Un gris muy suave para modo claro
    accent: isPicante ? '#FF1744' : '#FF4081',
    mapBtnBg: '#4285F4', // Azul Google
    mapBtnText: '#FFFFFF',
    closeBtnBg: isPicante ? '#FF1744' : '#FF4081',
    closeBtnText: '#FFFFFF'
  };
};

const DetallesPedidoModal = ({ pedido, onClose, isPicante }) => {
  const { theme } = useTheme();
  // Forzamos el modo si viene por prop, si no usa el contexto
  const currentTheme = isPicante ? 'picante' : theme;
  const colors = getModalColors(currentTheme);

  if (!pedido) return null;

  // 1. Detectar lista de productos (Normalización)
  const listaProductos = pedido.detalles_pedido || pedido.productos || pedido.detalles || pedido.items || [];

  // 2. Generar URL de Google Maps (CORREGIDA)
  let mapUrl = '';
  if (pedido.latitude && pedido.longitude) {
    // Abre Google Maps con coordenadas exactas
    mapUrl = `https://www.google.com/maps/search/?api=1&query=${pedido.latitude},${pedido.longitude}`;
  } else if (pedido.direccion_entrega || pedido.direccion) {
    // Abre Google Maps buscando la dirección
    const dir = pedido.direccion_entrega || pedido.direccion;
    mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dir + ", Campeche, Mexico")}`;
  }

  // --- ESTILOS ---
  const styles = {
    overlay: {
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: colors.overlay,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1050, backdropFilter: 'blur(5px)'
    },
    modal: {
      backgroundColor: colors.bg,
      width: '95%', maxWidth: '550px', // Un poco más estrecho para verse más móvil-friendly
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
    closeButtonIcon: { 
        background: 'transparent', border: 'none', color: colors.textLight, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px', borderRadius: '50%'
    },
    
    body: { padding: '24px', overflowY: 'auto' },
    
    // Info Grid
    infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' },
    infoItem: { display: 'flex', flexDirection: 'column' },
    label: { fontWeight: '700', color: colors.textLight, textTransform: 'uppercase', fontSize: '0.7rem', marginBottom: '4px', letterSpacing: '0.5px' },
    value: { fontWeight: '600', fontSize: '1rem', color: colors.textMain, display: 'flex', alignItems: 'center', gap: '6px' },
    
    // Badge de estado
    badge: {
      padding: '4px 12px', borderRadius: '50px', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase',
      backgroundColor: pedido.estado === 'Pendiente' ? '#FF5252' : (pedido.estado?.includes('Completado') ? '#212121' : '#FB8C00'),
      color: '#FFFFFF', alignSelf: 'flex-start', display: 'inline-block'
    },

    // Secciones
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
    
    // Entrega
    deliveryBox: {
      backgroundColor: colors.cardBg, padding: '20px',
      borderRadius: '12px',
      border: `1px solid ${colors.border}`
    },
    mapBtn: {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%',
      backgroundColor: colors.mapBtnBg, color: colors.mapBtnText,
      padding: '12px', borderRadius: '10px', textDecoration: 'none',
      fontWeight: '600', marginTop: '15px', fontSize: '0.9rem',
      transition: 'opacity 0.2s'
    },

    // Footer
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
          <button style={styles.closeButtonIcon} onClick={onClose} aria-label="Cerrar">
             <X size={24} />
          </button>
        </div>

        {/* CONTENIDO */}
        <div style={styles.body}>
          
          {/* Grid de Información */}
          <div style={styles.infoGrid}>
             <div style={styles.infoItem}>
                <span style={styles.label}>Cliente</span>
                <span style={styles.value}>
                    <User size={16} color={colors.textLight} /> 
                    {pedido.nombre_cliente}
                </span>
             </div>
             <div style={styles.infoItem}>
                <span style={styles.label}>Hora de Pedido</span>
                <span style={styles.value}>
                    <Clock size={16} color={colors.textLight} />
                    {new Date(pedido.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
             </div>
          </div>

          {/* Lista de Productos */}
          <div style={styles.sectionHeader}>
            <Package size={18} /> Productos ({listaProductos.length})
          </div>
          
          {listaProductos.map((prod, idx) => {
              const opciones = prod.opciones || prod.selectedOptions || [];
              // Parseo seguro de precios
              const precioUnitario = Number(prod.precio || prod.precio_unitario || 0);
              const subtotal = precioUnitario * prod.cantidad;

              return (
                <div key={idx} style={styles.productCard}>
                  <div style={{flex: 1}}>
                    <div style={{fontSize: '1rem', fontWeight: '700', color: colors.textMain}}>
                      {prod.cantidad} x {prod.nombre || prod.nombre_producto}
                    </div>
                    
                    {/* Toppings / Opciones */}
                    {opciones.length > 0 && (
                      <div style={{fontSize: '0.8rem', color: colors.textLight, marginTop:'2px'}}>
                         {opciones.map((op, i) => (
                          typeof op === 'string' ? op : op.nombre
                         )).join(', ')}
                      </div>
                    )}
                    
                    {/* Notas */}
                    {prod.descripcion && (
                        <div style={{fontSize: '0.75rem', color: colors.accent, marginTop:'4px', fontWeight: '600'}}>
                            Nota: {prod.descripcion}
                        </div>
                    )}
                  </div>
                  
                  <div style={{fontWeight: '700', fontSize: '1rem', color: colors.textMain}}>
                     ${subtotal.toFixed(2)}
                  </div>
                </div>
              );
          })}

          {/* Sección de Envío / Entrega */}
          <div style={styles.sectionHeader}>
             {pedido.tipo_orden === 'domicilio' ? <Bike size={18}/> : <ShoppingBag size={18}/>}
             {pedido.tipo_orden === 'domicilio' ? 'Datos de Entrega' : 'Recogida'}
          </div>

          {pedido.tipo_orden === 'domicilio' ? (
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
          ) : (
            <div style={{textAlign:'center', padding:'30px', backgroundColor: colors.cardBg, borderRadius:'12px', border:`1px solid ${colors.border}`}}>
               <ShoppingBag size={48} color={colors.textLight} strokeWidth={1} />
               <h5 style={{fontSize:'1.1rem', fontWeight:'700', color: colors.textMain, marginTop: '15px', marginBottom: '5px'}}>Recoger en Tienda</h5>
               <p style={{margin:0, color: colors.textLight, fontSize: '0.9rem'}}>El cliente pasará al mostrador.</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={styles.footer}>
          <div>
            <span style={styles.totalLabel}>Total a Pagar</span>
            <span style={styles.totalPrice}>${Number(pedido.total).toFixed(2)}</span>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>CERRAR</button>
        </div>

      </div>
    </div>
  );
};

export default DetallesPedidoModal;