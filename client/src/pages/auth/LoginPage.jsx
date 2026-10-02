import { Link } from 'react-router-dom';
import { AuthPageLayout } from '../../components/layout/AuthPageLayout';
import { LoginForm } from '../../components/auth/LoginForm';
import { BrandLogo } from '../../components/common/BrandLogo';

export function LoginPage() {
  return (
    <AuthPageLayout>
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200/90 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandLogo size="lg" subtitle="Ateneo de Davao University" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">Sign in to your account</h1>
          <p className="mt-1 text-xs text-gray-500">
            Access verified housing and campus services.
          </p>
        </div>
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
