import React from 'react';
import { Select, SelectItem } from '@heroui/react';
import { Building2 } from 'lucide-react';
import { useOwnerProperty } from '../../context/OwnerPropertyContext';

/**
 * Owner portal property filter — switches context between all properties or a specific property.
 * Adheres to Golden DormSafe Design Standards.
 */
export function PropertyFilter() {
  const { properties = [], selectedPropertyId, setSelectedPropertyId, loading } = useOwnerProperty();

  if (loading || properties.length <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 sm:px-4 sm:py-3 shadow-xs backdrop-blur-xs">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Building2 size={16} strokeWidth={2} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-800">Filter Property Context</h4>
          <p className="text-[11px] text-slate-400">View aggregate metrics or isolate an individual listing</p>
        </div>
      </div>
      <div className="w-full sm:w-64">
        <Select
          aria-label="Filter by Property"
          placeholder="All properties"
          selectedKeys={selectedPropertyId ? [selectedPropertyId] : ['all']}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedPropertyId(val === 'all' ? '' : val);
          }}
          variant="bordered"
          size="sm"
          classNames={{
            trigger: 'border-slate-200/90 hover:border-slate-300 bg-white rounded-xl h-10 text-xs',
            value: 'text-xs font-medium text-slate-800',
          }}
        >
          <SelectItem key="all" textValue="All my properties">
            All my properties ({properties.length})
          </SelectItem>
          {properties.map((p) => (
            <SelectItem key={p.id} textValue={p.name}>
              {p.name}
            </SelectItem>
          ))}
        </Select>
      </div>
    </div>
  );
}
