import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; 
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { CartProvider } from './context/CartContext.jsx'; 
import { InstallPwaProvider } from './context/InstallPwaContext.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google'; // <-- 1. IMPORTA GOOGLE
import axios from 'axios';

// Establecemos la URL base para todas las peticiones
axios.defaults.baseURL = 'https://tito-cafe-backend.onrender.com';

// **LÍNEA AÑADIDA PARA SOLUCIONAR CORS/AUTH EN PETICIONES GET**
axios.defaults.withCredentials = true;

// Configuramos Axios para que envíe el token en cada petición
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});


// <-- 2. TU ID DE CLIENTE
const GOOGLE_CLIENT_ID = "410811838547-ltq555co1hve1m8c891u6olhf4on7nrd.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* <-- 3. ENVUELVE TODO CON EL PROVIDER DE GOOGLE */}
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <InstallPwaProvider>
        <AuthProvider>
          <ThemeProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </ThemeProvider>
        </AuthProvider>
      </InstallPwaProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);