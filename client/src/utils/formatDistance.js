/** Format walking distance / duration from Google Maps response */
export function formatWalkingTime(minutes) {
  if (minutes == null) return '—';
  if (minutes < 1) return '< 1 min walk';
  return `${Math.round(minutes)} min walk`;
}

export function formatDistanceKm(km) {
  if (km == null) return '—';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
