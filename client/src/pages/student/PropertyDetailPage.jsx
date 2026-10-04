import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
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
  Bookmark,
  Star,
  ArrowLeft,
  ShieldCheck,
  MapPin,
  BedDouble,
  Users,
  Calendar,
  Phone,
  User,
  Info,
  FileText,
  AlertTriangle,
  Flag,
  Image as ImageIcon,
  Check,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Textarea } from '../../components/common/Input';
import { WalkingTimeBadge } from '../../components/map/WalkingTimeBadge';
import { InquireButton } from '../../components/property/InquireButton';
import { PropertyLocationMap } from '../../components/map/PropertyLocationMap';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { proximityService } from '../../services/proximityService';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatPrice } from '../../utils/formatPrice';
import { PROPERTY_TYPE_LABELS } from '../../constants/propertyTypes';
import { DEFAULT_GATE, CAMPUS_GATES } from '../../constants/campusGates';
import { ROUTES } from '../../constants/routes';

function sortRooms(rooms = []) {
  return [...rooms].sort((a, b) => {
    const num = (label) => {
      const match = String(label || '').match(/\d+/);
      return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
    };
    const byNumber = num(a.label) - num(b.label);
    if (byNumber !== 0) return byNumber;
    return String(a.label || '').localeCompare(String(b.label || ''));
  });
}

