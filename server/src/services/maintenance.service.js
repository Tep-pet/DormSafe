import { supabaseAdmin } from '../config/supabase.js';
import { createNotification } from './notification.service.js';
import { resolveOwnerIds } from '../utils/ownership.js';

export async function createMaintenanceRequest(studentId, { tenant_id, description }) {
  const { data: tenant, error } = await supabaseAdmin
    .from('tenants')
    .select('id, property_id, room_id, student_id, properties!inner(owner_id, name)')
    .eq('id', tenant_id)
    .single();

  if (error || !tenant || tenant.student_id !== studentId) {
    const err = new Error('Stay not found');
    err.status = 404;
    throw err;
  }

  const { data, error: insertError } = await supabaseAdmin
    .from('maintenance_requests')
    .insert({
      tenant_id,
      property_id: tenant.property_id,
      room_id: tenant.room_id,
      student_id: studentId,
      description,
    })
    .select()
    .single();

  if (insertError) throw insertError;

  if (tenant.properties?.owner_id) {
    await createNotification(tenant.properties.owner_id, {
      type: 'maintenance_request',
      title: 'Maintenance request',
      body: `New request at ${tenant.properties.name}: ${description.slice(0, 80)}`,
      metadata: { request_id: data.id, tenant_id },
    });
  }

  return data;
}

export async function getStudentMaintenanceRequests(studentId) {
  const { data, error } = await supabaseAdmin
    .from('maintenance_requests')
    .select('*, properties(name)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getOwnerMaintenanceRequests(ownerId) {
  const ownerIds = resolveOwnerIds(ownerId);
  const { data, error } = await supabaseAdmin
    .from('maintenance_requests')
    .select(`
      *,
      properties!inner(name, owner_id),
      profiles!maintenance_requests_student_id_fkey(full_name, email)
    `)
    .in('properties.owner_id', ownerIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateMaintenanceStatus(requestId, ownerId, status) {
  const { data: req, error } = await supabaseAdmin
    .from('maintenance_requests')
    .select('id, student_id, properties!inner(owner_id)')
    .eq('id', requestId)
    .single();

  const ownerIds = resolveOwnerIds(ownerId);
  if (error || !req || !ownerIds.includes(req.properties.owner_id)) {
    const err = new Error('Request not found');
    err.status = 404;
    throw err;
  }

  const { data, error: updateError } = await supabaseAdmin
    .from('maintenance_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select()
    .single();

  if (updateError) throw updateError;
  return data;
}
