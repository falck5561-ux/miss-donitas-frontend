import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

// Este componente ahora es el guardia de seguridad principal de tu app
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  // Si todavía estamos verificando si hay un usuario, no mostramos nada para evitar parpadeos
  if (loading) {
    return null; 
  }

  // 1. Si NO hay usuario, lo mandamos a iniciar sesión.
  //    Guardamos la página a la que intentaba ir para redirigirlo allí después.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Si la ruta requiere roles específicos Y el rol del usuario NO está en la lista de roles permitidos...
  if (roles && !roles.includes(user.rol)) {
    // ...lo redirigimos a su página de inicio correcta.
    // ¡Esto evita que un Jefe o Empleado quede atrapado en una página de cliente rota!
    if (user.rol === 'Jefe') {
      return <Navigate to="/admin" replace />;
    }
    if (user.rol === 'Empleado') {
      return <Navigate to="/pos" replace />;
    }
    // Si es un cliente intentando entrar a una ruta de admin, lo mandamos a su página.
    return <Navigate to="/hacer-un-pedido" replace />;
  }

  // 3. Si todas las verificaciones pasan, mostramos la página solicitada.
  return children;
};

export default ProtectedRoute;
