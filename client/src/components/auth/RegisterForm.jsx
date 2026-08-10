import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { REGISTERABLE_ROLES, ROLE_LABELS } from '../../constants/roles';
import { ROLE_HOME } from '../../constants/routes';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

export function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: REGISTERABLE_ROLES[0],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate(ROLE_HOME[form.role] || '/login');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="fullName"
        label="Full Name"
        value={form.fullName}
        onChange={update('fullName')}
        required
      />
      <Input
        id="email"
        label="Email"
        type="email"
        value={form.email}
        onChange={update('email')}
        required
        autoComplete="email"
      />
      <Input
        id="password"
        label="Password"
        type="password"
        value={form.password}
        onChange={update('password')}
        required
        minLength={6}
        autoComplete="new-password"
      />

      <div>
        <label htmlFor="role" className="mb-1 block text-sm font-medium text-gray-700">
          I am a…
        </label>
        <select
          id="role"
          value={form.role}
          onChange={update('role')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-ateneo-blue focus:outline-none focus:ring-2 focus:ring-ateneo-blue/20"
        >
          {REGISTERABLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating account…' : 'Create Account'}
      </Button>
    </form>
  );
}
