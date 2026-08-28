import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Loader } from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';
import { adminService } from '../../services/adminService';
import { formatPrice } from '../../utils/formatPrice';

function StatCard({ label, value, tone = 'default' }) {
  const tones = {
    default: 'border-gray-200',
    pending: 'border-amber-200 bg-amber-50',
    success: 'border-green-200 bg-green-50',
    danger: 'border-red-200 bg-red-50',
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone] || tones.default}`}>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

export function AdminDashboardPage() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [campus, setCampus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminService.getDashboardStats(accessToken),
      adminService.getSystemHealth(accessToken),
      adminService.getCampusStats(accessToken),
    ]).then(([s, h, c]) => {
      setStats(s.data);
      setHealth(h.data);
      setCampus(c.data);
      setLoading(false);
    });
  }, [accessToken]);

  return (
    <AdminLayout
      title="Admin Dashboard"
      subtitle="Overview, system health, and campus-wide stats"
    >
      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 font-semibold">System health</h2>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <StatCard label="Pending listings" value={health?.pending_listings ?? 0} tone="pending" />
              <StatCard label="Pending accounts" value={health?.pending_accounts ?? 0} tone="pending" />
              <StatCard label="Pending reviews" value={health?.pending_reviews ?? 0} tone="pending" />
              <StatCard label="Pending reports" value={health?.pending_reports ?? 0} tone="pending" />
              <StatCard label="Expired stays uncleared" value={health?.expired_stays_not_cleared ?? 0} tone="danger" />
              <StatCard label="Open maintenance" value={health?.open_maintenance ?? 0} tone="pending" />
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-semibold">Campus-wide stats</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {campus && Object.entries(campus).map(([gateId, g]) => (
                <div key={gateId} className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="font-semibold">{g.gate}</p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li>{g.listings} approved listings</li>
                    <li>{g.total_beds} total beds ({g.available_beds} available)</li>
                    <li>Avg price: {g.avg_price != null ? formatPrice(g.avg_price) : '—'}/mo</li>
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-semibold">Account applications</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Open for approval" value={stats.accounts.pending} tone="pending" />
              <StatCard label="Approved" value={stats.accounts.approved} tone="success" />
              <StatCard label="Rejected" value={stats.accounts.rejected} tone="danger" />
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-semibold">Listing applications</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Open for approval" value={stats.listings.pending} tone="pending" />
              <StatCard label="Approved" value={stats.listings.approved} tone="success" />
              <StatCard label="Rejected" value={stats.listings.rejected} tone="danger" />
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-semibold">Your review activity</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard label="Accounts you approved" value={stats.myReviews.approved} tone="success" />
              <StatCard label="Accounts you rejected" value={stats.myReviews.rejected} tone="danger" />
            </div>
          </section>
        </div>
      )}
    </AdminLayout>
  );
}
