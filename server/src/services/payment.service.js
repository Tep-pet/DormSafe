import { supabaseAdmin } from '../config/supabase.js';
import { getSignedReceiptUrl } from './receipt.service.js';
import { assertPaymentOwnedBy } from '../utils/ownership.js';
import { createNotification } from './notification.service.js';

export async function getPaymentsByOwner(ownerId, propertyId = null) {
  let query = supabaseAdmin
    .from('payments')
    .select(`
      id, amount, due_date, paid_date, status, notes, receipt_storage_path, created_at,
      tenants!inner(id, tenant_name, property_id, properties!inner(name, owner_id))
    `)
    .eq('tenants.properties.owner_id', ownerId)
    .order('due_date', { ascending: false });

  if (propertyId) {
    query = query.eq('tenants.property_id', propertyId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return Promise.all(
    (data || []).map(async (p) => ({
      id: p.id,
      amount: p.amount,
      due_date: p.due_date,
      paid_date: p.paid_date,
      status: p.status,
      notes: p.notes,
      receipt_storage_path: p.receipt_storage_path,
      receipt_url: p.receipt_storage_path
        ? await getSignedReceiptUrl(p.receipt_storage_path)
        : null,
      tenant_name: p.tenants.tenant_name,
      property_name: p.tenants.properties.name,
      property_id: p.tenants.property_id,
      tenant_id: p.tenants.id,
    }))
  );
}

/** Manual payment log — proposal §1.5 (no online processing) */
export async function createPayment(ownerId, payload) {
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('tenants')
    .select('id, properties!inner(owner_id)')
    .eq('id', payload.tenant_id)
    .single();

  if (tenantError || !tenant || tenant.properties.owner_id !== ownerId) {
    const err = new Error('Tenant not found');
    err.status = 404;
    throw err;
  }

  const { data, error } = await supabaseAdmin
    .from('payments')
    .insert({
      tenant_id: payload.tenant_id,
      amount: payload.amount,
      due_date: payload.due_date,
      paid_date: payload.status === 'paid' ? payload.paid_date || new Date().toISOString().slice(0, 10) : null,
      status: payload.status || 'pending',
      notes: payload.notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePaymentStatus(paymentId, ownerId, status) {
  await assertPaymentOwnedBy(paymentId, ownerId);

  const updates = { status };
  if (status === 'paid') updates.paid_date = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabaseAdmin
    .from('payments')
    .update(updates)
    .eq('id', paymentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getStudentPayments(studentId) {
  const { data: tenants, error: tenantError } = await supabaseAdmin
    .from('tenants')
    .select('id, property_id, properties(name)')
    .eq('student_id', studentId);

  if (tenantError) throw tenantError;
  const tenantIds = (tenants || []).map((t) => t.id);
  if (!tenantIds.length) return [];

  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('id, amount, due_date, paid_date, status, notes, tenant_id')
    .in('tenant_id', tenantIds)
    .order('due_date', { ascending: false });

  if (error) throw error;

  const tenantMap = Object.fromEntries((tenants || []).map((t) => [t.id, t]));
  return (data || []).map((p) => ({
    ...p,
    property_name: tenantMap[p.tenant_id]?.properties?.name || null,
  }));
}

export async function sendPaymentReminders(ownerId) {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01`;

  const { data: payments, error } = await supabaseAdmin
    .from('payments')
    .select(`
      id, amount, due_date, status, tenant_id,
      tenants!inner(id, student_id, tenant_name, properties!inner(owner_id, name))
    `)
    .eq('tenants.properties.owner_id', ownerId)
    .in('status', ['pending', 'overdue'])
    .lte('due_date', today);

  if (error) throw error;

  const remindedTenants = new Set();
  let sent = 0;

  async function notifyStudent(studentId, payload) {
    const { data: existing } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('user_id', studentId)
      .eq('type', 'payment_due')
      .eq('metadata->>tenant_id', payload.metadata.tenant_id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (existing?.length) return false;

    await createNotification(studentId, payload);
    return true;
  }

  for (const pay of payments || []) {
    const studentId = pay.tenants?.student_id;
    if (!studentId) continue;

    const didSend = await notifyStudent(studentId, {
      type: 'payment_due',
      title: 'Rent reminder',
      body: `Rent of ₱${Number(pay.amount).toLocaleString()} is due (${pay.due_date}) at ${pay.tenants.properties.name}.`,
      metadata: { payment_id: pay.id, tenant_id: pay.tenant_id },
    });
    if (didSend) {
      sent++;
      remindedTenants.add(pay.tenant_id);
    }
  }

  const { data: activeTenants } = await supabaseAdmin
    .from('tenants')
    .select(`
      id, student_id, move_in_date, move_out_date,
      rooms(price),
      properties!inner(owner_id, name)
    `)
    .eq('properties.owner_id', ownerId)
    .not('student_id', 'is', null)
    .not('room_id', 'is', null);

  for (const tenant of activeTenants || []) {
    if (remindedTenants.has(tenant.id)) continue;
    if (tenant.move_out_date && tenant.move_out_date < today) continue;
    if (tenant.move_in_date && tenant.move_in_date > today) continue;

    const { data: paidThisMonth } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('status', 'paid')
      .gte('paid_date', monthStart)
      .limit(1);

    if (paidThisMonth?.length) continue;

    const amount = tenant.rooms?.price;
    const amountText = amount != null ? `₱${Number(amount).toLocaleString()}` : 'your rent';

    const didSend = await notifyStudent(tenant.student_id, {
      type: 'payment_due',
      title: 'Rent reminder',
      body: `${amountText} is due this month at ${tenant.properties.name}. Contact your landlord for payment details.`,
      metadata: { tenant_id: tenant.id },
    });
    if (didSend) sent++;
  }

  return {
    sent,
    hint:
      sent === 0
        ? 'No reminders sent — tenants may already have been notified in the last 24 hours, or rent is marked paid for this month.'
        : null,
  };
}
