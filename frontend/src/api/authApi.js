import apiClient from './client';

export const authApi = {
  login: async (username, password) => {
    const response = await apiClient.post('/auth/login', { username, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },
};
