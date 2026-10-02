import { Select, SelectItem } from '@heroui/react';
import { useOwnerProperty } from '../../context/OwnerPropertyContext';

/** Owner dashboard filter — view one property or all */
export function PropertyFilter() {
  const { properties = [], selectedPropertyId, setSelectedPropertyId, loading } = useOwnerProperty();

  if (loading || properties.length === 0) return null;

  if (properties.length === 1) {
    return (
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-ateneo-blue shadow-2xs">
        <span className="font-medium">
          Managing property: <strong className="font-bold">{properties[0].name}</strong>
        </span>
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-ateneo-blue">
          1 Property Active
        </span>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
      <Select
        label="Filter by Property"
        placeholder="All properties"
        selectedKeys={selectedPropertyId ? [selectedPropertyId] : []}
        onChange={(e) => setSelectedPropertyId(e.target.value)}
        variant="bordered"
        radius="lg"
        size="sm"
        classNames={{
          label: 'text-xs font-bold text-gray-700',
          trigger: 'border-gray-300 hover:border-gray-400 bg-white',
        }}
      >
        <SelectItem key="" textValue="All my properties">
          All my properties ({properties.length})
        </SelectItem>
        {properties.map((p) => (
          <SelectItem key={p.id} textValue={p.name}>
            {p.name}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}
