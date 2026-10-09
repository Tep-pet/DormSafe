import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Textarea } from '@heroui/react';
import {
  Building2,
  MapPin,
  FileText,
  User,
  Phone,
  BedDouble,
  CreditCard,
  Users,
  Save,
  ArrowLeft,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import { OwnerLayout } from '../../components/layout/OwnerLayout';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { propertyService } from '../../services/propertyService';
import { resolvePropertyContact } from '../../utils/parseContact';
import { ROUTES } from '../../constants/routes';

export function EditPropertyPage() {
  const { id } = useParams();
  const { accessToken } = useAuth();
  const { toast } = useToast();
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
    contact_email: '',
    house_rules: [''],
    rooms: [],
  });

  useEffect(() => {
    setLoading(true);
    propertyService
      .getProperty(id, accessToken)
      .then((res) => {
        const p = res.data;
        const resolved = resolvePropertyContact(p);
        setForm({
          name: p.name || '',
          description: p.description || '',
          address: p.address || '',
          contact_name: p.contact_name || resolved.contactName || '',
          contact_phone: p.contact_phone || resolved.contactPhone || '',
          contact_email: p.contact_email || resolved.contactEmail || '',
          house_rules:
            p.house_rules?.length > 0
              ? p.house_rules.map((r) => (typeof r === 'string' ? r : r.rule || ''))
              : [''],
          rooms: (p.rooms || []).map((r) => ({
            id: r.id,
            label: r.label || '',
            price: r.price ?? '',
            capacity: r.capacity ?? 1,
          })),
        });
      })
      .catch((err) => {
        setError(err.message || 'Failed to load property details');
        toast.error(err.message || 'Failed to load property');
      })
      .finally(() => setLoading(false));
  }, [id, accessToken, toast]);

  function updateRoom(index, field, value) {
    setForm((prev) => {
      const rooms = [...prev.rooms];
      rooms[index] = { ...rooms[index], [field]: value };
      return { ...prev, rooms };
    });
  }

  function addRule() {
    setForm((prev) => ({
      ...prev,
      house_rules: [...prev.house_rules, ''],
    }));
  }

  function removeRule(index) {
    setForm((prev) => ({
      ...prev,
      house_rules: prev.house_rules.filter((_, i) => i !== index),
    }));
  }

  function updateRule(index, value) {
    setForm((prev) => {
      const rules = [...prev.house_rules];
      rules[index] = value;
      return { ...prev, house_rules: rules };
    });
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await propertyService.updateProperty(
        id,
        {
          name: form.name.trim(),
          description: form.description.trim(),
          address: form.address.trim(),
          contact_name: form.contact_name.trim() || null,
          contact_phone: form.contact_phone.trim() || null,
          contact_email: form.contact_email.trim() || null,
          house_rules: form.house_rules.map((r) => r.trim()).filter(Boolean),
          rooms: form.rooms.map((r) => ({
            ...r,
            label: r.label.trim() || 'Room',
            price: Number(r.price),
            capacity: Number(r.capacity) || 1,
          })),
        },
        accessToken
      );

      toast.success('Property listing updated successfully!');
      navigate(ROUTES.OWNER_LISTINGS);
    } catch (err) {
      setError(err.message || 'Failed to update property');
      toast.error(err.message || 'Failed to update property');
    } finally {
      setSaving(false);
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

      <Button
        variant="secondary"
        size="sm"
        radius="full"
        onClick={() => navigate(ROUTES.OWNER_LISTINGS)}
      >
        Cancel
      </Button>

      <Button
        variant="primary"
        size="sm"
        radius="full"
        isLoading={saving}
        onClick={handleSubmit}
        startContent={!saving && <Save size={14} />}
      >
        {saving ? 'Saving Changes…' : 'Save Changes'}
      </Button>
    </div>
  );

  return (
    <OwnerLayout
      title={`Edit Listing: ${form.name || 'Property'}`}
      subtitle="Update pricing, capacity, contact details, and house rules"
      headerAction={headerAction}
      hidePropertyFilter
    >
      {loading ? (
        <PageSkeleton variant="form" count={3} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 shadow-2xs">
              <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Error Updating Listing</p>
                <p className="mt-0.5 font-normal text-rose-600">{error}</p>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* SECTION 1: PROPERTY IDENTITY & LOCATION */}
          {/* ==================================================================== */}
          <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 sm:p-7 shadow-xs backdrop-blur-xs space-y-5">
            <div className="border-b border-slate-200/80 pb-3 flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-ateneo-blue border border-blue-100">
                <Building2 size={15} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">1. Property Identity & Location</h2>
                <p className="text-xs text-slate-500 mt-0.5">Edit establishment name, campus location, and description</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  id="name"
                  label="Property / Establishment Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  id="address"
                  label="Complete Campus Address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Description & Amenities
                </label>
                <Textarea
                  aria-label="Description & Amenities"
                  placeholder="Describe your property amenities and standout features..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                <p className="text-xs text-slate-500 mt-0.5">Contact info visible to inquiring Ateneo students</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                id="contact_name"
                label="Contact Person Name"
                placeholder="e.g. Maria Santos"
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              />

              <Input
                id="contact_phone"
                label="Contact Phone / Mobile"
                placeholder="09XXXXXXXXX"
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              />

              <Input
                id="contact_email"
                type="email"
                label="Contact Email Address"
                placeholder="e.g. landlord@example.com"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              />
            </div>
          </div>

          {/* ==================================================================== */}
          {/* SECTION 3: ROOMS & INVENTORY MANAGEMENT */}
          {/* ==================================================================== */}
          <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 sm:p-7 shadow-xs backdrop-blur-xs space-y-5">
            <div className="border-b border-slate-200/80 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                  <BedDouble size={15} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">3. Rooms & Pricing Management</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Manage room labels, monthly rental rates, and bed capacity</p>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200/80">
                {form.rooms.length} Units
              </span>
            </div>

            {form.rooms.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                <p className="text-xs text-slate-500">No rooms listed under this property.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {form.rooms.map((room, i) => (
                  <div
                    key={room.id || i}
                    className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-4 transition-all hover:bg-slate-50 hover:border-slate-300"
                  >
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Input
                        label="Room Label / Unit"
                        placeholder="e.g. Room 101"
                        value={room.label}
                        onChange={(e) => updateRoom(i, 'label', e.target.value)}
                      />

                      <Input
                        label="Monthly Rent (₱)"
                        type="number"
                        min="0"
                        placeholder="e.g. 5000"
                        value={room.price}
                        onChange={(e) => updateRoom(i, 'price', e.target.value)}
                        required
                      />

                      <Input
                        label="Capacity (Beds)"
                        type="number"
                        min="1"
                        placeholder="e.g. 2"
                        value={room.capacity}
                        onChange={(e) => updateRoom(i, 'capacity', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ==================================================================== */}
          {/* SECTION 4: HOUSE RULES EDITOR */}
          {/* ==================================================================== */}
          <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 sm:p-7 shadow-xs backdrop-blur-xs space-y-5">
            <div className="border-b border-slate-200/80 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
                  <FileText size={15} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">4. House Rules & Policies</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Itemized rules shown to student tenants</p>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                radius="full"
                onClick={addRule}
                startContent={<Plus size={13} />}
              >
                Add Rule
              </Button>
            </div>

            <div className="space-y-2.5">
              {form.house_rules.map((rule, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500 border border-slate-200/70">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => updateRule(i, e.target.value)}
                    placeholder={`Rule ${i + 1} (e.g. Quiet hours 10pm - 6am)`}
                    className="h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-xs text-slate-800 placeholder-slate-400 shadow-2xs transition-all focus:border-ateneo-blue focus:outline-none focus:ring-2 focus:ring-ateneo-blue/20"
                  />
                  {form.house_rules.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      radius="full"
                      onClick={() => removeRule(i)}
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-9 w-9 p-0 min-w-9"
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action Footer */}
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
              isLoading={saving}
              startContent={!saving && <Save size={16} />}
            >
              {saving ? 'Saving Changes…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      )}
    </OwnerLayout>
  );
}
