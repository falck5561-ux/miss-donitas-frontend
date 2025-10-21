import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
  // --- CAMBIO 1 ---
  // El tema por defecto ahora es 'dona' (en lugar de 'dark' o 'light')
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dona');

  useEffect(() => {
    // Esto sigue funcionando igual, pero ahora pasará 'dona' o 'picante'
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    // --- CAMBIO 2 ---
    // Cambiamos la lógica para alternar entre 'dona' y 'picante'
    setTheme(prevTheme => (prevTheme === 'dona' ? 'picante' : 'dona'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;