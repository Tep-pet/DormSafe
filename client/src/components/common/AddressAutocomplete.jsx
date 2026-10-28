import React, { useState, useEffect, useRef, useId } from 'react';
import { MapPin, Search, Loader2, X, Check } from 'lucide-react';
import { propertyService } from '../../services/propertyService';
import { useAuth } from '../../hooks/useAuth';

/**
 * Curated Davao City & Ateneo de Davao vicinity locations for fast fallback
 */
const LOCAL_DAVAO_LOCATIONS = [
  { name: 'Jacinto Street', district: 'Poblacion District', lat: 7.0712, lon: 125.6135 },
  { name: 'Roxas Avenue', district: 'Poblacion District', lat: 7.0694, lon: 125.6146 },
  { name: 'Juan Luna Street', district: 'Barangay 29-C, Poblacion', lat: 7.0725, lon: 125.6160 },
  { name: 'Padre Gomez Street', district: 'Barangay 34-D, Poblacion', lat: 7.0680, lon: 125.6125 },
  { name: 'Padre Faura Street', district: 'Poblacion District', lat: 7.0695, lon: 125.6152 },
  { name: 'A. Bonifacio Street', district: 'Barangay 34-D, Poblacion', lat: 7.0678, lon: 125.6130 },
  { name: 'C.M. Recto Avenue', district: 'Poblacion District', lat: 7.0700, lon: 125.6110 },
  { name: 'Ilustre Street', district: 'Poblacion District', lat: 7.0685, lon: 125.6080 },
  { name: 'Ponciano Reyes Street', district: 'Poblacion District', lat: 7.0730, lon: 125.6140 },
  { name: 'E. Jacinto Extension', district: 'Poblacion District', lat: 7.0674, lon: 125.6178 },
  { name: 'Bolton Street', district: 'Poblacion District', lat: 7.0665, lon: 125.6095 },
  { name: 'Pelayo Street', district: 'Poblacion District', lat: 7.0675, lon: 125.6105 },
  { name: 'Palma Gil Street', district: 'Poblacion District', lat: 7.0718, lon: 125.6120 },
  { name: 'Suazo Street', district: 'Poblacion District', lat: 7.0735, lon: 125.6165 },
  { name: 'Guerrero Street', district: 'Poblacion District', lat: 7.0740, lon: 125.6150 },
  { name: 'Santa Ana Avenue', district: 'Poblacion District', lat: 7.0760, lon: 125.6180 },
  { name: 'Duterte Street', district: 'Poblacion District', lat: 7.0690, lon: 125.6170 },
  { name: 'Pichon Street', district: 'Poblacion District', lat: 7.0650, lon: 125.6075 },
  { name: 'J.P. Laurel Avenue', district: 'Bajada, Davao City', lat: 7.0850, lon: 125.6150 },
  { name: 'McArthur Highway', district: 'Matina, Davao City', lat: 7.0550, lon: 125.5920 },
];

/**
 * Client-side fallback suggestion generator (works offline or without backend)
 */
function getLocalFallbackSuggestions(query) {
  if (!query || typeof query !== 'string') return [];
  const raw = query.trim();
  if (raw.length < 1) return [];

  const numMatch = raw.match(/^(\d+[\w-]*)\s*(.*)/);
  const houseNumber = numMatch ? numMatch[1] : '';
  const searchPart = numMatch ? numMatch[2].trim() : raw;

  const results = [];
  for (const loc of LOCAL_DAVAO_LOCATIONS) {
    const matchName = !searchPart || loc.name.toLowerCase().includes(searchPart.toLowerCase());
    const matchDistrict = !searchPart || loc.district.toLowerCase().includes(searchPart.toLowerCase());

    if (matchName || matchDistrict) {
      const primary = houseNumber ? `${houseNumber} ${loc.name}` : loc.name;
      const secondary = `${loc.district}, Davao City, 8000, Philippines`;
      results.push({
        primary,
        secondary,
        fullAddress: `${primary}, ${secondary}`,
        latitude: loc.lat,
        longitude: loc.lon,
      });
    }
  }
  return results.slice(0, 5);
}

/**
 * AddressAutocomplete
 * Renders an address text box with an interactive dropdown list of matching locations
 * as the user types, styled according to the user reference mockup.
 */
