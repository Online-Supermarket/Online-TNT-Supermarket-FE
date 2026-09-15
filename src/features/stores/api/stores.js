import api from '../../../services/api';

const unwrap = (response) => response.data;

export const storesApi = {
  getStores: (params = {}) => api.get('/api/stores', {params}).then(unwrap),
  getStore: (id) => api.get(`/api/stores/${id}`).then(unwrap),
  createStore: (data) => api.post('/api/stores', data).then(unwrap),
  updateStore: (id, data) => api.put(`/api/stores/${id}`, data).then(unwrap),
  activateStore: (id) => api.patch(`/api/stores/${id}/activate`).then(unwrap),
  deactivateStore: (id) => api.patch(`/api/stores/${id}/deactivate`).then(unwrap),
};
