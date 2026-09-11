import identityApi from './identityApi';

export const authService = {
  login: (data) => identityApi.post('/api/auth/login', data),
  register: (data) => identityApi.post('/api/auth/register', data),
  me: () => identityApi.get('/api/auth/me'),
  logout: (refreshToken) => identityApi.post('/api/auth/logout', { refreshToken }),
  refreshToken: (refreshToken) => identityApi.post('/api/auth/refresh', { refreshToken }),
};
