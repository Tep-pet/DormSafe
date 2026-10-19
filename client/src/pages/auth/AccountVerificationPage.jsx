import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  ArrowRight,
  UploadCloud,
  FileCheck,
  Building,
  GraduationCap,
  Mail,
  User,
  Info,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { apiClient } from '../../services/apiClient';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ROLE_HOME } from '../../constants/routes';
import { ROLES } from '../../constants/roles';
import { IMAGE_ACCEPT, validateImageFile } from '../../utils/validateImage';
import { IMAGE_SIZE_HINT } from '../../constants/uploadLimits';

export function AccountVerificationPage({
  title,
  subtitle,
  requireLicense = false,
}) {
  const { accessToken, profile, role, logout, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [idFile, setIdFile] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Dev preview override helper (null = use live DB status)
  const [previewState, setPreviewState] = useState(null);

  // Fetch live verification status from server
  const fetchStatus = async (showNotification = false) => {
    if (!accessToken) return;
    try {
      setRefreshing(true);
      const res = await apiClient.get('/api/auth/verification/status', accessToken);
      setStatus(res.data);
      const updatedProfile = await refreshProfile();

      const currentStatus = res.data?.verification_status || updatedProfile?.verification_status;

      if (showNotification) {
        if (currentStatus === 'approved') {
          toast.success({
            title: 'Account Verified!',
            message: 'Your documents have been approved by the administrator.',
          });
        } else if (currentStatus === 'rejected') {
          toast.error({
            title: 'Verification Action Needed',
            message: 'Your documents were rejected. Please review admin notes and resubmit.',
          });
        } else if (currentStatus === 'pending') {
          toast.info({
            title: 'Verification Under Review',
            message: 'Your submission is queued for administrator evaluation.',
          });
        } else {
          toast.info({
            title: 'Status Checked',
            message: 'No active verification document submitted yet.',
          });
        }
      }
    } catch {
      // Fallback silently if offline or initial load
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus(false);
  }, [accessToken]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.info({
        title: 'Signed Out',
        message: 'You have been signed out successfully.',
      });
    } catch {
      navigate('/login');
    }
  };

  const handleGoToDashboard = () => {
    const target = ROLE_HOME[role] || '/';
    navigate(target);
  };

  async function handleResubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    const idErr = validateImageFile(idFile, 'ID photo');
    if (idErr) return setError(idErr);
    if (requireLicense || role === ROLES.OWNER) {
      const licErr = validateImageFile(licenseFile, 'Business license/permit');
      if (licErr) return setError(licErr);
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('idDocument', idFile);
      if (licenseFile) formData.append('licenseDocument', licenseFile);

      await apiClient.upload('/api/auth/verification/resubmit', formData, accessToken);

      toast.success({
        title: 'Documents Submitted',
        message: 'Your documents have been submitted to administrators for review.',
      });

      setIdFile(null);
      setLicenseFile(null);
      setPreviewState(null); // Return to live DB
      await fetchStatus(false);
    } catch (err) {
      const msg = err.message || 'Failed to submit documents';
      setError(msg);
      toast.error({
        title: 'Submission Failed',
        message: msg,
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Active status: Either dev preview override (dev server only) or live status
  const isDevPreview = import.meta.env.DEV;
  const liveStatus = status?.verification_status || profile?.verification_status || 'unverified';
  const activeStatus = isDevPreview && previewState !== null ? previewState : liveStatus;

  const isApproved = activeStatus === 'approved';
  const isRejected = activeStatus === 'rejected';
  const isPending = activeStatus === 'pending';
  const isUnverified = !isApproved && !isRejected && !isPending;

  const isOwner = role === ROLES.OWNER || requireLicense;

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : isOwner
    ? 'LL'
    : 'ST';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-ateneo-blue relative">
      {/* Background Decorative Mesh & Watermark */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="absolute top-1/2 -left-40 h-96 w-96 rounded-full bg-indigo-100/50 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-amber-100/40 blur-3xl" />
      </div>

      {/* Top Navigation Bar with Logo & Single Clean Sign Out CTA */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" subtitle="Identity & Verification" />
          </div>

          {/* User Profile Pill & Sign Out CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/80">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ateneo-blue font-bold text-white text-xs shadow-xs">
                {initials}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-800 leading-none">
                  {profile?.full_name || 'User Account'}
                </p>
                <p className="text-[10px] text-slate-500 font-medium capitalize mt-0.5 leading-none">
                  {isOwner ? 'Property Owner' : 'Ateneo Student'}
                </p>
              </div>
            </div>

            {/* Persistent Top Navigation Sign Out Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="bg-white border-slate-300 text-slate-700 hover:text-red-600 hover:border-red-300 hover:bg-red-50 text-xs font-semibold transition-all gap-1.5 shadow-2xs"
            >
              <LogOut className="h-3.5 w-3.5 text-slate-500 group-hover:text-red-500" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">
          {/* SCENARIO 1: PENDING / WAITING FOR ADMIN REVIEW */}
          {isPending && (
            <div className="space-y-6">
              {/* Header Hero Card */}
              <div className="rounded-3xl border border-amber-200/80 bg-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 ring-8 ring-amber-50">
                    <Clock className="h-7 w-7 animate-pulse" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                        Verification in Progress
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        Ateneo DormSafe Admin Queue
                      </span>
                    </div>

                    <h1 className="mt-2 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {title || (isOwner ? 'Owner Verification Under Review' : 'Student ID Under Review')}
                    </h1>

                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {subtitle ||
                        'Your submitted credentials and documentation have been received and are currently queued for administrator safety review. Verification is typically completed within 12–24 hours.'}
                    </p>
                  </div>
                </div>

                {/* Account Details Breakdown */}
                <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                  <h2 className="text-xs font-semibold text-slate-600 mb-3 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                    <span>Submission summary</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500">
                        <User className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-medium">Applicant Name</p>
                        <p className="font-semibold text-slate-800 truncate">{profile?.full_name || '—'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500">
                        <Mail className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-medium">Account Email</p>
                        <p className="font-semibold text-slate-800 truncate">{profile?.email || '—'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500">
                        {isOwner ? (
                          <Building className="h-4 w-4 text-indigo-600" />
                        ) : (
                          <GraduationCap className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-medium">Account Role</p>
                        <p className="font-semibold text-slate-800">
                          {isOwner ? 'Property Owner / Landlord' : 'Ateneo Student Tenant'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500">
                        <Shield className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-medium">Verification State</p>
                        <Badge variant="pending" size="sm">Pending Admin Approval</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3-Step Verification Pipeline */}
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <h2 className="text-xs font-semibold text-slate-600 mb-4">
                    Verification pipeline
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-emerald-900">1. Documents Sent</p>
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          ID & permits uploaded
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 ring-1 ring-amber-200/50">
                      <Clock className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5 animate-spin" />
                      <div>
                        <p className="text-xs font-bold text-amber-900">2. Admin Review</p>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          Safety clearance in progress
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3 opacity-60">
                      <Shield className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-slate-700">3. Portal Access</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Unlocks upon approval
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Controls Leaning to the Right Side */}
                <div className="mt-8 flex items-center justify-end pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => fetchStatus(true)}
                    isLoading={refreshing}
                    className="w-full sm:w-auto h-11 px-6 text-xs font-bold gap-2 text-white bg-ateneo-blue hover:bg-blue-900 shadow-md shadow-blue-900/10"
                  >
                    <RefreshCw className={`h-4 w-4 text-white ${refreshing ? 'animate-spin' : ''}`} />
                    <span>Check Verification Status</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* SCENARIO 2: VERIFIED & APPROVED */}
          {isApproved && (
            <div className="rounded-3xl border border-emerald-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-8 ring-emerald-50">
                  <ShieldCheck className="h-8 w-8" />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Account Officially Verified
                  </span>

                  <h1 className="mt-2 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Welcome to Ateneo DormSafe!
                  </h1>

                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Your credentials have been validated by the Ateneo DormSafe administration team. You have full access to search dorms, manage leases, and use all verified platform tools.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 sm:p-5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Clearance Active & Operational</span>
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  All security verifications, background checks, and directory listings are unlocked for your profile.
                </p>
              </div>

              {/* Enter Dashboard Button leaning to the right side */}
              <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleGoToDashboard}
                  className="w-full sm:w-auto h-11 px-6 text-xs font-bold gap-2 text-white bg-ateneo-blue hover:bg-blue-900 shadow-md shadow-blue-900/10"
                >
                  <span>{isOwner ? 'Enter Owner Dashboard' : 'Explore Housing Listings'}</span>
                  <ArrowRight className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>
          )}

          {/* SCENARIO 3: REJECTED (ACTION REQUIRED / RESUBMISSION) */}
          {isRejected && (
            <div className="rounded-3xl border border-red-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 ring-8 ring-red-50">
                  <ShieldAlert className="h-8 w-8" />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                    Action Required
                  </span>

                  <h1 className="mt-2 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Verification Needs Attention
                  </h1>

                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Your previous submission was not approved by the administrator. Please review the feedback below and upload updated, legible documents.
                  </p>
                </div>
              </div>

              {/* Admin Feedback Box */}
              <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 sm:p-5">
                <p className="text-xs font-bold text-red-900 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                  <span>Administrator Feedback:</span>
                </p>
                <p className="text-xs text-red-700 leading-relaxed">
                  {status?.latest?.notes ||
                    'The uploaded document photo was blurry or unreadable. Please provide a clear, full-frame copy of your valid ID.'}
                </p>
              </div>

              {/* Resubmission Form */}
              <form onSubmit={handleResubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Valid Government / School ID Photo
                  </label>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
                    <input
                      type="file"
                      accept={IMAGE_ACCEPT}
                      onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                      required
                      className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-ateneo-blue file:px-3.5 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:opacity-90 cursor-pointer"
                    />
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Required for identity verification. {IMAGE_SIZE_HINT}.</span>
                      {idFile && (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                          <FileCheck className="h-3.5 w-3.5" />
                          Selected
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {(requireLicense || isOwner) && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Business Permit / Mayor's Permit / DTI
                    </label>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
                      <input
                        type="file"
                        accept={IMAGE_ACCEPT}
                        onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                        required
                        className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-ateneo-blue file:px-3.5 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:opacity-90 cursor-pointer"
                      />
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Required for property owner verification. {IMAGE_SIZE_HINT}.</span>
                        {licenseFile && (
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                            <FileCheck className="h-3.5 w-3.5" />
                            Selected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {message && (
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{message}</span>
                  </div>
                )}

                {/* Resubmit button leaning right */}
                <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={submitting}
                    className="w-full sm:w-auto h-11 px-6 text-xs font-bold gap-2 text-white bg-ateneo-blue hover:bg-blue-900 shadow-md shadow-blue-900/10"
                  >
                    <UploadCloud className="h-4 w-4 text-white" />
                    <span>{submitting ? 'Uploading Documents…' : 'Resubmit Documents for Review'}</span>
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* SCENARIO 4: INITIAL SUBMISSION / UNVERIFIED */}
          {isUnverified && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-ateneo-blue ring-8 ring-blue-50">
                  <Shield className="h-8 w-8" />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-ateneo-blue">
                    <Shield className="h-3.5 w-3.5 text-ateneo-blue" />
                    Account Verification Required
                  </span>

                  <h1 className="mt-2 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Submit Verification Documents
                  </h1>

                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    To maintain safety and compliance on Ateneo DormSafe, please upload your valid identity credentials for administrator approval.
                  </p>
                </div>
              </div>

              {/* Initial Submission Form */}
              <form onSubmit={handleResubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Valid Government / School ID Photo
                  </label>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
                    <input
                      type="file"
                      accept={IMAGE_ACCEPT}
                      onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                      required
                      className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-ateneo-blue file:px-3.5 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:opacity-90 cursor-pointer"
                    />
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Required for identity verification. {IMAGE_SIZE_HINT}.</span>
                      {idFile && (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                          <FileCheck className="h-3.5 w-3.5" />
                          Selected
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {(requireLicense || isOwner) && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Business Permit / Mayor's Permit / DTI
                    </label>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
                      <input
                        type="file"
                        accept={IMAGE_ACCEPT}
                        onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                        required
                        className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-ateneo-blue file:px-3.5 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:opacity-90 cursor-pointer"
                      />
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Required for property owner verification. {IMAGE_SIZE_HINT}.</span>
                        {licenseFile && (
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                            <FileCheck className="h-3.5 w-3.5" />
                            Selected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {message && (
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{message}</span>
                  </div>
                )}

                <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={submitting}
                    className="w-full sm:w-auto h-11 px-6 text-xs font-bold gap-2 text-white bg-ateneo-blue hover:bg-blue-900 shadow-md shadow-blue-900/10"
                  >
                    <UploadCloud className="h-4 w-4 text-white" />
                    <span>{submitting ? 'Submitting Documents…' : 'Submit Documents for Review'}</span>
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Quick Scenario Tester Pill (dev server only - never shipped to production) */}
          {isDevPreview && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-1.5 p-2 rounded-2xl bg-slate-200/60 border border-slate-300/60 text-xs text-slate-600">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Sliders className="h-3 w-3" />
              <span>Preview State:</span>
            </span>
            <button
              type="button"
              onClick={() => setPreviewState(null)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                previewState === null
                  ? 'bg-ateneo-blue text-white shadow-2xs'
                  : 'bg-white/80 text-slate-600 hover:bg-white'
              }`}
            >
              Live ({liveStatus})
            </button>
            <button
              type="button"
              onClick={() => setPreviewState('approved')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                previewState === 'approved'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white/80 text-slate-600 hover:bg-white'
              }`}
            >
              Verified
            </button>
            <button
              type="button"
              onClick={() => setPreviewState('pending')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                previewState === 'pending'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white/80 text-slate-600 hover:bg-white'
              }`}
            >
              Waiting / Pending
            </button>
            <button
              type="button"
              onClick={() => setPreviewState('rejected')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                previewState === 'rejected'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'bg-white/80 text-slate-600 hover:bg-white'
              }`}
            >
              Rejected
            </button>
            <button
              type="button"
              onClick={() => setPreviewState('unverified')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                previewState === 'unverified'
                  ? 'bg-slate-700 text-white shadow-2xs'
                  : 'bg-white/80 text-slate-600 hover:bg-white'
              }`}
            >
              Initial Upload
            </button>
          </div>
          )}
        </div>
      </main>
    </div>
  );
}
