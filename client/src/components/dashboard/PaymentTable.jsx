import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { CreditCard, ExternalLink, Check, Upload } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatPrice } from '../../utils/formatPrice';

export function PaymentTable({ payments = [], onMarkPaid, onUploadReceipt }) {
  if (!payments.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-ateneo-blue mb-3">
          <CreditCard size={24} strokeWidth={1.75} />
        </div>
        <p className="text-base font-bold text-gray-900">No payment records yet</p>
        <p className="mt-1 text-sm text-gray-500 max-w-md">
          Record a payment above — you can attach a receipt proof when creating it, or upload one later from this table.
        </p>
      </div>
    );
  }

  const columns = [
    { key: 'tenant', label: 'TENANT' },
    { key: 'property', label: 'PROPERTY' },
    { key: 'amount', label: 'AMOUNT' },
    { key: 'due', label: 'DUE DATE' },
    { key: 'status', label: 'STATUS' },
    { key: 'receipt', label: 'RECEIPT' },
    { key: 'actions', label: 'ACTIONS' },
  ];

  return (
    <div className="w-full">
      <Table
        aria-label="Payment records table"
        radius="lg"
        shadow="sm"
        classNames={{
          base: 'overflow-hidden border border-gray-100 rounded-2xl',
          table: 'min-w-full',
          th: 'bg-gray-50 text-gray-600 font-bold text-xs uppercase tracking-wider py-3.5',
          td: 'py-3.5 text-sm',
        }}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key} className={column.key === 'actions' ? 'text-right pr-6' : ''}>
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={payments}>
          {(item) => (
            <TableRow key={item.id} className="hover:bg-gray-50/60 transition">
              <TableCell className="font-semibold text-gray-900">{item.tenant_name}</TableCell>
              <TableCell className="text-gray-600">{item.property_name}</TableCell>
              <TableCell className="font-bold text-ateneo-blue">{formatPrice(item.amount)}</TableCell>
              <TableCell className="text-gray-600 text-xs">{item.due_date}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    item.status === 'paid'
                      ? 'vacant'
                      : item.status === 'overdue'
                      ? 'occupied'
                      : 'pending'
                  }
                >
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell>
                {item.receipt_url ? (
                  <a
                    href={item.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-ateneo-blue hover:underline"
                  >
                    <span>View proof</span>
                    <ExternalLink size={12} strokeWidth={2} />
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">None</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  {item.status !== 'paid' && onMarkPaid && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onMarkPaid(item.id)}
                      startContent={<Check size={13} strokeWidth={2.5} />}
                    >
                      Mark Paid
                    </Button>
                  )}
                  {onUploadReceipt && (
                    <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 transition">
                      <Upload size={12} strokeWidth={2} />
                      <span>{item.receipt_url ? 'Replace' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onUploadReceipt(item.id, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
