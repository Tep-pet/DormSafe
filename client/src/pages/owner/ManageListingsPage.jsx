import { useEffect, useState, useCallback } from 'react';
import { OwnerLayout } from '../../components/layout/OwnerLayout';
import { OwnerListingCard } from '../../components/dashboard/OwnerListingCard';
import { Loader } from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';
import { useOwnerProperty } from '../../context/OwnerPropertyContext';
import { propertyService } from '../../services/propertyService';

export function ManageListingsPage() {
  const { accessToken } = useAuth();
  const { filterPropertyId } = useOwnerProperty();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await propertyService.getMyProperties(accessToken);
      let list = res.data || [];
      if (filterPropertyId) {
        list = list.filter((p) => p.id === filterPropertyId);
      }
      setProperties(list);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filterPropertyId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggle(roomId, isAvailable) {
    await propertyService.updateAvailability(roomId, isAvailable, accessToken);
    load();
  }

  return (
    <OwnerLayout title="My Listings" subtitle="Manage rooms and update availability in real time">
      {loading ? (
        <Loader message="Loading listings…" />
      ) : properties.length === 0 ? (
        <p className="text-sm text-gray-600">No properties yet. Add one to get started.</p>
      ) : (
        <div className="grid gap-4">
          {properties.map((p) => (
            <OwnerListingCard key={p.id} property={p} onToggleAvailability={handleToggle} />
          ))}
        </div>
      )}
    </OwnerLayout>
  );
}
