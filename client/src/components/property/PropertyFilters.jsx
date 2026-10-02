import { Select, SelectItem, Input } from '@heroui/react';
import { CAMPUS_GATES } from '../../constants/campusGates';
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS } from '../../constants/propertyTypes';

/**
 * Student search filters — budget range + gate proximity.
 */
export function PropertyFilters({ filters, onChange }) {
  function update(field, value) {
    onChange({ ...filters, [field]: value });
  }

  const gateOptions = Object.values(CAMPUS_GATES);
  const propertyTypeOptions = Object.values(PROPERTY_TYPES);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
        <div>
          <Select
            label="Campus Gate"
            selectedKeys={filters.gate ? [filters.gate] : []}
            onChange={(e) => update('gate', e.target.value)}
            variant="bordered"
            radius="lg"
            size="sm"
            classNames={{
              label: 'text-xs font-bold text-gray-700',
              trigger: 'border-gray-300 hover:border-gray-400 bg-white shadow-2xs',
            }}
          >
            {gateOptions.map((g) => (
              <SelectItem key={g.id} textValue={g.label}>
                {g.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        <div>
          <Input
            label="Min Price (₱/mo)"
            type="number"
            min="0"
            placeholder="e.g. 2500"
            value={filters.minPrice || ''}
            onChange={(e) => update('minPrice', e.target.value)}
            variant="bordered"
            radius="lg"
            size="sm"
            classNames={{
              label: 'text-xs font-bold text-gray-700',
              inputWrapper: 'border-gray-300 hover:border-gray-400 bg-white shadow-2xs',
            }}
          />
        </div>

        <div>
          <Input
            label="Max Price (₱/mo)"
            type="number"
            min="0"
            placeholder="e.g. 8000"
            value={filters.maxPrice || ''}
            onChange={(e) => update('maxPrice', e.target.value)}
            variant="bordered"
            radius="lg"
            size="sm"
            classNames={{
              label: 'text-xs font-bold text-gray-700',
              inputWrapper: 'border-gray-300 hover:border-gray-400 bg-white shadow-2xs',
            }}
          />
        </div>

        <div>
          <Select
            label="Property Type"
            placeholder="All Types"
            selectedKeys={filters.propertyType ? [filters.propertyType] : []}
            onChange={(e) => update('propertyType', e.target.value)}
            variant="bordered"
            radius="lg"
            size="sm"
            classNames={{
              label: 'text-xs font-bold text-gray-700',
              trigger: 'border-gray-300 hover:border-gray-400 bg-white shadow-2xs',
            }}
          >
            <SelectItem key="" textValue="All types">
              All types
            </SelectItem>
            {propertyTypeOptions.map((t) => (
              <SelectItem key={t} textValue={PROPERTY_TYPE_LABELS[t]}>
                {PROPERTY_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
