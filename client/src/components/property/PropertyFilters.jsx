import React from 'react';
import { MapPin, Building, RotateCcw, PhilippinePeso } from 'lucide-react';
import { Button } from '../common/Button';
import { Select } from '../common/Input';
import { CAMPUS_GATES, DEFAULT_GATE } from '../../constants/campusGates';
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS } from '../../constants/propertyTypes';

/**
 * Student Search Filters — Single-Row Compact Filter & Search Toolbar Standard.
 * Gate Proximity Tabs on the right edge + compact budget and property type controls.
 */
export function PropertyFilters({ filters, onChange }) {
  function update(field, value) {
    onChange({ ...filters, [field]: value });
  }

  const gateOptions = Object.values(CAMPUS_GATES);
  const propertyTypeOptions = Object.values(PROPERTY_TYPES);

  const hasActiveFilters =
    filters.gate !== DEFAULT_GATE ||
    Boolean(filters.minPrice) ||
    Boolean(filters.maxPrice) ||
    Boolean(filters.propertyType);

  const handleReset = () => {
    onChange({
      gate: DEFAULT_GATE,
      minPrice: '',
      maxPrice: '',
      propertyType: '',
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3.5 border-b border-slate-200/80 pb-3.5">
      {/* Left Group: Inline Filter Inputs */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
        {/* 1. Property Type Selector */}
        <div className="w-full sm:w-44">
          <Select
            value={filters.propertyType || ''}
            onChange={(e) => update('propertyType', e.target.value)}
          >
            <option value="">All property types</option>
            {propertyTypeOptions.map((t) => (
              <option key={t} value={t}>
                {PROPERTY_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>

        {/* 2 & 3. Price Range Inputs */}
        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
          <div className="relative w-full sm:w-32">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold pointer-events-none">
              ₱
            </span>
            <input
              type="number"
              min="0"
              step="500"
              value={filters.minPrice || ''}
              onChange={(e) => update('minPrice', e.target.value)}
              placeholder="Min rent"
              className="h-10 w-full rounded-xl border border-slate-200/90 bg-white pl-7 pr-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-ateneo-blue focus:outline-hidden shadow-2xs"
            />
          </div>

          <div className="relative w-full sm:w-32">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold pointer-events-none">
              ₱
            </span>
            <input
              type="number"
              min="0"
              step="500"
              value={filters.maxPrice || ''}
              onChange={(e) => update('maxPrice', e.target.value)}
              placeholder="Max rent"
              className="h-10 w-full rounded-xl border border-slate-200/90 bg-white pl-7 pr-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-ateneo-blue focus:outline-hidden shadow-2xs"
            />
          </div>
        </div>

        {/* Reset Filters CTA if active */}
        {hasActiveFilters && (
          <Button
            size="sm"
            radius="full"
            variant="ghost"
            onClick={handleReset}
            startContent={<RotateCcw size={13} strokeWidth={2} />}
            className="h-10 text-xs text-slate-500 hover:text-slate-900"
          >
            Reset
          </Button>
        )}
      </div>

      {/* Right Group: Campus Gate Toggle Capsule */}
      <div className="w-full lg:w-auto overflow-x-auto no-scrollbar py-0.5">
        <div className="inline-flex min-w-full sm:min-w-0 items-center gap-1 p-1 h-10 rounded-2xl bg-slate-100/90 border border-slate-200/70 shrink-0">
          {gateOptions.map((g) => {
            const isActive = filters.gate === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => update('gate', g.id)}
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
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-600'
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
  );
}

