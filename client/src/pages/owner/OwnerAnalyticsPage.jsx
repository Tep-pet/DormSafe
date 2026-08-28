import { useCallback, useEffect, useState } from 'react';
import { OwnerLayout } from '../../components/layout/OwnerLayout';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
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
    const res = await ownerService.sendPaymentReminders(accessToken);
    const base = res.message || `Sent ${res.data?.sent || 0} reminder(s)`;
    setReminderMsg(res.data?.hint ? `${base}. ${res.data.hint}` : base);
  }

  async function updateMaintenance(id, status) {
    await ownerService.updateMaintenance(id, status, accessToken);
    load();
  }

  if (loading) {
    return (
      <OwnerLayout title="Analytics & Calendar">
        <Loader />
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout title="Analytics & Calendar" subtitle="Vacancy, revenue trends, occupancy, and maintenance">
      <div className="space-y-6">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Payment reminders</h2>
            <Button onClick={sendReminders}>Notify tenants with due rent</Button>
          </div>
          {reminderMsg && <p className="mt-2 text-sm text-green-700">{reminderMsg}</p>}
          <p className="mt-1 text-xs text-gray-500">
            Notifies tenants with due payments in Payment Log, or active tenants without paid rent this month.
            For specific amounts and due dates, add entries in Payment Log.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase text-gray-500">Vacancy rate</p>
            <p className="text-2xl font-bold">{analytics?.vacancy_rate ?? 0}%</p>
            <p className="text-xs text-gray-500">{analytics?.vacant_rooms}/{analytics?.total_rooms} rooms vacant</p>
          </div>
          {(analytics?.revenue_trend || []).slice(-1).map((m) => (
            <div key={m.month} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase text-gray-500">Latest paid month</p>
              <p className="text-2xl font-bold">{formatPrice(m.revenue)}</p>
              <p className="text-xs text-gray-500">{m.month}</p>
            </div>
          ))}
        </section>

        {analytics?.by_property?.length > 0 && (
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="font-semibold">By property</h2>
            <ul className="mt-3 divide-y text-sm">
              {analytics.by_property.map((p) => (
                <li key={p.property_id} className="flex justify-between py-2">
                  <span>{p.name}</span>
                  <span className="text-gray-600">{p.vacant_rooms}/{p.total_rooms} vacant ({p.vacancy_rate}%)</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {analytics?.revenue_trend?.length > 0 && (
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="font-semibold">Monthly revenue trend</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {analytics.revenue_trend.map((m) => (
                <li key={m.month} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <span className="font-medium">{m.month}</span> · {formatPrice(m.revenue)}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold">Occupancy calendar</h2>
          {events.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No move-in/out or reservations scheduled.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {events.map((ev, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-100 px-3 py-2">
                  <Badge variant={ev.type === 'move_out' ? 'pending' : ev.type === 'reservation' ? 'default' : 'verified'}>
                    {ev.type.replace('_', ' ')}
                  </Badge>
                  <span className="font-medium">{ev.date}</span>
                  <span>{ev.label}</span>
                  <span className="text-gray-500">{formatPropertyRoom(ev.property, ev.room)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold">Maintenance requests</h2>
          {maintenance.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No open requests.</p>
          ) : (
            <ul className="mt-3 space-y-3 text-sm">
              {maintenance.map((req) => (
                <li key={req.id} className="rounded-lg border border-gray-100 p-3">
                  <p>{req.description}</p>
                  <p className="text-xs text-gray-500">{req.profiles?.full_name} · {req.properties?.name}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge variant={req.status === 'open' ? 'pending' : 'verified'}>{req.status}</Badge>
                    {req.status === 'open' && (
                      <>
                        <Button variant="ghost" className="text-xs" onClick={() => updateMaintenance(req.id, 'in_progress')}>
                          In progress
                        </Button>
                        <Button variant="ghost" className="text-xs" onClick={() => updateMaintenance(req.id, 'resolved')}>
                          Resolved
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </OwnerLayout>
  );
}
