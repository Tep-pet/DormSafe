import { useEffect, useRef } from 'react';
import { subscribeRealtimeSync } from '../utils/realtimeSyncBus';

/**
 * Automatically invokes `onSync()` strictly when real changes occur:
 * 1. A mutation occurs in the app (same tab via CustomEvent, or other tabs via BroadcastChannel / localStorage)
 * 2. A real-time change event occurs via Supabase Realtime (e.g. notifications or broadcast)
 * 
 * Does NOT poll on continuous short timers or refresh on window clicks unless explicitly requested.
 */
export function useRealtimeSync(
  onSync,
  { intervalMs = 0, enabled = true, debounceMs = 250, revalidateOnFocus = false } = {}
) {
  const callbackRef = useRef(onSync);
  const timerRef = useRef(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    callbackRef.current = onSync;
  }, [onSync]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const trigger = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        if (inFlightRef.current) return;
        inFlightRef.current = true;
        try {
          await callbackRef.current?.();
        } catch {
          // Silent background sync never throws unhandled errors
        } finally {
          inFlightRef.current = false;
        }
      }, debounceMs);
    };

    // Subscribes strictly to real-time change events
    const unsubscribe = subscribeRealtimeSync(() => {
      trigger();
    });

    let cleanupFocus = null;
    if (revalidateOnFocus) {
      const handleVisibilityOrFocus = () => {
        if (document.visibilityState === 'visible') {
          trigger();
        }
      };
      window.addEventListener('focus', handleVisibilityOrFocus);
      document.addEventListener('visibilitychange', handleVisibilityOrFocus);
      cleanupFocus = () => {
        window.removeEventListener('focus', handleVisibilityOrFocus);
        document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      };
    }

    // Only set a polling interval if caller explicitly requests intervalMs > 0
    const pollId =
      intervalMs > 0
        ? setInterval(() => {
            if (document.visibilityState === 'visible') {
              trigger();
            }
          }, intervalMs)
        : null;

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
      if (pollId) clearInterval(pollId);
      if (cleanupFocus) cleanupFocus();
    };
  }, [enabled, intervalMs, debounceMs, revalidateOnFocus]);
}
