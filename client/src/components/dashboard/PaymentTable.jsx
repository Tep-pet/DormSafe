import React, { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import {
  CreditCard,
  ExternalLink,
  Check,
  UploadCloud,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Pagination } from '../common/Pagination';
import { formatPrice } from '../../utils/formatPrice';
import { ITEMS_PER_PAGE } from '../../constants/pagination';

/**
 * Modern Executive PaymentTable Component
 * Implements Single-Row Toolbar, Status Filter Capsule, and Strict 15-Item Pagination.
 */
export function PaymentTable({ payments = [], onMarkPaid, onUploadReceipt }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const itemsPerPage = ITEMS_PER_PAGE;

  // Filter Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      const matchesSearch =
        !searchTerm.trim() ||
        (item.tenant_name && item.tenant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.property_name && item.property_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payments, searchTerm, statusFilter]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / itemsPerPage));
  const paginatedPayments = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredPayments.slice(start, start + itemsPerPage);
  }, [filteredPayments, page, itemsPerPage]);

  const statusCounts = useMemo(() => {
    return {
      all: payments.length,
      paid: payments.filter((p) => p.status === 'paid').length,
      pending: payments.filter((p) => p.status === 'pending').length,
      overdue: payments.filter((p) => p.status === 'overdue').length,
    };
  }, [payments]);

  const columns = [
    { key: 'tenant', label: 'TENANT' },
    { key: 'property', label: 'PROPERTY' },
    { key: 'amount', label: 'RENT AMOUNT' },
    { key: 'due', label: 'DUE DATE' },
    { key: 'status', label: 'PAYMENT STATUS' },
    { key: 'receipt', label: 'RECEIPT PROOF' },
    { key: 'actions', label: 'ACTIONS' },
  ];

  if (!payments.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/95 p-12 text-center shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-ateneo-blue mb-3">
          <CreditCard size={24} strokeWidth={1.75} />
        </div>
        <p className="text-base font-bold text-slate-900">No payment logs recorded yet</p>
        <p className="mt-1 text-xs text-slate-500 max-w-md">
          Record monthly rental transactions above to track paid records, upcoming due dates, and proof receipts.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* ==================================================================== */}
      {/* SINGLE-ROW COMPACT TOOLBAR */}
      {/* ==================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3.5 border-b border-slate-200/80 pb-3.5">
        {/* Left: Search + Reset */}
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <div className="relative w-full sm:w-60">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search tenant or property…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200/90 bg-white/95 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 shadow-2xs transition-all focus:border-ateneo-blue focus:outline-none focus:ring-2 focus:ring-ateneo-blue/20"
            />
          </div>

          {(searchTerm || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/70 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition cursor-pointer"
            >
              <X size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Right Edge: Status Tab Capsule */}
        <div className="w-full lg:w-auto overflow-x-auto no-scrollbar py-0.5">
          <div className="inline-flex min-w-full sm:min-w-0 items-center gap-1 p-1 h-10 rounded-2xl bg-slate-100/90 border border-slate-200/70 shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-xl px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-white text-ateneo-blue shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({statusCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('paid')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === 'paid'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>Paid ({statusCounts.paid})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === 'pending'
                  ? 'bg-white text-amber-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock size={13} className="text-amber-600" />
              <span>Pending ({statusCounts.pending})</span>
            </button>
            {statusCounts.overdue > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter('overdue')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                  statusFilter === 'overdue'
                    ? 'bg-white text-rose-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <AlertTriangle size={13} className="text-rose-600" />
                <span>Overdue ({statusCounts.overdue})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* HEROUI TABLE */}
      {/* ==================================================================== */}
      {filteredPayments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/95 p-8 text-center">
          <p className="text-xs font-semibold text-slate-700">No payments match your filter</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Try resetting search criteria or status filter.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-xs backdrop-blur-xs">
          <Table
            aria-label="Payment records table"
            radius="none"
            shadow="none"
            classNames={{
              base: 'overflow-x-auto',
              table: 'min-w-full',
              th: 'bg-slate-50/80 text-slate-500 font-bold text-[11px] uppercase tracking-wider py-3.5 border-b border-slate-200/80',
              td: 'py-3.5 text-xs text-slate-700 border-b border-slate-100',
            }}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn
                  key={column.key}
                  className={column.key === 'actions' ? 'text-right pr-6' : ''}
                >
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={paginatedPayments}>
              {(item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <TableCell className="font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-ateneo-blue border border-blue-100/70 shadow-2xs font-bold text-xs">
                        {item.tenant_name ? item.tenant_name.charAt(0).toUpperCase() : 'P'}
                      </div>
                      <div>
                        <span>{item.tenant_name}</span>
                        {item.notes && (
                          <span className="block text-[10px] font-normal text-slate-400 truncate max-w-[160px]">
                            {item.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 font-medium">{item.property_name}</TableCell>
                  <TableCell className="font-bold text-ateneo-blue text-sm">
                    {formatPrice(item.amount)}
                  </TableCell>
                  <TableCell className="text-slate-600 text-xs">{item.due_date}</TableCell>
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
                      {item.status === 'paid' ? 'Paid & Logged' : item.status === 'overdue' ? 'Overdue' : 'Pending Payment'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.receipt_url ? (
                      <a
                        href={item.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50/80 px-2.5 py-1 text-[11px] font-semibold text-ateneo-blue hover:bg-blue-100 transition border border-blue-100"
                      >
                        <span>View Proof</span>
                        <ExternalLink size={12} strokeWidth={2} />
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400">No proof attached</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2 pr-2">
                      {item.status !== 'paid' && onMarkPaid && (
                        <Button
                          size="sm"
                          radius="full"
                          variant="secondary"
                          onClick={() => onMarkPaid(item.id)}
                          startContent={<Check size={13} strokeWidth={2.5} className="text-emerald-600" />}
                          className="h-7 text-[11px] px-2.5"
                        >
                          Mark Paid
                        </Button>
                      )}
                      {onUploadReceipt && (
                        <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition">
                          <UploadCloud size={13} strokeWidth={2} className="text-ateneo-blue" />
                          <span>{item.receipt_url ? 'Replace Proof' : 'Upload Proof'}</span>
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
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalCount={filteredPayments.length}
        itemLabel="matching records"
        onPageChange={setPage}
        className="mt-8"
      />
    </div>
  );
}
