import { Link } from 'react-router-dom';
import { AuthPageLayout } from '../../components/layout/AuthPageLayout';
import { RegisterForm } from '../../components/auth/RegisterForm';

export function RegisterPage() {
  return (
    <AuthPageLayout>
      <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Create your account</h1>
        <p className="mt-1 text-sm text-gray-600">
          Students and property owners within 2 km of Ateneo campuses.
        </p>
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
