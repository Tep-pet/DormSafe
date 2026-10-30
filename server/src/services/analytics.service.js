import { supabaseAdmin } from '../config/supabase.js';
import { processExpiredTenants } from '../utils/tenantExpiry.js';
import { resolveOwnerIds } from '../utils/ownership.js';

export async function getOwnerAnalytics(ownerId, propertyId = null) {
  await processExpiredTenants();

  const ownerIds = resolveOwnerIds(ownerId);
  let propQuery = supabaseAdmin
    .from('properties')
    .select('id, name, rooms(id, is_available, price)')
    .in('owner_id', ownerIds);

  if (propertyId) propQuery = propQuery.eq('id', propertyId);

  const { data: properties } = await propQuery;
  let totalRooms = 0;
  let vacant = 0;
  const byProperty = [];

  for (const p of properties || []) {
    const rooms = p.rooms || [];
    const v = rooms.filter((r) => r.is_available).length;
    totalRooms += rooms.length;
    vacant += v;
    byProperty.push({
      property_id: p.id,
      name: p.name,
      total_rooms: rooms.length,
      vacant_rooms: v,
      vacancy_rate: rooms.length ? Math.round((v / rooms.length) * 100) : 0,
    });
  }

  const propertyIds = (properties || []).map((p) => p.id);
  const trend = [];
  if (propertyIds.length) {
    const { data: tenants } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .in('property_id', propertyIds);
    const tenantIds = (tenants || []).map((t) => t.id);

    if (tenantIds.length) {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const { data: payments } = await supabaseAdmin
        .from('payments')
        .select('amount, paid_date, status')
        .in('tenant_id', tenantIds)
        .eq('status', 'paid')
        .gte('paid_date', sixMonthsAgo.toISOString().slice(0, 10));

      const byMonth = {};
      for (const pay of payments || []) {
        const key = pay.paid_date?.slice(0, 7);
        if (key) byMonth[key] = (byMonth[key] || 0) + Number(pay.amount);
      }
      trend.push(...Object.entries(byMonth).map(([month, revenue]) => ({ month, revenue })));
      trend.sort((a, b) => a.month.localeCompare(b.month));
    }
  }

  return {
    vacancy_rate: totalRooms ? Math.round((vacant / totalRooms) * 100) : 0,
    total_rooms: totalRooms,
    vacant_rooms: vacant,
    by_property: byProperty,
    revenue_trend: trend,
  };
}

export async function getOccupancyCalendar(ownerId, propertyId = null) {
  await processExpiredTenants();

  const ownerIds = resolveOwnerIds(ownerId);
  let tenantQuery = supabaseAdmin
    .from('tenants')
    .select(`
      id, tenant_name, move_in_date, move_out_date, room_id, property_id,
      properties!inner(id, name, owner_id),
      rooms(label)
    `)
    .in('properties.owner_id', ownerIds);

  if (propertyId) tenantQuery = tenantQuery.eq('property_id', propertyId);

  const { data: tenants } = await tenantQuery;

  let resQuery = supabaseAdmin
    .from('room_reservations')
    .select(`
      id, reserved_start_date, status, room_id, property_id,
      properties!inner(name, owner_id),
      rooms(label),
      profiles!room_reservations_student_id_fkey(full_name)
    `)
    .in('properties.owner_id', ownerIds)
    .eq('status', 'pending');

  if (propertyId) resQuery = resQuery.eq('property_id', propertyId);

  const { data: reservations } = await resQuery;

  const events = [];
  for (const t of tenants || []) {
    if (t.move_in_date) {
      events.push({
        type: 'move_in',
        date: t.move_in_date,
        label: `${t.tenant_name} move-in`,
        property: t.properties?.name,
        room: t.rooms?.label,
      });
    }
    if (t.move_out_date) {
      events.push({
        type: 'move_out',
        date: t.move_out_date,
        label: `${t.tenant_name} move-out`,
        property: t.properties?.name,
        room: t.rooms?.label,
      });
    }
  }
  for (const r of reservations || []) {
    events.push({
      type: 'reservation',
      date: r.reserved_start_date,
      label: `Reservation: ${r.profiles?.full_name || 'Student'}`,
      property: r.properties?.name,
      room: r.rooms?.label,
    });
  }

  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}
