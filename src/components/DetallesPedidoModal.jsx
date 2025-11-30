import React from 'react';
import { useTheme } from '../context/ThemeContext';

// --- COLORES EXACTOS (Iguales a tu AdminPage) ---
const getModalColors = (mode) => {
  const isPicante = mode === 'picante'; // Detectamos el modo exacto
  
  return {
    overlay: 'rgba(0, 0, 0, 0.85)', // Fondo oscuro detrás del modal
    
    // FONDO DEL MODAL
    bg: isPicante ? '#1E1E1E' : '#FFF8E1', 
    
    // TEXTOS
    textMain: isPicante ? '#FFFFFF' : '#3E2723', // Blanco vs Café Oscuro
    textLight: isPicante ? '#B0B0B0' : '#8D6E63', // Gris vs Café Claro
    
    // BORDES Y LÍNEAS
    border: isPicante ? '#333333' : '#D7CCC8',
    
    // TARJETAS INTERNAS
    cardBg: isPicante ? '#2C2C2C' : '#FFFFFF',
    
    // ACENTOS
    accent: isPicante ? '#FF1744' : '#FF4081', // Rojo Neón vs Rosa Fresa
    
    // BOTONES MAPA
    mapBtnBg: '#1976D2', // Azul estándar de Google Maps
    mapBtnText: '#FFFFFF',
    
    // BOTÓN CERRAR
    closeBtnBg: isPicante ? '#FF1744' : '#FF4081',
    closeBtnText: '#FFFFFF'
  };
};

