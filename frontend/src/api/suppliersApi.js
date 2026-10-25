import apiClient from './client';

export const suppliersApi = {
  getAll: async () => {
    const response = await apiClient.get('/suppliers');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/suppliers/${id}`);
    return response.data;
  },

  search: async (name) => {
    const response = await apiClient.get(`/suppliers/search?name=${encodeURIComponent(name)}`);
    return response.data;
  },

  create: async (supplierData) => {
    const response = await apiClient.post('/suppliers', supplierData);
    return response.data;
  },

  update: async (id, supplierData) => {
    const response = await apiClient.put(`/suppliers/${id}`, supplierData);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/suppliers/${id}`);
    return response.data;
  },
};
