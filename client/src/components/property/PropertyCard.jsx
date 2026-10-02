import { Link } from 'react-router-dom';
import { Card, CardBody, CardFooter } from '@heroui/react';
import { MapPin, ImageOff } from 'lucide-react';
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
    <Link to={detailPath} className="block group">
      <Card
        isPressable
        shadow="sm"
        className="w-full rounded-2xl border border-gray-200 bg-white overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-gray-300"
      >
        <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={property.name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col h-full w-full items-center justify-center gap-1 bg-gray-100 text-xs font-semibold text-gray-400">
              <ImageOff size={22} strokeWidth={1.5} />
              <span>No photo</span>
            </div>
          )}

          {property.is_verified && (
            <div className="absolute left-3 top-3 z-10">
              <Badge variant="verified" size="sm" className="shadow-xs backdrop-blur-xs">
                Verified
              </Badge>
            </div>
          )}

          <div className="absolute right-3 top-3 z-10">
            <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-xs">
              {PROPERTY_TYPE_LABELS[property.type] || property.type}
            </span>
          </div>
        </div>

        <CardBody className="p-4 pb-2 text-left">
          <h3 className="font-bold text-base text-gray-900 group-hover:text-ateneo-blue transition line-clamp-1">
            {property.name}
          </h3>
          <p className="mt-1 text-xs text-gray-500 line-clamp-1 flex items-center gap-1.5">
            <MapPin size={13} className="text-gray-400 shrink-0" />
            <span>{property.address}</span>
          </p>
        </CardBody>

        <CardFooter className="flex items-center justify-between p-4 pt-2 border-t border-gray-100">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">Monthly Rent</p>
            <span className="text-sm font-extrabold text-ateneo-blue">
              {minPrice != null ? `${formatPrice(minPrice)}/mo` : 'Price on request'}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <WalkingTimeBadge minutes={property.walking_minutes} />
            {property.available_rooms != null && (
              <span className="text-[11px] font-medium text-gray-500">
                {property.available_rooms} {property.available_rooms === 1 ? 'room' : 'rooms'} left
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
