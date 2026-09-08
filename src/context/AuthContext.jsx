import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import api from '../services/api';
import {authService} from '../services/authService';

const AuthContext=createContext(null);

const normalizeRole = (role) => {
  const value = String(role || '').trim();
  const upper = value.toUpperCase();

  if (upper === 'BUYER' || upper === 'CUSTOMER') return 'CUSTOMER';
  if (upper === 'ADMIN')    return 'ADMIN';
  if (upper === 'MANAGER')  return 'MANAGER';
  if (upper === 'SELLER')   return 'SELLER';
  if (upper === 'STAFF')    return 'STAFF';
  if (upper === 'RIDER' || upper === 'DELIVERY') return 'DELIVERY';

  return upper || 'CUSTOMER';
};

const normalizeUser = (user = {}) => {
  const fullName = user.fullName || user.name || user.displayName || [user.firstName, user.lastName].filter(Boolean).join(' ') || '';
  const normalized = {
    ...user,
    id: user.id ?? user.identityUserId ?? null,
    email: user.email || '',
    role: normalizeRole(user.role || user.userRole),
    name: fullName || 'User',
    fullName: fullName || 'User',
    phone: user.phone || user.phoneNumber || '',
    phoneNumber: user.phoneNumber || user.phone || '',
    address: user.address || '',
    city: user.city || '',
    firstName: user.firstName || (fullName ? fullName.split(' ')[0] : ''),
    lastName: user.lastName || (fullName ? fullName.split(' ').slice(1).join(' ') : ''),
  };

  return normalized;
};

const getStoredUser = () => {
  try {
    const value = localStorage.getItem('tnt_user');
    return value ? normalizeUser(JSON.parse(value)) : null;
  } catch {
    return null;
  }
};

const mergeUserProfile = async (baseUser) => {
  try {
    const {data: profile} = await api.get('/api/users/me');
    const merged = normalizeUser({
      ...baseUser,
      ...profile,
      fullName: profile.displayName || baseUser.fullName || baseUser.name,
      name: profile.displayName || baseUser.name || baseUser.fullName,
      phone: profile.phoneNumber || baseUser.phone || '',
      phoneNumber: profile.phoneNumber || baseUser.phoneNumber || '',
      address: profile.address || baseUser.address || '',
      city: profile.city || baseUser.city || '',
    });

    return merged;
  } catch {
    return normalizeUser(baseUser);
  }
};

export function AuthProvider({children}){
  const [user,setUser]=useState(() => getStoredUser());
  const [token,setToken]=useState(() => localStorage.getItem('tnt_token'));
  const [loading,setLoading]=useState(true);

  const refreshUser = async () => {
    const currentToken = localStorage.getItem('tnt_token');
    if (!currentToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return null;
    }

    try {
      const {data} = await authService.me();
      const nextUser = await mergeUserProfile(normalizeUser(data));
      localStorage.setItem('tnt_user', JSON.stringify(nextUser));
      setUser(nextUser);
      setToken(currentToken);
      return nextUser;
    } catch {
      localStorage.removeItem('tnt_token');
      localStorage.removeItem('tnt_refresh_token');
      localStorage.removeItem('tnt_user');
      setUser(null);
      setToken(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshUser();
      return;
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    const {data} = await authService.login({ email, password });
    const nextUser = normalizeUser(data.user);

    localStorage.setItem('tnt_token', data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem('tnt_refresh_token', data.refreshToken);
    }

    const hydratedUser = await mergeUserProfile(nextUser);
    localStorage.setItem('tnt_user', JSON.stringify(hydratedUser));
    setToken(data.accessToken);
    setUser(hydratedUser);

    return hydratedUser;
  };

  const register = async (data) => {
    const payload = {
      fullName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      email: (data.email || '').trim(),
      password: data.password,
      confirmPassword: data.confirm || data.confirmPassword || data.password,
      phoneNumber: (data.phone || data.phoneNumber || '').trim() || null,
    };

    await authService.register(payload);
    const createdUser = await login(payload.email, payload.password);
    return createdUser;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('tnt_refresh_token');

    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      // Ignore logout errors from backend — client state is always cleared below.
    } finally {
      localStorage.removeItem('tnt_token');
      localStorage.removeItem('tnt_refresh_token');
      localStorage.removeItem('tnt_user');
      setUser(null);
      setToken(null);
    }
  };

  const updateUser = async (data) => {
    const profilePayload = {
      displayName: data.displayName || `${data.firstName || user?.firstName || ''} ${data.lastName || user?.lastName || ''}`.trim() || user?.name || '',
      phoneNumber: data.phoneNumber || data.phone || user?.phone || null,
      address: data.address || user?.address || null,
      city: data.city || user?.city || null,
    };

    const {data: profile} = await api.put('/api/users/me', profilePayload);
    const nextUser = normalizeUser({
      ...user,
      ...profile,
      name: profile.displayName || user?.name || 'User',
      fullName: profile.displayName || user?.fullName || 'User',
      phone: profile.phoneNumber || user?.phone || '',
      address: profile.address || user?.address || '',
      city: profile.city || user?.city || '',
    });

    localStorage.setItem('tnt_user', JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  };

  const value = useMemo(() => ({
    user,
    token,
    role: user?.role,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    register,
    updateUser,
    refreshUser,
  }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
