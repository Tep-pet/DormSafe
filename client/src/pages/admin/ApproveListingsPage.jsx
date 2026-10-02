import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { useAuth } from '../../hooks/useAuth';
import { adminService } from '../../services/adminService';
import { PROPERTY_TYPE_LABELS } from '../../constants/propertyTypes';
export function ApproveListingsPage() {
  const { accessToken } = useAuth();
  const [listings, setListings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    sort: 'desc',
    status: 'pending',
    propertyId: '',
    dateFrom: '',
    dateTo: '',
  });
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    setSelected([]);
  }, [filters.page, filters.status]);

  useEffect(() => {
    adminService.getAllProperties(accessToken).then((res) => setProperties(res.data || []));
  }, [accessToken]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getPendingListings(accessToken, filters);
      setListings(res.data?.items || []);
      setTotalPages(res.data?.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters]);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(id) {
    await adminService.approveListing(id, accessToken);
    load();
  }

  async function reject(id) {
    await adminService.rejectListing(id, accessToken);
    load();
  }

  function toggleSelect(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function bulkAction(action) {
    if (!selected.length) return;
    await adminService.bulkListings(selected, action, accessToken);
    setSelected([]);
    load();
  }

  return (
    <AdminLayout title="Approve Listings" subtitle="Review pending, approved, and rejected listings (5 per page)">
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
            <option value="rejected">Rejected / Denied</option>
            <option value="all">All</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Dorm / Property</label>
          <select
            value={filters.propertyId}
            onChange={(e) => setFilters((f) => ({ ...f, propertyId: e.target.value, page: 1 }))}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">All properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.status})
              </option>
            ))}
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
          <Button onClick={() => bulkAction('approve')}>Approve selected ({selected.length})</Button>
          <Button variant="danger" onClick={() => bulkAction('reject')}>Reject selected</Button>
        </div>
      )}

      {loading ? (
        <PageSkeleton variant="table" rows={5} cols={4} />
      ) : listings.length === 0 ? (
        <p className="text-sm text-gray-600">No listings match your filters.</p>
      ) : (
        <div className="grid gap-4">
          {listings.map((p) => {
            const badgeVariant =
              p.status === 'approved' ? 'verified' : p.status === 'rejected' ? 'danger' : 'pending';
            return (
            <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-3">
                  {p.status === 'pending' && filters.status === 'pending' && (
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="mt-1"
                    />
                  )}
                  <div>
                  <Link
                    to={`/admin/listings/${p.id}`}
                    className="font-semibold text-ateneo-blue hover:underline"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-gray-500">{PROPERTY_TYPE_LABELS[p.type]}</p>
                  <p className="mt-1 text-sm text-gray-600">{p.address}</p>
                  <Link
                    to={`/admin/listings/${p.id}`}
                    className="mt-1 inline-block text-xs text-ateneo-blue hover:underline"
                  >
                    View listing details & documents →
                  </Link>
                  </div>
                </div>
                <Badge variant={badgeVariant}>{p.status}</Badge>
              </div>
              {p.profiles && (
                <p className="mt-2 text-sm text-gray-500">
                  Owner: {p.profiles.full_name} ({p.profiles.email})
                </p>
              )}
              {p.status === 'pending' && (
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => approve(p.id)}>Approve</Button>
                  <Button variant="danger" onClick={() => reject(p.id)}>Reject</Button>
                </div>
              )}
            </div>
          );
          })}
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
    </AdminLayout>
  );
}
