import { getVerifiedStreetRoute } from './roadRouting.service.js';
/**
 * Live Routing Service for DormSafe
 * Multi-provider turn-by-turn routing with true provider durations.
 * Provider chain: Google Directions (if valid API key available) -> OpenStreetMap / OSRM.
 */

const routeCache = new Map();

function decodePolyline(encoded) {
  const pts = [];
  let i = 0;
  let lat = 0;
  let lng = 0;
  while (i < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(i++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(i++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    pts.push([lat / 1e5, lng / 1e5]);
  }
  return pts;
}

export async function getLiveRoute({ originLat, originLng, destLat, destLng, mode = 'walk' }) {
  const oLat = Number(originLat);
  const oLng = Number(originLng);
  const dLat = Number(destLat);
  const dLng = Number(destLng);

  if (
    !Number.isFinite(oLat) ||
    !Number.isFinite(oLng) ||
    !Number.isFinite(dLat) ||
    !Number.isFinite(dLng) ||
    Math.abs(oLat) > 90 ||
    Math.abs(dLat) > 90 ||
    Math.abs(oLng) > 180 ||
    Math.abs(dLng) > 180
  ) {
    const err = new Error('Invalid coordinates supplied');
    err.status = 400;
    throw err;
  }

  const activeMode = mode === 'drive' ? 'drive' : 'walk';
  const cacheKey = `${activeMode}|${oLat.toFixed(5)},${oLng.toFixed(5)}|${dLat.toFixed(5)},${dLng.toFixed(5)}`;
  const now = Date.now();
  const ttlMs = activeMode === 'drive' ? 60000 : 600000;

  if (routeCache.has(cacheKey)) {
    const cached = routeCache.get(cacheKey);
    if (now - cached.at < ttlMs) {
      return cached.data;
    }
    routeCache.delete(cacheKey);
  }

  // 0. Check for verified ground truth road route
  const verifiedRoute = getVerifiedStreetRoute(oLat, oLng, dLat, dLng, activeMode);
  if (verifiedRoute) {
    const coordinates = verifiedRoute.coordinates.map(([a, b]) => (a > 50 ? [b, a] : [a, b]));
    const result = {
      mode: activeMode,
      provider: 'verified',
      trafficAware: false,
      distanceMeters: verifiedRoute.distanceMeters,
      durationSeconds: (verifiedRoute.durationMinutes || Math.max(1, Math.round(verifiedRoute.distanceMeters / 83.3))) * 60,
      durationMinutes: verifiedRoute.durationMinutes,
      formattedDistance: verifiedRoute.distanceMeters >= 1000
        ? `${(verifiedRoute.distanceMeters / 1000).toFixed(1)} km`
        : `${verifiedRoute.distanceMeters} m`,
      formattedDuration: `${verifiedRoute.durationMinutes} min`,
      summary: verifiedRoute.summary,
      coordinates,
    };
    routeCache.set(cacheKey, { at: now, data: result });
    return result;
  }

  // 1. Provider 1: Google Directions Web Service
  const googleKey = (process.env.GOOGLE_MAPS_API_KEY || '').trim();
  if (googleKey) {
    try {
      const gMode = activeMode === 'drive' ? 'driving' : 'walking';
      let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${oLat},${oLng}&destination=${dLat},${dLng}&mode=${gMode}&key=${googleKey}`;
      if (activeMode === 'drive') {
        url += '&departure_time=now';
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        if (json.status === 'OK' && json.routes?.[0]?.legs?.[0]) {
          const route = json.routes[0];
          const leg = route.legs[0];

          const distanceMeters = Math.round(leg.distance?.value || 0);
          const durationSeconds = Math.round(
            activeMode === 'drive' && leg.duration_in_traffic?.value
              ? leg.duration_in_traffic.value
              : leg.duration?.value || 0
          );
          const trafficAware = activeMode === 'drive' && !!leg.duration_in_traffic;

          // Decode all step polylines to get full detail
          const allCoords = [];
          const steps = leg.steps || [];
          for (const step of steps) {
            if (step.polyline?.points) {
              const pts = decodePolyline(step.polyline.points);
              for (const pt of pts) {
                if (
                  allCoords.length === 0 ||
                  allCoords[allCoords.length - 1][0] !== pt[0] ||
                  allCoords[allCoords.length - 1][1] !== pt[1]
                ) {
                  allCoords.push(pt);
                }
              }
            }
          }

          // Fallback to overview_polyline if steps had no points
          if (allCoords.length < 2 && route.overview_polyline?.points) {
            allCoords.push(...decodePolyline(route.overview_polyline.points));
          }

          if (allCoords.length >= 2) {
            const summary = route.summary ? `via ${route.summary}` : '';
            const data = {
              mode: activeMode,
              provider: 'google',
              trafficAware,
              distanceMeters,
              durationSeconds,
              summary,
              coordinates: allCoords,
            };
            routeCache.set(cacheKey, { at: now, data });
            return data;
          }
        } else {
          console.warn('[liveRouting] Google skipped:', json.status);
        }
      }
    } catch (gErr) {
      console.warn('[liveRouting] Google Directions error:', gErr.message);
    }
  }

  // 2. Provider 2: OSRM
  const isWalk = activeMode === 'walk';
  const osrmUrls = isWalk
    ? [
        `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson&steps=true`,
      ]
    : [
        `https://routing.openstreetmap.de/routed-car/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson&steps=true`,
        `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson&steps=true`,
      ];

  for (const url of osrmUrls) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'DormSafe/1.0' },
      });
      clearTimeout(timer);

      if (!res.ok) continue;

      const data = await res.json();
      const route = data?.routes?.[0];
      if (route && route.geometry?.coordinates?.length >= 2) {
        const distanceMeters = Math.round(route.distance || 0);
        let durationSeconds = Math.round(route.duration || 0);

        // Walk sanity guard
        if (isWalk && durationSeconds > 0) {
          const speed = distanceMeters / durationSeconds;
          if (speed < 0.8 || speed > 2.2) {
            durationSeconds = Math.round(distanceMeters / 1.33);
          }
        }

        // Convert [lng, lat] -> [lat, lng]
        const coordinates = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

        const steps = route.legs?.[0]?.steps || [];
        const stepNames = Array.from(
          new Set(
            steps
              .map((s) => s.name?.trim())
              .filter((n) => n && n.toLowerCase() !== 'unnamed road')
          )
        );
        const summary = stepNames.length > 0 ? `via ${stepNames.slice(0, 3).join(', ')}` : '';

        const result = {
          mode: activeMode,
          provider: 'osrm',
          trafficAware: false,
          distanceMeters,
          durationSeconds,
          summary,
          coordinates,
        };

        routeCache.set(cacheKey, { at: now, data: result });
        return result;
      }
    } catch {
      // Try next endpoint
    }
  }

  const err = new Error('Routing service unavailable. Please try again.');
  err.status = 502;
  throw err;
}

