import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  Chip,
  Progress,
  Avatar,
  Tooltip,
} from '@heroui/react';
import {
  FileText,
  UserCheck,
  Star,
  Flag,
  Clock,
  Wrench,
  MapPin,
  CheckCircle2,
  XCircle,
  Award,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Building2,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { Button } from '../../components/common/Button';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { adminService } from '../../services/adminService';
import { formatPrice } from '../../utils/formatPrice';
import { ROUTES } from '../../constants/routes';
import { PROPERTY_TYPE_LABELS } from '../../constants/propertyTypes';

export function AdminDashboardPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [campus, setCampus] = useState(null);
  const [pendingListings, setPendingListings] = useState([]);
  const [pendingAccounts, setPendingAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [statsRes, healthRes, campusRes, listingsRes, accountsRes] =
        await Promise.all([
          adminService.getDashboardStats(accessToken),
          adminService.getSystemHealth(accessToken),
          adminService.getCampusStats(accessToken),
          adminService.getPendingListings(accessToken, { page: 1, limit: 4, status: 'pending' }).catch(() => ({ data: { items: [] } })),
          adminService.getAccountVerifications(accessToken, { page: 1, limit: 4, status: 'pending' }).catch(() => ({ data: { items: [] } })),
        ]);

      setStats(statsRes.data);
      setHealth(healthRes.data);
      setCampus(campusRes.data);
      setPendingListings(listingsRes.data?.items || []);
      setPendingAccounts(accountsRes.data?.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load executive dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Quick Action: Inline Approve Listing
  const handleQuickApproveListing = async (id, name) => {
    try {
      await adminService.approveListing(id, accessToken);
      toast.success(`Approved listing: "${name}"`);
      fetchDashboardData(true);
    } catch (err) {
      toast.error(err.message || 'Failed to approve listing');
    }
  };

  // Quick Action: Inline Reject Listing
  const handleQuickRejectListing = async (id, name) => {
    const reason = window.prompt(`Provide reason for rejecting "${name}" (optional):`);
    try {
      await adminService.rejectListing(id, accessToken);
      toast.warning(`Rejected listing: "${name}"`);
      fetchDashboardData(true);
    } catch (err) {
      toast.error(err.message || 'Failed to reject listing');
    }
  };

  // Quick Action: Inline Approve Account
  const handleQuickApproveAccount = async (id, name) => {
    try {
      await adminService.reviewAccountVerification(id, { status: 'approved' }, accessToken);
      toast.success(`Verified account for: "${name}"`);
      fetchDashboardData(true);
    } catch (err) {
      toast.error(err.message || 'Failed to verify account');
    }
  };

  // Quick Action: Inline Reject Account
  const handleQuickRejectAccount = async (id, name) => {
    const notes = window.prompt(`Rejection reason for "${name}" (optional):`);
    try {
      await adminService.reviewAccountVerification(id, { status: 'rejected', notes: notes || null }, accessToken);
      toast.warning(`Rejected account verification for: "${name}"`);
      fetchDashboardData(true);
    } catch (err) {
      toast.error(err.message || 'Failed to reject verification');
    }
  };

  // Executive Header Actions Bar
  const headerAction = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        radius="full"
        variant="primary"
        onClick={() => navigate(ROUTES.ADMIN_APPROVE_LISTINGS)}
        startContent={<FileText size={14} />}
      >
        <span>Review Listings</span>
        {health?.pending_listings > 0 && (
          <span className="ml-1 rounded-full bg-white/25 px-1.5 py-0.2 text-[10px] font-bold">
            {health.pending_listings}
          </span>
        )}
      </Button>

      <Button
        size="sm"
        radius="full"
        variant="secondary"
        onClick={() => navigate(ROUTES.ADMIN_VERIFY_ACCOUNTS)}
        startContent={<UserCheck size={14} />}
      >
        <span>Verify Accounts</span>
        {health?.pending_accounts > 0 && (
          <span className="ml-1 rounded-full bg-ateneo-blue/15 px-1.5 py-0.2 text-[10px] font-bold text-ateneo-blue">
            {health.pending_accounts}
          </span>
        )}
      </Button>

      <Button
        size="sm"
        radius="full"
        variant="ghost"
        onClick={() => navigate(ROUTES.ADMIN_AUDIT_LOG)}
        startContent={<Award size={14} />}
      >
        Audit Log
      </Button>

      <Button
        size="sm"
        radius="full"
        variant="ghost"
        isLoading={refreshing}
        onClick={() => fetchDashboardData(true)}
        startContent={!refreshing && <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />}
        title="Sync live campus data"
      >
        {refreshing ? 'Syncing…' : 'Sync'}
      </Button>
    </div>
  );

  return (
    <AdminLayout
      title="Admin Dashboard"
      subtitle="Overview, real-time system health, and campus housing operations"
      headerAction={headerAction}
    >
      {loading ? (
        <PageSkeleton variant="dashboard" count={4} />
      ) : error ? (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-sm text-rose-700 space-y-3">
          <p className="font-semibold">{error}</p>
          <Button size="sm" radius="full" variant="secondary" onClick={() => fetchDashboardData()}>
            Retry Connection
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ==================================================================== */}
          {/* SECTION 1: SYSTEM HEALTH & ACTION QUEUE (MODERN EXECUTIVE KPIS) */}
          {/* ==================================================================== */}
          <section className="space-y-3">
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  System Health & Action Queue
                </h2>
                <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                  Real-time operational queue requiring university administrative moderation.
                </p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link to={ROUTES.ADMIN_APPROVE_LISTINGS} className="block transition-transform active:scale-[0.98]">
                <StatsCard
                  label="Pending Listings"
                  value={health?.pending_listings ?? 0}
                  variant={health?.pending_listings > 0 ? 'pending' : 'default'}
                  icon={<FileText size={16} strokeWidth={2} />}
                  subtext="review required"
                />
              </Link>

              <Link to={ROUTES.ADMIN_VERIFY_ACCOUNTS} className="block transition-transform active:scale-[0.98]">
                <StatsCard
                  label="Pending Accounts"
                  value={health?.pending_accounts ?? 0}
                  variant={health?.pending_accounts > 0 ? 'pending' : 'default'}
                  icon={<UserCheck size={16} strokeWidth={2} />}
                  subtext="IDs waiting"
                />
              </Link>

              <Link to={ROUTES.ADMIN_MODERATE} className="block transition-transform active:scale-[0.98]">
                <StatsCard
                  label="Pending Reviews"
                  value={health?.pending_reviews ?? 0}
                  variant={health?.pending_reviews > 0 ? 'pending' : 'default'}
                  icon={<Star size={16} strokeWidth={2} />}
                  subtext="moderation queue"
                />
              </Link>

              <Link to={ROUTES.ADMIN_MODERATE} className="block transition-transform active:scale-[0.98]">
                <StatsCard
                  label="Listing Reports"
                  value={health?.pending_reports ?? 0}
                  variant={health?.pending_reports > 0 ? 'danger' : 'default'}
                  icon={<Flag size={16} strokeWidth={2} />}
                  subtext="user flags"
                />
              </Link>
            </div>
          </section>

          {/* ==================================================================== */}
          {/* SECTION 2: INTERACTIVE PRIORITY OPERATIONAL QUEUES (DUAL TABLES) */}
          {/* ==================================================================== */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Queue A: Urgent Pending Listings */}
            <Card shadow="sm" className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <Building2 size={16} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Pending Dorm Submissions
                    </h3>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Awaiting compliance verification for campus safety
                    </p>
                  </div>
                </div>

                <Link
                  to={ROUTES.ADMIN_APPROVE_LISTINGS}
                  className="flex items-center gap-1 text-xs font-semibold text-ateneo-blue hover:underline"
                >
                  <span>View Queue ({health?.pending_listings ?? pendingListings.length})</span>
                  <ChevronRight size={13} />
                </Link>
              </div>

              {pendingListings.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-1" />
                  <p className="font-semibold text-slate-700">All dorm listings reviewed!</p>
                  <p>No properties currently waiting in the approval queue.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingListings.map((item) => (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {item.name || item.title || 'Untitled Property'}
                          </p>
                          <Chip size="sm" variant="flat" color="default" className="text-[9px] font-semibold h-4 px-1.5">
                            {PROPERTY_TYPE_LABELS[item.type] || item.type || 'Dorm'}
                          </Chip>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          by <span className="font-medium text-slate-700">{item.owner_name || item.owner?.full_name || 'Landlord'}</span> · {item.min_price ? formatPrice(item.min_price) : 'Rate TBD'}/mo
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button
                          size="sm"
                          radius="full"
                          variant="success"
                          className="h-7 px-2.5 text-[11px]"
                          onClick={() => handleQuickApproveListing(item.id, item.name || 'Listing')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          radius="full"
                          variant="danger"
                          className="h-7 px-2.5 text-[11px]"
                          onClick={() => handleQuickRejectListing(item.id, item.name || 'Listing')}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          radius="full"
                          variant="ghost"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => navigate(`${ROUTES.ADMIN_APPROVE_LISTINGS}/${item.id}`)}
                          title="Inspect full documents"
                        >
                          <ExternalLink size={12} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Queue B: Identity & Permit Verifications */}
            <Card shadow="sm" className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-ateneo-blue">
                    <UserCheck size={16} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Identity & Permit Verifications
                    </h3>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Students and property owners waiting for ID approvals
                    </p>
                  </div>
                </div>

                <Link
                  to={ROUTES.ADMIN_VERIFY_ACCOUNTS}
                  className="flex items-center gap-1 text-xs font-semibold text-ateneo-blue hover:underline"
                >
                  <span>View Queue ({health?.pending_accounts ?? pendingAccounts.length})</span>
                  <ChevronRight size={13} />
                </Link>
              </div>

              {pendingAccounts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-1" />
                  <p className="font-semibold text-slate-700">All user accounts verified!</p>
                  <p>No student IDs or owner permits pending verification.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingAccounts.map((account) => {
                    const isAdDU = account.email?.endsWith('@addu.edu.ph');
                    return (
                      <div key={account.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <Avatar
                            size="sm"
                            name={account.full_name?.charAt(0) || 'U'}
                            className="bg-ateneo-blue text-white text-xs font-semibold flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {account.full_name || 'Anonymous User'}
                              </p>
                              {isAdDU && (
                                <Chip size="sm" variant="flat" color="primary" className="text-[9px] font-bold h-4 px-1">
                                  @addu.edu.ph
                                </Chip>
                              )}
                              <Chip size="sm" variant="flat" color="default" className="text-[9px] capitalize h-4 px-1.5">
                                {account.role || 'student'}
                              </Chip>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {account.email || 'No email provided'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Button
                            size="sm"
                            radius="full"
                            variant="success"
                            className="h-7 px-2.5 text-[11px]"
                            onClick={() => handleQuickApproveAccount(account.id, account.full_name || 'User')}
                          >
                            Approve ID
                          </Button>
                          <Button
                            size="sm"
                            radius="full"
                            variant="danger"
                            className="h-7 px-2.5 text-[11px]"
                            onClick={() => handleQuickRejectAccount(account.id, account.full_name || 'User')}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            radius="full"
                            variant="ghost"
                            className="h-7 px-2 text-[11px]"
                            onClick={() => navigate(ROUTES.ADMIN_VERIFY_ACCOUNTS)}
                            title="Inspect credentials"
                          >
                            <ExternalLink size={12} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* ==================================================================== */}
          {/* SECTION 3: CAMPUS PROXIMITY & BED CAPACITY (2KM ATENEO PERIMETER) */}
          {/* ==================================================================== */}
          <section className="space-y-3">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-base font-semibold text-slate-900">
                Campus Proximity & Bed Capacity (2km Ateneo Radius)
              </h2>
              <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                Housing capacity, vacancy rates, and average rental benchmarks by campus gate perimeter.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {campus &&
                Object.entries(campus).map(([gateId, g]) => {
                  const occupancyPercent =
                    g.total_beds > 0
                      ? Math.round(((g.total_beds - g.available_beds) / g.total_beds) * 100)
                      : 0;

                  return (
                    <Card
                      key={gateId}
                      shadow="sm"
                      className="rounded-2xl border border-slate-200/90 bg-white p-5 hover:shadow-md transition-all duration-200 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-ateneo-blue shadow-xs">
                            <MapPin size={17} strokeWidth={2} />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-slate-900">{g.gate}</h3>
                            <p className="text-[11px] text-slate-500">2.0 km walking perimeter</p>
                          </div>
                        </div>

                        <Chip size="sm" color="primary" variant="flat" className="font-bold text-xs">
                          {g.listings} Active Dorms
                        </Chip>
                      </div>

                      {/* Mini Capacity Progress Gauge */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-600">Bed Occupancy Rate</span>
                          <span className="font-bold text-slate-900">{occupancyPercent}% Occupied</span>
                        </div>
                        <Progress
                          size="sm"
                          radius="full"
                          value={occupancyPercent}
                          color={occupancyPercent > 85 ? 'warning' : 'primary'}
                          className="max-w-full"
                          aria-label={`Occupancy gauge for ${g.gate}`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                        <div className="rounded-xl bg-slate-50/80 p-3 border border-slate-100">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Available Beds
                          </span>
                          <p className="text-base font-bold text-slate-900 mt-0.5">
                            {g.available_beds}{' '}
                            <span className="text-xs font-normal text-slate-500">/ {g.total_beds}</span>
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50/80 p-3 border border-slate-100">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Average Monthly Rent
                          </span>
                          <p className="text-base font-bold text-ateneo-blue mt-0.5">
                            {g.avg_price != null ? formatPrice(g.avg_price) : '—'}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
            </div>
          </section>

          {/* ==================================================================== */}
          {/* SECTION 4: VERIFICATIONS BREAKDOWN & MODERATOR ACTIVITY */}
          {/* ==================================================================== */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Account & Listing Verification Distribution */}
            <Card shadow="sm" className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  Verification Lifecycle Distribution
                </h3>
                <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                  Breakdown of student accounts and landlord property applications.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                    <span>Account Applications ({Number(stats?.accounts?.pending || 0) + Number(stats?.accounts?.approved || 0) + Number(stats?.accounts?.rejected || 0)})</span>
                    <Link to={ROUTES.ADMIN_VERIFY_ACCOUNTS} className="text-ateneo-blue hover:underline text-[11px]">
                      Manage Accounts
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-2.5 text-center">
                      <span className="text-[10px] font-bold text-amber-700 uppercase">Pending</span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{stats?.accounts?.pending ?? 0}</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/80 p-2.5 text-center">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase">Approved</span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{stats?.accounts?.approved ?? 0}</p>
                    </div>
                    <div className="rounded-xl bg-rose-50/80 border border-rose-200/80 p-2.5 text-center">
                      <span className="text-[10px] font-bold text-rose-700 uppercase">Rejected</span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{stats?.accounts?.rejected ?? 0}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                    <span>Listing Applications ({Number(stats?.listings?.pending || 0) + Number(stats?.listings?.approved || 0) + Number(stats?.listings?.rejected || 0)})</span>
                    <Link to={ROUTES.ADMIN_APPROVE_LISTINGS} className="text-ateneo-blue hover:underline text-[11px]">
                      Manage Listings
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-2.5 text-center">
                      <span className="text-[10px] font-bold text-amber-700 uppercase">Pending</span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{stats?.listings?.pending ?? 0}</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/80 p-2.5 text-center">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase">Approved</span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{stats?.listings?.approved ?? 0}</p>
                    </div>
                    <div className="rounded-xl bg-rose-50/80 border border-rose-200/80 p-2.5 text-center">
                      <span className="text-[10px] font-bold text-rose-700 uppercase">Rejected</span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{stats?.listings?.rejected ?? 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Moderator Activity & Audit History */}
            <Card shadow="sm" className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Your Moderator Session Activity
                  </h3>
                  <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                    Records verified during your active administrator sessions.
                  </p>
                </div>
                <Link
                  to={ROUTES.ADMIN_AUDIT_LOG}
                  className="text-xs font-semibold text-ateneo-blue hover:underline shrink-0 self-start sm:self-auto pt-0.5 sm:pt-0"
                >
                  Full Audit Trail
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      Approved by You
                    </span>
                    <Award size={16} className="text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{stats?.myReviews?.approved ?? 0}</p>
                  <p className="text-[11px] text-slate-500">Verified and granted platform credentials</p>
                </div>

                <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                      Rejected by You
                    </span>
                    <ShieldCheck size={16} className="text-rose-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{stats?.myReviews?.rejected ?? 0}</p>
                  <p className="text-[11px] text-slate-500">Flagged for invalid credentials or non-compliance</p>
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-ateneo-blue flex-shrink-0" />
                  <span className="text-slate-600">Need to inspect platform audit actions?</span>
                </div>
                <Button
                  size="sm"
                  radius="full"
                  variant="primary"
                  className="h-7 text-[11px]"
                  onClick={() => navigate(ROUTES.ADMIN_AUDIT_LOG)}
                >
                  Open Audit Log
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
