import apiClient from './client';

export const transactionsApi = {
  getAll: async () => {
    const response = await apiClient.get('/transactions');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/transactions/${id}`);
    return response.data;
  },

  getByProduct: async (productId) => {
    const response = await apiClient.get(`/transactions/product/${productId}`);
    return response.data;
  },

  getByType: async (type) => {
    const response = await apiClient.get(`/transactions/type/${type}`);
    return response.data;
  },

  getByDateRange: async (startDate, endDate) => {
    const response = await apiClient.get(`/transactions/date-range?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
    return response.data;
  },

  getByBatch: async (batchNumber) => {
    const response = await apiClient.get(`/transactions/batch/${encodeURIComponent(batchNumber)}`);
    return response.data;
  },

  create: async (transactionData) => {
    const response = await apiClient.post('/transactions', transactionData);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/transactions/${id}`);
    return response.data;
  },
};
