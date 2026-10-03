import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Select, SelectItem } from '@heroui/react';
import { User, Mail, Lock, Eye, EyeOff, UploadCloud, AlertCircle, FileCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { REGISTERABLE_ROLES, ROLE_LABELS } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import { useToast } from '../../hooks/useToast';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { emailValidationMessage } from '../../utils/validateEmail';
import { IMAGE_ACCEPT, validateImageFile } from '../../utils/validateImage';
import { IMAGE_SIZE_HINT } from '../../constants/uploadLimits';

export function RegisterForm() {
  const { registerWithDocuments, login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: REGISTERABLE_ROLES[0],
  });
  const [idFile, setIdFile] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
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
    if (emailErr) {
      setError(emailErr);
      return;
    }

    const idErr = validateImageFile(idFile, 'Valid ID');
    if (idErr) {
      setError(idErr);
      return;
    }

    if (isOwner) {
      const licErr = validateImageFile(licenseFile, 'Business license/permit');
      if (licErr) {
        setError(licErr);
        return;
      }
    }

    setLoading(true);
    try {
      await registerWithDocuments({
        ...form,
        idFile,
        licenseFile: isOwner ? licenseFile : null,
      });
      await login({ email: form.email.trim(), password: form.password });

      toast.success({
        title: 'Account Created',
        message: 'Your registration was submitted for administrator review.',
      });

      const verificationRoute =
        form.role === 'owner' ? ROUTES.OWNER_VERIFICATION : ROUTES.STUDENT_VERIFICATION;
      navigate(verificationRoute);
    } catch (err) {
      const msg = err.message || 'Registration failed';
      setError(msg);
      toast.error({
        title: 'Registration Error',
        message: msg,
      });
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
        startContent={<User className="h-4 w-4 text-slate-400 flex-shrink-0" />}
      />

      <Input
        id="email"
        label="Ateneo / Personal Email"
        type="email"
        value={form.email}
        onChange={update('email')}
        required
        autoComplete="email"
        placeholder="juan@addu.edu.ph"
        startContent={<Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />}
      />

      <Input
        id="password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        value={form.password}
        onChange={update('password')}
        required
        minLength={6}
        autoComplete="new-password"
        placeholder="At least 6 characters"
        startContent={<Lock className="h-4 w-4 text-slate-400 flex-shrink-0" />}
        endContent={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
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

      <div>
        <Select
          label="Account Role"
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
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <input
            type="file"
            accept={IMAGE_ACCEPT}
            onChange={(e) => setIdFile(e.target.files?.[0] || null)}
            required
            className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-ateneo-blue file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:opacity-90 cursor-pointer"
          />
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-500">
            <span>Required for verification. {IMAGE_SIZE_HINT}.</span>
            {idFile && (
              <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                <FileCheck className="h-3 w-3" />
                Selected
              </span>
            )}
          </div>
        </div>
      </div>

      {isOwner && (
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-700">
            Business License / Permit
          </label>
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <input
              type="file"
              accept={IMAGE_ACCEPT}
              onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
              required
              className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-ateneo-blue file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:opacity-90 cursor-pointer"
            />
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-500">
              <span>Required for property owners. {IMAGE_SIZE_HINT}.</span>
              {licenseFile && (
                <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                  <FileCheck className="h-3 w-3" />
                  Selected
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-600" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <Button
        type="submit"
        className="w-full h-11 text-sm font-semibold shadow-md shadow-blue-900/10"
        isLoading={loading}
      >
        {loading ? 'Creating account…' : 'Create Account'}
      </Button>

      <p className="text-[11px] text-center text-gray-500">
        After registration, an administrator will verify your credentials before access is granted.
      </p>
    </form>
  );
}
