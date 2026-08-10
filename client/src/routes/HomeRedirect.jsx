import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_HOME } from '../constants/routes';
import { Loader } from '../components/common/Loader';

/** Sends authenticated users to their role home; guests to login/register */
export function HomeRedirect() {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) return <Loader fullScreen message="Loading…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[role] || '/login'} replace />;
}
