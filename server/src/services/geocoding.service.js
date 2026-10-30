const PLUS_CODE = /\b[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}\b/gi;

/** Rough Davao City bounds — reject Manila/other hits with the same street name */
const DAVAO = {
  minLat: 6.95,
  maxLat: 7.25,
  minLng: 125.45,
  maxLng: 125.7,
};

const NOMINATIM_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'DormSafe/1.0 (Ateneo de Davao student housing platform)',
};

function inDavao(lat, lng) {
  return lat >= DAVAO.minLat && lat <= DAVAO.maxLat && lng >= DAVAO.minLng && lng <= DAVAO.maxLng;
}

function cleanAddress(address) {
  return address
    .replace(PLUS_CODE, ' ')
    .replace(/\bDavao del Sur\b/gi, ' ')
    .replace(/\bDavao Region\b/gi, ' ')
    .replace(/\bPhilippines\b/gi, ' ')
    .replace(/\b\d{4}\b/g, ' ')
    .replace(/\bSt\.?\b/gi, 'Street')
    .replace(/\bAve\.?\b/gi, 'Avenue')
    .replace(/\bBlvd\.?\b/gi, 'Boulevard')
    .replace(/\s+,/g, ',')
    .replace(/,{2,}/g, ',')
    .replace(/^[\s,]+|[\s,]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function withPhilippines(query) {
  return /philippines/i.test(query) ? query : `${query}, Philippines`;
}

function withDavaoCity(query) {
  return /davao city/i.test(query) ? query : `${query}, Davao City`;
}

function queryVariants(address) {
  const cleaned = cleanAddress(address);
  const parts = cleaned.split(',').map((p) => p.trim()).filter(Boolean);
  const streetLine = parts[0] || cleaned;
  const streetNoNumber = streetLine.replace(/^\d+\s+/, '').trim();

  const variants = [
    withPhilippines(withDavaoCity(cleaned)),
    withPhilippines(`${streetLine}, Davao City`),
    withPhilippines(`${streetNoNumber}, Davao City`),
  ].filter(Boolean);

  return [...new Set(variants)];
}

function pickNominatim(results) {
  const hit = (results || []).find((r) => inDavao(Number(r.lat), Number(r.lon)));
  if (!hit) return null;
  return { latitude: Number(hit.lat), longitude: Number(hit.lon) };
}

async function nominatimSearch(query) {
  const params = new URLSearchParams({
    format: 'json',
    limit: '5',
    countrycodes: 'ph',
    q: query,
    viewbox: '125.55,7.15,125.67,7.04',
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: NOMINATIM_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Could not geocode address (HTTP ${response.status})`);
  }

  return pickNominatim(await response.json());
}

function pickPhoton(features, streetHint) {
  const hint = (streetHint || '').toLowerCase();
  const ranked = (features || [])
    .map((f) => {
      const [lng, lat] = f.geometry?.coordinates || [];
      if (!inDavao(lat, lng)) return null;
      const props = f.properties || {};
      const blob = `${props.name || ''} ${props.street || ''} ${props.city || ''}`.toLowerCase();
      if (!/davao/.test(`${props.city || ''} ${props.state || ''} ${props.country || ''}`)) return null;
      const streetMatch = hint && (blob.includes(hint) || hint.includes((props.street || props.name || '').toLowerCase()));
      return { latitude: lat, longitude: lng, score: streetMatch ? 2 : 1 };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  return ranked[0] ? { latitude: ranked[0].latitude, longitude: ranked[0].longitude } : null;
}

async function photonSearch(query, streetHint) {
  const params = new URLSearchParams({
    q: query,
    limit: '8',
    lat: '7.073',
    lon: '125.613',
  });

  const response = await fetch(`https://photon.komoot.io/api/?${params}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return null;

  const data = await response.json();
  return pickPhoton(data.features, streetHint);
}

/** Geocode a Davao address to lat/lng (Nominatim, then Photon). */
export async function geocodeAddress(address) {
  const queries = queryVariants(address);
  const streetHint = cleanAddress(address).split(',')[0]?.replace(/^\d+\s+/, '').trim();

  for (let i = 0; i < queries.length; i += 1) {
    if (i > 0) await new Promise((r) => setTimeout(r, 1100));
    const hit = await nominatimSearch(queries[i]);
    if (hit) return hit;
  }

  const photonQueries = [
    withDavaoCity(cleanAddress(address)),
    `${streetHint}, Davao City`,
  ];
  for (const q of [...new Set(photonQueries)]) {
    const hit = await photonSearch(q, streetHint);
    if (hit) return hit;
  }

  throw new Error(
    'Could not find that address. Check the street and barangay, then try again.'
  );
}

export const DAVAO_COMMON_LOCATIONS = [
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
 * Fast search suggestions for Davao City addresses as a landlord types.
 * Combines local curated Ateneo housing streets with live Photon/Nominatim data.
 */
export async function searchAddressSuggestions(query) {
  if (!query || typeof query !== 'string') return [];
  const raw = query.trim();
  if (raw.length < 1) return [];

  const numMatch = raw.match(/^(\d+[\w-]*)\s*(.*)/);
  const houseNumber = numMatch ? numMatch[1] : '';
  const streetQuery = numMatch ? numMatch[2].trim() : raw;

  const results = [];
  const seenAddresses = new Set();

  function addResult(primary, secondary, fullAddress, lat, lng) {
    const key = fullAddress.toLowerCase();
    if (seenAddresses.has(key)) return;
    seenAddresses.add(key);
    results.push({
      primary,
      secondary,
      fullAddress,
      latitude: Number(lat),
      longitude: Number(lng),
    });
  }

  // 1. Check local Davao & Ateneo vicinity dataset
  for (const loc of DAVAO_COMMON_LOCATIONS) {
    const matchName = !streetQuery || loc.name.toLowerCase().includes(streetQuery.toLowerCase());
    const matchDistrict = !streetQuery || loc.district.toLowerCase().includes(streetQuery.toLowerCase());

    if (matchName || matchDistrict) {
      const primary = houseNumber ? `${houseNumber} ${loc.name}` : loc.name;
      const secondary = `${loc.district}, Davao City, 8000, Philippines`;
      const full = `${primary}, ${secondary}`;
      addResult(primary, secondary, full, loc.lat, loc.lon);
    }
  }

  // 2. Query Photon Komoot API with Davao coordinates bias
  try {
    const searchTarget = houseNumber && streetQuery ? `${streetQuery}, Davao City` : `${raw}, Davao City`;
    const params = new URLSearchParams({
      q: searchTarget,
      limit: '8',
      lat: '7.073',
      lon: '125.613',
    });

    const response = await fetch(`https://photon.komoot.io/api/?${params}`, {
      headers: { Accept: 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      for (const f of data.features || []) {
        const [lng, lat] = f.geometry?.coordinates || [];
        if (!lat || !lng || !inDavao(lat, lng)) continue;

        const p = f.properties || {};
        const baseName = p.name || p.street || p.housenumber || 'Address';
        const primary = houseNumber && !baseName.startsWith(houseNumber)
          ? `${houseNumber} ${baseName}`
          : baseName;

        const secondaryParts = [
          p.district || p.suburb || p.locality,
          p.city || 'Davao City',
          'Philippines',
        ].filter(Boolean);

        const secondary = secondaryParts.join(', ');
        const fullAddress = `${primary}, ${secondary}`;
        addResult(primary, secondary, fullAddress, lat, lng);
      }
    }
  } catch (err) {
    console.warn('[geocoding] Photon suggestion query failed:', err.message);
  }

  // 3. Fallback to Nominatim if fewer than 2 results and query has 3+ chars
  if (results.length < 2 && streetQuery.length >= 3) {
    try {
      const nomQuery = `${raw}, Davao City, Philippines`;
      const params = new URLSearchParams({
        format: 'json',
        limit: '5',
        countrycodes: 'ph',
        q: nomQuery,
        viewbox: '125.55,7.15,125.67,7.04',
      });

      const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: NOMINATIM_HEADERS,
      });

      if (nomRes.ok) {
        const nomData = await nomRes.json();
        for (const item of nomData || []) {
          const lat = Number(item.lat);
          const lon = Number(item.lon);
          if (!inDavao(lat, lon)) continue;

          const parts = (item.display_name || '').split(',').map((s) => s.trim());
          const primary = parts[0] || raw;
          const secondary = parts.slice(1).join(', ') || 'Davao City, Philippines';
          addResult(primary, secondary, item.display_name, lat, lon);
        }
      }
    } catch {
      // ignore Nominatim timeout
    }
  }

  return results.slice(0, 6);
}
