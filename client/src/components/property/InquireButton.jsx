import { useState } from 'react';
import { Button } from '../common/Button';
import { resolvePropertyContact } from '../../utils/parseContact';

/**
 * Lets students contact the property owner (phone / SMS).
 */
export function InquireButton({ contactName, contactPhone, description, propertyName }) {
  const [open, setOpen] = useState(false);

  const resolved = resolvePropertyContact({
    contact_name: contactName,
    contact_phone: contactPhone,
    description,
  });

  const { contactName: name, contactPhone: phone } = resolved;

  if (!phone && !name) return null;

  const telHref = phone ? `tel:${phone.replace(/\s/g, '')}` : null;
  const smsHref = phone
    ? `sms:${phone.replace(/\s/g, '')}?body=${encodeURIComponent(`Hi, I'm interested in ${propertyName} on DormSafe.`)}`
    : null;

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Inquire
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Contact Owner</h3>
            <p className="mt-1 text-sm text-gray-600">{propertyName}</p>

            <dl className="mt-4 space-y-2 text-sm">
              {name && (
                <div>
                  <dt className="font-medium text-gray-500">Owner</dt>
                  <dd className="text-gray-900">{name}</dd>
                </div>
              )}
              {phone && (
                <div>
                  <dt className="font-medium text-gray-500">Phone</dt>
                  <dd className="text-gray-900">{phone}</dd>
                </div>
              )}
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              {telHref && (
                <a href={telHref}>
                  <Button type="button">Call</Button>
                </a>
              )}
              {smsHref && (
                <a href={smsHref}>
                  <Button type="button" variant="secondary">Text Message</Button>
                </a>
              )}
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
