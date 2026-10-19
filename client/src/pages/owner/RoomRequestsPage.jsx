import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Textarea } from '@heroui/react';
import {
  Inbox,
  User,
  Building2,
  BedDouble,
  Calendar,
  Mail,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  AlertCircle,
  X,
  Send,
} from 'lucide-react';
import { OwnerLayout } from '../../components/layout/OwnerLayout';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Pagination } from '../../components/common/Pagination';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { ownerService } from '../../services/ownerService';
import { ITEMS_PER_PAGE } from '../../constants/pagination';

const STATUS_LABEL = {
  pending: 'Pending Review',
  accepted: 'Accepted',
  declined: 'Declined',
  cancelled: 'Cancelled by Student',
};

export function OwnerRoomRequestsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState([]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [error, setError] = useState('');

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ownerService.getInquiries(accessToken);
      setRequests(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load room requests');
      toast.error(err.message || 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  }, [accessToken, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function reply(id, status) {
    setError('');
    setActionInProgress(id);
    try {
      await ownerService.replyToInquiry(id, { status, message: messages[id] || '' }, accessToken);
      toast.success(
        status === 'accepted'
          ? 'Inquiry accepted! The student has been notified.'
          : 'Inquiry declined.'
      );
      load();
    } catch (err) {
      setError(err.message || 'Failed to update request status');
      toast.error(err.message || 'Failed to process inquiry reply');
    } finally {
      setActionInProgress(null);
    }
  }

  // Filter Logic
  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const matchesSearch =
        !searchTerm.trim() ||
        (item.student_name && item.student_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.student_email && item.student_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.property_name && item.property_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.room_label && item.room_label.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.note && item.note.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE));
  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, page]);

  const statusCounts = useMemo(() => {
    return {
      all: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
      accepted: requests.filter((r) => r.status === 'accepted').length,
      declined: requests.filter((r) => r.status === 'declined').length,
    };
  }, [requests]);

  // Header Actions
  const headerAction = (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        radius="full"
        variant="ghost"
        isLoading={loading}
        onClick={() => load()}
        startContent={!loading && <RefreshCw size={14} />}
      >
        Refresh Requests
      </Button>
    </div>
  );

  return (
    <OwnerLayout
      title="Student Room Inquiries & Requests"
      subtitle="Review student accommodation applications, verify proposed stay dates, and respond"
      headerAction={headerAction}
    >
      <div className="space-y-6">
        {/* ==================================================================== */}
        {/* SINGLE-ROW COMPACT TOOLBAR (GOLDEN STANDARD) */}
        {/* ==================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3.5 border-b border-slate-200/80 pb-3.5">
          {/* Left: Search + Reset */}
          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            <div className="relative w-full sm:w-64">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search student, room, or note…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200/90 bg-white/95 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 shadow-2xs transition-all focus:border-ateneo-blue focus:outline-none focus:ring-2 focus:ring-ateneo-blue/20"
              />
            </div>

            {(searchTerm || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/70 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition cursor-pointer"
              >
                <X size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Right Edge: Status Tab Capsule */}
          <div className="w-full lg:w-auto overflow-x-auto no-scrollbar py-0.5">
            <div className="inline-flex min-w-full sm:min-w-0 items-center gap-1 p-1 h-10 rounded-2xl bg-slate-100/90 border border-slate-200/70 shrink-0">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`rounded-xl px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                  statusFilter === 'all'
                    ? 'bg-white text-ateneo-blue shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({statusCounts.all})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                  statusFilter === 'pending'
                    ? 'bg-white text-amber-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock size={13} className="text-amber-600" />
                <span>Pending ({statusCounts.pending})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('accepted')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                  statusFilter === 'accepted'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>Accepted ({statusCounts.accepted})</span>
              </button>
              {statusCounts.declined > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('declined')}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                    statusFilter === 'declined'
                      ? 'bg-white text-slate-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <XCircle size={13} className="text-slate-400" />
                  <span>Declined ({statusCounts.declined})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            <AlertCircle size={15} className="shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ==================================================================== */}
        {/* REQUESTS CONTENT & CARDS */}
        {/* ==================================================================== */}
        {loading ? (
          <PageSkeleton variant="grid" count={3} />
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/95 p-12 text-center shadow-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-ateneo-blue">
              <Inbox size={24} strokeWidth={1.75} />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">
              {searchTerm || statusFilter !== 'all'
                ? 'No matching room requests'
                : 'No room requests received yet'}
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search keywords or resetting your status filters.'
                : 'When authenticated Ateneo students submit inquiries from your listing page, they will appear here for review.'}
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <div className="mt-5 flex justify-center">
                <Button
                  size="sm"
                  radius="full"
                  variant="secondary"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4">
              {paginatedRequests.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200/90 bg-white/95 p-5 sm:p-6 shadow-xs backdrop-blur-xs space-y-4 transition-all hover:border-slate-300 hover:shadow-md"
                >
                  {/* Card Header: Student Avatar, Name, Unit, and Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-ateneo-blue border border-blue-100/80 font-bold text-sm shadow-2xs">
                        {item.student_name ? item.student_name.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900 tracking-tight">
                            {item.student_name}
                          </h3>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200/70">
                            {item.room_label || 'Room'} · {item.property_name}
                          </span>
                        </div>
                        {item.student_email && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-mono">
                            <Mail size={12} />
                            <span>{item.student_email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="self-end sm:self-start shrink-0">
                      <Badge
                        variant={
                          item.status === 'accepted'
                            ? 'verified'
                            : item.status === 'pending'
                            ? 'pending'
                            : 'occupied'
                        }
                      >
                        {STATUS_LABEL[item.status] || item.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Stay Dates & Student Notes */}
                  <div className="grid gap-3 sm:grid-cols-3 text-xs">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Requested Move-In
                      </span>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Calendar size={13} className="text-ateneo-blue" />
                        <span>{item.move_in_date || 'Flexible'}</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Requested Move-Out
                      </span>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Calendar size={13} className="text-slate-500" />
                        <span>{item.move_out_date || 'Flexible'}</span>
                      </div>
                    </div>

                    <div className="sm:col-span-1 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Student Inquiry Note
                      </span>
                      <p className="text-slate-700 italic line-clamp-2">
                        "{item.note || 'No additional note provided.'}"
                      </p>
                    </div>
                  </div>

                  {/* Owner Action & Reply Form */}
                  {item.status === 'pending' ? (
                    <div className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-4 space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 mb-1 block">
                          Landlord Reply & Move-In Instructions (Optional)
                        </label>
                        <Textarea
                          aria-label="Message to student"
                          placeholder="e.g. Please bring your student ID and 1-month deposit during check-in on Monday..."
                          value={messages[item.id] || ''}
                          onChange={(e) =>
                            setMessages((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          variant="bordered"
                          minRows={2}
                          classNames={{
                            inputWrapper: 'border-slate-200/90 hover:border-slate-300 bg-white rounded-xl text-xs',
                            input: 'text-xs text-slate-800 leading-relaxed',
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          radius="full"
                          disabled={actionInProgress === item.id}
                          onClick={() => reply(item.id, 'declined')}
                          startContent={<XCircle size={14} />}
                        >
                          Decline Inquiry
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          radius="full"
                          isLoading={actionInProgress === item.id}
                          onClick={() => reply(item.id, 'accepted')}
                          startContent={!actionInProgress && <CheckCircle2 size={14} strokeWidth={2.5} />}
                        >
                          Accept & Confirm Reservation
                        </Button>
                      </div>
                    </div>
                  ) : (
                    item.owner_message && (
                      <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/90 p-3 text-xs">
                        <MessageSquare size={14} className="text-ateneo-blue shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-800">Your Landlord Note: </span>
                          <span className="text-slate-600">{item.owner_message}</span>
                        </div>
                      </div>
                    )
                  )}
                </article>
              ))}
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={filteredRequests.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
