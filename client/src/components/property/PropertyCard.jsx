import { Link } from 'react-router-dom';
import { Badge } from '../common/Badge';
import { WalkingTimeBadge } from '../map/WalkingTimeBadge';
import { formatPrice } from '../../utils/formatPrice';
import { PROPERTY_TYPE_LABELS } from '../../constants/propertyTypes';

export function PropertyCard({ property, gate }) {
  const minPrice = property.min_price;
  const imageUrl = property.primary_image || null;
  const detailPath = gate
    ? `/student/property/${property.id}?gate=${encodeURIComponent(gate)}`
    : `/student/property/${property.id}`;

  return (
    <Link
      to={detailPath}
      className="block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative h-40 bg-gray-200">
        {imageUrl ? (
          <img src={imageUrl} alt={property.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            No image
          </div>
        )}
        {property.is_verified && (
          <div className="absolute left-2 top-2">
            <Badge variant="verified">Verified</Badge>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900">{property.name}</h3>
        <p className="text-xs text-gray-500">{PROPERTY_TYPE_LABELS[property.type] || property.type}</p>
        <p className="mt-1 text-sm text-gray-600 line-clamp-1">{property.address}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-ateneo-blue">
            {minPrice != null ? `${formatPrice(minPrice)}/mo` : 'Price on request'}
          </span>
          <WalkingTimeBadge minutes={property.walking_minutes} />
        </div>
        {property.available_rooms != null && (
          <p className="mt-2 text-xs text-gray-500">
            {property.available_rooms} room{property.available_rooms !== 1 ? 's' : ''} available
          </p>
        )}
      </div>
    </Link>
  );
}
