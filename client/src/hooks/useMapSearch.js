import { useCallback, useEffect, useState } from 'react';
import { proximityService } from '../services/proximityService';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './useAuth';

/**
 * Fetches properties within 2 km via Express Proximity Algorithm.
 * Seamlessly refreshes authentication tokens if expired.
 */
export function useMapSearch({ gate, minPrice, maxPrice, propertyType }) {
  const { accessToken, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await proximityService.search({
        gate,
        minPrice,
        maxPrice,
        propertyType,
        token: accessToken,
      });
      setProperties(result.data ?? []);
    } catch (err) {
      // Auto-retry once on expired token by proactively refreshing session
      if (/invalid or expired token|session expired/i.test(err?.message)) {
        try {
          const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
          if (!refreshErr && refreshData?.session?.access_token) {
            const retryResult = await proximityService.search({
              gate,
              minPrice,
              maxPrice,
              propertyType,
              token: refreshData.session.access_token,
            });
            setProperties(retryResult.data ?? []);
            return;
          }
        } catch {
          // Fall through to display error
        }
      }
      setError(err.message);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [gate, minPrice, maxPrice, propertyType, accessToken, authLoading]);

  useEffect(() => {
    search();
  }, [search]);

  return { properties, loading, error, refetch: search };
}
