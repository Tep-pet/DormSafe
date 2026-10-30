import { supabaseAdmin } from '../config/supabase.js';

export async function logAudit(adminId, action, entityType, entityId, details = {}) {
  const { data, error } = await supabaseAdmin
    .from('audit_logs')
    .insert({
      admin_id: adminId,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      details,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAuditLogs({ page = 1, limit = 20 } = {}) {
  const from = (Math.max(1, page) - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabaseAdmin
    .from('audit_logs')
    .select('*, profiles!audit_logs_admin_id_fkey(full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { items: data || [], total: count || 0, page, totalPages: Math.ceil((count || 0) / limit) || 1 };
}
