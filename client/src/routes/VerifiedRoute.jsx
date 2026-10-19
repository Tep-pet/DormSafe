import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../constants/routes';
import { Loader } from '../components/common/Loader';

/** Blocks student/owner routes until account verification is approved */
export function VerifiedRoute() {
  const { profile, role, loading, isAuthenticated } = useAuth();

  if (loading || (isAuthenticated && !profile)) {
    return <Loader fullScreen message="Loading…" />;
  }
  if (role === 'admin') return <Outlet />;
  if (profile?.verification_status === 'approved') return <Outlet />;

  if (role === 'student') {
    return <Navigate to={ROUTES.STUDENT_VERIFICATION} replace />;
  }
  if (role === 'owner') {
    return <Navigate to={ROUTES.OWNER_VERIFICATION} replace />;
  }

  return <Outlet />;
}
