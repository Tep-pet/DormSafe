import { useEffect, useState } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../services/apiClient';
import { validateImageFile } from '../../utils/validateImage';
import { IMAGE_SIZE_HINT } from '../../constants/uploadLimits';

export function AccountVerificationPage({ title, subtitle, requireLicense = false, bare = false }) {
  const { accessToken, profile } = useAuth();
  const [idFile, setIdFile] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get('/api/auth/verification/status', accessToken)
      .then((res) => setStatus(res.data))
      .catch(() => {});
  }, [accessToken]);

  async function handleResubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    const idErr = validateImageFile(idFile, 'ID photo');
    if (idErr) return setError(idErr);
    if (requireLicense) {
      const licErr = validateImageFile(licenseFile, 'Business license/permit');
      if (licErr) return setError(licErr);
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('idDocument', idFile);
      if (licenseFile) formData.append('licenseDocument', licenseFile);
      await apiClient.upload('/api/auth/verification/resubmit', formData, accessToken);
      setMessage('Documents resubmitted. An admin will review them.');
      setIdFile(null);
      setLicenseFile(null);
      const res = await apiClient.get('/api/auth/verification/status', accessToken);
      setStatus(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const verificationStatus = status?.verification_status || profile?.verification_status;
  const isApproved = verificationStatus === 'approved';
  const isRejected = verificationStatus === 'rejected';
  const isPending = verificationStatus === 'pending';

  const inner = (
    <div className="max-w-md space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Status:</span>
          <Badge variant={isApproved ? 'verified' : isRejected ? 'danger' : 'pending'}>
            {verificationStatus || 'unknown'}
          </Badge>
        </div>

        {isApproved && (
          <p className="text-sm text-green-700">
            Your account is verified. You can use all DormSafe features.{' '}
            <a href="/" className="font-medium text-ateneo-blue hover:underline">
              Go to dashboard
            </a>
          </p>
        )}

        {isPending && (
          <p className="text-sm text-amber-700">
            Your documents are being reviewed. You will get a notification when approved.
          </p>
        )}

        {!isApproved && !isPending && !isRejected && (
          <p className="text-sm text-gray-600">
            Upload your documents during registration, or wait for an admin to review your account.
          </p>
        )}

        {isRejected && (
          <>
            <p className="text-sm text-red-600">
              Your verification was rejected.
              {status?.latest?.notes ? ` Reason: ${status.latest.notes}` : ' Please upload clearer documents.'}
            </p>
            <form onSubmit={handleResubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Valid ID photo</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Required for verification. {IMAGE_SIZE_HINT}.</p>
              </div>
              {requireLicense && (
                <div>
                  <label className="mb-1 block text-sm font-medium">Business license / permit</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Required for property owners. {IMAGE_SIZE_HINT}.
                  </p>
                </div>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
              {message && <p className="text-sm text-green-700">{message}</p>}
              <Button type="submit" disabled={loading}>
                {loading ? 'Uploading…' : 'Resubmit documents'}
              </Button>
            </form>
          </>
        )}
      </div>
  );

  if (bare) return inner;
  return (
    <PageContainer title={title} subtitle={subtitle}>
      {inner}
    </PageContainer>
  );
}
