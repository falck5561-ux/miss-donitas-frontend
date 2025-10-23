// Archivo: src/services/api.js (Versión Final para Miss Donitas)

import axios from 'axios';

// 1. Leemos las variables de entorno
const API_URL = import.meta.env.VITE_API_URL;
const TIENDA_ID = import.meta.env.VITE_TIENDA_ID; // <--- AÑADIDO (Leerá el '2')

// 2. Verificamos que las variables existan
if (!API_URL) {
  console.error("Error: VITE_API_URL no está definida en el archivo .env");
}
if (!TIENDA_ID) {
  console.error("Error: VITE_TIENDA_ID no está definida en el archivo .env. Debe ser '2' para Miss Donitas.");
}

// 3. Creamos la instancia de Axios con la URL base del .env
const apiClient = axios.create({
  baseURL: API_URL // <--- MODIFICADO (para usar la variable)
});

// 4. MODIFICAMOS el interceptor para que añada AMBOS encabezados
apiClient.interceptors.request.use(
  (config) => {
    
    // --- AÑADIMOS EL ID DE LA TIENDA (NUEVO) ---
    // Esto le dice al backend "Soy la Tienda 2"
    config.headers['x-tienda-id'] = TIENDA_ID;

    // --- MANTENEMOS TU LÓGICA DE AUTENTICACIÓN ---
    const token = localStorage.getItem('token');
    if (token) {
      // OJO: Tu backend (server.js) espera 'x-auth-token'. 
      // Si 'Authorization: Bearer' te funciona, déjalo.
      // Si te da error, cámbialo por la línea comentada:
      // config.headers['Authorization'] = `Bearer ${token}`;
      config.headers['x-auth-token'] = token; // (Usando esta por consistencia con tu backend)
    }
    
    return config; // Devuelve la configuración para que la petición continúe
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =======================================================
// ▼▼▼ TU FUNCIÓN (SIN CAMBIOS) ▼▼▼
// =======================================================
export const crearPedidoAPI = async (datosPedido) => {
  const { data } = await apiClient.post('/pedidos', datosPedido);
  return data;
};

export default apiClient;