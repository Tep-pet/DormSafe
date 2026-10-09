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
          base: 'rounded-2xl border border-slate-200/90 shadow-2xl bg-white',
          header: 'border-b border-slate-100 p-5',
          body: 'p-5 space-y-4',
          footer: 'border-t border-slate-100 p-4 bg-slate-50/50',
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 text-ateneo-blue">
                  <Building2 size={18} />
                  <h3 className="text-base font-bold text-slate-900">Inquire & Request Room</h3>
                </div>
                <p className="text-xs font-normal text-slate-500">{propertyName}</p>
              </ModalHeader>

              <ModalBody>
                {/* Landlord Info Ribbon */}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <User size={12} className="text-slate-400" />
                      Landlord:
                    </span>
                    <span className="font-semibold text-slate-800">{name || 'Property Owner'}</span>
                  </div>

                  {phone && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Phone size={12} className="text-slate-400" />
                        Direct Line:
                      </span>
                      <span className="font-bold text-ateneo-blue">{phone}</span>
                    </div>
                  )}

                  {email && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Mail size={12} className="text-slate-400" />
                        Email:
                      </span>
                      <a
                        href={`mailto:${email}`}
                        className="font-bold text-ateneo-blue hover:underline break-all"
                      >
                        {email}
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/70">
                    <span className="text-slate-500 flex items-center gap-1">
                      <BedDouble size={12} className="text-slate-400" />
                      Selected Unit:
                    </span>
                    <span className="font-bold text-slate-800 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px]">
                      {room?.label || 'Choose a room on detail view'}
                    </span>
                  </div>
                </div>

                {/* Form Inputs */}
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
                      <p className="font-bold">Request Sent to Owner!</p>
                      <p className="mt-0.5 text-emerald-700">
                        The property owner has received your move-in dates. Track your inquiry status under{' '}
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
                  disabled={!room?.id || sent}
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

