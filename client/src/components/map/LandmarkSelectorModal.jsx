import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';
import {
  MapPin,
  Navigation,
  Crosshair,
  Footprints,
  Car,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Sparkles,
} from 'lucide-react';
import {
  getAccuratePinpoint,
  getKnownWalkingMinutes,
  getKnownDrivingMinutes,
  calculateStraightLineDistance,
  getDynamicGoogleMapsTimes,
} from '../../utils/propertyCoordinates.js';

export const ADDU_LANDMARKS = [
  {
    id: 'roxas',
    name: 'Ateneo Roxas Gate',
    lat: 7.07180,
    lng: 125.61230,
    desc: 'Roxas Ave entrance — Martin Hall & Arrupe Hall side',
    isPrimaryGate: true,
  },
  {
    id: 'jacinto',
    name: 'Ateneo Jacinto Gate',
    lat: 7.07200,
    lng: 125.61410,
    desc: 'E. Jacinto St entrance — Finster & Bellarmine side',
    isPrimaryGate: true,
  },
  {
    id: 'claveria',
    name: 'Ateneo Claveria Gate',
    lat: 7.06940,
    lng: 125.61290,
    desc: 'C.M. Recto Ave / Claveria entrance — South gate',
    isPrimaryGate: true,
  },
  {
    id: 'martin_hall',
    name: 'Martin Hall Gate',
    lat: 7.07150,
    lng: 125.61350,
    desc: 'Pedestrian access to sports gym & cafeteria',
  },
  {
    id: 'finster_hall',
    name: 'Finster Gate (C.M. Recto Ave)',
    lat: 7.07270,
    lng: 125.61390,
    desc: 'North side pedestrian gate',
  },
  {
    id: 'community_center',
    name: 'Community Center (Bapa Benny)',
    lat: 7.07110,
    lng: 125.61220,
    desc: 'Jacinto Extension side',
  },
  {
    id: 'roxas_market',
    name: 'Roxas Night Market Entrance',
    lat: 7.07010,
    lng: 125.61510,
    desc: 'Near post office & food stalls',
  },
];

