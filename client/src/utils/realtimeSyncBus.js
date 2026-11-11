import { supabase } from '../services/supabaseClient';

const EVENT_NAME = 'dormsafe:data-sync';
const CHANNEL_NAME = 'dormsafe-live-sync';
const STORAGE_PULSE_KEY = 'dormsafe-sync-pulse';

let broadcastChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch {
    broadcastChannel = null;
  }
}

let supabaseRealtimeChannel = null;
let supabaseSubscribed = false;
const listeners = new Set();

function notifyListeners(payload) {
  listeners.forEach((fn) => {
    try {
      fn(payload);
    } catch {
      // Ignore listener errors
    }
  });
}

function ensureSupabaseChannel() {
  if (supabaseRealtimeChannel || typeof window === 'undefined' || !supabase?.channel) return;
  try {
    supabaseRealtimeChannel = supabase
      .channel('dormsafe-global-sync')
      .on('broadcast', { event: 'sync' }, ({ payload }) => {
        notifyListeners(payload || { source: 'supabase-broadcast', timestamp: Date.now() });
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          notifyListeners({ source: 'postgres_changes', table: 'notifications', payload, timestamp: Date.now() });
        }
      )
      .subscribe((status) => {
        supabaseSubscribed = status === 'SUBSCRIBED';
      });
  } catch {
    // Ignore if realtime websocket is unavailable
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener(EVENT_NAME, (e) => {
    notifyListeners(e.detail || { source: 'window', timestamp: Date.now() });
  });

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', (e) => {
      notifyListeners(e.data || { source: 'broadcast-channel', timestamp: Date.now() });
    });
  }

  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_PULSE_KEY && e.newValue) {
      try {
        notifyListeners(JSON.parse(e.newValue));
      } catch {
        notifyListeners({ source: 'storage', timestamp: Date.now() });
      }
    }
  });
}

/**
 * Emit a sync event across the current tab, other browser tabs, and Supabase Realtime.
 */
export function emitRealtimeSync(meta = {}) {
  if (typeof window === 'undefined') return;
  const payload = { ...meta, timestamp: Date.now() };

  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }));
  } catch {}

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(payload);
    } catch {}
  }

  try {
    if (window.localStorage) {
      window.localStorage.setItem(STORAGE_PULSE_KEY, JSON.stringify(payload));
    }
  } catch {}

  ensureSupabaseChannel();
  if (supabaseRealtimeChannel && supabaseSubscribed) {
    try {
      supabaseRealtimeChannel.send({
        type: 'broadcast',
        event: 'sync',
        payload,
      });
    } catch {}
  }
}

/**
 * Subscribe to real-time sync signals. Returns an unsubscribe function.
 */
export function subscribeRealtimeSync(callback) {
  ensureSupabaseChannel();
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

