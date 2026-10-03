import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  CardBody,
  Chip,
  Avatar,
  Tooltip,
} from '@heroui/react';
import {
  Users,
  User,
  Building2,
  DoorOpen,
  Calendar,
  Mail,
  Phone,
  Search,
  RotateCcw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  RefreshCw,
  FileText,
  ShieldCheck,
  UserCheck,
  BedDouble,
  Check,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { adminService } from '../../services/adminService';
import { ROUTES } from '../../constants/routes';
import { formatPropertyRoom } from '../../utils/formatPropertyRoom';

export function AdminManageTenantsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Filters State
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [propertyFilter, setPropertyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Remove Modal State
  const [removeModal, setRemoveModal] = useState({
    isOpen: false,
    tenant: null,
  });

  // Sync search state with URL query param
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== search) {
      setSearch(q);
    }
  }, [searchParams]);

  // Load Tenants Data
  const loadTenants = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await adminService.getTenants(accessToken);
        setTenants(res.data || []);
      } catch (err) {
        toast.error(err.message || 'Failed to load tenant records.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, toast]
  );

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  // Handle Remove Tenant Record
  const handleConfirmRemove = async () => {
    if (!removeModal.tenant) return;
    const { id, tenant_name, properties, rooms } = removeModal.tenant;
    setProcessingId(id);

    try {
      await adminService.removeTenant(id, accessToken);
      toast.success(
        `Tenant record for "${tenant_name}" removed. Room ${rooms?.label || ''} is now marked vacant.`
      );
      setRemoveModal({ isOpen: false, tenant: null });
      loadTenants();
    } catch (err) {
      toast.error(err.message || 'Failed to remove tenant record.');
    } finally {
      setProcessingId(null);
    }
  };

  // Unique Properties for Filter Dropdown
  const uniqueProperties = useMemo(() => {
    const map = new Map();
    tenants.forEach((t) => {
      if (t.properties?.id && t.properties?.name) {
        map.set(t.properties.id, t.properties.name);
      } else if (t.property_id && t.properties?.name) {
        map.set(t.property_id, t.properties.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [tenants]);

  // Metric Computations
  const activeTenantsCount = useMemo(
    () => tenants.filter((t) => t.is_active).length,
    [tenants]
  );
  const expiredTenantsCount = useMemo(
    () => tenants.filter((t) => t.is_expired || (!t.is_active && !t.is_expired)).length,
    [tenants]
  );
  const releasedRoomsCount = useMemo(
    () => tenants.filter((t) => !t.room_id).length,
    [tenants]
  );
  const uniquePropertiesCount = uniqueProperties.length;

  // Filtered & Sorted Tenants
  const filteredTenants = useMemo(() => {
    return tenants
      .filter((t) => {
        // Status Filter
        if (statusFilter === 'active' && !t.is_active) return false;
        if (statusFilter === 'expired' && !t.is_expired) return false;
        if (statusFilter === 'released' && t.room_id) return false;

        // Property Filter
        if (propertyFilter) {
          const propId = t.properties?.id || t.property_id;
          if (propId !== propertyFilter) return false;
        }

        // Search Query
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchesName = (t.tenant_name || '').toLowerCase().includes(q);
          const matchesEmail = (t.profiles?.email || t.student_email || '').toLowerCase().includes(q);
          const matchesProperty = (t.properties?.name || '').toLowerCase().includes(q);
          const matchesRoom = (t.rooms?.label || '').toLowerCase().includes(q);
          const matchesContact = (t.contact || t.profiles?.phone_number || '').toLowerCase().includes(q);

          if (!matchesName && !matchesEmail && !matchesProperty && !matchesRoom && !matchesContact) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'name') {
          return (a.tenant_name || '').localeCompare(b.tenant_name || '');
        }
        if (sortOrder === 'move_out') {
          return new Date(a.move_out_date || '9999-12-31') - new Date(b.move_out_date || '9999-12-31');
        }
        if (sortOrder === 'oldest') {
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        }
        // default newest
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
  }, [tenants, statusFilter, propertyFilter, search, sortOrder]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredTenants.length / itemsPerPage));
  const paginatedTenants = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTenants.slice(start, start + itemsPerPage);
  }, [filteredTenants, currentPage]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setPropertyFilter('');
    setStatusFilter('');
    setSortOrder('newest');
    setCurrentPage(1);
    setSearchParams({});
  };

  const hasActiveFilters =
    search !== '' || propertyFilter !== '' || statusFilter !== '' || sortOrder !== 'newest';

  // Executive Top Action Bar
  const headerAction = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        radius="full"
        variant="secondary"
        onClick={() => navigate(ROUTES.ADMIN_MANAGE_USERS)}
        startContent={<Users size={14} strokeWidth={2} />}
      >
        User Directory
      </Button>

      <Button
        size="sm"
        radius="full"
        variant="ghost"
        onClick={() => navigate(ROUTES.ADMIN_VERIFY_ACCOUNTS)}
        startContent={<UserCheck size={14} strokeWidth={2} />}
      >
        Verify Queue
      </Button>

      <Button
        size="sm"
        radius="full"
        variant="ghost"
        isLoading={refreshing}
        onClick={() => loadTenants(true)}
        startContent={!refreshing && <RefreshCw size={14} strokeWidth={2} className={refreshing ? 'animate-spin' : ''} />}
        title="Sync tenant records"
      >
        {refreshing ? 'Syncing…' : 'Sync'}
      </Button>
    </div>
  );

  return (
    <AdminLayout
      title="Manage Tenants"
      subtitle="Campus-wide tenant directory, lease tracking, and dormitory room occupancy ledger"
      headerAction={headerAction}
    >
      <div className="space-y-6">
        {/* ==================================================================== */}
        {/* SECTION 1: EXECUTIVE KPI METRICS (COMPACT ~80px STANDARD) */}
        {/* ==================================================================== */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            label="Total Tenant Records"
            value={tenants.length}
            icon={<Users size={16} strokeWidth={2} />}
            variant="default"
            subtext="campus lease records"
          />

          <StatsCard
            label="Active Stays"
            value={activeTenantsCount}
            icon={<BedDouble size={16} strokeWidth={2} />}
            variant="occupied"
            subtext="currently occupying rooms"
          />

          <StatsCard
            label="Expired / Vacated"
            value={expiredTenantsCount}
            icon={<Clock size={16} strokeWidth={2} />}
            variant="default"
            subtext="past move-out date"
          />

          <StatsCard
            label="Properties Represented"
            value={uniquePropertiesCount}
            icon={<Building2 size={16} strokeWidth={2} />}
            variant="verified"
            subtext="active dormitories"
          />
        </section>

        {/* ==================================================================== */}
        {/* ==================================================================== */}
        {/* SECTION 2: RESPONSIVE SINGLE-ROW FILTERS & RIGHT-ALIGNED STATUS SELECTOR */}
        {/* ==================================================================== */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 border-b border-slate-200/80 pb-3.5">
          {/* Left Group: Inline Filter Inputs */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* 1. Search Input */}
            <div className="relative w-full sm:w-60">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                  setSearchParams(e.target.value ? { q: e.target.value } : {});
                }}
                placeholder="Search tenant, email, room, dorm…"
                className="h-10 w-full rounded-xl border border-slate-200/90 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-ateneo-blue focus:outline-hidden shadow-2xs"
              />
            </div>

            {/* 2. Property Selector Dropdown */}
            <div className="w-full sm:w-48">
              <select
                value={propertyFilter}
                onChange={(e) => {
                  setPropertyFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-xs text-slate-800 focus:border-ateneo-blue focus:outline-hidden shadow-2xs"
              >
                <option value="">All dorm properties</option>
                {uniqueProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Status Filter Dropdown */}
            <div className="w-full sm:w-40">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-xs text-slate-800 focus:border-ateneo-blue focus:outline-hidden shadow-2xs"
              >
                <option value="">All stay statuses</option>
                <option value="active">Active Stay</option>
                <option value="expired">Expired Stay</option>
                <option value="released">Released Room</option>
              </select>
            </div>

            {/* Reset Filters CTA if active */}
            {hasActiveFilters && (
              <Button
                size="sm"
                radius="full"
                variant="ghost"
                onClick={handleResetFilters}
                startContent={<RotateCcw size={13} strokeWidth={2} />}
                className="h-10 text-xs text-slate-500 hover:text-slate-900"
              >
                Reset
              </Button>
            )}
          </div>

          {/* Right Group: Status Selector on the Right Side Edge */}
          <div className="w-full lg:w-auto overflow-x-auto no-scrollbar py-0.5">
            <div className="inline-flex min-w-full sm:min-w-0 items-center gap-1 p-1 h-10 rounded-2xl bg-slate-100/90 border border-slate-200/70 shrink-0">
              {[
                { id: '', label: 'All Records', icon: Users, count: tenants.length },
                { id: 'active', label: 'Active', icon: BedDouble, count: activeTenantsCount },
                { id: 'expired', label: 'Expired', icon: Clock, count: expiredTenantsCount },
                { id: 'released', label: 'Released', icon: DoorOpen, count: releasedRoomsCount },
              ].map((tab) => {
                const isActive = statusFilter === tab.id;
                const IconComp = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setStatusFilter(tab.id);
                      setCurrentPage(1);
                    }}
                    className={`inline-flex items-center gap-1.5 h-full rounded-xl px-3 text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                      isActive
                        ? 'bg-white text-ateneo-blue shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <IconComp size={13} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-ateneo-blue' : 'text-slate-400'} />
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        isActive ? 'bg-ateneo-blue/10 text-ateneo-blue' : 'bg-slate-200/60 text-slate-500'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 3: TENANT DIRECTORY CARDS LIST */}
        {/* ==================================================================== */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 pb-2.5">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-slate-900">
                {statusFilter === 'active'
                  ? 'Active Campus Occupants'
                  : statusFilter === 'expired'
                  ? 'Expired Lease Records'
                  : statusFilter === 'released'
                  ? 'Released Room Records'
                  : 'All Registered Campus Tenant Records'}
              </h2>
              <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                Review occupancy timelines, student verification tags, and manage room allocations.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0 self-start sm:self-auto pt-0.5 sm:pt-0">
              <span>Sort:</span>
              <button
                type="button"
                onClick={() => {
                  setSortOrder((prev) =>
                    prev === 'newest'
                      ? 'move_out'
                      : prev === 'move_out'
                      ? 'name'
                      : prev === 'name'
                      ? 'oldest'
                      : 'newest'
                  );
                  setCurrentPage(1);
                }}
                className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-ateneo-blue"
              >
                <ArrowUpDown size={13} />
                <span>
                  {sortOrder === 'newest'
                    ? 'Newest Record'
                    : sortOrder === 'move_out'
                    ? 'Move-out Date'
                    : sortOrder === 'name'
                    ? 'Alphabetical (A-Z)'
                    : 'Oldest Record'}
                </span>
              </button>
            </div>
          </div>

          {loading ? (
            <PageSkeleton variant="table" rows={6} cols={5} />
          ) : paginatedTenants.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center shadow-xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Users size={24} />
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-900">No tenant records found</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                No active or historical tenant entries match your search criteria.
              </p>
              {hasActiveFilters && (
                <div className="mt-4">
                  <Button size="sm" radius="full" variant="secondary" onClick={handleResetFilters}>
                    Clear Filter Criteria
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              {paginatedTenants.map((t) => {
                const isAdDU =
                  t.profiles?.email?.endsWith('@addu.edu.ph') ||
                  t.student_email?.endsWith('@addu.edu.ph');
                const studentEmail = t.profiles?.email || t.student_email;
                const contactNumber = t.contact || t.profiles?.phone_number;
                const propertyRoomDisplay = formatPropertyRoom(
                  t.properties?.name,
                  t.rooms?.label
                );
                const hasNoRoom = !t.room_id;

                const badgeVariant = t.is_active
                  ? 'occupied'
                  : t.is_expired
                  ? 'default'
                  : 'danger';

                return (
                  <Card
                    key={t.id}
                    shadow="sm"
                    className="rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    <CardBody className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        {/* Left: Tenant and Property Info */}
                        <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                          {/* Tenant Avatar */}
                          <Avatar
                            size="md"
                            name={t.tenant_name || 'Tenant'}
                            className="h-11 w-11 text-xs font-bold shrink-0 bg-ateneo-blue text-white"
                          />

                          {/* Metadata */}
                          <div className="space-y-1.5 min-w-0 flex-1">
                            {/* Row 1: Name + Badges */}
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-900 truncate">
                                {t.tenant_name || 'Unnamed Tenant'}
                              </h3>

                              {isAdDU && (
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  color="primary"
                                  className="text-[10px] font-bold h-5 px-1.5"
                                >
                                  @addu.edu.ph
                                </Chip>
                              )}

                              <Badge variant={badgeVariant}>
                                {t.is_active ? 'Active Stay' : t.is_expired ? 'Expired' : 'Inactive'}
                              </Badge>

                              {hasNoRoom && (
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  className="text-[10px] font-semibold h-5 px-1.5 bg-rose-50 text-rose-700"
                                >
                                  Room Released
                                </Chip>
                              )}
                            </div>

                            {/* Row 2: Property & Room Assignment */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                                <Building2 size={13} className="text-ateneo-blue shrink-0" />
                                <span>{propertyRoomDisplay || 'Unassigned Property'}</span>
                              </div>

                              {t.rooms?.price && (
                                <span className="text-slate-500">
                                  ₱{Number(t.rooms.price).toLocaleString()} / mo
                                </span>
                              )}
                            </div>

                            {/* Row 3: Contact & Lease Timeline */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                              {studentEmail && (
                                <div className="flex items-center gap-1.5 text-slate-600">
                                  <Mail size={12} className="text-slate-400 shrink-0" />
                                  <span className="truncate">{studentEmail}</span>
                                </div>
                              )}

                              {contactNumber && (
                                <div className="flex items-center gap-1.5 text-slate-600">
                                  <Phone size={12} className="text-slate-400 shrink-0" />
                                  <span>{contactNumber}</span>
                                </div>
                              )}

                              <div className="flex items-center gap-1.5 text-slate-500">
                                <Calendar size={12} className="text-slate-400 shrink-0" />
                                <span>
                                  {t.move_in_date ? new Date(t.move_in_date).toLocaleDateString() : '—'}
                                  {' → '}
                                  {t.move_out_date ? new Date(t.move_out_date).toLocaleDateString() : 'Open'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex flex-row items-center justify-between lg:justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                          <Button
                            size="sm"
                            radius="full"
                            variant="danger"
                            onClick={() => setRemoveModal({ isOpen: true, tenant: t })}
                            startContent={<Trash2 size={13} strokeWidth={2} />}
                          >
                            Remove Record
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}

          {/* ==================================================================== */}
          {/* SECTION 4: PAGINATION & DIRECTORY COUNTER */}
          {/* ==================================================================== */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 font-normal">
                Showing page <span className="font-semibold text-slate-800">{currentPage}</span> of{' '}
                <span className="font-semibold text-slate-800">{totalPages}</span> ({filteredTenants.length} matching records)
              </p>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  radius="full"
                  variant="ghost"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Previous
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-xs text-slate-400">…</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`h-7 w-7 rounded-full text-xs font-semibold transition-all ${
                          currentPage === p
                            ? 'bg-ateneo-blue text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}

                <Button
                  size="sm"
                  radius="full"
                  variant="ghost"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ==================================================================== */}
      {/* REMOVAL CONFIRMATION MODAL */}
      {/* ==================================================================== */}
      {removeModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <AlertTriangle size={20} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Remove Tenant Record</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm releasing tenant from dormitory room allocation.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3.5 text-xs text-slate-600 space-y-1.5">
              <p>
                <span className="font-semibold text-slate-900">Tenant:</span>{' '}
                {removeModal.tenant?.tenant_name || 'Tenant'}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Property:</span>{' '}
                {removeModal.tenant?.properties?.name || 'Dormitory'}
              </p>
              {removeModal.tenant?.rooms?.label && (
                <p>
                  <span className="font-semibold text-slate-900">Room:</span> Room{' '}
                  {removeModal.tenant?.rooms?.label}
                </p>
              )}
            </div>

            <p className="mt-3 text-xs text-rose-600 leading-relaxed">
              Removing this record will immediately release the room and mark it as vacant in the public student housing search.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                size="sm"
                radius="full"
                variant="ghost"
                disabled={processingId !== null}
                onClick={() => setRemoveModal({ isOpen: false, tenant: null })}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                radius="full"
                variant="danger"
                isLoading={processingId === removeModal.tenant?.id}
                onClick={handleConfirmRemove}
                startContent={processingId !== removeModal.tenant?.id && <Trash2 size={13} strokeWidth={2} />}
              >
                Confirm Removal
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
