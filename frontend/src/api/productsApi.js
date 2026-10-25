import apiClient from './client';

export const productsApi = {
  getAll: async () => {
    const response = await apiClient.get('/products');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  getBySku: async (sku) => {
    const response = await apiClient.get(`/products/sku/${encodeURIComponent(sku)}`);
    return response.data;
  },

  getByCategory: async (category) => {
    const response = await apiClient.get(`/products/category/${encodeURIComponent(category)}`);
    return response.data;
  },

  search: async (name) => {
    const response = await apiClient.get(`/products/search?name=${encodeURIComponent(name)}`);
    return response.data;
  },

  getLowStock: async () => {
    const response = await apiClient.get('/products/low-stock');
    return response.data;
  },

  create: async (productData) => {
    const response = await apiClient.post('/products', productData);
    return response.data;
  },

  update: async (id, productData) => {
    const response = await apiClient.put(`/products/${id}`, productData);
    return response.data;
  },

  updateStock: async (id, quantityChange) => {
    const response = await apiClient.put(`/products/${id}/stock?quantityChange=${quantityChange}`);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },
};
