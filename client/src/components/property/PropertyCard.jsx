import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardFooter } from '@heroui/react';
import { MapPin, ImageOff, ShieldCheck, BedDouble } from 'lucide-react';
import { Badge } from '../common/Badge';
import { WalkingTimeBadge } from '../map/WalkingTimeBadge';
import { formatPrice } from '../../utils/formatPrice';
import { PROPERTY_TYPE_LABELS } from '../../constants/propertyTypes';

export function PropertyCard({ property, gate, isSelected = false }) {
  const minPrice = property.min_price;
  const imageUrl = property.primary_image || null;
  const detailPath = gate
    ? `/student/property/${property.id}?gate=${encodeURIComponent(gate)}`
    : `/student/property/${property.id}`;

  return (
    <Link to={detailPath} className="block group cursor-pointer">
      <Card
        shadow="none"
        className={`w-full rounded-2xl border bg-white/95 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
          isSelected
            ? 'border-ateneo-blue ring-2 ring-ateneo-blue/30 shadow-md'
            : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
        }`}
      >
        {/* Image Container with Fallback & Overlays */}
        <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={property.name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col h-full w-full items-center justify-center gap-1.5 bg-slate-100 text-xs font-medium text-slate-400">
              <ImageOff size={22} strokeWidth={1.5} className="text-slate-300" />
              <span>No photo available</span>
            </div>
          )}

          {/* Top Left: Verified Badge */}
          {property.is_verified && (
            <div className="absolute left-3 top-3 z-10">
              <Badge variant="verified" size="sm" className="shadow-xs backdrop-blur-xs font-semibold">
                <ShieldCheck size={12} className="mr-1 inline-block shrink-0" />
                Verified
              </Badge>
            </div>
          )}

          {/* Top Right: Property Type Chip */}
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
            <span className="rounded-full bg-slate-900/75 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-xs shadow-2xs">
              {PROPERTY_TYPE_LABELS[property.type] || property.type}
            </span>
          </div>
        </div>

        {/* Card Body: Name & Address */}
        <CardBody className="p-4 pb-2 text-left">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-ateneo-blue transition line-clamp-1">
            {property.name}
          </h3>
          <p className="mt-1 text-xs text-slate-500 line-clamp-1 flex items-center gap-1.5">
            <MapPin size={13} className="text-slate-400 shrink-0" />
            <span>{property.address}</span>
          </p>
        </CardBody>

        {/* Card Footer: Price & Proximity */}
        <CardFooter className="flex items-center justify-between p-4 pt-2 border-t border-slate-100 bg-slate-50/40">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Monthly Rent</p>
            <span className="text-sm font-extrabold text-ateneo-blue">
              {minPrice != null ? `${formatPrice(minPrice)}/mo` : 'Price on request'}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <WalkingTimeBadge minutes={property.walking_minutes} />
            {property.available_rooms != null && (
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <BedDouble size={12} className="text-slate-400" />
                {property.available_rooms} {property.available_rooms === 1 ? 'room' : 'rooms'} left
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

