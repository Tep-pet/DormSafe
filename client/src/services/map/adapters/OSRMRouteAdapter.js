import { IRouteAdapter } from './IRouteAdapter.js';
import { getKnownTravelDuration } from '../../../utils/propertyCoordinates.js';
import { ADDU_GATES } from '../../../constants/campusGates.js';

/**
 * High-speed, zero-key road routing adapter powered by OpenStreetMap routed engines and OSRM.
 * Returns accurate street-level walking and driving paths for Davao City.
 */
export class OSRMRouteAdapter extends IRouteAdapter {
  async getWalkingRoute(origin, destination) {
    return this.getRoute(origin, destination, 'walk');
  }

  async getDrivingRoute(origin, destination) {
    return this.getRoute(origin, destination, 'drive');
  }

  async getRoute(origin, destination, mode = 'walk') {
    const isWalk = mode === 'walk';
    const oLng = origin.lng;
    const oLat = origin.lat;
    const dLng = destination.lng;
    const dLat = destination.lat;

    const matchedGate = ADDU_GATES.find(
      (g) => Math.abs(g.lat - oLat) < 0.0008 && Math.abs(g.lng - oLng) < 0.0008
    );
    const knownDuration = matchedGate
      ? getKnownTravelDuration(matchedGate.id, { latitude: dLat, longitude: dLng }, mode)
      : null;

    // List of reliable public road routing endpoints
    const urls = isWalk
      ? [
          `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson&steps=true`,
          `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson&steps=true`,
        ]
      : [
          `https://routing.openstreetmap.de/routed-car/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson&steps=true`,
          `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson&steps=true`,
        ];

    let lastError = null;

    for (const url of urls) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);

      try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!res.ok) continue;

        const data = await res.json();
        const route = data?.routes?.[0];

        if (!route || !route.geometry?.coordinates || route.geometry.coordinates.length < 2) {
          continue;
        }

        // Convert GeoJSON [lng, lat] -> [lat, lng]
        const coordinates = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        const distanceMeters = Math.round(route.distance || 0);

        // Accurate realistic duration calibrated to Google Maps:
        // Walking: 83.3 meters / minute (~5.0 km/h, Google Maps standard)
        // Driving: calibrated to downtown city traffic and signals
        const durationMinutes = knownDuration != null
          ? knownDuration
          : (isWalk
              ? Math.max(1, Math.round(distanceMeters / 83.3))
              : (distanceMeters <= 400 ? 2 : Math.max(2, Math.round(1.5 + (distanceMeters / 250)))));

        const steps = route.legs?.[0]?.steps || [];
        const streetNames = Array.from(
          new Set(
            steps
              .map((s) => s.name?.trim())
              .filter((name) => name && name.toLowerCase() !== 'unnamed road')
          )
        );

        const summary = streetNames.length > 0
          ? `via ${streetNames.slice(0, 3).join(', ')}`
          : (isWalk ? 'Walking route' : 'Driving route');

        return {
          coordinates,
          distanceMeters,
          durationMinutes,
          formattedDistance: distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(1)} km` : `${distanceMeters} m`,
          formattedDuration: `${durationMinutes} min`,
          summary,
          mode: isWalk ? 'walk' : 'drive',
          provider: isWalk ? 'OSM Walking Route' : 'OSM Driving Route',
          isFallback: false,
        };
      } catch (err) {
        lastError = err;
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError || new Error(`No ${mode} route found`);
  }
}
