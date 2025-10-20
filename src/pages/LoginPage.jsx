// Archivo: src/pages/LoginPage.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import toast from 'react-hot-toast'; 

// --- 1. IMPORTA EL BOTÓN DE GOOGLE Y AXIOS ---
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';


function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- Lógica de redirección (sin cambios) ---
  useEffect(() => {
    if (user) {
      toast('Ya tienes una sesión activa.', { icon: 'ℹ️' });
      switch (user.rol) {
        case 'Jefe':
          navigate('/admin');
          break;
        case 'Empleado':
          navigate('/pos');
          break;
        case 'Cliente':
          navigate('/');
          break;
        default:
          navigate('/');
      }
    }
  }, [user, navigate]);


  // --- Lógica de login con email/pass (sin cambios) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const loggedInUser = await login(email, password);
      
      if (loggedInUser) {
        toast.success('¡Bienvenido a Tito Café!');

        switch (loggedInUser.rol) {
          case 'Jefe':
            navigate('/admin');
            break;
          case 'Empleado':
            navigate('/pos');
            break;
          case 'Cliente':
            navigate('/');
            break;
          default:
            navigate('/');
        }
      } else {
        setError('Email o contraseña incorrectos.');
      }
    } catch (err) {
      setError('Ocurrió un error. Inténtelo de nuevo.');
      console.error("Error en login:", err);
    }
  };

  // --- 2. NUEVAS FUNCIONES PARA GOOGLE ---
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // 1. Enviamos el token de Google a nuestro backend
      const res = await axios.post('/api/auth/google-login', { 
        token: credentialResponse.credential 
      });

      // 2. Nuestro backend nos da nuestro propio token
      const { token } = res.data;

      // 3. Guardamos el token en localStorage
      localStorage.setItem('token', token);

      // 4. Mostramos éxito y forzamos un re-inicio de la app
      // Esto permite que tu AuthContext lea el nuevo token y te loguee
      toast.success('¡Bienvenido a Tito Café! Redirigiendo...');
      navigate('/');
      window.location.reload();

    } catch (error) {
      console.error("Error en login de Google:", error);
      toast.error('Fallo el inicio de sesión con Google.');
    }
  };

  const handleGoogleError = () => {
    toast.error('Fallo el inicio de sesión con Google.');
  };

  
  // --- Render condicional (sin cambios) ---
  if (user) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Redirigiendo...</span>
        </div>
        <p className="mt-3">Ya has iniciado sesión. Redirigiendo...</p>
      </div>
    );
  }

  // --- 3. JSX ACTUALIZADO CON EL BOTÓN ---
  return (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-4">
        <div className="card shadow-sm p-4">
          <h2 className="text-center mb-4">Iniciar Sesión</h2>
          <form onSubmit={handleSubmit}>
            {/* ... (inputs de email y password, sin cambios) ... */}
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Correo Electrónico</label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Contraseña</label>
              <input
                type="password"
                className="form-control"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="d-grid">
              <button type="submit" className="btn btn-primary">
                Ingresar
              </button>
            </div>
          </form>

          <p className="mt-3 text-center">
            ¿No tienes una cuenta? <Link to="/register">Crea una aquí</Link>
          </p>

          {/* --- AQUÍ VA EL BOTÓN DE GOOGLE --- */}
          <div className="text-center">
            <hr />
            <p className="mb-3">O inicia sesión con</p>
            <div className="d-flex justify-content-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap // Intenta el login automático si ya está logueado en Google
              />
            </div>
          </div>
          {/* --- FIN DEL BOTÓN DE GOOGLE --- */}
          
        </div>
      </div>
    </div>
  );
}

export default LoginPage;