import { Link } from 'react-router-dom';
import { AuthPageLayout } from '../../components/layout/AuthPageLayout';
import { LoginForm } from '../../components/auth/LoginForm';
import { BrandLogo } from '../../components/common/BrandLogo';

export function LoginPage() {
  return (
    <AuthPageLayout cardMaxWidth="max-w-md">
      <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-5 sm:p-7 xl:p-8 shadow-xl shadow-slate-900/5 backdrop-blur-md">
        {/* Mobile-only logo display */}
        <div className="lg:hidden mb-4 flex justify-center">
          <BrandLogo size="md" subtitle="Ateneo de Davao University" />
        </div>

        <div className="mb-4 text-left">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Sign in to your account</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Access verified student housing, stay records, and campus safety services.
          </p>
        </div>

        <LoginForm />

        <div className="mt-4 pt-3.5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            Don&apos;t have an account yet?{' '}
            <Link
              to="/register"
              className="font-semibold text-ateneo-blue hover:text-blue-700 hover:underline transition-colors"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </AuthPageLayout>
  );
}
