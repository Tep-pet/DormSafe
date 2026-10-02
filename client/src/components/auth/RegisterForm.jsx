import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Select, SelectItem } from '@heroui/react';
import { useAuth } from '../../hooks/useAuth';
import { REGISTERABLE_ROLES, ROLE_LABELS } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { emailValidationMessage } from '../../utils/validateEmail';
import { IMAGE_ACCEPT, validateImageFile } from '../../utils/validateImage';
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
        placeholder="Juan Dela Cruz"
      />
      <Input
        id="email"
        label="Email"
        type="email"
        value={form.email}
        onChange={update('email')}
        required
        autoComplete="email"
        placeholder="juan@addu.edu.ph"
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
        placeholder="••••••••"
      />

      <div>
        <Select
          label="I am a…"
          selectedKeys={[form.role]}
          onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
          variant="bordered"
          radius="lg"
          size="sm"
          classNames={{
            label: 'text-xs font-semibold text-gray-700 mb-1',
            trigger: 'border-gray-300 hover:border-gray-400 bg-white shadow-2xs',
          }}
        >
          {REGISTERABLE_ROLES.map((r) => (
            <SelectItem key={r} textValue={ROLE_LABELS[r]}>
              {ROLE_LABELS[r]}
            </SelectItem>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-gray-700">Valid ID Photo</label>
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
          <input
            type="file"
            accept={IMAGE_ACCEPT}
            onChange={(e) => setIdFile(e.target.files?.[0] || null)}
            required
            className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-ateneo-blue file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:opacity-90 cursor-pointer"
          />
          <p className="mt-1.5 text-[11px] text-gray-500">
            Required for account verification. {IMAGE_SIZE_HINT}.
          </p>
        </div>
      </div>

      {isOwner && (
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-700">
            Business License / Permit
          </label>
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
            <input
              type="file"
              accept={IMAGE_ACCEPT}
              onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
              required
              className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-ateneo-blue file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:opacity-90 cursor-pointer"
            />
            <p className="mt-1.5 text-[11px] text-gray-500">
              Required for property owners. {IMAGE_SIZE_HINT}.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" isLoading={loading}>
        {loading ? 'Creating account…' : 'Create Account'}
      </Button>

      <p className="text-[11px] text-center text-gray-500">
        After registration, an administrator will verify your credentials before access is granted.
      </p>
    </form>
  );
}
