import api from './api';

export const productService = {
  getAll: (params = {}) => api.get('/api/products', {params}),
  getById: (id) => api.get(`/api/products/${id}`),
  create: (data) => api.post('/api/products', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/api/products/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/api/products/${id}`),
  getByCategory: (category) => api.get('/api/products', {params: {category}}),
  search: (query) => api.get('/api/products', {params: {search: query}}),
  uploadImage: (formData) => api.post('/api/products/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export function getProductErrorMessage(error, fallback = 'Product request failed.') {
  if (!error) return fallback;
  const data = error.response?.data;
  if (typeof data === 'string') return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;
  if (data?.errors) {
    const first = Object.values(data.errors).flat().find(Boolean);
    if (first) return first;
  }

  const status = error.response?.status;
  if (status === 400) return 'Please check the product details and try again.';
  if (status === 401) return 'Please sign in to manage products.';
  if (status === 403) return 'You do not have permission to manage products.';
  if (status === 404) return 'Product not found.';
  if (status >= 500) return 'The server could not process the product request.';
  if (error.request) return 'Network error. Please check the backend connection.';
  return fallback;
}
