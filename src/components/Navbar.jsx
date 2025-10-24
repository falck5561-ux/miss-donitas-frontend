import React, { useContext, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import ThemeToggleButton from './ThemeToggleButton';
import { useInstallPWA } from '../context/InstallPwaContext';
import { useTheme } from '../context/ThemeContext';

// --- COMPONENTE DE ENLACES DEL MENÚ ---
const MenuLinks = ({ onLinkClick }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { installPrompt, handleInstall } = useInstallPWA();

  const handleClick = (e, to) => {
    e.preventDefault();
    if (onLinkClick) onLinkClick();
    setTimeout(() => navigate(to), 250);
  };

  const handleInstallClick = () => {
    if (onLinkClick) onLinkClick();
    handleInstall();
  };

  return (
    <>
      <li className="nav-item">
        <NavLink className="nav-link" to="/" onClick={(e) => handleClick(e, "/")}>
          Inicio
        </NavLink>
      </li>
      <li className="nav-item">
        <NavLink className="nav-link" to="/combos" onClick={(e) => handleClick(e, "/combos")}>
          Combos
        </NavLink>
      </li>
      {user?.rol === 'Cliente' && (
        <li className="nav-item">
          <NavLink className="nav-link" to="/hacer-un-pedido" onClick={(e) => handleClick(e, "/hacer-un-pedido")}>
            Mi Pedido
          </NavLink>
        </li>
      )}
      {user?.rol === 'Jefe' && ( // Asegúrate que el rol 'Jefe' sea correcto
        <li className="nav-item">
          <NavLink className="nav-link" to="/admin" onClick={(e) => handleClick(e, "/admin")}>
            Admin
          </NavLink>
        </li>
      )}
      {installPrompt && (
        <li className="nav-item">
          <a className="nav-link" href="#" onClick={handleInstallClick} style={{ cursor: 'pointer' }}>
            Instalar App
          </a>
        </li>
      )}
      {/* Puedes añadir más enlaces aquí si es necesario */}
    </>
  );
};


// --- COMPONENTE DE CONTROLES DE USUARIO ---
const UserControls = ({ isMobile = false, onControlClick }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  // Añadimos clases de flexbox para alinear los botones en el footer
  const containerClass = isMobile ? "d-flex justify-content-between align-items-center w-100" : "";
  const buttonClass = isMobile ? "ms-2" : "ms-3"; // Ajustamos margen para móvil

  const handleLoginClick = (e) => {
    e.preventDefault();
    if (onControlClick) onControlClick();
    setTimeout(() => navigate('/login'), 250);
  };

  const handleLogoutClick = () => {
    if (onControlClick) onControlClick();
    setTimeout(logout, 250);
  };

  return (
    // Envolvemos en un div para aplicar flexbox en móvil
    <div className={containerClass}>
      <span onClick={onControlClick}>
        <ThemeToggleButton />
      </span>

      {user ? (
        // Quitamos la lógica ternaria isMobile, ya que el botón de logout ahora es consistente
         <button onClick={handleLogoutClick} className={`btn btn-danger btn-sm ${buttonClass}`}> {/* Usamos btn-danger para logout */}
           Cerrar Sesión
         </button>
      ) : (
        <a href="/login" onClick={handleLoginClick} className={`btn btn-primary btn-sm ${buttonClass}`}>
          Login
        </a>
      )}
    </div>
  );
};


// --- NAVBAR PRINCIPAL ---
function Navbar() {
  const offcanvasRef = useRef(null);
  const { theme } = useTheme();

  const handleCloseOffcanvas = () => {
    const closeButton = offcanvasRef.current?.querySelector('[data-bs-dismiss="offcanvas"]');
    if (closeButton) closeButton.click();
  };

  return (
    <nav className="navbar fixed-top navbar-light-theme">
      <div className="container">

        {/* --- Logo con Imagen --- */}
        <Link className="navbar-brand" to="/">
          <img
            src="/miss-donitas-logo.png" // <-- Verifica este nombre en 'public'
            alt="Miss Donitas Logo"
            height="40" // <-- Ajusta la altura si es necesario
          />
        </Link>

        {/* --- MENÚ DE ESCRITORIO --- */}
        <div className="d-none d-lg-flex align-items-center">
          <ul className="navbar-nav flex-row">
            <MenuLinks />
          </ul>
          <div className="ms-lg-3">
             <UserControls isMobile={false} /> {/* Le decimos que NO es móvil */}
          </div>
        </div>

        {/* --- BOTÓN DEL MENÚ MÓVIL --- */}
        <button
          className="navbar-toggler d-lg-none border-0 btn-dona-toggler"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#offcanvasNavbar"
          aria-controls="offcanvasNavbar"
          aria-label="Toggle navigation"
        >
          <span style={{ fontSize: '1.8rem' }}>
            {theme === 'dona' ? '🍩' : '🌶️'}
          </span>
        </button>

        {/* --- CONTENIDO DEL MENÚ MÓVIL (OFFCANVAS) --- */}
        <div
          className="offcanvas offcanvas-end"
          tabIndex="-1"
          id="offcanvasNavbar"
          aria-labelledby="offcanvasNavbarLabel"
          ref={offcanvasRef}
        >
          <div className="offcanvas-header">
            <h5 className="offcanvas-title" id="offcanvasNavbarLabel">
              Miss Donitas
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            ></button>
          </div>

          {/* --- Cuerpo del Offcanvas --- */}
          <div className="offcanvas-body d-flex flex-column">

            {/* --- Lista de Enlaces (AHORA CON SCROLL) --- */}
            <ul className="navbar-nav flex-grow-1 overflow-auto"> {/* <--- ¡AÑADIDO overflow-auto! */}
              <MenuLinks onLinkClick={handleCloseOffcanvas} />
            </ul>

            {/* --- Footer del Offcanvas (se pega abajo) --- */}
            <div className="offcanvas-footer mt-auto py-3 border-top"> {/* Añadimos padding y borde */}
               <UserControls isMobile={true} onControlClick={handleCloseOffcanvas} /> {/* Le decimos que SÍ es móvil */}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;