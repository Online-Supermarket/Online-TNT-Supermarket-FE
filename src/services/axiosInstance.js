import axios from 'axios';

const LOCAL_API_BASE_URL = 'http://localhost:8080/api';

// Service calls are relative to the gateway's single /api prefix. Keeping that
// prefix here (rather than in every feature) prevents /api/api URLs.
export const normalizeApiBaseUrl = (value = LOCAL_API_BASE_URL) => {
  const baseUrl = String(value).trim().replace(/\/+$/, '');
  return (baseUrl || LOCAL_API_BASE_URL).replace(/(?:\/api)+$/i, '/api');
};

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

// Use this for the few requests which require the Fetch API (for example CSV
// downloads). It gives them the same normalized gateway URL as Axios.
export const apiUrl = (path = '') => {
  const relativePath = String(path).replace(/^\/(?:api\/?)?/i, '');
  return `${API_BASE_URL}/${relativePath}`;
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to attach Bearer Token and handle multipart
axiosInstance.interceptors.request.use(
  (config) => {
    // API callers use paths relative to the gateway prefix. Be defensive if a
    // future caller accidentally includes /api itself.
    if (typeof config.url === 'string') config.url = config.url.replace(/^\/(?:api\/?)?/i, '/');
    const token = localStorage.getItem('marketflowToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const isMultipart = typeof FormData !== 'undefined' && config.data instanceof FormData;
    if (isMultipart) {
      // AxiosHeaders is case-insensitive, unlike a plain object. Remove the default in both
      // forms so the browser can add multipart/form-data with its required boundary.
      config.headers?.delete?.('Content-Type');
      delete config.headers['Content-Type'];
    } else if (config.data && typeof config.data === 'object') {
      // The Order API reads COD payloads as JSON. Make that contract explicit rather than
      // depending on a global default that can accidentally be reused for FormData.
      if (config.headers?.set) config.headers.set('Content-Type', 'application/json');
      else config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error messaging
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('marketflowToken');
      localStorage.removeItem('marketflowUser');
    }
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
