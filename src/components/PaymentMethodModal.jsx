// Guarda esto como: src/components/PaymentMethodModal.jsx

import React from 'react';
import { motion } from 'framer-motion';

// Estilos básicos para el modal (puedes ajustarlos)
const modalStyles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1060, // zIndex más alto que el modal de producto
  },
  content: {
    width: '90%',
    maxWidth: '400px', // Un modal más pequeño
    background: 'var(--bs-card-bg)',
    borderRadius: '15px',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    color: 'var(--bs-body-color)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    textAlign: 'center',
    marginBottom: '0.5rem',
  },
  total: {
    textAlign: 'center',
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
  },
};

function PaymentMethodModal({ total, onClose, onSelectPayment }) {
  return (
    <motion.div
      style={modalStyles.backdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
    >
      <motion.div
        style={modalStyles.content}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={modalStyles.title}>Total a Pagar</h3>
        <h1 style={modalStyles.total}>${total.toFixed(2)}</h1>
        
        <p className="text-center text-muted">Seleccione el método de pago:</p>
        
        <div className="d-grid gap-3">
          <button 
            className="btn btn-success btn-lg"
            onClick={() => onSelectPayment('Efectivo')}
          >
            Efectivo
          </button>
          
          {/* --- AQUÍ ESTÁ LA CORRECCIÓN --- */}
          <button 
            className="btn btn-primary btn-lg"
            onClick={() => onSelectPayment('Tarjeta')} 
          >
            Terminal (Tarjeta)
          </button>
          
          <button 
            className="btn btn-secondary mt-3"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default PaymentMethodModal;