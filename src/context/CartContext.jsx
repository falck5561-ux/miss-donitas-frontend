import React, { createContext, useState, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [pedidoActual, setPedidoActual] = useState([]);
  const [subtotal, setSubtotal] = useState(0);

  // Calcula el subtotal cada vez que el carrito cambia
  useEffect(() => {
    const nuevoSubtotal = pedidoActual.reduce((sum, item) => sum + (item.cantidad * Number(item.precio)), 0);
    setSubtotal(nuevoSubtotal);
  }, [pedidoActual]);

  const agregarProductoAPedido = (producto) => {
    // 1. VALIDACIÓN BÁSICA
    if (!producto || typeof producto.id === 'undefined') {
      console.error("Intento de agregar un producto inválido:", producto);
      toast.error("Error: Producto inválido.");
      return;
    }

    // 🚨 CORRECCIÓN CLAVE PARA EL POS Y EL JEFE:
    // Determinamos el ID ÚNICO de la línea del carrito (cartItemId).
    // 
    // Caso A: El modal ya nos envió un 'cartItemId' (Perfecto).
    // Caso B: El POS mandó el producto sin ID único pero TIENE OPCIONES -> Generamos uno aquí.
    // Caso C: Es un producto simple sin opciones -> Usamos su ID original para que sí se agrupen.
    
    let idUnico = producto.cartItemId;

    if (!idUnico) {
      const tieneOpciones = producto.opcionesSeleccionadas && producto.opcionesSeleccionadas.length > 0;
      
      if (tieneOpciones) {
        // Si tiene toppings, FORZAMOS que sea una línea nueva usando la hora actual
        idUnico = `${producto.id}-POS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      } else {
        // Si es simple (ej. una Coca Cola), usamos el ID normal para que se sumen
        idUnico = producto.id;
      }
    }

    setPedidoActual(prevPedido => {
      // Buscamos si YA existe esa línea exacta en el pedido usando el ID ÚNICO
      const index = prevPedido.findIndex(item => (item.cartItemId || item.id) === idUnico);

      if (index >= 0) {
        // YA EXISTE: Es exactamente el mismo producto con los mismos toppings -> Sumamos 1
        const nuevoPedido = [...prevPedido];
        nuevoPedido[index].cantidad += 1;
        return nuevoPedido;
      } else {
        // NO EXISTE: Es un producto nuevo o con toppings diferentes -> Creamos línea nueva
        
        // Preparamos el objeto limpio
        const itemParaGuardar = {
          ...producto,
          id: producto.id,       // ID original (para base de datos)
          cartItemId: idUnico,   // ID de fila (para el frontend)
          precio: Number(producto.precioFinal || producto.precio), // Aseguramos el precio correcto
          cantidad: 1
        };

        // Limpieza opcional
        delete itemParaGuardar.precioFinal; 

        return [...prevPedido, itemParaGuardar];
      }
    });

    toast.success(`${producto.nombre} agregado`);
  };

  // --- FUNCIONES AUXILIARES (Actualizadas para usar idUnico) ---

  const incrementarCantidad = (idUnico) => {
    setPedidoActual(prev => 
      prev.map(item => 
        (item.cartItemId || item.id) === idUnico ? { ...item, cantidad: item.cantidad + 1 } : item
      )
    );
  };

  const decrementarCantidad = (idUnico) => {
    setPedidoActual(prev => {
      const productoEncontrado = prev.find(item => (item.cartItemId || item.id) === idUnico);

      // Si la cantidad es 1, se elimina del carrito
      if (productoEncontrado?.cantidad === 1) {
        return prev.filter(item => (item.cartItemId || item.id) !== idUnico);
      }
      
      // Si es mayor a 1, solo restamos
      return prev.map(item => 
        (item.cartItemId || item.id) === idUnico ? { ...item, cantidad: item.cantidad - 1 } : item
      );
    });
  };

  const eliminarProducto = (idUnico) => {
    setPedidoActual(prev => prev.filter(item => (item.cartItemId || item.id) !== idUnico));
    toast.error("Eliminado del pedido");
  };

  const limpiarPedido = () => {
    setPedidoActual([]);
  };

  const value = {
    pedidoActual,
    subtotal,
    agregarProductoAPedido,
    incrementarCantidad,
    decrementarCantidad,
    eliminarProducto,
    limpiarPedido,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;