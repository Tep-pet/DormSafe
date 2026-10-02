import { useEffect, useState } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { useAuth } from '../../hooks/useAuth';
import { adminService } from '../../services/adminService';

export function VerifyOwnersPage() {
  const { accessToken } = useAuth();
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await adminService.getPendingVerifications(accessToken);
      setVerifications(res.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [accessToken]);

  async function review(id, status) {
    await adminService.reviewVerification(id, { status }, accessToken);
    load();
  }

  return (
    <PageContainer title="Verify Owners" subtitle="Review business permit submissions">
      {loading ? (
        <PageSkeleton variant="table" rows={5} cols={4} />
      ) : verifications.length === 0 ? (
        <p className="text-sm text-gray-600">No pending verifications.</p>
      ) : (
        <div className="grid gap-4">
          {verifications.map((v) => (
            <div key={v.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="font-semibold">{v.profiles?.full_name}</p>
              <p className="text-sm text-gray-600">{v.profiles?.email}</p>
              <p className="mt-1 text-xs text-gray-500">Submitted {new Date(v.created_at).toLocaleDateString()}</p>
              <Badge variant="pending" className="mt-2">{v.status}</Badge>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => review(v.id, 'approved')}>Approve</Button>
                <Button variant="danger" onClick={() => review(v.id, 'rejected')}>Reject</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
