import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { useAuth } from '../../hooks/useAuth';
import { adminService } from '../../services/adminService';
import { formatPropertyRoom } from '../../utils/formatPropertyRoom';

export function AdminManageTenantsPage() {
  const { accessToken } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await adminService.getTenants(accessToken);
      setTenants(res.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [accessToken]);

  async function handleRemove(id, name) {
    if (!window.confirm(`Remove tenant record for ${name}? The room will become vacant.`)) return;
    await adminService.removeTenant(id, accessToken);
    load();
  }

  return (
    <AdminLayout
      title="Manage Tenants"
      subtitle="View all tenant records across campus properties. Expired stays free the room automatically."
    >
      {loading ? (
        <PageSkeleton variant="table" rows={6} cols={6} />
      ) : tenants.length === 0 ? (
        <p className="text-sm text-gray-600">No tenant records.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Property / Room</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Move-out</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3">{t.tenant_name}</td>
                  <td className="px-4 py-3">
                    {formatPropertyRoom(t.properties?.name, t.rooms?.label)}
                    {!t.room_id && ' · (room released)'}
                  </td>
                  <td className="px-4 py-3">{t.profiles?.email || '—'}</td>
                  <td className="px-4 py-3">{t.move_out_date || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={t.is_active ? 'occupied' : t.is_expired ? 'default' : 'vacant'}>
                      {t.is_active ? 'Active' : t.is_expired ? 'Expired' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="danger" onClick={() => handleRemove(t.id, t.tenant_name)}>
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
