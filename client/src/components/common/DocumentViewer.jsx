import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import { ExternalLink, FileText, Download, AlertCircle } from 'lucide-react';
import { Button } from './Button';

function DocumentItem({ label, url, alt }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
          {label}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-ateneo-blue hover:underline"
        >
          <span>Open Full</span>
          <ExternalLink size={12} />
        </a>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 transition hover:border-ateneo-blue">
        {hasError ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 p-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <AlertCircle size={20} />
            </div>
            <p className="text-xs font-medium text-slate-700">
              Format not directly renderable by browser
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs">
              This document was uploaded in a format (such as raw HEIC or specialized file) requiring external viewing.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-ateneo-blue px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-ateneo-blue/90"
            >
              <Download size={13} />
              <span>Open / Download Original</span>
            </a>
          </div>
        ) : (
          <a href={url} target="_blank" rel="noreferrer" className="block group">
            <img
              src={url}
              alt={alt}
              onError={() => setHasError(true)}
              className="h-64 w-full object-contain rounded-lg transition-transform duration-200 group-hover:scale-[1.02]"
            />
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Verification Document Viewer built with HeroUI Modal and fallback support.
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
                  <DocumentItem
                    label="Valid Government ID"
                    url={idUrl}
                    alt="Valid ID"
                  />
                )}

                {licenseUrl && (
                  <DocumentItem
                    label="Business License / Permit"
                    url={licenseUrl}
                    alt="Business License"
                  />
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
