import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer Token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('marketflowToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error messaging
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const payload = error.response?.data;
    const validation = payload?.errors && Object.entries(payload.errors).map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`).join(' | ');
    const message = payload?.message || payload?.error || validation || payload?.title || error.message || 'An unexpected error occurred';
    const normalized = new Error(message);
    normalized.status = error.response?.status;
    normalized.details = payload;
    return Promise.reject(normalized);
  }
);

export default axiosInstance;
