import { supabaseAdmin } from '../config/supabase.js';
import { processExpiredTenants } from '../utils/tenantExpiry.js';

export async function getSystemHealth() {
  await processExpiredTenants();

  const today = new Date().toISOString().slice(0, 10);

  const [
    pendingListings,
    pendingAccounts,
    pendingReviews,
    pendingReports,
    staleTenants,
    openMaintenance,
  ] = await Promise.all([
    supabaseAdmin.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('account_verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('property_reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('listing_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin
      .from('tenants')
      .select('id', { count: 'exact', head: true })
      .not('room_id', 'is', null)
      .not('move_out_date', 'is', null)
      .lt('move_out_date', today),
    supabaseAdmin.from('maintenance_requests').select('id', { count: 'exact', head: true }).eq('status', 'open'),
  ]);

  return {
    pending_listings: pendingListings.count || 0,
    pending_accounts: pendingAccounts.count || 0,
    pending_reviews: pendingReviews.count || 0,
    pending_reports: pendingReports.count || 0,
    expired_stays_not_cleared: staleTenants.count || 0,
    open_maintenance: openMaintenance.count || 0,
  };
}
