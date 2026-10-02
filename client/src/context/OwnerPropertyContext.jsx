import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { propertyService } from '../services/propertyService';

const OwnerPropertyContext = createContext(null);

export function OwnerPropertyProvider({ children }) {
  const { accessToken } = useAuth();
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    propertyService
      .getMyProperties(accessToken)
      .then((res) => setProperties(res.data || []))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const value = useMemo(
    () => ({
      properties,
      loading,
      selectedPropertyId,
      setSelectedPropertyId,
      /** null = all properties; string = filter to one property */
      filterPropertyId: selectedPropertyId || null,
      selectedProperty: properties.find((p) => p.id === selectedPropertyId) || null,
    }),
    [properties, loading, selectedPropertyId]
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
