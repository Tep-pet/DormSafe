import { Link } from 'react-router-dom';
import { AuthPageLayout } from '../../components/layout/AuthPageLayout';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { BrandLogo } from '../../components/common/BrandLogo';

export function RegisterPage() {
  return (
    <AuthPageLayout>
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200/90 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandLogo size="lg" subtitle="Ateneo de Davao University" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1 text-xs text-gray-500">
            For students and property owners within 2 km of Ateneo.
          </p>
        </div>
        <div className="mt-6">
          <RegisterForm />
        </div>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-ateneo-blue hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthPageLayout>
  );
}
