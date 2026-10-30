import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Select, SelectItem } from '@heroui/react';
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  X,
} from 'lucide-react';
import { OwnerLayout } from '../../components/layout/OwnerLayout';
import { OwnerListingCard } from '../../components/dashboard/OwnerListingCard';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { Button } from '../../components/common/Button';
import { Pagination } from '../../components/common/Pagination';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useOwnerProperty } from '../../context/OwnerPropertyContext';
import { propertyService } from '../../services/propertyService';
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS } from '../../constants/propertyTypes';
import { ROUTES } from '../../constants/routes';
import { ITEMS_PER_PAGE } from '../../constants/pagination';

export function ManageListingsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const { filterPropertyId } = useOwnerProperty();
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const itemsPerPage = ITEMS_PER_PAGE;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await propertyService.getMyProperties(accessToken);
      let list = res.data || [];
      if (filterPropertyId) {
        list = list.filter((p) => p.id === filterPropertyId);
      }
      setProperties(list);
    } catch (err) {
      toast.error(err.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  }, [accessToken, filterPropertyId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggle(roomId, isAvailable) {
    try {
      await propertyService.updateAvailability(roomId, isAvailable, accessToken);
      toast.success(`Room marked as ${isAvailable ? 'available (vacant)' : 'occupied'}`);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to update room availability');
    }
  }

  // Filter & Search Logic
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      // Search
      const matchesSearch =
        !searchTerm.trim() ||
        (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.address && p.address.toLowerCase().includes(searchTerm.toLowerCase()));

      // Type Filter
      const matchesType =
        typeFilter === 'all' || p.type === typeFilter;

      // Status Filter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'approved' && p.status === 'approved') ||
        (statusFilter === 'pending' && p.status !== 'approved');

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [properties, searchTerm, typeFilter, statusFilter]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, typeFilter, statusFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / itemsPerPage));
  const paginatedProperties = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredProperties.slice(start, start + itemsPerPage);
  }, [filteredProperties, page, itemsPerPage]);

  const statusCounts = useMemo(() => {
    return {
      all: properties.length,
      approved: properties.filter((p) => p.status === 'approved').length,
      pending: properties.filter((p) => p.status !== 'approved').length,
    };
  }, [properties]);

  const hasActiveFilters = searchTerm || typeFilter !== 'all' || statusFilter !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  // Header Actions
  const headerAction = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        radius="full"
        variant="primary"
        onClick={() => navigate(ROUTES.OWNER_ADD_PROPERTY)}
        startContent={<Plus size={14} strokeWidth={2.5} />}
      >
        Add Property
      </Button>

      <Button
        size="sm"
        radius="full"
        variant="ghost"
        isLoading={loading}
        onClick={() => load()}
        startContent={!loading && <RefreshCw size={14} />}
      >
        Refresh
      </Button>
    </div>
  );

  return (
    <OwnerLayout
      title="My Listings & Units"
      subtitle="Manage property accommodations, room inventory, and toggle live availability"
      headerAction={headerAction}
    >
      {/* ==================================================================== */}
      {/* SINGLE-ROW COMPACT TOOLBAR (GOLDEN STANDARD) */}
      {/* ==================================================================== */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3.5 border-b border-slate-200/80 pb-3.5">
        {/* Left: Search + Type Selector + Reset */}
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          {/* Search Input */}
          <div className="relative w-full sm:w-56">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search property or address…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200/90 bg-white/95 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 shadow-2xs transition-all focus:border-ateneo-blue focus:outline-none focus:ring-2 focus:ring-ateneo-blue/20"
            />
          </div>

          {/* Property Type Dropdown */}
          <div className="w-full sm:w-44">
            <Select
              aria-label="Filter by Housing Type"
              placeholder="All Types"
              selectedKeys={[typeFilter]}
              onChange={(e) => setTypeFilter(e.target.value || 'all')}
              variant="bordered"
              size="sm"
              classNames={{
                trigger: 'border-slate-200/90 hover:border-slate-300 bg-white rounded-xl h-10 text-xs',
                value: 'text-xs font-medium text-slate-800',
              }}
            >
              <SelectItem key="all" textValue="All Property Types">
                All Property Types
              </SelectItem>
              {Object.values(PROPERTY_TYPES).map((t) => (
                <SelectItem key={t} textValue={PROPERTY_TYPE_LABELS[t] || t}>
                  {PROPERTY_TYPE_LABELS[t] || t}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Reset Filters Pill */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/70 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition cursor-pointer"
            >
              <X size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Right Edge: Status Filter Capsule */}
        <div className="w-full lg:w-auto overflow-x-auto no-scrollbar py-0.5">
          <div className="inline-flex min-w-full sm:min-w-0 items-center gap-1 p-1 h-10 rounded-2xl bg-slate-100/90 border border-slate-200/70 shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-xl px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-white text-ateneo-blue shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({statusCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('approved')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === 'approved'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck size={13} className="text-emerald-600" />
              <span>Approved ({statusCounts.approved})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === 'pending'
                  ? 'bg-white text-amber-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock size={13} className="text-amber-600" />
              <span>In Review ({statusCounts.pending})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* LISTINGS CONTENT & PAGINATION */}
      {/* ==================================================================== */}
      {loading ? (
        <PageSkeleton variant="grid" count={4} />
      ) : filteredProperties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/95 p-12 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-ateneo-blue">
            <Building2 size={24} strokeWidth={1.75} />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">
            {hasActiveFilters ? 'No matching properties found' : 'No properties listed yet'}
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
            {hasActiveFilters
              ? 'Try adjusting your search keywords or switching property status filters.'
              : 'Add your first boarding house, dorm, or apartment to start accepting student bookings.'}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            {hasActiveFilters ? (
              <Button size="sm" radius="full" variant="secondary" onClick={resetFilters}>
                Clear All Filters
              </Button>
            ) : (
              <Link to={ROUTES.OWNER_ADD_PROPERTY}>
                <Button size="sm" radius="full" variant="primary" startContent={<Plus size={14} />}>
                  Add Your First Property
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4">
            {paginatedProperties.map((p) => (
              <OwnerListingCard key={p.id} property={p} onToggleAvailability={handleToggle} />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={filteredProperties.length}
            itemLabel="matching listings"
            onPageChange={setPage}
            className="mt-8"
          />
        </div>
      )}
    </OwnerLayout>
  );
}
