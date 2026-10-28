import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound, Mail, Loader2, ArrowLeft } from 'lucide-react';
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
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const tokenHashParam = searchParams.get('token_hash');
  const emailParam = searchParams.get('email') || '';
  const codeParam = searchParams.get('code') || '';

  const [email, setEmail] = useState(emailParam);
  const [otpCode, setOtpCode] = useState(codeParam);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyingLink, setVerifyingLink] = useState(Boolean(tokenHashParam));
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initializeSession() {
      // 1. If URL has token_hash query param, verify it directly
      if (tokenHashParam) {
        setVerifyingLink(true);
        try {
          const { data, error: vErr } = await supabase.auth.verifyOtp({
            token_hash: tokenHashParam,
            type: 'recovery',
          });

          if (vErr) {
            throw vErr;
          }

          if (isMounted) {
            setSessionReady(true);
            setError('');
          }
        } catch (err) {
          if (isMounted) {
            console.warn('[ResetPassword] verifyOtp error:', err.message);
            setError(
              'Your password reset link has expired or has already been used. You can request a new link or enter the 8-digit verification code from your email.'
            );
          }
        } finally {
          if (isMounted) setVerifyingLink(false);
        }
        return;
      }

      // 2. If URL has hash fragment with access_token (legacy flow)
      if (window.location.hash && window.location.hash.includes('access_token')) {
        try {
          const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken) {
            const { error: sErr } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (!sErr && isMounted) {
              setSessionReady(true);
              return;
            }
          }
        } catch (err) {
          console.warn('[ResetPassword] hash session error:', err.message);
        }
      }

      // 3. Check existing active session
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session && isMounted) {
          setSessionReady(true);
        }
      } catch {
        // no active session
      }
    }

    initializeSession();

    // Listen for auth state transitions (PASSWORD_RECOVERY event)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'PASSWORD_RECOVERY' || session) && isMounted) {
        setSessionReady(true);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [tokenHashParam]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      // 1. If we have email and code, try direct code-based password update
      if (email.trim() && otpCode.trim()) {
        try {
          await authService.resetPasswordWithCode({
            email: email.trim(),
            code: otpCode.trim(),
            newPassword: password,
          });
          setSuccess(true);
          toast.success({
            title: 'Password Updated',
            message: 'Your DormSafe password has been reset successfully.',
          });
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 2000);
          return;
        } catch (beErr) {
          console.warn('[ResetPassword] Backend code reset fallback:', beErr.message);
        }
      }

      // 2. If we don't have an active session yet, verify with the OTP code first
      if (!sessionReady) {
        if (!email.trim() || !otpCode.trim()) {
          setError('Please provide both your registered email and the 8-digit verification code from your email.');
          setLoading(false);
          return;
        }

        await authService.verifyRecoveryOtp({
          email: email.trim(),
          token: otpCode.trim(),
        });
      }

      // 3. Update password with the authenticated session
      await authService.updatePassword(password);
      setSuccess(true);
      toast.success({
        title: 'Password Updated',
        message: 'Your DormSafe password has been reset successfully.',
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err) {
      const msg = err.message || 'Failed to update password. Please check your verification code or request a new code.';
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
            ACCOUNT SECURITY
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
            Reset your password
          </h2>
          <p className="mt-0.5 text-xs text-slate-600">
            {sessionReady
              ? 'Enter and confirm your new secure password below.'
              : 'Set your new password using your verified reset link or 8-digit recovery code.'}
          </p>
        </div>

        {verifyingLink ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-6 text-center space-y-3 animate-in fade-in">
            <Loader2 className="h-6 w-6 animate-spin text-ateneo-blue mx-auto" />
            <p className="text-xs font-semibold text-slate-700">Verifying your secure password reset link…</p>
            <p className="text-[11px] text-slate-500">Connecting to Ateneo DormSafe authentication services…</p>
          </div>
        ) : success ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-left shadow-xs">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-emerald-950">Password Changed Successfully!</h3>
                  <p className="text-xs text-emerald-850 leading-relaxed">
                    Your password has been securely updated. You can now log in with your new credentials.
                  </p>
                  <p className="text-[11px] text-emerald-700 pt-1">
                    Redirecting you to the sign-in page…
                  </p>
                </div>
              </div>
            </div>

            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full h-10 text-xs font-bold text-white bg-ateneo-blue hover:bg-blue-800 rounded-xl transition-colors shadow-sm"
            >
              Sign In Now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 animate-in fade-in duration-200 text-left">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-600" />
                <div className="space-y-1">
                  <span className="font-semibold">{error}</span>
                  {!sessionReady && (
                    <p className="text-[11px] text-red-600 font-normal">
                      You can enter the 8-digit verification code from your email below or{' '}
                      <Link to="/forgot-password" className="underline font-semibold hover:text-red-800">
                        request a fresh link
                      </Link>.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Manual email & OTP code entry if link token is not automatically verified */}
            {!sessionReady && (
              <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-left">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <KeyRound size={14} className="text-ateneo-blue" />
                  <span>Email & Verification Code</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Enter your Ateneo email and the 8-digit recovery code included in your email.
                </p>

                <Input
                  id="reset-email"
                  label="Registered Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your-email@addu.edu.ph"
                  startContent={<Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />}
                />

                <Input
                  id="otp-code"
                  label="8-Digit Recovery Code"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                  placeholder="e.g. 70188533"
                  startContent={<KeyRound className="h-4 w-4 text-slate-400 flex-shrink-0" />}
                />
              </div>
            )}

            {/* Password input fields */}
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

            <Button
              type="submit"
              className="w-full h-10 text-sm font-bold bg-gradient-to-r from-ateneo-blue via-blue-700 to-indigo-700 hover:opacity-95 text-white rounded-xl shadow-md shadow-blue-900/15 mt-2"
              isLoading={loading}
            >
              {loading ? 'Updating Password…' : 'Save New Password'}
            </Button>

            <div className="mt-4 pt-3.5 border-t border-slate-200/70 text-center flex items-center justify-between text-xs text-slate-600">
              <Link
                to="/forgot-password"
                className="font-medium text-slate-500 hover:text-slate-700 hover:underline transition-colors"
              >
                Request new link
              </Link>
              <Link
                to="/login"
                className="font-semibold text-ateneo-blue hover:text-blue-700 hover:underline transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft size={12} />
                Return to Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </AuthPageLayout>
  );
}
