import React, { useState } from 'react';
import {
  ShieldCheck,
  Footprints,
  Phone,
  Navigation,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { formatDistance, formatDuration } from '../../services/map/GeoUtils.js';

export function TrackingBottomSheet({
  property,
  routeStats,
  isArrived,
  originName,
  onRecenter,
  onSelectManualOrigin,
  onStopTracking,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-auto transition-transform duration-300">
      <div className="mx-auto max-w-lg bg-white/95 backdrop-blur-xl border-t sm:border border-slate-200/90 sm:rounded-t-3xl shadow-2xl overflow-hidden pb-safe">
        {/* Drag handle / collapse toggle */}
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="w-full flex items-center justify-center pt-2.5 pb-1 focus:outline-hidden text-slate-400 hover:text-slate-600 transition"
        >
          <div className="w-10 h-1 rounded-full bg-slate-300/80 mb-1" />
        </button>

        <div className="px-5 pb-5 pt-1 space-y-4">
          {/* Arrival Celebration Banner */}
          {isArrived && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-500 text-white shadow-lg animate-bounce">
              <CheckCircle2 size={24} className="shrink-0" />
              <div>
                <h4 className="font-bold text-sm">You Have Arrived!</h4>
                <p className="text-xs text-emerald-100">Welcome to {property?.name}</p>
              </div>
            </div>
          )}

          {/* Core Route Metrics & Destination Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-ateneo-blue">
                  Walking Route
                </span>
                {property?.is_verified && (
                  <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <ShieldCheck size={12} />
                    Verified
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900 truncate mt-1">
                {property?.name || 'Selected Accommodation'}
              </h3>
              <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                <MapPin size={12} className="shrink-0 text-slate-400" />
                <span>{property?.address || 'Davao City, Philippines'}</span>
              </p>
            </div>

            {/* Live Distance & ETA Pills */}
            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-center gap-1 text-ateneo-blue font-extrabold text-xl leading-none">
                <Footprints size={18} />
                <span>{formatDuration(routeStats?.durationMinutes)}</span>
              </div>
              <span className="text-xs font-semibold text-slate-500 mt-1">
                {formatDistance(routeStats?.distanceMeters)} remaining
              </span>
            </div>
          </div>

          {/* Origin Indicator */}
          {originName && (
            <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <span className="truncate">From: <strong>{originName}</strong></span>
              <button
                onClick={onSelectManualOrigin}
                className="text-ateneo-blue font-bold hover:underline shrink-0 ml-2"
              >
                Change Origin
              </button>
            </div>
          )}

          {/* Expanded Drawer Details */}
          {isExpanded && (
            <div className="pt-2 border-t border-slate-100 space-y-3 text-xs text-slate-600 animate-fadeIn">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Property Type</span>
                  <p className="font-semibold capitalize text-slate-800">{property?.type || 'Dormitory'}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Starting Price</span>
                  <p className="font-semibold text-slate-800">
                    {property?.price ? `₱${property.price.toLocaleString()}/mo` : 'Inquire for Rates'}
                  </p>
                </div>
              </div>

              {property?.contact_phone && (
                <a
                  href={`tel:${property.contact_phone}`}
                  className="flex items-center justify-center gap-2 w-full p-2.5 rounded-xl bg-slate-100 text-slate-800 font-semibold hover:bg-slate-200 transition"
                >
                  <Phone size={14} className="text-ateneo-blue" />
                  <span>Call Landlord ({property.contact_phone})</span>
                </a>
              )}
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="flat"
              color="primary"
              className="flex-1 font-bold text-xs h-11 rounded-2xl bg-blue-50 text-ateneo-blue border border-blue-100 active:scale-95 transition"
              onPress={onRecenter}
              startContent={<Navigation size={14} />}
            >
              Recenter Map
            </Button>

            <Button
              color="danger"
              variant="light"
              className="font-bold text-xs h-11 rounded-2xl px-4 text-rose-600 hover:bg-rose-50 active:scale-95 transition"
              onPress={onStopTracking}
            >
              End Navigation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
