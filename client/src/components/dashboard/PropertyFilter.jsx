import { useOwnerProperty } from '../../context/OwnerPropertyContext';

/** Owner dashboard filter — view one property or all */
export function PropertyFilter() {
  const { properties, selectedPropertyId, setSelectedPropertyId, loading } = useOwnerProperty();

  if (loading || properties.length === 0) return null;

  if (properties.length === 1) {
    return (
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
        Viewing: <span className="font-medium text-gray-900">{properties[0].name}</span>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
      <label htmlFor="property-filter" className="mb-1 block text-xs font-medium text-gray-600">
        Filter by property
      </label>
      <select
        id="property-filter"
        value={selectedPropertyId}
        onChange={(e) => setSelectedPropertyId(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">All my properties</option>
        {properties.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </div>
  );
}
