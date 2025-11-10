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
 * Obtiene UN solo producto por su ID.
 * Esta ruta ahora también trae el array 'grupos_opciones' con los toppings.
 * @param {string} productId - El ID del producto a obtener.
 */
export const getProductById = async (productId) => {
  try {
    const response = await apiClient.get(`/productos/${productId}`);
    return response.data; // Devuelve el producto con sus toppings
  } catch (error) {
    console.error("Error al obtener producto por ID:", error);
    throw error;
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

// =======================================================
//  FUNCIONES PARA OPCIONES (TOPPINGS)
// =======================================================

/**
 * Crea un nuevo GRUPO de opciones para un producto.
 * @param {string} productId - El ID del producto.
 * @param {object} groupData - { nombre: "Elige Jarabe", tipo_seleccion: "unico" }
 */
export const createProductGroup = async (productId, groupData) => {
  try {
    const response = await apiClient.post(`/productos/${productId}/grupos`, groupData);
    return response.data;
  } catch (error) {
    console.error("Error al crear grupo de opción:", error);
    throw error;
  }
};

/**
 * Agrega una nueva OPCION a un grupo existente.
 * @param {number} groupId - El ID del grupo.
 * @param {object} optionData - { nombre: "Nutella", precio_adicional: 15 }
 */
export const addProductOption = async (groupId, optionData) => {
  try {
    const response = await apiClient.post(`/productos/grupos/${groupId}/opciones`, optionData);
    return response.data;
  } catch (error) {
    console.error("Error al agregar opción:", error);
    throw error;
  }
};

/**
 * Elimina un GRUPO de opciones (y todas sus opciones dentro).
 * @param {number} groupId - El ID del grupo a eliminar.
 */
export const deleteProductGroup = async (groupId) => {
  try {
    const response = await apiClient.delete(`/productos/grupos/${groupId}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar grupo:", error);
    throw error;
s }
};

/**
 * Elimina una OPCION específica de un grupo.
 * @param {number} optionId - El ID de la opción a eliminar.
 */
export const deleteProductOption = async (optionId) => {
  try {
    const response = await apiClient.delete(`/productos/opciones/${optionId}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar opción:", error);
    throw error;
  }
};
