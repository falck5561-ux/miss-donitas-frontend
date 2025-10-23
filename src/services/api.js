// Archivo: src/services/api.js (Versión FINAL con 'x-auth-token')

import axios from 'axios';

// 1. Leemos las variables de entorno
const API_URL = import.meta.env.VITE_API_URL;
const TIENDA_ID = import.meta.env.VITE_TIENDA_ID;

// 2. Verificamos que las variables existan
if (!API_URL) {
  console.error("Error: VITE_API_URL no está definida en el archivo .env");
}
if (!TIENDA_ID) {
  console.error("Error: VITE_TIENDA_ID no está definida en el archivo .env.");
}

// 3. Creamos la instancia de Axios con la URL base del .env
const apiClient = axios.create({
  baseURL: API_URL 
});

// 4. MODIFICAMOS el interceptor
apiClient.interceptors.request.use(
  (config) => {
    
    // --- AÑADIMOS EL ID DE LA TIENDA ---
    config.headers['x-tienda-id'] = TIENDA_ID;

    // --- AÑADIMOS EL TOKEN (Regresamos a 'x-auth-token') ---
    const token = localStorage.getItem('token');
    if (token) {
      // Usamos 'x-auth-token' que es lo que tu authMiddleware espera
      config.headers['x-auth-token'] = token; 
    }
    
    return config; 
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =======================================================
// ▼▼▼ ¡LA FUNCIÓN QUE ARREGLÓ EL ERROR DE PÁGINA BLANCA! ▼▼▼
// =======================================================
export const crearPedidoAPI = async (datosPedido) => {
  const { data } = await apiClient.post('/pedidos', datosPedido);
  return data;
};

export default apiClient;