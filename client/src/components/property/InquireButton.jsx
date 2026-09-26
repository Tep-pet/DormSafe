import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { resolvePropertyContact } from '../../utils/parseContact';
import { studentService } from '../../services/studentService';
import { ROUTES } from '../../constants/routes';

/** Shows owner contact and lets a student request the selected room with dates. */
export function InquireButton({
  contactName,
  contactPhone,
  description,
  propertyName,
  propertyId,
  room,
  accessToken,
}) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [moveIn, setMoveIn] = useState('');
  const [moveOut, setMoveOut] = useState('');
  const [note, setNote] = useState('');

  const resolved = resolvePropertyContact({
    contact_name: contactName,
    contact_phone: contactPhone,
    description,
  });

  const { contactName: name, contactPhone: phone } = resolved;

  useEffect(() => {
    setSent(false);
    setError('');
    setMoveIn('');
    setMoveOut('');
    setNote('');
  }, [room?.id]);

  async function handleAvail() {
    if (!room?.id || !propertyId) return;
    if (!moveIn || !moveOut) {
      setError('Enter a move-in date and a move-out date');
      return;
    }
    if (moveOut < moveIn) {
      setError('Move-out must be on or after move-in');
      return;
    }
    setSending(true);
    setError('');
    try {
      await studentService.requestRoom(
        {
          property_id: propertyId,
          room_id: room.id,
          move_in_date: moveIn,
          move_out_date: moveOut,
          note,
        },
        accessToken
      );
      setSent(true);
    } catch (err) {
      setError(err.message || 'Could not notify the owner');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Inquire
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Contact Owner</h3>
            <p className="mt-1 text-sm text-gray-600">{propertyName}</p>

            <dl className="mt-4 space-y-2 text-sm">
              {name && (
                <div>
                  <dt className="font-medium text-gray-500">Owner</dt>
                  <dd className="text-gray-900">{name}</dd>
                </div>
              )}
              {phone && (
                <div>
                  <dt className="font-medium text-gray-500">Phone</dt>
                  <dd className="text-gray-900">{phone}</dd>
                </div>
              )}
              <div>
                <dt className="font-medium text-gray-500">Room</dt>
                <dd className="text-gray-900">{room?.label || 'Choose a room on the page first'}</dd>
              </div>
            </dl>

            <div className="mt-4 space-y-3">
              <Input label="Move in" type="date" value={moveIn} onChange={(e) => setMoveIn(e.target.value)} required />
              <Input label="Move out" type="date" value={moveOut} onChange={(e) => setMoveOut(e.target.value)} required />
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Note</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Optional. For example, you can move in after finals."
                />
              </div>
            </div>

            {sent && (
              <p className="mt-4 text-sm text-green-700">
                The owner has been notified. You can change the dates or cancel from{' '}
                <Link to={ROUTES.STUDENT_REQUESTS} className="underline" onClick={() => setOpen(false)}>
                  Requests
                </Link>
                .
              </p>
            )}
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <div className="mt-6 flex flex-wrap gap-2">
              <Button type="button" onClick={handleAvail} disabled={!room?.id || sending || sent}>
                {sending ? 'Sending…' : sent ? 'Request sent' : 'Avail this room'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
