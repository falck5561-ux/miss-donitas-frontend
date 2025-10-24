import React, { useContext, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import ThemeToggleButton from './ThemeToggleButton';
import { useInstallPWA } from '../context/InstallPwaContext';
import { useTheme } from '../context/ThemeContext';

// --- COMPONENTE DE ENLACES DEL MENÚ ---
// (No cambia)
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
      {user?.rol === 'Jefe' && (
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
    </>
  );
};


// --- COMPONENTE DE CONTROLES DE USUARIO ---
const UserControls = ({ isMobile = false, onControlClick }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const buttonClass = isMobile ? "" : "ms-3"; 

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
    <>
      <span onClick={onControlClick}>
        <ThemeToggleButton />
      </span>
      
      {/* =============================================================== */}
      {/* === INICIO DE LA MODIFICACIÓN: BOTÓN LOGOUT USA EL TEMA === */}
      {/* =============================================================== */}
      {user ? (
        isMobile ? (
          // En móvil, usamos la clase que ya está en App.css
          <button onClick={handleLogoutClick} className={`offcanvas-logout-btn ${buttonClass}`}>
            Cerrar Sesión
          </button>
        ) : (
          // En escritorio, usamos 'btn-primary' que SÍ usa el tema (fondo sólido)
          <button onClick={handleLogoutClick} className={`btn btn-primary btn-sm ${buttonClass}`}>
            Cerrar Sesión
          </button>
        )
      ) : (
        <a href="/login" onClick={handleLoginClick} className={`btn btn-primary btn-sm ${buttonClass}`}>
          Login
        </a>
      )}
      {/* =============================================================== */}
      {/* === FIN DE LA MODIFICACIÓN === */}
      {/* =============================================================== */}
    </>
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

        {/* --- Logo de Texto (como lo tenías) --- */}
        {/* --- Logo con Imagen --- */}
<Link className="navbar-brand" to="/">
  <img 
    src="/miss-donitas-logo.png" // <-- ¡Asegúrate que el nombre del archivo sea correcto!
    alt="Miss Donitas Logo" 
    height="40" // <-- Ajusta la altura como necesites
  />
</Link>

        {/* --- MENÚ DE ESCRITORIO --- */}
        <div className="d-none d-lg-flex align-items-center">
          <ul className="navbar-nav flex-row">
            <MenuLinks />
          </ul>
          <div className="ms-lg-3">
            <UserControls />
          </div>
        </div>

        {/* --- BOTÓN DEL MENÚ MÓVIL (Mantenemos el icono temático) --- */}
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

          <div className="offcanvas-body d-flex flex-column">
            <ul className="navbar-nav flex-grow-1">
              <MenuLinks onLinkClick={handleCloseOffcanvas} />
            </ul>

            <div className="offcanvas-footer mt-auto">
              {/* Aquí se pasan los props 'isMobile' y 'onControlClick' */}
              <UserControls isMobile={true} onControlClick={handleCloseOffcanvas} />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;