export function AddressAutocomplete({
  id = 'address',
  label = 'Complete Campus Address',
  value = '',
  onChange,
  onSelectLocation,
  placeholder = 'e.g. 123 Jacinto St, Poblacion District, Davao City',
  required = false,
  disabled = false,
  error = '',
  helperText = 'Include street and landmark so students can locate it on the map.',
  className = '',
}) {
  const { accessToken } = useAuth();
  const generatedId = useId();
  const inputId = id || generatedId;

  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with debouncing
  useEffect(() => {
    const trimmed = (value || '').trim();

    if (trimmed.length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        let results = [];

        // 1. Try server endpoint
        try {
          const res = await propertyService.getAddressSuggestions(trimmed, accessToken);
          if (Array.isArray(res?.data) && res.data.length > 0) {
            results = res.data;
          }
        } catch {
          // server call failed or unauthenticated, will use Photon/local fallback
        }

        // 2. Direct Photon API fallback if server returned empty
        if (!results.length) {
          try {
            const numMatch = trimmed.match(/^(\d+[\w-]*)\s*(.*)/);
            const houseNumber = numMatch ? numMatch[1] : '';
            const searchTarget = houseNumber && numMatch[2] ? `${numMatch[2]}, Davao City` : `${trimmed}, Davao City`;

            const params = new URLSearchParams({
              q: searchTarget,
              limit: '6',
              lat: '7.073',
              lon: '125.613',
            });

            const pRes = await fetch(`https://photon.komoot.io/api/?${params}`);
            if (pRes.ok) {
              const pData = await pRes.json();
              results = (pData.features || [])
                .map((f) => {
                  const [lng, lat] = f.geometry?.coordinates || [];
                  const p = f.properties || {};
                  const baseName = p.name || p.street || p.housenumber || 'Location';
                  const primary = houseNumber && !baseName.startsWith(houseNumber)
                    ? `${houseNumber} ${baseName}`
                    : baseName;
                  const secondaryParts = [
                    p.district || p.suburb || p.locality,
                    p.city || 'Davao City',
                    'Philippines',
                  ].filter(Boolean);
                  const secondary = secondaryParts.join(', ');
                  return {
                    primary,
                    secondary,
                    fullAddress: `${primary}, ${secondary}`,
                    latitude: lat,
                    longitude: lng,
                  };
                })
                .filter((item) => item.latitude && item.longitude);
            }
          } catch {
            // Photon query failed, continue to local fallback
          }
        }

        // 3. Fallback to curated local dataset if still empty
        if (!results.length) {
          results = getLocalFallbackSuggestions(trimmed);
        }

        setSuggestions(results);
        setIsOpen(results.length > 0);
        setHighlightedIndex(-1);
      } catch (err) {
        console.warn('[AddressAutocomplete] suggestions error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [value, accessToken]);

  function handleInputChange(e) {
    const val = e.target.value;
    if (onChange) {
      onChange(e);
    }
  }

  function handleSelectSuggestion(item) {
    if (!item) return;

    // Trigger parent onChange
    if (onChange) {
      const syntheticEvent = {
        target: { id: inputId, name: inputId, value: item.fullAddress },
      };
      onChange(syntheticEvent);
    }

    // Trigger coordinate and location callback
    if (onSelectLocation) {
      onSelectLocation({
        address: item.fullAddress,
        latitude: item.latitude,
        longitude: item.longitude,
        primary: item.primary,
        secondary: item.secondary,
      });
    }

    setIsOpen(false);
    setHighlightedIndex(-1);
  }

  function handleKeyDown(e) {
    if (!isOpen || !suggestions.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }

  function handleClear() {
    if (onChange) {
      onChange({ target: { id: inputId, name: inputId, value: '' } });
    }
    setSuggestions([]);
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Input container */}
      <div className="relative w-full">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex items-center text-slate-400">
          <MapPin size={15} className="text-slate-400" />
        </div>

        <input
          ref={inputRef}
          id={inputId}
          name={inputId}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          className={`h-10 w-full rounded-xl border bg-white pl-9 pr-14 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-2xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-ateneo-blue/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 ${
            isOpen ? 'border-ateneo-blue ring-2 ring-ateneo-blue/20' : ''
          } ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-200/90 hover:border-slate-300 focus:border-ateneo-blue'
          }`}
        />

        {/* Right side indicators: loader or clear button */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {loading && (
            <Loader2 size={14} className="animate-spin text-ateneo-blue" />
          )}

          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Clear address"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Suggestions List (Styled matching user checkout reference) */}
      {isOpen && suggestions.length > 0 && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3.5 py-1.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1">
              <Search size={11} className="text-slate-400" />
              Suggested Locations
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              Click to select
            </span>
          </div>

          <ul className="max-h-64 overflow-y-auto divide-y divide-slate-100/80 py-1">
            {suggestions.map((item, index) => {
              const isSelected = highlightedIndex === index;
              return (
                <li
                  key={`${item.fullAddress}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => handleSelectSuggestion(item)}
                  className={`group flex items-start gap-2.5 px-3.5 py-2.5 cursor-pointer text-left transition-colors ${
                    isSelected ? 'bg-blue-50/90 text-ateneo-blue' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-blue-200 bg-white text-ateneo-blue shadow-2xs'
                        : 'border-slate-200/80 bg-slate-50 text-slate-400 group-hover:border-slate-300 group-hover:bg-white group-hover:text-ateneo-blue'
                    }`}
                  >
                    <MapPin size={13} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 leading-snug truncate">
                      {item.primary}
                    </p>
                    {item.secondary && (
                      <p className="text-[11px] text-slate-500 font-normal leading-tight truncate mt-0.5">
                        {item.secondary}
                      </p>
                    )}
                  </div>

                  {isSelected && (
                    <span className="shrink-0 text-ateneo-blue mt-1">
                      <Check size={14} strokeWidth={2.5} />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="px-3.5 py-1.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Davao City & vicinity</span>
            <span>Use ↑↓ keys to navigate</span>
          </div>
        </div>
      )}

      {/* Error or Helper text */}
      {error && <span className="text-xs font-medium text-rose-500 mt-0.5">{error}</span>}
      {!error && helperText && <p className="text-[11px] text-slate-400 mt-0.5">{helperText}</p>}
    </div>
  );
}
