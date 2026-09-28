import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccessRoles, roleHome } from '../utils/roles';

export const RoleRoute = ({ allowedRoles = [], children }) => {
  const { isAuthenticated, authLoading, activeRole, user } = useAuth();
  if (authLoading) return <p>Loading account…</p>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!activeRole) return <p>Your account needs a role review. Please contact an administrator.</p>;
  if (allowedRoles.length && !canAccessRoles(user?.roles, allowedRoles))
    return <Navigate to={roleHome(activeRole)} replace />;
  return children;
};