const DetallesPedidoModal = ({ pedido, onClose }) => {
  const { theme } = useTheme();
  const colors = getModalColors(theme);

  if (!pedido) return null;

  // 1. Detectar lista de productos (Soporte para diferentes estructuras de datos)
  const listaProductos = pedido.detalles_pedido || pedido.productos || pedido.detalles || [];

  // 2. Generar URL de Google Maps (Corregido)
  let mapUrl = '';
  if (pedido.latitude && pedido.longitude) {
    // Si hay coordenadas GPS exactas
    mapUrl = `https://www.google.com/maps/search/?api=1&query=${pedido.latitude},${pedido.longitude}`;
  } else if (pedido.direccion_entrega || pedido.direccion) {
    // Si es por dirección escrita
    const dir = pedido.direccion_entrega || pedido.direccion;
    mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dir + ", Campeche, Mexico")}`;
  }

  // --- ESTILOS (Sin animaciones raras, todo sólido) ---
  const styles = {
    overlay: {
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: colors.overlay,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1050, backdropFilter: 'blur(3px)'
    },
    modal: {
      backgroundColor: colors.bg,
      width: '95%', maxWidth: '600px',
      borderRadius: '20px',
      border: `1px solid ${colors.border}`,
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      maxHeight: '90vh'
    },
    header: {
      padding: '20px 25px', 
      backgroundColor: colors.bg, // El mismo fondo para continuidad
      borderBottom: `2px solid ${colors.border}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    title: { margin: 0, fontSize: '1.5rem', fontWeight: '800', color: colors.accent },
    closeX: { 
        background: 'none', border: 'none', fontSize: '2rem', 
        color: colors.textMain, cursor: 'pointer', lineHeight: 0.8 
    },
    
    body: { padding: '25px', overflowY: 'auto' },
    
    // Filas de información
    row: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '1rem', color: colors.textMain },
    label: { fontWeight: 'bold', color: colors.textLight, textTransform: 'uppercase', fontSize: '0.8rem' },
    value: { fontWeight: 'bold', fontSize: '1.1rem' },
    
    // Badge de estado
    badge: {
      padding: '6px 14px', borderRadius: '50px', fontWeight: 'bold', fontSize: '0.85rem',
      backgroundColor: pedido.estado === 'Pendiente' ? '#D32F2F' : (pedido.estado === 'Completado' ? '#388E3C' : '#FBC02D'),
      color: '#FFFFFF'
    },

    // Sección Productos
    sectionHeader: { 
      marginTop: '30px', marginBottom: '15px', paddingBottom: '8px',
      borderBottom: `1px solid ${colors.border}`, 
      fontWeight: 'bold', color: colors.accent, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px'
    },
    productCard: {
      backgroundColor: colors.cardBg, 
      padding: '15px', 
      borderRadius: '12px', marginBottom: '10px',
      border: `1px solid ${colors.border}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    
    // Sección Entrega
    deliveryBox: {
      backgroundColor: colors.cardBg, padding: '20px',
      borderRadius: '12px', marginTop: '10px',
      border: `1px solid ${colors.border}`
    },
    mapBtn: {
      display: 'block', width: '100%', textAlign: 'center',
      backgroundColor: colors.mapBtnBg, color: colors.mapBtnText,
      padding: '12px', borderRadius: '50px', textDecoration: 'none',
      fontWeight: 'bold', marginTop: '15px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },

    // Footer
    footer: {
      padding: '20px 25px', borderTop: `2px solid ${colors.border}`,
      backgroundColor: colors.bg,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    totalLabel: { display:'block', fontSize:'0.9rem', color: colors.textLight, fontWeight: 'bold', textTransform: 'uppercase' },
    totalPrice: { fontSize: '2rem', fontWeight: '900', color: colors.textMain },
    closeBtn: {
      backgroundColor: colors.closeBtnBg, color: colors.closeBtnText, border: 'none',
      padding: '12px 35px', borderRadius: '50px', fontWeight: 'bold', fontSize: '1rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer'
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
          
          {/* Info Principal */}
          <div style={styles.row}>
            <div>
                <span style={styles.label}>Cliente</span><br/>
                <span style={styles.value}>{pedido.nombre_cliente}</span>
            </div>
            <div style={{textAlign: 'right'}}>
                <span style={styles.label}>Hora</span><br/>
                <span style={styles.value}>{new Date(pedido.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          </div>

          <div style={{marginTop: '10px', textAlign: 'center'}}>
             <span style={styles.badge}>{pedido.estado.toUpperCase()}</span>
          </div>

          {/* Lista de Productos */}
          <div style={styles.sectionHeader}>📦 Productos Ordenados</div>
          
          {listaProductos.map((prod, idx) => {
              // Ajuste para leer opciones/toppings
              const opciones = prod.opciones || prod.selectedOptions || [];
              const precioUnitario = Number(prod.precio || prod.precio_unitario || 0);
              const subtotal = precioUnitario * prod.cantidad;

              return (
                <div key={idx} style={styles.productCard}>
                  <div style={{flex: 1}}>
                    <div style={{fontSize: '1.1rem', fontWeight: 'bold', color: colors.textMain}}>
                      {prod.cantidad}x {prod.nombre || prod.nombre_producto}
                    </div>
                    
                    {/* Toppings / Opciones */}
                    {opciones.length > 0 && (
                      <div style={{fontSize: '0.85rem', color: colors.textLight, marginTop:'4px', fontStyle:'italic'}}>
                        {opciones.map((op, i) => (
                          <span key={i}>+ {op.nombre}{i < opciones.length -1 ? ', ' : ''}</span>
                        ))}
                      </div>
                    )}
                    
                    {/* Notas del producto si las hay */}
                    {prod.descripcion && (
                        <div style={{fontSize: '0.8rem', color: colors.accent, marginTop:'4px'}}>
                            Nota: {prod.descripcion}
                        </div>
                    )}
                  </div>
                  
                  <div style={{fontWeight: '900', fontSize: '1.1rem', color: colors.textMain}}>
                     ${subtotal.toFixed(2)}
                  </div>
                </div>
              );
          })}

          {/* Sección de Envío */}
          <div style={styles.sectionHeader}>🛵 Datos de Entrega</div>
          {pedido.tipo_orden === 'domicilio' ? (
            <div style={styles.deliveryBox}>
              <div style={{marginBottom: '15px'}}>
                <span style={styles.label}>Dirección:</span>
                <div style={{fontSize:'1.1rem', color: colors.textMain, marginTop: '5px', lineHeight: '1.4'}}>
                  {pedido.direccion_entrega || pedido.direccion || "Sin dirección registrada"}
                </div>
              </div>
              
              {(pedido.referencia) && (
                 <div style={{marginBottom: '15px'}}>
                   <span style={styles.label}>Referencia:</span>
                   <div style={{fontStyle:'italic', color: colors.textMain}}>"{pedido.referencia}"</div>
                 </div>
              )}
              
              <div style={{marginBottom: '5px'}}>
                 <span style={styles.label}>Teléfono:</span> <span style={{color: colors.textMain}}>{pedido.telefono || '---'}</span>
              </div>

              {mapUrl && (
                <a href={mapUrl} target="_blank" rel="noopener noreferrer" style={styles.mapBtn}>
                  📍 ABRIR EN GOOGLE MAPS
                </a>
              )}
            </div>
          ) : (
            <div style={{textAlign:'center', padding:'25px', backgroundColor: colors.cardBg, borderRadius:'12px', border:`1px solid ${colors.border}`}}>
               <div style={{fontSize:'2rem', marginBottom:'10px'}}>👜</div>
               <span style={{fontSize:'1.2rem', fontWeight:'bold', color: colors.textMain}}>Recoger en Tienda</span>
               <p style={{margin:'5px 0 0 0', color: colors.textLight}}>El cliente pasará por su pedido.</p>
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