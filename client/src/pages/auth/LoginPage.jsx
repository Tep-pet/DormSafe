import React from 'react';
import { Link } from 'react-router-dom';
import campusBg from '../../assets/addu-campus.jpg';
import { AuthPageLayout } from '../../components/layout/AuthPageLayout';
import { LoginForm } from '../../components/auth/LoginForm';
import { BrandLogo } from '../../components/common/BrandLogo';

export function LoginPage() {
  return (
    <AuthPageLayout cardMaxWidth="max-w-md" backgroundImage={campusBg}>
      <div className="rounded-3xl border border-white/40 bg-white/20 backdrop-blur-xl p-5 sm:p-7 xl:p-8 shadow-2xl shadow-slate-900/20">
        {/* Mobile-only logo display */}
        <div className="lg:hidden mb-4 flex justify-center">
          <BrandLogo size="md" subtitle="Ateneo de Davao University" variant="dark" />
        </div>

        <div className="mb-4 text-left">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-sm">Sign in to your account</h2>
          <p className="mt-0.5 text-xs text-slate-200 drop-shadow-xs">
            Access verified student housing, stay records, and campus safety services.
          </p>
        </div>

        <LoginForm />

        <div className="mt-4 pt-3.5 border-t border-white/20 text-center">
          <p className="text-xs text-slate-200 drop-shadow-xs">
            Don&apos;t have an account yet?{' '}
            <Link
              to="/register"
              className="font-semibold text-cyan-300 hover:text-cyan-200 hover:underline transition-colors"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </AuthPageLayout>
  );
}
