import { supabaseAdmin } from '../config/supabase.js';
import { cancelConflictingReservations } from './stay.service.js';
import { processExpiredTenants, isTenantExpired, isTenantActive } from '../utils/tenantExpiry.js';
import { createNotification } from './notification.service.js';
import { resolveOwnerIds } from '../utils/ownership.js';

export async function getAllTenants() {
  await processExpiredTenants();

  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select(`
      id, tenant_name, contact, move_in_date, move_out_date, created_at, property_id, room_id, student_id,
      properties(id, name, address),
      rooms(id, label, price),
      profiles:student_id(id, email, full_name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((t) => ({
    ...t,
    is_expired: isTenantExpired(t.move_out_date),
    is_active: isTenantActive(t),
  }));
}

export async function getTenantsByOwner(ownerId, propertyId = null) {
  await processExpiredTenants();

  const ownerIds = resolveOwnerIds(ownerId);
  let query = supabaseAdmin
    .from('tenants')
    .select(`
      id, tenant_name, contact, move_in_date, move_out_date, created_at, property_id, room_id, student_id,
      properties!inner(id, name, owner_id),
      rooms(id, label, price),
      profiles:student_id(id, email, full_name)
    `)
    .in('properties.owner_id', ownerIds)
    .order('created_at', { ascending: false });

  if (propertyId) {
    query = query.eq('property_id', propertyId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((t) => ({
    ...t,
    is_expired: isTenantExpired(t.move_out_date),
    is_active: isTenantActive(t),
  }));
}

async function resolveStudentId(studentEmail) {
  if (!studentEmail?.trim()) return null;
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('email', studentEmail.trim().toLowerCase())
    .maybeSingle();

  if (!data || data.role !== 'student') return null;
  return data.id;
}

export async function createTenant(ownerId, payload) {
  const ownerIds = resolveOwnerIds(ownerId);
  const { data: property, error } = await supabaseAdmin
    .from('properties')
    .select('id')
    .eq('id', payload.property_id)
    .in('owner_id', ownerIds)
    .single();

  if (error || !property) {
    const err = new Error('Property not found');
    err.status = 404;
    throw err;
  }

  const studentId = await resolveStudentId(payload.student_email);

  const { data, error: insertError } = await supabaseAdmin
    .from('tenants')
    .insert({
      property_id: payload.property_id,
      room_id: payload.room_id || null,
      student_id: studentId,
      tenant_name: payload.tenant_name,
      contact: payload.contact || null,
      move_in_date: payload.move_in_date || null,
      move_out_date: payload.move_out_date || null,
    })
    .select()
    .single();

  if (insertError) throw insertError;

  if (studentId && payload.move_out_date) {
    await createNotification(studentId, {
      type: 'tenant_invite',
      title: 'Confirm your stay',
      body: `An owner linked you to a stay. Please confirm your move-out date (${payload.move_out_date}).`,
      metadata: { tenant_id: data.id, property_id: payload.property_id },
    });
  }

  if (payload.room_id && payload.move_out_date) {
    await supabaseAdmin
      .from('rooms')
      .update({ is_available: false, updated_at: new Date().toISOString() })
      .eq('id', payload.room_id);
  }

  return data;
}

async function freeRoom(roomId) {
  if (!roomId) return;
  await supabaseAdmin
    .from('rooms')
    .update({ is_available: true, updated_at: new Date().toISOString() })
    .eq('id', roomId);
}

export async function deleteTenant(tenantId, ownerId) {
  const { data: tenant, error } = await supabaseAdmin
    .from('tenants')
    .select('id, room_id, properties!inner(owner_id)')
    .eq('id', tenantId)
    .single();

  const ownerIds = resolveOwnerIds(ownerId);
  if (error || !tenant || !ownerIds.includes(tenant.properties.owner_id)) {
    const err = new Error('Tenant not found');
    err.status = 404;
    throw err;
  }

  const { error: deleteError } = await supabaseAdmin.from('tenants').delete().eq('id', tenantId);
  if (deleteError) throw deleteError;

  await freeRoom(tenant.room_id);
}

export async function deleteTenantAsAdmin(tenantId) {
  const { data: tenant, error } = await supabaseAdmin
    .from('tenants')
    .select('id, room_id')
    .eq('id', tenantId)
    .single();

  if (error || !tenant) {
    const err = new Error('Tenant not found');
    err.status = 404;
    throw err;
  }

  const { error: deleteError } = await supabaseAdmin.from('tenants').delete().eq('id', tenantId);
  if (deleteError) throw deleteError;

  await freeRoom(tenant.room_id);
}

export async function updateTenantMoveOut(tenantId, ownerId, newMoveOutDate) {
  const { data: tenant, error } = await supabaseAdmin
    .from('tenants')
    .select('id, room_id, move_out_date, properties!inner(owner_id)')
    .eq('id', tenantId)
    .single();

  const ownerIds = resolveOwnerIds(ownerId);
  if (error || !tenant || !ownerIds.includes(tenant.properties.owner_id)) {
    const err = new Error('Tenant not found');
    err.status = 404;
    throw err;
  }

  const { data, error: updateError } = await supabaseAdmin
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
      `Move-out date updated to ${newMoveOutDate}.`
    );
  }

  return data;
}
