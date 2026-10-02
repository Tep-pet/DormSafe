import { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { DocumentViewer } from '../../components/common/DocumentViewer';
import { useAuth } from '../../hooks/useAuth';
import { adminService } from '../../services/adminService';
import { ROLE_LABELS } from '../../constants/roles';

export function VerifyAccountsPage() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    status: 'pending',
    sort: 'desc',
    role: '',
    dateFrom: '',
    dateTo: '',
  });
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    setSelected([]);
  }, [filters.page, filters.status]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getAccountVerifications(accessToken, filters);
      setItems(res.data?.items || []);
      setTotalPages(res.data?.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters]);

  useEffect(() => {
    load();
  }, [load]);

  async function review(id, status) {
    const notes = status === 'rejected' ? window.prompt('Rejection reason (optional):') : '';
    await adminService.reviewAccountVerification(id, { status, notes: notes || null }, accessToken);
    load();
  }

  async function viewDocs(id, name) {
    const res = await adminService.getVerificationDocuments(id, accessToken);
    setDocs({ title: name, ...res.data });
  }

  function toggleSelect(userId) {
    setSelected((prev) => (prev.includes(userId) ? prev.filter((x) => x !== userId) : [...prev, userId]));
  }

  async function bulkReview(status) {
    if (!selected.length) return;
    const notes = status === 'rejected' ? window.prompt('Rejection reason (optional):') : '';
    await adminService.bulkAccounts(selected, status, notes || null, accessToken);
    setSelected([]);
    load();
  }

  return (
    <AdminLayout title="Verify Accounts" subtitle="Review student and owner ID submissions">
      <div className="mb-4 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Role</label>
          <select
            value={filters.role}
            onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value, page: 1 }))}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">All roles</option>
            <option value="student">Student</option>
            <option value="owner">Owner</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">From date</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value, page: 1 }))}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">To date</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value, page: 1 }))}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Sort</label>
          <select
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value, page: 1 }))}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>
      </div>

      {filters.status === 'pending' && selected.length > 0 && (
        <div className="mb-4 flex gap-2">
          <Button onClick={() => bulkReview('approved')}>Approve selected ({selected.length})</Button>
          <Button variant="danger" onClick={() => bulkReview('rejected')}>Reject selected</Button>
        </div>
      )}

      {loading ? (
        <PageSkeleton variant="table" rows={6} cols={5} />
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-600">No applications match your filters.</p>
      ) : (
        <div className="grid gap-4">
          {items.map((v) => (
            <div key={v.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-3">
                  {v.status === 'pending' && filters.status === 'pending' && v.profiles?.id && (
                    <input
                      type="checkbox"
                      checked={selected.includes(v.profiles.id)}
                      onChange={() => toggleSelect(v.profiles.id)}
                      className="mt-1"
                    />
                  )}
                  <div>
                  <p className="font-semibold">{v.profiles?.full_name}</p>
                  <p className="text-sm text-gray-600">{v.profiles?.email}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {ROLE_LABELS[v.profiles?.role] || v.profiles?.role} ·{' '}
                    {new Date(v.created_at).toLocaleString()}
                  </p>
                  </div>
                </div>
                <Badge variant={v.status === 'approved' ? 'verified' : v.status === 'rejected' ? 'danger' : 'pending'}>
                  {v.status}
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => viewDocs(v.id, v.profiles?.full_name)}>
                  View documents
                </Button>
                {v.status === 'pending' && (
                  <>
                    <Button onClick={() => review(v.id, 'approved')}>Approve</Button>
                    <Button variant="danger" onClick={() => review(v.id, 'rejected')}>
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            disabled={filters.page <= 1}
            onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {filters.page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            disabled={filters.page >= totalPages}
            onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
          >
            Next
          </Button>
        </div>
      )}

      {docs && (
        <DocumentViewer
          title={docs.title}
          idUrl={docs.id_url}
          licenseUrl={docs.license_url}
          onClose={() => setDocs(null)}
        />
      )}
    </AdminLayout>
  );
}
