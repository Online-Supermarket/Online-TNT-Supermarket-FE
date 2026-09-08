import api from './api';

export const productService = {
  getAll: () => api.get('/api/products'),
  getById: (id) => api.get(`/api/products/${id}`),
  create: (data) => api.post('/api/products', data),
  update: (id, data) => api.put(`/api/products/${id}`, data),
  delete: (id) => api.delete(`/api/products/${id}`),
  getByCategory: (categoryId) => api.get(`/api/products/category/${categoryId}`),
  search: (query) => api.get(`/api/products/search?q=${query}`),
};
