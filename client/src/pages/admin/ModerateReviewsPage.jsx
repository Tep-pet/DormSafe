import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';
import { adminService } from '../../services/adminService';

export function ModerateReviewsPage() {
  const { accessToken } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [r, rep] = await Promise.all([
      adminService.getPendingReviews(accessToken),
      adminService.getPendingReports(accessToken),
    ]);
    setReviews(r.data || []);
    setReports(rep.data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [accessToken]);

  async function moderate(id, status) {
    await adminService.moderateReview(id, status, accessToken);
    load();
  }

  async function dismissReport(id) {
    await adminService.dismissReport(id, accessToken);
    load();
  }

  return (
    <AdminLayout title="Reviews & Reports" subtitle="Moderate student reviews and listing reports">
      {loading ? (
        <Loader />
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="font-semibold">Pending reviews</h2>
            {reviews.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No reviews awaiting moderation.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {reviews.map((rev) => (
                  <li key={rev.id} className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
                    <p className="font-medium">{rev.properties?.name}</p>
                    <p className="text-gray-600">{rev.profiles?.full_name} · {'★'.repeat(rev.rating)}</p>
                    <p className="mt-1">{rev.comment || '(no comment)'}</p>
                    <div className="mt-2 flex gap-2">
                      <Button onClick={() => moderate(rev.id, 'approved')}>Approve</Button>
                      <Button variant="secondary" onClick={() => moderate(rev.id, 'rejected')}>
                        Reject
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="font-semibold">Listing reports</h2>
            {reports.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No pending reports.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {reports.map((rep) => (
                  <li key={rep.id} className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
                    <p className="font-medium">{rep.properties?.name}</p>
                    <p className="text-gray-500">Reported by {rep.profiles?.full_name}</p>
                    <p className="mt-1">{rep.reason}</p>
                    <Button className="mt-2" variant="secondary" onClick={() => dismissReport(rep.id)}>
                      Mark reviewed
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </AdminLayout>
  );
}
