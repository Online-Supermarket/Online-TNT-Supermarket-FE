import {Navigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';

export default function RoleRoute({roles,children}){
  const {role} = useAuth();
  const currentRole = String(role || '').toUpperCase();
  const allowedRoles = roles.map((r) => String(r || '').toUpperCase());

  if(!allowedRoles.includes(currentRole)){
    const home={ADMIN:'/admin/dashboard',STAFF:'/staff/dashboard',DELIVERY:'/delivery/dashboard'}[currentRole]||'/';
    return <Navigate to={home} replace/>;
  }

  return children;
}
