import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';
import { Navigation, ShieldCheck, MapPin } from 'lucide-react';

export function PermissionPromptModal({ isOpen, onAllow, onDeny }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onDeny}
      hideCloseButton
      isDismissable={false}
      placement="center"
      classNames={{
        base: 'bg-white rounded-3xl p-2 max-w-sm mx-4 shadow-2xl border border-slate-100',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col items-center text-center pt-6 pb-2 gap-2">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-ateneo-blue flex items-center justify-center shadow-inner">
            <Navigation size={28} className="animate-pulse" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-2">Enable Live Walking Navigation</h2>
          <p className="text-xs text-slate-500 font-normal">
            Turn-by-turn guidance to your selected accommodation
          </p>
        </ModalHeader>

        <ModalBody className="py-2 px-4 text-xs text-slate-600 space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <MapPin size={18} className="text-ateneo-blue shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              DormSafe needs your location to display your live position and walking ETA in real time.
            </p>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-900">
            <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong>RA 10173 Privacy Compliance:</strong> Your coordinates are processed exclusively in your browser and are never stored on any database or server.
            </p>
          </div>
        </ModalBody>

        <ModalFooter className="flex flex-col gap-2 pt-3 pb-4">
          <Button
            color="primary"
            className="w-full bg-ateneo-blue text-white font-bold h-11 rounded-2xl shadow-md active:scale-95 transition"
            onPress={onAllow}
          >
            Allow Location Access
          </Button>
          <Button
            variant="light"
            className="w-full text-slate-500 font-medium text-xs h-9 rounded-xl hover:bg-slate-100"
            onPress={onDeny}
          >
            Choose Campus Gate Instead
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
