import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardBody, CardFooter, Chip } from '@heroui/react';
import {
  Bookmark,
  MapPin,
  Trash2,
  Scale,
  ArrowLeft,
  RefreshCw,
  ImageOff,
  ShieldCheck,
  BedDouble,
  ExternalLink,
  Sparkles,
  CheckSquare,
  Square,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { WalkingTimeBadge } from '../../components/map/WalkingTimeBadge';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { studentService } from '../../services/studentService';
import { formatPrice } from '../../utils/formatPrice';
import { ROUTES } from '../../constants/routes';
import { DEFAULT_GATE, CAMPUS_GATES } from '../../constants/campusGates';
import { PROPERTY_TYPE_LABELS } from '../../constants/propertyTypes';
import { ITEMS_PER_PAGE } from '../../constants/pagination';

export function SavedListingsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [gate, setGate] = useState(DEFAULT_GATE);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await studentService.getFavorites(accessToken, gate);
        setItems(res.data || []);
      } catch (err) {
        toast.error(err.message || 'Failed to load saved listings');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, gate, toast]
  );

  useEffect(() => {
    load();
  }, [load]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        toast.info('You can compare a maximum of 3 properties side-by-side.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const removeFavorite = async (propertyId, propertyName) => {
    try {
      await studentService.toggleFavorite(propertyId, accessToken);
      toast.info(`Removed "${propertyName || 'Listing'}" from saved bookmarks.`);
      setSelected((prev) => prev.filter((x) => x !== propertyId));
      load(true);
    } catch {
      toast.error('Failed to remove bookmark.');
    }
  };

  const activeGateLabel = CAMPUS_GATES[gate]?.label || 'Ateneo';
  const gateOptions = Object.values(CAMPUS_GATES);
  const compareList = items.filter((p) => selected.includes(p.id));

  // Pagination calculation
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, currentPage]);

  const headerAction = (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        radius="full"
        onClick={() => navigate(ROUTES.STUDENT_SEARCH)}
        startContent={<ArrowLeft size={14} strokeWidth={2} />}
      >
        Back to Search
      </Button>

      <Button
        variant="ghost"
        size="sm"
        radius="full"
        onClick={() => load(true)}
        isLoading={refreshing}
        startContent={<RefreshCw size={13} strokeWidth={2} />}
      >
        Refresh
      </Button>
    </div>
  );

  return (
    <PageContainer
      title="Saved Bookmarks & Comparison"
      subtitle={`Review your bookmarked student housing and compare walking times to ${activeGateLabel} Gate`}
      headerAction={headerAction}
    >
      <div className="space-y-6">
        {/* Single-Row Compact Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3.5 border-b border-slate-200/80 pb-3.5">
          {/* Left Group: Selection counter & compare hint */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-800">
              {items.length} {items.length === 1 ? 'saved listing' : 'saved listings'}
            </span>
            <span>·</span>
            <span className="text-slate-500">
              {selected.length === 0
                ? 'Select up to 3 to compare'
                : `${selected.length} of 3 selected for comparison`}
            </span>

            {selected.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                radius="full"
                onClick={() => setSelected([])}
                className="h-7 text-[11px] text-slate-500 hover:text-slate-900 ml-1 px-2"
              >
                Clear selection
              </Button>
            )}
          </div>

          {/* Right Group: Gate Switcher Tabs */}
          <div className="w-full lg:w-auto overflow-x-auto no-scrollbar py-0.5">
            <div className="inline-flex min-w-full sm:min-w-0 items-center gap-1 p-1 h-10 rounded-2xl bg-slate-100/90 border border-slate-200/70 shrink-0">
              {gateOptions.map((g) => {
                const isActive = gate === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setGate(g.id);
                      setCurrentPage(1);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-150 whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-ateneo-blue text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <MapPin size={13} strokeWidth={isActive ? 2.5 : 2} />
                    <span>{g.label} Gate</span>
                    <span
                      className={`ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      ≤ 2km
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side-by-Side Comparison Matrix (if 2+ selected) */}
        {compareList.length >= 2 && (
          <div className="rounded-2xl border border-ateneo-blue/40 bg-linear-to-b from-blue-50/50 to-white p-4 sm:p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <div className="flex items-center gap-2">
                <Scale size={18} className="text-ateneo-blue" />
                <h3 className="text-base font-bold text-slate-900">
                  Side-by-Side Property Comparison ({compareList.length})
                </h3>
              </div>
              <Button
                size="sm"
                variant="ghost"
                radius="full"
                onClick={() => setSelected([])}
                className="text-xs text-slate-500"
              >
                Close Comparison
              </Button>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 min-w-[540px]">
                {compareList.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="relative h-28 w-full rounded-lg bg-slate-100 overflow-hidden">
                        {p.primary_image ? (
                          <img src={p.primary_image} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-300">
                            <ImageOff size={20} />
                          </div>
                        )}
                        <span className="absolute right-2 top-2 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-white">
                          {PROPERTY_TYPE_LABELS[p.type] || p.type}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{p.name}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{p.address}</p>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Monthly Rent:</span>
                          <span className="font-extrabold text-ateneo-blue">
                            {p.min_price != null ? `${formatPrice(p.min_price)}/mo` : 'On request'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Walking Time:</span>
                          <WalkingTimeBadge minutes={p.walking_minutes} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Available:</span>
                          <span className="font-semibold text-emerald-700">
                            {p.available_rooms != null ? `${p.available_rooms} rooms left` : 'Inquire'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <Link to={`/student/property/${p.id}?gate=${gate}`} className="block">
                        <Button size="sm" variant="primary" radius="full" className="w-full text-xs">
                          View Details & Avail
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <PageSkeleton variant="grid" count={3} />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-2xs text-slate-400 mb-3">
              <Bookmark size={26} strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Saved Bookmarks Yet</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              When searching for dorms, click the &quot;Save Listing&quot; bookmark icon on any property to compare them side-by-side here.
            </p>
            <div className="mt-5">
              <Link to={ROUTES.STUDENT_SEARCH}>
                <Button size="sm" variant="primary" radius="full" startContent={<Building2 size={14} />}>
                  Explore Nearby Dorms
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Card Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedItems.map((p) => {
                const isSelected = selected.includes(p.id);
                return (
                  <Card
                    key={p.id}
                    shadow="none"
                    className={`rounded-2xl border bg-white overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                      isSelected
                        ? 'border-ateneo-blue ring-2 ring-ateneo-blue/30 shadow-md'
                        : 'border-slate-200/90 shadow-2xs'
                    }`}
                  >
                    {/* Image Banner & Selection Checkbox */}
                    <div className="relative h-40 w-full bg-slate-100 overflow-hidden">
                      {p.primary_image ? (
                        <img src={p.primary_image} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <ImageOff size={22} strokeWidth={1.5} />
                        </div>
                      )}

                      {/* Select to compare checkbox toggle */}
                      <button
                        type="button"
                        onClick={() => toggleSelect(p.id)}
                        className={`absolute left-3 top-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-xs transition shadow-2xs ${
                          isSelected
                            ? 'bg-ateneo-blue text-white'
                            : 'bg-white/90 text-slate-700 hover:bg-white'
                        }`}
                      >
                        {isSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                        <span>{isSelected ? 'Selected' : 'Compare'}</span>
                      </button>

                      {/* Property Type Badge */}
                      <div className="absolute right-3 top-3 z-10">
                        <span className="rounded-full bg-slate-900/75 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-xs shadow-2xs">
                          {PROPERTY_TYPE_LABELS[p.type] || p.type}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <CardBody className="p-4 pb-2 text-left space-y-1">
                      <Link
                        to={`/student/property/${p.id}?gate=${gate}`}
                        className="font-bold text-sm sm:text-base text-slate-900 hover:text-ateneo-blue transition line-clamp-1"
                      >
                        {p.name}
                      </Link>
                      <p className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1.5">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span>{p.address}</span>
                      </p>
                    </CardBody>

                    {/* Card Footer */}
                    <CardFooter className="flex items-center justify-between p-4 pt-2 border-t border-slate-100 bg-slate-50/40">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Monthly Rent</p>
                        <span className="text-sm font-extrabold text-ateneo-blue">
                          {p.min_price != null ? `${formatPrice(p.min_price)}/mo` : 'On request'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <WalkingTimeBadge minutes={p.walking_minutes} />
                        <button
                          type="button"
                          onClick={() => removeFavorite(p.id, p.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Remove bookmark"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
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
    </PageContainer>
  );
}

