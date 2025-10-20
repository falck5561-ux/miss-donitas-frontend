// src/context/InstallPwaContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const InstallPwaContext = createContext();

export const InstallPwaProvider = ({ children }) => {
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      toast.error('La aplicación no se puede instalar ahora.');
      return;
    }

    installPrompt.prompt();

    try {
      // 1. Añadimos un listener para el evento 'appinstalled' ANTES de esperar la elección.
      const handleAppInstalled = () => {
        // 3. ¡ÉXITO REAL! La app ya se instaló.
        toast.success('¡Aplicación instalada con éxito!');
        setInstallPrompt(null); // Ocultamos el botón
        // Limpiamos este listener
        window.removeEventListener('appinstalled', handleAppInstalled);
      };

      window.addEventListener('appinstalled', handleAppInstalled);

      // 2. Esperamos la elección del usuario
      const { outcome } = await installPrompt.userChoice;

      if (outcome === 'accepted') {
        // El usuario aceptó.
        // YA NO MOSTRAMOS EL TOAST AQUÍ.
        // Simplemente esperamos a que el evento 'appinstalled' se dispare.
        console.log('El usuario aceptó. Esperando a que se instale...');
      } else {
        // El usuario canceló el diálogo.
        toast.error('Instalación cancelada.');
        // Como canceló, quitamos el listener que acabamos de poner.
        window.removeEventListener('appinstalled', handleAppInstalled);
      }

    } catch (error) {
      toast.error('Ocurrió un error durante la instalación.');
      console.error('Error al instalar PWA:', error);
      // Si hay un error, también quitamos el listener.
      window.removeEventListener('appinstalled', handleAppInstalled);
    }
  };

  return (
    <InstallPwaContext.Provider value={{ installPrompt, handleInstall }}>
      {children}
    </InstallPwaContext.Provider>
  );
};

export const useInstallPWA = () => {
  return useContext(InstallPwaContext);
};