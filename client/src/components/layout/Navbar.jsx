import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../common/Button';

export function Navbar() {
  const { isAuthenticated, profile, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold text-ateneo-blue">
          DormSafe
        </Link>

        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-gray-600 sm:inline">
                {profile?.full_name} · {profile?.role}
              </span>
              <Button variant="ghost" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-ateneo-blue hover:underline">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-ateneo-blue px-3 py-1.5 text-sm text-white hover:bg-blue-900"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
