import React from 'react';
import { Link } from 'react-router-dom';
import campusBg from '../../assets/addu-campus.jpg';
import { AuthPageLayout } from '../../components/layout/AuthPageLayout';
import { LoginForm } from '../../components/auth/LoginForm';
import { BrandLogo } from '../../components/common/BrandLogo';

export function LoginPage() {
  return (
    <AuthPageLayout cardMaxWidth="max-w-md" backgroundImage={campusBg}>
      <div className="w-full">
        {/* Mobile-only logo display */}
        <div className="lg:hidden mb-4 flex justify-center">
          <BrandLogo size="md" subtitle="Ateneo de Davao University" variant="light" />
        </div>

        <div className="mb-4 text-left">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-ateneo-blue">USER LOGIN</span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-0.5">Sign in to your account</h2>
          <p className="mt-0.5 text-xs text-slate-600">
            Access verified student housing, stay records, and campus safety services.
          </p>
        </div>

        <LoginForm />

        <div className="mt-4 pt-3.5 border-t border-slate-200/70 text-center">
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
