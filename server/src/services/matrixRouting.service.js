import { env } from '../config/env.js';
import { haversineKm } from '../utils/haversine.js';

/** OpenRouteService allows up to 50 locations per matrix request on standard plan */
const MAX_LOCATIONS_PER_MATRIX = 45;

/** Rough walking estimate when API unavailable (~4.8 km/h or 80 meters/min) */
function estimateWalkingMinutes(origin, destination) {
  const km = haversineKm(origin.lat, origin.lng, destination.lat, destination.lng);
  return Math.max(1, Math.round((km / 4.8) * 60));
}

const durationCache = new Map();
let orsPermanentlyFailed = false;

/**
 * Fetch walking duration matrix via OpenRouteService Matrix API
 */
async function fetchOrsMatrix(origin, destinations) {
  // ORS coordinates format: [longitude, latitude]
  const locations = [
    [origin.lng, origin.lat],
    ...destinations.map((d) => [d.lng, d.lat]),
  ];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch('https://api.openrouteservice.org/v2/matrix/foot-walking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: env.orsApiKey,
      },
      body: JSON.stringify({
        locations,
        sources: [0], // Origin is index 0
        destinations: destinations.map((_, i) => i + 1), // Indices 1..N
        metrics: ['duration'],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        orsPermanentlyFailed = true;
      }
      throw new Error(`ORS Matrix HTTP ${response.status}`);
    }

    const data = await response.json();
    const durations = data?.durations?.[0] || [];
    return durations.map((sec, i) =>
      sec != null ? Math.max(1, Math.round(sec / 60)) : estimateWalkingMinutes(origin, destinations[i])
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Get walking duration in minutes from origin to destination
 */
export async function getWalkingDurationMinutes(origin, destination) {
  const cacheKey = `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}->${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`;
  if (durationCache.has(cacheKey)) {
    return durationCache.get(cacheKey);
  }

  const [minutes] = await getWalkingDurationsBatch(origin, [destination]);
  durationCache.set(cacheKey, minutes);
  return minutes;
}

/**
 * Batch walking durations from origin to multiple destinations
 */
export async function getWalkingDurationsBatch(origin, destinations) {
  if (!destinations.length) return [];

  // If no API key configured or API previously failed/rate-limited, use instant Haversine
  if (!env.orsApiKey || orsPermanentlyFailed) {
    return destinations.map((d) => estimateWalkingMinutes(origin, d));
  }

  const results = [];

  try {
    for (let i = 0; i < destinations.length; i += MAX_LOCATIONS_PER_MATRIX) {
      const chunk = destinations.slice(i, i + MAX_LOCATIONS_PER_MATRIX);
      try {
        const chunkResults = await fetchOrsMatrix(origin, chunk);
        results.push(...chunkResults);
      } catch (err) {
        console.warn('ORS matrix batch error — using Haversine estimates:', err.message);
        results.push(...chunk.map((d) => estimateWalkingMinutes(origin, d)));
      }
    }
    return results;
  } catch (err) {
    console.warn('Matrix calculation fallback:', err.message);
    return destinations.map((d) => estimateWalkingMinutes(origin, d));
  }
}
