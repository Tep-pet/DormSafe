import React, { useState } from 'react';
import {
  Footprints,
  Car,
  Phone,
  Navigation,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  MapPin,
  Crosshair,
  Sparkles,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { formatDistance, formatDuration } from '../../services/map/GeoUtils.js';

export function TrackingBottomSheet({
  property,
  routeStats,
  isArrived,
  originName,
  originType = 'gps',
  travelMode = 'walking',
  onTravelModeChange,
  onRecenter,
  onSelectManualOrigin,
  onStopTracking,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isGpsOrigin =
    originType === 'gps' ||
    originName?.toLowerCase().includes('live location') ||
    originName?.toLowerCase().includes('current') ||
    originName?.toLowerCase().includes('gps');

  const walkingMinutes = routeStats?.walkingMinutes ?? (travelMode === 'walking' ? routeStats?.durationMinutes : Math.max(1, Math.round((routeStats?.distanceMeters || 400) / 82)));
  const drivingMinutes = routeStats?.drivingMinutes ?? (travelMode === 'driving' ? routeStats?.durationMinutes : Math.max(1, Math.round((routeStats?.distanceMeters || 400) / 220)));

  const activeDuration = travelMode === 'driving' ? drivingMinutes : walkingMinutes;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-auto transition-transform duration-300">
      <div className="mx-auto max-w-lg bg-white/98 backdrop-blur-xl border-t sm:border border-slate-200/90 sm:rounded-t-3xl shadow-2xl overflow-hidden pb-safe">
        {/* Drag handle / collapse toggle */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="w-full flex items-center justify-center pt-2.5 pb-1 focus:outline-hidden text-slate-400 hover:text-slate-600 transition"
          aria-label="Expand route details"
        >
          <div className="w-10 h-1 rounded-full bg-slate-300/80 mb-1" />
        </button>

        <div className="px-5 pb-5 pt-1 space-y-3.5">
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

          {/* Travel Mode Toggle: Walking vs Driving */}
          <div className="flex items-center justify-between gap-2 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => onTravelModeChange && onTravelModeChange('walking')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                travelMode === 'walking'
                  ? 'bg-white text-ateneo-blue shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Footprints size={15} />
              <span>Walking</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-md ${travelMode === 'walking' ? 'bg-blue-100 text-ateneo-blue font-extrabold' : 'text-slate-400'}`}>
                {walkingMinutes} min
              </span>
            </button>

            <button
              type="button"
              onClick={() => onTravelModeChange && onTravelModeChange('driving')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                travelMode === 'driving'
                  ? 'bg-white text-sky-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Car size={15} />
              <span>Car / Drive</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-md ${travelMode === 'driving' ? 'bg-sky-100 text-sky-800 font-extrabold' : 'text-slate-400'}`}>
                {drivingMinutes} min
              </span>
            </button>
          </div>

          {/* Core Route Metrics & Destination Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  travelMode === 'driving' ? 'bg-sky-100 text-sky-800' : 'bg-blue-100 text-ateneo-blue'
                }`}>
                  {travelMode === 'driving' ? 'Driving Route' : 'Walking Route'}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                  <Sparkles size={11} className="text-amber-500" />
                  <span>Google Maps Speed</span>
                </span>
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
              <div className="flex items-center gap-1.5 text-ateneo-blue font-black text-2xl leading-none">
                {travelMode === 'driving' ? <Car size={22} className="text-sky-700" /> : <Footprints size={22} className="text-ateneo-blue" />}
                <span>{formatDuration(activeDuration)}</span>
              </div>
              <span className="text-xs font-semibold text-slate-500 mt-1">
                {formatDistance(routeStats?.distanceMeters)} remaining
              </span>
            </div>
          </div>

          {/* Dynamic Origin Indicator with Starting Point Switcher */}
          <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <div className="min-w-0 flex items-center gap-2">
              {isGpsOrigin ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shrink-0 animate-pulse">
                  <Crosshair size={11} />
                </span>
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ateneo-blue text-white text-[9px] font-bold shrink-0">
                  AdDU
                </span>
              )}
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-slate-400 leading-tight">Starting Point</p>
                <p className="font-bold text-slate-800 truncate">
                  {isGpsOrigin ? 'Live GPS: From Your Current Location' : `From ${originName}`}
                </p>
                {isGpsOrigin && (
                  <p className="text-[10px] text-blue-600 font-semibold mt-0.5">
                    ● Real-time dynamic GPS adjustment
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onSelectManualOrigin}
              className="text-xs font-bold text-ateneo-blue hover:text-blue-800 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs shrink-0 ml-2 active:scale-95 transition"
            >
              Change Starting Point
            </button>
          </div>

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
              className="flex-1 font-bold text-xs h-11 rounded-2xl bg-blue-50 text-ateneo-blue border border-blue-200/80 active:scale-95 transition"
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
