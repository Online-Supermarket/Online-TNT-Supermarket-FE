import React, { createContext, useContext, useState, useEffect } from 'react';
import { getPrimaryRole } from '../utils/roles';
import axiosInstance from '../services/axiosInstance';

const AuthContext = createContext(null);

export const DEMO_USERS = {
  Customer: {
    email: 'customer@marketflow.local',
    password: 'ChangeMe!123',
    displayName: 'Sarah Customer',
    roles: ['Customer'],
    role: 'Customer',
  },
  Admin: {
    email: 'admin@marketflow.local',
    password: 'ChangeMe!123',
    displayName: 'Alex Admin',
    roles: ['Admin'],
    role: 'Admin',
  },
  Staff: {
    email: 'staff@marketflow.local',
    password: 'ChangeMe!123',
    displayName: 'Sam Staff',
    roles: ['Staff'],
    role: 'Staff',
  },
  Rider: {
    email: 'driver@marketflow.local',
    password: 'ChangeMe!123',
    displayName: 'Dave Driver',
    roles: ['Rider'],
    role: 'Rider',
  },
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('marketflowToken') || '');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('marketflowUser');
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });

  const [authLoading, setAuthLoading] = useState(!!token);

  const [activeRole, setActiveRole] = useState(() => {
    if (user?.roles) return getPrimaryRole(user.roles);
    return 'Customer';
  });

  useEffect(() => {
    if (user?.roles) {
      setActiveRole(getPrimaryRole(user.roles));
    }
  }, [user]);

  useEffect(() => {
    if (!token) { setAuthLoading(false); return; }
    let cancelled = false;
    setAuthLoading(true);
    axiosInstance.get('/identity/users/me').then(current => {
      if (cancelled) return;
      setUser(current);
      localStorage.setItem('marketflowUser', JSON.stringify(current));
    }).catch(() => {
      if (!cancelled) {
        // A token can outlive its server-side session. Remove both cached
        // credentials so a stale session cannot keep sending 401 requests.
        localStorage.removeItem('marketflowToken');
        localStorage.removeItem('marketflowUser');
        setToken('');
        setUser(null);
      }
    }).finally(() => { if (!cancelled) setAuthLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  const login = async (email, password) => {
    try {
      const data = await axiosInstance.post('/identity/auth/login', { email, password });
      const accessToken = data.accessToken;
      const userInfo = data.user;
      localStorage.setItem('marketflowToken', accessToken);
      localStorage.setItem('marketflowUser', JSON.stringify(userInfo));
      setToken(accessToken);
      setUser(userInfo);
      const role = getPrimaryRole(userInfo?.roles || []);
      setActiveRole(role);
      return userInfo;
    } catch (err) {
      throw err;
    }
  };

  const register = async (email, displayName, password, extraFields = {}) => {
    const data = await axiosInstance.post('/identity/auth/register', {
      email,
      displayName,
      password,
      ...extraFields,
    });
    localStorage.setItem('marketflowToken', data.accessToken);
    localStorage.setItem('marketflowUser', JSON.stringify(data.user));
    setToken(data.accessToken);
    setUser(data.user);
    setActiveRole('Customer');
    return data.user;
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/identity/auth/logout');
    } catch {}
    clearSession();
  };

  const clearSession = () => {
    localStorage.removeItem('marketflowToken');
    localStorage.removeItem('marketflowUser');
    setToken('');
    setUser(null);
    setActiveRole('Customer');
  };

  const switchDemoRole = (roleKey) => {
    const demo = DEMO_USERS[roleKey];
    if (demo) {
      login(demo.email, demo.password);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        activeRole,
        isAuthenticated: !!token && !!user,
        authLoading,
        login,
        register,
        logout,
        clearSession,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
