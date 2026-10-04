import React, { useEffect, useState, useCallback } from 'react';
import { Select, SelectItem } from '@heroui/react';
import {
  CreditCard,
  Plus,
  RefreshCw,
  User,
  Calendar,
  FileText,
  UploadCloud,
  FileCheck,
  AlertCircle,
  X,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { OwnerLayout } from '../../components/layout/OwnerLayout';
import { PaymentTable } from '../../components/dashboard/PaymentTable';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useOwnerProperty } from '../../context/OwnerPropertyContext';
import { paymentService } from '../../services/paymentService';
import { tenantService } from '../../services/tenantService';

export function PaymentLogPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const { filterPropertyId } = useOwnerProperty();

  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    tenant_id: '',
    amount: '',
    due_date: '',
    status: 'pending',
    notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, t] = await Promise.all([
        paymentService.list(accessToken, filterPropertyId),
        tenantService.list(accessToken, filterPropertyId),
      ]);
      setPayments(p.data || []);
      setTenants(t.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load payment logs');
    } finally {
      setLoading(false);
    }
  }, [accessToken, filterPropertyId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');

    if (!form.tenant_id || !form.amount || !form.due_date) {
      setError('Please select a tenant, enter rent amount, and specify a due date.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await paymentService.create(
        { ...form, amount: Number(form.amount) },
        accessToken
      );
      const paymentId = res.data?.id;
      if (receiptFile && paymentId) {
        await paymentService.uploadReceipt(paymentId, receiptFile, accessToken);
      }
      toast.success('Payment transaction successfully logged.');
      setForm({ tenant_id: '', amount: '', due_date: '', status: 'pending', notes: '' });
      setReceiptFile(null);
      setShowAddForm(false);
      load();
    } catch (err) {
      setError(err.message || 'Failed to record payment');
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkPaid(id) {
    try {
      await paymentService.updateStatus(id, 'paid', accessToken);
      toast.success('Payment marked as paid.');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to update payment status');
    }
  }

  async function handleUploadReceipt(id, file) {
    try {
      await paymentService.uploadReceipt(id, file, accessToken);
      toast.success('Payment receipt proof uploaded successfully.');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to upload receipt proof');
    }
  }

  // Header Actions
  const headerAction = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        radius="full"
        variant={showAddForm ? 'secondary' : 'primary'}
        onClick={() => setShowAddForm((v) => !v)}
        startContent={showAddForm ? <X size={14} /> : <Plus size={14} strokeWidth={2.5} />}
      >
        {showAddForm ? 'Close Form' : 'Record Payment'}
      </Button>

      <Button
        size="sm"
        radius="full"
        variant="ghost"
        isLoading={loading}
        onClick={() => load()}
        startContent={!loading && <RefreshCw size={14} />}
      >
        Refresh
      </Button>
    </div>
  );

  return (
    <OwnerLayout
      title="Payment Log & Rent Collections"
      subtitle="Manual payment tracking ledger and receipt verification (Proposal §1.5)"
      headerAction={headerAction}
    >
      <div className="space-y-6">
        {/* ==================================================================== */}
        {/* COLLAPSIBLE PAYMENT RECORDING FORM */}
        {/* ==================================================================== */}
        {showAddForm && (
          <form
            onSubmit={handleAdd}
            className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 sm:p-7 shadow-xs backdrop-blur-xs space-y-5"
          >
            <div className="border-b border-slate-200/80 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-ateneo-blue border border-blue-100">
                  <CreditCard size={18} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Record New Rent Payment
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Log a monthly rental payment, schedule a due date, and attach receipt proofs.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                radius="full"
                onClick={() => setShowAddForm(false)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
              >
                <X size={15} />
              </Button>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                <AlertCircle size={15} className="shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Select Tenant
                </label>
                <Select
                  aria-label="Select Tenant"
                  placeholder="Choose active tenant"
                  selectedKeys={form.tenant_id ? [form.tenant_id] : []}
                  onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}
                  variant="bordered"
                  size="md"
                  classNames={{
                    trigger: 'border-slate-200/90 hover:border-slate-300 bg-white rounded-xl h-10 text-xs',
                    value: 'text-xs font-medium text-slate-800',
                  }}
                >
                  {tenants.map((t) => (
                    <SelectItem key={t.id} textValue={`${t.tenant_name} (${t.properties?.name || 'Property'})`}>
                      {t.tenant_name} — {t.properties?.name} {t.rooms?.label ? `(${t.rooms.label})` : ''}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <Input
                id="amount"
                label="Rent Amount (₱)"
                type="number"
                min="0"
                placeholder="e.g. 5000"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />

              <Input
                id="due_date"
                label="Due Date"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                required
              />

              <Input
                id="notes"
                label="Payment Notes / Cycle (Optional)"
                placeholder="e.g. October 2026 Rent - Deposit included"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />

              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Receipt Proof Document (Optional)
                </label>
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-ateneo-blue file:px-3.5 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:opacity-90 cursor-pointer"
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Upload a bank transfer screenshot, GCash receipt, or scanned official receipt.</span>
                    {receiptFile && (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                        <FileCheck size={14} />
                        Selected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                radius="full"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                radius="full"
                isLoading={submitting}
                startContent={!submitting && <CreditCard size={15} strokeWidth={2.5} />}
              >
                {submitting ? 'Recording Payment…' : 'Record Payment Log'}
              </Button>
            </div>
          </form>
        )}

        {/* ==================================================================== */}
        {/* PAYMENT TABLE & SEARCH TOOLBAR */}
        {/* ==================================================================== */}
        {loading ? (
          <PageSkeleton variant="table" rows={6} cols={5} />
        ) : (
          <PaymentTable
            payments={payments}
            onMarkPaid={handleMarkPaid}
            onUploadReceipt={handleUploadReceipt}
          />
        )}
      </div>
    </OwnerLayout>
  );
}
