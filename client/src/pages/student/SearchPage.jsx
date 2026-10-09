import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Building2,
  RefreshCw,
  Bookmark,
  AlertTriangle,
  X,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PropertyFilters } from '../../components/property/PropertyFilters';
import { PropertyCard } from '../../components/property/PropertyCard';
import { MapView } from '../../components/map/MapView';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { Button } from '../../components/common/Button';
import { Pagination } from '../../components/common/Pagination';
import { useMapSearch } from '../../hooks/useMapSearch';
import { DEFAULT_GATE, CAMPUS_GATES } from '../../constants/campusGates';
import { ROUTES } from '../../constants/routes';
import { ITEMS_PER_PAGE } from '../../constants/pagination';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState(() => ({
    gate: DEFAULT_GATE,
    minPrice: '',
    maxPrice: '',
    propertyType: '',
    q: searchParams.get('q') || '',
  }));

  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Sync state when URL query param ?q= changes
  useEffect(() => {
    const qFromUrl = searchParams.get('q') || '';
    setFilters((prev) => (prev.q === qFromUrl ? prev : { ...prev, q: qFromUrl }));
  }, [searchParams]);

  const { properties, loading, error, refetch } = useMapSearch(filters);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);

    // Keep URL in sync with search query
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (newFilters.q && newFilters.q.trim()) {
          next.set('q', newFilters.q.trim());
        } else {
          next.delete('q');
        }
        return next;
      },
      { replace: true }
    );
  };

  const handleMarkerClick = (property) => {
    setSelectedPropertyId(property.id);
    const element = document.getElementById(`property-card-${property.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Description-Based Search Filter
  // Matches against each property's "About the Property" description (case-insensitive, partial-word matching)
  const filteredProperties = useMemo(() => {
    if (!filters.q || !filters.q.trim()) return properties;
    const rawQuery = filters.q.trim().toLowerCase();
    const cleaned = rawQuery.replace(/^search\s+/i, '').trim();
    if (!cleaned) return properties;

    return properties.filter((p) => {
      const desc = (p.description || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      const targetText = `${desc} ${name}`;

      // 1. Direct partial-word / substring match on the full query
      if (targetText.includes(cleaned)) {
        return true;
      }

      // 2. Token match for multi-word queries (e.g. "wifi kitchen", "girls aircon")
      const tokens = cleaned.split(/\s+/).filter(Boolean);
      return tokens.length > 0 && tokens.every((token) => targetText.includes(token));
    });
  }, [properties, filters.q]);

  // Pagination calculation
  const totalCount = filteredProperties.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const paginatedProperties = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProperties.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProperties, currentPage]);

  const activeGateLabel = CAMPUS_GATES[filters.gate]?.label || 'Ateneo';

  const headerAction = (
    <div className="flex items-center gap-2">
      <Link to={ROUTES.STUDENT_SAVED}>
        <Button
          size="sm"
          radius="full"
          variant="secondary"
          startContent={<Bookmark size={14} strokeWidth={2} />}
        >
          Saved Listings
        </Button>
      </Link>
      <Button
        size="sm"
        radius="full"
        variant="ghost"
        onClick={refetch}
        isLoading={loading}
        startContent={<RefreshCw size={13} strokeWidth={2} />}
      >
        Refresh
      </Button>
    </div>
  );

  return (
    <PageContainer
      title="Find Housing Near Ateneo"
      subtitle={`Verified dormitories and boarding houses within 2 km of ${activeGateLabel}`}
      headerAction={headerAction}
    >
      <div className="space-y-5">
        {/* Single-Row Compact Filter Toolbar */}
        <PropertyFilters filters={filters} onChange={handleFilterChange} />

        {/* Main 2-Column Responsive Layout: Map + Listing Grid */}
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Left / Desktop Sticky Map Column (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-xs">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <MapPin size={14} className="text-ateneo-blue" />
                  <span>2 km Campus Radius ({activeGateLabel})</span>
                </div>
                <span className="text-[11px] font-medium text-slate-400">
                  {filteredProperties.length} dorms mapped
                </span>
              </div>
              <div className="h-[360px] sm:h-[420px] lg:h-[540px]">
                <MapView
                  gateId={filters.gate}
                  properties={filteredProperties}
                  onMarkerClick={handleMarkerClick}
                />
              </div>
            </div>
          </div>

          {/* Right / Listing Column (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Section Header with count */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Nearby Listings
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing walking times calculated from {activeGateLabel}
                  {filters.q && (
                    <span className="font-semibold text-ateneo-blue ml-1">
                      matching &ldquo;{filters.q}&rdquo;
                    </span>
                  )}
                </p>
              </div>
              {totalCount > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
                  {totalCount} {totalCount === 1 ? 'result' : 'results'}
                </span>
              )}
            </div>

            {/* Loading State via PageSkeleton */}
            {loading && (
              <div className="py-2">
                <PageSkeleton variant="grid" count={4} />
              </div>
            )}

            {/* Error State Banner */}
            {error && (
              <div className="rounded-2xl border border-rose-200/90 bg-rose-50/80 p-4 text-xs font-medium text-rose-700 flex items-start gap-2.5 shadow-2xs">
                <AlertTriangle size={16} className="shrink-0 text-rose-500 mt-0.5" />
                <div>
                  <p className="font-semibold">Unable to fetch nearby properties</p>
                  <p className="mt-0.5 text-rose-600">{error}</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && totalCount === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-2xs text-slate-400 mb-3">
                  <Building2 size={22} strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">
                  {filters.q ? 'No matching dorms found' : 'No approved listings found'}
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  {filters.q
                    ? `No properties found matching "${filters.q}". Try a different keyword or reset filters.`
                    : `No verified properties match your current price or property type filters within 2 km of ${activeGateLabel}.`}
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  {filters.q && (
                    <Button
                      size="sm"
                      variant="secondary"
                      radius="full"
                      onClick={() => handleFilterChange({ ...filters, q: '' })}
                      startContent={<X size={13} />}
                    >
                      Clear search
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    radius="full"
                    onClick={() =>
                      handleFilterChange({
                        gate: DEFAULT_GATE,
                        minPrice: '',
                        maxPrice: '',
                        propertyType: '',
                        q: '',
                      })
                    }
                  >
                    Reset all filters
                  </Button>
                </div>
              </div>
            )}

            {/* Listings Grid */}
            {!loading && paginatedProperties.length > 0 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {paginatedProperties.map((p) => (
                    <div key={p.id} id={`property-card-${p.id}`}>
                      <PropertyCard
                        property={p}
                        gate={filters.gate}
                        isSelected={selectedPropertyId === p.id}
                      />
                    </div>
                  ))}
                </div>

                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={totalCount}
                  itemsPerPage={ITEMS_PER_PAGE}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
