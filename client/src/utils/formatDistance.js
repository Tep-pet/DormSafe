/** Format walking duration from Google Maps / proximity API */
export function formatWalkingTime(minutes) {
  if (minutes == null) return '—';
  if (minutes < 1) return '< 1 min walk';
  return `${Math.round(minutes)} min walk`;
}
