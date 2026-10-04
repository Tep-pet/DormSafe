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
  Star,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Building2,
  User,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Flag,
  Check,
  ExternalLink,
  Sparkles,
  Award,
  AlertTriangle,
  Clock,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Pagination } from '../../components/common/Pagination';
import { Select } from '../../components/common/Input';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { adminService } from '../../services/adminService';
import { ROUTES } from '../../constants/routes';
import { ITEMS_PER_PAGE } from '../../constants/pagination';

export function ModerateReviewsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [reviews, setReviews] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Filters & Pagination State
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [ratingFilter, setRatingFilter] = useState('');
  const [activeQueueTab, setActiveQueueTab] = useState('all'); // 'all' | 'reviews' | 'reports'
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reportsPage, setReportsPage] = useState(1);

  // Sync search state with URL search param
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== search) {
      setSearch(q);
      setReviewsPage(1);
      setReportsPage(1);
    }
  }, [searchParams]);

  // Load Data
  const loadData = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const [reviewsRes, reportsRes] = await Promise.all([
          adminService.getPendingReviews(accessToken),
          adminService.getPendingReports(accessToken),
        ]);
        setReviews(reviewsRes.data || []);
        setReports(reportsRes.data || []);
      } catch (err) {
        toast.error(err.message || 'Failed to load reviews and safety reports.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, toast]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Moderate Review (Approve or Reject)
  const handleModerateReview = async (id, status, propertyName) => {
    setProcessingId(id);
    try {
      await adminService.moderateReview(id, status, accessToken);
      if (status === 'approved') {
        toast.success(`Approved review for "${propertyName || 'Property'}".`);
      } else {
        toast.warning(`Rejected review for "${propertyName || 'Property'}".`);
      }
      loadData();
    } catch (err) {
      toast.error(err.message || `Failed to ${status} review.`);
    } finally {
      setProcessingId(null);
    }
  };

  // Dismiss / Mark Report as Reviewed
  const handleDismissReport = async (id, propertyName) => {
    setProcessingId(id);
    try {
      await adminService.dismissReport(id, accessToken);
      toast.info(`Marked safety report for "${propertyName || 'Property'}" as reviewed.`);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to dismiss report.');
    } finally {
      setProcessingId(null);
    }
  };

  // Metric Computations
  const totalActionItems = reviews.length + reports.length;
  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // Rating filter
      if (ratingFilter) {
        const rVal = Number(r.rating);
        if (ratingFilter === '5' && rVal !== 5) return false;
        if (ratingFilter === '4' && rVal !== 4) return false;
        if (ratingFilter === 'low' && rVal > 3) return false;
      }

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesUser = (r.profiles?.full_name || '').toLowerCase().includes(q);
        const matchesEmail = (r.profiles?.email || '').toLowerCase().includes(q);
        const matchesProperty = (r.properties?.name || '').toLowerCase().includes(q);
        const matchesComment = (r.comment || '').toLowerCase().includes(q);
        if (!matchesUser && !matchesEmail && !matchesProperty && !matchesComment) return false;
      }

      return true;
    });
  }, [reviews, ratingFilter, search]);

  // Filtered Reports
  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesUser = (rep.profiles?.full_name || '').toLowerCase().includes(q);
        const matchesEmail = (rep.profiles?.email || '').toLowerCase().includes(q);
        const matchesProperty = (rep.properties?.name || '').toLowerCase().includes(q);
        const matchesReason = (rep.reason || '').toLowerCase().includes(q);
        if (!matchesUser && !matchesEmail && !matchesProperty && !matchesReason) return false;
      }

      return true;
    });
  }, [reports, search]);

  // Pagination Calculations
  const totalReviewPages = Math.max(1, Math.ceil(filteredReviews.length / ITEMS_PER_PAGE));
  const paginatedReviews = useMemo(() => {
    const start = (reviewsPage - 1) * ITEMS_PER_PAGE;
    return filteredReviews.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReviews, reviewsPage]);

  const totalReportPages = Math.max(1, Math.ceil(filteredReports.length / ITEMS_PER_PAGE));
  const paginatedReports = useMemo(() => {
    const start = (reportsPage - 1) * ITEMS_PER_PAGE;
    return filteredReports.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReports, reportsPage]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setRatingFilter('');
    setReviewsPage(1);
    setReportsPage(1);
    setSearchParams({});
  };

  const hasActiveFilters = search !== '' || ratingFilter !== '';

  // Render Vector Star Rating
  const renderStars = (rating) => {
    const num = Math.max(0, Math.min(5, Number(rating) || 0));
    return (
      <div className="flex items-center gap-0.5" aria-label={`${num} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={13}
            className={
              star <= num
                ? 'fill-amber-400 text-amber-400'
                : 'fill-slate-100 text-slate-300'
            }
          />
        ))}
      </div>
    );
  };

  // Executive Top Action Bar
  const headerAction = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        radius="full"
        variant="secondary"
        onClick={() => navigate(ROUTES.ADMIN_APPROVE_LISTINGS)}
        startContent={<Building2 size={14} strokeWidth={2} />}
      >
        Approve Listings
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
        onClick={() => loadData(true)}
        startContent={!refreshing && <RefreshCw size={14} strokeWidth={2} className={refreshing ? 'animate-spin' : ''} />}
        title="Sync review and report queues"
      >
        {refreshing ? 'Syncing…' : 'Sync'}
      </Button>
    </div>
  );

  return (
    <AdminLayout
      title="Reviews & Reports"
      subtitle="Moderation queue for tenant feedback, rating audits, and property safety reports"
      headerAction={headerAction}
    >
      <div className="space-y-6">
        {/* ==================================================================== */}
        {/* SECTION 1: EXECUTIVE KPI METRICS (COMPACT ~80px STANDARD) */}
        {/* ==================================================================== */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            label="Total Moderation Queue"
            value={totalActionItems}
            icon={<AlertTriangle size={16} strokeWidth={2} />}
            variant={totalActionItems > 0 ? 'warning' : 'default'}
            subtext="items requiring review"
          />

          <StatsCard
            label="Pending Reviews"
            value={reviews.length}
            icon={<MessageSquare size={16} strokeWidth={2} />}
            variant={reviews.length > 0 ? 'warning' : 'default'}
            subtext="student feedback submissions"
          />

          <StatsCard
            label="Listing Reports"
            value={reports.length}
            icon={<ShieldAlert size={16} strokeWidth={2} />}
            variant={reports.length > 0 ? 'danger' : 'default'}
            subtext="safety & policy flags"
          />

          <StatsCard
            label="Average Queue Rating"
            value={reviews.length > 0 ? `${avgRating} / 5` : '—'}
            icon={<Star size={16} strokeWidth={2} />}
            variant="default"
            subtext="pending review benchmark"
          />
        </section>

        {/* ==================================================================== */}
        {/* SECTION 2: RESPONSIVE SINGLE-ROW FILTERS & RIGHT-ALIGNED QUEUE SELECTOR */}
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
                placeholder="Search dorm, student, or keyword…"
                className="h-10 w-full rounded-xl border border-slate-200/90 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-ateneo-blue focus:outline-hidden shadow-2xs"
              />
            </div>

            {/* 2. Star Rating Dropdown (only relevant for reviews) */}
            <div className="w-full sm:w-44">
              <Select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
              >
                <option value="">All star ratings</option>
                <option value="5">5 Stars (Excellent)</option>
                <option value="4">4 Stars (Good)</option>
                <option value="low">1-3 Stars (Critical)</option>
              </Select>
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

          {/* Right Group: Queue Selector on the Right Side Edge */}
          <div className="w-full lg:w-auto overflow-x-auto no-scrollbar py-0.5">
            <div className="inline-flex min-w-full sm:min-w-0 items-center gap-1 p-1 h-10 rounded-2xl bg-slate-100/90 border border-slate-200/70 shrink-0">
              {[
                { id: 'all', label: 'All Queues', icon: AlertTriangle, count: totalActionItems },
                { id: 'reviews', label: 'Student Reviews', icon: MessageSquare, count: reviews.length },
                { id: 'reports', label: 'Safety Reports', icon: ShieldAlert, count: reports.length },
              ].map((tab) => {
                const isActive = activeQueueTab === tab.id;
                const IconComp = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveQueueTab(tab.id);
                      setReviewsPage(1);
                      setReportsPage(1);
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
        {/* SECTION 3: MODERATION WORKSPACE (DUAL COLUMNS OR FOCUSED TAB) */}
        {/* ==================================================================== */}
        {loading ? (
          <PageSkeleton variant="dashboard" count={2} />
        ) : totalActionItems === 0 ? (
          <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="mt-3 text-base font-semibold text-slate-900">Moderation queue is all clear!</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no student reviews or safety reports pending administrative moderation.
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-6 ${
              activeQueueTab === 'all' ? 'lg:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {/* ================================================================ */}
            {/* COLUMN A: PENDING STUDENT REVIEWS */}
            {/* ================================================================ */}
            {(activeQueueTab === 'all' || activeQueueTab === 'reviews') && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-ateneo-blue">
                      <MessageSquare size={15} strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-semibold text-slate-900">
                        Pending Student Reviews ({filteredReviews.length})
                      </h2>
                      <p className="text-xs text-slate-500 font-normal mt-0.5">
                        Verify student ratings and feedback compliance.
                      </p>
                    </div>
                  </div>
                </div>

                {filteredReviews.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200/90 bg-white p-8 text-center text-xs text-slate-500 space-y-1.5 shadow-2xs">
                    <CheckCircle2 size={20} className="mx-auto text-emerald-500" />
                    <p className="font-semibold text-slate-700">No reviews pending moderation</p>
                    {hasActiveFilters && <p>Try clearing your filter criteria.</p>}
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {paginatedReviews.map((rev) => {
                      const isAdDU = rev.profiles?.email?.endsWith('@addu.edu.ph');
                      const isProcessing = processingId === rev.id;

                      return (
                        <Card
                          key={rev.id}
                          shadow="sm"
                          className="rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200 overflow-hidden"
                        >
                          <CardBody className="p-4 sm:p-5 space-y-3.5">
                            {/* Header: User & Target Property */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <Avatar
                                  size="sm"
                                  name={rev.profiles?.full_name || 'Student'}
                                  className="h-9 w-9 text-xs font-bold bg-ateneo-blue text-white shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h3 className="text-xs font-bold text-slate-900 truncate">
                                      {rev.profiles?.full_name || 'Anonymous Student'}
                                    </h3>
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
                                  <p className="text-[11px] text-slate-500 truncate">
                                    {rev.profiles?.email || 'No email provided'}
                                  </p>
                                </div>
                              </div>

                              {/* Star Rating Display */}
                              <div className="flex flex-col items-end shrink-0">
                                {renderStars(rev.rating)}
                                <span className="text-[10px] font-bold text-amber-700 mt-0.5">
                                  {rev.rating} / 5.0
                                </span>
                              </div>
                            </div>

                            {/* Property Identifier */}
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-100">
                              <Building2 size={13} className="text-ateneo-blue shrink-0" />
                              <span className="truncate">{rev.properties?.name || 'Property'}</span>
                              {rev.properties?.address && (
                                <span className="text-[11px] font-normal text-slate-400 truncate">
                                  · {rev.properties.address}
                                </span>
                              )}
                            </div>

                            {/* Review Comment Quote */}
                            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs text-slate-700 italic leading-relaxed">
                              "{rev.comment || 'No written review text provided.'}"
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                              <span className="text-[11px] text-slate-400">
                                {rev.created_at
                                  ? new Date(rev.created_at).toLocaleDateString()
                                  : 'Recent'}
                              </span>

                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  radius="full"
                                  variant="danger"
                                  disabled={isProcessing}
                                  onClick={() =>
                                    handleModerateReview(rev.id, 'rejected', rev.properties?.name)
                                  }
                                  startContent={<XCircle size={13} strokeWidth={2} />}
                                >
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  radius="full"
                                  variant="success"
                                  isLoading={isProcessing}
                                  onClick={() =>
                                    handleModerateReview(rev.id, 'approved', rev.properties?.name)
                                  }
                                  startContent={!isProcessing && <CheckCircle2 size={13} strokeWidth={2} />}
                                >
                                  Approve
                                </Button>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      );
                    })}

                    <Pagination
                      page={reviewsPage}
                      totalPages={totalReviewPages}
                      onPageChange={setReviewsPage}
                      totalItems={filteredReviews.length}
                      itemsPerPage={ITEMS_PER_PAGE}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ================================================================ */}
            {/* COLUMN B: PENDING LISTING SAFETY REPORTS */}
            {/* ================================================================ */}
            {(activeQueueTab === 'all' || activeQueueTab === 'reports') && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                      <ShieldAlert size={15} strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-semibold text-slate-900">
                        Listing Safety Reports ({filteredReports.length})
                      </h2>
                      <p className="text-xs text-slate-500 font-normal mt-0.5">
                        Inspect user complaints and policy violations.
                      </p>
                    </div>
                  </div>
                </div>

                {filteredReports.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200/90 bg-white p-8 text-center text-xs text-slate-500 space-y-1.5 shadow-2xs">
                    <CheckCircle2 size={20} className="mx-auto text-emerald-500" />
                    <p className="font-semibold text-slate-700">No pending safety reports</p>
                    {hasActiveFilters && <p>Try clearing your filter criteria.</p>}
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {paginatedReports.map((rep) => {
                      const isProcessing = processingId === rep.id;

                      return (
                        <Card
                          key={rep.id}
                          shadow="sm"
                          className="rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200 overflow-hidden"
                        >
                          <CardBody className="p-4 sm:p-5 space-y-3.5">
                            {/* Header: Reported Property & Reporter */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 shrink-0">
                                  <Flag size={16} strokeWidth={2} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h3 className="text-xs font-bold text-slate-900 truncate">
                                      {rep.properties?.name || 'Reported Property'}
                                    </h3>
                                    <Chip
                                      size="sm"
                                      variant="flat"
                                      color="danger"
                                      className="text-[9px] font-bold h-4 px-1"
                                    >
                                      Flagged
                                    </Chip>
                                  </div>
                                  <p className="text-[11px] text-slate-500 truncate">
                                    Reported by: <span className="font-medium text-slate-700">{rep.profiles?.full_name || 'User'}</span> ({rep.profiles?.email || 'No email'})
                                  </p>
                                </div>
                              </div>

                              <span className="text-[10px] text-slate-400 shrink-0">
                                {rep.created_at
                                  ? new Date(rep.created_at).toLocaleDateString()
                                  : 'Recent'}
                              </span>
                            </div>

                            {/* Report Reason Highlight Box */}
                            <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-xs text-rose-900 leading-relaxed space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                                Reason for Flag:
                              </span>
                              <p className="font-medium">
                                {rep.reason || 'No specific report reason provided.'}
                              </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                              {rep.properties?.id ? (
                                <Link
                                  to={`${ROUTES.ADMIN_APPROVE_LISTINGS}/${rep.properties.id}`}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-ateneo-blue hover:underline"
                                >
                                  <span>Inspect Dorm Listing</span>
                                  <ExternalLink size={11} />
                                </Link>
                              ) : (
                                <span />
                              )}

                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  radius="full"
                                  variant="secondary"
                                  isLoading={isProcessing}
                                  onClick={() =>
                                    handleDismissReport(rep.id, rep.properties?.name)
                                  }
                                  startContent={!isProcessing && <ShieldCheck size={13} strokeWidth={2} />}
                                >
                                  Mark Reviewed
                                </Button>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      );
                    })}

                    <Pagination
                      page={reportsPage}
                      totalPages={totalReportPages}
                      onPageChange={setReportsPage}
                      totalItems={filteredReports.length}
                      itemsPerPage={ITEMS_PER_PAGE}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
