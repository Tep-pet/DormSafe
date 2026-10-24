import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, MapPin } from 'lucide-react';
import { authService } from '../../services/authService';
import { ROLE_HOME } from '../../constants/routes';
import { useToast } from '../../hooks/useToast';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

export function LoginForm({ variant = 'light' }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { session } = await authService.login({ email: email.trim(), password });
      const profile = await authService.getProfile(session.user.id);
      
      toast.success({
        title: 'Signed in successfully',
        message: `Welcome back, ${profile?.full_name || 'User'}!`,
      });

      navigate(ROLE_HOME[profile.role] || '/');
    } catch (err) {
      const msg = err.message || 'Invalid credentials or login failed';
      setError(msg);
      toast.error({
        title: 'Authentication Failed',
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  }

  if (variant === 'dark') {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          {/* Pill 1: Email / Username */}
          <div className="space-y-1 text-left">
            <label htmlFor="email" className="block text-xs font-medium text-slate-300 pl-3">
              Username or Email
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="your-email@addu.edu.ph"
                className="w-full rounded-full border border-slate-700/80 bg-slate-900/80 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 backdrop-blur-md transition-all focus:border-cyan-400 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 [color-scheme:dark] [&:-webkit-autofill]:shadow-[0_0_0_1000px_#0f172a_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#fff]"
              />
            </div>
          </div>

          {/* Pill 2: Password */}
          <div className="space-y-1 text-left">
            <label htmlFor="password" className="block text-xs font-medium text-slate-300 pl-3">
              Password
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-full border border-slate-700/80 bg-slate-900/80 pl-11 pr-11 py-3 text-sm text-white placeholder-slate-500 backdrop-blur-md transition-all focus:border-cyan-400 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 [color-scheme:dark] [&:-webkit-autofill]:shadow-[0_0_0_1000px_#0f172a_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#fff]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-slate-400 hover:text-slate-200 focus:outline-none transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Pill 3: Campus Site Indicator (Inspired by Photo 2) */}
          <div className="space-y-1 text-left">
            <span className="block text-xs font-medium text-slate-300 pl-3">
              Campus Site
            </span>
            <div className="flex items-center justify-between rounded-full border border-slate-700/80 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-200 backdrop-blur-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <MapPin className="h-4 w-4 text-cyan-400 shrink-0" />
                <span className="text-xs font-medium truncate text-slate-300">Ateneo de Davao (Jacinto / Matina)</span>
              </div>
              <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/90 px-2 py-0.5 rounded-full border border-cyan-800/40 shrink-0">
                Active
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300 backdrop-blur-md animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Pill 4: Login Now Button (matching Photo 2) */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full border border-slate-600/70 bg-gradient-to-r from-slate-800 via-slate-800 to-slate-700 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 text-sm shadow-xl shadow-black/40 hover:shadow-cyan-500/25 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Authenticating…</span>
            </>
          ) : (
            <span>Login Now</span>
          )}
        </button>

        {/* Forgot Password note */}
        <div className="text-center pt-1">
          <span className="text-[11px] text-slate-400">
            Forgot Password? Contact Ateneo ICT Administrator
          </span>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2.5">
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

        <Input
          id="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="••••••••"
          startContent={<Lock className="h-4 w-4 text-slate-400 flex-shrink-0" />}
          endContent={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-600" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <Button
        type="submit"
        className="w-full h-10 text-sm font-semibold shadow-md shadow-blue-900/10 mt-1"
        isLoading={loading}
      >
        {loading ? 'Authenticating…' : 'Sign in to Account'}
      </Button>
    </form>
  );
}
