import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Select,
  SelectItem,
} from '@heroui/react';
import {
  Users,
  UserPlus,
  Building2,
  BedDouble,
  User,
  Mail,
  Phone,
  Calendar,
  Search,
  RefreshCw,
  Trash2,
  ShieldCheck,
  AlertCircle,
  X,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { OwnerLayout } from '../../components/layout/OwnerLayout';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Pagination } from '../../components/common/Pagination';
import { Badge } from '../../components/common/Badge';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useOwnerProperty } from '../../context/OwnerPropertyContext';
import { ITEMS_PER_PAGE } from '../../constants/pagination';
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
  const { toast } = useToast();
  const { properties = [], filterPropertyId } = useOwnerProperty();

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [removeDialog, setRemoveDialog] = useState({
    isOpen: false,
    id: null,
    name: '',
    isLoading: false,
  });

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tenantService.list(accessToken, filterPropertyId);
      setTenants(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load tenant roster');
    } finally {
      setLoading(false);
    }
  }, [accessToken, filterPropertyId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (filterPropertyId) {
      setForm((prev) => ({ ...prev, property_id: filterPropertyId }));
    }
  }, [filterPropertyId]);

  const formProperties = filterPropertyId
    ? properties.filter((p) => p.id === filterPropertyId)
    : properties;

  const selectedProperty = properties.find((p) => p.id === form.property_id);
  const rooms = selectedProperty?.rooms || [];

  async function handleAdd(e) {
    e.preventDefault();
    setError('');

    if (!form.property_id || !form.tenant_name.trim()) {
      setError('Please select a property and enter the tenant name.');
      return;
    }

    setSubmitting(true);
    try {
      await tenantService.create(form, accessToken);
      toast.success(`Tenant "${form.tenant_name}" successfully added to roster.`);
      setForm({ ...emptyForm, property_id: filterPropertyId || '' });
      setShowAddForm(false);
      load();
    } catch (err) {
      setError(err.message || 'Failed to add tenant');
      toast.error(err.message || 'Failed to add tenant');
    } finally {
      setSubmitting(false);
    }
  }

  function handleRemove(id, name) {
    setRemoveDialog({
      isOpen: true,
      id,
      name,
      isLoading: false,
    });
  }

  async function handleConfirmRemove() {
    setRemoveDialog((prev) => ({ ...prev, isLoading: true }));
    try {
      await tenantService.remove(removeDialog.id, accessToken);
      toast.warning(`Removed ${removeDialog.name} from tenant records`);
      setRemoveDialog({ isOpen: false, id: null, name: '', isLoading: false });
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to remove tenant');
      setRemoveDialog((prev) => ({ ...prev, isLoading: false }));
    }
  }

  // Filtered Tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchesSearch =
        !searchTerm.trim() ||
        (t.tenant_name && t.tenant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.profiles?.email && t.profiles.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.properties?.name && t.properties.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.rooms?.label && t.rooms.label.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && t.is_active) ||
        (statusFilter === 'expired' && (t.is_expired || !t.is_active));

      return matchesSearch && matchesStatus;
    });
  }, [tenants, searchTerm, statusFilter]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredTenants.length / ITEMS_PER_PAGE));
  const paginatedTenants = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredTenants.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTenants, page]);

  const statusCounts = useMemo(() => {
    return {
      all: tenants.length,
      active: tenants.filter((t) => t.is_active).length,
      expired: tenants.filter((t) => t.is_expired || !t.is_active).length,
    };
  }, [tenants]);

  const columns = [
    { key: 'tenant_name', label: 'TENANT NAME' },
    { key: 'property_room', label: 'PROPERTY & UNIT' },
    { key: 'student_account', label: 'STUDENT ACCOUNT' },
    { key: 'move_in', label: 'MOVE-IN' },
    { key: 'move_out', label: 'MOVE-OUT / END' },
    { key: 'status', label: 'STATUS' },
    { key: 'actions', label: 'ACTIONS' },
  ];

  // Header Actions
  const headerAction = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        radius="full"
        variant={showAddForm ? 'secondary' : 'primary'}
        onClick={() => setShowAddForm((v) => !v)}
        startContent={showAddForm ? <X size={14} /> : <UserPlus size={14} strokeWidth={2.5} />}
      >
        {showAddForm ? 'Close Form' : 'Register Tenant'}
      </Button>

      <Button
        size="sm"
        radius="full"
        variant="ghost"
        isLoading={loading}
        onClick={() => load()}
        startContent={!loading && <RefreshCw size={14} />}
      >
        Sync Roster
      </Button>
    </div>
  );

  return (
    <OwnerLayout
      title="Tenant Management"
      subtitle="Digital ledger of active student stays, lease durations, and room assignments"
      headerAction={headerAction}
    >
      <div className="space-y-6">
        {/* ==================================================================== */}
        {/* COLLAPSIBLE TENANT REGISTRATION FORM */}
        {/* ==================================================================== */}
        {showAddForm && (
          <form
            onSubmit={handleAdd}
            className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 sm:p-7 shadow-xs backdrop-blur-xs space-y-5"
          >
            <div className="border-b border-slate-200/80 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-ateneo-blue border border-blue-100">
                  <UserPlus size={18} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Register Tenant in Digital Ledger
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Record a new student tenancy and assign their accommodation room.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                radius="full"
                onClick={() => setShowAddForm(false)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
              >
                <X size={15} />
              </Button>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                <AlertCircle size={15} className="shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Property
                </label>
                <Select
                  aria-label="Select Property"
                  placeholder="Choose property"
                  selectedKeys={form.property_id ? [form.property_id] : []}
                  onChange={(e) => setForm({ ...form, property_id: e.target.value, room_id: '' })}
                  variant="bordered"
                  size="md"
                  isDisabled={!!filterPropertyId}
                  classNames={{
                    trigger: 'border-slate-200/90 hover:border-slate-300 bg-white rounded-xl h-10 text-xs',
                    value: 'text-xs font-medium text-slate-800',
                  }}
                >
                  {formProperties.map((p) => (
                    <SelectItem key={p.id} textValue={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Assigned Room (Optional)
                </label>
                <Select
                  aria-label="Select Room"
                  placeholder={rooms.length === 0 ? 'No rooms configured' : 'Choose room unit'}
                  selectedKeys={form.room_id ? [form.room_id] : []}
                  onChange={(e) => setForm({ ...form, room_id: e.target.value })}
                  variant="bordered"
                  size="md"
                  isDisabled={!form.property_id || rooms.length === 0}
                  classNames={{
                    trigger: 'border-slate-200/90 hover:border-slate-300 bg-white rounded-xl h-10 text-xs',
                    value: 'text-xs font-medium text-slate-800',
                  }}
                >
                  {rooms.map((r) => (
                    <SelectItem key={r.id} textValue={`${r.label || 'Unit'} (₱${r.price}/mo)`}>
                      {r.label || r.id.slice(0, 8)} — ₱{r.price}/mo (Cap: {r.capacity || 1})
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <Input
                id="tenant_name"
                label="Tenant Full Name"
                placeholder="e.g. Juan Dela Cruz"
                value={form.tenant_name}
                onChange={(e) => setForm({ ...form, tenant_name: e.target.value })}
                required
              />

              <Input
                id="student_email"
                label="Student Account Email (for stay sync)"
                placeholder="student@addu.edu.ph"
                value={form.student_email}
                onChange={(e) => setForm({ ...form, student_email: e.target.value })}
              />

              <div className="sm:col-span-2">
                <p className="text-[11px] text-slate-400">
                  If the student registers with this email on DormSafe, their stay, extensions, and payment receipts will automatically sync to their student dashboard.
                </p>
              </div>

              <Input
                id="contact"
                label="Contact Number"
                placeholder="09XXXXXXXXX"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
              />

              <Input
                id="move_in_date"
                label="Move-in Date"
                type="date"
                value={form.move_in_date}
                onChange={(e) => setForm({ ...form, move_in_date: e.target.value })}
              />

              <div className="sm:col-span-2">
                <Input
                  id="move_out_date"
                  label="Move-out / Stay End Date"
                  type="date"
                  value={form.move_out_date}
                  onChange={(e) => setForm({ ...form, move_out_date: e.target.value })}
                  required={!!form.room_id}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                radius="full"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                radius="full"
                isLoading={submitting}
                startContent={!submitting && <UserPlus size={15} strokeWidth={2.5} />}
              >
                {submitting ? 'Registering Tenant…' : 'Add to Digital Ledger'}
              </Button>
            </div>
          </form>
        )}

        {/* ==================================================================== */}
        {/* SINGLE-ROW COMPACT TOOLBAR (GOLDEN STANDARD) */}
        {/* ==================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3.5 border-b border-slate-200/80 pb-3.5">
          {/* Left: Search input + Reset */}
          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            <div className="relative w-full sm:w-64">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search tenant, email, or room…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200/90 bg-white/95 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 shadow-2xs transition-all focus:border-ateneo-blue focus:outline-none focus:ring-2 focus:ring-ateneo-blue/20"
              />
            </div>

            {(searchTerm || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/70 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition cursor-pointer"
              >
                <X size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Right Edge: Status Tab Capsule */}
          <div className="w-full lg:w-auto overflow-x-auto no-scrollbar py-0.5">
            <div className="inline-flex min-w-full sm:min-w-0 items-center gap-1 p-1 h-10 rounded-2xl bg-slate-100/90 border border-slate-200/70 shrink-0">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`rounded-xl px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                  statusFilter === 'all'
                    ? 'bg-white text-ateneo-blue shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Tenants ({statusCounts.all})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                  statusFilter === 'active'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>Active ({statusCounts.active})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('expired')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                  statusFilter === 'expired'
                    ? 'bg-white text-slate-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock size={13} className="text-slate-400" />
                <span>Inactive / Expired ({statusCounts.expired})</span>
              </button>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* TABLE CONTENT & PAGINATION */}
        {/* ==================================================================== */}
        {loading ? (
          <PageSkeleton variant="table" rows={6} cols={6} />
        ) : filteredTenants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/95 p-12 text-center shadow-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-ateneo-blue">
              <Users size={24} strokeWidth={1.75} />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">
              {searchTerm || statusFilter !== 'all'
                ? 'No matching tenant records found'
                : 'No tenants recorded yet'}
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or resetting filters.'
                : 'Add tenants to your digital ledger to track active student stays and rent collections.'}
            </p>
            <div className="mt-5 flex justify-center gap-2">
              {searchTerm || statusFilter !== 'all' ? (
                <Button
                  size="sm"
                  radius="full"
                  variant="secondary"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button
                  size="sm"
                  radius="full"
                  variant="primary"
                  onClick={() => setShowAddForm(true)}
                  startContent={<UserPlus size={14} />}
                >
                  Register First Tenant
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-xs backdrop-blur-xs">
              <Table
                aria-label="Tenants ledger table"
                radius="none"
                shadow="none"
                classNames={{
                  base: 'overflow-x-auto',
                  table: 'min-w-full',
                  th: 'bg-slate-50/80 text-slate-500 font-bold text-[11px] uppercase tracking-wider py-3.5 border-b border-slate-200/80',
                  td: 'py-3.5 text-xs text-slate-700 border-b border-slate-100',
                }}
              >
                <TableHeader columns={columns}>
                  {(col) => (
                    <TableColumn
                      key={col.key}
                      className={col.key === 'actions' ? 'text-right pr-6' : ''}
                    >
                      {col.label}
                    </TableColumn>
                  )}
                </TableHeader>
                <TableBody items={paginatedTenants}>
                  {(item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <TableCell className="font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-ateneo-blue border border-blue-100/70 shadow-2xs font-bold text-xs">
                            {item.tenant_name ? item.tenant_name.charAt(0).toUpperCase() : 'T'}
                          </div>
                          <div>
                            <span>{item.tenant_name}</span>
                            {item.contact && (
                              <span className="block text-[10px] font-normal text-slate-400">
                                {item.contact}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-800">
                          {formatPropertyRoom(item.properties?.name, item.rooms?.label)}
                          {!item.room_id && (
                            <span className="text-slate-400 text-[11px]"> · (room released)</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs font-mono">
                        {item.profiles?.email || '—'}
                      </TableCell>
                      <TableCell className="text-slate-600 text-xs">
                        {item.move_in_date || '—'}
                      </TableCell>
                      <TableCell className="text-slate-600 text-xs font-medium">
                        {item.move_out_date || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.is_active
                              ? 'occupied'
                              : item.is_expired
                              ? 'default'
                              : 'pending'
                          }
                        >
                          {item.is_active ? 'Active Stay' : item.is_expired ? 'Expired' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end pr-2">
                          <Button
                            size="sm"
                            radius="full"
                            variant="danger"
                            onClick={() => handleRemove(item.id, item.tenant_name)}
                            startContent={<Trash2 size={13} />}
                            className="h-7 text-[11px] px-2.5"
                          >
                            Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={filteredTenants.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={removeDialog.isOpen}
        onClose={() => setRemoveDialog({ isOpen: false, id: null, name: '', isLoading: false })}
        onConfirm={handleConfirmRemove}
        isLoading={removeDialog.isLoading}
        confirmVariant="danger"
        confirmLabel="Remove Tenant"
        title="Remove Tenant from Roster"
        message={`Are you sure you want to remove "${removeDialog.name}" from active tenant records? Their stay assignment will be released.`}
        icon={<Trash2 size={18} strokeWidth={2} />}
      />
    </OwnerLayout>
  );
}
