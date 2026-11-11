import { supabase } from './supabaseClient';

/**
 * DormSafe Realtime Event Bus
 * Synchronizes application state automatically across windows, tabs, and devices.
 * 
 * Features:
 * 1. Supabase Realtime (PostgreSQL WAL over WebSockets) for remote device/user updates.
 * 2. Cross-tab BroadcastChannel for instantaneous zero-latency local tab synchronization.
 * 3. In-memory EventEmitter for active components within the current window.
 */

const BROADCAST_CHANNEL_NAME = 'dormsafe-realtime-bus';

class RealtimeBus {
  constructor() {
    this.listeners = new Map();
    this.activeChannels = new Map();
    this.bc = null;

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.bc.onmessage = (event) => {
          const { table, payload } = event.data || {};
          if (table) {
            console.log(`[RealtimeBus] 🔄 Received cross-tab broadcast for "${table}"`, payload);
            this.notifyLocal(table, payload);
          }
        };
      } catch (err) {
        console.warn('[RealtimeBus] BroadcastChannel not supported or restricted:', err);
      }
    }
  }

  /**
   * Set authentication token on the Supabase Realtime connection
   * to ensure RLS-filtered channels receive events properly.
   */
  async setAuthToken(token) {
    if (!token || !supabase?.realtime) return;
    try {
      if (typeof supabase.realtime.setAuth === 'function') {
        await supabase.realtime.setAuth(token);
        console.log('[RealtimeBus] 🔑 Realtime auth token updated successfully');
      }
    } catch (err) {
      console.warn('[RealtimeBus] Could not set realtime auth token:', err);
    }
  }

  /**
   * Subscribe to database changes for a specific table or event name.
   * Automatically initializes the Supabase Realtime WebSocket channel if not yet opened.
   * 
   * @param {string} table - Table name (e.g. 'notifications', 'rooms', 'properties', 'tenants')
   * @param {Function} callback - Callback function invoked on change
   * @returns {Function} Unsubscribe cleanup function
   */
  subscribe(table, callback) {
    if (!table || typeof callback !== 'function') return () => {};

    if (!this.listeners.has(table)) {
      this.listeners.set(table, new Set());
    }
    this.listeners.get(table).add(callback);

    // Initialize Supabase WebSocket channel for this table if not already active
    this.ensureSupabaseChannel(table);

    return () => {
      const set = this.listeners.get(table);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(table);
        }
      }
    };
  }

  /**
   * Ensure a Supabase Realtime channel is active for the table
   */
  ensureSupabaseChannel(table) {
    // Only connect Supabase channel for known database tables
    const dbTables = [
      'notifications',
      'rooms',
      'properties',
      'saved_listings',
      'room_reservations',
      'tenants',
      'payments',
      'account_verifications',
      'property_reviews',
      'maintenance_requests',
    ];

    if (!dbTables.includes(table) || this.activeChannels.has(table)) {
      return;
    }

    try {
      const channelName = `db-changes-${table}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload) => {
            console.log(`[RealtimeBus] ⚡ Received WebSocket event for "${table}":`, payload);
            // Received WebSocket event from Supabase! Emit locally and to other tabs
            this.emit(table, payload, true);
          }
        )
        .subscribe((status, err) => {
          console.log(`[RealtimeBus] 📡 Channel for "${table}" status: ${status}`, err || '');
          if (status === 'CHANNEL_ERROR') {
            console.warn(`[RealtimeBus] WebSocket channel error for "${table}":`, err);
          }
        });

      this.activeChannels.set(table, channel);
    } catch (err) {
      console.warn(`[RealtimeBus] Failed to initialize channel for "${table}":`, err);
    }
  }

  /**
   * Emit an update event on a table.
   * Invokes all local component listeners and broadcasts to other tabs.
   * 
   * @param {string} table - Table or event name
   * @param {*} [payload] - Optional payload/change data
   * @param {boolean} [shouldBroadcast=true] - Whether to send across BroadcastChannel
   */
  emit(table, payload = {}, shouldBroadcast = true) {
    console.log(`[RealtimeBus] 📢 Emitting update for table "${table}" (broadcast: ${shouldBroadcast})`);
    this.notifyLocal(table, payload);

    if (shouldBroadcast && this.bc) {
      try {
        this.bc.postMessage({ table, payload, timestamp: Date.now() });
      } catch (err) {
        // Ignore BroadcastChannel transfer errors
      }
    }
  }

  /**
   * Invoke in-memory listeners in the current tab/window
   */
  notifyLocal(table, payload) {
    const tableListeners = this.listeners.get(table);
    if (tableListeners) {
      tableListeners.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[RealtimeBus] Error in listener for "${table}":`, err);
        }
      });
    }

    // Also notify wildcard listeners if any
    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach((cb) => {
        try {
          cb({ table, payload });
        } catch (err) {
          console.error('[RealtimeBus] Error in wildcard listener:', err);
        }
      });
    }
  }
}

export const realtimeBus = new RealtimeBus();
