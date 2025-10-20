// En: src/services/productService.js

import apiClient from './api';

/**
 * Obtiene todos los productos del backend.
 * Devuelve directamente el array de productos.
 */
export const getProducts = async () => {
  try {
    const response = await apiClient.get('/productos');
    return response.data; // CORRECTO: Devuelve solo los datos (el array)
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return []; // Devuelve un array vacío si hay un error para que no se rompa la app
  }
};

/**
 * Crea un nuevo producto.
 * @param {object} productData - Datos del producto a crear.
 */
export const createProduct = async (productData) => {
  try {
    const response = await apiClient.post('/productos', productData);
    return response.data; // Devuelve el nuevo producto creado
  } catch (error) {
    console.error("Error al crear producto:", error);
    throw error; // Lanza el error para que el componente lo pueda manejar
  }
};

/**
 * Actualiza un producto existente.
 * @param {string} productId - El ID del producto a actualizar.
 * @param {object} productData - Los datos actualizados.
 */
export const updateProduct = async (productId, productData) => {
  try {
    const response = await apiClient.put(`/productos/${productId}`, productData);
    return response.data; // Devuelve el producto actualizado
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    throw error;
  }
};

/**
 * Elimina un producto.
 * @param {string} productId - El ID del producto a eliminar.
 */
export const deleteProduct = async (productId) => {
  try {
    const response = await apiClient.delete(`/productos/${productId}`);
    return response.data; // Devuelve el mensaje de confirmación
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    throw error;
  }
};