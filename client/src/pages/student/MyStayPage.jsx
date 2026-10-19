import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Card,
  CardBody,
  CardHeader,
  Avatar,
  Tooltip,
} from '@heroui/react';
import {
  Home,
  Calendar,
  CreditCard,
  Wrench,
  Clock,
  ArrowLeft,
  RefreshCw,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  BedDouble,
  ChevronRight,
  ShieldCheck,
  User,
  Send,
  Flag,
  RotateCcw,
  Check,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Textarea } from '../../components/common/Input';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
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
  const { toast } = useToast();
  const navigate = useNavigate();

  const [stays, setStays] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit / Input States
  const [editMoveOut, setEditMoveOut] = useState({});
  const [editReservation, setEditReservation] = useState({});

  // Modals State
  const [disputeModal, setDisputeModal] = useState({ isOpen: false, stay: null, reason: '' });
  const [maintenanceModal, setMaintenanceModal] = useState({ isOpen: false, stay: null, description: '' });
  const [processingAction, setProcessingAction] = useState(false);

  const load = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      try {
        const [staysRes, resRes, payRes, maintRes] = await Promise.all([
          studentService.getMyStays(accessToken).catch(() => ({ data: [] })),
          studentService.getReservations(accessToken).catch(() => ({ data: [] })),
          studentService.getPayments(accessToken).catch(() => ({ data: [] })),
          studentService.getMaintenance(accessToken).catch(() => ({ data: [] })),
        ]);
        setStays(staysRes.data || []);
        setReservations(resRes.data || []);
        setPayments(payRes.data || []);
        setMaintenance(maintRes.data || []);
      } catch (err) {
        toast.error(err.message || 'Failed to load stay records');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, toast]
  );

  useEffect(() => {
    load();
  }, [load]);

  const currentStays = stays.filter((s) => s.is_current);
  const upcomingStays = stays.filter((s) => s.is_upcoming);
  const pastStays = stays.filter((s) => !s.is_current && !s.is_upcoming);
  const pendingReservations = reservations.filter((r) => r.status === 'pending');
  const overduePayments = payments.filter(
    (p) =>
      p.status === 'overdue' ||
      (p.status === 'pending' && p.due_date <= new Date().toISOString().slice(0, 10))
  );

  // Extend Stay by 1 Month
  const handleRerent = async (tenantId) => {
    setProcessingAction(true);
    try {
      await studentService.rerent(tenantId, accessToken, { extension_months: 1 });
      toast.success('Your stay has been extended by 1 month.');
      load(true);
    } catch (err) {
      toast.error(err.message || 'Failed to extend stay');
    } finally {
      setProcessingAction(false);
    }
  };

  // Save Move-Out Date
  const handleSaveMoveOut = async (stay) => {
    const date = editMoveOut[stay.id] ?? stay.move_out_date;
    if (!date) {
      toast.error('Please specify a move-out date.');
      return;
    }
    setProcessingAction(true);
    try {
      await studentService.updateMoveOut(stay.id, date, accessToken);
      toast.success('Move-out date updated successfully.');
      load(true);
    } catch (err) {
      toast.error(err.message || 'Failed to update move-out date');
    } finally {
      setProcessingAction(false);
    }
  };

  // Confirm Move-Out Date
  const handleConfirmMoveOut = async (stay) => {
    setProcessingAction(true);
    try {
      await studentService.confirmMoveOut(stay.id, accessToken);
      toast.success('Move-out date confirmed with property owner.');
      load(true);
    } catch (err) {
      toast.error(err.message || 'Failed to confirm move-out date');
    } finally {
      setProcessingAction(false);
    }
  };

  // Submit Move-Out Dispute
  const handleDisputeMoveOut = async (e) => {
    e.preventDefault();
    const stay = disputeModal.stay;
    const reason = disputeModal.reason;
    if (!reason?.trim() || !stay) return;

    setProcessingAction(true);
    try {
      await studentService.disputeMoveOut(stay.id, reason, accessToken);
      setDisputeModal({ isOpen: false, stay: null, reason: '' });
      toast.warning('Dispute notification sent to property owner.');
      load(true);
    } catch (err) {
      toast.error(err.message || 'Failed to submit dispute');
    } finally {
      setProcessingAction(false);
    }
  };

  // Print Lease Summary
  const handleLeasePdf = async (stay) => {
    try {
      const res = await studentService.getLeaseSummary(stay.id, accessToken);
      printLeaseSummary(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to generate lease summary');
    }
  };

  // Save Reservation Date
  const handleSaveReservation = async (r) => {
    const date = editReservation[r.id] ?? r.reserved_start_date;
    if (!date) return;
    setProcessingAction(true);
    try {
      await studentService.updateReservation(r.id, date, accessToken);
      toast.success('Reservation start date updated.');
      load(true);
    } catch (err) {
      toast.error(err.message || 'Failed to update reservation date');
    } finally {
      setProcessingAction(false);
    }
  };

  // Submit Maintenance Request
  const handleMaintenance = async (e) => {
    e.preventDefault();
    const stay = maintenanceModal.stay;
    const desc = maintenanceModal.description;
    if (!desc?.trim() || !stay) return;

    setProcessingAction(true);
    try {
      await studentService.createMaintenance({ tenant_id: stay.id, description: desc }, accessToken);
      setMaintenanceModal({ isOpen: false, stay: null, description: '' });
      toast.success('Maintenance ticket submitted to owner.');
      load(true);
    } catch (err) {
      toast.error(err.message || 'Failed to submit maintenance request');
    } finally {
      setProcessingAction(false);
    }
  };

  const headerAction = (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        radius="full"
        onClick={() => navigate(ROUTES.STUDENT_SEARCH)}
        startContent={<ArrowLeft size={14} strokeWidth={2} />}
      >
        Find Housing
      </Button>

      <Button
        variant="ghost"
        size="sm"
        radius="full"
        onClick={() => load(true)}
        isLoading={refreshing}
        startContent={<RefreshCw size={13} strokeWidth={2} />}
      >
        Refresh
      </Button>
    </div>
  );

  return (
    <PageContainer
      title="My Stay & Housing Portal"
      subtitle="Digital tenancy ledger, payment records, move-out verification, and maintenance requests"
      headerAction={headerAction}
    >
      <div className="space-y-6">
        {/* Payment Reminders Alert Banner */}
        {overduePayments.length > 0 && (
          <div className="rounded-2xl border border-amber-200/90 bg-amber-50/80 p-4 sm:p-5 text-xs text-amber-900 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-900 mb-2">
              <CreditCard size={17} className="text-amber-600" />
              <span>Payment Reminders ({overduePayments.length} due)</span>
            </div>
            <p className="text-xs text-amber-700 mb-3">
              Your landlord has recorded pending/due rent entries for your tenancy. Please settle directly with your landlord.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {overduePayments.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-amber-200/80 bg-white/80 p-3 flex items-center justify-between shadow-2xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{p.property_name}</p>
                    <p className="text-[11px] text-slate-500">Due: {p.due_date}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-ateneo-blue">{formatPrice(p.amount)}</span>
                    <Badge variant={p.status === 'overdue' ? 'danger' : 'pending'} size="sm" className="ml-2">
                      {p.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <PageSkeleton variant="detail" />
        ) : stays.length === 0 && reservations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-2xs text-slate-400 mb-3">
              <Home size={26} strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Active Stay Linked Yet</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              When your landlord adds your verified student email to their tenant roster, your stay details, payment logs, and move-out verification will appear here automatically.
            </p>
            <div className="mt-5">
              <Link to={ROUTES.STUDENT_SEARCH}>
                <Button size="sm" variant="primary" radius="full" startContent={<Home size={14} />}>
                  Explore Verified Dorms
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-12 items-start">
            {/* ------------------------------------------------------------- */}
            {/* LEFT COLUMN: ACTIVE STAY & LEASE ACTIONS (7 cols) */}
            {/* ------------------------------------------------------------- */}
            <div className="lg:col-span-7 space-y-6">
              {/* Card 1: Active Current Stay */}
              {currentStays.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Home size={16} className="text-ateneo-blue" />
                      <h3 className="text-base font-semibold text-slate-900">Current Stay</h3>
                    </div>
                    <Badge variant="verified">Active Lease</Badge>
                  </div>

                  {currentStays.map((stay) => {
                    const daysLeft = daysUntil(stay.move_out_date);
                    const endingSoon = daysLeft != null && daysLeft >= 0 && daysLeft <= 14;

                    return (
                      <Card
                        key={stay.id}
                        shadow="none"
                        className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden"
                      >
                        <CardHeader className="border-b border-slate-100 p-4 sm:p-5 bg-slate-50/40 flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h4 className="text-base font-bold text-slate-900">{stay.properties?.name}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">{stay.properties?.address}</p>
                            {stay.rooms && (
                              <div className="mt-1.5 flex items-center gap-2 text-xs font-semibold text-slate-700">
                                <BedDouble size={13} className="text-ateneo-blue" />
                                <span>Room {stay.rooms.label}</span>
                                <span>·</span>
                                <span className="text-ateneo-blue">{formatPrice(stay.rooms.price)}/mo</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {endingSoon && (
                              <Badge variant="pending" size="sm">
                                <Clock size={11} className="mr-1 inline-block" />
                                Ending in {daysLeft} days
                              </Badge>
                            )}
                            {stay.move_out_confirmed && (
                              <Badge variant="verified" size="sm">
                                <CheckCircle2 size={11} className="mr-1 inline-block" />
                                Move-Out Confirmed
                              </Badge>
                            )}
                            {stay.move_out_dispute_reason && (
                              <Badge variant="danger" size="sm">
                                <AlertTriangle size={11} className="mr-1 inline-block" />
                                Disputed
                              </Badge>
                            )}
                          </div>
                        </CardHeader>

                        <CardBody className="p-4 sm:p-5 space-y-4">
                          {/* Move-in & Move-out Timeline Badges */}
                          <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200/70 bg-slate-50/60 p-3 text-xs">
                            <div>
                              <span className="text-slate-400 font-medium">Move-In Date</span>
                              <p className="font-bold text-slate-800 mt-0.5">{stay.move_in_date || '—'}</p>
                            </div>
                            <div>
                              <span className="text-slate-400 font-medium">Scheduled Move-Out</span>
                              <p className="font-bold text-slate-800 mt-0.5">{stay.move_out_date || '—'}</p>
                            </div>
                          </div>

                          {/* Move-out Modification & Confirmation */}
                          <div className="space-y-3 pt-2">
                            <div className="flex flex-wrap items-end gap-2.5">
                              <div className="flex-1 min-w-[180px]">
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                  Update Move-Out Date
                                </label>
                                <input
                                  type="date"
                                  value={editMoveOut[stay.id] ?? stay.move_out_date ?? ''}
                                  onChange={(e) =>
                                    setEditMoveOut((prev) => ({ ...prev, [stay.id]: e.target.value }))
                                  }
                                  className="h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-xs text-slate-800 focus:border-ateneo-blue focus:outline-hidden shadow-2xs"
                                />
                              </div>

                              <Button
                                size="sm"
                                variant="secondary"
                                radius="full"
                                isLoading={processingAction}
                                onClick={() => handleSaveMoveOut(stay)}
                                className="h-10 text-xs"
                              >
                                Save Date
                              </Button>

                              {!stay.move_out_confirmed && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  radius="full"
                                  isLoading={processingAction}
                                  onClick={() => handleConfirmMoveOut(stay)}
                                  startContent={<Check size={13} strokeWidth={2.5} />}
                                  className="h-10 text-xs"
                                >
                                  Confirm Move-Out
                                </Button>
                              )}
                            </div>

                            {/* Dispute Alert if Active */}
                            {stay.move_out_dispute_reason && (
                              <div className="rounded-xl border border-rose-200/80 bg-rose-50/80 p-3 text-xs text-rose-800 flex items-start gap-2 shadow-2xs">
                                <AlertTriangle size={14} className="shrink-0 text-rose-600 mt-0.5" />
                                <div>
                                  <span className="font-bold">Active Move-Out Dispute: </span>
                                  <span>{stay.move_out_dispute_reason}</span>
                                </div>
                              </div>
                            )}

                            {/* Dispute Button */}
                            {!stay.move_out_confirmed && !stay.move_out_dispute_reason && (
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => setDisputeModal({ isOpen: true, stay, reason: '' })}
                                  className="text-xs text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1 font-medium"
                                >
                                  <Flag size={12} />
                                  <span>Dispute move-out date set by landlord</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Quick Action Ribbon */}
                          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                size="sm"
                                radius="full"
                                variant="ghost"
                                onClick={() => handleRerent(stay.id)}
                                isLoading={processingAction}
                                startContent={<RotateCcw size={13} strokeWidth={2} />}
                              >
                                Extend 1 Month
                              </Button>

                              <Button
                                size="sm"
                                radius="full"
                                variant="ghost"
                                onClick={() => handleLeasePdf(stay)}
                                startContent={<FileText size={13} strokeWidth={2} />}
                              >
                                Print Lease Summary
                              </Button>
                            </div>

                            <Button
                              size="sm"
                              radius="full"
                              variant="secondary"
                              onClick={() => setMaintenanceModal({ isOpen: true, stay, description: '' })}
                              startContent={<Wrench size={13} strokeWidth={2} />}
                            >
                              Request Maintenance
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Card 2: Upcoming & Past Stays */}
              {(upcomingStays.length > 0 || pastStays.length > 0) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2.5">
                    <Clock size={16} className="text-slate-500" />
                    <h3 className="text-base font-semibold text-slate-900">Other Stays</h3>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {[...upcomingStays, ...pastStays].map((stay) => (
                      <div
                        key={stay.id}
                        className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-2 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{stay.properties?.name}</h4>
                          <Badge variant={stay.is_upcoming ? 'pending' : 'default'} size="sm">
                            {stay.is_upcoming ? 'Upcoming' : 'Completed'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">Room {stay.rooms?.label}</p>
                        <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span>{stay.move_in_date || '—'} → {stay.move_out_date || '—'}</span>
                          <button
                            type="button"
                            onClick={() => handleLeasePdf(stay)}
                            className="text-ateneo-blue hover:underline font-semibold"
                          >
                            PDF
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Card 3: Maintenance Requests History */}
              {maintenance.length > 0 && (
                <Card shadow="none" className="rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                  <CardHeader className="border-b border-slate-100 p-4 sm:p-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench size={16} className="text-ateneo-blue" />
                      <h3 className="text-base font-semibold text-slate-900">Your Maintenance Tickets</h3>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {maintenance.length}
                    </span>
                  </CardHeader>
                  <CardBody className="p-4 sm:p-5 space-y-2.5">
                    {maintenance.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-3 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-800">{m.description}</p>
                          <p className="text-[11px] text-slate-400">
                            Submitted {new Date(m.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={m.status === 'open' ? 'pending' : 'verified'} size="sm">
                          {m.status === 'open' ? 'Under Review' : 'Resolved'}
                        </Badge>
                      </div>
                    ))}
                  </CardBody>
                </Card>
              )}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* RIGHT COLUMN: TIMELINE, RESERVATIONS, PAYMENTS (5 cols) */}
            {/* ------------------------------------------------------------- */}
            <div className="lg:col-span-5 space-y-6">
              {/* Timeline Stepper */}
              <Card shadow="none" className="rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                <CardHeader className="border-b border-slate-100 p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-ateneo-blue" />
                    <h3 className="text-base font-semibold text-slate-900">Tenancy Timeline</h3>
                  </div>
                </CardHeader>
                <CardBody className="p-4 sm:p-5">
                  <ol className="relative border-l border-slate-200 ml-2 space-y-4">
                    {[...currentStays, ...upcomingStays, ...pendingReservations].map((item, i) => {
                      const title = item.properties?.name || 'Upcoming Reservation';
                      const isCurrent = item.is_current;
                      const isRes = item.status === 'pending' && !item.is_current;

                      return (
                        <li key={item.id || i} className="ml-4">
                          <span
                            className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white ${
                              isCurrent
                                ? 'bg-ateneo-blue ring-2 ring-ateneo-blue/30'
                                : isRes
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          <div className="flex items-center justify-between gap-1">
                            <h5 className="text-xs font-bold text-slate-900 truncate">{title}</h5>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                                isCurrent
                                  ? 'bg-blue-50 text-ateneo-blue'
                                  : isRes
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {isCurrent ? 'Active' : isRes ? 'Waitlist' : 'Upcoming'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {item.move_in_date || item.reserved_start_date}
                            {item.move_out_date ? ` → ${item.move_out_date}` : ''}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                </CardBody>
              </Card>

              {/* Reservations Card */}
              {reservations.length > 0 && (
                <Card shadow="none" className="rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                  <CardHeader className="border-b border-slate-100 p-4 sm:p-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-ateneo-blue" />
                      <h3 className="text-base font-semibold text-slate-900">Room Reservations</h3>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {reservations.length}
                    </span>
                  </CardHeader>
                  <CardBody className="p-4 sm:p-5 space-y-3">
                    {reservations.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-2.5 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-slate-900">{r.properties?.name}</p>
                            <p className="text-slate-500 text-[11px]">Room {r.rooms?.label}</p>
                          </div>
                          <Badge
                            variant={
                              r.status === 'cancelled' ? 'danger' : r.status === 'pending' ? 'pending' : 'verified'
                            }
                            size="sm"
                          >
                            {r.status}
                          </Badge>
                        </div>

                        {/* Queue Position Pill */}
                        {r.queue_position != null && r.status === 'pending' && (
                          <div className="rounded-lg bg-blue-50 border border-blue-200/70 p-2 text-ateneo-blue text-[11px] font-semibold flex items-center gap-1.5">
                            <Sparkles size={13} />
                            <span>You are #{r.queue_position} in line for this unit</span>
                          </div>
                        )}

                        {r.status === 'pending' ? (
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="date"
                              value={editReservation[r.id] ?? r.reserved_start_date}
                              onChange={(e) =>
                                setEditReservation((prev) => ({ ...prev, [r.id]: e.target.value }))
                              }
                              className="h-8 flex-1 rounded-lg border border-slate-200/90 bg-white px-2.5 text-xs text-slate-800 focus:border-ateneo-blue focus:outline-hidden"
                            />
                            <Button
                              size="sm"
                              variant="secondary"
                              radius="full"
                              onClick={() => handleSaveReservation(r)}
                              className="h-8 text-xs"
                            >
                              Update Date
                            </Button>
                          </div>
                        ) : (
                          <p className="text-slate-600 text-[11px]">Target Move-In: {r.reserved_start_date}</p>
                        )}
                      </div>
                    ))}
                  </CardBody>
                </Card>
              )}

              {/* Payment History Ledger */}
              {payments.length > 0 && (
                <Card shadow="none" className="rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                  <CardHeader className="border-b border-slate-100 p-4 sm:p-5">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Payment Status</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Read-only ledger from landlord records</p>
                    </div>
                  </CardHeader>
                  <CardBody className="p-0 divide-y divide-slate-100">
                    {payments.map((p) => (
                      <div key={p.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/50">
                        <div>
                          <p className="font-semibold text-slate-800">{p.property_name}</p>
                          <p className="text-[11px] text-slate-400">Due: {p.due_date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{formatPrice(p.amount)}</span>
                          <Badge
                            variant={p.status === 'paid' ? 'verified' : p.status === 'overdue' ? 'danger' : 'pending'}
                            size="sm"
                          >
                            {p.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dispute Modal */}
      <Modal
        isOpen={disputeModal.isOpen}
        onClose={() => setDisputeModal({ isOpen: false, stay: null, reason: '' })}
        size="md"
        backdrop="blur"
        classNames={{
          base: 'rounded-2xl border border-slate-200/90 shadow-2xl bg-white',
          header: 'border-b border-slate-100 p-5',
          body: 'p-5 space-y-3',
          footer: 'border-t border-slate-100 p-4 bg-slate-50/50',
        }}
      >
        <ModalContent>
          <form onSubmit={handleDisputeMoveOut}>
            <ModalHeader>
              <div className="flex items-center gap-2 text-rose-600">
                <Flag size={18} />
                <h3 className="text-base font-bold text-slate-900">Dispute Move-Out Date</h3>
              </div>
            </ModalHeader>
            <ModalBody>
              <p className="text-xs text-slate-600 leading-relaxed">
                If your landlord entered an inaccurate move-out date or lease duration, provide the discrepancy details below.
              </p>
              <Textarea
                required
                minRows={3}
                value={disputeModal.reason}
                onChange={(e) => setDisputeModal((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Explain the agreed tenancy end date and terms…"
              />
            </ModalBody>
            <ModalFooter className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                radius="full"
                onClick={() => setDisputeModal({ isOpen: false, stay: null, reason: '' })}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                radius="full"
                isLoading={processingAction}
                startContent={<Flag size={13} />}
              >
                Submit Dispute
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Maintenance Request Modal */}
      <Modal
        isOpen={maintenanceModal.isOpen}
        onClose={() => setMaintenanceModal({ isOpen: false, stay: null, description: '' })}
        size="md"
        backdrop="blur"
        classNames={{
          base: 'rounded-2xl border border-slate-200/90 shadow-2xl bg-white',
          header: 'border-b border-slate-100 p-5',
          body: 'p-5 space-y-3',
          footer: 'border-t border-slate-100 p-4 bg-slate-50/50',
        }}
      >
        <ModalContent>
          <form onSubmit={handleMaintenance}>
            <ModalHeader>
              <div className="flex items-center gap-2 text-ateneo-blue">
                <Wrench size={18} />
                <h3 className="text-base font-bold text-slate-900">Report Maintenance Issue</h3>
              </div>
            </ModalHeader>
            <ModalBody>
              <p className="text-xs text-slate-600 leading-relaxed">
                Describe the maintenance or repair issue needed for your room or common area. Your landlord will be notified directly.
              </p>
              <Textarea
                required
                minRows={3}
                value={maintenanceModal.description}
                onChange={(e) => setMaintenanceModal((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="e.g. Bathroom faucet leaking, aircon filter cleaning, door lock loose…"
              />
            </ModalBody>
            <ModalFooter className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                radius="full"
                onClick={() => setMaintenanceModal({ isOpen: false, stay: null, description: '' })}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                radius="full"
                isLoading={processingAction}
                startContent={<Send size={13} />}
              >
                Send to Landlord
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </PageContainer>
  );
}

