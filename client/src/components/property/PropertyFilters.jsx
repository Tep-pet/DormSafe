import React from 'react';
import { RotateCcw, Search, X } from 'lucide-react';
import { Button } from '../common/Button';
import { Select } from '../common/Input';
import { DEFAULT_GATE } from '../../constants/campusGates';
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS } from '../../constants/propertyTypes';

/**
 * Student Search Filters — Single-Row Compact Filter & Search Toolbar Standard.
 * Compact budget and property type controls.
 */
export function PropertyFilters({ filters, onChange }) {
  function update(field, value) {
    onChange({ ...filters, [field]: value });
  }

  const propertyTypeOptions = Object.values(PROPERTY_TYPES);

  const hasActiveFilters =
    Boolean(filters.minPrice) ||
    Boolean(filters.maxPrice) ||
    Boolean(filters.propertyType) ||
    Boolean(filters.q);

  const handleReset = () => {
    onChange({
      gate: DEFAULT_GATE,
      minPrice: '',
      maxPrice: '',
      propertyType: '',
      q: '',
    });
  };

  return (
    <div className="w-full border-b border-slate-200/80 pb-3 sm:pb-4 min-w-0">
      {/* Responsive Filter Container */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 w-full min-w-0">
        {/* Search Query Input */}
        <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={filters.q || ''}
            onChange={(e) => update('q', e.target.value)}
            placeholder="Search by description (wifi, aircon, kitchen)..."
            className="h-10 w-full rounded-xl border border-slate-200/90 bg-white pl-8 pr-7 text-xs text-slate-800 placeholder:text-slate-400 focus:border-ateneo-blue focus:outline-hidden shadow-2xs"
          />
          {filters.q ? (
            <button
              type="button"
              onClick={() => update('q', '')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition"
              title="Clear search"
            >
              <X size={13} />
            </button>
          ) : null}
        </div>

        {/* 1. Property Type Selector */}
        <div className="w-full sm:w-44 shrink-0">
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
        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center shrink-0">
          <div className="relative w-full sm:w-28">
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

          <div className="relative w-full sm:w-28">
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
            className="h-10 text-xs text-slate-500 hover:text-slate-900 w-full sm:w-auto shrink-0"
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
