// Archivo: src/pages/RegisterPage.jsx
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import toast from 'react-hot-toast'; // Es una buena práctica añadir notificaciones

function RegisterPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const { nombre, email, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const registerExitoso = await register(nombre, email, password);
      if (registerExitoso) {
        toast.success('¡Cuenta creada con éxito! Bienvenido.');
        // ============================================
        // === ¡AQUÍ ESTÁ LA CORRECCIÓN! ===
        // ============================================
        // Redirigimos a la página principal para darle tiempo a la app de procesar la sesión.
        navigate('/');
      } else {
        setError('No se pudo completar el registro. Es posible que el correo ya esté en uso.');
      }
    } catch (err) {
      setError('Ocurrió un error en el servidor. Inténtelo de nuevo.');
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-4">
        <div className="card shadow-sm p-4">
          <h2 className="text-center mb-4">Crear Cuenta</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="nombre" className="form-label">Nombre Completo</label>
              <input
                type="text"
                className="form-control"
                id="nombre"
                name="nombre"
                value={nombre}
                onChange={onChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Correo Electrónico</label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={email}
                onChange={onChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Contraseña</label>
              <input
                type="password"
                className="form-control"
                id="password"
                name="password"
                value={password}
                onChange={onChange}
                minLength="6"
                required
              />
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="d-grid">
              <button type="submit" className="btn btn-primary">
                Registrarse
              </button>
            </div>
          </form>
          <p className="mt-3 text-center">
            ¿Ya tienes una cuenta? <Link to="/login">Inicia Sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;