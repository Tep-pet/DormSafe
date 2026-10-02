import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
} from '@heroui/react';
import { Button } from '../common/Button';
import { Input, Textarea } from '../common/Input';
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
  const [isOpen, setIsOpen] = useState(false);
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
      setError('Please enter both a move-in date and a move-out date');
      return;
    }
    if (moveOut < moveIn) {
      setError('Move-out date must be on or after move-in date');
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
      <Button
        variant="primary"
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto"
      >
        Inquire & Avail Room
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        size="md"
        backdrop="blur"
        classNames={{
          base: 'rounded-2xl border border-gray-100 shadow-2xl bg-white',
          header: 'border-b border-gray-100 p-5',
          body: 'p-5',
          footer: 'border-t border-gray-100 p-4',
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-gray-900">Inquire & Request Room</h3>
                <p className="text-xs font-medium text-gray-500">{propertyName}</p>
              </ModalHeader>

              <ModalBody className="space-y-4">
                <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Listing & Owner Info
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    {name && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Owner:</span>
                        <span className="font-semibold text-gray-900">{name}</span>
                      </div>
                    )}
                    {phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Contact:</span>
                        <span className="font-semibold text-ateneo-blue">{phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                      <span className="text-gray-500 font-medium">Selected Unit:</span>
                      <Chip size="sm" color="primary" variant="flat" className="font-bold">
                        {room?.label || 'Choose a room on page'}
                      </Chip>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Input
                    label="Move-In Date"
                    type="date"
                    value={moveIn}
                    onChange={(e) => setMoveIn(e.target.value)}
                    required
                  />

                  <Input
                    label="Move-Out Date"
                    type="date"
                    value={moveOut}
                    onChange={(e) => setMoveOut(e.target.value)}
                    required
                  />

                  <Textarea
                    label="Message to Owner (Optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Inquiring for 2nd semester, move-in right after finals."
                    minRows={3}
                  />
                </div>

                {sent && (
                  <div className="rounded-xl bg-green-50 border border-green-200 p-3.5 text-xs text-green-800">
                    <p className="font-bold">Request Sent Successfully!</p>
                    <p className="mt-1">
                      The property owner has been notified. You can manage or track your inquiry from{' '}
                      <Link
                        to={ROUTES.STUDENT_REQUESTS}
                        className="font-bold text-ateneo-blue underline"
                        onClick={() => setIsOpen(false)}
                      >
                        Requests
                      </Link>
                      .
                    </p>
                  </div>
                )}

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
                    {error}
                  </div>
                )}
              </ModalBody>

              <ModalFooter className="flex gap-2">
                <Button variant="ghost" onClick={() => setIsOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAvail}
                  isLoading={sending}
                  disabled={!room?.id || sent}
                >
                  {sent ? 'Sent' : 'Submit Request'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
