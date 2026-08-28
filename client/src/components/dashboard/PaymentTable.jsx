import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatPrice } from '../../utils/formatPrice';

export function PaymentTable({ payments, onMarkPaid, onUploadReceipt }) {
  if (!payments.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
        <p className="font-medium text-gray-800">No payment records yet</p>
        <p className="mt-1">
          Record a payment above — you can attach a receipt proof when creating it, or upload one
          later from the table below once entries exist.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">Tenant</th>
            <th className="px-4 py-3">Property</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Due</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Receipt</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {payments.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3">{p.tenant_name}</td>
              <td className="px-4 py-3">{p.property_name}</td>
              <td className="px-4 py-3">{formatPrice(p.amount)}</td>
              <td className="px-4 py-3">{p.due_date}</td>
              <td className="px-4 py-3">
                <Badge
                  variant={
                    p.status === 'paid' ? 'vacant' : p.status === 'overdue' ? 'occupied' : 'pending'
                  }
                >
                  {p.status}
                </Badge>
              </td>
              <td className="px-4 py-3">
                {p.receipt_url ? (
                  <a
                    href={p.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-ateneo-blue hover:underline"
                  >
                    View proof
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">No receipt yet</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  {p.status !== 'paid' && onMarkPaid && (
                    <Button type="button" variant="secondary" onClick={() => onMarkPaid(p.id)}>
                      Mark paid
                    </Button>
                  )}
                  {onUploadReceipt && (
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-ateneo-blue bg-white px-4 py-2 text-sm font-medium text-ateneo-blue transition hover:bg-blue-50">
                      {p.receipt_url ? 'Replace receipt' : 'Upload receipt'}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onUploadReceipt(p.id, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
