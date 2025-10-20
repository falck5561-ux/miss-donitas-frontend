import React, { createContext, useState, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [pedidoActual, setPedidoActual] = useState([]);
  const [subtotal, setSubtotal] = useState(0);

  // Calcula el subtotal cada vez que el carrito cambia.
  useEffect(() => {
    const nuevoSubtotal = pedidoActual.reduce((sum, item) => sum + (item.cantidad * Number(item.precio)), 0);
    setSubtotal(nuevoSubtotal);
  }, [pedidoActual]);

  const agregarProductoAPedido = (producto) => {
    // 1. VALIDACIÓN: Nos aseguramos de que el producto sea válido.
    if (!producto || typeof producto.id === 'undefined' || typeof producto.precio === 'undefined') {
      console.error("Intento de agregar un producto inválido al carrito:", producto);
      toast.error("Este producto no se puede agregar.");
      return; // Detenemos la función si el producto no es válido.
    }

    setPedidoActual(prevPedido => {
      const productoExistente = prevPedido.find(item => item.id === producto.id);

      if (productoExistente) {
        // Si el producto ya existe, solo incrementamos su cantidad.
        return prevPedido.map(item =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      } else {
        // Si es un producto nuevo, lo añadimos al carrito con cantidad 1.
        // El precio ya viene calculado desde la página de productos.
        return [...prevPedido, { ...producto, cantidad: 1 }];
      }
    });

    // 2. NOTIFICACIÓN: Informamos al usuario que el producto se agregó con éxito.
    toast.success(`${producto.nombre} agregado al carrito`);
  };

  const incrementarCantidad = (productoId) => {
    setPedidoActual(prev => 
      prev.map(item => 
        item.id === productoId ? { ...item, cantidad: item.cantidad + 1 } : item
      )
    );
  };

  const decrementarCantidad = (productoId) => {
    setPedidoActual(prev => {
      const productoEncontrado = prev.find(item => item.id === productoId);

      // Si la cantidad es 1, al decrementar se elimina del carrito.
      if (productoEncontrado?.cantidad === 1) {
        return prev.filter(item => item.id !== productoId);
      }
      
      // Si la cantidad es mayor a 1, solo se resta.
      return prev.map(item => 
        item.id === productoId ? { ...item, cantidad: item.cantidad - 1 } : item
      );
    });
  };

  const eliminarProducto = (productoId) => {
    setPedidoActual(prev => prev.filter(item => item.id !== productoId));
    toast.error("Producto eliminado del carrito.");
  };

  const limpiarPedido = () => {
    setPedidoActual([]);
  };

  // Valores que se expondrán a los componentes que usen este contexto.
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