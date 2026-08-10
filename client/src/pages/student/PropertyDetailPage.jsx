import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { Badge } from '../../components/common/Badge';
import { WalkingTimeBadge } from '../../components/map/WalkingTimeBadge';
import { Loader } from '../../components/common/Loader';
import { proximityService } from '../../services/proximityService';
import { useAuth } from '../../hooks/useAuth';
import { formatPrice } from '../../utils/formatPrice';
import { PROPERTY_TYPE_LABELS } from '../../constants/propertyTypes';
import { DEFAULT_GATE } from '../../constants/campusGates';

export function PropertyDetailPage() {
  const { id } = useParams();
  const { accessToken } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    proximityService
      .getPropertyDetail(id, DEFAULT_GATE, accessToken)
      .then((res) => setProperty(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, accessToken]);

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
          <div className="flex gap-2">
            {property.is_verified && <Badge variant="verified">Verified</Badge>}
            <WalkingTimeBadge minutes={property.walking_minutes} />
          </div>
        </div>

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
          <h2 className="font-semibold">Rooms & Availability</h2>
          <ul className="mt-2 divide-y divide-gray-100">
            {property.rooms?.map((room) => (
              <li key={room.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{formatPrice(room.price)}/mo</p>
                  <p className="text-xs text-gray-500">Capacity: {room.capacity}</p>
                </div>
                <Badge variant={room.is_available ? 'vacant' : 'occupied'}>
                  {room.is_available ? 'Available' : 'Occupied'}
                </Badge>
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
      </div>
    </PageContainer>
  );
}
