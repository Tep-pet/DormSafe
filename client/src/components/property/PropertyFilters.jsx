import { CAMPUS_GATES } from '../../constants/campusGates';
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS } from '../../constants/propertyTypes';

/**
 * Student search filters — budget range + gate proximity (proposal §3.3 IPO inputs).
 */
export function PropertyFilters({ filters, onChange }) {
  function update(field, value) {
    onChange({ ...filters, [field]: value });
  }

  return (
    <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label htmlFor="gate" className="mb-1 block text-xs font-medium text-gray-600">
          Campus Gate
        </label>
        <select
          id="gate"
          value={filters.gate}
          onChange={(e) => update('gate', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {Object.values(CAMPUS_GATES).map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="minPrice" className="mb-1 block text-xs font-medium text-gray-600">
          Min Price (₱/mo)
        </label>
        <input
          id="minPrice"
          type="number"
          min="0"
          placeholder="e.g. 2000"
          value={filters.minPrice}
          onChange={(e) => update('minPrice', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="maxPrice" className="mb-1 block text-xs font-medium text-gray-600">
          Max Price (₱/mo)
        </label>
        <input
          id="maxPrice"
          type="number"
          min="0"
          placeholder="e.g. 8000"
          value={filters.maxPrice}
          onChange={(e) => update('maxPrice', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="propertyType" className="mb-1 block text-xs font-medium text-gray-600">
          Property Type
        </label>
        <select
          id="propertyType"
          value={filters.propertyType}
          onChange={(e) => update('propertyType', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          {Object.values(PROPERTY_TYPES).map((t) => (
            <option key={t} value={t}>
              {PROPERTY_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
