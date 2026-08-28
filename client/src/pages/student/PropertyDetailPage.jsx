import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { Badge } from '../../components/common/Badge';
import { WalkingTimeBadge } from '../../components/map/WalkingTimeBadge';
import { InquireButton } from '../../components/property/InquireButton';
import { PropertyLocationMap } from '../../components/map/PropertyLocationMap';
import { Loader } from '../../components/common/Loader';
import { proximityService } from '../../services/proximityService';
import { studentService } from '../../services/studentService';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { formatPrice } from '../../utils/formatPrice';
import { PROPERTY_TYPE_LABELS } from '../../constants/propertyTypes';
import { DEFAULT_GATE } from '../../constants/campusGates';

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

  useEffect(() => {
    proximityService
      .getPropertyDetail(id, gate, accessToken)
      .then((res) => {
        setProperty(res.data);
        setSaved(!!res.data.is_saved);
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

  if (loading) return <PageContainer><Loader message="Loading property…" /></PageContainer>;
  if (error) {
    return (
      <PageContainer>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Link to="/student/search" className="text-sm text-ateneo-blue hover:underline">
        ← Back to search
      </Link>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{property.name}</h1>
            <p className="text-sm text-gray-500">{PROPERTY_TYPE_LABELS[property.type]}</p>
            <p className="mt-1 text-gray-600">{property.address}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {property.is_verified && <Badge variant="verified">Verified</Badge>}
            <WalkingTimeBadge minutes={property.walking_minutes} />
            <Button variant="secondary" onClick={handleToggleSave}>
              {saved ? 'Saved ★' : 'Save listing'}
            </Button>
            <Button variant="ghost" onClick={() => setShowReport(true)}>
              Report listing
            </Button>
            <InquireButton
              contactName={property.contact_name}
              contactPhone={property.contact_phone}
              description={property.description}
              propertyName={property.name}
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

        {property.images?.length > 0 && (
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {property.images.map((img) => (
              <img
                key={img.id}
                src={img.url}
                alt=""
                className="h-40 w-full rounded-lg object-cover"
              />
            ))}
          </div>
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

        <section className="mt-6">
          <h2 className="font-semibold">Rooms & Availability</h2>
          {reserveMsg && <p className="mt-2 text-sm text-green-700">{reserveMsg}</p>}
          {reserveErr && <p className="mt-2 text-sm text-red-600">{reserveErr}</p>}
          <ul className="mt-2 divide-y divide-gray-100">
            {property.rooms?.map((room) => (
              <li key={room.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{room.label || 'Room'} · {formatPrice(room.price)}/mo</p>
                  <p className="text-xs text-gray-500">Capacity: {room.capacity}</p>
                  {room.tenant_move_out_date && !room.is_available && (
                    <p className="text-xs text-amber-700">
                      Current tenant until {room.tenant_move_out_date}
                    </p>
                  )}
                  {room.my_reservation && (
                    <p className="text-xs text-ateneo-blue">
                      Your reservation: {room.my_reservation.reserved_start_date} ({room.my_reservation.status})
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={room.is_available ? 'vacant' : 'occupied'}>
                    {room.is_available ? 'Available' : 'Occupied'}
                  </Badge>
                  {room.can_reserve && !room.my_reservation && (
                    <div className="flex flex-col items-end gap-2">
                      <input
                        type="date"
                        min={room.tenant_move_out_date}
                        value={reserveDates[room.id] || room.tenant_move_out_date}
                        onChange={(e) =>
                          setReserveDates((prev) => ({ ...prev, [room.id]: e.target.value }))
                        }
                        className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                      />
                      <Button onClick={() => handleReserve(room)}>Reserve room</Button>
                      <p className="max-w-[180px] text-right text-[10px] text-gray-500">
                        On or after {room.tenant_move_out_date} (e.g. later months)
                      </p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

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
                <li key={rev.id} className="rounded-lg border border-gray-100 px-3 py-2">
                  <p className="font-medium">{'★'.repeat(rev.rating)} · {rev.profiles?.full_name || 'Student'}</p>
                  {rev.comment && <p className="text-gray-600">{rev.comment}</p>}
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
