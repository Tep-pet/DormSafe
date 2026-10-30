import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_HOME } from '../constants/routes';
import { Loader } from '../components/common/Loader';

/** Login/register only — sends already-signed-in users to their dashboard */
export function GuestRoute() {
  const { isAuthenticated, role, loading, profile } = useAuth();

  if (loading || (isAuthenticated && !profile)) {
    return <Loader fullScreen message="Loading…" />;
  }
  if (isAuthenticated) return <Navigate to={ROLE_HOME[role] || '/'} replace />;
  return <Outlet />;
}
