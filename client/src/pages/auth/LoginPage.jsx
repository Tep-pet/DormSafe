import { Link } from 'react-router-dom';
import { AuthPageLayout } from '../../components/layout/AuthPageLayout';
import { LoginForm } from '../../components/auth/LoginForm';

export function LoginPage() {
  return (
    <AuthPageLayout>
      <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Sign in to DormSafe</h1>
        <p className="mt-1 text-sm text-gray-600">
          Find verified housing near Ateneo de Davao.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-sm text-gray-600">
          No account?{' '}
          <Link to="/register" className="text-ateneo-blue hover:underline">
            Register
          </Link>
        </p>
      </div>
    </AuthPageLayout>
  );
}
