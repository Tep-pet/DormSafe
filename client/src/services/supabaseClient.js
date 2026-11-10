import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'DormSafe: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy client/.env.example to client/.env'
  );
}

/**
 * Generates a unique storage key per browser tab/window so multiple tabs or windows
 * can stay logged into different accounts (Student, Owner, Admin) simultaneously
 * without overwriting or syncing sessions on refresh.
 */
function getPerTabStorageKey() {
  if (typeof window === 'undefined') return 'dormsafe-auth';
  try {
    let tabId =
      window.name && window.name.startsWith('dormsafe_tab_') ? window.name : null;
    if (!tabId) {
      tabId = `dormsafe_tab_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      window.name = tabId;
    }
    return `sb-${tabId}-auth-token`;
  } catch {
    return 'dormsafe-auth';
  }
}

/** Supabase client — anon key only (safe for browser), isolated per tab via sessionStorage */
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    storageKey: getPerTabStorageKey(),
    persistSession: true,
    autoRefreshToken: true,
  },
});
