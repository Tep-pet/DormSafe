import { useEffect, useState } from 'react';
import { OwnerLayout } from '../../components/layout/OwnerLayout';
import { PaymentTable } from '../../components/dashboard/PaymentTable';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { useAuth } from '../../hooks/useAuth';
import { useOwnerProperty } from '../../context/OwnerPropertyContext';
import { paymentService } from '../../services/paymentService';
import { tenantService } from '../../services/tenantService';

export function PaymentLogPage() {
  const { accessToken } = useAuth();
  const { filterPropertyId } = useOwnerProperty();
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receiptFile, setReceiptFile] = useState(null);
  const [form, setForm] = useState({
    tenant_id: '',
    amount: '',
    due_date: '',
    status: 'pending',
    notes: '',
  });

  async function load() {
    setLoading(true);
    const [p, t] = await Promise.all([
      paymentService.list(accessToken, filterPropertyId),
      tenantService.list(accessToken, filterPropertyId),
    ]);
    setPayments(p.data || []);
    setTenants(t.data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [accessToken, filterPropertyId]);

  async function handleAdd(e) {
    e.preventDefault();
    const res = await paymentService.create(
      { ...form, amount: Number(form.amount) },
      accessToken
    );
    const paymentId = res.data?.id;
    if (receiptFile && paymentId) {
      await paymentService.uploadReceipt(paymentId, receiptFile, accessToken);
    }
    setForm({ tenant_id: '', amount: '', due_date: '', status: 'pending', notes: '' });
    setReceiptFile(null);
    load();
  }

  async function handleMarkPaid(id) {
    await paymentService.updateStatus(id, 'paid', accessToken);
    load();
  }

  async function handleUploadReceipt(id, file) {
    await paymentService.uploadReceipt(id, file, accessToken);
    load();
  }

  return (
    <OwnerLayout
      title="Payment Log"
      subtitle="Manual payment tracking only — no online processing (proposal §1.5)"
    >
      <form onSubmit={handleAdd} className="mb-6 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Tenant</label>
          <select
            required
            value={form.tenant_id}
            onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Select tenant</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.tenant_name} — {t.properties?.name}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Amount (₱)"
          type="number"
          min="0"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />
        <Input
          label="Due Date"
          type="date"
          value={form.due_date}
          onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          required
        />
        <Input
          label="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Receipt proof (optional)</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-ateneo-blue file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-900"
          />
          <p className="mt-1 text-xs text-gray-500">
            Upload an image or PDF as proof of payment. Marks the record as paid when uploaded.
          </p>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit">Record Payment</Button>
        </div>
      </form>

      {loading ? (
        <PageSkeleton variant="table" rows={6} cols={5} />
      ) : (
        <PaymentTable
          payments={payments}
          onMarkPaid={handleMarkPaid}
          onUploadReceipt={handleUploadReceipt}
        />
      )}
    </OwnerLayout>
  );
}
