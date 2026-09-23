import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RoleRoute = ({ allowedRoles = [], children }) => {
  const { isAuthenticated, activeRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(activeRole)) {
    // Redirect based on current activeRole if unauthorized
    if (activeRole === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (activeRole === 'STAFF') return <Navigate to="/staff/dashboard" replace />;
    if (activeRole === 'DELIVERY') return <Navigate to="/delivery/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};
