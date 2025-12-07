// Archivo: src/components/CheckoutForm.jsx

import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { crearPedidoAPI } from '../services/api'; // Asegúrate de que la ruta sea correcta

function CheckoutForm({ total, datosPedido, handleSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    // ================== PASO 1: CONFIRMAR EL PAGO CON STRIPE ==================
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required' 
    });

    if (stripeError) {
      // Errores como "Tu tarjeta fue declinada" o datos inválidos.
      setError(stripeError.message);
      toast.error(stripeError.message);
      setProcessing(false);
      return;
    }

    // ================== PASO 2: CREAR EL PEDIDO EN TU BACKEND ==================
    if (paymentIntent && paymentIntent.status === 'succeeded') {
      try {
        // Añadimos el ID de Stripe al pedido para tener una referencia
        // 'datosPedido' ya incluye el teléfono, así que el backend lo guardará en el perfil del usuario.
        const pedidoFinal = { ...datosPedido, stripePaymentId: paymentIntent.id };

        // Llamamos a la API que conecta con pedidosController.js
        await crearPedidoAPI(pedidoFinal);
        
        // --- CORRECCIÓN: ELIMINADA LA NOTIFICACIÓN DUPLICADA ---
        // Aquí NO mostramos toast.success. 
        // Dejamos que 'handleSuccess()' se encargue de limpiar el carrito y avisar al usuario.
        
        handleSuccess(); 

      } catch (apiError) {
        // Error si nuestro propio backend falla después de un pago exitoso en Stripe.
        const errorMessage = apiError.response?.data?.msg || 'Tu pago fue exitoso, pero hubo un problema al registrar tu pedido. Por favor, contáctanos.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    }
    
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button
        disabled={processing || !stripe || !elements}
        className="btn btn-primary w-100 mt-4"
      >
        {processing ? 'Procesando...' : `Pagar $${total.toFixed(2)}`}
      </button>
      {error && <div className="alert alert-danger mt-3">{error}</div>}
    </form>
  );
}

export default CheckoutForm;