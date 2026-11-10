import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'DormSafe: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy client/.env.example to client/.env'
  );
}

/**
 * Per-tab isolated session storage adapter.
 * - Uses a unique per-page-load `storageKey` so Supabase's internal `BroadcastChannel`
 *   never broadcasts login/logout events across other open tabs or windows (even duplicated tabs).
 * - Maps the dynamic key back to a stable `sessionStorage` key (`dormsafe-tab-auth`)
 *   so refreshing (F5) a tab preserves its own logged-in account independently.
 */
const TAB_STORAGE_PREFIX = 'dormsafe-tab-auth';
const uniqueBroadcastKey = `sb-isolated-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

if (typeof window !== 'undefined' && window.localStorage) {
  try {
    // Clear any legacy shared localStorage auth tokens from older builds
    Object.keys(window.localStorage).forEach((k) => {
      if (k.startsWith('sb-') && k.endsWith('-auth-token')) {
        window.localStorage.removeItem(k);
      }
    });
  } catch {
    // Ignore storage access errors
  }
}

function normalizeTabKey(key) {
  if (typeof key === 'string' && key.startsWith(uniqueBroadcastKey)) {
    return TAB_STORAGE_PREFIX + key.slice(uniqueBroadcastKey.length);
  }
  return key;
}

const isolatedTabStorage = {
  getItem(key) {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    try {
      return window.sessionStorage.getItem(normalizeTabKey(key));
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    try {
      window.sessionStorage.setItem(normalizeTabKey(key), value);
    } catch {
      // Ignore storage quota errors
    }
  },
  removeItem(key) {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    try {
      window.sessionStorage.removeItem(normalizeTabKey(key));
    } catch {
      // Ignore storage errors
    }
  },
};

/** Supabase client — anon key only (safe for browser), 100% isolated per tab/window */
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    storage: isolatedTabStorage,
    storageKey: uniqueBroadcastKey,
    persistSession: true,
    autoRefreshToken: true,
  },
});
