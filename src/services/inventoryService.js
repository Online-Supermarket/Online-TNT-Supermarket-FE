import api from './api';

export const inventoryService = {
  getAll: (params = {}) => api.get('/api/inventory', { params }),
  getByProductId: (productId) => api.get(`/api/inventory/${productId}`),
  updateStock: (productId, stockQuantity) =>
    api.put(`/api/inventory/${productId}`, { stockQuantity }),
};

export function getInventoryErrorMessage(error, fallback = 'Inventory request failed.') {
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
  if (status === 400) return 'Invalid stock quantity. Please check and try again.';
  if (status === 401) return 'Please sign in to manage inventory.';
  if (status === 403) return 'You do not have permission to manage inventory.';
  if (status === 404) return 'Product not found.';
  if (status >= 500) return 'The server could not process the inventory request.';
  if (error.request) return 'Network error. Please check the backend connection.';
  return fallback;
}
