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
  Compass,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { formatDistance, formatDuration } from '../../services/map/GeoUtils.js';

export function TrackingBottomSheet({
  property,
  routeStats,
  travelMode = 'walk',
  onToggleMode,
  isArrived,
  originName,
  onRecenter,
  onSelectManualOrigin,
  onStopTracking,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isWalk = travelMode === 'walk';

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

          {/* Primary Result Card Headline: e.g. "Walking from Roxas Gate: 6 min (450 m)" */}
          <div className="bg-slate-50/90 rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span
                className={`text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full ${
                  isWalk ? 'bg-blue-100 text-ateneo-blue' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isWalk ? 'Pedestrian Walking Route' : 'Vehicular Driving Route'}
              </span>
              <button
                onClick={onSelectManualOrigin}
                className="text-ateneo-blue font-bold hover:underline shrink-0 text-xs"
              >
                Change Start Point
              </button>
            </div>

            <div className="text-base sm:text-lg font-black text-slate-900 leading-snug">
              {isWalk ? 'Walking' : 'Driving'} from{' '}
              <span className="text-slate-800 underline decoration-blue-300 decoration-2 underline-offset-2">
                {originName ? originName.replace('Ateneo ', '').replace(' (Live GPS)', '') : 'Start Point'}
              </span>
              :{' '}
              <span className="text-ateneo-blue">
                {routeStats?.durationText || routeStats?.formattedDuration || `${routeStats?.durationMinutes || 0} min`}
              </span>
              {(routeStats?.distanceText || routeStats?.formattedDistance) && (
                <span className="text-slate-600 font-bold text-sm ml-1.5">
                  ({routeStats?.distanceText || routeStats?.formattedDistance})
                </span>
              )}
            </div>

            {routeStats?.summary && (
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                {routeStats.summary}
              </p>
            )}
          </div>

          {/* Travel Mode Toggle: Walk (Default) vs Drive (Optional Toggle) */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80">
            <button
              type="button"
              onClick={() => onToggleMode && onToggleMode('walk')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                isWalk
                  ? 'bg-white text-ateneo-blue shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Footprints size={15} />
              <span>Walk (Default)</span>
              {isWalk && routeStats?.durationMinutes != null && (
                <span className="text-[11px] font-extrabold text-ateneo-blue bg-blue-50 px-1.5 py-0.2 rounded-md">
                  {routeStats.durationMinutes} min
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onToggleMode && onToggleMode('drive')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                !isWalk
                  ? 'bg-white text-ateneo-blue shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Car size={15} />
              <span>Drive</span>
              {!isWalk && routeStats?.durationMinutes != null && (
                <span className="text-[11px] font-extrabold text-ateneo-blue bg-blue-50 px-1.5 py-0.2 rounded-md">
                  {routeStats.durationMinutes} min
                </span>
              )}
            </button>
          </div>

          {/* Accommodation Destination Name */}
          <div className="flex items-center justify-between gap-3 pt-0.5">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {property?.name || 'Selected Accommodation'}
              </h3>
              <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                <MapPin size={12} className="shrink-0 text-slate-400" />
                <span>{property?.address || 'Davao City, Philippines'}</span>
              </p>
            </div>
            <Button
              size="sm"
              variant="flat"
              onPress={onRecenter}
              startContent={<Compass size={13} className="text-ateneo-blue" />}
              className="text-xs font-bold text-ateneo-blue bg-blue-50 border border-blue-200/80 rounded-xl shrink-0"
            >
              Recenter
            </Button>
          </div>

          {/* Origin Indicator */}
          {originName && (
            <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
              <div className="min-w-0 pr-2 flex items-center gap-1.5">
                {originName.toLowerCase().includes('gps') ? (
                  <>
                    <span className="flex h-2 w-2 relative shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="truncate">
                      From: <strong className="text-slate-900">My Location (Live GPS)</strong>
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded shrink-0">
                      Live
                    </span>
                  </>
                ) : (
                  <span className="truncate">
                    From: <strong className="text-slate-900">{originName}</strong>
                  </span>
                )}
              </div>
              <button
                onClick={onSelectManualOrigin}
                className="text-ateneo-blue font-bold hover:underline shrink-0 text-xs"
              >
                Change Origin
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              variant="flat"
              onPress={onRecenter}
              className="h-11 rounded-xl font-bold text-xs bg-slate-100 text-slate-800 hover:bg-slate-200"
              startContent={<Navigation size={14} className="text-ateneo-blue" />}
            >
              Recenter Map
            </Button>
            <Button
              variant="flat"
              color="danger"
              onPress={onStopTracking}
              className="h-11 rounded-xl font-bold text-xs bg-rose-50 text-rose-600 hover:bg-rose-100"
            >
              End Navigation
            </Button>
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
                  <Phone size={14} />
                  <span>Call Landlord ({property.contact_phone})</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
