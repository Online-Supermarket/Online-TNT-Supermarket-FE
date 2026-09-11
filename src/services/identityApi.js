import axios from 'axios';

const IDENTITY_API_URL = import.meta.env.VITE_IDENTITY_API_URL || 'http://localhost:5010';

const identityApi = axios.create({
  baseURL: IDENTITY_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

identityApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tnt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

identityApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tnt_token');
      localStorage.removeItem('tnt_refresh_token');
      localStorage.removeItem('tnt_user');
      window.location.href = '/login';
    }

    if (error.response?.status === 403) {
      console.error('Access Forbidden:', error.response.data);
    }

    return Promise.reject(error);
  }
);

export { IDENTITY_API_URL };
export default identityApi;
