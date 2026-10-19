import { supabaseAdmin } from '../config/supabase.js';

export const OWNER_ALIASES = {};

export function resolveOwnerIds(ownerId) {
  if (!ownerId) return [];
  const linked = OWNER_ALIASES[ownerId];
  return linked ? [ownerId, linked] : [ownerId];
}

export async function assertRoomOwnedBy(roomId, ownerId) {
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .select('id, property_id, properties!inner(owner_id)')
    .eq('id', roomId)
    .single();

  const ownerIds = resolveOwnerIds(ownerId);
  if (error || !data || !ownerIds.includes(data.properties.owner_id)) {
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

  const ownerIds = resolveOwnerIds(ownerId);
  if (error || !data || !ownerIds.includes(data.tenants.properties.owner_id)) {
    const err = new Error('Payment not found');
    err.status = 404;
    throw err;
  }

  return data;
}

