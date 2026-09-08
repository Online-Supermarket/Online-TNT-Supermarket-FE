import {Navigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ROLE_HOME = {
  ADMIN:    '/admin/dashboard',
  MANAGER:  '/admin/dashboard',
  STAFF:    '/staff/dashboard',
  SELLER:   '/seller/dashboard',
  DELIVERY: '/delivery/dashboard',
};

export default function RoleRoute({roles, children}) {
  const {role, loading} = useAuth();

  if (loading) return <LoadingSpinner />;

  const currentRole  = String(role || '').toUpperCase();
  const allowedRoles = roles.map((r) => String(r || '').toUpperCase());

  if (!allowedRoles.includes(currentRole)) {
    const home = ROLE_HOME[currentRole] || '/';
    return <Navigate to={home} replace />;
  }

  return children;
}
