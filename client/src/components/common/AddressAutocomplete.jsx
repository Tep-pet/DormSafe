import React, { useState, useEffect, useRef } from 'react';
import { Loader2, X, Check } from 'lucide-react';
import { propertyService } from '../../services/propertyService';
import { useAuth } from '../../hooks/useAuth';

// Curated Davao City / Ateneo Campus vicinities for instant suggestions
const LOCAL_CAMPUS_PRESETS = [
  {
    primary: 'E. Jacinto Street',
    secondary: 'Poblacion District, Davao City, Philippines',
    label: 'E. Jacinto Street, Poblacion District, Davao City',
    latitude: 7.0718,
    longitude: 125.6131,
  },
  {
    primary: 'C. M. Recto Avenue',
    secondary: 'Poblacion District, Davao City, Philippines',
    label: 'C. M. Recto Avenue, Poblacion District, Davao City',
    latitude: 7.0709,
    longitude: 125.6125,
  },
  {
    primary: 'Roxas Avenue',
    secondary: 'Poblacion District, Davao City, Philippines',
    label: 'Roxas Avenue, Poblacion District, Davao City',
    latitude: 7.0695,
    longitude: 125.6148,
  },
  {
    primary: 'Padre Gomez Street',
    secondary: 'Poblacion District, Davao City, Philippines',
    label: 'Padre Gomez Street, Poblacion District, Davao City',
    latitude: 7.0732,
    longitude: 125.6119,
  },
  {
    primary: 'Bonifacio Street',
    secondary: 'Poblacion District, Davao City, Philippines',
    label: 'Bonifacio Street, Poblacion District, Davao City',
    latitude: 7.0682,
    longitude: 125.6105,
  },
  {
    primary: 'General Luna Street',
    secondary: 'Poblacion District, Davao City, Philippines',
    label: 'General Luna Street, Poblacion District, Davao City',
    latitude: 7.0725,
    longitude: 125.6152,
  },
  {
    primary: 'Avida Towers Davao',
    secondary: 'C. M. Recto Avenue, Poblacion District, Davao City',
    label: 'Avida Towers Davao, C. M. Recto Avenue, Davao City',
    latitude: 7.0702,
    longitude: 125.6118,
  },
  {
    primary: 'Ivory Residences',
    secondary: 'J.P. Laurel Avenue, Bajada, Davao City',
    label: 'Ivory Residences, J.P. Laurel Avenue, Bajada, Davao City',
    latitude: 7.0862,
    longitude: 125.6142,
  },
  {
    primary: 'BRC Building',
    secondary: 'E. Jacinto Street, Poblacion District, Davao City',
    label: 'BRC Building, E. Jacinto Street, Davao City',
    latitude: 7.0729,
    longitude: 125.6133,
  },
  {
    primary: 'Building Blocks Dormitory',
    secondary: 'Roxas Avenue, Poblacion District, Davao City',
    label: 'Building Blocks Dormitory, Roxas Avenue, Davao City',
    latitude: 7.0688,
    longitude: 125.6145,
  },
  {
    primary: 'Pacific Grand Towers',
    secondary: 'E. Jacinto Street, Poblacion District, Davao City',
    label: 'Pacific Grand Towers, E. Jacinto Street, Davao City',
    latitude: 7.0741,
    longitude: 125.6127,
  },
  {
    primary: 'Camella Northpoint',
    secondary: 'J.P. Laurel Avenue, Bajada, Davao City',
    label: 'Camella Northpoint, J.P. Laurel Avenue, Bajada, Davao City',
    latitude: 7.0915,
    longitude: 125.6189,
  },
  {
    primary: 'MacArthur Highway',
    secondary: 'Matina, Davao City, Philippines',
    label: 'MacArthur Highway, Matina, Davao City',
    latitude: 7.0543,
    longitude: 125.5991,
  },
  {
    primary: 'Acacia Street',
    secondary: 'Juna Subdivision, Matina, Davao City',
    label: 'Acacia Street, Juna Subdivision, Matina, Davao City',
    latitude: 7.0521,
    longitude: 125.5975,
  },
  {
    primary: 'University Avenue',
    secondary: 'Juna Subdivision, Matina, Davao City',
    label: 'University Avenue, Juna Subdivision, Matina, Davao City',
    latitude: 7.0535,
    longitude: 125.5982,
  },
  {
    primary: 'Tulip Drive',
    secondary: 'Matina, Davao City, Philippines',
    label: 'Tulip Drive, Matina, Davao City',
    latitude: 7.0498,
    longitude: 125.5942,
  },
  {
    primary: 'Quimpo Boulevard',
    secondary: 'Ecoland, Matina, Davao City',
    label: 'Quimpo Boulevard, Ecoland, Davao City',
    latitude: 7.0565,
    longitude: 125.5912,
  },
  {
    primary: 'One Oasis Davao',
    secondary: 'Ecowest Drive, Ecoland, Davao City',
    label: 'One Oasis Davao, Ecowest Drive, Ecoland, Davao City',
    latitude: 7.0512,
    longitude: 125.5895,
  },
  {
    primary: 'Matina Enclaves',
    secondary: 'Quimpo Boulevard, Matina, Davao City',
    label: 'Matina Enclaves, Quimpo Boulevard, Matina, Davao City',
    latitude: 7.0588,
    longitude: 125.5925,
  },
  {
    primary: 'F. Torres Street',
    secondary: 'Poblacion District, Davao City, Philippines',
    label: 'F. Torres Street, Poblacion District, Davao City',
    latitude: 7.0772,
    longitude: 125.6095,
  },
  {
    primary: 'Marfori Heights',
    secondary: 'Poblacion District, Davao City, Philippines',
    label: 'Marfori Heights, Poblacion District, Davao City',
    latitude: 7.0795,
    longitude: 125.6052,
  },
  {
    primary: 'Bo. Obrero',
    secondary: 'Inigo Street, Poblacion District, Davao City',
    label: 'Bo. Obrero, Poblacion District, Davao City',
    latitude: 7.0812,
    longitude: 125.6175,
  },
];

