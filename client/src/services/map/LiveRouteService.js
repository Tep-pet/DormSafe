import { apiClient } from '../apiClient.js';

/**
 * Fetch real road route (walk or drive) from backend live routing service.
 * mode: 'walk' | 'drive'. Throws on failure (caller shows an error state).
 * Returns { coordinates:[[lat,lng],...], distanceMeters, durationSeconds, durationMinutes,
 *           formattedDistance, formattedDuration, summary, provider, trafficAware, mode }
 */
export async function fetchRoute(origin, destination, mode = 'walk') {
  const q = new URLSearchParams({
    originLat: origin.lat,
    originLng: origin.lng,
    destLat: destination.lat,
    destLng: destination.lng,
    mode,
  });
  const res = await apiClient.get(`/api/proximity/live-route?${q.toString()}`);
  const d = res?.data || res;
  if (!d?.coordinates || d.coordinates.length < 2 || !Number.isFinite(d.durationSeconds)) {
    throw new Error('No route returned');
  }
  const durationMinutes = Math.max(1, Math.ceil(d.durationSeconds / 60));
  const m = Math.round(d.distanceMeters || 0);
  return {
    coordinates: d.coordinates, // already [lat, lng] from the server
    distanceMeters: m,
    durationSeconds: d.durationSeconds,
    durationMinutes,
    formattedDistance: m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`,
    formattedDuration: `${durationMinutes} min`,
    summary: d.summary || '',
    provider: d.provider,
    trafficAware: !!d.trafficAware,
    mode: d.mode,
  };
}

