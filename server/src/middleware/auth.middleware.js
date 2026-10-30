import { supabaseAdmin } from '../config/supabase.js';
import { fail } from '../utils/apiResponse.js';

/**
 * Validates Supabase JWT from Authorization header.
 * Attaches req.user and req.profile for downstream handlers.
 */
export async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return fail(res, 'Authentication required', 401);
  }

  const token = header.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return fail(res, 'Invalid or expired token', 401);
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return fail(res, 'User profile not found', 403);
  }

  req.user = user;
  req.profile = profile;
  next();
}