export function AddressAutocomplete({
  id = 'address',
  label = 'Address',
  placeholder = 'Type address or street name (e.g. Jacinto, Roxas, Matina)...',
  value = '',
  onChange,
  required = false,
  error = '',
  helperText = 'Include street and landmark so students can locate it on the map.',
}) {
  const { accessToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasCoordinates, setHasCoordinates] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter local presets and fetch server suggestions as user types
  useEffect(() => {
    const query = (value || '').trim();
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // 1. Instant local matching
    const qLower = query.toLowerCase();
    const localMatches = LOCAL_CAMPUS_PRESETS.filter(
      (item) =>
        item.label.toLowerCase().includes(qLower) ||
        item.primary.toLowerCase().includes(qLower) ||
        item.secondary.toLowerCase().includes(qLower)
    ).map((item) => ({
      ...item,
      id: `local-${item.label}`,
      source: 'local',
    }));

    setSuggestions(localMatches);
    setIsOpen(localMatches.length > 0);
    setSelectedIndex(-1);

    // 2. Debounced API search for live geocoding & database properties
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await propertyService.suggestLocations(query, accessToken);
        const serverResults = res?.data || [];

        if (serverResults.length > 0) {
          const seen = new Set(localMatches.map((m) => m.label.toLowerCase()));
          const merged = [...localMatches];

          for (const s of serverResults) {
            const key = (s.label || '').toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              merged.push(s);
            }
          }
          setSuggestions(merged.slice(0, 6));
          setIsOpen(merged.length > 0);
        }
      } catch (err) {
        // Safe silent fallback: local matches already active
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [value, accessToken]);

  function handleSelectSuggestion(suggestion) {
    if (!suggestion) return;
    setIsOpen(false);
    setHasCoordinates(Boolean(suggestion.latitude && suggestion.longitude));

    if (onChange) {
      onChange(suggestion.label, {
        latitude: suggestion.latitude || null,
        longitude: suggestion.longitude || null,
        primary: suggestion.primary || '',
      });
    }
  }

  function handleKeyDown(e) {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  function handleClear() {
    setHasCoordinates(false);
    setSuggestions([]);
    setIsOpen(false);
    if (onChange) {
      onChange('', { latitude: null, longitude: null });
    }
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative w-full text-left">
      {/* Label */}
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="text-xs font-semibold text-slate-800 block">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {hasCoordinates && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <Check size={12} strokeWidth={2.5} className="text-emerald-600" />
            Coordinates mapped
          </span>
        )}
      </div>

      {/* Input Box matching the reference image */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            setHasCoordinates(false);
            if (onChange) onChange(e.target.value, { latitude: null, longitude: null });
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className={`w-full h-11 px-3.5 pr-9 text-xs text-slate-800 bg-white border rounded-xl transition-all outline-none placeholder:text-slate-400 ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
              : 'border-slate-200/90 hover:border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15'
          }`}
        />

        {/* Action icons */}
        <div className="absolute right-3 flex items-center gap-1.5">
          {loading ? (
            <Loader2 size={14} className="animate-spin text-slate-400" />
          ) : value ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
              title="Clear address"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      </div>

      {/* Helper text or error */}
      {error ? (
        <p className="text-[11px] font-medium text-rose-500 mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>
      ) : null}

      {/* Clean Autocomplete List Card matching user reference design */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-100">
          <ul className="max-h-60 overflow-y-auto" role="listbox">
            {suggestions.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <li
                  key={item.id || index}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectSuggestion(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-4 py-3 cursor-pointer text-xs text-left transition-colors flex items-center justify-between gap-2 ${
                    isSelected ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="truncate">
                    <span className="font-semibold text-slate-900">
                      {item.primary || item.label}
                    </span>
                    {item.secondary && (
                      <span className="text-slate-500 font-normal">
                        {`, ${item.secondary.replace(/^,\s*/, '')}`}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
