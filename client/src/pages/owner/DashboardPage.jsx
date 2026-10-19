import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardBody } from '@heroui/react';
import {
  Building2,
  Users,
  BedDouble,
  CreditCard,
  Plus,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  Inbox,
  BarChart3,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { OwnerLayout } from '../../components/layout/OwnerLayout';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useOwnerProperty } from '../../context/OwnerPropertyContext';
import { propertyService } from '../../services/propertyService';
import { formatPrice } from '../../utils/formatPrice';
import { ROUTES } from '../../constants/routes';

export function DashboardPage() {
  const { accessToken } = useAuth();
  const { filterPropertyId } = useOwnerProperty();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError('');

      try {
        const res = await propertyService.getDashboardStats(accessToken, filterPropertyId);
        setStats(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load owner dashboard statistics');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, filterPropertyId]
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const occupied = stats?.occupiedRooms ?? 0;
  const vacant = stats?.vacantRooms ?? 0;
  const totalRooms = occupied + vacant;
  const occupancyRate = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0;

  // Header Actions
  const headerAction = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        radius="full"
        variant="primary"
        onClick={() => navigate(ROUTES.OWNER_ADD_PROPERTY)}
        startContent={<Plus size={14} strokeWidth={2.5} />}
      >
        Add Property
      </Button>

      <Button
        size="sm"
        radius="full"
        variant="ghost"
        isLoading={refreshing}
        onClick={() => fetchStats(true)}
        startContent={!refreshing && <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />}
      >
        {refreshing ? 'Syncing…' : 'Sync'}
      </Button>
    </div>
  );

  return (
    <OwnerLayout
      title="Owner Dashboard"
      subtitle="Real-time occupancy metrics, active listings, and revenue overview"
      headerAction={headerAction}
    >
      {loading ? (
        <PageSkeleton variant="dashboard" count={4} />
      ) : error ? (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-sm text-rose-700 space-y-3">
          <p className="font-semibold">{error}</p>
          <Button size="sm" radius="full" variant="secondary" onClick={() => fetchStats()}>
            Retry Connection
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ==================================================================== */}
          {/* SECTION 1: KEY PERFORMANCE METRICS */}
          {/* ==================================================================== */}
          <section className="space-y-3">
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Housing Metrics & Occupancy Overview
                </h2>
                <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                  Aggregated statistics across your managed student housing accommodations.
                </p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Link to={ROUTES.OWNER_LISTINGS} className="block transition-transform active:scale-[0.99]">
                <StatsCard
                  label="Total Properties"
                  value={stats?.propertyCount ?? 0}
                  icon={<Building2 size={16} strokeWidth={2} />}
                  variant="default"
                  subtext="active listings"
                />
              </Link>

              <StatsCard
                label="Occupied Rooms"
                value={occupied}
                icon={<Users size={16} strokeWidth={2} />}
                variant="occupied"
                subtext={`${occupancyRate}% filled (${occupied}/${totalRooms})`}
              />

              <StatsCard
                label="Vacant Rooms"
                value={vacant}
                icon={<BedDouble size={16} strokeWidth={2} />}
                variant="vacant"
                subtext="ready for lease"
              />

              <Link to={ROUTES.OWNER_PAYMENTS} className="block transition-transform active:scale-[0.99]">
                <StatsCard
                  label="Recorded Revenue"
                  value={formatPrice(stats?.monthlyRevenue ?? 0)}
                  icon={<CreditCard size={16} strokeWidth={2} />}
                  variant="revenue"
                  subtext="paid logs this period"
                />
              </Link>
            </div>
          </section>

          {/* ==================================================================== */}
          {/* SECTION 2: REVENUE OPPORTUNITY BANNER */}
          {/* ==================================================================== */}
          <Card
            shadow="sm"
            className="rounded-2xl border border-slate-200/90 bg-linear-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 p-1 shadow-xs"
          >
            <CardBody className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-ateneo-blue border border-blue-200/60 shadow-2xs">
                  <TrendingUp size={22} strokeWidth={2} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ateneo-blue">
                      Revenue Opportunity
                    </span>
                    <span className="rounded-full bg-blue-100/80 px-2 py-0.2 text-[10px] font-bold text-ateneo-blue">
                      {vacant} Units Available
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    Potential monthly earnings from filling vacant units
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                    By promoting your vacant rooms and approving student requests, you can maximize monthly rental yields.
                  </p>
                </div>
              </div>

              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t border-slate-200/60 sm:border-t-0 pt-3 sm:pt-0">
                <span className="text-2xl sm:text-3xl font-extrabold text-ateneo-blue tracking-tight">
                  +{formatPrice(stats?.potentialRevenue ?? 0)}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">projected / month</span>
              </div>
            </CardBody>
          </Card>

          {/* ==================================================================== */}
          {/* SECTION 3: MANAGEMENT & OPERATIONS MATRIX */}
          {/* ==================================================================== */}
          <section className="space-y-3">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-base font-semibold text-slate-900">
                Quick Operations & Portal Management
              </h2>
              <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                Manage your listings, handle incoming room requests, review tenants, and verify rental payments.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                to={ROUTES.OWNER_LISTINGS}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-ateneo-blue border border-blue-100/80 group-hover:scale-105 transition-transform">
                    <Building2 size={20} strokeWidth={2} />
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-ateneo-blue group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="mt-3">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-ateneo-blue transition-colors">
                    Manage Listings
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update room rates, capacity, and toggle live availability.
                  </p>
                </div>
              </Link>

              <Link
                to={ROUTES.OWNER_REQUESTS}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-100/80 group-hover:scale-105 transition-transform">
                    <Inbox size={20} strokeWidth={2} />
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="mt-3">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                    Room Requests
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review and approve incoming student tenancy applications.
                  </p>
                </div>
              </Link>

              <Link
                to={ROUTES.OWNER_TENANTS}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100/80 group-hover:scale-105 transition-transform">
                    <Users size={20} strokeWidth={2} />
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="mt-3">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Tenants & Leases
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Inspect active tenant rosters, lease periods, and move-out requests.
                  </p>
                </div>
              </Link>

              <Link
                to={ROUTES.OWNER_PAYMENTS}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-100/80 group-hover:scale-105 transition-transform">
                    <CreditCard size={20} strokeWidth={2} />
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-sky-700 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="mt-3">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                    Payment Log
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track rent collection logs, pending proofs, and payment history.
                  </p>
                </div>
              </Link>

              <Link
                to={ROUTES.OWNER_ANALYTICS}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-100/80 group-hover:scale-105 transition-transform">
                    <BarChart3 size={20} strokeWidth={2} />
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-purple-700 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="mt-3">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                    Analytics & Trends
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Explore occupancy percentages, monthly revenue curves, and trends.
                  </p>
                </div>
              </Link>

              <Link
                to={ROUTES.OWNER_VERIFICATION}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100/80 group-hover:scale-105 transition-transform">
                    <ShieldCheck size={20} strokeWidth={2} />
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="mt-3">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Owner Verification
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Submit business permits, government IDs, and compliance docs.
                  </p>
                </div>
              </Link>
            </div>
          </section>
        </div>
      )}
    </OwnerLayout>
  );
}
