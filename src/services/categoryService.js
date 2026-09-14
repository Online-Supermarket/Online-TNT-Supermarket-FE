import api from './api';

export const categoryService = {
  getCategories: (params = {}) => api.get('/api/categories', {params}),
  getCategoryById: (id) => api.get(`/api/categories/${id}`),
  createCategory: (data) => api.post('/api/categories', data),
  updateCategory: (id, data) => api.put(`/api/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/api/categories/${id}`),
  deactivateCategory: (id) => api.patch(`/api/categories/${id}/deactivate`),
  activateCategory: (id) => api.patch(`/api/categories/${id}/activate`),
};

export function unwrapCategories(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.items || payload?.data || [];
}

export function getCategoryLabel(category) {
  return category?.name || category?.categoryName || category?.title || 'Unnamed category';
}

export function getCategoryDescription(category) {
  return category?.description || '';
}

export function getCategoryStatus(category) {
  if (typeof category?.isActive === 'boolean') return category.isActive ? 'Active' : 'Inactive';
  if (typeof category?.active === 'boolean') return category.active ? 'Active' : 'Inactive';
  return category?.status || 'Active';
}

export function getCategoryErrorMessage(error, fallback = 'Category request failed.') {
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
  if (status === 400) return 'Please check the category details and try again.';
  if (status === 401) return 'Please sign in to manage categories.';
  if (status === 403) return 'You do not have permission to manage categories.';
  if (status === 404) return 'Category not found.';
  if (status === 409) return 'A category with these details already exists.';
  if (status >= 500) return 'The server could not process the category request.';
  if (error.request) return 'Network error. Please check the backend connection.';
  return fallback;
}
