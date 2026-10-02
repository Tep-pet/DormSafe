import { useCallback, useEffect, useState } from 'react';
import { OwnerLayout } from '../../components/layout/OwnerLayout';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { useAuth } from '../../hooks/useAuth';
import { ownerService } from '../../services/ownerService';

const STATUS_LABEL = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

export function OwnerRoomRequestsPage() {
  const { accessToken } = useAuth();
  const [requests, setRequests] = useState([]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ownerService.getInquiries(accessToken);
      setRequests(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function reply(id, status) {
    setNotice('');
    setError('');
    try {
      await ownerService.replyToInquiry(id, { status, message: messages[id] || '' }, accessToken);
      setNotice(status === 'accepted' ? 'Request accepted. The student has been notified.' : 'Request declined. The student has been notified.');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <OwnerLayout title="Room requests" subtitle="Accept, decline, or reply to students who want a room">
      {loading ? (
        <PageSkeleton variant="table" rows={5} cols={4} />
      ) : (
        <div className="space-y-4">
          {notice && <p className="text-sm text-green-700">{notice}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {requests.length === 0 && <p className="text-sm text-gray-600">No room requests yet.</p>}
          {requests.map((item) => (
            <article key={item.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{item.student_name}</h2>
                  <p className="text-sm text-gray-600">
                    {item.room_label} · {item.property_name}
                  </p>
                  {item.student_email && <p className="text-xs text-gray-500">{item.student_email}</p>}
                </div>
                <Badge variant={item.status === 'accepted' ? 'verified' : item.status === 'pending' ? 'pending' : 'occupied'}>
                  {STATUS_LABEL[item.status] || item.status}
                </Badge>
              </div>
              <dl className="mt-3 space-y-1 text-sm text-gray-700">
                <div>Move in: {item.move_in_date}</div>
                <div>Move out: {item.move_out_date}</div>
                <div>Note: {item.note || '—'}</div>
              </dl>
              {item.status === 'pending' ? (
                <div className="mt-4 space-y-3">
                  <textarea
                    value={messages[item.id] || ''}
                    onChange={(e) => setMessages((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Optional message to the student"
                  />
                  <div className="flex gap-2">
                    <Button type="button" onClick={() => reply(item.id, 'accepted')}>Accept</Button>
                    <Button type="button" variant="secondary" onClick={() => reply(item.id, 'declined')}>Decline</Button>
                  </div>
                </div>
              ) : (
                item.owner_message && <p className="mt-3 text-sm text-gray-700">Your message: {item.owner_message}</p>
              )}
            </article>
          ))}
        </div>
      )}
    </OwnerLayout>
  );
}
