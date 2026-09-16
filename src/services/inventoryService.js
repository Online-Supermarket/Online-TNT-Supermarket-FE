import api from './api';

export const inventoryService = {
  /** GET /api/inventory — paginated list with optional search and lowStock filter */
  getAll: (params = {}) => api.get('/api/inventory', { params }),

  /** GET /api/inventory/{productId} */
  getByProductId: (productId) => api.get(`/api/inventory/${productId}`),

  /** POST /api/inventory — initialise stock for a product */
  addInventory: (productId, stockQuantity) =>
    api.post('/api/inventory', { productId, stockQuantity }),

  /** PUT /api/inventory/{productId} — direct stock update */
  updateStock: (productId, stockQuantity, lowStockThreshold) =>
    api.put(`/api/inventory/${productId}`, {
      stockQuantity,
      ...(lowStockThreshold !== undefined ? { lowStockThreshold } : {}),
    }),

  /** PATCH /api/inventory/{productId}/stock — atomic stock adjustment (increase, decrease, set) */
  adjustStock: (productId, payload) =>
    api.patch(`/api/inventory/${productId}/stock`, payload),

  /** DELETE /api/inventory/{productId} — reset stock to 0 */
  deleteInventory: (productId) => api.delete(`/api/inventory/${productId}`),
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
  if (status === 400) {
    if (typeof data?.message === 'string' && data.message.toLowerCase().includes('insufficient')) {
      return 'Insufficient stock available.';
    }
    return 'Invalid stock quantity. Please check and try again.';
  }
  if (status === 401) return 'Please sign in to manage inventory.';
  if (status === 403) return 'You do not have permission to manage inventory.';
  if (status === 404) return 'Product not found.';
  if (status === 409) return 'This product already has an inventory record. Use Update Stock to change it.';
  if (status >= 500) return 'The server could not process the inventory request.';
  if (error.request) return 'Network error. Please check the backend connection.';
  return fallback;
}
