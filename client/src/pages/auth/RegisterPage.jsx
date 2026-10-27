import React from 'react';
import { Link } from 'react-router-dom';
import campusBg from '../../assets/addu-campus.jpg';
import { AuthPageLayout } from '../../components/layout/AuthPageLayout';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { BrandLogo } from '../../components/common/BrandLogo';

export function RegisterPage() {
  return (
    <AuthPageLayout cardMaxWidth="max-w-lg" backgroundImage={campusBg}>
      <div className="w-full">
        {/* Mobile-only logo display */}
        <div className="lg:hidden mb-4 flex justify-center">
          <BrandLogo size="md" subtitle="Ateneo de Davao University" variant="light" />
        </div>

        <div className="mb-4 text-left">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-ateneo-blue">USER REGISTRATION</span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-0.5">Create your account</h2>
          <p className="mt-0.5 text-xs text-slate-600">
            For students and property owners within 2 km of Ateneo de Davao.
          </p>
        </div>

        <RegisterForm />

        <div className="mt-4 pt-3.5 border-t border-slate-200/70 text-center">
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
