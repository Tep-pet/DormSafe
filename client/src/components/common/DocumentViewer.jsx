import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Image,
} from '@heroui/react';
import { Button } from './Button';

/**
 * Verification Document Viewer built with HeroUI Modal and Image components.
 */
export function DocumentViewer({ title, idUrl, licenseUrl, onClose }) {
  const isOpen = Boolean(idUrl || licenseUrl);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      backdrop="blur"
      scrollBehavior="inside"
      classNames={{
        base: 'rounded-2xl border border-slate-200/90 shadow-2xl bg-white',
        header: 'border-b border-slate-100 py-4 px-6',
        body: 'py-6 px-6',
        footer: 'border-t border-slate-100 py-3 px-6',
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-lg font-bold text-slate-900">
                {title || 'Verification Documents'}
              </h3>
              <p className="text-xs font-normal text-slate-500">
                Click any image to view in full resolution
              </p>
            </ModalHeader>

            <ModalBody>
              <div className="grid gap-6 sm:grid-cols-2">
                {idUrl && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Valid Government ID
                    </span>
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 transition hover:border-ateneo-blue">
                      <a href={idUrl} target="_blank" rel="noreferrer" className="block">
                        <Image
                          src={idUrl}
                          alt="Valid ID"
                          className="h-64 w-full object-contain"
                          radius="lg"
                        />
                      </a>
                    </div>
                  </div>
                )}

                {licenseUrl && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Business License / Permit
                    </span>
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 transition hover:border-ateneo-blue">
                      <a href={licenseUrl} target="_blank" rel="noreferrer" className="block">
                        <Image
                          src={licenseUrl}
                          alt="Business License"
                          className="h-64 w-full object-contain"
                          radius="lg"
                        />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </ModalBody>

            <ModalFooter>
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
