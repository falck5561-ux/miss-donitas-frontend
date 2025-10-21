// Archivo: src/components/ThemeToggleButton.jsx
import React from 'react';
// 1. Importamos el hook 'useTheme' que definimos en el contexto. Es más limpio.
import { useTheme } from '../context/ThemeContext'; 

function ThemeToggleButton() {
  // 2. Usamos el hook para obtener el tema y la función de cambio
  const { theme, toggleTheme } = useTheme();

  return (
    <button className="btn btn-outline-light ms-3" onClick={toggleTheme}>
      {/* 3. Lógica actualizada:
        Si el tema actual es 'dona', mostramos el ícono para cambiar a 'picante' (🌶️).
        Si el tema actual es 'picante', mostramos el ícono para cambiar a 'dona' (🍩).
      */}
      {theme === 'dona' ? '🌶️' : '🍩'}
    </button>
  );
}

export default ThemeToggleButton;