export function PropertyDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const gate = searchParams.get('gate') || DEFAULT_GATE;
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interaction State
  const [saved, setSaved] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [reserveDates, setReserveDates] = useState({});
  const [reserving, setReserving] = useState(false);

  // Modals & Forms State
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [activePhotoPreview, setActivePhotoPreview] = useState(null);

  useEffect(() => {
    setLoading(true);
    proximityService
      .getPropertyDetail(id, gate, accessToken)
      .then((res) => {
        const rooms = sortRooms(res.data.rooms);
        setProperty({ ...res.data, rooms });
        setSaved(Boolean(res.data.is_saved));
        setSelectedRoomId((current) =>
          rooms.some((room) => room.id === current) ? current : rooms[0]?.id || ''
        );
      })
      .catch((err) => setError(err.message || 'Failed to load property details'))
      .finally(() => setLoading(false));
  }, [id, gate, accessToken]);

  const activeGateLabel = CAMPUS_GATES[gate]?.label || 'Ateneo';

  // Toggle Favorite
  const handleToggleSave = async () => {
    try {
      const res = await studentService.toggleFavorite(id, accessToken);
      const isNowSaved = Boolean(res.data?.saved);
      setSaved(isNowSaved);
      if (isNowSaved) {
        toast.success('Listing added to saved bookmarks.');
      } else {
        toast.info('Listing removed from saved bookmarks.');
      }
    } catch {
      toast.error('Failed to update favorite status.');
    }
  };

  // Submit Room Reservation
  const handleReserve = async (room) => {
    const startDate = reserveDates[room.id] || room.tenant_move_out_date;
    if (!startDate) {
      toast.error('Please specify a reserved move-in start date.');
      return;
    }
    setReserving(true);
    try {
      await studentService.createReservation(
        { room_id: room.id, reserved_start_date: startDate },
        accessToken
      );
      toast.success(`Reserved room "${room.label || 'Room'}" starting ${startDate}!`);
      const res = await proximityService.getPropertyDetail(id, gate, accessToken);
      setProperty(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to create room reservation.');
    } finally {
      setReserving(false);
    }
  };

  // Submit Listing Report
  const handleReport = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    setSubmittingReport(true);
    try {
      await studentService.reportListing({ property_id: id, reason: reportReason }, accessToken);
      setShowReport(false);
      setReportReason('');
      toast.success('Report submitted. An administrator will inspect this listing.');
    } catch (err) {
      toast.error(err.message || 'Failed to submit listing report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Submit Student Review
  const handleReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await studentService.createReview(
        { property_id: id, rating: reviewRating, comment: reviewComment },
        accessToken
      );
      setReviewComment('');
      setReviewRating(5);
      toast.success('Review submitted! It will appear after admin moderation.');
    } catch (err) {
      toast.error(err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const selectedRoom =
    property?.rooms?.find((room) => room.id === selectedRoomId) || property?.rooms?.[0] || null;

  // Golden Detail Standard: Header Action Bar
  const headerAction = (
    <div className="flex flex-wrap items-center gap-2">
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
        variant="secondary"
        size="sm"
        radius="full"
        onClick={handleToggleSave}
        startContent={
          <Bookmark
            size={14}
            strokeWidth={2}
            className={saved ? 'fill-ateneo-blue text-ateneo-blue' : 'text-slate-500'}
          />
        }
      >
        {saved ? 'Saved' : 'Save Listing'}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        radius="full"
        onClick={() => setShowReport(true)}
        startContent={<Flag size={14} strokeWidth={2} className="text-slate-500" />}
      >
        Report
      </Button>

      {property && (
        <InquireButton
          contactName={property.contact_name}
          contactPhone={property.contact_phone}
          description={property.description}
          propertyName={property.name}
          propertyId={property.id}
          room={selectedRoom}
          accessToken={accessToken}
        />
      )}
    </div>
  );

  return (
    <PageContainer
      title={property ? property.name : 'Property Inspection'}
      subtitle={property ? property.address : 'Loading verified housing details...'}
      headerAction={headerAction}
    >
      {loading ? (
        <PageSkeleton variant="detail" />
      ) : error || !property ? (
        <div className="rounded-2xl border border-rose-200/90 bg-rose-50/80 p-6 text-center shadow-2xs">
          <AlertTriangle size={24} className="mx-auto text-rose-500 mb-2" />
          <h3 className="text-sm font-bold text-rose-900">Property Not Found</h3>
          <p className="mt-1 text-xs text-rose-700">{error || 'This property is inactive or does not exist.'}</p>
          <div className="mt-4">
            <Button
              size="sm"
              variant="secondary"
              radius="full"
              onClick={() => navigate(ROUTES.STUDENT_SEARCH)}
              startContent={<ArrowLeft size={14} />}
            >
              Back to Search
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Metadata Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow-2xs">
                {PROPERTY_TYPE_LABELS[property.type] || property.type}
              </span>
              {property.is_verified && (
                <Badge variant="verified" size="sm" className="font-semibold">
                  <ShieldCheck size={13} className="mr-1 inline-block shrink-0" />
                  Verified Listing
                </Badge>
              )}
              <WalkingTimeBadge minutes={property.walking_minutes} />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin size={13} className="text-ateneo-blue shrink-0" />
              <span>{activeGateLabel} Gate Proximity</span>
            </div>
          </div>

          {/* 2-Column Responsive Layout: Left Details + Right Map & Landlord */}
          <div className="grid gap-6 lg:grid-cols-12 items-start">
            {/* ------------------------------------------------------------- */}
            {/* LEFT COLUMN: ROOMS, PHOTOS, RULES, REVIEWS (7 cols) */}
            {/* ------------------------------------------------------------- */}
            <div className="lg:col-span-7 space-y-6">
              {/* Card 1: Room Selector & Inspection */}
              <Card shadow="none" className="rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                <CardHeader className="border-b border-slate-100 p-4 sm:p-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Rooms & Pricing</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select a unit to inspect availability, amenities, and photos
                    </p>
                  </div>
                  {property.rooms?.length > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {property.rooms.length} {property.rooms.length === 1 ? 'room' : 'rooms'}
                    </span>
                  )}
                </CardHeader>

                <CardBody className="p-4 sm:p-5 space-y-4">
                  {/* Room Selection Tabs */}
                  {property.rooms?.length > 0 ? (
                    <div className="w-full overflow-x-auto no-scrollbar py-0.5">
                      <div className="inline-flex min-w-full sm:min-w-0 items-center gap-1.5 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/70 shrink-0">
                        {property.rooms.map((room) => {
                          const isSelected = room.id === selectedRoomId;
                          return (
                            <button
                              key={room.id}
                              type="button"
                              onClick={() => setSelectedRoomId(room.id)}
                              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all duration-150 whitespace-nowrap shrink-0 ${
                                isSelected
                                  ? 'bg-ateneo-blue text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                              }`}
                            >
                              <BedDouble size={14} />
                              <span>{room.label || 'Room'}</span>
                              <span
                                className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {formatPrice(room.price)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No rooms configured for this property.</p>
                  )}

                  {/* Selected Room Details Card */}
                  {selectedRoom && (
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-bold text-slate-900">{selectedRoom.label || 'Room'}</h4>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                            <span className="font-extrabold text-ateneo-blue text-sm">
                              {formatPrice(selectedRoom.price)}/mo
                            </span>
                            <span className="flex items-center gap-1">
                              <Users size={13} className="text-slate-400" />
                              Capacity: {selectedRoom.capacity} {selectedRoom.capacity === 1 ? 'person' : 'persons'}
                            </span>
                          </div>
                        </div>

                        <Badge variant={selectedRoom.is_available ? 'vacant' : 'occupied'}>
                          {selectedRoom.is_available ? 'Available Now' : 'Currently Occupied'}
                        </Badge>
                      </div>

                      {/* Move-out / Occupancy notice */}
                      {selectedRoom.tenant_move_out_date && !selectedRoom.is_available && (
                        <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 p-3 text-xs text-amber-800 flex items-start gap-2">
                          <Calendar size={14} className="shrink-0 text-amber-600 mt-0.5" />
                          <div>
                            <span className="font-semibold">Occupied until: </span>
                            <span>{selectedRoom.tenant_move_out_date}</span>
                            <p className="mt-0.5 text-[11px] text-amber-700">
                              You can reserve this room in advance for dates starting on or after this move-out date.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Active Reservation by current user */}
                      {selectedRoom.my_reservation && (
                        <div className="rounded-lg border border-blue-200/80 bg-blue-50/80 p-3 text-xs text-ateneo-blue flex items-start gap-2">
                          <Sparkles size={14} className="shrink-0 text-ateneo-blue mt-0.5" />
                          <div>
                            <span className="font-semibold">Your Active Reservation: </span>
                            <span>Starts {selectedRoom.my_reservation.reserved_start_date}</span>
                            <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-ateneo-blue text-white font-bold text-[10px] uppercase">
                              {selectedRoom.my_reservation.status}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Reservation Date Picker & CTA (if room is occupied and eligible to reserve) */}
                      {selectedRoom.can_reserve && !selectedRoom.my_reservation && (
                        <div className="pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-slate-700">Reserve starting:</label>
                            <input
                              type="date"
                              min={selectedRoom.tenant_move_out_date}
                              value={reserveDates[selectedRoom.id] || selectedRoom.tenant_move_out_date || ''}
                              onChange={(e) =>
                                setReserveDates((prev) => ({ ...prev, [selectedRoom.id]: e.target.value }))
                              }
                              className="h-8 rounded-lg border border-slate-200/90 bg-white px-2.5 text-xs text-slate-800 focus:border-ateneo-blue focus:outline-hidden"
                            />
                          </div>

                          <Button
                            size="sm"
                            variant="primary"
                            radius="full"
                            isLoading={reserving}
                            onClick={() => handleReserve(selectedRoom)}
                            startContent={<Calendar size={13} strokeWidth={2} />}
                          >
                            Reserve Room
                          </Button>
                        </div>
                      )}

                      {/* Room Photo Gallery */}
                      {selectedRoom.images?.length > 0 ? (
                        <div className="pt-2">
                          <p className="text-xs font-semibold text-slate-700 mb-2">Room Photos</p>
                          <div className="grid grid-cols-3 gap-2.5">
                            {selectedRoom.images.map((img) => (
                              <button
                                key={img.id}
                                type="button"
                                onClick={() => setActivePhotoPreview(img.url)}
                                className="group relative h-28 w-full rounded-xl overflow-hidden border border-slate-200/80 bg-slate-100 focus:outline-hidden hover:opacity-95 transition"
                              >
                                <img
                                  src={img.url}
                                  alt="Room photo"
                                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <ImageIcon size={18} className="text-white drop-shadow-sm" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                          <ImageIcon size={18} className="mx-auto mb-1 text-slate-300" />
                          <span>No photos uploaded for this room</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Card 2: About Property */}
              {property.description && (
                <Card shadow="none" className="rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                  <CardHeader className="border-b border-slate-100 p-4 sm:p-5 flex items-center gap-2">
                    <Info size={16} className="text-ateneo-blue" />
                    <h3 className="text-base font-semibold text-slate-900">About the Property</h3>
                  </CardHeader>
                  <CardBody className="p-4 sm:p-5">
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {property.description}
                    </p>
                  </CardBody>
                </Card>
              )}

              {/* Card 3: House Rules */}
              {property.house_rules?.length > 0 && (
                <Card shadow="none" className="rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                  <CardHeader className="border-b border-slate-100 p-4 sm:p-5 flex items-center gap-2">
                    <FileText size={16} className="text-ateneo-blue" />
                    <h3 className="text-base font-semibold text-slate-900">House Rules & Policies</h3>
                  </CardHeader>
                  <CardBody className="p-4 sm:p-5">
                    <ul className="space-y-2">
                      {property.house_rules.map((rule) => (
                        <li key={rule.id} className="flex items-start gap-2.5 text-xs text-slate-700">
                          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mt-0.5">
                            <Check size={11} strokeWidth={3} />
                          </div>
                          <span>{rule.rule}</span>
                        </li>
                      ))}
                    </ul>
                  </CardBody>
                </Card>
              )}

              {/* Card 4: Verified Student Reviews & Submission */}
              <Card shadow="none" className="rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                <CardHeader className="border-b border-slate-100 p-4 sm:p-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-ateneo-blue" />
                    <h3 className="text-base font-semibold text-slate-900">Student Reviews</h3>
                  </div>
                  {property.reviews?.length > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {property.reviews.length} {property.reviews.length === 1 ? 'review' : 'reviews'}
                    </span>
                  )}
                </CardHeader>

                <CardBody className="p-4 sm:p-5 space-y-4">
                  {/* Reviews List */}
                  {property.reviews?.length > 0 ? (
                    <div className="space-y-3">
                      {property.reviews.map((rev) => (
                        <div key={rev.id} className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-3.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar size="sm" name={rev.profiles?.full_name || 'Student'} className="h-6 w-6 text-[10px]" />
                              <span className="text-xs font-semibold text-slate-800">
                                {rev.profiles?.full_name || 'Verified Student'}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  size={12}
                                  className={
                                    i < (rev.rating || 5)
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-slate-200'
                                  }
                                />
                              ))}
                            </div>
                          </div>
                          {rev.comment && <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No student reviews published yet.</p>
                  )}

                  {/* Review Submission Form */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-slate-700">Leave a review</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Only tenants with completed stays can review. Reviews are moderated by admins before publishing.
                      </p>
                    </div>

                    <form onSubmit={handleReview} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Your Rating</label>
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => setReviewRating(star)}
                              className="p-1 rounded-md hover:bg-amber-50 focus:outline-hidden transition"
                            >
                              <Star
                                size={18}
                                className={
                                  star <= (hoverRating || reviewRating)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300'
                                }
                              />
                            </button>
                          ))}
                          <span className="ml-2 text-xs font-semibold text-slate-600">{reviewRating} / 5 Stars</span>
                        </div>
                      </div>

                      <div>
                        <Textarea
                          label="Review Comments"
                          minRows={2}
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Share your experience regarding cleanliness, amenities, landlord communication, and safety…"
                        />
                      </div>

                      <Button
                        type="submit"
                        size="sm"
                        variant="secondary"
                        radius="full"
                        isLoading={submittingReview}
                        startContent={<Star size={13} strokeWidth={2} />}
                      >
                        Submit Review for Moderation
                      </Button>
                    </form>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* RIGHT COLUMN: DIRECTIONS MAP, LANDLORD & SAFETY (5 cols) */}
            {/* ------------------------------------------------------------- */}
            <div className="lg:col-span-5 space-y-6">
              {/* Card A: Location & Campus Directions */}
              <Card shadow="none" className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-4 sm:p-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-ateneo-blue" />
                    <h3 className="text-base font-semibold text-slate-900">Campus Route</h3>
                  </div>
                  <WalkingTimeBadge minutes={property.walking_minutes} />
                </CardHeader>

                <CardBody className="p-4 sm:p-5 space-y-3">
                  <p className="text-xs text-slate-600">
                    Walking navigation path from <span className="font-semibold text-slate-800">{activeGateLabel} Gate</span>.
                  </p>
                  <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 shadow-2xs">
                    <PropertyLocationMap
                      property={property}
                      gateId={gate}
                      walkingMinutes={property.walking_minutes}
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Card B: Landlord Contact Card */}
              <Card shadow="none" className="rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                <CardHeader className="border-b border-slate-100 p-4 sm:p-5">
                  <h3 className="text-base font-semibold text-slate-900">Property Contact</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Verified landlord communication channel</p>
                </CardHeader>

                <CardBody className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      size="md"
                      name={property.contact_name || 'Landlord'}
                      className="h-10 w-10 bg-ateneo-blue text-white text-xs font-bold"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {property.contact_name || 'Property Manager'}
                      </h4>
                      <p className="text-[11px] text-slate-500">Authorized Housing Representative</p>
                    </div>
                  </div>

                  {property.contact_phone && (
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-700 border border-slate-200/60">
                      <Phone size={14} className="text-ateneo-blue shrink-0" />
                      <span className="font-semibold">{property.contact_phone}</span>
                    </div>
                  )}

                  <div className="pt-2">
                    <InquireButton
                      contactName={property.contact_name}
                      contactPhone={property.contact_phone}
                      description={property.description}
                      propertyName={property.name}
                      propertyId={property.id}
                      room={selectedRoom}
                      accessToken={accessToken}
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Card C: Campus Housing Safety Guarantee */}
              <div className="rounded-2xl border border-blue-200/80 bg-linear-to-br from-blue-50/60 to-slate-50/80 p-4 sm:p-5 space-y-2.5">
                <div className="flex items-center gap-2 text-ateneo-blue font-bold text-xs">
                  <ShieldCheck size={16} />
                  <span>DormSafe Safety Guarantee</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  All listings on DormSafe are situated within the official 2 km campus perimeter and audited by Ateneo administrators. No online monetary transactions are collected on the platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Room Photos */}
      <Modal
        isOpen={Boolean(activePhotoPreview)}
        onClose={() => setActivePhotoPreview(null)}
        size="3xl"
        backdrop="blur"
        classNames={{
          base: 'rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xl',
          body: 'p-2',
        }}
      >
        <ModalContent>
          <ModalBody>
            {activePhotoPreview && (
              <img
                src={activePhotoPreview}
                alt="Room Preview"
                className="max-h-[80vh] w-full rounded-xl object-contain bg-black"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Report Listing Modal */}
      <Modal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
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
          <form onSubmit={handleReport}>
            <ModalHeader>
              <div className="flex items-center gap-2 text-rose-600">
                <Flag size={18} />
                <h3 className="text-base font-bold text-slate-900">Report Listing Issue</h3>
              </div>
            </ModalHeader>

            <ModalBody>
              <p className="text-xs text-slate-600 leading-relaxed">
                Submit a report if this listing contains inaccurate pricing, incorrect contact information, fraudulent claims, or violates campus housing safety guidelines.
              </p>
              <Textarea
                required
                minRows={4}
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Explain the reason for reporting this property in detail…"
              />
            </ModalBody>

            <ModalFooter className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                radius="full"
                onClick={() => setShowReport(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                radius="full"
                isLoading={submittingReport}
                startContent={<Flag size={13} />}
              >
                Submit Report
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </PageContainer>
  );
}

