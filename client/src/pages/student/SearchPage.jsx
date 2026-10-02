import { useState } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PropertyFilters } from '../../components/property/PropertyFilters';
import { PropertyCard } from '../../components/property/PropertyCard';
import { MapView } from '../../components/map/MapView';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { useMapSearch } from '../../hooks/useMapSearch';
import { DEFAULT_GATE } from '../../constants/campusGates';

export function SearchPage() {
  const [filters, setFilters] = useState({
    gate: DEFAULT_GATE,
    minPrice: '',
    maxPrice: '',
    propertyType: '',
  });

  const { properties, loading, error, refetch } = useMapSearch(filters);

  return (
    <PageContainer
      title="Find Housing Near Ateneo"
      subtitle="Verified listings within 2 km of Jacinto or Roxas campus gates"
    >
      <PropertyFilters filters={filters} onChange={setFilters} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="h-[400px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
          <MapView gateId={filters.gate} properties={properties} />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">
              Nearby Dorms {properties.length > 0 && `(${properties.length})`}
            </h2>
            <button type="button" onClick={refetch} className="text-xs font-semibold text-ateneo-blue hover:underline">
              Refresh
            </button>
          </div>

          {loading && (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-gray-200 bg-white overflow-hidden p-0">
                  <div className="h-32 bg-gray-200 animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 w-3/4 bg-gray-200 rounded-md animate-pulse" />
                    <div className="h-3 w-1/2 bg-gray-100 rounded-md animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          {!loading && !error && properties.length === 0 && (
            <p className="text-sm text-gray-600">
              No approved listings found within 2 km for your filters.
            </p>
          )}
          {!loading && properties.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {properties.map((p) => (
                <PropertyCard key={p.id} property={p} gate={filters.gate} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
