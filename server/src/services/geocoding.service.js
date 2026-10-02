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
