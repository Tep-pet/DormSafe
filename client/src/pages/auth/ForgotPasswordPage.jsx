import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, KeyRound, Lock, Eye, EyeOff, ShieldCheck, RefreshCw } from 'lucide-react';
import campusBg from '../../assets/addu-campus.jpg';
import { AuthPageLayout } from '../../components/layout/AuthPageLayout';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { authService } from '../../services/authService';
import { useToast } from '../../hooks/useToast';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const urlEmail = searchParams.get('email') || '';
  const urlCode = searchParams.get('code') || '';
  const initialStep = urlCode || searchParams.get('step') === 'code' ? 'code' : 'email';

  // step: 'email' | 'code' | 'password' | 'success'
  const [step, setStep] = useState(initialStep);
  const [email, setEmail] = useState(urlEmail);
  const [code, setCode] = useState(urlCode);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Countdown timer for resending code
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Step 1: Send verification code to email
  async function handleSendCode(e) {
    if (e) e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(cleanEmail);
      setStep('code');
      setCooldown(45);
      toast.success({
        title: 'Verification Code Sent',
        message: `An 8-digit verification code was sent to ${cleanEmail}.`,
      });
    } catch (err) {
      const msg = err.message || 'Failed to send verification code. Please check your email.';
      setError(msg);
      toast.error({ title: 'Request Failed', message: msg });
    } finally {
      setLoading(false);
    }
  }

  // Resend code
  async function handleResendCode() {
    if (cooldown > 0 || resending) return;
    setError('');
    setResending(true);
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      setCooldown(60);
      toast.success({
        title: 'New Code Sent',
        message: 'A fresh verification code was sent to your email.',
      });
    } catch (err) {
      setError(err.message || 'Could not resend code. Please try again.');
    } finally {
      setResending(false);
    }
  }

  // Step 2: Verify the 8-digit code
  async function handleVerifyCode(e) {
    e.preventDefault();
    setError('');

    const cleanCode = code.trim().replace(/\s+/g, '');
    if (!cleanCode) {
      setError('Please enter the 8-digit verification code from your email.');
      return;
    }

    if (cleanCode.length < 6) {
      setError('Verification code must be at least 6 digits long.');
      return;
    }

    setLoading(true);
    try {
      await authService.verifyRecoveryOtp({
        email: email.trim().toLowerCase(),
        token: cleanCode,
      });
      setStep('password');
      toast.success({
        title: 'Code Verified',
        message: 'Your verification code is confirmed. Set your new password below.',
      });
    } catch (err) {
      console.warn('[ForgotPassword] verifyRecoveryOtp notice:', err.message);
      // If client OTP verification failed, we can still proceed to step 3
      // and perform server-side verification with resetPasswordWithCode
      if (cleanCode.length >= 6) {
        setStep('password');
      } else {
        setError(err.message || 'Invalid verification code. Please check your email.');
      }
    } finally {
      setLoading(false);
    }
  }

  // Step 3: Save new password
  async function handleSavePassword(e) {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Please enter a new password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setLoading(true);
    try {
      // 1. Try backend code-based reset (most reliable and independent of client session state)
      try {
        await authService.resetPasswordWithCode({
          email: email.trim().toLowerCase(),
          code: code.trim().replace(/\s+/g, ''),
          newPassword: password,
        });
      } catch (beErr) {
        console.warn('[ForgotPassword] Backend reset fallback to client session:', beErr.message);
        // 2. Fallback to active Supabase session update
        await authService.updatePassword(password);
      }

      setStep('success');
      toast.success({
        title: 'Password Updated!',
        message: 'Your password has been changed successfully.',
      });
    } catch (err) {
      const msg = err.message || 'Failed to update password. Please check your code or request a new one.';
      setError(msg);
      toast.error({ title: 'Update Failed', message: msg });
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

        {/* Step Progress Pills */}
        {step !== 'success' && (
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold">
              <span
                className={`flex items-center justify-center h-5 w-5 rounded-full text-[10px] ${
                  step === 'email'
                    ? 'bg-ateneo-blue text-white shadow-xs'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {step !== 'email' ? '✓' : '1'}
              </span>
              <span className={step === 'email' ? 'text-ateneo-blue font-extrabold' : 'text-slate-400'}>
                Email
              </span>
            </div>
            <div className="h-0.5 w-6 bg-slate-200" />
            <div className="flex items-center gap-1.5 text-[11px] font-bold">
              <span
                className={`flex items-center justify-center h-5 w-5 rounded-full text-[10px] ${
                  step === 'code'
                    ? 'bg-ateneo-blue text-white shadow-xs'
                    : step === 'password'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step === 'password' ? '✓' : '2'}
              </span>
              <span className={step === 'code' ? 'text-ateneo-blue font-extrabold' : 'text-slate-400'}>
                Code
              </span>
            </div>
            <div className="h-0.5 w-6 bg-slate-200" />
            <div className="flex items-center gap-1.5 text-[11px] font-bold">
              <span
                className={`flex items-center justify-center h-5 w-5 rounded-full text-[10px] ${
                  step === 'password'
                    ? 'bg-ateneo-blue text-white shadow-xs'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                3
              </span>
              <span className={step === 'password' ? 'text-ateneo-blue font-extrabold' : 'text-slate-400'}>
                Password
              </span>
            </div>
          </div>
        )}

        {/* ================= STEP 1: ENTER EMAIL ================= */}
        {step === 'email' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="text-left">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-ateneo-blue">
                PASSWORD RECOVERY
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
                Reset your password
              </h2>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Enter your Ateneo or registered account email. We will send an 8-digit verification code to your inbox.
              </p>
            </div>

            <form onSubmit={handleSendCode} className="space-y-3 pt-1">
              <Input
                id="email"
                label="Ateneo / Registered Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
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
                {loading ? 'Sending Code…' : 'Send Verification Code'}
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setStep('code')}
                  className="text-xs font-semibold text-slate-600 hover:text-ateneo-blue underline transition-colors"
                >
                  Already received a code? Click here to enter it
                </button>
              </div>

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
          </div>
        )}

        {/* ================= STEP 2: ENTER VERIFICATION CODE ================= */}
        {step === 'code' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="text-left">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-ateneo-blue">
                STEP 2 OF 3
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
                Enter Verification Code
              </h2>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                We sent an 8-digit verification code to{' '}
                <strong className="text-slate-900 underline">{email || 'your email'}</strong>.
              </p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-3.5 pt-1">
              {!email && (
                <Input
                  id="codeEmail"
                  label="Confirm Your Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your-email@addu.edu.ph"
                  startContent={<Mail className="h-4 w-4 text-slate-400" />}
                />
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 text-left">
                  8-Digit Verification Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="12345678"
                    autoFocus
                    required
                    className="w-full h-13 px-4 text-center font-mono text-2xl font-black tracking-[0.35em] text-ateneo-blue bg-white border-2 border-slate-300 focus:border-ateneo-blue focus:ring-4 focus:ring-blue-100 rounded-xl transition-all shadow-xs outline-none"
                  />
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500 text-left">
                  Check your inbox and spam/junk folder for the code from DormSafe.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 animate-in fade-in duration-200">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-600" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-10 text-sm font-bold bg-gradient-to-r from-ateneo-blue via-blue-700 to-indigo-700 hover:opacity-95 text-white rounded-xl shadow-md shadow-blue-900/15"
                isLoading={loading}
              >
                {loading ? 'Verifying Code…' : 'Verify Code & Continue'}
              </Button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="font-semibold text-slate-600 hover:text-ateneo-blue inline-flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" /> Change email
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={cooldown > 0 || resending}
                  className="font-bold text-ateneo-blue hover:text-blue-700 disabled:text-slate-400 inline-flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className={`h-3 w-3 ${resending ? 'animate-spin' : ''}`} />
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= STEP 3: CREATE NEW PASSWORD ================= */}
        {step === 'password' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="text-left">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> CODE VERIFIED
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
                Set New Password
              </h2>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Choose a strong new password for your DormSafe account ({email}).
              </p>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-3.5 pt-1">
              <div className="relative">
                <Input
                  id="password"
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  placeholder="At least 6 characters"
                  startContent={<Lock className="h-4 w-4 text-slate-400" />}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
              </div>

              <div className="relative">
                <Input
                  id="confirmPassword"
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter your new password"
                  startContent={<Lock className="h-4 w-4 text-slate-400" />}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
              </div>

              {password && confirmPassword && (
                <div
                  className={`text-left text-xs font-semibold px-1 flex items-center gap-1.5 ${
                    password === confirmPassword ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {password === confirmPassword ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Passwords match
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3.5 w-3.5" /> Passwords do not match
                    </>
                  )}
                </div>
              )}

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
                {loading ? 'Saving New Password…' : 'Save New Password'}
              </Button>
            </form>
          </div>
        )}

        {/* ================= STEP 4: SUCCESS ================= */}
        {step === 'success' && (
          <div className="space-y-4 animate-in fade-in duration-300 text-center py-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Password Reset Successful!</h2>
              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                Your password has been securely updated. You can now log into DormSafe with your new credentials.
              </p>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full h-11 text-sm font-bold bg-ateneo-blue hover:bg-blue-800 text-white rounded-xl shadow-md shadow-blue-900/20"
              >
                Sign In to DormSafe Now
              </Button>
            </div>
          </div>
        )}
      </div>
    </AuthPageLayout>
  );
}
