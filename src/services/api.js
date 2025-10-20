// Archivo: src/services/api.js (Versión Final)

import axios from 'axios';

// Creamos una instancia de Axios con la URL base de tu backend
const apiClient = axios.create({
  baseURL: 'https://tito-cafe-backend.onrender.com/api'
});

// Este interceptor añade el token a TODAS las peticiones que salgan
// usando 'apiClient'.
apiClient.interceptors.request.use(
  (config) => {
    // Lee el token directamente de localStorage en el momento de la petición
    const token = localStorage.getItem('token');
    
    // Si el token existe, lo añade al encabezado
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config; // Devuelve la configuración para que la petición continúe
  },
  (error) => {
    // Maneja errores en la configuración de la petición
    return Promise.reject(error);
  }
);

// =======================================================
// ▼▼▼ ESTA ES LA FUNCIÓN QUE NECESITAS AÑADIR ▼▼▼
// =======================================================
export const crearPedidoAPI = async (datosPedido) => {
  const { data } = await apiClient.post('/pedidos', datosPedido);
  return data;
};

export default apiClient;