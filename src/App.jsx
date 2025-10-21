import React, { useState, useEffect } from 'react'; // <--- Se añade useState y useEffect
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import 'bootstrap/dist/js/bootstrap.bundle.min';

// Importación de Componentes
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import DinoGame from './components/DinoGame'; // <--- Se importa el componente del juego

// Importación de las Páginas
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import PosPage from './pages/PosPage';
import ClientePage from './pages/ClientePage';
import CanjearPage from './pages/CanjearPage';
import CombosPage from './pages/CombosPage';

// --- Hook para detectar si el usuario está desconectado ---
const useOfflineStatus = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return isOffline;
};


function App() {
  const isOffline = useOfflineStatus(); // Se utiliza el hook

  return (
    <BrowserRouter>
      <Navbar />
      <Toaster position="top-center" reverseOrder={false} />
      
      <div className="container pt-5 mt-4">
        {/* Si el usuario está desconectado, muestra el juego. Si no, muestra las rutas normales. */}
        {isOffline ? (
          <DinoGame />
        ) : (
          <Routes>
            {/* --- Rutas Públicas --- */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/combos" element={<CombosPage />} />

            {/* --- Rutas Protegidas --- */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute roles={['Jefe']}>
                  <AdminPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pos" 
              element={
                <ProtectedRoute roles={['Empleado', 'Jefe']}>
                  <PosPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hacer-un-pedido" 
              element={
                <ProtectedRoute roles={['Cliente']}>
                  <ClientePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/canjear" 
              element={
                <ProtectedRoute roles={['Empleado', 'Jefe']}>
                  <CanjearPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        )}
      </div>

      {/* --- INICIO DE LA MODIFICACIÓN --- */}
      {/* Aquí se agrega el footer con tu nombre y contacto */}
      {/* Le añado un margen superior 'mt-5' para separarlo del contenido */}
      <footer className="text-center py-4 px-3 mt-5">
        <p className="mb-1">
          &copy; {new Date().getFullYear()} Miss Donitas. Todos los derechos reservados.
        </p>
        <p className="mb-0 text-body-secondary" style={{ fontSize: '0.9rem' }}>
          Desarrollado con ❤️ por Josue Perez Ponce. Contacto: 
          <a 
            href="mailto:Jperezponce@gmail.com" 
            className="text-body-secondary"
          >
            Jperezponce@gmail.com
          </a>
        </p>
      </footer>
      {/* --- FIN DE LA MODIFICACIÓN --- */}
      
    </BrowserRouter>
  );
}

export default App;