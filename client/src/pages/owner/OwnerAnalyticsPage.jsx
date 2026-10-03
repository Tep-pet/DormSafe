import { useCallback, useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Chip } from '@heroui/react';
import {
  Bell,
  Users,
  DoorOpen,
  CreditCard,
  Calendar,
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import { OwnerLayout } from '../../components/layout/OwnerLayout';
import { Button } from '../../components/common/Button';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { Badge } from '../../components/common/Badge';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { useAuth } from '../../hooks/useAuth';
import { useOwnerProperty } from '../../context/OwnerPropertyContext';
import { ownerService } from '../../services/ownerService';
import { formatPrice } from '../../utils/formatPrice';
import { formatPropertyRoom } from '../../utils/formatPropertyRoom';

export function OwnerAnalyticsPage() {
  const { accessToken } = useAuth();
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
    } finally {
      setLoading(false);
    }
  }, [accessToken, filterPropertyId]);

  useEffect(() => {
    load();
  }, [load]);

  async function sendReminders() {
    setSendingReminder(true);
    try {
      const res = await ownerService.sendPaymentReminders(accessToken);
      const base = res.message || `Sent ${res.data?.sent || 0} reminder(s)`;
      setReminderMsg(res.data?.hint ? `${base}. ${res.data.hint}` : base);
    } finally {
      setSendingReminder(false);
    }
  }

  async function updateMaintenance(id, status) {
    await ownerService.updateMaintenance(id, status, accessToken);
    load();
  }

  const vacancyRate = analytics?.vacancy_rate ?? 0;
  const occupancyRate = 100 - vacancyRate;

  return (
    <OwnerLayout
      title="Analytics & Calendar"
      subtitle="Vacancy rates, monthly revenue trends, occupancy events, and maintenance requests"
    >
      {loading ? (
        <PageSkeleton variant="dashboard" count={3} />
      ) : (
        <div className="space-y-6">
          {/* Payment Reminders Callout */}
        <Card shadow="sm" className="rounded-2xl border border-gray-200 bg-white p-1">
          <CardBody className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-ateneo-blue">
                  <Bell size={15} strokeWidth={2} />
                </div>
                <h3 className="font-bold text-base text-gray-900">Tenant Rent Reminders</h3>
              </div>
              <p className="mt-1 text-xs text-gray-500 max-w-xl">
                Automatically notifies tenants with due payment logs or active stays without paid rent for this cycle.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={sendReminders}
              isLoading={sendingReminder}
              startContent={<Bell size={14} strokeWidth={2} />}
            >
              Send Payment Reminders
            </Button>
          </CardBody>
          {reminderMsg && (
            <div className="mx-5 mb-4 rounded-xl bg-green-50 border border-green-200 p-3 text-xs text-green-800 font-medium">
              {reminderMsg}
            </div>
          )}
        </Card>

        {/* Top KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard
            label="Occupancy Rate"
            value={`${occupancyRate}%`}
            icon={<Users size={16} strokeWidth={2} />}
            variant="occupied"
            trend={`${occupancyRate}% filled`}
            subtext={`${(analytics?.total_rooms ?? 0) - (analytics?.vacant_rooms ?? 0)}/${analytics?.total_rooms ?? 0} rooms filled`}
            progress={occupancyRate}
          />
          <StatsCard
            label="Vacancy Rate"
            value={`${vacancyRate}%`}
            icon={<DoorOpen size={16} strokeWidth={2} />}
            variant="vacant"
            trend={`${vacancyRate}% empty`}
            subtext={`${analytics?.vacant_rooms ?? 0}/${analytics?.total_rooms ?? 0} units vacant`}
            progress={vacancyRate}
          />
          {(analytics?.revenue_trend || []).slice(-1).map((m) => (
            <StatsCard
              key={m.month}
              label="Latest Paid Revenue"
              value={formatPrice(m.revenue)}
              icon={<CreditCard size={16} strokeWidth={2} />}
              variant="revenue"
              trend={m.month}
              subtext="logged collections"
            />
          ))}
        </div>

        {/* By Property Breakdown */}
        {analytics?.by_property?.length > 0 && (
          <Card shadow="sm" className="rounded-2xl border border-gray-200 bg-white p-1">
            <CardHeader className="p-5 pb-2">
              <h3 className="font-bold text-base text-gray-900">Property Occupancy Breakdown</h3>
            </CardHeader>
            <CardBody className="p-5 pt-0">
              <ul className="divide-y divide-gray-100 text-sm">
                {analytics.by_property.map((p) => (
                  <li key={p.property_id} className="flex items-center justify-between py-3">
                    <span className="font-semibold text-gray-800">{p.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        {p.vacant_rooms} / {p.total_rooms} vacant
                      </span>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={p.vacancy_rate > 30 ? 'warning' : 'success'}
                        className="font-bold text-xs"
                      >
                        {p.vacancy_rate}% Vacant
                      </Chip>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}

        {/* Monthly Revenue Trend */}
        {analytics?.revenue_trend?.length > 0 && (
          <Card shadow="sm" className="rounded-2xl border border-gray-200 bg-white p-1">
            <CardHeader className="p-5 pb-2">
              <h3 className="font-bold text-base text-gray-900">Monthly Revenue Collection Trend</h3>
            </CardHeader>
            <CardBody className="p-5 pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {analytics.revenue_trend.map((m) => (
                  <div
                    key={m.month}
                    className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 text-center transition hover:border-ateneo-blue hover:bg-blue-50/20"
                  >
                    <span className="text-xs font-bold text-gray-500 uppercase">{m.month}</span>
                    <p className="mt-1 text-sm font-extrabold text-ateneo-blue">
                      {formatPrice(m.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Occupancy Calendar Events */}
        <Card shadow="sm" className="rounded-2xl border border-gray-200 bg-white p-1">
          <CardHeader className="p-5 pb-2">
            <h3 className="font-bold text-base text-gray-900">Occupancy & Lease Timeline</h3>
          </CardHeader>
          <CardBody className="p-5 pt-0">
            {events.length === 0 ? (
              <p className="text-xs text-gray-400 py-4">No move-in/out or reservations scheduled.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {events.map((ev, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50/50 p-3 transition hover:bg-gray-50"
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
                      <span className="font-bold text-gray-900">{ev.label}</span>
                      <span className="text-xs text-gray-500">
                        ({formatPropertyRoom(ev.property, ev.room)})
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                      <Calendar size={13} className="text-gray-400" />
                      <span>{ev.date}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Maintenance Requests */}
        <Card shadow="sm" className="rounded-2xl border border-gray-200 bg-white p-1">
          <CardHeader className="p-5 pb-2">
            <h3 className="font-bold text-base text-gray-900">Maintenance Inbox</h3>
          </CardHeader>
          <CardBody className="p-5 pt-0">
            {maintenance.length === 0 ? (
              <p className="text-xs text-gray-400 py-4">No open maintenance requests.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {maintenance.map((req) => (
                  <li
                    key={req.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                        <Wrench size={15} strokeWidth={2} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{req.description}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Tenant: {req.profiles?.full_name} · Property: {req.properties?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={req.status === 'open' ? 'pending' : 'verified'}>
                        {req.status}
                      </Badge>
                      {req.status === 'open' && (
                        <div className="flex gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => updateMaintenance(req.id, 'in_progress')}
                          >
                            In Progress
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            className="h-8 text-xs"
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
          </CardBody>
        </Card>
      </div>
      )}
    </OwnerLayout>
  );
}
