import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Chip } from '@heroui/react';
import {
  Bell,
  Users,
  DoorOpen,
  CreditCard,
  Calendar,
  Wrench,
  CheckCircle2,
  Clock,
  Building2,
  TrendingUp,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { OwnerLayout } from '../../components/layout/OwnerLayout';
import { Button } from '../../components/common/Button';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { Badge } from '../../components/common/Badge';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useOwnerProperty } from '../../context/OwnerPropertyContext';
import { ownerService } from '../../services/ownerService';
import { formatPrice } from '../../utils/formatPrice';
import { formatPropertyRoom } from '../../utils/formatPropertyRoom';

export function OwnerAnalyticsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const { filterPropertyId } = useOwnerProperty();

  const [analytics, setAnalytics] = useState(null);
  const [events, setEvents] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reminderMsg, setReminderMsg] = useState('');
  const [sendingReminder, setSendingReminder] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, o, m] = await Promise.all([
        ownerService.getAnalytics(accessToken, filterPropertyId),
        ownerService.getOccupancy(accessToken, filterPropertyId),
        ownerService.getMaintenance(accessToken),
      ]);
      setAnalytics(a.data);
      setEvents(o.data || []);
      setMaintenance(m.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [accessToken, filterPropertyId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function sendReminders() {
    setSendingReminder(true);
    try {
      const res = await ownerService.sendPaymentReminders(accessToken);
      const base = res.message || `Sent ${res.data?.sent || 0} reminder(s)`;
      const msg = res.data?.hint ? `${base}. ${res.data.hint}` : base;
      setReminderMsg(msg);
      toast.success(msg);
    } catch (err) {
      toast.error(err.message || 'Failed to send payment reminders');
    } finally {
      setSendingReminder(false);
    }
  }

  async function updateMaintenance(id, status) {
    try {
      await ownerService.updateMaintenance(id, status, accessToken);
      toast.success(`Maintenance request status updated to "${status}".`);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to update maintenance request');
    }
  }

  const vacancyRate = analytics?.vacancy_rate ?? 0;
  const occupancyRate = 100 - vacancyRate;
  const latestMonth = (analytics?.revenue_trend || []).slice(-1)[0];

  // Header Actions
  const headerAction = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        radius="full"
        variant="primary"
        onClick={sendReminders}
        isLoading={sendingReminder}
        startContent={!sendingReminder && <Bell size={14} strokeWidth={2.5} />}
      >
        {sendingReminder ? 'Sending Reminders…' : 'Send Rent Reminders'}
      </Button>

      <Button
        size="sm"
        radius="full"
        variant="ghost"
        isLoading={loading}
        onClick={() => load()}
        startContent={!loading && <RefreshCw size={14} />}
      >
        Refresh
      </Button>
    </div>
  );

  return (
    <OwnerLayout
      title="Analytics & Operations Timeline"
      subtitle="Occupancy percentages, historical revenue collection, lease milestones, and maintenance"
      headerAction={headerAction}
    >
      {loading ? (
        <PageSkeleton variant="dashboard" count={3} />
      ) : (
        <div className="space-y-8">
          {/* ==================================================================== */}
          {/* SECTION 1: EXECUTIVE OCCUPANCY & REVENUE KPIS */}
          {/* ==================================================================== */}
          <section className="space-y-3">
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Occupancy & Financial Performance
                </h2>
                <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                  Real-time occupancy calculations and monthly rent collection performance.
                </p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <StatsCard
                label="Occupancy Rate"
                value={`${occupancyRate}%`}
                icon={<Users size={16} strokeWidth={2} />}
                variant="occupied"
                subtext={`${(analytics?.total_rooms ?? 0) - (analytics?.vacant_rooms ?? 0)} of ${analytics?.total_rooms ?? 0} rooms occupied`}
                progress={occupancyRate}
              />

              <StatsCard
                label="Vacancy Rate"
                value={`${vacancyRate}%`}
                icon={<DoorOpen size={16} strokeWidth={2} />}
                variant="vacant"
                subtext={`${analytics?.vacant_rooms ?? 0} vacant rooms ready for lease`}
                progress={vacancyRate}
              />

              <StatsCard
                label={`Latest Revenue (${latestMonth?.month || 'Period'})`}
                value={formatPrice(latestMonth?.revenue ?? 0)}
                icon={<CreditCard size={16} strokeWidth={2} />}
                variant="revenue"
                subtext="total paid rent logs"
              />
            </div>
          </section>

          {/* ==================================================================== */}
          {/* REMINDER CALLOUT BANNER (IF TRIGGERED) */}
          {/* ==================================================================== */}
          {reminderMsg && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs font-semibold text-emerald-800 shadow-2xs">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">Payment Reminders Dispatched</p>
                <p className="mt-0.5 font-normal text-emerald-700">{reminderMsg}</p>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* SECTION 2: BY PROPERTY BREAKDOWN */}
          {/* ==================================================================== */}
          {analytics?.by_property?.length > 0 && (
            <section className="space-y-3">
              <div className="border-b border-slate-200 pb-2">
                <h2 className="text-base font-semibold text-slate-900">
                  Property Occupancy Breakdown
                </h2>
                <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                  Unit capacity and vacancy distribution across individual accommodations.
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-xs backdrop-blur-xs">
                <ul className="divide-y divide-slate-100">
                  {analytics.by_property.map((p) => (
                    <li
                      key={p.property_id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-5 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-ateneo-blue border border-blue-100/80">
                          <Building2 size={16} strokeWidth={2} />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                          <span className="block text-xs text-slate-500 mt-0.5">
                            {p.vacant_rooms} vacant out of {p.total_rooms} total rooms
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-end sm:self-auto">
                        <Badge variant={p.vacancy_rate > 30 ? 'pending' : 'verified'}>
                          {p.vacancy_rate}% Vacant
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* ==================================================================== */}
          {/* SECTION 3: MONTHLY REVENUE HISTORY */}
          {/* ==================================================================== */}
          {analytics?.revenue_trend?.length > 0 && (
            <section className="space-y-3">
              <div className="border-b border-slate-200 pb-2">
                <h2 className="text-base font-semibold text-slate-900">
                  Monthly Revenue Collection Trend
                </h2>
                <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                  Historical monthly rental totals logged across all properties.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {analytics.revenue_trend.map((m) => (
                  <div
                    key={m.month}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 text-left shadow-xs transition-all duration-200 hover:border-ateneo-blue hover:shadow-xs"
                  >
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {m.month}
                    </span>
                    <p className="mt-2 text-base font-extrabold text-ateneo-blue tracking-tight">
                      {formatPrice(m.revenue)}
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium mt-1">Paid logs</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ==================================================================== */}
          {/* SECTION 4: OCCUPANCY TIMELINE & MAINTENANCE INBOX */}
          {/* ==================================================================== */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: Occupancy Timeline */}
            <section className="space-y-3">
              <div className="border-b border-slate-200 pb-2">
                <h2 className="text-base font-semibold text-slate-900">
                  Occupancy & Lease Timeline
                </h2>
                <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                  Upcoming move-in dates, lease expirations, and reservations.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-xs backdrop-blur-xs min-h-[220px]">
                {events.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-xs text-slate-400">
                    <Calendar size={24} className="text-slate-300 mb-2" />
                    <span>No move-in/out or reservations scheduled.</span>
                  </div>
                ) : (
                  <ul className="space-y-2.5 text-xs">
                    {events.map((ev, i) => (
                      <li
                        key={i}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:bg-slate-100/80"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              ev.type === 'move_out'
                                ? 'pending'
                                : ev.type === 'reservation'
                                ? 'default'
                                : 'verified'
                            }
                          >
                            {ev.type.replace('_', ' ')}
                          </Badge>
                          <span className="font-bold text-slate-900">{ev.label}</span>
                          <span className="text-[11px] text-slate-500">
                            ({formatPropertyRoom(ev.property, ev.room)})
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                          <Calendar size={12} className="text-slate-400" />
                          <span>{ev.date}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* Right: Maintenance Inbox */}
            <section className="space-y-3">
              <div className="border-b border-slate-200 pb-2">
                <h2 className="text-base font-semibold text-slate-900">
                  Maintenance Inbox
                </h2>
                <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                  Tenant issue reports requiring property manager intervention.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-xs backdrop-blur-xs min-h-[220px]">
                {maintenance.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-xs text-slate-400">
                    <Wrench size={24} className="text-slate-300 mb-2" />
                    <span>No open maintenance tickets. All facilities operational.</span>
                  </div>
                ) : (
                  <ul className="space-y-3 text-xs">
                    {maintenance.map((req) => (
                      <li
                        key={req.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-200/90 bg-slate-50/60 p-3.5 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                            <Wrench size={15} strokeWidth={2} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{req.description}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Tenant: {req.profiles?.full_name || 'Student'} · {req.properties?.name}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <Badge variant={req.status === 'open' ? 'pending' : 'verified'}>
                            {req.status === 'open' ? 'Open Issue' : req.status === 'in_progress' ? 'In Progress' : 'Resolved'}
                          </Badge>

                          {req.status !== 'resolved' && (
                            <div className="flex gap-1.5">
                              {req.status === 'open' && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  radius="full"
                                  className="h-7 text-[11px] px-2.5"
                                  onClick={() => updateMaintenance(req.id, 'in_progress')}
                                >
                                  In Progress
                                </Button>
                              )}
                              <Button
                                variant="primary"
                                size="sm"
                                radius="full"
                                className="h-7 text-[11px] px-2.5"
                                onClick={() => updateMaintenance(req.id, 'resolved')}
                                startContent={<CheckCircle2 size={13} strokeWidth={2} />}
                              >
                                Resolve
                              </Button>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </OwnerLayout>
  );
}
