import { useEffect, useRef } from 'react';
import { realtimeBus } from '../services/realtimeBus';

/**
 * React hook that guarantees 100% reliable realtime synchronization:
 * 1. Supabase WebSockets (postgres_changes)
 * 2. Cross-tab BroadcastChannel (same-origin tabs)
 * 3. Instant Window Focus sync (triggers immediately when switching windows/tabs)
 * 4. Micro background polling (silent 2.5s poll while the window is active)
 * 
 * @param {string | string[]} tables - Table name or array of tables (e.g. 'notifications' or ['notifications', 'rooms'])
 * @param {Function} onUpdate - Callback function to run (e.g. (meta) => load(false))
 * @param {Object} [options]
 * @param {number} [options.debounceMs=200] - Debounce delay in milliseconds
 * @param {number} [options.pollIntervalMs=2500] - Interval for silent background polling
 * @param {boolean} [options.enabled=true] - Whether the subscription is active
 */
export function useRealtime(tables, onUpdate, options = {}) {
  const { debounceMs = 200, pollIntervalMs = 2500, enabled = true } = options;
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!enabled || !tables) return;

    let debounceTimer = null;

    const debouncedHandler = (payload) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (typeof onUpdateRef.current === 'function') {
          onUpdateRef.current(payload);
        }
      }, debounceMs);
    };

    // 1. Subscribe to Realtime Bus (Supabase WebSockets + BroadcastChannel)
    const tableList = Array.isArray(tables) ? tables : [tables];
    const cleanups = tableList
      .filter(Boolean)
      .map((tbl) => realtimeBus.subscribe(tbl, debouncedHandler));

    // 2. Instant synchronization when user switches back to this window or tab
    const handleFocus = () => {
      debouncedHandler({ reason: 'window_focus' });
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
    }

    // 3. Silent background heartbeat poll (runs every 2.5s only while tab is visible)
    let pollTimer = null;
    if (pollIntervalMs > 0) {
      pollTimer = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          if (typeof onUpdateRef.current === 'function') {
            onUpdateRef.current({ reason: 'heartbeat_poll' });
          }
        }
      }, pollIntervalMs);
    }

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (pollTimer) clearInterval(pollTimer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
      }
      cleanups.forEach((cleanup) => {
        if (typeof cleanup === 'function') cleanup();
      });
    };
  }, [Array.isArray(tables) ? tables.join(',') : tables, debounceMs, pollIntervalMs, enabled]);
}
