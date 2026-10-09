import { supabaseAdmin } from '../config/supabase.js';

export const OWNER_ALIASES = {
  // Ivory 1104: owner.ivory1104@dormsafe.test <-> blancotwinkle@gmail.com
  '45e8d5ea-bc18-4d09-90be-e2a6431d20f4': '5ceba68c-9414-47a1-b8ee-83d994886e81',
  '5ceba68c-9414-47a1-b8ee-83d994886e81': '45e8d5ea-bc18-4d09-90be-e2a6431d20f4',

  // Ivory 2004: owner.ivory2004@dormsafe.test <-> rheapalima09@gmail.com
  '0623c130-6bc0-4322-bebe-e6890ad333ba': '9e2f6218-1c9a-4cbd-a036-776629a10163',
  '9e2f6218-1c9a-4cbd-a036-776629a10163': '0623c130-6bc0-4322-bebe-e6890ad333ba',

  // BRC Dormitory: owner.brc@dormsafe.test <-> buildingblocks_davao@yahoo.com.ph
  '8f6869b5-7a4a-469c-b441-43c45434b8e7': '055385e8-9cbb-4f53-a241-23bb6f18ae83',
  '055385e8-9cbb-4f53-a241-23bb6f18ae83': '8f6869b5-7a4a-469c-b441-43c45434b8e7',

  // Juan Luna / Juna Boarding House: owner.juan@dormsafe.test <-> jerlyugapay@gmail.com
  'c47d053b-5730-4fff-87bb-8da80b73c938': 'a12a011b-7536-4f59-93c1-789c4aa45a64',
  'a12a011b-7536-4f59-93c1-789c4aa45a64': 'c47d053b-5730-4fff-87bb-8da80b73c938',
};

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

