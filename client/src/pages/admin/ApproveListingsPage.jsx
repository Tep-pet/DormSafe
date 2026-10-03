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
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Building2,
  UserCheck,
  Award,
  RefreshCw,
  Filter,
  Calendar,
  ArrowUpDown,
  Eye,
  MapPin,
  Clock,
  RotateCcw,
  CheckSquare,
  Square,
  ArrowRight,
  ShieldCheck,
  User,
  Phone,
  Mail,
  Home,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { adminService } from '../../services/adminService';
import { formatPrice } from '../../utils/formatPrice';
import { ROUTES } from '../../constants/routes';
import { PROPERTY_TYPE_LABELS } from '../../constants/propertyTypes';

export function ApproveListingsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 15,
    sort: 'desc',
    status: 'pending',
    propertyId: '',
    search: '',
    dateFrom: '',
    dateTo: '',
  });

  const [selected, setSelected] = useState([]);
  const [rejectionModal, setRejectionModal] = useState({
    isOpen: false,
    listing: null,
    reason: '',
    isBulk: false,
  });

  // Clear selection on page/status tab switch
  useEffect(() => {
    setSelected([]);
  }, [filters.page, filters.status]);

  // Load properties list for filter dropdown & system stats
  const fetchAuxiliaryData = useCallback(async () => {
    try {
      const [propsRes, statsRes] = await Promise.all([
        adminService.getAllProperties(accessToken).catch(() => ({ data: [] })),
        adminService.getDashboardStats(accessToken).catch(() => ({ data: null })),
      ]);
      setProperties(propsRes.data || []);
      setStats(statsRes.data || null);
    } catch (err) {
      console.error('Failed to load auxiliary data:', err);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchAuxiliaryData();
  }, [fetchAuxiliaryData]);

  // Main Listings Fetch
  const fetchListings = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await adminService.getPendingListings(accessToken, {
          page: filters.page,
          limit: filters.limit,
          sort: filters.sort,
          status: filters.status,
          propertyId: filters.propertyId || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          search: filters.search || undefined,
        });

        setListings(res.data?.items || []);
        setTotalPages(res.data?.totalPages || 1);
        setTotalCount(res.data?.total || res.data?.items?.length || 0);
      } catch (err) {
        toast.error(err.message || 'Failed to fetch listings. Please try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, filters, toast]
  );

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Quick Action: Single Approve
  const handleApprove = async (id, name) => {
    setProcessingId(id);
    try {
      await adminService.approveListing(id, accessToken);
      toast.success(`Approved listing "${name || 'Property'}". It is now active.`);
      fetchListings();
      fetchAuxiliaryData();
    } catch (err) {
      toast.error(err.message || 'Failed to approve listing');
    } finally {
      setProcessingId(null);
    }
  };

  // Open Rejection Dialog
  const openRejectDialog = (listing, isBulk = false) => {
    setRejectionModal({
      isOpen: true,
      listing,
      reason: '',
      isBulk,
    });
  };

  // Confirm Rejection
  const handleConfirmReject = async () => {
    if (rejectionModal.isBulk) {
      if (!selected.length) return;
      try {
        await adminService.bulkListings(selected, 'reject', accessToken);
        toast.warning(`Rejected ${selected.length} listings.`);
        setSelected([]);
        setRejectionModal({ isOpen: false, listing: null, reason: '', isBulk: false });
        fetchListings();
        fetchAuxiliaryData();
      } catch (err) {
        toast.error(err.message || 'Failed to bulk reject listings');
      }
    } else {
      if (!rejectionModal.listing) return;
      const { id, name } = rejectionModal.listing;
      setProcessingId(id);
      try {
        await adminService.rejectListing(id, accessToken);
        toast.warning(`Rejected listing "${name || 'Property'}".`);
        setRejectionModal({ isOpen: false, listing: null, reason: '', isBulk: false });
        fetchListings();
        fetchAuxiliaryData();
      } catch (err) {
        toast.error(err.message || 'Failed to reject listing');
      } finally {
        setProcessingId(null);
      }
    }
  };

  // Quick Action: Bulk Approve
  const handleBulkApprove = async () => {
    if (!selected.length) return;
    try {
      await adminService.bulkListings(selected, 'approve', accessToken);
      toast.success(`Approved ${selected.length} listings successfully.`);
      setSelected([]);
      fetchListings();
      fetchAuxiliaryData();
    } catch (err) {
      toast.error(err.message || 'Failed to bulk approve listings');
    }
  };

  // Selection Toggle
  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Select/Deselect All on Current Page
  const toggleSelectAll = () => {
    const selectableIds = listings.filter((p) => p.status === 'pending').map((p) => p.id);
    const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.includes(id));

    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !selectableIds.includes(id)));
    } else {
      setSelected((prev) => Array.from(new Set([...prev, ...selectableIds])));
    }
  };

  const isAllSelected =
    listings.length > 0 &&
    listings.filter((p) => p.status === 'pending').length > 0 &&
    listings
      .filter((p) => p.status === 'pending')
      .every((p) => selected.includes(p.id));

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 15,
      sort: 'desc',
      status: 'pending',
      propertyId: '',
      search: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const hasActiveFilters =
    filters.propertyId !== '' ||
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
        onClick={() => navigate(ROUTES.ADMIN_VERIFY_ACCOUNTS)}
        startContent={<UserCheck size={14} strokeWidth={2} />}
      >
        <span>Verify Accounts</span>
        {stats?.pendingVerifications > 0 && (
          <span className="ml-1 rounded-full bg-ateneo-blue/15 px-1.5 py-0.2 text-[10px] font-bold text-ateneo-blue">
            {stats.pendingVerifications}
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
          fetchListings(true);
          fetchAuxiliaryData();
        }}
        startContent={!refreshing && <RefreshCw size={14} strokeWidth={2} className={refreshing ? 'animate-spin' : ''} />}
        title="Sync listing requests"
      >
        {refreshing ? 'Syncing…' : 'Sync'}
      </Button>
    </div>
  );

  return (
    <AdminLayout
      title="Approve Listings"
      subtitle="Review dormitory submissions, landlord permits, and campus zoning approvals"
      headerAction={headerAction}
    >
      <div className="space-y-6">
        {/* ==================================================================== */}
        {/* SECTION 1: EXECUTIVE KPI METRICS (COMPACT ~80px STANDARD) */}
        {/* ==================================================================== */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            label="Pending Review"
            value={stats?.pendingListings ?? listings.filter((l) => l.status === 'pending').length ?? 0}
            icon={<Clock size={16} strokeWidth={2} />}
            variant="warning"
            subtext="housing queue"
          />

          <StatsCard
            label="Approved Listings"
            value={stats?.approvedListings ?? properties.filter((p) => p.status === 'approved').length ?? 0}
            icon={<CheckCircle2 size={16} strokeWidth={2} />}
            variant="success"
            subtext="campus verified"
          />

          <StatsCard
            label="Rejected / Flagged"
            value={stats?.rejectedListings ?? properties.filter((p) => p.status === 'rejected').length ?? 0}
            icon={<XCircle size={16} strokeWidth={2} />}
            variant="danger"
            subtext="ineligible units"
          />

          <StatsCard
            label="Total Properties"
            value={stats?.totalListings ?? properties.length ?? 0}
            icon={<Building2 size={16} strokeWidth={2} />}
            variant="default"
            subtext="registered dorms"
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
            <div className="relative w-full sm:w-52">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
                placeholder="Search dorm or address…"
                className="h-10 w-full rounded-xl border border-slate-200/90 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-ateneo-blue focus:outline-hidden shadow-2xs"
              />
            </div>

            {/* 2. Property Selector Dropdown */}
            <div className="w-full sm:w-44">
              <select
                value={filters.propertyId}
                onChange={(e) => setFilters((f) => ({ ...f, propertyId: e.target.value, page: 1 }))}
                className="h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-xs text-slate-800 focus:border-ateneo-blue focus:outline-hidden shadow-2xs"
              >
                <option value="">All properties</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
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
                { id: 'all', label: 'All Listings', icon: Building2 },
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
                    {tab.id === 'pending' && stats?.pendingListings > 0 && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                        {stats.pendingListings}
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
                <span>Select all ({listings.filter((p) => p.status === 'pending').length})</span>
              </button>

              <Chip size="sm" variant="flat" color="primary" className="font-bold text-xs">
                {selected.length} {selected.length === 1 ? 'listing' : 'listings'} selected
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
        {/* SECTION 4: LISTING REVIEW CARDS LIST */}
        {/* ==================================================================== */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 pb-2.5">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-slate-900">
                {filters.status === 'pending'
                  ? 'Pending Listings Queue'
                  : filters.status === 'approved'
                  ? 'Verified Active Listings'
                  : filters.status === 'rejected'
                  ? 'Rejected Submissions'
                  : 'All Registered Listings'}
              </h2>
              <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                Inspect floorplans, rental prices, landlord identity, and physical zoning perimeter.
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
          ) : listings.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center shadow-xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Building2 size={24} />
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-900">No listings found</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                No property listings match the selected filters or status criteria.
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
              {listings.map((p) => {
                const isSelected = selected.includes(p.id);
                const isPending = p.status === 'pending';
                const badgeVariant =
                  p.status === 'approved' ? 'verified' : p.status === 'rejected' ? 'danger' : 'pending';
                const hasCover = p.room_images && p.room_images.length > 0;
                const coverUrl = hasCover ? p.room_images[0] : null;

                return (
                  <Card
                    key={p.id}
                    shadow="sm"
                    className={`rounded-2xl border transition-all duration-200 bg-white overflow-hidden ${
                      isSelected
                        ? 'border-ateneo-blue/60 ring-2 ring-ateneo-blue/20 bg-blue-50/20'
                        : 'border-slate-200/90 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <CardBody className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        {/* Left Info Container */}
                        <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                          {/* Selection Checkbox */}
                          {isPending && (
                            <div className="pt-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => toggleSelect(p.id)}
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

                          {/* Image Thumbnail Preview */}
                          <div className="relative h-20 w-24 sm:h-24 sm:w-32 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                            {coverUrl ? (
                              <img
                                src={coverUrl}
                                alt={p.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                                <Home size={22} />
                                <span className="text-[10px] font-medium mt-1">No Image</span>
                              </div>
                            )}
                            {hasCover && p.room_images.length > 1 && (
                              <span className="absolute bottom-1 right-1 rounded-md bg-slate-900/70 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                                +{p.room_images.length - 1} photos
                              </span>
                            )}
                          </div>

                          {/* Details Metadata */}
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                to={`/admin/listings/${p.id}`}
                                className="text-base font-bold text-slate-900 hover:text-ateneo-blue transition-colors line-clamp-1"
                              >
                                {p.name}
                              </Link>
                              <Chip size="sm" variant="flat" className="font-semibold text-[11px] text-slate-600 bg-slate-100">
                                {PROPERTY_TYPE_LABELS[p.type] || p.type || 'Dormitory'}
                              </Chip>
                              <Badge variant={badgeVariant}>{p.status}</Badge>
                            </div>

                            <p className="flex items-center gap-1.5 text-xs text-slate-600">
                              <MapPin size={13} className="text-slate-400 shrink-0" />
                              <span className="truncate">{p.address}</span>
                            </p>

                            {/* Owner Profile & Submission Date */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-slate-500">
                              {p.profiles && (
                                <div className="flex items-center gap-1.5">
                                  <Avatar
                                    size="xs"
                                    name={p.profiles.full_name || 'Owner'}
                                    className="h-4 w-4 text-[9px] bg-ateneo-blue text-white"
                                  />
                                  <span className="font-medium text-slate-700">
                                    {p.profiles.full_name || 'Landlord'}
                                  </span>
                                  {p.profiles.email && (
                                    <span className="text-slate-400">({p.profiles.email})</span>
                                  )}
                                </div>
                              )}

                              {p.created_at && (
                                <div className="flex items-center gap-1 text-slate-400">
                                  <Calendar size={12} />
                                  <span>Submitted {new Date(p.created_at).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Action Buttons */}
                        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                          <Link to={`/admin/listings/${p.id}`}>
                            <Button
                              size="sm"
                              radius="full"
                              variant="ghost"
                              startContent={<Eye size={14} strokeWidth={2} />}
                              className="text-xs"
                            >
                              Inspect Details
                            </Button>
                          </Link>

                          {isPending && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                radius="full"
                                variant="primary"
                                isLoading={processingId === p.id}
                                onClick={() => handleApprove(p.id, p.name)}
                                startContent={processingId !== p.id && <CheckCircle2 size={14} strokeWidth={2} />}
                              >
                                Approve
                              </Button>

                              <Button
                                size="sm"
                                radius="full"
                                variant="danger"
                                disabled={processingId === p.id}
                                onClick={() => openRejectDialog(p)}
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
                <span className="font-semibold text-slate-800">{totalPages}</span> ({totalCount} total listings)
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

      {/* ==================================================================== */}
      {/* REJECTION REASON MODAL DIALOG */}
      {/* ==================================================================== */}
      {rejectionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <AlertTriangle size={20} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {rejectionModal.isBulk ? 'Reject Selected Listings' : 'Reject Property Listing'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {rejectionModal.isBulk
                    ? `Are you sure you want to reject ${selected.length} listings?`
                    : `Provide rejection reason for "${rejectionModal.listing?.name}".`}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Administrative Rejection Remarks (Optional)
              </label>
              <textarea
                value={rejectionModal.reason}
                onChange={(e) => setRejectionModal((m) => ({ ...m, reason: e.target.value }))}
                placeholder="e.g. Incomplete business permit, insufficient egress fire safety, or invalid campus proximity."
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-ateneo-blue focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                size="sm"
                radius="full"
                variant="ghost"
                onClick={() => setRejectionModal({ isOpen: false, listing: null, reason: '', isBulk: false })}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                radius="full"
                variant="danger"
                onClick={handleConfirmReject}
                startContent={<XCircle size={14} strokeWidth={2} />}
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
