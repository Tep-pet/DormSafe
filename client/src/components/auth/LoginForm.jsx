import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles, UserCheck, Shield, Building } from 'lucide-react';
import { authService } from '../../services/authService';
import { ROLE_HOME } from '../../constants/routes';
import { useToast } from '../../hooks/useToast';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

export function LoginForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick fill helper for review & testing
  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

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

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Demo Credentials Quick-Fill Selector */}
      <div className="rounded-2xl border border-blue-100/80 bg-blue-50/50 p-2.5">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-ateneo-blue mb-1.5">
          <Sparkles className="h-3 w-3" />
          <span>Quick Demo Fill:</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickFill('chaeaddu@gmail.com', 'chae123')}
            className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-[10px] font-medium text-slate-700 shadow-2xs transition-all hover:border-ateneo-blue hover:text-ateneo-blue active:scale-95"
          >
            <UserCheck className="h-2.5 w-2.5 text-blue-600" />
            <span>Student</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('owner.ivory1104@dormsafe.test', 'Owner123!')}
            className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-[10px] font-medium text-slate-700 shadow-2xs transition-all hover:border-ateneo-blue hover:text-ateneo-blue active:scale-95"
          >
            <Building className="h-2.5 w-2.5 text-indigo-600" />
            <span>Landlord</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('admin@dormsafe.test', 'Admin123!')}
            className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-[10px] font-medium text-slate-700 shadow-2xs transition-all hover:border-ateneo-blue hover:text-ateneo-blue active:scale-95"
          >
            <Shield className="h-2.5 w-2.5 text-amber-600" />
            <span>Admin</span>
          </button>
        </div>
      </div>

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
