import React from 'react';
import { useTheme } from '../context/ThemeContext';

// --- COLORES DINÁMICOS (Premium & Picante) ---
const getModalColors = (mode) => {
  const isDark = mode === 'dark';
  return {
    overlay: 'rgba(0, 0, 0, 0.75)',
    bg: isDark ? '#2b1f1f' : '#FFFDF5',          
    textMain: isDark ? '#fff1e6' : '#5D4037',    
    textLight: isDark ? '#bcaaa4' : '#8D6E63',   
    border: isDark ? '#4e342e' : '#efebe9',
    
    primary: isDark ? '#ff1744' : '#FF80AB',     
    mapBtnBg: '#29B6F6',                         
    mapBtnText: '#FFFFFF',
    
    cardSection: isDark ? '#3e2723' : '#FFFFFF', 
    totalText: isDark ? '#69F0AE' : '#2E7D32',   
    closeBtn: isDark ? '#ff5252' : '#EF5350'     
  };
};

const DetallesPedidoModal = ({ pedido, onClose }) => {
  const { theme } = useTheme();
  const colors = getModalColors(theme);

  if (!pedido) return null;

  // 1. Detectar lista de productos
  const listaProductos = pedido.productos || pedido.detalles || [];

  // 2. Generar URL de Google Maps
  let mapUrl = '';
  if (pedido.latitude && pedido.longitude) {
    mapUrl = `https://www.google.com/maps/search/?api=1&query=${pedido.latitude},${pedido.longitude}`;
  } else if (pedido.direccion_entrega || pedido.direccion) {
    const dir = pedido.direccion_entrega || pedido.direccion;
    mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dir + ", Campeche, Mexico")}`;
  }

  // --- ESTILOS EN LÍNEA ---
  const styles = {
    overlay: {
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: colors.overlay,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, backdropFilter: 'blur(4px)'
    },
    modal: {
      backgroundColor: colors.bg,
      width: '95%', maxWidth: '600px',
      borderRadius: '24px',
      boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      maxHeight: '90vh', animation: 'fadeIn 0.3s ease-out'
    },
    header: {
      padding: '20px 25px', backgroundColor: colors.cardSection,
      borderBottom: `1px solid ${colors.border}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    title: { margin: 0, fontSize: '1.4rem', fontWeight: '800', color: colors.textMain },
    closeX: { background: 'none', border: 'none', fontSize: '1.8rem', color: colors.textLight, cursor: 'pointer', lineHeight: 1 },
    
    body: { padding: '25px', overflowY: 'auto' },
    
    row: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem', color: colors.textMain },
    label: { fontWeight: 'bold', color: colors.textLight },
    
    badge: {
      padding: '5px 12px', borderRadius: '50px', fontWeight: 'bold', fontSize: '0.8rem',
      backgroundColor: pedido.estado === 'Pendiente' ? '#FFF8E1' : '#E8F5E9',
      color: pedido.estado === 'Pendiente' ? '#F57C00' : '#2E7D32',
      border: `1px solid ${pedido.estado === 'Pendiente' ? '#FFE0B2' : '#C8E6C9'}`
    },

    sectionHeader: { 
      marginTop: '25px', marginBottom: '15px', paddingBottom: '5px',
      borderBottom: `2px solid ${colors.border}`, 
      fontWeight: 'bold', color: colors.textMain 
    },
    productCard: {
      display: 'flex', alignItems: 'center', gap: '15px',
      backgroundColor: colors.cardSection, padding: '15px', // Más padding ya que no hay imagen
      borderRadius: '16px', marginBottom: '10px',
      border: `1px solid ${colors.border}`
    },
    
    deliveryBox: {
      backgroundColor: colors.cardSection, padding: '20px',
      borderRadius: '16px', marginTop: '10px',
      border: `1px dashed ${colors.primary}`
    },
    mapBtn: {
      display: 'block', width: '100%', textAlign: 'center',
      backgroundColor: colors.mapBtnBg, color: colors.mapBtnText,
      padding: '12px', borderRadius: '12px', textDecoration: 'none',
      fontWeight: 'bold', marginTop: '15px',
      boxShadow: '0 4px 10px rgba(41, 182, 246, 0.3)',
      transition: 'transform 0.2s'
    },

    footer: {
      padding: '20px 25px', borderTop: `1px solid ${colors.border}`,
      backgroundColor: colors.cardSection,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    totalPrice: { fontSize: '1.8rem', fontWeight: '900', color: colors.totalText },
    closeBtn: {
      backgroundColor: colors.closeBtn, color: 'white', border: 'none',
      padding: '10px 30px', borderRadius: '50px', fontWeight: 'bold',
      boxShadow: '0 4px 12px rgba(239, 83, 80, 0.4)', cursor: 'pointer'
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        
        {/* ENCABEZADO */}
        <div style={styles.header}>
          <h3 style={styles.title}>Pedido #{pedido.id}</h3>
          <button style={styles.closeX} onClick={onClose}>×</button>
        </div>

        {/* CONTENIDO */}
        <div style={styles.body}>
          {/* Info Cliente */}
          <div style={styles.row}>
            <span style={styles.label}>Cliente:</span>
            <span style={{fontWeight:'bold'}}>{pedido.nombre_cliente}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Fecha:</span>
            <span>{new Date(pedido.fecha).toLocaleString()}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Estado:</span>
            <span style={styles.badge}>{pedido.estado}</span>
          </div>

          {/* Lista de Productos (SIN IMAGENES) */}
          <div style={styles.sectionHeader}>📦 Productos</div>
          {listaProductos.map((prod, idx) => {
             const opciones = prod.opciones || prod.selectedOptions || [];

             return (
               <div key={idx} style={styles.productCard}>
                 {/* Solo Texto */}
                 <div style={{flex: 1}}>
                   <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', fontSize: '1.05rem', color: colors.textMain}}>
                     {/* Nombre del producto destacado */}
                     <span style={{fontWeight: '800'}}>
                       {prod.cantidad}x {prod.nombre || prod.nombre_producto}
                     </span>
                     <span style={{fontWeight:'bold'}}>
                        ${(Number(prod.precio || prod.precio_unitario) * prod.cantidad).toFixed(2)}
                     </span>
                   </div>
                   
                   {/* Ingredientes / Opciones */}
                   {opciones.length > 0 && (
                     <div style={{fontSize: '0.85rem', color: colors.textLight, marginTop:'6px', fontStyle:'italic'}}>
                       {opciones.map((op, i) => (
                         <span key={i}>• {op.nombre} {i < opciones.length -1 ? ', ' : ''}</span>
                       ))}
                     </div>
                   )}
                 </div>
               </div>
             );
          })}

          {/* Sección de Envío */}
          <div style={styles.sectionHeader}>🛵 Detalles de Entrega</div>
          {pedido.tipo_orden === 'domicilio' ? (
            <div style={styles.deliveryBox}>
              <div style={{marginBottom: '10px'}}>
                <span style={{display:'block', fontSize:'0.85rem', color: colors.textLight}}>Dirección:</span>
                <span style={{fontWeight:'bold', fontSize:'1.05rem', color: colors.textMain}}>
                  {pedido.direccion_entrega || pedido.direccion || "Sin dirección registrada"}
                </span>
              </div>
              
              {(pedido.referencia) && (
                 <div style={{marginBottom: '10px'}}>
                   <span style={{display:'block', fontSize:'0.85rem', color: colors.textLight}}>Referencia:</span>
                   <span style={{fontStyle:'italic', color: colors.textMain}}>"{pedido.referencia}"</span>
                 </div>
              )}

              {mapUrl && (
                <a href={mapUrl} target="_blank" rel="noopener noreferrer" style={styles.mapBtn}>
                  📍 Ver Ubicación en Google Maps
                </a>
              )}
            </div>
          ) : (
            <div style={{textAlign:'center', padding:'20px', backgroundColor: colors.cardSection, borderRadius:'16px', border:`1px solid ${colors.border}`}}>
               <span style={{fontSize:'1.2rem', fontWeight:'bold', color: colors.primary}}>🛍️ Recoger en Tienda</span>
               <p style={{margin:'5px 0 0 0', color: colors.textLight, fontSize:'0.9rem'}}>El cliente pasará por su pedido.</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={styles.footer}>
          <div>
            <span style={{display:'block', fontSize:'0.85rem', color: colors.textLight}}>Total a Pagar:</span>
            <span style={styles.totalPrice}>${Number(pedido.total).toFixed(2)}</span>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>Cerrar</button>
        </div>

      </div>
    </div>
  );
};

export default DetallesPedidoModal;