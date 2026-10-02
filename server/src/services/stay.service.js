import { supabaseAdmin } from '../config/supabase.js';
import { createNotification } from './notification.service.js';
import { processExpiredTenants } from '../utils/tenantExpiry.js';

const STAY_WARNING_DAYS = 14;

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

export async function getActiveTenantForRoom(roomId) {
  await processExpiredTenants();

  const { data } = await supabaseAdmin
    .from('tenants')
    .select('id, tenant_name, move_out_date, student_id, room_id, property_id')
    .eq('room_id', roomId)
    .not('move_out_date', 'is', null)
    .gte('move_out_date', new Date().toISOString().slice(0, 10))
    .order('move_out_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function enrichRoomsWithStayInfo(rooms, studentId = null) {
  const enriched = [];
  for (const room of rooms || []) {
    const tenant = await getActiveTenantForRoom(room.id);
    const daysLeft = tenant ? daysUntil(tenant.move_out_date) : null;
    const hasActiveTenant = tenant && daysLeft != null && daysLeft >= 0;

    let myReservation = null;
    if (studentId) {
      const { data } = await supabaseAdmin
        .from('room_reservations')
        .select('id, reserved_start_date, status')
        .eq('room_id', room.id)
        .eq('student_id', studentId)
        .eq('status', 'pending')
        .maybeSingle();
      myReservation = data;
    }

    enriched.push({
      ...room,
      tenant_move_out_date: tenant?.move_out_date || null,
      stay_ending_soon: hasActiveTenant && daysLeft <= STAY_WARNING_DAYS,
      can_reserve: hasActiveTenant && !room.is_available,
      my_reservation: myReservation,
    });
  }
  return enriched;
}

/** Cancel reservations that start before the tenant's updated move-out date. */
export async function cancelConflictingReservations(roomId, newMoveOutDate, reason) {
  const { data: reservations, error } = await supabaseAdmin
    .from('room_reservations')
    .select('id, student_id, reserved_start_date')
    .eq('room_id', roomId)
    .eq('status', 'pending')
    .lt('reserved_start_date', newMoveOutDate);

  if (error) throw error;

  for (const r of reservations || []) {
    await supabaseAdmin
      .from('room_reservations')
      .update({ status: 'cancelled', cancel_reason: reason })
      .eq('id', r.id);

    await createNotification(r.student_id, {
      type: 'reservation_cancelled',
      title: 'Room reservation cancelled',
      body: `Your reservation was cancelled because the current tenant extended their stay. ${reason}`,
      metadata: { reservation_id: r.id, room_id: roomId },
    });
  }

  return (reservations || []).length;
}

export async function createReservation(studentId, { room_id, reserved_start_date }) {
  const { data: room, error: roomError } = await supabaseAdmin
    .from('rooms')
    .select('id, property_id, is_available, properties!inner(status, is_verified)')
    .eq('id', room_id)
    .single();

  if (roomError || !room) {
    const err = new Error('Room not found');
    err.status = 404;
    throw err;
  }

  const tenant = await getActiveTenantForRoom(room_id);
  if (!tenant?.move_out_date) {
    const err = new Error('This room is not available for reservation');
    err.status = 400;
    throw err;
  }

  if (reserved_start_date < tenant.move_out_date) {
    const err = new Error(
      `Reservation must start on or after the current tenant's move-out date (${tenant.move_out_date})`
    );
    err.status = 400;
    throw err;
  }

  const daysLeft = daysUntil(tenant.move_out_date);
  if (daysLeft == null || daysLeft < 0) {
    const err = new Error('This room cannot be reserved at this time');
    err.status = 400;
    throw err;
  }

  const { data: existing } = await supabaseAdmin
    .from('room_reservations')
    .select('id')
    .eq('room_id', room_id)
    .eq('student_id', studentId)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) {
    const err = new Error('You already have a pending reservation for this room');
    err.status = 409;
    throw err;
  }

  const { data, error } = await supabaseAdmin
    .from('room_reservations')
    .insert({
      room_id,
      property_id: room.property_id,
      student_id: studentId,
      reserved_start_date,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  const { data: property } = await supabaseAdmin
    .from('properties')
    .select('owner_id, name')
    .eq('id', room.property_id)
    .single();

  if (property?.owner_id) {
    await createNotification(property.owner_id, {
      type: 'room_reserved',
      title: 'New room reservation',
      body: `A student reserved a room at ${property.name} starting ${reserved_start_date}.`,
      metadata: { reservation_id: data.id, room_id, property_id: room.property_id },
    });
  }

  return data;
}

export async function getStudentStays(studentId) {
  await processPaymentRemindersForStudent(studentId);

  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select(`
      id, tenant_name, contact, move_in_date, move_out_date, move_out_confirmed, move_out_dispute_reason,
      property_id, room_id,
      properties(id, name, address, contact_name, contact_phone),
      rooms(id, label, price)
    `)
    .eq('student_id', studentId)
    .order('move_out_date', { ascending: true });

  if (error) throw error;

  const stays = data || [];
  const today = new Date().toISOString().slice(0, 10);

  for (const stay of stays) {
    await maybeNotifyStayEndingSoon(studentId, stay);
    stay.is_current = stay.move_in_date && stay.move_in_date <= today &&
      (!stay.move_out_date || stay.move_out_date >= today);
    stay.is_upcoming = stay.move_in_date && stay.move_in_date > today;
  }

  return stays;
}

export async function confirmMoveOut(studentId, tenantId) {
  const { data: tenant, error } = await supabaseAdmin
    .from('tenants')
    .select('id, student_id, move_out_date, property_id, properties!inner(owner_id, name)')
    .eq('id', tenantId)
    .single();

  if (error || !tenant || tenant.student_id !== studentId) {
    const err = new Error('Stay not found');
    err.status = 404;
    throw err;
  }

  const { data, error: updateError } = await supabaseAdmin
    .from('tenants')
    .update({ move_out_confirmed: true, move_out_dispute_reason: null })
    .eq('id', tenantId)
    .select()
    .single();

  if (updateError) throw updateError;

  if (tenant.properties?.owner_id) {
    await createNotification(tenant.properties.owner_id, {
      type: 'stay_confirm_request',
      title: 'Move-out confirmed',
      body: `Tenant confirmed move-out on ${tenant.move_out_date} at ${tenant.properties.name}.`,
      metadata: { tenant_id: tenantId },
    });
  }

  return data;
}

export async function disputeMoveOut(studentId, tenantId, reason) {
  if (!reason?.trim()) {
    const err = new Error('Please describe why the move-out date is incorrect');
    err.status = 400;
    throw err;
  }

  const { data: tenant, error } = await supabaseAdmin
    .from('tenants')
    .select('id, student_id, move_out_date, property_id, properties!inner(owner_id, name)')
    .eq('id', tenantId)
    .single();

  if (error || !tenant || tenant.student_id !== studentId) {
    const err = new Error('Stay not found');
    err.status = 404;
    throw err;
  }

  const { data, error: updateError } = await supabaseAdmin
    .from('tenants')
    .update({ move_out_confirmed: false, move_out_dispute_reason: reason.trim() })
    .eq('id', tenantId)
    .select()
    .single();

  if (updateError) throw updateError;

  if (tenant.properties?.owner_id) {
    await createNotification(tenant.properties.owner_id, {
      type: 'stay_disputed',
      title: 'Move-out date disputed',
      body: `Tenant disputed move-out (${tenant.move_out_date}): ${reason.slice(0, 100)}`,
      metadata: { tenant_id: tenantId, reason },
    });
  }

  return data;
}

export async function getLeaseSummary(studentId, tenantId) {
  const { data: tenant, error } = await supabaseAdmin
    .from('tenants')
    .select(`
      id, tenant_name, contact, move_in_date, move_out_date,
      properties(id, name, address, contact_name, contact_phone, type),
      rooms(id, label, price)
    `)
    .eq('id', tenantId)
    .eq('student_id', studentId)
    .single();

  if (error || !tenant) {
    const err = new Error('Stay not found');
    err.status = 404;
    throw err;
  }

  return {
    generated_at: new Date().toISOString(),
    tenant_name: tenant.tenant_name,
    contact: tenant.contact,
    move_in_date: tenant.move_in_date,
    move_out_date: tenant.move_out_date,
    property: tenant.properties,
    room: tenant.rooms,
    monthly_rent: tenant.rooms?.price || null,
  };
}

async function getReservationQueuePosition(roomId, reservedStartDate, reservationId) {
  const { data } = await supabaseAdmin
    .from('room_reservations')
    .select('id, created_at')
    .eq('room_id', roomId)
    .eq('status', 'pending')
    .eq('reserved_start_date', reservedStartDate)
    .order('created_at', { ascending: true });

  const list = data || [];
  const idx = list.findIndex((r) => r.id === reservationId);
  return idx >= 0 ? idx + 1 : list.length + 1;
}

async function processPaymentRemindersForStudent(studentId) {
  const { data: tenants } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('student_id', studentId);

  const tenantIds = (tenants || []).map((t) => t.id);
  if (!tenantIds.length) return;

  const today = new Date().toISOString().slice(0, 10);
  const { data: duePayments } = await supabaseAdmin
    .from('payments')
    .select('id, amount, due_date, tenant_id')
    .in('tenant_id', tenantIds)
    .in('status', ['pending', 'overdue'])
    .lte('due_date', today);

  for (const pay of duePayments || []) {
    const { data: existing } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('user_id', studentId)
      .eq('type', 'payment_due')
      .eq('metadata->>payment_id', pay.id)
      .gte('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (existing?.length) continue;

    await createNotification(studentId, {
      type: 'payment_due',
      title: 'Rent payment due',
      body: `Payment of ₱${Number(pay.amount).toLocaleString()} was due on ${pay.due_date}.`,
      metadata: { payment_id: pay.id, tenant_id: pay.tenant_id, due_date: pay.due_date },
    });
  }
}

async function maybeNotifyStayEndingSoon(studentId, stay) {
  if (!stay.move_out_date) return;

  const daysLeft = daysUntil(stay.move_out_date);
  if (daysLeft == null || daysLeft < 0 || daysLeft > STAY_WARNING_DAYS) return;

  const { data: existing } = await supabaseAdmin
    .from('notifications')
    .select('id')
    .eq('user_id', studentId)
    .eq('type', 'stay_ending_soon')
    .eq('metadata->>tenant_id', stay.id)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .limit(1);

  if (existing?.length) return;

  await createNotification(studentId, {
    type: 'stay_ending_soon',
    title: 'Your stay is ending soon',
    body: `Your stay at ${stay.properties?.name || 'your dorm'} ends on ${stay.move_out_date} (${daysLeft} day${daysLeft === 1 ? '' : 's'} left). You can request to re-rent from My Stay.`,
    metadata: { tenant_id: stay.id, move_out_date: stay.move_out_date, days_left: daysLeft },
  });
}

export async function updateStudentMoveOut(studentId, tenantId, newMoveOutDate) {
  if (!newMoveOutDate) {
    const err = new Error('Move-out date is required');
    err.status = 400;
    throw err;
  }

  const { data: tenant, error } = await supabaseAdmin
    .from('tenants')
    .select(`
      id, student_id, move_out_date, move_in_date, room_id, property_id,
      properties!inner(owner_id, name)
    `)
    .eq('id', tenantId)
    .single();

  if (error || !tenant || tenant.student_id !== studentId) {
    const err = new Error('Stay not found');
    err.status = 404;
    throw err;
  }

  if (tenant.move_in_date && newMoveOutDate < tenant.move_in_date) {
    const err = new Error('Move-out date must be after move-in date');
    err.status = 400;
    throw err;
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('tenants')
    .update({ move_out_date: newMoveOutDate })
    .eq('id', tenantId)
    .select()
    .single();

  if (updateError) throw updateError;

  if (tenant.room_id) {
    await cancelConflictingReservations(
      tenant.room_id,
      newMoveOutDate,
      `Tenant updated move-out date to ${newMoveOutDate}.`
    );

    const today = new Date().toISOString().slice(0, 10);
    if (newMoveOutDate >= today) {
      await supabaseAdmin
        .from('rooms')
        .update({ is_available: false, updated_at: new Date().toISOString() })
        .eq('id', tenant.room_id);
    }
  }

  if (tenant.properties?.owner_id) {
    await createNotification(tenant.properties.owner_id, {
      type: 'rerent_requested',
      title: 'Tenant updated move-out date',
      body: `Move-out at ${tenant.properties.name} changed to ${newMoveOutDate}.`,
      metadata: { tenant_id: tenantId, new_move_out_date: newMoveOutDate },
    });
  }

  return updated;
}

export async function updateReservation(studentId, reservationId, { reserved_start_date }) {
  const { data: reservation, error } = await supabaseAdmin
    .from('room_reservations')
    .select('id, room_id, student_id, status, reserved_start_date')
    .eq('id', reservationId)
    .single();

  if (error || !reservation || reservation.student_id !== studentId) {
    const err = new Error('Reservation not found');
    err.status = 404;
    throw err;
  }

  if (reservation.status !== 'pending') {
    const err = new Error('Only pending reservations can be edited');
    err.status = 400;
    throw err;
  }

  const tenant = await getActiveTenantForRoom(reservation.room_id);
  if (!tenant?.move_out_date) {
    const err = new Error('This room is no longer occupied — reservation cannot be updated');
    err.status = 400;
    throw err;
  }

  if (reserved_start_date < tenant.move_out_date) {
    const err = new Error(
      `Reservation must start on or after ${tenant.move_out_date} (current tenant move-out)`
    );
    err.status = 400;
    throw err;
  }

  const { data, error: updateError } = await supabaseAdmin
    .from('room_reservations')
    .update({ reserved_start_date })
    .eq('id', reservationId)
    .select()
    .single();

  if (updateError) throw updateError;
  return data;
}

export async function requestRerent(studentId, tenantId, { extension_months = 1 } = {}) {
  const { data: tenant, error } = await supabaseAdmin
    .from('tenants')
    .select(`
      id, student_id, move_out_date, room_id, property_id,
      properties!inner(owner_id, name)
    `)
    .eq('id', tenantId)
    .single();

  if (error || !tenant || tenant.student_id !== studentId) {
    const err = new Error('Stay not found');
    err.status = 404;
    throw err;
  }

  if (!tenant.move_out_date) {
    const err = new Error('No move-out date set for this stay');
    err.status = 400;
    throw err;
  }

  const current = new Date(`${tenant.move_out_date}T00:00:00`);
  current.setMonth(current.getMonth() + Number(extension_months));
  const newMoveOut = current.toISOString().slice(0, 10);

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('tenants')
    .update({ move_out_date: newMoveOut })
    .eq('id', tenantId)
    .select()
    .single();

  if (updateError) throw updateError;

  if (tenant.room_id) {
    await cancelConflictingReservations(
      tenant.room_id,
      newMoveOut,
      `Tenant extended stay until ${newMoveOut}.`
    );
  }

  if (tenant.properties?.owner_id) {
    await createNotification(tenant.properties.owner_id, {
      type: 'rerent_requested',
      title: 'Tenant extended stay',
      body: `A tenant extended their stay at ${tenant.properties.name} until ${newMoveOut}.`,
      metadata: { tenant_id: tenantId, new_move_out_date: newMoveOut },
    });
  }

  return updated;
}

export async function getStudentReservations(studentId) {
  const { data, error } = await supabaseAdmin
    .from('room_reservations')
    .select(`
      id, reserved_start_date, status, cancel_reason, created_at, room_id,
      properties(id, name, address),
      rooms(id, label, price)
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const list = [];
  for (const r of data || []) {
    let queue_position = null;
    if (r.status === 'pending' && r.room_id) {
      queue_position = await getReservationQueuePosition(r.room_id, r.reserved_start_date, r.id);
    }
    list.push({ ...r, queue_position });
  }
  return list;
}

export { daysUntil, STAY_WARNING_DAYS };
