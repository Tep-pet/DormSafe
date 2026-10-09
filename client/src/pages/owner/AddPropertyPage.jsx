import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Select, SelectItem, Textarea } from '@heroui/react';
import {
  Building2,
  MapPin,
  FileText,
  User,
  Phone,
  BedDouble,
  CreditCard,
  Users,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { OwnerLayout } from '../../components/layout/OwnerLayout';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS } from '../../constants/propertyTypes';
import { RoomPhotoUploader } from '../../components/property/RoomPhotoUploader';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { propertyService } from '../../services/propertyService';
import { ROUTES } from '../../constants/routes';

export function AddPropertyPage() {
  const { user, accessToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [roomPhotos, setRoomPhotos] = useState([]);
  const [form, setForm] = useState({
    name: '',
    type: PROPERTY_TYPES.BOARDING_HOUSE,
    address: '',
    description: '',
    contact_name: user?.full_name || '',
    contact_phone: '',
    contact_email: user?.email || '',
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

    if (!form.name.trim() || !form.address.trim() || !form.roomPrice) {
      setError('Please fill in all mandatory fields (Property Name, Address, and Room Price).');
      return;
    }

    setLoading(true);
    try {
      const house_rules = form.houseRules
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean);

      const res = await propertyService.createProperty(
        {
          name: form.name.trim(),
          type: form.type,
          address: form.address.trim(),
          description: form.description.trim(),
          contact_name: form.contact_name.trim() || null,
          contact_phone: form.contact_phone.trim() || null,
          contact_email: form.contact_email.trim() || null,
          rooms: [
            {
              label: form.roomLabel.trim() || 'Room 1',
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

      toast.success('Property listing submitted successfully! Pending admin verification.');
      navigate(ROUTES.OWNER_LISTINGS);
    } catch (err) {
      setError(err.message || 'Failed to submit property listing');
      toast.error(err.message || 'Failed to submit property');
    } finally {
      setLoading(false);
    }
  }

  // Header Actions
  const headerAction = (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        radius="full"
        onClick={() => navigate(ROUTES.OWNER_LISTINGS)}
        startContent={<ArrowLeft size={14} />}
      >
        Back to Listings
      </Button>
    </div>
  );

  return (
    <OwnerLayout
      title="Add New Property"
      subtitle="Register an accommodation and submit for Ateneo housing verification"
      headerAction={headerAction}
      hidePropertyFilter
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 shadow-2xs">
            <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Submission Error</p>
              <p className="mt-0.5 font-normal text-rose-600">{error}</p>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* SECTION 1: BASIC PROPERTY DETAILS */}
        {/* ==================================================================== */}
        <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 sm:p-7 shadow-xs backdrop-blur-xs space-y-5">
          <div className="border-b border-slate-200/80 pb-3 flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-ateneo-blue border border-blue-100">
              <Building2 size={15} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">1. Property Information</h2>
              <p className="text-xs text-slate-500 mt-0.5">Basic identity and physical location near Ateneo de Davao</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                id="name"
                label="Property / Establishment Name"
                placeholder="e.g. Blue Knight Student Dormitory"
                value={form.name}
                onChange={update('name')}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Housing Type
              </label>
              <Select
                aria-label="Housing Type"
                selectedKeys={[form.type]}
                onChange={update('type')}
                variant="bordered"
                size="md"
                classNames={{
                  trigger: 'border-slate-200/90 hover:border-slate-300 bg-white rounded-xl h-10 text-xs',
                  value: 'text-xs font-medium text-slate-800',
                }}
              >
                {Object.values(PROPERTY_TYPES).map((t) => (
                  <SelectItem key={t} textValue={PROPERTY_TYPE_LABELS[t] || t}>
                    {PROPERTY_TYPE_LABELS[t] || t}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div>
              <Input
                id="address"
                label="Complete Campus Address"
                placeholder="e.g. 123 Jacinto St, Poblacion District, Davao City"
                value={form.address}
                onChange={update('address')}
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Include street and landmark so students can locate it on the map.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Description & Amenities
              </label>
              <Textarea
                aria-label="Description & Amenities"
                placeholder="Highlight key amenities (e.g. High-speed WiFi, 24/7 Security, Air Conditioning, Study Lounge, Walking distance to Roxas Gate)..."
                value={form.description}
                onChange={update('description')}
                variant="bordered"
                minRows={3}
                classNames={{
                  inputWrapper: 'border-slate-200/90 hover:border-slate-300 bg-white rounded-xl text-xs',
                  input: 'text-xs text-slate-800 leading-relaxed',
                }}
              />
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SECTION 2: CONTACT INFORMATION */}
        {/* ==================================================================== */}
        <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 sm:p-7 shadow-xs backdrop-blur-xs space-y-5">
          <div className="border-b border-slate-200/80 pb-3 flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              <User size={15} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">2. Landlord & Inquiry Contact</h2>
              <p className="text-xs text-slate-500 mt-0.5">Direct contact details shown to authenticated Ateneo students</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              id="contact_name"
              label="Contact Person Name"
              placeholder="e.g. Maria Santos (Property Manager)"
              value={form.contact_name}
              onChange={update('contact_name')}
            />

            <Input
              id="contact_phone"
              label="Contact Phone / Mobile"
              placeholder="09XXXXXXXXX"
              value={form.contact_phone}
              onChange={update('contact_phone')}
            />

            <Input
              id="contact_email"
              type="email"
              label="Contact Email Address"
              placeholder="e.g. landlord@example.com"
              value={form.contact_email}
              onChange={update('contact_email')}
            />
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SECTION 3: INITIAL ROOM CONFIGURATION */}
        {/* ==================================================================== */}
        <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 sm:p-7 shadow-xs backdrop-blur-xs space-y-5">
          <div className="border-b border-slate-200/80 pb-3 flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
              <BedDouble size={15} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">3. Initial Room Configuration</h2>
              <p className="text-xs text-slate-500 mt-0.5">Setup your initial room or unit rate (you can add more units after creation)</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              id="roomLabel"
              label="Room Label / Unit #"
              placeholder="e.g. Room 204 (Solo / 2-Bed)"
              value={form.roomLabel}
              onChange={update('roomLabel')}
            />

            <Input
              id="roomPrice"
              label="Monthly Rent (₱)"
              type="number"
              min="0"
              placeholder="e.g. 4500"
              value={form.roomPrice}
              onChange={update('roomPrice')}
              required
            />

            <Input
              id="capacity"
              label="Room Capacity (Beds)"
              type="number"
              min="1"
              placeholder="e.g. 1"
              value={form.capacity}
              onChange={update('capacity')}
            />
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SECTION 4: VISUAL GALLERY */}
        {/* ==================================================================== */}
        <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 sm:p-7 shadow-xs backdrop-blur-xs space-y-5">
          <div className="border-b border-slate-200/80 pb-3 flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700 border border-sky-100">
              <ShieldCheck size={15} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">4. Visual Gallery</h2>
              <p className="text-xs text-slate-500 mt-0.5">High quality photos increase student inquiry conversion</p>
            </div>
          </div>

          <RoomPhotoUploader photos={roomPhotos} onChange={setRoomPhotos} />
        </div>

        {/* ==================================================================== */}
        {/* SECTION 5: HOUSE RULES & POLICIES */}
        {/* ==================================================================== */}
        <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 sm:p-7 shadow-xs backdrop-blur-xs space-y-5">
          <div className="border-b border-slate-200/80 pb-3 flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
              <FileText size={15} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">5. House Rules & Guidelines</h2>
              <p className="text-xs text-slate-500 mt-0.5">Specify accommodation rules (enter one rule per line)</p>
            </div>
          </div>

          <div>
            <Textarea
              aria-label="House Rules"
              placeholder="No pets allowed&#10;Curfew / Gate locks at 10:00 PM&#10;Quiet study hours from 9:00 PM - 6:00 AM&#10;Visitors allowed in lobby until 7:00 PM"
              value={form.houseRules}
              onChange={update('houseRules')}
              variant="bordered"
              minRows={4}
              classNames={{
                inputWrapper: 'border-slate-200/90 hover:border-slate-300 bg-white rounded-xl text-xs',
                input: 'text-xs text-slate-800 leading-relaxed font-mono',
              }}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Each new line will be presented as an itemized rule on the student inspection page.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            radius="full"
            onClick={() => navigate(ROUTES.OWNER_LISTINGS)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            radius="full"
            isLoading={loading}
            startContent={!loading && <Plus size={16} strokeWidth={2.5} />}
          >
            {loading ? 'Submitting Property…' : 'Submit for Verification'}
          </Button>
        </div>
      </form>
    </OwnerLayout>
  );
}
