import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { OwnerLayout } from '../../components/layout/OwnerLayout';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { useAuth } from '../../hooks/useAuth';
import { propertyService } from '../../services/propertyService';
import { ROUTES } from '../../constants/routes';

export function EditPropertyPage() {
  const { id } = useParams();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    contact_name: '',
    contact_phone: '',
    house_rules: [''],
    rooms: [],
  });

  useEffect(() => {
    propertyService.getProperty(id, accessToken).then((res) => {
      const p = res.data;
      setForm({
        name: p.name || '',
        description: p.description || '',
        address: p.address || '',
        contact_name: p.contact_name || '',
        contact_phone: p.contact_phone || '',
        house_rules: p.house_rules?.length ? p.house_rules.map((r) => r.rule) : [''],
        rooms: (p.rooms || []).map((r) => ({
          id: r.id,
          label: r.label || '',
          price: r.price,
          capacity: r.capacity,
        })),
      });
      setLoading(false);
    });
  }, [id, accessToken]);

  function updateRoom(index, field, value) {
    setForm((prev) => {
      const rooms = [...prev.rooms];
      rooms[index] = { ...rooms[index], [field]: value };
      return { ...prev, rooms };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await propertyService.updateProperty(
        id,
        {
          ...form,
          house_rules: form.house_rules.filter(Boolean),
          rooms: form.rooms.map((r) => ({
            ...r,
            price: Number(r.price),
            capacity: Number(r.capacity) || 1,
          })),
        },
        accessToken
      );
      navigate(ROUTES.OWNER_LISTINGS);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <OwnerLayout title="Edit Listing" subtitle="Update price, contact, and rules without resubmitting">
      {loading ? (
        <PageSkeleton variant="form" />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            rows={4}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Contact name" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
          <Input label="Contact phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
        </div>

        <section>
          <h3 className="font-medium">Rooms</h3>
          <ul className="mt-2 space-y-3">
            {form.rooms.map((room, i) => (
              <li key={room.id} className="grid gap-2 rounded-lg border border-gray-100 p-3 sm:grid-cols-3">
                <Input label="Label" value={room.label} onChange={(e) => updateRoom(i, 'label', e.target.value)} />
                <Input label="Price/mo" type="number" value={room.price} onChange={(e) => updateRoom(i, 'price', e.target.value)} />
                <Input label="Capacity" type="number" value={room.capacity} onChange={(e) => updateRoom(i, 'capacity', e.target.value)} />
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="font-medium">House rules</h3>
          {form.house_rules.map((rule, i) => (
            <Input
              key={i}
              className="mt-2"
              value={rule}
              onChange={(e) => {
                const rules = [...form.house_rules];
                rules[i] = e.target.value;
                setForm({ ...form, house_rules: rules });
              }}
              placeholder={`Rule ${i + 1}`}
            />
          ))}
          <Button type="button" variant="ghost" className="mt-2" onClick={() => setForm({ ...form, house_rules: [...form.house_rules, ''] })}>
            + Add rule
          </Button>
        </section>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate(ROUTES.OWNER_LISTINGS)}>
            Cancel
          </Button>
        </div>
      </form>
      )}
    </OwnerLayout>
  );
}
