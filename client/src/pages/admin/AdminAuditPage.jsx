import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Card,
  CardBody,
  Chip,
  Avatar,
  Tooltip,
} from '@heroui/react';
import {
  Award,
  ShieldCheck,
  FileText,
  Users,
  CheckCircle2,
  XCircle,
  UserCog,
  Trash2,
  Clock,
  Search,
  RotateCcw,
  RefreshCw,
  Eye,
  Activity,
  Shield,
  Building2,
  User,
  Check,
  AlertTriangle,
  Code,
  ArrowUpDown,
  ChevronRight,
  UserCheck,
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

function formatAuditDetails(details) {
  if (!details || typeof details !== 'object') return null;
  const parts = [];
  if (details.name) parts.push(`Listing: ${details.name}`);
  if (details.status) parts.push(`Status: ${details.status}`);
  if (details.role) parts.push(`Role: ${details.role}`);
  if (details.notes) parts.push(`Notes: "${details.notes}"`);
  if (details.bulk) parts.push('Bulk Action');
  if (details.reason) parts.push(`Reason: ${details.reason}`);
  return parts.length ? parts.join(' · ') : null;
}

function getActionMeta(action = '') {
  const act = action.toLowerCase();
  if (act.includes('approve')) {
    return {
      label: act.replace(/_/g, ' '),
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      icon: CheckCircle2,
      badgeVariant: 'verified',
    };
  }
  if (act.includes('reject')) {
    return {
      label: act.replace(/_/g, ' '),
      color: 'bg-rose-50 text-rose-700 border-rose-200/80',
      icon: XCircle,
      badgeVariant: 'danger',
    };
  }
  if (act.includes('remove') || act.includes('delete')) {
    return {
      label: act.replace(/_/g, ' '),
      color: 'bg-rose-50 text-rose-700 border-rose-200/80',
      icon: Trash2,
      badgeVariant: 'danger',
    };
  }
  if (act.includes('role')) {
    return {
      label: act.replace(/_/g, ' '),
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      icon: UserCog,
      badgeVariant: 'default',
    };
  }
  if (act.includes('dismiss') || act.includes('reviewed')) {
    return {
      label: act.replace(/_/g, ' '),
      color: 'bg-blue-50 text-ateneo-blue border-blue-200/80',
      icon: ShieldCheck,
      badgeVariant: 'default',
    };
  }
  return {
    label: act.replace(/_/g, ' ') || 'Action',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Activity,
    badgeVariant: 'default',
  };
}

export function AdminAuditPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [result, setResult] = useState({ items: [], totalPages: 1, totalCount: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Pagination State
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionCategoryFilter, setActionCategoryFilter] = useState('all'); // 'all' | 'listing' | 'account' | 'system'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modal State for JSON Inspection
  const [inspectModal, setInspectModal] = useState({
    isOpen: false,
    log: null,
  });

  // Sync search state with URL query param
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== search) {
      setSearch(q);
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Load Audit Logs
  const loadLogs = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await adminService.getAuditLogs(accessToken, page);
        setResult(res.data || { items: [], totalPages: 1, totalCount: 0 });
      } catch (err) {
        toast.error(err.message || 'Failed to load administrative audit logs.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, page, toast]
  );

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Compute Metrics from current result
  const items = result.items || [];
  const listingActionsCount = useMemo(
    () =>
      items.filter(
        (row) =>
          row.entity_type === 'property' ||
          row.entity_type === 'listing' ||
          row.action?.includes('listing')
      ).length,
    [items]
  );
  const accountActionsCount = useMemo(
    () =>
      items.filter(
        (row) =>
          row.entity_type === 'profile' ||
          row.entity_type === 'account' ||
          row.action?.includes('account') ||
          row.action?.includes('verification')
      ).length,
    [items]
  );
  const systemActionsCount = useMemo(
    () =>
      items.filter(
        (row) =>
          row.action?.includes('role') ||
          row.action?.includes('bulk') ||
          row.action?.includes('tenant') ||
          row.entity_type === 'system'
      ).length,
    [items]
  );

  // Filtered Items (Client-side search + category filter)
  const filteredItems = useMemo(() => {
    return items.filter((row) => {
      // Category Tab Filter
      if (actionCategoryFilter === 'listing') {
        const isListing =
          row.entity_type === 'property' ||
          row.entity_type === 'listing' ||
          row.action?.includes('listing');
        if (!isListing) return false;
      }
      if (actionCategoryFilter === 'account') {
        const isAccount =
          row.entity_type === 'profile' ||
          row.entity_type === 'account' ||
          row.action?.includes('account') ||
          row.action?.includes('verification');
        if (!isAccount) return false;
      }
      if (actionCategoryFilter === 'system') {
        const isSystem =
          row.action?.includes('role') ||
          row.action?.includes('bulk') ||
          row.action?.includes('tenant') ||
          row.entity_type === 'system' ||
          row.entity_type === 'review';
        if (!isSystem) return false;
      }

      // Entity Type Select Filter
      if (entityFilter && row.entity_type !== entityFilter) {
        return false;
      }

      // Search Query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesAction = (row.action || '').toLowerCase().includes(q);
        const matchesAdmin = (row.profiles?.full_name || '').toLowerCase().includes(q);
        const matchesEmail = (row.profiles?.email || '').toLowerCase().includes(q);
        const matchesEntity = (row.entity_type || '').toLowerCase().includes(q);
        const matchesEntityId = (row.entity_id || '').toLowerCase().includes(q);
        const detailsStr = JSON.stringify(row.details || {}).toLowerCase();
        const matchesDetails = detailsStr.includes(q);

        if (
          !matchesAction &&
          !matchesAdmin &&
          !matchesEmail &&
          !matchesEntity &&
          !matchesEntityId &&
          !matchesDetails
        ) {
          return false;
        }
      }

      return true;
    });
  }, [items, actionCategoryFilter, entityFilter, search]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setEntityFilter('');
    setActionCategoryFilter('all');
    setCurrentPage(1);
    setSearchParams({});
  };

  const hasActiveFilters =
    search !== '' || entityFilter !== '' || actionCategoryFilter !== 'all';

  // Executive Top Action Bar
  const headerAction = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        radius="full"
        variant="secondary"
        onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
        startContent={<Award size={14} strokeWidth={2} />}
      >
        Executive Dashboard
      </Button>

      <Button
        size="sm"
        radius="full"
        variant="ghost"
        onClick={() => navigate(ROUTES.ADMIN_MANAGE_USERS)}
        startContent={<Users size={14} strokeWidth={2} />}
      >
        User Directory
      </Button>

      <Button
        size="sm"
        radius="full"
        variant="ghost"
        isLoading={refreshing}
        onClick={() => loadLogs(true)}
        startContent={!refreshing && <RefreshCw size={14} strokeWidth={2} className={refreshing ? 'animate-spin' : ''} />}
        title="Sync audit records"
      >
        {refreshing ? 'Syncing…' : 'Sync'}
      </Button>
    </div>
  );

  return (
    <AdminLayout
      title="Audit Log"
      subtitle="Immutable chronological ledger of university administrative decisions and security events"
      headerAction={headerAction}
    >
      <div className="space-y-6">
        {/* ==================================================================== */}
        {/* SECTION 1: EXECUTIVE KPI METRICS (COMPACT ~80px STANDARD) */}
        {/* ==================================================================== */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            label="Total Audit Events"
            value={result.totalCount || items.length}
            icon={<Shield size={16} strokeWidth={2} />}
            variant="default"
            subtext="immutable security trail"
          />

          <StatsCard
            label="Listing Decisions"
            value={listingActionsCount}
            icon={<Building2 size={16} strokeWidth={2} />}
            variant="occupied"
            subtext="approvals & rejections"
          />

          <StatsCard
            label="Account Verifications"
            value={accountActionsCount}
            icon={<UserCheck size={16} strokeWidth={2} />}
            variant="verified"
            subtext="identity approvals & denials"
          />

          <StatsCard
            label="System & Role Ops"
            value={systemActionsCount}
            icon={<Activity size={16} strokeWidth={2} />}
            variant="default"
            subtext="permission modifications"
          />
        </section>

        {/* ==================================================================== */}
        {/* ==================================================================== */}
        {/* SECTION 2: RESPONSIVE SINGLE-ROW FILTERS & RIGHT-ALIGNED CATEGORY SELECTOR */}
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
                  setSearchParams(e.target.value ? { q: e.target.value } : {});
                }}
                placeholder="Search action, admin, entity, notes…"
                className="h-10 w-full rounded-xl border border-slate-200/90 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-ateneo-blue focus:outline-hidden shadow-2xs"
              />
            </div>

            {/* 2. Entity Type Selector Dropdown */}
            <div className="w-full sm:w-44">
              <select
                value={entityFilter}
                onChange={(e) => {
                  setEntityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-xs text-slate-800 focus:border-ateneo-blue focus:outline-hidden shadow-2xs"
              >
                <option value="">All entity types</option>
                <option value="property">Properties / Listings</option>
                <option value="profile">User Accounts</option>
                <option value="tenant">Tenants & Stays</option>
                <option value="review">Reviews & Reports</option>
                <option value="system">System / Operations</option>
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

          {/* Right Group: Category Selector on the Right Side Edge */}
          <div className="w-full lg:w-auto overflow-x-auto no-scrollbar py-0.5">
            <div className="inline-flex min-w-full sm:min-w-0 items-center gap-1 p-1 h-10 rounded-2xl bg-slate-100/90 border border-slate-200/70 shrink-0">
              {[
                { id: 'all', label: 'All Logs', icon: Shield, count: items.length },
                { id: 'listing', label: 'Listings', icon: Building2, count: listingActionsCount },
                { id: 'account', label: 'Accounts', icon: UserCheck, count: accountActionsCount },
                { id: 'system', label: 'System', icon: Activity, count: systemActionsCount },
              ].map((tab) => {
                const isActive = actionCategoryFilter === tab.id;
                const IconComp = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActionCategoryFilter(tab.id);
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
        {/* SECTION 3: AUDIT EVENT CARDS TIMELINE LIST */}
        {/* ==================================================================== */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 pb-2.5">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-slate-900">
                {actionCategoryFilter === 'listing'
                  ? 'Listing Moderation History'
                  : actionCategoryFilter === 'account'
                  ? 'Account Verification History'
                  : actionCategoryFilter === 'system'
                  ? 'System & Permission Events'
                  : 'Administrative Action Trail'}
              </h2>
              <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                Timestamped operations executed by authorized campus administrators.
              </p>
            </div>

            <span className="text-xs text-slate-500 shrink-0 self-start sm:self-auto pt-0.5 sm:pt-0">
              Showing page <span className="font-semibold text-slate-800">{page}</span> of{' '}
              <span className="font-semibold text-slate-800">{result.totalPages || 1}</span>
            </span>
          </div>

          {loading ? (
            <PageSkeleton variant="table" rows={6} cols={4} />
          ) : paginatedItems.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center shadow-xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Shield size={24} />
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-900">No audit events found</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                No administrative log entries match the selected filters or search keyword.
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
              {paginatedItems.map((row) => {
                const meta = getActionMeta(row.action);
                const IconComponent = meta.icon;
                const detailText = formatAuditDetails(row.details);
                const adminName = row.profiles?.full_name || row.profiles?.email || 'Administrator';
                const isAdDU = row.profiles?.email?.endsWith('@addu.edu.ph');

                return (
                  <Card
                    key={row.id}
                    shadow="sm"
                    className="rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    <CardBody className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        {/* Left: Action Icon + Details */}
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          {/* Semantic Action Icon */}
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${meta.color}`}
                          >
                            <IconComponent size={18} strokeWidth={2} />
                          </div>

                          {/* Details Metadata */}
                          <div className="space-y-1.5 min-w-0 flex-1">
                            {/* Row 1: Action Badge + Entity Type + Timestamp */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-bold capitalize px-2 py-0.5 rounded-lg border ${meta.color}`}
                              >
                                {meta.label}
                              </span>

                              <Chip
                                size="sm"
                                variant="flat"
                                color="default"
                                className="text-[10px] font-semibold uppercase tracking-wider h-5 px-1.5"
                              >
                                {row.entity_type || 'Event'}
                              </Chip>

                              {row.entity_id && (
                                <span className="text-[11px] font-mono text-slate-400">
                                  ID: {row.entity_id.slice(0, 8)}…
                                </span>
                              )}
                            </div>

                            {/* Row 2: Performed By Admin */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">Moderator:</span>
                                <span className="font-semibold text-slate-800">{adminName}</span>
                                {isAdDU && (
                                  <Chip
                                    size="sm"
                                    variant="flat"
                                    color="primary"
                                    className="text-[9px] font-bold h-4 px-1"
                                  >
                                    @addu.edu.ph
                                  </Chip>
                                )}
                              </div>

                              <div className="flex items-center gap-1 text-slate-400">
                                <Clock size={12} />
                                <span>{new Date(row.created_at).toLocaleString()}</span>
                              </div>
                            </div>

                            {/* Row 3: Event Payload / Detail Text */}
                            {detailText && (
                              <div className="mt-1 rounded-xl bg-slate-50/80 border border-slate-100 px-3 py-1.5 text-xs text-slate-700 font-medium">
                                {detailText}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Inspection CTA Button */}
                        <div className="flex items-center justify-between lg:justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                          <Button
                            size="sm"
                            radius="full"
                            variant="ghost"
                            onClick={() => setInspectModal({ isOpen: true, log: row })}
                            startContent={<Eye size={13} strokeWidth={2} />}
                            className="text-xs text-slate-600 hover:text-slate-900"
                          >
                            Inspect Payload
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
          {/* SECTION 4: PAGINATION BAR */}
          {/* ==================================================================== */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 font-normal">
                Showing page <span className="font-semibold text-slate-800">{currentPage}</span> of{' '}
                <span className="font-semibold text-slate-800">{totalPages}</span> ({filteredItems.length} matching events)
              </p>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  radius="full"
                  variant="ghost"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ==================================================================== */}
      {/* AUDIT PAYLOAD INSPECTION MODAL */}
      {/* ==================================================================== */}
      {inspectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-ateneo-blue">
                  <Code size={18} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Audit Event Details</h3>
                  <p className="text-xs text-slate-500">
                    Raw security and transaction payload metadata.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Action</span>
                  <p className="font-semibold text-slate-900 capitalize">
                    {inspectModal.log?.action?.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Entity Type</span>
                  <p className="font-semibold text-slate-900 uppercase">
                    {inspectModal.log?.entity_type}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Entity ID</span>
                  <p className="font-mono text-slate-700 truncate">
                    {inspectModal.log?.entity_id || '—'}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Timestamp</span>
                  <p className="text-slate-700">
                    {inspectModal.log?.created_at
                      ? new Date(inspectModal.log.created_at).toLocaleString()
                      : '—'}
                  </p>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1">
                  Actor Information
                </span>
                <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 space-y-0.5">
                  <p className="font-semibold text-slate-900">
                    {inspectModal.log?.profiles?.full_name || 'Administrator'}
                  </p>
                  <p className="text-slate-500">{inspectModal.log?.profiles?.email || 'No email'}</p>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1">
                  JSON Metadata Payload
                </span>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-48">
                  {JSON.stringify(inspectModal.log?.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <Button
                size="sm"
                radius="full"
                variant="primary"
                onClick={() => setInspectModal({ isOpen: false, log: null })}
              >
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
