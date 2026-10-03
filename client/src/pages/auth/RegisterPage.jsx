import { Link } from 'react-router-dom';
import { AuthPageLayout } from '../../components/layout/AuthPageLayout';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { BrandLogo } from '../../components/common/BrandLogo';

export function RegisterPage() {
  return (
    <AuthPageLayout cardMaxWidth="max-w-lg">
      <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-7 sm:p-9 shadow-xl shadow-slate-900/5 backdrop-blur-md">
        {/* Mobile-only logo display */}
        <div className="lg:hidden mb-6 flex justify-center">
          <BrandLogo size="lg" subtitle="Ateneo de Davao University" />
        </div>

        <div className="mb-6 text-left">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h2>
          <p className="mt-1 text-xs text-slate-500">
            For students and property owners within 2 km of Ateneo de Davao.
          </p>
        </div>

        <RegisterForm />

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-ateneo-blue hover:text-blue-700 hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthPageLayout>
  );
}
