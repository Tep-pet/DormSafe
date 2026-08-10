import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

/** Service-role client — server only, bypasses RLS when needed */
export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Verify user JWT using anon-style client pattern */
export function createUserClient(accessToken) {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
