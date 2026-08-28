import { supabaseAdmin } from '../config/supabase.js';

export async function assertRoomOwnedBy(roomId, ownerId) {
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .select('id, property_id, properties!inner(owner_id)')
    .eq('id', roomId)
    .single();

  if (error || !data || data.properties.owner_id !== ownerId) {
    const err = new Error('Room not found');
    err.status = 404;
    throw err;
  }

  return data;
}

export async function assertPaymentOwnedBy(paymentId, ownerId) {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('id, tenants!inner(properties!inner(owner_id))')
    .eq('id', paymentId)
    .single();

  if (error || !data || data.tenants.properties.owner_id !== ownerId) {
    const err = new Error('Payment not found');
    err.status = 404;
    throw err;
  }

  return data;
}
