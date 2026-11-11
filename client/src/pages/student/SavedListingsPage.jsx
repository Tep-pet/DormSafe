import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardBody, CardFooter } from '@heroui/react';
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
  CheckSquare,
  Square,
  Building2,
  Users,
  Footprints,
  Car,
  ScrollText,
  Info,
  Phone,
  Mail,
  User,
  X,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/common/Button';
import { Pagination } from '../../components/common/Pagination';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { WalkingTimeBadge } from '../../components/map/WalkingTimeBadge';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { useToast } from '../../hooks/useToast';
import { studentService } from '../../services/studentService';
import { proximityService } from '../../services/proximityService';
import { formatPrice } from '../../utils/formatPrice';
import { ROUTES } from '../../constants/routes';
import { CAMPUS_GATES } from '../../constants/campusGates';
import { PROPERTY_TYPE_LABELS } from '../../constants/propertyTypes';
import { ITEMS_PER_PAGE } from '../../constants/pagination';
import {
  getKnownWalkingMinutes,
  getKnownDrivingMinutes,
  getPreferredCampusGate,
} from '../../utils/propertyCoordinates';

export function SavedListingsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [detailedMap, setDetailedMap] = useState({});
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(
    async (isManual = false, isSilent = false) => {
      if (!isSilent) {
        if (isManual) setRefreshing(true);
        else setLoading(true);
      }

      try {
        const res = await studentService.getFavorites(accessToken);
        const list = res.data || [];
        setItems((prev) => (JSON.stringify(prev) === JSON.stringify(list) ? prev : list));
      } catch (err) {
        if (!isSilent) {
          toast.error(err.message || 'Failed to load saved listings');
        }
      } finally {
        if (!isSilent) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [accessToken, toast]
  );

  useEffect(() => {
    load(false, false);
  }, [load]);

  // Auto-refresh when listings are saved/unsaved or property/room details change
  useRealtimeSync(() => load(false, true), { enabled: Boolean(accessToken) });

  // Fetch full details (rooms, rules, description, contact) for any selected property if missing
  useEffect(() => {
    selected.forEach((propId) => {
      const baseItem = items.find((i) => i.id === propId);
      const hasFullDetails =
        baseItem &&
        Array.isArray(baseItem.rooms) &&
        baseItem.rooms.length > 0 &&
        baseItem.description != null &&
        Array.isArray(baseItem.house_rules);

      if (!hasFullDetails && !detailedMap[propId]) {
        const preferredGate = getPreferredCampusGate(baseItem);
        proximityService
          .getPropertyDetail(propId, preferredGate, accessToken)
          .then((res) => {
            if (res?.data) {
              setDetailedMap((prev) => ({ ...prev, [propId]: res.data }));
            }
          })
          .catch(() => {});
      }
    });
  }, [selected, items, detailedMap, accessToken]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) {
        toast.info('You can compare 2 properties side-by-side at a time.');
        return [prev[1], id];
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

  const compareList = useMemo(() => {
    return selected
      .map((id) => {
        const base = items.find((p) => p.id === id);
        if (!base) return null;
        const extra = detailedMap[id] || {};
        return {
          ...extra,
          ...base,
          description: base.description || extra.description || '',
          contact_name: base.contact_name || extra.contact_name || null,
          contact_phone: base.contact_phone || extra.contact_phone || null,
          contact_email: base.contact_email || extra.contact_email || null,
          rooms:
            Array.isArray(base.rooms) && base.rooms.length > 0
              ? base.rooms
              : Array.isArray(extra.rooms)
              ? extra.rooms
              : [],
          house_rules:
            Array.isArray(base.house_rules) && base.house_rules.length > 0
              ? base.house_rules
              : Array.isArray(extra.house_rules)
              ? extra.house_rules
              : [],
        };
      })
      .filter(Boolean);
  }, [selected, items, detailedMap]);

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
        onClick={() => load(true, false)}
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
      subtitle="Review your bookmarked student housing and select 2 properties to compare all prices and details side-by-side"
      headerAction={headerAction}
    >
      <div className="space-y-6">
        {/* Compact Toolbar (Gate buttons removed) */}
        <div className="flex flex-wrap items-center justify-between gap-3.5 border-b border-slate-200/80 pb-3.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-800">
              {items.length} {items.length === 1 ? 'saved listing' : 'saved listings'}
            </span>
            <span>·</span>
            <span className="text-slate-500">
              {selected.length === 0
                ? 'Click "Compare" on 2 properties below to compare side-by-side'
                : `${selected.length} of 2 selected for comparison`}
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
        </div>

        {/* Left & Right Full-Details Comparison Panel */}
        {compareList.length >= 1 && (
          <div className="rounded-2xl border border-ateneo-blue/40 bg-linear-to-b from-blue-50/50 to-white p-4 sm:p-6 shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <div className="flex items-center gap-2">
                <Scale size={18} className="text-ateneo-blue" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Side-by-Side Property Comparison ({compareList.length}/2)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comparing all room prices, capacities, walking times, amenities, and house rules
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                radius="full"
                onClick={() => setSelected([])}
                className="text-xs text-slate-500 hover:text-slate-900"
              >
                Close Comparison
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
              {compareList.map((p, idx) => {
                const preferredGate = getPreferredCampusGate(p);
                const preferredGateLabel = CAMPUS_GATES[preferredGate]?.label || 'Ateneo Gate';
                const roxasWalk = getKnownWalkingMinutes('roxas', p) ?? p.walking_minutes;
                const roxasDrive = getKnownDrivingMinutes('roxas', p) ?? 2;
                const jacintoWalk = getKnownWalkingMinutes('jacinto', p) ?? p.walking_minutes;
                const jacintoDrive = getKnownDrivingMinutes('jacinto', p) ?? 2;

                const rooms = Array.isArray(p.rooms) ? p.rooms : [];
                const roomPrices = rooms.map((r) => r.price).filter((v) => v != null);
                const minPrice = p.min_price ?? (roomPrices.length ? Math.min(...roomPrices) : null);
                const maxPrice = p.max_price ?? (roomPrices.length ? Math.max(...roomPrices) : null);
                const totalRooms = p.total_rooms ?? rooms.length;
                const availableRooms =
                  p.available_rooms ?? rooms.filter((r) => r.is_available).length;

                const rules = (Array.isArray(p.house_rules) ? p.house_rules : [])
                  .map((r) => (typeof r === 'string' ? r : r?.rule))
                  .filter(Boolean);

                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-4">
                      {/* 1. Image & Header */}
                      <div className="relative h-48 w-full rounded-xl bg-slate-100 overflow-hidden">
                        {p.primary_image ? (
                          <img
                            src={p.primary_image}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-300">
                            <ImageOff size={24} />
                          </div>
                        )}

                        <div className="absolute left-3 top-3 flex items-center gap-1.5">
                          <span className="rounded-full bg-ateneo-blue px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
                            Property #{idx + 1}
                          </span>
                          {p.is_verified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/95 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-xs">
                              <ShieldCheck size={12} />
                              Verified
                            </span>
                          )}
                        </div>

                        <div className="absolute right-3 top-3 flex items-center gap-1.5">
                          <span className="rounded-full bg-slate-900/80 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                            {PROPERTY_TYPE_LABELS[p.type] || p.type}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleSelect(p.id)}
                            className="rounded-full bg-white/90 p-1 text-slate-600 hover:bg-white hover:text-rose-600 transition shadow-xs"
                            title="Remove from comparison"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Title & Address */}
                      <div>
                        <h4 className="text-lg font-extrabold text-slate-900">{p.name}</h4>
                        <p className="mt-1 text-xs text-slate-500 flex items-start gap-1.5">
                          <MapPin size={14} className="text-ateneo-blue shrink-0 mt-0.5" />
                          <span>{p.address}</span>
                        </p>
                      </div>

                      {/* 2. Price Range & Availability Summary Box */}
                      <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200/70">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Monthly Price Range
                          </p>
                          <p className="mt-0.5 text-base font-extrabold text-ateneo-blue">
                            {minPrice != null
                              ? maxPrice != null && maxPrice > minPrice
                                ? `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}/mo`
                                : `${formatPrice(minPrice)}/mo`
                              : 'On request'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Room Availability
                          </p>
                          <p
                            className={`mt-0.5 text-sm font-bold flex items-center gap-1.5 ${
                              availableRooms > 0 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            <BedDouble size={15} />
                            {availableRooms != null
                              ? totalRooms > 0
                                ? `${availableRooms} of ${totalRooms} rooms open`
                                : `${availableRooms} rooms available`
                              : 'Inquire'}
                          </p>
                        </div>
                      </div>

                      {/* 3. All Room Types & Prices Breakdown */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <BedDouble size={13} className="text-ateneo-blue" />
                          <span>All Room Options & Prices ({rooms.length})</span>
                        </h5>
                        {rooms.length > 0 ? (
                          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 overflow-hidden bg-white">
                            {rooms.map((room) => (
                              <div
                                key={room.id || room.label}
                                className="flex items-center justify-between px-3.5 py-2.5 text-xs hover:bg-slate-50/70"
                              >
                                <div className="space-y-0.5">
                                  <p className="font-bold text-slate-800">{room.label}</p>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                    <span className="inline-flex items-center gap-1">
                                      <Users size={11} />
                                      Good for {room.capacity || 1}{' '}
                                      {(room.capacity || 1) === 1 ? 'person' : 'persons'}
                                    </span>
                                    <span>·</span>
                                    <span
                                      className={`font-semibold ${
                                        room.is_available !== false
                                          ? 'text-emerald-600'
                                          : 'text-rose-500'
                                      }`}
                                    >
                                      {room.is_available !== false ? 'Available' : 'Occupied'}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-sm font-extrabold text-ateneo-blue">
                                  {formatPrice(room.price)}/mo
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">
                            Starting at {minPrice != null ? `${formatPrice(minPrice)}/mo` : 'N/A'}
                          </p>
                        )}
                      </div>

                      {/* 4. Campus Distance & Walking / Driving Times */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Footprints size={13} className="text-ateneo-blue" />
                          <span>Campus Proximity & Travel Time</span>
                        </h5>
                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Nearest Campus Gate:</span>
                            <span className="font-bold text-slate-800">{preferredGateLabel}</span>
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                            <span className="text-slate-500">To Ateneo Roxas Gate:</span>
                            <span className="font-semibold text-slate-800 inline-flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-emerald-700">
                                <Footprints size={12} /> {roxasWalk ?? '—'} min walk
                              </span>
                              <span className="text-slate-300">|</span>
                              <span className="inline-flex items-center gap-1 text-slate-600">
                                <Car size={12} /> {roxasDrive} min drive
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                            <span className="text-slate-500">To Ateneo Jacinto Gate:</span>
                            <span className="font-semibold text-slate-800 inline-flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-emerald-700">
                                <Footprints size={12} /> {jacintoWalk ?? '—'} min walk
                              </span>
                              <span className="text-slate-300">|</span>
                              <span className="inline-flex items-center gap-1 text-slate-600">
                                <Car size={12} /> {jacintoDrive} min drive
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 5. About & Amenities */}
                      <div className="space-y-1.5">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Info size={13} className="text-ateneo-blue" />
                          <span>About & Included Amenities</span>
                        </h5>
                        <p className="text-xs text-slate-600 leading-relaxed rounded-xl border border-slate-200/80 bg-slate-50/40 p-3">
                          {p.description || 'No description provided.'}
                        </p>
                      </div>

                      {/* 6. House Rules & Policies */}
                      <div className="space-y-1.5">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <ScrollText size={13} className="text-ateneo-blue" />
                          <span>House Rules & Policies ({rules.length})</span>
                        </h5>
                        {rules.length > 0 ? (
                          <ul className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-3 space-y-1.5 text-xs text-slate-600">
                            {rules.map((rule, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-ateneo-blue shrink-0" />
                                <span>{rule}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-400 italic">
                            Standard dormitory rules apply.
                          </p>
                        )}
                      </div>

                      {/* 7. Landlord Contact Details */}
                      {(p.contact_name || p.contact_phone || p.contact_email) && (
                        <div className="space-y-1.5">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <User size={13} className="text-ateneo-blue" />
                            <span>Owner / Contact Information</span>
                          </h5>
                          <div className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-3 space-y-1 text-xs text-slate-600">
                            {p.contact_name && (
                              <p className="flex items-center gap-2 font-semibold text-slate-800">
                                <User size={12} className="text-slate-400" />
                                <span>{p.contact_name}</span>
                              </p>
                            )}
                            {p.contact_phone && (
                              <p className="flex items-center gap-2">
                                <Phone size={12} className="text-slate-400" />
                                <span>{p.contact_phone}</span>
                              </p>
                            )}
                            {p.contact_email && (
                              <p className="flex items-center gap-2">
                                <Mail size={12} className="text-slate-400" />
                                <span>{p.contact_email}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action CTA */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                      <Link
                        to={`/student/property/${p.id}?gate=${preferredGate}`}
                        state={{
                          property: {
                            ...p,
                            walking_minutes:
                              getKnownWalkingMinutes(preferredGate, p) ?? p.walking_minutes,
                          },
                        }}
                        className="flex-1"
                      >
                        <Button size="sm" variant="primary" radius="full" className="w-full text-xs">
                          View Full Listing & Request Room
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}

              {/* Empty slot if only 1 property is selected */}
              {compareList.length === 1 && (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 flex flex-col items-center justify-center text-center min-h-[320px]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 text-ateneo-blue shadow-2xs mb-3">
                    <Scale size={22} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Select a 2nd Property to Compare
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 max-w-xs leading-relaxed">
                    Click the <span className="font-semibold text-slate-700">&quot;Compare&quot;</span> button on another saved listing below to view both properties side-by-side.
                  </p>
                </div>
              )}
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
                const preferredGate = getPreferredCampusGate(p);
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
                        to={`/student/property/${p.id}?gate=${preferredGate}`}
                        state={{
                          property: {
                            ...p,
                            walking_minutes:
                              getKnownWalkingMinutes(preferredGate, p) ?? p.walking_minutes,
                          },
                        }}
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
                        <WalkingTimeBadge
                          minutes={
                            getKnownWalkingMinutes(preferredGate, p) ?? p.walking_minutes
                          }
                        />
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
