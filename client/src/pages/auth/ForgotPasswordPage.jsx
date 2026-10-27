import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import campusBg from '../../assets/addu-campus.jpg';
import { AuthPageLayout } from '../../components/layout/AuthPageLayout';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { authService } from '../../services/authService';
import { useToast } from '../../hooks/useToast';

export function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(cleanEmail);
      setSubmitted(true);
      toast.success({
        title: 'Reset instructions sent',
        message: `Check ${cleanEmail} for your password reset link.`,
      });
    } catch (err) {
      const msg = err.message || 'Failed to send reset link. Please try again.';
      setError(msg);
      toast.error({
        title: 'Request Failed',
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageLayout cardMaxWidth="max-w-md" backgroundImage={campusBg}>
      <div className="w-full">
        {/* Mobile-only logo display */}
        <div className="lg:hidden mb-4 flex justify-center">
          <BrandLogo size="md" subtitle="Ateneo de Davao University" variant="light" />
        </div>

        <div className="mb-4 text-left">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-ateneo-blue">
            USER SECURITY
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
            Forgot your password?
          </h2>
          <p className="mt-0.5 text-xs text-slate-600">
            Enter your Ateneo or registered email to receive a secure password reset link.
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-left">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-emerald-900">Reset Link Sent</h3>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    We sent password reset instructions to <strong className="font-semibold text-emerald-950">{email}</strong>.
                  </p>
                  <p className="text-[11px] text-emerald-700 pt-1">
                    Please check your inbox and spam folder. The link will expire in 1 hour.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSubmitted(false)}
                className="w-full h-10 text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                Send to a different email
              </Button>

              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-1.5 w-full h-10 text-xs font-bold text-ateneo-blue hover:text-blue-700 hover:underline transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Return to Sign in
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              id="email"
              label="Ateneo / Registered Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="your-email@addu.edu.ph"
              startContent={<Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />}
            />

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 animate-in fade-in duration-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-600" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10 text-sm font-bold bg-gradient-to-r from-ateneo-blue via-blue-700 to-indigo-700 hover:opacity-95 text-white rounded-xl shadow-md shadow-blue-900/15 mt-2"
              isLoading={loading}
            >
              {loading ? 'Sending link…' : 'Send Reset Link'}
            </Button>

            <div className="mt-4 pt-3.5 border-t border-slate-200/70 text-center">
              <p className="text-xs text-slate-600">
                Remembered your password?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-ateneo-blue hover:text-blue-700 hover:underline transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </AuthPageLayout>
  );
}
