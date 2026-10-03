import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  Chip,
  Avatar,
  Tooltip,
} from '@heroui/react';
import {
  UserCheck,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Users,
  Award,
  RefreshCw,
  Calendar,
  ArrowUpDown,
  Eye,
  RotateCcw,
  CheckSquare,
  Square,
  Mail,
  ShieldCheck,
  Clock,
  ExternalLink,
  ChevronRight,
  User,
  Check,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { DocumentViewer } from '../../components/common/DocumentViewer';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { adminService } from '../../services/adminService';
import { ROLE_LABELS, ROLES } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';

export function VerifyAccountsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Document Viewer & Rejection Dialog State
  const [docsModal, setDocsModal] = useState(null);
  const [selected, setSelected] = useState([]);
  const [rejectionModal, setRejectionModal] = useState({
    isOpen: false,
    item: null,
    reason: '',
    isBulk: false,
  });

  const [filters, setFilters] = useState({
    page: 1,
    limit: 15,
    status: 'pending',
    sort: 'desc',
    role: '',
    search: '',
    dateFrom: '',
    dateTo: '',
  });

  // Clear selection on page/status tab switch
  useEffect(() => {
    setSelected([]);
  }, [filters.page, filters.status]);

  // Load auxiliary stats for executive KPIs
  const fetchAuxiliaryStats = useCallback(async () => {
    try {
      const statsRes = await adminService.getDashboardStats(accessToken).catch(() => ({ data: null }));
      setStats(statsRes.data || null);
    } catch (err) {
      console.error('Failed to load dashboard verification stats:', err);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchAuxiliaryStats();
  }, [fetchAuxiliaryStats]);

  // Main Account Verifications Fetch
  const fetchVerifications = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await adminService.getAccountVerifications(accessToken, {
          page: filters.page,
          limit: filters.limit,
          status: filters.status,
          sort: filters.sort,
          role: filters.role || undefined,
          search: filters.search || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
        });

        const fetchedItems = res.data?.items || [];
        setItems(fetchedItems);
        setTotalPages(res.data?.totalPages || 1);
        setTotalCount(res.data?.total || fetchedItems.length || 0);
      } catch (err) {
        toast.error(err.message || 'Failed to load account verification queue.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, filters, toast]
  );

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  // Quick Action: Single Approve
  const handleApprove = async (item) => {
    const id = item.id;
    const name = item.profiles?.full_name || 'User';
    setProcessingId(id);
    try {
      await adminService.reviewAccountVerification(id, { status: 'approved' }, accessToken);
      toast.success(`Verified account for "${name}". Credentials granted.`);
      fetchVerifications();
      fetchAuxiliaryStats();
    } catch (err) {
      toast.error(err.message || 'Failed to verify account');
    } finally {
      setProcessingId(null);
    }
  };

  // Open Rejection Dialog
  const openRejectDialog = (item, isBulk = false) => {
    setRejectionModal({
      isOpen: true,
      item,
      reason: '',
      isBulk,
    });
  };

  // Confirm Rejection
  const handleConfirmReject = async () => {
    if (rejectionModal.isBulk) {
      if (!selected.length) return;
      try {
        await adminService.bulkAccounts(selected, 'rejected', rejectionModal.reason || null, accessToken);
        toast.warning(`Rejected ${selected.length} account verifications.`);
        setSelected([]);
        setRejectionModal({ isOpen: false, item: null, reason: '', isBulk: false });
        fetchVerifications();
        fetchAuxiliaryStats();
      } catch (err) {
        toast.error(err.message || 'Failed to bulk reject accounts');
      }
    } else {
      if (!rejectionModal.item) return;
      const { id, profiles } = rejectionModal.item;
      const name = profiles?.full_name || 'User';
      setProcessingId(id);
      try {
        await adminService.reviewAccountVerification(
          id,
          { status: 'rejected', notes: rejectionModal.reason || null },
          accessToken
        );
        toast.warning(`Rejected account verification for "${name}".`);
        setRejectionModal({ isOpen: false, item: null, reason: '', isBulk: false });
        fetchVerifications();
        fetchAuxiliaryStats();
      } catch (err) {
        toast.error(err.message || 'Failed to reject account verification');
      } finally {
        setProcessingId(null);
      }
    }
  };

  // Quick Action: Bulk Approve
  const handleBulkApprove = async () => {
    if (!selected.length) return;
    try {
      await adminService.bulkAccounts(selected, 'approved', null, accessToken);
      toast.success(`Approved and verified ${selected.length} user accounts.`);
      setSelected([]);
      fetchVerifications();
      fetchAuxiliaryStats();
    } catch (err) {
      toast.error(err.message || 'Failed to bulk approve accounts');
    }
  };

  // View Documents Modal
  const handleViewDocs = async (item) => {
    const id = item.id;
    const name = item.profiles?.full_name || 'User Credentials';
    try {
      const res = await adminService.getVerificationDocuments(id, accessToken);
      setDocsModal({
        title: `${name} — Verification Documents`,
        id_url: res.data?.id_url || item.id_url,
        license_url: res.data?.license_url || item.license_url,
      });
    } catch (err) {
      toast.error(err.message || 'Failed to load user documents');
    }
  };

  // Selection Toggle
  const toggleSelect = (userId) => {
    setSelected((prev) => (prev.includes(userId) ? prev.filter((x) => x !== userId) : [...prev, userId]));
  };

  // Select/Deselect All on Current Page
  const toggleSelectAll = () => {
    const selectableIds = items
      .filter((v) => v.status === 'pending' && v.profiles?.id)
      .map((v) => v.profiles.id);
    const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.includes(id));

    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !selectableIds.includes(id)));
    } else {
      setSelected((prev) => Array.from(new Set([...prev, ...selectableIds])));
    }
  };

  const isAllSelected =
    items.length > 0 &&
    items.filter((v) => v.status === 'pending' && v.profiles?.id).length > 0 &&
    items
      .filter((v) => v.status === 'pending' && v.profiles?.id)
      .every((v) => selected.includes(v.profiles.id));

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 15,
      status: 'pending',
      sort: 'desc',
      role: '',
      search: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const hasActiveFilters =
    filters.role !== '' ||
    filters.search !== '' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '' ||
    filters.sort !== 'desc' ||
    filters.status !== 'pending';

  // Executive Top Action Bar
  const headerAction = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        radius="full"
        variant="secondary"
        onClick={() => navigate(ROUTES.ADMIN_APPROVE_LISTINGS)}
        startContent={<FileText size={14} strokeWidth={2} />}
      >
        <span>Review Listings</span>
        {stats?.pendingListings > 0 && (
          <span className="ml-1 rounded-full bg-ateneo-blue/15 px-1.5 py-0.2 text-[10px] font-bold text-ateneo-blue">
            {stats.pendingListings}
          </span>
        )}
      </Button>

      <Button
        size="sm"
        radius="full"
        variant="ghost"
        onClick={() => navigate(ROUTES.ADMIN_AUDIT_LOG)}
        startContent={<Award size={14} strokeWidth={2} />}
      >
        Audit Log
      </Button>

      <Button
        size="sm"
        radius="full"
        variant="ghost"
        isLoading={refreshing}
        onClick={() => {
          fetchVerifications(true);
          fetchAuxiliaryStats();
        }}
        startContent={!refreshing && <RefreshCw size={14} strokeWidth={2} className={refreshing ? 'animate-spin' : ''} />}
        title="Sync account requests"
      >
        {refreshing ? 'Syncing…' : 'Sync'}
      </Button>
    </div>
  );

  return (
    <AdminLayout
      title="Verify Accounts"
      subtitle="Review student Ateneo IDs, landlord government credentials, and business licenses"
      headerAction={headerAction}
    >
      <div className="space-y-6">
        {/* ==================================================================== */}
        {/* SECTION 1: EXECUTIVE KPI METRICS (COMPACT ~80px STANDARD) */}
        {/* ==================================================================== */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            label="Pending Review"
            value={stats?.pendingVerifications ?? stats?.accounts?.pending ?? items.filter((i) => i.status === 'pending').length ?? 0}
            icon={<Clock size={16} strokeWidth={2} />}
            variant="warning"
            subtext="identity queue"
          />

          <StatsCard
            label="Verified Accounts"
            value={stats?.accounts?.approved ?? 0}
            icon={<UserCheck size={16} strokeWidth={2} />}
            variant="success"
            subtext="authenticated users"
          />

          <StatsCard
            label="Rejected / Flagged"
            value={stats?.accounts?.rejected ?? 0}
            icon={<XCircle size={16} strokeWidth={2} />}
            variant="danger"
            subtext="invalid documents"
          />

          <StatsCard
            label="Total Submissions"
            value={
              (Number(stats?.accounts?.pending || 0) +
                Number(stats?.accounts?.approved || 0) +
                Number(stats?.accounts?.rejected || 0)) ||
              totalCount ||
              items.length ||
              0
            }
            icon={<Users size={16} strokeWidth={2} />}
            variant="default"
            subtext="registered profiles"
          />
        </section>

        {/* ==================================================================== */}
        {/* SECTION 2: RESPONSIVE SINGLE-ROW FILTERS & RIGHT-ALIGNED STATUS SELECTOR */}
        {/* ==================================================================== */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 border-b border-slate-200/80 pb-3.5">
          {/* Left Group: Inline Filter Inputs */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* 1. Search Input */}
            <div className="relative w-full sm:w-52">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
                placeholder="Search user or email…"
                className="h-10 w-full rounded-xl border border-slate-200/90 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-ateneo-blue focus:outline-hidden shadow-2xs"
              />
            </div>

            {/* 2. Role Selector Dropdown */}
            <div className="w-full sm:w-44">
              <select
                value={filters.role}
                onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value, page: 1 }))}
                className="h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-xs text-slate-800 focus:border-ateneo-blue focus:outline-hidden shadow-2xs"
              >
                <option value="">All account roles</option>
                <option value="student">Student (@addu.edu.ph)</option>
                <option value="owner">Property Owner</option>
              </select>
            </div>

            {/* 3 & 4. Date From & To */}
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
              <div className="w-full sm:w-36">
                <input
                  type="date"
                  value={filters.dateFrom}
                  title="Submitted from date"
                  onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value, page: 1 }))}
                  className="h-10 w-full rounded-xl border border-slate-200/90 bg-white px-2.5 text-xs text-slate-700 focus:border-ateneo-blue focus:outline-hidden shadow-2xs"
                />
              </div>

              <div className="w-full sm:w-36">
                <input
                  type="date"
                  value={filters.dateTo}
                  title="Submitted to date"
                  onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value, page: 1 }))}
                  className="h-10 w-full rounded-xl border border-slate-200/90 bg-white px-2.5 text-xs text-slate-700 focus:border-ateneo-blue focus:outline-hidden shadow-2xs"
                />
              </div>
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
                { id: 'pending', label: 'Pending Review', icon: Clock },
                { id: 'approved', label: 'Approved', icon: CheckCircle2 },
                { id: 'rejected', label: 'Rejected', icon: XCircle },
                { id: 'all', label: 'All Accounts', icon: Users },
              ].map((tab) => {
                const isActive = filters.status === tab.id;
                const IconComp = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, status: tab.id, page: 1 }))}
                    className={`inline-flex items-center gap-1.5 h-full rounded-xl px-3 text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                      isActive
                        ? 'bg-white text-ateneo-blue shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <IconComp size={13} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-ateneo-blue' : 'text-slate-400'} />
                    <span>{tab.label}</span>
                    {tab.id === 'pending' && (stats?.pendingVerifications > 0 || stats?.accounts?.pending > 0) && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                        {stats?.pendingVerifications || stats?.accounts?.pending}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 3: BATCH ACTION TOOLBAR (STICKY ON SELECTION) */}
        {/* ==================================================================== */}
        {selected.length > 0 && filters.status === 'pending' && (
          <div className="sticky top-20 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ateneo-blue/30 bg-blue-50/95 p-3.5 shadow-md backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-ateneo-blue hover:underline"
              >
                {isAllSelected ? (
                  <CheckSquare size={16} className="text-ateneo-blue" />
                ) : (
                  <Square size={16} className="text-slate-400" />
                )}
                <span>Select all ({items.filter((v) => v.status === 'pending' && v.profiles?.id).length})</span>
              </button>

              <Chip size="sm" variant="flat" color="primary" className="font-bold text-xs">
                {selected.length} {selected.length === 1 ? 'account' : 'accounts'} selected
              </Chip>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                radius="full"
                variant="primary"
                onClick={handleBulkApprove}
                startContent={<CheckCircle2 size={14} strokeWidth={2} />}
              >
                Approve Selected ({selected.length})
              </Button>

              <Button
                size="sm"
                radius="full"
                variant="danger"
                onClick={() => openRejectDialog(null, true)}
                startContent={<XCircle size={14} strokeWidth={2} />}
              >
                Reject Selected ({selected.length})
              </Button>

              <Button
                size="sm"
                radius="full"
                variant="ghost"
                onClick={() => setSelected([])}
                className="text-xs text-slate-500"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* SECTION 4: ACCOUNT VERIFICATION CARDS LIST */}
        {/* ==================================================================== */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 pb-2.5">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-slate-900">
                {filters.status === 'pending'
                  ? 'Pending Identity & Document Queue'
                  : filters.status === 'approved'
                  ? 'Verified Active Accounts'
                  : filters.status === 'rejected'
                  ? 'Rejected Submissions'
                  : 'All Registered Accounts'}
              </h2>
              <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                Inspect valid IDs, university enrollment credentials, and business licenses.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0 self-start sm:self-auto pt-0.5 sm:pt-0">
              <span>Sort:</span>
              <button
                type="button"
                onClick={() => setFilters((f) => ({ ...f, sort: f.sort === 'desc' ? 'asc' : 'desc', page: 1 }))}
                className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-ateneo-blue"
              >
                <ArrowUpDown size={13} />
                <span>{filters.sort === 'desc' ? 'Newest First' : 'Oldest First'}</span>
              </button>
            </div>
          </div>

          {loading ? (
            <PageSkeleton variant="table" rows={4} cols={4} />
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center shadow-xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <UserCheck size={24} />
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-900">No verification requests found</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                No user accounts match the selected status or filtering criteria.
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
            <div className="space-y-4">
              {items.map((v) => {
                const profileId = v.profiles?.id || v.user_id;
                const isSelected = profileId && selected.includes(profileId);
                const isPending = v.status === 'pending';
                const badgeVariant =
                  v.status === 'approved' ? 'verified' : v.status === 'rejected' ? 'danger' : 'pending';
                const isStudent = v.profiles?.role === 'student' || v.role === 'student';
                const isAdDU = v.profiles?.email?.endsWith('@addu.edu.ph');
                const fullName = v.profiles?.full_name || 'Applicant';
                const email = v.profiles?.email || 'No email registered';
                const hasIdDoc = Boolean(v.id_url);
                const hasLicenseDoc = Boolean(v.license_url);

                return (
                  <Card
                    key={v.id}
                    shadow="sm"
                    className={`rounded-2xl border transition-all duration-200 bg-white overflow-hidden ${
                      isSelected
                        ? 'border-ateneo-blue/60 ring-2 ring-ateneo-blue/20 bg-blue-50/20'
                        : 'border-slate-200/90 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <CardBody className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        {/* Left Info Container */}
                        <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                          {/* Selection Checkbox */}
                          {isPending && profileId && (
                            <div className="pt-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => toggleSelect(profileId)}
                                className="text-slate-400 hover:text-ateneo-blue transition-colors"
                              >
                                {isSelected ? (
                                  <CheckSquare size={18} className="text-ateneo-blue" />
                                ) : (
                                  <Square size={18} />
                                )}
                              </button>
                            </div>
                          )}

                          {/* Avatar Initials Badge */}
                          <Avatar
                            size="md"
                            name={fullName}
                            className="h-12 w-12 text-sm font-bold bg-ateneo-blue text-white shrink-0"
                          />

                          {/* Details Metadata */}
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                                {fullName}
                              </h3>
                              {isAdDU && (
                                <Chip size="sm" variant="flat" color="primary" className="text-[10px] font-bold h-5 px-1.5">
                                  @addu.edu.ph
                                </Chip>
                              )}
                              <Chip
                                size="sm"
                                variant="flat"
                                className="font-semibold text-[11px] text-slate-600 bg-slate-100"
                              >
                                {ROLE_LABELS[v.profiles?.role] || v.profiles?.role || (isStudent ? 'Student' : 'Property Owner')}
                              </Chip>
                              <Badge variant={badgeVariant}>{v.status}</Badge>
                            </div>

                            <p className="flex items-center gap-1.5 text-xs text-slate-600">
                              <Mail size={13} className="text-slate-400 shrink-0" />
                              <span className="truncate">{email}</span>
                            </p>

                            {/* Verification Documents & Timestamp */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-semibold text-slate-400">Attached:</span>
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                                  <FileText size={11} className="text-ateneo-blue" />
                                  Government / Student ID
                                </span>
                                {hasLicenseDoc && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                                    <ShieldCheck size={11} className="text-emerald-600" />
                                    Business Permit
                                  </span>
                                )}
                              </div>

                              {v.created_at && (
                                <div className="flex items-center gap-1 text-slate-400">
                                  <Calendar size={12} />
                                  <span>Submitted {new Date(v.created_at).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Action Buttons */}
                        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                          <Button
                            size="sm"
                            radius="full"
                            variant="ghost"
                            onClick={() => handleViewDocs(v)}
                            startContent={<Eye size={14} strokeWidth={2} />}
                            className="text-xs"
                          >
                            Inspect Documents
                          </Button>

                          {isPending && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                radius="full"
                                variant="primary"
                                isLoading={processingId === v.id}
                                onClick={() => handleApprove(v)}
                                startContent={processingId !== v.id && <CheckCircle2 size={14} strokeWidth={2} />}
                              >
                                Approve ID
                              </Button>

                              <Button
                                size="sm"
                                radius="full"
                                variant="danger"
                                disabled={processingId === v.id}
                                onClick={() => openRejectDialog(v)}
                                startContent={<XCircle size={14} strokeWidth={2} />}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}

          {/* ==================================================================== */}
          {/* SECTION 5: PAGINATION & RESULTS COUNTER */}
          {/* ==================================================================== */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 font-normal">
                Showing page <span className="font-semibold text-slate-800">{filters.page}</span> of{' '}
                <span className="font-semibold text-slate-800">{totalPages}</span> ({totalCount} total applications)
              </p>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  radius="full"
                  variant="ghost"
                  disabled={filters.page <= 1}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                >
                  Previous
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - filters.page) <= 1)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-xs text-slate-400">…</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setFilters((f) => ({ ...f, page: p }))}
                        className={`h-7 w-7 rounded-full text-xs font-semibold transition-all ${
                          filters.page === p
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
                  disabled={filters.page >= totalPages}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Document Viewer Lightbox Modal */}
      {docsModal && (
        <DocumentViewer
          title={docsModal.title}
          idUrl={docsModal.id_url}
          licenseUrl={docsModal.license_url}
          onClose={() => setDocsModal(null)}
        />
      )}

      {/* Rejection Remarks Modal */}
      {rejectionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <AlertTriangle size={20} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {rejectionModal.isBulk
                    ? `Reject ${selected.length} Account Applications`
                    : `Reject Account Verification`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {rejectionModal.isBulk
                    ? 'Provide a rejection reason for all selected applicants.'
                    : `Specify rejection remarks for "${rejectionModal.item?.profiles?.full_name || 'Applicant'}".`}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold text-slate-700">Administrative Rejection Reason</label>
              <textarea
                value={rejectionModal.reason}
                onChange={(e) => setRejectionModal((m) => ({ ...m, reason: e.target.value }))}
                placeholder="e.g. Blurry ID photo, expired institutional ID, or invalid business permit document."
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-ateneo-blue focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                size="sm"
                radius="full"
                variant="ghost"
                onClick={() => setRejectionModal({ isOpen: false, item: null, reason: '', isBulk: false })}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                radius="full"
                variant="danger"
                isLoading={processingId === rejectionModal.item?.id}
                onClick={handleConfirmReject}
                startContent={processingId !== rejectionModal.item?.id && <XCircle size={14} strokeWidth={2} />}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
