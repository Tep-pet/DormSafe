import { supabaseAdmin } from '../config/supabase.js';

export async function createNotification(userId, { type, title, body, metadata = {} }) {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .insert({ user_id: userId, type, title, body, metadata })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function notifyAdmins({ type, title, body, metadata = {} }) {
  const { data: admins, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('role', 'admin');

  if (error) throw error;

  const rows = (admins || []).map((a) => ({
    user_id: a.id,
    type,
    title,
    body,
    metadata,
  }));

  if (!rows.length) return [];

  const { data, error: insertError } = await supabaseAdmin
    .from('notifications')
    .insert(rows)
    .select();

  if (insertError) throw insertError;
  return data || [];
}

export async function getUserNotifications(userId, { unreadOnly = false } = {}) {
  let query = supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (unreadOnly) {
    query = query.is('read_at', null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getUnreadCount(userId) {
  const { count, error } = await supabaseAdmin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) throw error;
  return count || 0;
}

export async function markNotificationRead(notificationId, userId) {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) throw error;
}
