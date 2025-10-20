// En: src/context/AuthContext.jsx

import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
// Asegúrate que esta ruta a tu archivo api.js sea la correcta
import apiClient from '../services/api'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        setUser(decodedUser.user);
      } catch (error) {
        console.error("Token inválido al cargar:", error);
        logout();
      }
    } else {
      setUser(null);
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await apiClient.post('/usuarios/login', {
        email,
        password,
      });
      const newToken = res.data.token;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      const decodedUser = jwtDecode(newToken);
      return decodedUser.user;
    } catch (error) {
      console.error('Error en el login:', error.response?.data?.msg || 'Error de conexión');
      logout();
      return null;
    }
  };
  
  const register = async (nombre, email, password) => {
    try {
      const res = await apiClient.post('/usuarios/register', {
        nombre,
        email,
        password,
      });
      const newToken = res.data.token;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      return true;
    } catch (error) {
      console.error('Error en el registro:', error.response?.data?.msg || 'Error de conexión');
      logout();
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;