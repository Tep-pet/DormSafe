import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
} from '@heroui/react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

/**
 * Standard confirmation and rejection modal dialog.
 * Replaces native window.confirm and window.prompt across DormSafe.
 * Adheres to DormSafe golden modal standards.
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Please Confirm',
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  cancelLabel = 'Cancel',
  icon,
  withReason = false,
  reasonLabel = 'Administrative remarks (optional)',
  reasonPlaceholder = 'Provide any relevant context or explanation…',
  isLoading = false,
}) {
  const [reason, setReason] = useState('');

  // Reset reason when dialog opens
  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm(withReason ? reason.trim() : undefined);
  };

  const isDanger = confirmVariant === 'danger';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      radius="2xl"
      classNames={{
        base: 'border border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xl rounded-2xl p-2',
        header: 'border-b border-slate-100 pb-3',
        footer: 'border-t border-slate-100 pt-3',
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-center gap-2.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                  isDanger
                    ? 'bg-rose-50 text-rose-600 border border-rose-100'
                    : 'bg-blue-50 text-ateneo-blue border border-blue-100'
                }`}
              >
                {icon || <AlertCircle size={18} strokeWidth={2} />}
              </div>
              <span className="text-base font-bold text-slate-900 tracking-tight">{title}</span>
            </ModalHeader>

            <ModalBody className="py-4 space-y-3">
              {message && (
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {message}
                </p>
              )}

              {withReason && (
                <div className="space-y-1.5 pt-1">
                  {reasonLabel && (
                    <label className="block text-xs font-semibold text-slate-700">
                      {reasonLabel}
                    </label>
                  )}
                  <Textarea
                    aria-label={reasonLabel || 'Remarks'}
                    placeholder={reasonPlaceholder}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    variant="bordered"
                    minRows={3}
                    classNames={{
                      inputWrapper: 'border-slate-200/90 hover:border-slate-300 bg-white rounded-xl text-xs',
                      input: 'text-xs text-slate-800 leading-relaxed',
                    }}
                  />
                </div>
              )}
            </ModalBody>

            <ModalFooter className="flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                radius="full"
                onClick={onClose}
                disabled={isLoading}
              >
                {cancelLabel}
              </Button>
              <Button
                variant={confirmVariant}
                size="sm"
                radius="full"
                onClick={handleConfirm}
                isLoading={isLoading}
              >
                {confirmLabel}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
