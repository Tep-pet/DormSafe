import { supabaseAdmin } from '../config/supabase.js';
import { logAudit } from './audit.service.js';

export async function createReview(studentId, { property_id, rating, comment }) {
  const { data: stay } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('student_id', studentId)
    .eq('property_id', property_id)
    .not('move_out_date', 'is', null)
    .lt('move_out_date', new Date().toISOString().slice(0, 10))
    .limit(1);

  if (!stay?.length) {
    const err = new Error('You can only review properties after a completed stay');
    err.status = 403;
    throw err;
  }

  const { data, error } = await supabaseAdmin
    .from('property_reviews')
    .insert({
      property_id,
      student_id: studentId,
      rating: Number(rating),
      comment: comment || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getApprovedReviews(propertyId) {
  const { data, error } = await supabaseAdmin
    .from('property_reviews')
    .select('id, rating, comment, created_at, profiles!property_reviews_student_id_fkey(full_name)')
    .eq('property_id', propertyId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getPendingReviews() {
  const { data, error } = await supabaseAdmin
    .from('property_reviews')
    .select(`
      id, rating, comment, created_at,
      properties(id, name),
      profiles!property_reviews_student_id_fkey(full_name, email)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function moderateReview(reviewId, adminId, status) {
  const { data, error } = await supabaseAdmin
    .from('property_reviews')
    .update({ status, reviewed_by: adminId })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw error;
  await logAudit(adminId, `review_${status}`, 'property_review', reviewId, { property_id: data.property_id });
  return data;
}
