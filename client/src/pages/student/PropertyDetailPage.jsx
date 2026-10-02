import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Bookmark, Star, ArrowLeft } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Badge } from '../../components/common/Badge';
import { WalkingTimeBadge } from '../../components/map/WalkingTimeBadge';
import { InquireButton } from '../../components/property/InquireButton';
import { PropertyLocationMap } from '../../components/map/PropertyLocationMap';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { proximityService } from '../../services/proximityService';
import { studentService } from '../../services/studentService';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { formatPrice } from '../../utils/formatPrice';
import { PROPERTY_TYPE_LABELS } from '../../constants/propertyTypes';
import { DEFAULT_GATE } from '../../constants/campusGates';

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
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reserveMsg, setReserveMsg] = useState('');
  const [reserveErr, setReserveErr] = useState('');
  const [reserveDates, setReserveDates] = useState({});
  const [saved, setSaved] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');

  useEffect(() => {
    proximityService
      .getPropertyDetail(id, gate, accessToken)
      .then((res) => {
        const rooms = sortRooms(res.data.rooms);
        setProperty({ ...res.data, rooms });
        setSaved(!!res.data.is_saved);
        setSelectedRoomId((current) =>
          rooms.some((room) => room.id === current) ? current : rooms[0]?.id || ''
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, gate, accessToken]);

  async function handleReserve(room) {
    setReserveMsg('');
    setReserveErr('');
    const startDate = reserveDates[room.id] || room.tenant_move_out_date;
    try {
      await studentService.createReservation(
        { room_id: room.id, reserved_start_date: startDate },
        accessToken
      );
      setReserveMsg(`Reserved starting ${startDate}. You can change the date from My Stay.`);
      const res = await proximityService.getPropertyDetail(id, gate, accessToken);
      setProperty(res.data);
    } catch (err) {
      setReserveErr(err.message);
    }
  }

  async function handleToggleSave() {
    const res = await studentService.toggleFavorite(id, accessToken);
    setSaved(res.data?.saved);
    setActionMsg(res.data?.saved ? 'Saved to favorites' : 'Removed from favorites');
  }

  async function handleReport(e) {
    e.preventDefault();
    await studentService.reportListing({ property_id: id, reason: reportReason }, accessToken);
    setShowReport(false);
    setReportReason('');
    setActionMsg('Report submitted. Admins will review it.');
  }

  async function handleReview(e) {
    e.preventDefault();
    await studentService.createReview(
      { property_id: id, rating: reviewRating, comment: reviewComment },
      accessToken
    );
    setReviewComment('');
    setActionMsg('Review submitted for admin moderation.');
  }

  if (loading) return <PageContainer><PageSkeleton variant="detail" /></PageContainer>;
  if (error) {
    return (
      <PageContainer>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">{error}</div>
      </PageContainer>
    );
  }

  const selectedRoom = property.rooms?.find((room) => room.id === selectedRoomId) || property.rooms?.[0] || null;

  return (
    <PageContainer>
      <Link to="/student/search" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ateneo-blue hover:underline">
        <ArrowLeft size={14} />
        <span>Back to Search</span>
      </Link>

      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{PROPERTY_TYPE_LABELS[property.type]}</p>
            <p className="mt-1 text-sm text-gray-600">{property.address}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {property.is_verified && <Badge variant="verified">Verified</Badge>}
            <WalkingTimeBadge minutes={property.walking_minutes} />
            <Button
              variant="secondary"
              onClick={handleToggleSave}
              startContent={<Bookmark size={14} className={saved ? 'fill-ateneo-blue' : ''} />}
            >
              {saved ? 'Saved' : 'Save Listing'}
            </Button>
            <Button variant="ghost" onClick={() => setShowReport(true)}>
              Report listing
            </Button>
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
        </div>

        {actionMsg && <p className="mt-2 text-sm text-green-700">{actionMsg}</p>}

        {showReport && (
          <form onSubmit={handleReport} className="mt-4 rounded-lg border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-medium">Report suspicious or inaccurate listing</p>
            <textarea
              required
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-2 py-1 text-sm"
              rows={3}
              placeholder="Describe the issue…"
            />
            <div className="mt-2 flex gap-2">
              <Button type="submit">Submit report</Button>
              <Button type="button" variant="ghost" onClick={() => setShowReport(false)}>Cancel</Button>
            </div>
          </form>
        )}

        {property.rooms?.length > 0 && (
          <div className="mt-6 max-w-md">
            <label htmlFor="room-picker" className="mb-1 block text-sm font-medium text-gray-700">
              Choose a room
            </label>
            <select
              id="room-picker"
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {property.rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.label || 'Room'} · {formatPrice(room.price)}/mo · {room.is_available ? 'Available' : 'Occupied'}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedRoom && (
          <section className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{selectedRoom.label || 'Room'}</h2>
                <p className="mt-1 text-sm text-gray-700">{formatPrice(selectedRoom.price)}/mo</p>
                <p className="text-sm text-gray-600">Capacity: {selectedRoom.capacity}</p>
                {selectedRoom.tenant_move_out_date && !selectedRoom.is_available && (
                  <p className="text-xs text-amber-700">
                    Current tenant until {selectedRoom.tenant_move_out_date}
                  </p>
                )}
                {selectedRoom.my_reservation && (
                  <p className="text-xs text-ateneo-blue">
                    Your reservation: {selectedRoom.my_reservation.reserved_start_date} ({selectedRoom.my_reservation.status})
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={selectedRoom.is_available ? 'vacant' : 'occupied'}>
                  {selectedRoom.is_available ? 'Available' : 'Occupied'}
                </Badge>
                {selectedRoom.can_reserve && !selectedRoom.my_reservation && (
                  <div className="flex flex-col items-end gap-2">
                    <input
                      type="date"
                      min={selectedRoom.tenant_move_out_date}
                      value={reserveDates[selectedRoom.id] || selectedRoom.tenant_move_out_date}
                      onChange={(e) =>
                        setReserveDates((prev) => ({ ...prev, [selectedRoom.id]: e.target.value }))
                      }
                      className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                    />
                    <Button onClick={() => handleReserve(selectedRoom)}>Reserve room</Button>
                    <p className="max-w-[180px] text-right text-[10px] text-gray-500">
                      On or after {selectedRoom.tenant_move_out_date} (e.g. later months)
                    </p>
                  </div>
                )}
              </div>
            </div>
            {reserveMsg && <p className="mt-2 text-sm text-green-700">{reserveMsg}</p>}
            {reserveErr && <p className="mt-2 text-sm text-red-600">{reserveErr}</p>}
          </section>
        )}

        {selectedRoom && (
          selectedRoom.images?.length > 0 ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {selectedRoom.images.map((img) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt={`${selectedRoom.label || 'Room'} photo`}
                  className="h-40 w-full rounded-lg object-cover"
                />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">No photos for this room yet.</p>
          )
        )}

        <section className="mt-6">
          <h2 className="font-semibold">Location & Directions</h2>
          <div className="mt-3">
            <PropertyLocationMap
              property={property}
              gateId={gate}
              walkingMinutes={property.walking_minutes}
            />
          </div>
        </section>

        {property.description && (
          <section className="mt-6">
            <h2 className="font-semibold">About</h2>
            <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{property.description}</p>
          </section>
        )}

        {property.house_rules?.length > 0 && (
          <section className="mt-6">
            <h2 className="font-semibold">House Rules</h2>
            <ul className="mt-2 list-inside list-disc text-sm text-gray-700">
              {property.house_rules.map((rule) => (
                <li key={rule.id}>{rule.rule}</li>
              ))}
            </ul>
          </section>
        )}

        {property.reviews?.length > 0 && (
          <section className="mt-6">
            <h2 className="font-semibold">Reviews</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {property.reviews.map((rev) => (
                <li key={rev.id} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                      <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                    ))}
                    <span className="ml-1.5 text-xs font-semibold text-gray-700">
                      {rev.profiles?.full_name || 'Student'}
                    </span>
                  </div>
                  {rev.comment && <p className="mt-1 text-xs text-gray-600 leading-relaxed">{rev.comment}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h2 className="font-semibold">Leave a review</h2>
          <p className="text-xs text-gray-500">Available after a completed verified stay. Moderated by admin.</p>
          <form onSubmit={handleReview} className="mt-3 space-y-2">
            <div>
              <label className="text-sm">Rating</label>
              <select
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
                className="ml-2 rounded border border-gray-300 px-2 py-1 text-sm"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} stars</option>
                ))}
              </select>
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm"
              rows={2}
              placeholder="Optional comment…"
            />
            <Button type="submit">Submit review</Button>
          </form>
        </section>
      </div>
    </PageContainer>
  );
}
