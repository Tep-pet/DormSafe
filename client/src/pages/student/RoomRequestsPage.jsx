import { useCallback, useEffect, useState } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { useAuth } from '../../hooks/useAuth';
import { studentService } from '../../services/studentService';

const STATUS_LABEL = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

export function RoomRequestsPage() {
  const { accessToken } = useAuth();
  const [requests, setRequests] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentService.getInquiries(accessToken);
      const list = res.data || [];
      setRequests(list);
      setDrafts(
        Object.fromEntries(
          list.map((item) => [
            item.id,
            {
              move_in_date: item.move_in_date,
              move_out_date: item.move_out_date,
              note: item.note || '',
            },
          ])
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  function updateDraft(id, field, value) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function save(id) {
    setMessage('');
    setError('');
    try {
      await studentService.updateInquiry(id, drafts[id], accessToken);
      setMessage('Request updated. The owner has been notified.');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function cancel(id) {
    setMessage('');
    setError('');
    try {
      await studentService.cancelInquiry(id, accessToken);
      setMessage('Request cancelled. The owner has been notified.');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <PageContainer title="Room requests" subtitle="Change dates or cancel a request before the owner decides">
      {loading ? (
        <PageSkeleton variant="table" rows={4} cols={4} />
      ) : (
        <div className="space-y-4">
          {message && <p className="text-sm text-green-700">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {requests.length === 0 && <p className="text-sm text-gray-600">You have not requested a room yet.</p>}
          {requests.map((item) => {
            const draft = drafts[item.id] || {};
            const pending = item.status === 'pending';
            return (
              <article key={item.id} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{item.property_name}</h2>
                    <p className="text-sm text-gray-600">{item.room_label}</p>
                  </div>
                  <Badge variant={item.status === 'accepted' ? 'verified' : item.status === 'pending' ? 'pending' : 'occupied'}>
                    {STATUS_LABEL[item.status] || item.status}
                  </Badge>
                </div>

                {pending ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Move in"
                      type="date"
                      value={draft.move_in_date || ''}
                      onChange={(e) => updateDraft(item.id, 'move_in_date', e.target.value)}
                    />
                    <Input
                      label="Move out"
                      type="date"
                      value={draft.move_out_date || ''}
                      onChange={(e) => updateDraft(item.id, 'move_out_date', e.target.value)}
                    />
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-gray-700">Note</label>
                      <textarea
                        value={draft.note || ''}
                        onChange={(e) => updateDraft(item.id, 'note', e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Optional message for the owner"
                      />
                    </div>
                    <div className="flex gap-2 sm:col-span-2">
                      <Button type="button" onClick={() => save(item.id)}>Save changes</Button>
                      <Button type="button" variant="secondary" onClick={() => cancel(item.id)}>Cancel request</Button>
                    </div>
                  </div>
                ) : (
                  <dl className="mt-3 space-y-1 text-sm text-gray-700">
                    <div>Move in: {item.move_in_date}</div>
                    <div>Move out: {item.move_out_date}</div>
                    {item.note && <div>Note: {item.note}</div>}
                  </dl>
                )}

                {item.owner_message && (
                  <p className="mt-3 text-sm text-gray-700">Owner: {item.owner_message}</p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
