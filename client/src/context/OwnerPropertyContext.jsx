import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { propertyService } from '../services/propertyService';

const OwnerPropertyContext = createContext(null);

export function OwnerPropertyProvider({ children }) {
  const { accessToken } = useAuth();
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [loading, setLoading] = useState(true);

  const loadProperties = useCallback(
    async (isSilent = false) => {
      if (!accessToken) return;
      if (!isSilent) setLoading(true);
      try {
        const res = await propertyService.getMyProperties(accessToken);
        const list = res.data || [];
        setProperties((prev) => (JSON.stringify(prev) === JSON.stringify(list) ? prev : list));
      } catch {
        // Ignore silent refresh errors
      } finally {
        if (!isSilent) setLoading(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    loadProperties(false);
  }, [loadProperties]);

  useRealtimeSync(() => loadProperties(true), {
    enabled: Boolean(accessToken),
  });

  const value = useMemo(
    () => ({
      properties,
      loading,
      selectedPropertyId,
      setSelectedPropertyId,
      /** null = all properties; string = filter to one property */
      filterPropertyId: selectedPropertyId || null,
      selectedProperty: properties.find((p) => p.id === selectedPropertyId) || null,
      refreshProperties: () => loadProperties(true),
    }),
    [properties, loading, selectedPropertyId, loadProperties]
  );

  return (
    <OwnerPropertyContext.Provider value={value}>{children}</OwnerPropertyContext.Provider>
  );
}

export function useOwnerProperty() {
  const ctx = useContext(OwnerPropertyContext);
  if (!ctx) throw new Error('useOwnerProperty must be used within OwnerPropertyProvider');
  return ctx;
}
