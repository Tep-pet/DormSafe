import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';
import { MapPin, Navigation, Crosshair, Building2, Check, Loader2 } from 'lucide-react';
import { ADDU_GATES } from '../../constants/campusGates.js';

export const ADDU_LANDMARKS = ADDU_GATES;

export function LandmarkSelectorModal({
  isOpen,
  currentOriginName,
  property,
  gpsStatus = 'detected', // 'detecting' | 'detected' | 'unavailable'
  gpsErrorMessage = null,
  onSelect,
  onSelectCurrentLocation,
  onRetryGps,
  onClose,
}) {
  const isGpsSelected = currentOriginName && currentOriginName.toLowerCase().includes('gps');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
      classNames={{
        base: 'bg-white rounded-3xl p-2 max-w-md mx-auto shadow-2xl border border-slate-100 max-h-[90vh] overflow-hidden flex flex-col',
      }}
    >
      <ModalContent className="flex flex-col">
        <ModalHeader className="flex flex-col text-left px-5 pt-4 pb-2">
          <div className="flex items-center gap-2 text-ateneo-blue font-bold text-base">
            <Navigation size={18} />
            <span>Choose Starting Location</span>
          </div>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Select your starting point for road navigation to <span className="font-semibold text-slate-800">{property?.name || 'the accommodation'}</span>:
          </p>
        </ModalHeader>

        <ModalBody className="overflow-y-auto px-4 py-2 space-y-3">
          {/* Permission Denied or GPS Error Banner */}
          {gpsErrorMessage && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <Navigation size={14} className="text-amber-600 shrink-0" />
                <span>GPS Location Unavailable</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                {gpsErrorMessage}
              </p>
              {onRetryGps && (
                <button
                  onClick={onRetryGps}
                  className="self-start mt-0.5 px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[10px] hover:bg-amber-700 transition"
                >
                  Retry GPS Permission
                </button>
              )}
            </div>
          )}

          {/* Option 1: Live Current Location (GPS) with live detection status */}
          {onSelectCurrentLocation && (
            <button
              onClick={() => {
                onSelectCurrentLocation();
                onClose();
              }}
              disabled={gpsStatus === 'unavailable'}
              className={`w-full text-left p-3.5 rounded-2xl border-2 transition flex items-center justify-between group active:scale-[0.99] shadow-xs ${
                gpsStatus === 'unavailable'
                  ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                  : isGpsSelected
                    ? 'border-emerald-500 bg-emerald-50/70'
                    : 'border-ateneo-blue/40 bg-blue-50/60 hover:bg-blue-100/60 hover:border-ateneo-blue'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                    gpsStatus === 'unavailable'
                      ? 'bg-slate-300 text-slate-600'
                      : isGpsSelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-ateneo-blue text-white'
                  }`}
                >
                  {gpsStatus === 'detecting' ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Crosshair size={18} className={gpsStatus === 'unavailable' ? '' : 'animate-pulse'} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 group-hover:text-ateneo-blue">
                      My Current Location (Live GPS)
                    </span>
                    {gpsStatus === 'detecting' ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                        Detecting...
                      </span>
                    ) : gpsStatus === 'detected' ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Ready
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-600">
                        Unavailable
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {gpsStatus === 'unavailable'
                      ? 'Permission denied or timed out — choose a gate below'
                      : 'Live turn-by-turn road tracking from where you are'}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                {isGpsSelected ? (
                  <span className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check size={14} strokeWidth={3} />
                  </span>
                ) : (
                  <span className="text-xs font-bold text-ateneo-blue group-hover:translate-x-0.5 transition-transform">
                    {gpsStatus === 'unavailable' ? '—' : 'Start →'}
                  </span>
                )}
              </div>
            </button>
          )}

          {/* Section Divider: Ateneo Campus Gates */}
          <div className="pt-1">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2 px-1">
              <Building2 size={13} />
              <span>Ateneo de Davao Campus Gates</span>
            </div>

            <div className="space-y-1.5">
              {ADDU_GATES.map((gate) => {
                const isSelected =
                  !isGpsSelected &&
                  currentOriginName &&
                  (currentOriginName.toLowerCase().includes(gate.id) ||
                    (gate.id === 'claveria' && (currentOriginName.toLowerCase().includes('claveria') || currentOriginName.toLowerCase().includes('finster'))) ||
                    (gate.id === 'ccfc' && (currentOriginName.toLowerCase().includes('ccfc') || currentOriginName.toLowerCase().includes('community'))));

                return (
                  <button
                    key={gate.id}
                    onClick={() => {
                      onSelect({
                        lat: gate.lat,
                        lng: gate.lng,
                        name: gate.name,
                        id: gate.id,
                      });
                      onClose();
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between group active:scale-[0.99] ${
                      isSelected
                        ? 'border-ateneo-blue bg-blue-50/80 shadow-xs'
                        : 'border-slate-200/80 hover:border-ateneo-blue hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 pr-3 flex-1">
                      <div className="flex items-center gap-2 font-semibold text-xs text-slate-900 group-hover:text-ateneo-blue">
                        <MapPin
                          size={14}
                          className={isSelected ? 'text-ateneo-blue' : 'text-slate-400 group-hover:text-ateneo-blue'}
                        />
                        <span className="truncate">{gate.name}</span>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-1 truncate pl-5">
                        {gate.desc}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <span className="h-6 w-6 rounded-full bg-ateneo-blue text-white flex items-center justify-center">
                          <Check size={14} strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-ateneo-blue opacity-0 group-hover:opacity-100 transition">
                          Start →
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="pt-1 pb-3 px-4">
          <Button
            variant="flat"
            className="w-full text-slate-600 font-semibold text-xs h-10 rounded-xl bg-slate-100 hover:bg-slate-200"
            onPress={onClose}
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
