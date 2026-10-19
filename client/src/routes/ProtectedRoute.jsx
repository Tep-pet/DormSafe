import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader } from '../components/common/Loader';

/** Redirects unauthenticated users to login */
export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Loader fullScreen message="Loading session…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}
