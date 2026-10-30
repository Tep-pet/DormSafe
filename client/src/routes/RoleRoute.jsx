import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_HOME } from '../constants/routes';
import { Loader } from '../components/common/Loader';

/**
 * Restricts routes to specific roles (student | owner | admin).
 * @param {{ allowedRoles: string[] }} props
 */
export function RoleRoute({ allowedRoles }) {
  const { role, loading, isAuthenticated, profile } = useAuth();

  if (loading || (isAuthenticated && !profile)) {
    return <Loader fullScreen message="Loading…" />;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!role || !allowedRoles.includes(role)) {
    const fallback = ROLE_HOME[role] || '/login';
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
