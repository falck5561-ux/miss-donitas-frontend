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
    if (!producto || typeof producto.id === 'undefined') {
      console.error("Producto inválido:", producto);
      return toast.error("Error: No se pudo agregar.");
    }

    // 🚨 CORRECCIÓN DE AGRUPAMIENTO (STACKING) 🚨
    // Generamos un ID basado en el CONTENIDO (Ingredientes), no en la hora.
    
    let idHuellaDigital;
    
    // Detectamos si viene con opciones (del Modal)
    // Nota: A veces viene como 'opcionesSeleccionadas' (nuestro modal nuevo)
    // o como 'opciones' (si viniera de otro lado).
    const opciones = producto.opcionesSeleccionadas || producto.opciones || [];

    if (opciones.length > 0) {
      // SI TIENE TOPPINGS:
      // Creamos una firma única ordenando los IDs de los toppings.
      // Así "Chocolate + Vainilla" genera el mismo ID que "Vainilla + Chocolate".
      // Usamos los IDs de las opciones para ser precisos.
      const firmaToppings = opciones
        .map(op => op.id)
        .sort((a, b) => a - b) // Ordenar para consistencia (1, 5, 9)
        .join('-');
      
      // El ID único será: "ID_PROD-OPC-ID_TOPPING1-ID_TOPPING2..."
      idHuellaDigital = `${producto.id}-OPC-${firmaToppings}`;
    } else {
      // SI ES SIMPLE (Sin toppings):
      // Usamos solo el ID del producto. Así todos los "Café Solos" se agrupan.
      idHuellaDigital = String(producto.id);
    }

    setPedidoActual(prevPedido => {
      // Buscamos si ya existe un producto con esta MISMA huella digital
      const index = prevPedido.findIndex(item => item.cartItemId === idHuellaDigital);

      if (index >= 0) {
        // ¡YA EXISTE! -> Es idéntico, así que solo sumamos 1 a la cantidad.
        const nuevoPedido = [...prevPedido];
        nuevoPedido[index].cantidad += 1;
        // Actualizamos el precio por si acaso (aunque debería ser el mismo)
        nuevoPedido[index].precio = Number(producto.precio);
        return nuevoPedido;
      } else {
        // NO EXISTE (Es nuevo o tiene toppings diferentes) -> Creamos nueva fila.
        const itemParaGuardar = {
          ...producto,
          cartItemId: idHuellaDigital, // Guardamos nuestra huella como el ID del carrito
          cantidad: 1,
          precio: Number(producto.precio) // Aseguramos que el precio sea número
        };
        return [...prevPedido, itemParaGuardar];
      }
    });

    toast.success(`${producto.nombre} agregado`);
  };

  // --- FUNCIONES DE CONTROL (Usando cartItemId) ---

  const incrementarCantidad = (cartItemId) => {
    setPedidoActual(prev => prev.map(item => 
      item.cartItemId === cartItemId ? { ...item, cantidad: item.cantidad + 1 } : item
    ));
  };

  const decrementarCantidad = (cartItemId) => {
    setPedidoActual(prev => {
      const item = prev.find(i => i.cartItemId === cartItemId);
      // Si solo queda 1, lo borramos
      if (item?.cantidad === 1) {
        return prev.filter(i => i.cartItemId !== cartItemId);
      }
      // Si hay más, restamos 1
      return prev.map(i => i.cartItemId === cartItemId ? { ...i, cantidad: i.cantidad - 1 } : i);
    });
  };

  const eliminarProducto = (cartItemId) => {
    setPedidoActual(prev => prev.filter(item => item.cartItemId !== cartItemId));
    toast.error("Producto eliminado");
  };

  const limpiarPedido = () => setPedidoActual([]);

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