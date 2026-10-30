/**
 * Geometric, Haversine, and Spatial Utilities for DormSafe
 */

const EARTH_RADIUS_METERS = 6371000;

export function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

/**
 * Calculates straight-line great-circle distance between two coordinates in meters.
 */
export function calculateHaversineMeters(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Calculates initial compass bearing from point A to point B in degrees (0-360).
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin(toRadians(lon2 - lon1)) * Math.cos(toRadians(lat2));
  const x =
    Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
    Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(toRadians(lon2 - lon1));
  const brng = toDegrees(Math.atan2(y, x));
  return (brng + 360) % 360;
}

/**
 * Calculates the shortest orthogonal distance in meters from a point P to a line segment AB.
 */
export function distanceToSegmentMeters(pLat, pLng, aLat, aLng, bLat, bLng) {
  // Approximate locally in flat meters (equirectangular projection)
  const avgLat = toRadians((aLat + bLat) / 2);
  const xA = toRadians(aLng) * EARTH_RADIUS_METERS * Math.cos(avgLat);
  const yA = toRadians(aLat) * EARTH_RADIUS_METERS;
  const xB = toRadians(bLng) * EARTH_RADIUS_METERS * Math.cos(avgLat);
  const yB = toRadians(bLat) * EARTH_RADIUS_METERS;
  const xP = toRadians(pLng) * EARTH_RADIUS_METERS * Math.cos(avgLat);
  const yP = toRadians(pLat) * EARTH_RADIUS_METERS;

  const dx = xB - xA;
  const dy = yB - yA;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return Math.hypot(xP - xA, yP - yA);
  }

  // Project point onto line segment clamped to [0, 1]
  const t = Math.max(0, Math.min(1, ((xP - xA) * dx + (yP - yA) * dy) / lenSq));
  const projX = xA + t * dx;
  const projY = yA + t * dy;

  return Math.hypot(xP - projX, yP - projY);
}

/**
 * Calculates minimum distance from a coordinate to a polyline array [[lat, lng], ...].
 */
export function distanceToPolylineMeters(lat, lng, polyline) {
  if (!polyline || polyline.length < 2) return Infinity;

  let minDistance = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const [aLat, aLng] = polyline[i];
    const [bLat, bLng] = polyline[i + 1];
    const d = distanceToSegmentMeters(lat, lng, aLat, aLng, bLat, bLng);
    if (d < minDistance) minDistance = d;
  }
  return minDistance;
}

export function formatDistance(meters) {
  if (meters == null) return '--';
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

export function formatDuration(minutes) {
  if (minutes == null) return '--';
  if (minutes < 1) return '< 1 min';
  return `${Math.round(minutes)} min`;
}

/**
 * Meters remaining ALONG the route from the user's position.
 * polyline: [[lat, lng], ...]. Returns { remainingMeters, offRouteMeters }.
 */
export function remainingAlongRoute(lat, lng, polyline) {
  if (!polyline || polyline.length < 2) return { remainingMeters: null, offRouteMeters: Infinity };
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const cosLat = Math.cos(rad(lat));
  const proj = ([a, b]) => [rad(b - lng) * R * cosLat, rad(a - lat) * R]; // meters, user at (0,0)
  const pts = polyline.map(proj);

  let best = { dist: Infinity, seg: 0, t: 0 };
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, (-ax * dx + -ay * dy) / lenSq));
    const d = Math.hypot(ax + t * dx, ay + t * dy);
    if (d < best.dist) best = { dist: d, seg: i, t };
  }
  const [ax, ay] = pts[best.seg];
  const [bx, by] = pts[best.seg + 1];
  let remaining = Math.hypot(bx - ax, by - ay) * (1 - best.t);
  for (let i = best.seg + 1; i < pts.length - 1; i++) {
    remaining += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
  }
  return { remainingMeters: Math.round(remaining), offRouteMeters: Math.round(best.dist) };
}

/**
 * Scale the provider's own total duration by how much of the route is left.
 * Returns whole minutes, never below 1 (and 0 is not shown; arrival handles the end).
 */
export function remainingMinutes(totalSeconds, totalMeters, remainingMeters) {
  if (!Number.isFinite(totalSeconds) || !Number.isFinite(totalMeters) || totalMeters <= 0) return null;
  const frac = Math.max(0, Math.min(1, remainingMeters / totalMeters));
  return Math.max(1, Math.ceil((totalSeconds * frac) / 60));
}

/** GeoJSON polygon approximating a circle (GPS accuracy radius). */
export function circlePolygon(lat, lng, radiusMeters, steps = 64) {
  const R = 6371000;
  const coords = [];
  for (let i = 0; i <= steps; i++) {
    const ang = (i / steps) * 2 * Math.PI;
    const dLat = ((radiusMeters * Math.cos(ang)) / R) * (180 / Math.PI);
    const dLng = ((radiusMeters * Math.sin(ang)) / (R * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
    coords.push([lng + dLng, lat + dLat]);
  }
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coords] } };
}
