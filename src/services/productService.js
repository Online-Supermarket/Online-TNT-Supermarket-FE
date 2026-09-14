import api from './api';

export const productService = {
  getAll: (params = {}) => api.get('/api/products', {params}),
  getById: (id) => api.get(`/api/products/${id}`),
  create: (data) => api.post('/api/products', data),
  update: (id, data) => api.put(`/api/products/${id}`, data),
  delete: (id) => api.delete(`/api/products/${id}`),
  getByCategory: (category) => api.get('/api/products', {params: {category}}),
  search: (query) => api.get('/api/products', {params: {search: query}}),
};
