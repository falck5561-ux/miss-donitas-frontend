// Archivo: src/context/ThemeContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react'; // <--- 1. AÑADE useContext AQUÍ

const ThemeContext = createContext();

// 2. AÑADE Y EXPORTA EL HOOK useTheme AQUÍ
// Esta es la línea que soluciona el error de despliegue.
export const useTheme = () => {
  return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark'); // Cambiado a 'dark' por defecto

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Ya no es necesario exportar el contexto por defecto, pero no hace daño
export default ThemeContext;