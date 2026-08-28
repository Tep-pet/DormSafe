import { env } from '../config/env.js';
import { haversineKm } from '../utils/haversine.js';

/** Google Distance Matrix allows up to 25 destinations per request */
const MAX_DESTINATIONS_PER_REQUEST = 25;

/** Rough walking estimate when Distance Matrix API unavailable (~4.8 km/h) */
function estimateWalkingMinutes(origin, destination) {
  const km = haversineKm(origin.lat, origin.lng, destination.lat, destination.lng);
  return Math.max(1, Math.round((km / 4.8) * 60));
}

function logApiFailure(context, data) {
  const detail = data?.error_message ? ` — ${data.error_message}` : '';
  console.warn(`Google Maps ${context}: ${data?.status || 'UNKNOWN'}${detail}`);
}

async function fetchDistanceMatrix(origin, destinations) {
  const destStr = destinations.map((d) => `${d.lat},${d.lng}`).join('|');
  const params = new URLSearchParams({
    origins: `${origin.lat},${origin.lng}`,
    destinations: destStr,
    mode: 'walking',
    key: env.googleMapsApiKey,
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/distancematrix/json?${params}`
  );
  return response.json();
}

function parseMatrixElements(origin, destinations, elements) {
  return elements.map((el, i) =>
    el.status === 'OK'
      ? Math.ceil(el.duration.value / 60)
      : estimateWalkingMinutes(origin, destinations[i])
  );
}

/**
 * Google Maps Distance Matrix API — walking duration from gate to property.
 * Falls back to haversine estimate if API fails (e.g. REQUEST_DENIED).
 */
export async function getWalkingDurationMinutes(origin, destination) {
  const [minutes] = await getWalkingDurationsBatch(origin, [destination]);
  return minutes;
}

/** Batch walking durations; chunks requests to respect the 25-destination API limit */
export async function getWalkingDurationsBatch(origin, destinations) {
  if (!destinations.length) return [];

  if (!env.googleMapsApiKey) {
    return destinations.map((d) => estimateWalkingMinutes(origin, d));
  }

  const results = [];

  try {
    for (let i = 0; i < destinations.length; i += MAX_DESTINATIONS_PER_REQUEST) {
      const chunk = destinations.slice(i, i + MAX_DESTINATIONS_PER_REQUEST);
      const data = await fetchDistanceMatrix(origin, chunk);

      if (data.status !== 'OK') {
        logApiFailure('Distance Matrix', data);
        results.push(...chunk.map((d) => estimateWalkingMinutes(origin, d)));
        continue;
      }

      const elements = data.rows?.[0]?.elements || [];
      results.push(...parseMatrixElements(origin, chunk, elements));
    }

    return results;
  } catch (err) {
    console.warn('Google Maps batch error — using distance estimates:', err.message);
    return destinations.map((d) => estimateWalkingMinutes(origin, d));
  }
}