export function LandmarkSelectorModal({
  isOpen,
  onSelect,
  onClose,
  detectedGps = null,
  isDetectingGps = false,
  gpsError = null,
  onRetryGps,
  property = null,
  currentOriginName = '',
}) {
  const destPinpoint = getAccuratePinpoint(property);

  // Dynamic GPS metrics if user's GPS is detected
  let gpsDistance = null;
  let gpsWalkingMins = null;
  let gpsDrivingMins = null;

  if (detectedGps) {
    const straight = calculateStraightLineDistance(
      detectedGps.lat,
      detectedGps.lng,
      destPinpoint.lat,
      destPinpoint.lng
    );
    gpsDistance = straight.distanceMeters;
    const dynamicTimes = getDynamicGoogleMapsTimes(gpsDistance);
    gpsWalkingMins = dynamicTimes.walkingMinutes;
    gpsDrivingMins = dynamicTimes.drivingMinutes;
  }

  const isCurrentGpsSelected =
    currentOriginName.toLowerCase().includes('live location') ||
    currentOriginName.toLowerCase().includes('current') ||
    currentOriginName.toLowerCase().includes('device');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="bottom"
      size="lg"
      classNames={{
        base: 'bg-white rounded-t-3xl sm:rounded-3xl p-1 sm:p-2 max-w-lg mx-auto shadow-2xl border border-slate-100 max-h-[90vh] overflow-hidden flex flex-col',
      }}
    >
      <ModalContent className="flex flex-col h-full">
        <ModalHeader className="flex flex-col text-left px-5 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-ateneo-blue font-extrabold text-base">
              <Navigation size={18} className="text-ateneo-blue" />
              <span>Select Live GPS Starting Point</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-ateneo-blue">
              Google Maps Calibrated
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal mt-1 leading-relaxed">
            Choose whether to navigate from your device's <strong>Live GPS position</strong> or from an <strong>Ateneo Campus Gate</strong> to{' '}
            <strong className="text-slate-700">{property?.name || 'the accommodation'}</strong>.
          </p>
        </ModalHeader>

        <ModalBody className="overflow-y-auto px-4 py-3 space-y-4 flex-1">
          {/* ============================================================== */}
          {/* SECTION 1: STUDENT USER'S LIVE DEVICE GPS LOCATION */}
          {/* ============================================================== */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Crosshair size={13} className="text-blue-600" />
                <span>Student Device Location</span>
              </span>
              {detectedGps && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  <span>GPS Fix Ready</span>
                </span>
              )}
            </div>

            {/* GPS Card States */}
            {isDetectingGps ? (
              <div className="p-4 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/50 flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Loader2 size={20} className="text-ateneo-blue animate-spin" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900">Detecting your current GPS location...</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Requesting high-accuracy fix from your device</p>
                </div>
              </div>
            ) : detectedGps ? (
              <button
                type="button"
                onClick={() =>
                  onSelect({
                    type: 'gps',
                    name: 'My Live Location (GPS)',
                    lat: detectedGps.lat,
                    lng: detectedGps.lng,
                    accuracy: detectedGps.accuracy,
                    walkingMinutes: gpsWalkingMins,
                    drivingMinutes: gpsDrivingMins,
                    distanceMeters: gpsDistance,
                  })
                }
                className={`w-full text-left p-3.5 rounded-2xl border-2 transition flex items-center justify-between group active:scale-[0.99] ${
                  isCurrentGpsSelected
                    ? 'border-ateneo-blue bg-blue-50/70 shadow-sm ring-2 ring-ateneo-blue/20'
                    : 'border-blue-200/90 bg-blue-50/30 hover:border-ateneo-blue hover:bg-blue-50/60'
                }`}
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shrink-0 shadow-xs">
                      <Crosshair size={13} />
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-ateneo-blue">
                      My Current GPS Location
                    </h4>
                    {isCurrentGpsSelected && (
                      <span className="text-[10px] font-extrabold text-white bg-ateneo-blue px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 pl-8">
                    Lat {detectedGps.lat.toFixed(5)}, Lng {detectedGps.lng.toFixed(5)} (±{Math.round(detectedGps.accuracy || 10)}m accuracy)
                  </p>
                  <div className="flex items-center gap-2 mt-2 pl-8 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ateneo-blue bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs">
                      <Footprints size={12} />
                      <span>~{gpsWalkingMins} min walk</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-white px-2.5 py-1 rounded-lg border border-sky-200 shadow-2xs">
                      <Car size={12} />
                      <span>~{gpsDrivingMins} min car</span>
                    </span>
                    {gpsDistance && (
                      <span className="text-[10px] font-semibold text-slate-400">
                        ({gpsDistance >= 1000 ? `${(gpsDistance / 1000).toFixed(1)} km` : `${gpsDistance}m`} away)
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-ateneo-blue group-hover:translate-x-0.5 transition-transform">
                  <span>Start Live GPS →</span>
                </div>
              </button>
            ) : (
              <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <AlertCircle size={18} className="text-amber-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">Device GPS unavailable</p>
                    <p className="text-[11px] text-slate-500 truncate">{gpsError || 'Location permission was denied or timed out'}</p>
                  </div>
                </div>
                {onRetryGps && (
                  <Button
                    size="sm"
                    variant="flat"
                    color="warning"
                    onPress={onRetryGps}
                    startContent={<RotateCw size={12} />}
                    className="font-bold text-xs shrink-0 h-8"
                  >
                    Retry GPS
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* SECTION 2: ATENEO CAMPUS GATES (GOOGLE MAPS VERIFIED) */}
          {/* ============================================================== */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPin size={13} className="text-ateneo-blue" />
                <span>Ateneo Campus Starting Gates</span>
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Sparkles size={11} className="text-amber-500" />
                <span>Google Maps Accurate</span>
              </span>
            </div>

            <div className="space-y-2">
              {ADDU_LANDMARKS.map((landmark) => {
                const walkMins = getKnownWalkingMinutes(landmark.id, property) ?? 4;
                const driveMins = getKnownDrivingMinutes(landmark.id, property) ?? 2;
                const isSelected = currentOriginName.toLowerCase().includes(landmark.name.toLowerCase().replace('ateneo ', ''));

                return (
                  <button
                    key={landmark.id}
                    type="button"
                    onClick={() =>
                      onSelect({
                        type: 'gate',
                        name: landmark.name,
                        lat: landmark.lat,
                        lng: landmark.lng,
                        gateId: landmark.id,
                        walkingMinutes: walkMins,
                        drivingMinutes: driveMins,
                      })
                    }
                    className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center justify-between group active:scale-[0.99] ${
                      isSelected
                        ? 'border-ateneo-blue bg-blue-50/70 shadow-sm ring-1 ring-ateneo-blue/30'
                        : 'border-slate-200/90 bg-white hover:border-ateneo-blue hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <MapPin
                          size={14}
                          className={`${landmark.isPrimaryGate ? 'text-ateneo-blue' : 'text-slate-400'} shrink-0`}
                        />
                        <span className="font-bold text-xs text-slate-900 group-hover:text-ateneo-blue truncate">
                          {landmark.name}
                        </span>
                        {landmark.isPrimaryGate && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
                            Campus Gate
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[10px] font-extrabold text-white bg-ateneo-blue px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate pl-5">
                        {landmark.desc}
                      </p>
                      <div className="flex items-center gap-2 mt-2 pl-5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/70">
                          <Footprints size={12} className="text-ateneo-blue" />
                          <span>{walkMins} min walk</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/70">
                          <Car size={12} className="text-sky-600" />
                          <span>{driveMins} min car</span>
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-ateneo-blue shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition">
                      Select →
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="pt-2 pb-4 px-5 border-t border-slate-100">
          <Button
            variant="flat"
            className="w-full text-slate-600 font-semibold text-xs h-10 rounded-xl bg-slate-100 hover:bg-slate-200"
            onPress={onClose}
          >
            Close / Keep Current Route
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
