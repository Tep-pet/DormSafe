import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_HOME } from '../constants/routes';

/**
 * Restricts routes to specific roles (student | owner | admin).
 * @param {{ allowedRoles: string[] }} props
 */
export function RoleRoute({ allowedRoles }) {
  const { role, loading, isAuthenticated } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!role || !allowedRoles.includes(role)) {
    const fallback = ROLE_HOME[role] || '/login';
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
