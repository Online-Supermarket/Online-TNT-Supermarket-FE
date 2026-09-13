import api from './api';

export const userService = {
  getProfile: () => api.get('/api/users/me'),
  updateProfile: (data) => api.put('/api/users/me', data),
  getAllUsers: () => api.get('/api/users'),
  getUserById: (id) => api.get(`/api/users/${id}`),
  deleteUser: (id) => api.delete(`/api/users/${id}`),
  updateUserRole: (id, role) => api.put(`/api/users/${id}/role`, { role }),
};
