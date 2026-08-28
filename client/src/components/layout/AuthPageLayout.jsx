import { Link } from 'react-router-dom';

/** Minimal header for login/register — no session info */
export function AuthPageLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-bold text-ateneo-blue">
            DormSafe
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-ateneo-blue hover:underline">
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-ateneo-blue px-3 py-1.5 text-sm text-white hover:bg-blue-900"
            >
              Register
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
