import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { REGISTERABLE_ROLES, ROLE_LABELS } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { emailValidationMessage } from '../../utils/validateEmail';
import { validateImageFile } from '../../utils/validateImage';
import { IMAGE_SIZE_HINT } from '../../constants/uploadLimits';

export function RegisterForm() {
  const { registerWithDocuments, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: REGISTERABLE_ROLES[0],
  });
  const [idFile, setIdFile] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isOwner = form.role === 'owner';

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const emailErr = emailValidationMessage(form.email);
    if (emailErr) return setError(emailErr);

    const idErr = validateImageFile(idFile, 'Valid ID');
    if (idErr) return setError(idErr);

    if (isOwner) {
      const licErr = validateImageFile(licenseFile, 'Business license/permit');
      if (licErr) return setError(licErr);
    }

    setLoading(true);
    try {
      await registerWithDocuments({
        ...form,
        idFile,
        licenseFile: isOwner ? licenseFile : null,
      });
      await login({ email: form.email.trim(), password: form.password });

      const verificationRoute =
        form.role === 'owner' ? ROUTES.OWNER_VERIFICATION : ROUTES.STUDENT_VERIFICATION;
      navigate(verificationRoute);
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

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Valid ID photo</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setIdFile(e.target.files?.[0] || null)}
          required
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-ateneo-blue file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
        />
        <p className="mt-1 text-xs text-gray-500">
          Required for verification. {IMAGE_SIZE_HINT}.
        </p>
      </div>

      {isOwner && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Business license / permit
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
            required
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-ateneo-blue file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
          />
          <p className="mt-1 text-xs text-gray-500">Required for property owners. {IMAGE_SIZE_HINT}.</p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating account…' : 'Create Account'}
      </Button>
      <p className="text-xs text-gray-500">
        After registration, an admin will review your ID before you can use DormSafe.
      </p>
    </form>
  );
}
