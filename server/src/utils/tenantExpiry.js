import { supabaseAdmin } from '../config/supabase.js';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/** Free rooms and unlink expired tenants (move-out date passed). Keeps tenant record for history. */
export async function processExpiredTenants() {
  const today = todayStr();
  const { data: expired, error } = await supabaseAdmin
    .from('tenants')
    .select('id, room_id')
    .not('room_id', 'is', null)
    .not('move_out_date', 'is', null)
    .lt('move_out_date', today);

  if (error) throw error;

  for (const t of expired || []) {
    await supabaseAdmin
      .from('rooms')
      .update({ is_available: true, updated_at: new Date().toISOString() })
      .eq('id', t.room_id);

    await supabaseAdmin.from('tenants').update({ room_id: null }).eq('id', t.id);
  }

  return (expired || []).length;
}

export function isTenantExpired(moveOutDate) {
  return moveOutDate ? moveOutDate < todayStr() : false;
}

export function isTenantActive(tenant) {
  return !!(
    tenant?.room_id &&
    tenant?.move_out_date &&
    tenant.move_out_date >= todayStr()
  );
}

export { todayStr };
