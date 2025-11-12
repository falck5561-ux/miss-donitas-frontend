import React, { createContext, useState, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [pedidoActual, setPedidoActual] = useState([]);
  const [subtotal, setSubtotal] = useState(0);

  // Calcula el subtotal cada vez que el carrito cambia.
  useEffect(() => {
    // 🚨 CAMBIO: Esta función ahora funcionará correctamente porque
    // nos aseguraremos de que 'item.precio' tenga el precio final.
    const nuevoSubtotal = pedidoActual.reduce((sum, item) => sum + (item.cantidad * Number(item.precio)), 0);
    setSubtotal(nuevoSubtotal);
  }, [pedidoActual]);

  const agregarProductoAPedido = (producto) => {
    // 1. VALIDACIÓN: (Sin cambios)
    if (!producto || typeof producto.id === 'undefined' || (typeof producto.precio === 'undefined' && typeof producto.precioFinal === 'undefined') ) {
      console.error("Intento de agregar un producto inválido al carrito:", producto);
      toast.error("Este producto no se puede agregar.");
      return;
    }

    // 🚨 CAMBIO: Usamos 'cartItemId' (que envía el modal) como ID único.
    // Si no existe (es un producto simple), usamos el 'id' normal.
    const idUnico = producto.cartItemId || producto.id;

    setPedidoActual(prevPedido => {
      // 🚨 CAMBIO: Buscamos el producto por su ID único.
      const productoExistente = prevPedido.find(item => (item.cartItemId || item.id) === idUnico);

      if (productoExistente) {
        // Si el producto ya existe (mismo producto, mismos toppings), incrementamos cantidad.
        return prevPedido.map(item =>
          (item.cartItemId || item.id) === idUnico
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      } else {
        // Si es un producto nuevo...
        
        // 🚨 CAMBIO: Creamos el objeto para guardar.
        // Forzamos que 'precio' sea el 'precioFinal' que envió el modal.
        // Así, el resto de la app (como el useEffect) sigue funcionando.
        const itemParaGuardar = {
          ...producto,
          precio: producto.precioFinal || producto.precio, // Usa precioFinal SI EXISTE
          cantidad: 1
        };

        // (Opcional) Limpiamos la propiedad duplicada para evitar confusión
        delete itemParaGuardar.precioFinal; 

        return [...prevPedido, itemParaGuardar];
      }
    });

    // 2. NOTIFICACIÓN: (Sin cambios)
    toast.success(`${producto.nombre} agregado al carrito`);
  };

  // 🚨 CAMBIO: Estas funciones ahora deben usar el 'idUnico'
  // (que puede ser 'cartItemId' o 'id')
  
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

      // Si la cantidad es 1, se elimina 
      if (productoEncontrado?.cantidad === 1) {
        return prev.filter(item => (item.cartItemId || item.id) !== idUnico);
      }
      
      // Si es mayor, se resta
      return prev.map(item => 
        (item.cartItemId || item.id) === idUnico ? { ...item, cantidad: item.cantidad - 1 } : item
      );
    });
  };

  const eliminarProducto = (idUnico) => {
    setPedidoActual(prev => prev.filter(item => (item.cartItemId || item.id) !== idUnico));
    toast.error("Producto eliminado del carrito.");
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