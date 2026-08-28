import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OwnerLayout } from '../../components/layout/OwnerLayout';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS } from '../../constants/propertyTypes';
import { RoomPhotoUploader } from '../../components/property/RoomPhotoUploader';
import { useAuth } from '../../hooks/useAuth';
import { propertyService } from '../../services/propertyService';

export function AddPropertyPage() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [roomPhotos, setRoomPhotos] = useState([]);
  const [form, setForm] = useState({
    name: '',
    type: PROPERTY_TYPES.BOARDING_HOUSE,
    address: '',
    description: '',
    contact_name: '',
    contact_phone: '',
    roomLabel: '',
    roomPrice: '',
    capacity: '1',
    houseRules: '',
  });

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const house_rules = form.houseRules
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean);

      const res = await propertyService.createProperty(
        {
          name: form.name,
          type: form.type,
          address: form.address,
          description: form.description,
          contact_name: form.contact_name || null,
          contact_phone: form.contact_phone || null,
          rooms: [
            {
              label: form.roomLabel || 'Room 1',
              price: Number(form.roomPrice),
              capacity: Number(form.capacity) || 1,
              is_available: true,
            },
          ],
          house_rules,
        },
        accessToken
      );

      const roomId = res.data?.rooms?.[0]?.id;
      if (roomPhotos.length && roomId) {
        await propertyService.uploadRoomImages(
          roomId,
          roomPhotos.map((p) => p.file),
          accessToken
        );
      }

      navigate('/owner/listings');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <OwnerLayout title="Add Property" subtitle="Submit a listing for admin verification">
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <Input id="name" label="Property Name" value={form.name} onChange={update('name')} required />
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
          <select
            value={form.type}
            onChange={update('type')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {Object.values(PROPERTY_TYPES).map((t) => (
              <option key={t} value={t}>{PROPERTY_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <Input id="address" label="Address" value={form.address} onChange={update('address')} required />
        <Input id="description" label="Description / Features" value={form.description} onChange={update('description')} />
        <Input id="contact_name" label="Contact Name (for student inquiries)" value={form.contact_name} onChange={update('contact_name')} />
        <Input id="contact_phone" label="Contact Phone" value={form.contact_phone} onChange={update('contact_phone')} placeholder="09XXXXXXXXX" />
        <Input id="roomLabel" label="Room Label" value={form.roomLabel} onChange={update('roomLabel')} placeholder="e.g. Room 1104" />
        <Input id="roomPrice" label="Monthly Price (₱)" type="number" min="0" value={form.roomPrice} onChange={update('roomPrice')} required />
        <Input id="capacity" label="Capacity" type="number" min="1" value={form.capacity} onChange={update('capacity')} />
        <RoomPhotoUploader photos={roomPhotos} onChange={setRoomPhotos} />
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">House Rules (one per line)</label>
          <textarea
            value={form.houseRules}
            onChange={update('houseRules')}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="No pets&#10;Quiet hours 10pm - 7am"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading}>{loading ? 'Submitting…' : 'Submit for Approval'}</Button>
      </form>
    </OwnerLayout>
  );
}
