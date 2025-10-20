// Archivo: src/components/ThemeToggleButton.jsx
import React, { useContext } from 'react';
import ThemeContext from '../context/ThemeContext';

// ... en src/components/ThemeToggleButton.jsx
function ThemeToggleButton() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    // -- CAMBIO AQUÍ --
    <button className="btn btn-outline-light ms-3" onClick={toggleTheme}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}

export default ThemeToggleButton;