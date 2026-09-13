import axios from 'axios';

const storeApi = axios.create({
  baseURL: import.meta.env.VITE_STORE_API_BASE_URL || import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

storeApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('tnt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

storeApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tnt_token');
      localStorage.removeItem('tnt_refresh_token');
      localStorage.removeItem('tnt_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

const unwrap = (response) => response.data;

export const storesApi = {
  getStores: (params = {}) => storeApi.get('/api/stores', {params}).then(unwrap),
  getStore: (id) => storeApi.get(`/api/stores/${id}`).then(unwrap),
  createStore: (data) => storeApi.post('/api/stores', data).then(unwrap),
  updateStore: (id, data) => storeApi.put(`/api/stores/${id}`, data).then(unwrap),
  activateStore: (id) => storeApi.patch(`/api/stores/${id}/activate`).then(unwrap),
  deactivateStore: (id) => storeApi.patch(`/api/stores/${id}/deactivate`).then(unwrap),
};
