import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';

const AuthContext = createContext(null);

export const DEMO_USERS = {
  CUSTOMER: {
    email: 'customer@marketflow.local',
    password: 'ChangeMe!123',
    displayName: 'Sarah Customer',
    roles: ['Customer'],
    role: 'CUSTOMER',
  },
  ADMIN: {
    email: 'admin@marketflow.local',
    password: 'ChangeMe!123',
    displayName: 'Alex Admin',
    roles: ['OperationsAdmin'],
    role: 'ADMIN',
  },
  STAFF: {
    email: 'staff@marketflow.local',
    password: 'ChangeMe!123',
    displayName: 'Sam Staff',
    roles: ['Staff'],
    role: 'STAFF',
  },
  DELIVERY: {
    email: 'driver@marketflow.local',
    password: 'ChangeMe!123',
    displayName: 'Dave Driver',
    roles: ['DeliveryDriver'],
    role: 'DELIVERY',
  },
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('marketflowToken') || '');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('marketflowUser');
    return saved ? JSON.parse(saved) : null;
  });

  const getPrimaryRole = (roles = []) => {
    if (roles.includes('OperationsAdmin') || roles.includes('ADMIN')) return 'ADMIN';
    if (roles.includes('Staff') || roles.includes('STAFF') || roles.includes('CatalogStaff') || roles.includes('InventoryStaff')) return 'STAFF';
    if (roles.includes('DeliveryDriver') || roles.includes('DELIVERY')) return 'DELIVERY';
    return 'CUSTOMER';
  };

  const [activeRole, setActiveRole] = useState(() => {
    if (user?.roles) return getPrimaryRole(user.roles);
    return 'CUSTOMER';
  });

  useEffect(() => {
    if (user?.roles) {
      setActiveRole(getPrimaryRole(user.roles));
    }
  }, [user]);

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
      // Fallback for offline demo mode only if API is completely unreachable
      const matchedDemo = Object.values(DEMO_USERS).find((d) => d.email === email);
      if (matchedDemo && (!err.response || err.response.status >= 500)) {
        const fallbackUser = {
          id: `usr_${matchedDemo.role.toLowerCase()}`,
          email: matchedDemo.email,
          displayName: matchedDemo.displayName,
          roles: matchedDemo.roles,
        };
        localStorage.setItem('marketflowToken', `demo_token_${matchedDemo.role.toLowerCase()}`);
        localStorage.setItem('marketflowUser', JSON.stringify(fallbackUser));
        setToken(`demo_token_${matchedDemo.role.toLowerCase()}`);
        setUser(fallbackUser);
        setActiveRole(matchedDemo.role);
        return fallbackUser;
      }
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
    setActiveRole('CUSTOMER');
    return data.user;
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/identity/auth/logout');
    } catch {}
    localStorage.removeItem('marketflowToken');
    localStorage.removeItem('marketflowUser');
    setToken('');
    setUser(null);
    setActiveRole('CUSTOMER');
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
        isAuthenticated: !!user,
        login,
        register,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
