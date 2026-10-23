import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';
import { MapPin, Navigation } from 'lucide-react';

export const ADDU_LANDMARKS = [
  { id: 'jacinto_gate', name: 'Ateneo Main Gate (E. Jacinto St.)', lat: 7.07223, lng: 125.61282, desc: 'Finster & Bellarmine entrance' },
  { id: 'roxas_gate', name: 'Ateneo Roxas Gate', lat: 7.07065, lng: 125.61435, desc: 'Martin Hall & Arrupe entrance' },
  { id: 'martin_hall', name: 'Martin Hall Gate', lat: 7.07150, lng: 125.61350, desc: 'Pedestrian access to sports gym' },
  { id: 'finster_hall', name: 'Finster Gate (C.M. Recto Ave)', lat: 7.07270, lng: 125.61390, desc: 'North side pedestrian gate' },
  { id: 'community_center', name: 'Community Center (Bapa Benny)', lat: 7.07110, lng: 125.61220, desc: 'Jacinto Extension side' },
  { id: 'roxas_market', name: 'Roxas Night Market Entrance', lat: 7.07010, lng: 125.61510, desc: 'Near post office & food stalls' },
  { id: 'claveria_recto', name: 'Claveria / C.M. Recto Junction', lat: 7.06940, lng: 125.61290, desc: 'Aldevinco shopping area' },
];

export function LandmarkSelectorModal({ isOpen, onSelect, onClose }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="bottom"
      classNames={{
        base: 'bg-white rounded-t-3xl sm:rounded-3xl p-2 max-w-md mx-auto shadow-2xl border border-slate-100 max-h-[85vh] overflow-hidden flex flex-col',
      }}
    >
      <ModalContent className="flex flex-col h-full">
        <ModalHeader className="flex flex-col text-left px-5 pt-5 pb-2">
          <div className="flex items-center gap-2 text-ateneo-blue font-bold text-sm">
            <Navigation size={16} />
            <span>Select Campus Starting Point</span>
          </div>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Since GPS is inactive, choose a nearby campus landmark to calculate your walking route:
          </p>
        </ModalHeader>

        <ModalBody className="overflow-y-auto px-4 py-2 space-y-2 flex-1">
          {ADDU_LANDMARKS.map((landmark) => (
            <button
              key={landmark.id}
              onClick={() => onSelect({ lat: landmark.lat, lng: landmark.lng, name: landmark.name })}
              className="w-full text-left p-3.5 rounded-2xl border border-slate-200/80 hover:border-ateneo-blue hover:bg-blue-50/50 transition flex items-center justify-between group active:scale-[0.99]"
            >
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2 font-semibold text-xs text-slate-900 group-hover:text-ateneo-blue">
                  <MapPin size={14} className="text-ateneo-blue shrink-0" />
                  <span className="truncate">{landmark.name}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate pl-5">
                  {landmark.desc}
                </p>
              </div>
              <span className="text-xs font-bold text-ateneo-blue shrink-0 opacity-0 group-hover:opacity-100 transition">
                Start Route →
              </span>
            </button>
          ))}
        </ModalBody>

        <ModalFooter className="pt-2 pb-4 px-5">
          <Button
            variant="flat"
            className="w-full text-slate-600 font-semibold text-xs h-10 rounded-xl bg-slate-100 hover:bg-slate-200"
            onPress={onClose}
          >
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
