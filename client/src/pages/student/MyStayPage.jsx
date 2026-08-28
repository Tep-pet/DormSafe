import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Loader } from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';
import { studentService } from '../../services/studentService';
import { formatPrice } from '../../utils/formatPrice';
import { printLeaseSummary } from '../../utils/printLeaseSummary';
import { ROUTES } from '../../constants/routes';

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

export function MyStayPage() {
  const { accessToken } = useAuth();
  const [stays, setStays] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editMoveOut, setEditMoveOut] = useState({});
  const [editReservation, setEditReservation] = useState({});
  const [disputeReason, setDisputeReason] = useState({});
  const [maintDesc, setMaintDesc] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [staysRes, resRes, payRes, maintRes] = await Promise.all([
        studentService.getMyStays(accessToken),
        studentService.getReservations(accessToken),
        studentService.getPayments(accessToken),
        studentService.getMaintenance(accessToken),
      ]);
      setStays(staysRes.data || []);
      setReservations(resRes.data || []);
      setPayments(payRes.data || []);
      setMaintenance(maintRes.data || []);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const currentStays = stays.filter((s) => s.is_current);
  const upcomingStays = stays.filter((s) => s.is_upcoming);
  const pastStays = stays.filter((s) => !s.is_current && !s.is_upcoming);
  const pendingReservations = reservations.filter((r) => r.status === 'pending');
  const overduePayments = payments.filter((p) => p.status === 'overdue' || (p.status === 'pending' && p.due_date <= new Date().toISOString().slice(0, 10)));

  async function handleRerent(tenantId) {
    setMessage('');
    setError('');
    await studentService.rerent(tenantId, accessToken, { extension_months: 1 });
    setMessage('Stay extended by 1 month.');
    load();
  }

  async function handleSaveMoveOut(stay) {
    setMessage('');
    setError('');
    const date = editMoveOut[stay.id] ?? stay.move_out_date;
    try {
      await studentService.updateMoveOut(stay.id, date, accessToken);
      setMessage('Move-out date updated.');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleConfirmMoveOut(stay) {
    await studentService.confirmMoveOut(stay.id, accessToken);
    setMessage('Move-out date confirmed.');
    load();
  }

  async function handleDisputeMoveOut(stay) {
    const reason = disputeReason[stay.id];
    if (!reason?.trim()) {
      setError('Please enter a reason for the dispute.');
      return;
    }
    await studentService.disputeMoveOut(stay.id, reason, accessToken);
    setMessage('Dispute sent to owner.');
    load();
  }

  async function handleLeasePdf(stay) {
    const res = await studentService.getLeaseSummary(stay.id, accessToken);
    printLeaseSummary(res.data);
  }

  async function handleSaveReservation(r) {
    setMessage('');
    setError('');
    const date = editReservation[r.id] ?? r.reserved_start_date;
    try {
      await studentService.updateReservation(r.id, date, accessToken);
      setMessage('Reservation date updated.');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleMaintenance(stay) {
    const desc = maintDesc[stay.id];
    if (!desc?.trim()) return;
    await studentService.createMaintenance({ tenant_id: stay.id, description: desc }, accessToken);
    setMaintDesc((prev) => ({ ...prev, [stay.id]: '' }));
    setMessage('Maintenance request sent.');
    load();
  }

  function renderStayCard(stay, { showActions = true } = {}) {
    const daysLeft = daysUntil(stay.move_out_date);
    const endingSoon = daysLeft != null && daysLeft >= 0 && daysLeft <= 14;
    const isActive = stay.is_current;

    return (
      <div key={stay.id} className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold">{stay.properties?.name}</h3>
            <p className="text-sm text-gray-600">{stay.properties?.address}</p>
            {stay.rooms && (
              <p className="mt-1 text-sm">
                Room {stay.rooms.label} · {formatPrice(stay.rooms.price)}/mo
              </p>
            )}
          </div>
          {endingSoon && isActive && <Badge variant="pending">Ending in {daysLeft} days</Badge>}
          {stay.move_out_confirmed && isActive && <Badge variant="verified">Move-out confirmed</Badge>}
          {stay.move_out_dispute_reason && <Badge variant="danger">Disputed</Badge>}
        </div>

        <p className="mt-2 text-sm text-gray-600">Move-in: {stay.move_in_date || '—'}</p>

        {isActive && showActions && (
          <>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <Input
                label="Move-out date"
                type="date"
                value={editMoveOut[stay.id] ?? stay.move_out_date ?? ''}
                onChange={(e) => setEditMoveOut((prev) => ({ ...prev, [stay.id]: e.target.value }))}
              />
              <Button onClick={() => handleSaveMoveOut(stay)}>Save date</Button>
            </div>
            {!stay.move_out_confirmed && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => handleConfirmMoveOut(stay)}>
                  Confirm move-out date
                </Button>
              </div>
            )}
            {!stay.move_out_confirmed && (
              <div className="mt-3 space-y-2">
                <Input
                  label="Dispute move-out (if owner set wrong date)"
                  value={disputeReason[stay.id] || ''}
                  onChange={(e) => setDisputeReason((prev) => ({ ...prev, [stay.id]: e.target.value }))}
                />
                <Button variant="ghost" onClick={() => handleDisputeMoveOut(stay)}>
                  Submit dispute
                </Button>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => handleRerent(stay.id)}>
                Extend 1 month
              </Button>
              <Button variant="ghost" onClick={() => handleLeasePdf(stay)}>
                Print lease summary
              </Button>
            </div>
            <div className="mt-4 rounded-lg border border-gray-100 p-3">
              <p className="text-sm font-medium">Report maintenance issue</p>
              <textarea
                value={maintDesc[stay.id] || ''}
                onChange={(e) => setMaintDesc((prev) => ({ ...prev, [stay.id]: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-gray-300 px-2 py-1 text-sm"
                rows={2}
                placeholder="Describe the issue…"
              />
              <Button className="mt-2" variant="secondary" onClick={() => handleMaintenance(stay)}>
                Send to owner
              </Button>
            </div>
          </>
        )}

        {!isActive && <p className="mt-2 text-sm text-gray-500">Move-out: {stay.move_out_date || '—'}</p>}
      </div>
    );
  }

  return (
    <PageContainer title="My Stay" subtitle="Current tenancy, payments, reservations, and timeline">
      <Link to={ROUTES.STUDENT_SEARCH} className="text-sm text-ateneo-blue hover:underline">
        ← Back to search
      </Link>

      {message && <p className="mt-4 text-sm text-green-700">{message}</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {overduePayments.length > 0 && (
        <section className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-900">Payment reminders</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {overduePayments.map((p) => (
              <li key={p.id}>
                {p.property_name}: {formatPrice(p.amount)} due {p.due_date} ({p.status})
              </li>
            ))}
          </ul>
        </section>
      )}

      {loading ? (
        <Loader message="Loading your stay…" />
      ) : stays.length === 0 ? (
        <p className="mt-6 text-sm text-gray-600">
          No stay linked yet. Ask your landlord to add your student email when creating your tenant record.
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          <section>
            <h2 className="mb-3 font-semibold">Timeline</h2>
            <ol className="relative border-l border-gray-200 pl-4">
              {[...currentStays, ...upcomingStays, ...pendingReservations].map((item, i) => (
                <li key={item.id || i} className="mb-4 ml-2">
                  <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-ateneo-blue" />
                  <p className="text-sm font-medium">
                    {item.properties?.name || item.reserved_start_date}
                    {item.is_current && ' (current)'}
                    {item.is_upcoming && ' (upcoming)'}
                    {item.status === 'pending' && !item.is_current && ' (reservation)'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.move_in_date || item.reserved_start_date}
                    {item.move_out_date ? ` → ${item.move_out_date}` : ''}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {currentStays.length > 0 && (
            <section>
              <h2 className="mb-3 font-semibold">Current stay</h2>
              <div className="grid gap-4">{currentStays.map((s) => renderStayCard(s))}</div>
            </section>
          )}

          {upcomingStays.length > 0 && (
            <section>
              <h2 className="mb-3 font-semibold">Upcoming</h2>
              <div className="grid gap-4">{upcomingStays.map((s) => renderStayCard(s, { showActions: false }))}</div>
            </section>
          )}

          {pastStays.length > 0 && (
            <section>
              <h2 className="mb-3 font-semibold">Past stays</h2>
              <div className="grid gap-4">{pastStays.map((s) => renderStayCard(s, { showActions: false }))}</div>
            </section>
          )}
        </div>
      )}

      {payments.length > 0 && (
        <section className="mt-8">
          <h2 className="font-semibold">Payment status</h2>
          <p className="text-xs text-gray-500">Read-only view from owner&apos;s payment log</p>
          <ul className="mt-3 divide-y rounded-xl border border-gray-200 bg-white text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex justify-between px-4 py-3">
                <span>{p.property_name} · {formatPrice(p.amount)}</span>
                <Badge variant={p.status === 'paid' ? 'verified' : p.status === 'overdue' ? 'danger' : 'pending'}>
                  {p.status} · due {p.due_date}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      {reservations.length > 0 && (
        <section className="mt-8">
          <h2 className="font-semibold">Reservations</h2>
          <ul className="mt-3 space-y-3">
            {reservations.map((r) => (
              <li key={r.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{r.properties?.name}</p>
                    <p className="text-gray-500">Room {r.rooms?.label}</p>
                    {r.queue_position != null && r.status === 'pending' && (
                      <p className="mt-1 text-ateneo-blue">
                        You&apos;re #{r.queue_position} for this room on {r.reserved_start_date}
                      </p>
                    )}
                  </div>
                  <Badge variant={r.status === 'cancelled' ? 'danger' : r.status === 'pending' ? 'pending' : 'verified'}>
                    {r.status}
                  </Badge>
                </div>
                {r.status === 'pending' ? (
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <Input
                      label="Start date"
                      type="date"
                      value={editReservation[r.id] ?? r.reserved_start_date}
                      onChange={(e) => setEditReservation((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    />
                    <Button onClick={() => handleSaveReservation(r)}>Update date</Button>
                  </div>
                ) : (
                  <p className="mt-2 text-gray-600">Starts {r.reserved_start_date}</p>
                )}
                {r.cancel_reason && <p className="mt-1 text-xs text-red-600">{r.cancel_reason}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {maintenance.length > 0 && (
        <section className="mt-8">
          <h2 className="font-semibold">Your maintenance requests</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {maintenance.map((m) => (
              <li key={m.id} className="rounded-lg border border-gray-100 px-3 py-2">
                {m.description} · <Badge variant={m.status === 'open' ? 'pending' : 'verified'}>{m.status}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageContainer>
  );
}
