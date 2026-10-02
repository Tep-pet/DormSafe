import { useEffect, useState } from 'react';
import { OwnerLayout } from '../../components/layout/OwnerLayout';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { useAuth } from '../../hooks/useAuth';
import { useOwnerProperty } from '../../context/OwnerPropertyContext';
import { tenantService } from '../../services/tenantService';
import { formatPropertyRoom } from '../../utils/formatPropertyRoom';

const emptyForm = {
  property_id: '',
  room_id: '',
  tenant_name: '',
  student_email: '',
  contact: '',
  move_in_date: '',
  move_out_date: '',
};

export function ManageTenantsPage() {
  const { accessToken } = useAuth();
  const { properties, filterPropertyId } = useOwnerProperty();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);

  const selectedProperty = properties.find((p) => p.id === form.property_id);
  const rooms = selectedProperty?.rooms || [];

  async function load() {
    setLoading(true);
    const t = await tenantService.list(accessToken, filterPropertyId);
    setTenants(t.data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [accessToken, filterPropertyId]);

  useEffect(() => {
    if (filterPropertyId) {
      setForm((prev) => ({ ...prev, property_id: filterPropertyId }));
    }
  }, [filterPropertyId]);

  async function handleAdd(e) {
    e.preventDefault();
    await tenantService.create(form, accessToken);
    setForm({ ...emptyForm, property_id: filterPropertyId || '' });
    load();
  }

  const formProperties = filterPropertyId
    ? properties.filter((p) => p.id === filterPropertyId)
    : properties;

  return (
    <OwnerLayout title="Manage Tenants" subtitle="Digital ledger for tenant records">
      <form onSubmit={handleAdd} className="mb-6 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Property</label>
          <select
            required
            value={form.property_id}
            onChange={(e) => setForm({ ...form, property_id: e.target.value, room_id: '' })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            disabled={!!filterPropertyId}
          >
            <option value="">Select property</option>
            {formProperties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Room</label>
          <select
            value={form.room_id}
            onChange={(e) => setForm({ ...form, room_id: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Select room (optional)</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.label || r.id.slice(0, 8)} — ₱{r.price}</option>
            ))}
          </select>
        </div>
        <Input label="Tenant Name" value={form.tenant_name} onChange={(e) => setForm({ ...form, tenant_name: e.target.value })} required />
        <Input label="Student Email (invite to confirm stay)" value={form.student_email} onChange={(e) => setForm({ ...form, student_email: e.target.value })} placeholder="student@email.com" />
        <p className="sm:col-span-2 text-xs text-gray-500">
          If the student has a DormSafe account, they receive a notification to confirm their move-out date.
        </p>
        <Input label="Contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        <Input label="Move-in Date" type="date" value={form.move_in_date} onChange={(e) => setForm({ ...form, move_in_date: e.target.value })} />
        <Input label="Move-out Date (stay end)" type="date" value={form.move_out_date} onChange={(e) => setForm({ ...form, move_out_date: e.target.value })} required={!!form.room_id} />
        <div className="sm:col-span-2"><Button type="submit">Add Tenant</Button></div>
      </form>

      {loading ? <PageSkeleton variant="table" rows={6} cols={6} /> : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Property / Room</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Move-in</th>
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
                  <td className="px-4 py-3">{t.move_in_date || '—'}</td>
                  <td className="px-4 py-3">{t.move_out_date || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${t.is_active ? 'bg-red-100 text-red-800' : t.is_expired ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-800'}`}>
                      {t.is_active ? 'Active' : t.is_expired ? 'Expired' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="danger"
                      onClick={async () => {
                        if (window.confirm(`Remove ${t.tenant_name}?`)) {
                          await tenantService.remove(t.id, accessToken);
                          load();
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </OwnerLayout>
  );
}
