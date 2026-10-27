import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardBody, CardHeader, CardFooter, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import {
  Send,
  Building2,
  BedDouble,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ArrowLeft,
  RefreshCw,
  Search,
  RotateCcw,
  Save,
  Trash2,
  AlertTriangle,
  User,
  Mail,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Pagination } from '../../components/common/Pagination';
import { Textarea } from '../../components/common/Input';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { studentService } from '../../services/studentService';
import { resolvePropertyContact } from '../../utils/parseContact';
import { ROUTES } from '../../constants/routes';
import { ITEMS_PER_PAGE } from '../../constants/pagination';

const STATUS_CONFIG = {
  pending: { label: 'Pending Landlord Decision', badgeVariant: 'pending', icon: Clock },
  accepted: { label: 'Accepted by Landlord', badgeVariant: 'verified', icon: CheckCircle2 },
  declined: { label: 'Declined by Landlord', badgeVariant: 'danger', icon: XCircle },
  cancelled: { label: 'Cancelled by You', badgeVariant: 'default', icon: RotateCcw },
};

export function RoomRequestsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Filter & Pagination State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmCancelItem, setConfirmCancelItem] = useState(null);

  const load = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await studentService.getInquiries(accessToken);
        const list = res.data || [];
        setRequests(list);
        setDrafts(
          Object.fromEntries(
            list.map((item) => [
              item.id,
              {
                move_in_date: item.move_in_date || '',
                move_out_date: item.move_out_date || '',
                note: item.note || '',
              },
            ])
          )
        );
      } catch (err) {
        toast.error(err.message || 'Failed to load room inquiries');
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

  const updateDraft = (id, field, value) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const save = async (id) => {
    setProcessingId(id);
    try {
      await studentService.updateInquiry(id, drafts[id], accessToken);
      toast.success('Inquiry updated. The property owner has been notified.');
      load(true);
    } catch (err) {
      toast.error(err.message || 'Failed to update inquiry');
    } finally {
      setProcessingId(null);
    }
  };

  const cancel = async (id) => {
    setProcessingId(id);
    try {
      await studentService.cancelInquiry(id, accessToken);
      toast.info('Room inquiry cancelled.');
      load(true);
    } catch (err) {
      toast.error(err.message || 'Failed to cancel inquiry');
    } finally {
      setProcessingId(null);
    }
  };

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const propName = (item.property_name || '').toLowerCase();
        const roomLabel = (item.room_label || '').toLowerCase();
        if (!propName.includes(q) && !roomLabel.includes(q)) return false;
      }
      return true;
    });
  }, [requests, statusFilter, search]);

  // Pagination
  const totalCount = filteredRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, currentPage]);

  const headerAction = (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        radius="full"
        onClick={() => navigate(ROUTES.STUDENT_SEARCH)}
        startContent={<ArrowLeft size={14} strokeWidth={2} />}
      >
        Back to Search
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
      title="Room Inquiries & Requests"
      subtitle="Track your room applications, adjust target dates, or cancel pending requests"
      headerAction={headerAction}
    >
      <div className="space-y-6">
        {/* Single-Row Compact Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3.5 border-b border-slate-200/80 pb-3.5">
          {/* Left: Search input */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="relative w-full sm:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search dorm or room…"
                className="h-10 w-full rounded-xl border border-slate-200/90 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-ateneo-blue focus:outline-hidden shadow-2xs"
              />
            </div>

            {(search || statusFilter !== 'all') && (
              <Button
                size="sm"
                variant="ghost"
                radius="full"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                startContent={<RotateCcw size={13} strokeWidth={2} />}
                className="h-10 text-xs text-slate-500 hover:text-slate-900"
              >
                Reset
              </Button>
            )}
          </div>

          {/* Right: Status Tabs */}
          <div className="w-full lg:w-auto overflow-x-auto no-scrollbar py-0.5">
            <div className="inline-flex min-w-full sm:min-w-0 items-center gap-1 p-1 h-10 rounded-2xl bg-slate-100/90 border border-slate-200/70 shrink-0">
              {[
                { id: 'all', label: 'All Requests' },
                { id: 'pending', label: 'Pending' },
                { id: 'accepted', label: 'Accepted' },
                { id: 'declined', label: 'Declined' },
              ].map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setStatusFilter(tab.id);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-150 whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-ateneo-blue text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <PageSkeleton variant="table" rows={4} cols={3} />
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-2xs text-slate-400 mb-3">
              <Send size={26} strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Room Requests Yet</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              When exploring approved dorms, click &quot;Inquire & Request Room&quot; on any property to submit your target move-in dates.
            </p>
            <div className="mt-5">
              <Link to={ROUTES.STUDENT_SEARCH}>
                <Button size="sm" variant="primary" radius="full" startContent={<Building2 size={14} />}>
                  Search Available Rooms
                </Button>
              </Link>
            </div>
          </div>
        ) : paginatedRequests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
            No inquiries match your current search and status filters.
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedRequests.map((item) => {
              const draft = drafts[item.id] || {};
              const isPending = item.status === 'pending';
              const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;

              return (
                <Card
                  key={item.id}
                  shadow="none"
                  className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden"
                >
                  <CardHeader className="border-b border-slate-100 p-4 sm:p-5 bg-slate-50/40 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{item.property_name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <BedDouble size={13} className="text-ateneo-blue shrink-0" />
                        <span>Unit: {item.room_label}</span>
                      </p>
                    </div>

                    <Badge variant={cfg.badgeVariant} size="sm" className="font-semibold">
                      <StatusIcon size={12} className="mr-1 inline-block" />
                      {cfg.label}
                    </Badge>
                  </CardHeader>

                  <CardBody className="p-4 sm:p-5 space-y-4">
                    {/* Landlord Contact Info Strip */}
                    {(() => {
                      const ownerContact = resolvePropertyContact({
                        propertyName: item.property_name,
                        owner_email: item.owner_email,
                        owner_name: item.owner_name,
                      });
                      return (
                        <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-200/70 bg-slate-50/70 p-3 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 flex items-center gap-1 font-medium">
                              <User size={12} className="text-slate-400" />
                              Landlord:
                            </span>
                            <span className="font-semibold text-slate-800">
                              {ownerContact.contactName || item.owner_name || 'Property Owner'}
                            </span>
                          </div>

                          {ownerContact.contactEmail && (
                            <div className="flex items-center gap-1.5">
                              <Mail size={12} className="text-ateneo-blue" />
                              <a
                                href={`mailto:${ownerContact.contactEmail}`}
                                className="font-semibold text-ateneo-blue hover:underline break-all"
                              >
                                {ownerContact.contactEmail}
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* If Pending: Interactive Date & Note Editor */}
                    {isPending ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 pb-1.5 border-b border-slate-100">
                          <span className="flex items-center gap-1.5 text-ateneo-blue font-bold">
                            <Calendar size={14} />
                            Edit Move-In & Move-Out Dates
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            Update dates below, then click &ldquo;Save Changes&rdquo;
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Requested Move-In Date
                            </label>
                            <input
                              type="date"
                              value={draft.move_in_date || ''}
                              onChange={(e) => updateDraft(item.id, 'move_in_date', e.target.value)}
                              className="h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-xs text-slate-800 focus:border-ateneo-blue focus:outline-hidden shadow-2xs"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Requested Move-Out
                            </label>
                            <input
                              type="date"
                              value={draft.move_out_date || ''}
                              onChange={(e) => updateDraft(item.id, 'move_out_date', e.target.value)}
                              className="h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-xs text-slate-800 focus:border-ateneo-blue focus:outline-hidden shadow-2xs"
                            />
                          </div>
                        </div>

                        <div>
                          <Textarea
                            label="Message / Note to Landlord"
                            minRows={2}
                            value={draft.note || ''}
                            onChange={(e) => updateDraft(item.id, 'note', e.target.value)}
                            placeholder="Optional note for the property owner…"
                          />
                        </div>

                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              radius="full"
                              isLoading={processingId === item.id}
                              onClick={() => save(item.id)}
                              startContent={<Save size={13} />}
                              className="text-xs"
                            >
                              Save Changes
                            </Button>

                            <Button
                              size="sm"
                              variant="danger"
                              radius="full"
                              isLoading={processingId === item.id}
                              onClick={() => setConfirmCancelItem(item)}
                              startContent={<Trash2 size={13} />}
                              className="text-xs"
                            >
                              Cancel Request
                            </Button>
                          </div>

                          <span className="text-[11px] text-slate-400">
                            Submitted {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200/70 bg-slate-50/60 p-3 text-xs">
                          <div>
                            <span className="text-slate-400 font-medium">Requested Move-In</span>
                            <p className="font-bold text-slate-800 mt-0.5">{item.move_in_date || '—'}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium">Requested Move-Out</span>
                            <p className="font-bold text-slate-800 mt-0.5">{item.move_out_date || '—'}</p>
                          </div>
                        </div>

                        {item.note && (
                          <div className="text-xs text-slate-600">
                            <span className="font-semibold text-slate-700">Your Note: </span>
                            <span>{item.note}</span>
                          </div>
                        )}

                        {/* Landlord Response Ribbon */}
                        {item.owner_message && (
                          <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 p-3 text-xs text-slate-800 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-ateneo-blue text-[11px] uppercase tracking-wide">
                              <MessageSquare size={13} />
                              <span>Landlord Response:</span>
                            </div>
                            <p className="text-slate-700 leading-relaxed">{item.owner_message}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardBody>
                </Card>
              );
            })}

            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalCount}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        )}

        {/* Cancellation Confirmation Modal */}
        <Modal
          isOpen={Boolean(confirmCancelItem)}
          onClose={() => setConfirmCancelItem(null)}
          size="md"
          backdrop="blur"
          classNames={{
            base: 'rounded-2xl border border-slate-200/90 shadow-2xl bg-white overflow-hidden',
            header: 'border-b border-slate-100 p-5 bg-rose-50/50',
            body: 'p-5 space-y-3',
            footer: 'border-t border-slate-100 p-4 bg-slate-50/50',
          }}
        >
          <ModalContent>
            {() => (
              <>
                <ModalHeader className="flex items-center gap-2 text-rose-700">
                  <AlertTriangle size={18} className="text-rose-600 shrink-0" />
                  <h3 className="text-base font-bold text-slate-900">Cancel Room Request?</h3>
                </ModalHeader>
                <ModalBody className="text-xs text-slate-600 leading-relaxed">
                  <p>
                    Are you sure you want to cancel your room request for{' '}
                    <strong className="text-slate-900">{confirmCancelItem?.room_label}</strong> at{' '}
                    <strong className="text-slate-900">{confirmCancelItem?.property_name}</strong>?
                  </p>
                  <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-amber-800 text-[11px] leading-relaxed">
                    <strong>What happens next:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-700">
                      <li>The property owner will be immediately notified that you withdrew this request.</li>
                      <li>Your request status will be marked as &ldquo;Cancelled&rdquo;.</li>
                      <li>Your selected dates and unit reservation hold will be released.</li>
                    </ul>
                  </div>
                </ModalBody>
                <ModalFooter className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    radius="full"
                    onClick={() => setConfirmCancelItem(null)}
                  >
                    Keep Request
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    radius="full"
                    isLoading={processingId === confirmCancelItem?.id}
                    onClick={async () => {
                      const id = confirmCancelItem?.id;
                      setConfirmCancelItem(null);
                      if (id) await cancel(id);
                    }}
                  >
                    Yes, Cancel Request
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </PageContainer>
  );
}

