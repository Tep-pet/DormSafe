import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import campusBg from '../../assets/addu-campus.jpg';
import { AuthPageLayout } from '../../components/layout/AuthPageLayout';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { authService } from '../../services/authService';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../hooks/useToast';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Check if recovery session or token is active
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setSessionReady(true);
      }
    }
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setSessionReady(true);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      await authService.updatePassword(password);
      setSuccess(true);
      toast.success({
        title: 'Password Updated',
        message: 'Your password has been reset successfully.',
      });

      // Redirect to login after a brief moment
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err) {
      const msg = err.message || 'Failed to update password. Your reset link may have expired.';
      setError(msg);
      toast.error({
        title: 'Update Failed',
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
            NEW CREDENTIALS
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
            Set new password
          </h2>
          <p className="mt-0.5 text-xs text-slate-600">
            Choose a secure password of at least 6 characters for your DormSafe account.
          </p>
        </div>

        {success ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-left">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-emerald-900">Password Changed Successfully</h3>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    You can now sign in to your DormSafe account with your new password.
                  </p>
                  <p className="text-[11px] text-emerald-700 pt-1">
                    Redirecting you to sign in…
                  </p>
                </div>
              </div>
            </div>

            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full h-10 text-xs font-bold text-white bg-ateneo-blue hover:bg-blue-800 rounded-xl transition-colors shadow-sm"
            >
              Go to Sign In Now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              id="new-password"
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="At least 6 characters"
              startContent={<Lock className="h-4 w-4 text-slate-400 flex-shrink-0" />}
              endContent={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            <Input
              id="confirm-password"
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              startContent={<Lock className="h-4 w-4 text-slate-400 flex-shrink-0" />}
              endContent={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
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
              {loading ? 'Updating password…' : 'Save New Password'}
            </Button>

            <div className="mt-4 pt-3.5 border-t border-slate-200/70 text-center">
              <p className="text-xs text-slate-600">
                Cancel and return to{' '}
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
