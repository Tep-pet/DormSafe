import React, { useState } from 'react';
import {
  Footprints,
  Car,
  Navigation,
  CheckCircle2,
  MapPin,
  Compass,
  AlertCircle,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { formatDistance } from '../../services/map/GeoUtils.js';

export function TrackingBottomSheet({
  property,
  originMode = 'gate', // 'gps' | 'gate'
  onChangeOriginMode,
  gateName = 'Ateneo Gate',
  onPickGate,
  travelMode = 'walk', // 'walk' | 'drive'
  onToggleMode,
  gpsStatus = 'locating', // 'locating' | 'ok' | 'weak' | 'denied' | 'unavailable'
  gpsAccuracy = null,
  recalibrating = false,
  onRecalibrateGps,
  route = { status: 'idle', data: null, error: null },
  progress = null, // { remainingMeters, minutes }
  arrived = false,
  farKm = null,
  onSwitchToGate,
  onRetryRoute,
  onRecenter,
  onStopTracking,
  follow = true,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isWalk = travelMode === 'walk';
  const isGpsMode = originMode === 'gps';
  const isGpsReady = gpsStatus === 'ok';

  // Compute displayed duration and distance
  let displayMinutes = null;
  let displayDistance = null;

  if (route.status === 'ok' && route.data) {
    if (isGpsMode && progress) {
      displayMinutes = progress.minutes;
      displayDistance = formatDistance(progress.remainingMeters);
    } else {
      displayMinutes = route.data.durationMinutes;
      displayDistance = route.data.formattedDistance;
    }
  }

  const originLabel = isGpsMode ? 'My location' : gateName.replace('Ateneo ', '');

  // GPS status notice
  let gpsNotice = null;
  if (!isGpsReady) {
    if (gpsStatus === 'locating') {
      gpsNotice = 'Finding your location…';
    } else if (gpsStatus === 'denied') {
      gpsNotice = 'Location permission is off. Enable it in your browser settings.';
    } else if (gpsStatus === 'unavailable') {
      gpsNotice = "Your device couldn't determine a location.";
    } else if (gpsStatus === 'weak') {
      gpsNotice = `Location imprecise (${gpsAccuracy ? `±${gpsAccuracy} m` : 'weak signal'}). Drag blue dot to adjust.`;
    }
  }

  return (
    <>
      {/* ==================================================================== */}
      {/* 1. UNHIDE / EXPAND ARROW TAB (Vertically Centered on Left Screen Edge) */}
      {/* ==================================================================== */}
      {isCollapsed && (
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-40 w-9 h-16 bg-white/95 backdrop-blur-xl rounded-r-2xl border-y border-r border-slate-200/90 shadow-2xl flex items-center justify-center text-slate-600 hover:text-ateneo-blue active:scale-95 transition-all group pointer-events-auto animate-in fade-in slide-in-from-left duration-200"
          title="Show Route"
          aria-label="Show navigation panel"
        >
          <ChevronRight size={20} strokeWidth={2.5} className="text-ateneo-blue group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* ==================================================================== */}
      {/* 2. MAIN NAVIGATION PANEL (Floating on the Left Side)                 */}
      {/* ==================================================================== */}
      <div
        className={`fixed top-16 left-3 sm:left-4 z-30 w-[calc(100vw-1.5rem)] sm:w-[380px] max-w-[400px] pointer-events-auto transition-all duration-300 ease-in-out ${
          isCollapsed
            ? '-translate-x-[calc(100%+2rem)] opacity-0 pointer-events-none'
            : 'translate-x-0 opacity-100'
        }`}
      >
        <div className="relative bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden max-h-[calc(100vh-5rem)] flex flex-col">
          {/* Header Bar with Live Indicator */}
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-slate-100/90 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 truncate">
                Live Navigation
              </span>
            </div>
          </div>

          {/* Scrollable Navigation Body */}
          <div className="p-4 overflow-y-auto no-scrollbar space-y-3 flex-1">
            {/* Arrival Celebration Banner */}
            {arrived && (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-500 text-white shadow-lg animate-bounce">
                <CheckCircle2 size={24} className="shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">You Have Arrived!</h4>
                  <p className="text-xs text-emerald-100">Welcome to {property?.name}</p>
                </div>
              </div>
            )}

            {/* Far Away Banner */}
            {farKm && isGpsMode && (
              <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle size={16} className="text-amber-600 shrink-0" />
                  <span className="truncate">You're ~{farKm} km away. Switch to an ADDU gate?</span>
                </div>
                <button
                  type="button"
                  onClick={onSwitchToGate}
                  className="px-2.5 py-1 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition shrink-0"
                >
                  Use Gate
                </button>
              </div>
            )}

            {/* 1. Origin Toggle: My location vs ADDU gate */}
            <div className="space-y-1.5">
              <div className="flex items-center p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    if (onChangeOriginMode) onChangeOriginMode('gps');
                    if (!isGpsReady && onRecalibrateGps) {
                      onRecalibrateGps();
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition ${
                    isGpsMode
                      ? 'bg-white text-ateneo-blue shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Navigation size={13} className={isGpsMode ? 'text-ateneo-blue' : ''} />
                  <span>My location</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeOriginMode && onChangeOriginMode('gate')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition ${
                    !isGpsMode
                      ? 'bg-white text-ateneo-blue shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MapPin size={13} className={!isGpsMode ? 'text-ateneo-blue' : ''} />
                  <span>From ADDU gate</span>
                </button>
              </div>

              {/* Sub-label for Origin */}
              <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
                {!isGpsMode ? (
                  <>
                    <span>
                      Selected Gate: <strong className="text-slate-800">{gateName}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={onPickGate}
                      className="text-ateneo-blue font-bold hover:underline"
                    >
                      Change gate
                    </button>
                  </>
                ) : (
                  <>
                    <span className="truncate mr-2">
                      {gpsNotice ? (
                        <span className="text-amber-700">{gpsNotice}</span>
                      ) : (
                        <span className="text-emerald-700">Real-time GPS active</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={onRecalibrateGps}
                      disabled={recalibrating}
                      className="text-ateneo-blue font-bold hover:underline flex items-center gap-1 shrink-0 disabled:opacity-60"
                    >
                      {recalibrating && <Loader2 size={11} className="animate-spin" />}
                      <span>Recalibrate GPS</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 2. Travel Mode Toggle: Walk (Default) vs Drive */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 text-xs font-bold">
              <button
                type="button"
                onClick={() => onToggleMode && onToggleMode('walk')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition ${
                  isWalk ? 'bg-white text-ateneo-blue shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Footprints size={14} />
                <span>Walk</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleMode && onToggleMode('drive')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition ${
                  !isWalk ? 'bg-white text-ateneo-blue shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Car size={14} />
                <span>Drive</span>
              </button>
            </div>

            {/* 3. Primary Headline Card */}
            <div className="bg-slate-50/90 rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-1">
              <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">
                {isWalk ? 'Pedestrian Walking Route' : 'Vehicular Driving Route'}
              </div>

              {route.status === 'loading' ? (
                <div className="text-base font-bold text-slate-700 py-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  <span>Calculating road route…</span>
                </div>
              ) : route.status === 'error' ? (
                <div className="py-1 flex items-center justify-between gap-2 text-rose-600 text-xs font-semibold">
                  <span className="truncate">{route.error || 'Could not calculate route'}</span>
                  <button
                    type="button"
                    onClick={onRetryRoute}
                    className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-md text-[11px] font-bold flex items-center gap-1 shrink-0"
                  >
                    <RotateCcw size={12} />
                    <span>Retry</span>
                  </button>
                </div>
              ) : (
                <div className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  {isWalk ? 'Walking' : 'Driving'} from{' '}
                  <span className="text-slate-800">
                    {originLabel}
                  </span>
                  :{' '}
                  <span className="text-ateneo-blue">
                    {displayMinutes != null ? `${displayMinutes} min` : '--'}
                  </span>
                  {displayDistance && (
                    <span className="text-slate-600 font-bold text-sm ml-1.5">
                      ({displayDistance})
                    </span>
                  )}
                </div>
              )}

              {route.data?.summary && route.status === 'ok' && (
                <p className="text-[11px] text-slate-500 truncate">{route.data.summary}</p>
              )}

              {/* Provider / Traffic / Accuracy Notes */}
              {route.status === 'ok' && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] text-slate-500">
                  <span>{route.data?.provider ? `Via ${route.data.provider}` : 'Street Network'}</span>
                  {!isWalk && (
                    <span>
                      {route.data?.trafficAware ? '• Live traffic' : '• Standard road speed'}
                    </span>
                  )}
                  {isGpsMode && gpsAccuracy != null && gpsAccuracy > 100 && (
                    <span className="text-amber-700">• Approx. location (±{gpsAccuracy} m)</span>
                  )}
                </div>
              )}
            </div>

            {/* 4. Accommodation Destination Details */}
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
                variant={follow ? 'flat' : 'solid'}
                color={follow ? 'default' : 'primary'}
                onPress={onRecenter}
                startContent={<Compass size={13} className={follow ? 'text-ateneo-blue' : 'text-white'} />}
                className={`text-xs font-bold rounded-xl shrink-0 ${
                  follow
                    ? 'text-ateneo-blue bg-blue-50 border border-blue-200/80'
                    : 'bg-ateneo-blue text-white shadow-sm'
                }`}
              >
                Recenter
              </Button>
            </div>

            {/* 5. End Navigation Action Button */}
            <div className="pt-1">
              <Button
                variant="flat"
                color="danger"
                onPress={onStopTracking}
                className="w-full h-11 rounded-xl font-bold text-xs bg-rose-50 text-rose-600 hover:bg-rose-100"
              >
                End Navigation
              </Button>
            </div>
          </div>
        </div>

        {/* Centered Collapse Arrow Tab (attached to right edge of card) */}
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-16 bg-white/95 backdrop-blur-md rounded-r-2xl border-y border-r border-slate-200/90 shadow-xl flex items-center justify-center text-slate-500 hover:text-ateneo-blue active:scale-95 transition-all group z-40"
          title="Hide panel"
          aria-label="Hide navigation panel"
        >
          <ChevronLeft size={18} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </div>
    </>
  );
}
