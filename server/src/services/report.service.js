import { supabaseAdmin } from '../config/supabase.js';
import { notifyAdmins } from './notification.service.js';

export async function reportListing(reporterId, { property_id, reason }) {
  const { data, error } = await supabaseAdmin
    .from('listing_reports')
    .insert({ property_id, reporter_id: reporterId, reason })
    .select()
    .single();

  if (error) throw error;

  const { data: property } = await supabaseAdmin
    .from('properties')
    .select('name')
    .eq('id', property_id)
    .single();

  await notifyAdmins({
    type: 'listing_submitted',
    title: 'Listing reported',
    body: `${property?.name || 'A listing'} was reported: ${reason.slice(0, 100)}`,
    metadata: { report_id: data.id, property_id },
  });

  return data;
}

export async function getPendingReports() {
  const { data, error } = await supabaseAdmin
    .from('listing_reports')
    .select(`
      id, reason, status, created_at,
      properties(id, name),
      profiles!listing_reports_reporter_id_fkey(full_name)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function dismissReport(reportId, adminId) {
  const { data, error } = await supabaseAdmin
    .from('listing_reports')
    .update({ status: 'reviewed' })
    .eq('id', reportId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
