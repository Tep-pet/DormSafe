import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_HOME, ROUTES } from '../constants/routes';
import { Loader } from '../components/common/Loader';

/** Sends authenticated users to their role home; guests to login/register */
export function HomeRedirect() {
  const { isAuthenticated, role, profile, loading } = useAuth();

  if (loading) return <Loader fullScreen message="Loading…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (role === 'student' && profile?.verification_status !== 'approved') {
    return <Navigate to={ROUTES.STUDENT_VERIFICATION} replace />;
  }
  if (role === 'owner' && profile?.verification_status !== 'approved') {
    return <Navigate to={ROUTES.OWNER_VERIFICATION} replace />;
  }

  return <Navigate to={ROLE_HOME[role] || '/login'} replace />;
}
