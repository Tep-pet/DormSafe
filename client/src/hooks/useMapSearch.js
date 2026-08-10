import { useCallback, useEffect, useState } from 'react';
import { proximityService } from '../services/proximityService';
import { useAuth } from './useAuth';

/**
 * Fetches properties within 2 km via Express Proximity Algorithm.
 */
export function useMapSearch({ gate, minPrice, maxPrice, propertyType }) {
  const { accessToken } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async () => {
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
      setError(err.message);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [gate, minPrice, maxPrice, propertyType, accessToken]);

  useEffect(() => {
    search();
  }, [search]);

  return { properties, loading, error, refetch: search };
}
