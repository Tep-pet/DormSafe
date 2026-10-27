import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
} from '@heroui/react';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Phone,
  Mail,
  User,
  BedDouble,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Input, Textarea } from '../common/Input';
import { DatePicker } from '../common/DatePicker';
import { resolvePropertyContact } from '../../utils/parseContact';
import { studentService } from '../../services/studentService';
import { ROUTES } from '../../constants/routes';

/** Shows owner contact and lets a student request the selected room with dates. */
export function InquireButton({
  contactName,
  contactPhone,
  contactEmail,
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
    contact_email: contactEmail,
    name: propertyName,
    description,
  });

  const { contactName: name, contactPhone: phone, contactEmail: email } = resolved;

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
      setError('Move-out date must be later than or equal to move-in date');
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
      setError(err.message || 'Could not send inquiry to the landlord. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        radius="full"
        onClick={() => setIsOpen(true)}
        startContent={<Send size={13} strokeWidth={2} />}
        className="w-full sm:w-auto font-semibold"
      >
        Inquire & Request Room
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        size="md"
        backdrop="blur"
        classNames={{
          base: 'rounded-2xl border border-slate-200 shadow-2xl bg-white overflow-visible',
          header: 'border-b border-blue-50 p-5 bg-gradient-to-r from-blue-50/60 via-white to-white rounded-t-2xl',
          body: 'p-5 space-y-4 overflow-visible',
          footer: 'border-t border-slate-100 p-4 bg-white rounded-b-2xl',
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 text-ateneo-blue">
                  <div className="h-7 w-7 rounded-lg bg-blue-100/70 text-ateneo-blue flex items-center justify-center">
                    <Building2 size={16} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Inquire & Request Room</h3>
                </div>
                <p className="text-xs font-medium text-slate-500 pl-9">{propertyName}</p>
              </ModalHeader>

              <ModalBody>
                {/* Landlord Info Ribbon - Ateneo Blue Tinted Card */}
                <div className="rounded-2xl border border-blue-100/90 bg-gradient-to-br from-blue-50/80 via-sky-50/40 to-indigo-50/30 p-4 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium flex items-center gap-1.5">
                      <User size={13} className="text-ateneo-blue" />
                      Landlord:
                    </span>
                    <span className="font-bold text-slate-900">{name || 'Property Owner'}</span>
                  </div>

                  {phone && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium flex items-center gap-1.5">
                        <Phone size={13} className="text-ateneo-blue" />
                        Direct Line:
                      </span>
                      <span className="font-bold text-ateneo-blue tracking-wide">{phone}</span>
                    </div>
                  )}

                  {email && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium flex items-center gap-1.5">
                        <Mail size={13} className="text-ateneo-blue" />
                        Email:
                      </span>
                      <a
                        href={`mailto:${email}`}
                        className="font-bold text-ateneo-blue hover:text-blue-800 hover:underline break-all"
                      >
                        {email}
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-blue-100/90">
                    <span className="text-slate-600 font-medium flex items-center gap-1.5">
                      <BedDouble size={13} className="text-ateneo-blue" />
                      Selected Unit:
                    </span>
                    <span className="font-bold text-ateneo-blue px-2.5 py-0.5 rounded-lg bg-white border border-blue-200/90 shadow-2xs text-[11px]">
                      {room?.label || 'Choose a room on detail view'}
                    </span>
                  </div>
                </div>

                {/* Form Inputs */}
                <div className="space-y-3">
                  <DatePicker
                    label="Move-In Date"
                    value={moveIn}
                    onChange={setMoveIn}
                    required
                  />

                  <DatePicker
                    label="Move-Out Date"
                    value={moveOut}
                    onChange={setMoveOut}
                    minDate={moveIn}
                    placement="top"
                    required
                  />

                  <Textarea
                    label="Message to Landlord (Optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Inquiring for 2nd semester, move-in right after finals."
                    minRows={2}
                  />
                </div>

                {/* Success Banner */}
                {sent && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 flex items-start gap-2 shadow-2xs">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="font-bold">Your inquiry has been sent to the landlord</p>
                      <p className="mt-0.5 text-emerald-700">
                        The property owner has received your move-in dates and message. Track your inquiry status under{' '}
                        <Link
                          to={ROUTES.STUDENT_REQUESTS}
                          className="font-bold text-ateneo-blue underline hover:text-blue-800"
                          onClick={() => setIsOpen(false)}
                        >
                          Room Requests
                        </Link>
                        .
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium flex items-start gap-2">
                    <AlertTriangle size={15} className="shrink-0 text-rose-500 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </ModalBody>

              <ModalFooter className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  radius="full"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  radius="full"
                  onClick={handleAvail}
                  isLoading={sending}
                  disabled={!room?.id || sent || sending}
                  startContent={!sent ? <Send size={13} /> : <CheckCircle2 size={13} />}
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

