import { supabaseAdmin } from '../config/supabase.js';

export async function getPendingVerifications() {
  const { data, error } = await supabaseAdmin
    .from('owner_verifications')
    .select(`
      id, permit_storage_path, status, created_at, notes,
      profiles!owner_verifications_owner_id_fkey(id, full_name, email)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function reviewVerification(verificationId, adminId, { status, notes }) {
  const { data, error } = await supabaseAdmin
    .from('owner_verifications')
    .update({
      status,
      notes: notes || null,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', verificationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAllUsers() {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role, verification_status, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateUserRole(userId, role) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
