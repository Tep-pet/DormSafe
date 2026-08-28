import { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';
import { adminService } from '../../services/adminService';

function formatAuditDetails(details) {
  if (!details || typeof details !== 'object') return null;
  const parts = [];
  if (details.name) parts.push(`Listing: ${details.name}`);
  if (details.notes) parts.push(`Notes: ${details.notes}`);
  if (details.bulk) parts.push('Bulk action');
  return parts.length ? parts.join(' · ') : null;
}

export function AdminAuditPage() {
  const { accessToken } = useAuth();
  const [result, setResult] = useState({ items: [], totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getAuditLogs(accessToken, page);
      setResult(res.data || { items: [], totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [accessToken, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminLayout title="Audit Log" subtitle="Who approved or rejected accounts and listings">
      {loading ? (
        <Loader />
      ) : (
        <>
          <ul className="divide-y rounded-xl border border-gray-200 bg-white text-sm">
            {(result.items || []).map((row) => {
              const detailText = formatAuditDetails(row.details);
              return (
              <li key={row.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium capitalize">{row.action.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-gray-500">{new Date(row.created_at).toLocaleString()}</span>
                </div>
                <p className="text-gray-600">
                  {row.profiles?.full_name || row.profiles?.email} · {row.entity_type}
                  {row.entity_id ? ` · ${row.entity_id.slice(0, 8)}…` : ''}
                </p>
                {detailText && (
                  <p className="mt-1 text-xs text-gray-500">{detailText}</p>
                )}
              </li>
            );
            })}
          </ul>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="self-center text-sm text-gray-600">
              Page {page} of {result.totalPages || 1}
            </span>
            <Button
              variant="secondary"
              disabled={page >= (result.totalPages || 1)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
