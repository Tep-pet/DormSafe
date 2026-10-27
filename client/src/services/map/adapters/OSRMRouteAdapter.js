import { IRouteAdapter } from './IRouteAdapter.js';

/**
 * High-speed, zero-key pedestrian routing adapter powered by Project OSRM.
 * Returns accurate street-level walking paths for Davao City.
 */
export class OSRMRouteAdapter extends IRouteAdapter {
  async getWalkingRoute(origin, destination) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
      const url = `https://router.project-osrm.org/route/v1/foot/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url, { signal: controller.signal });

      if (!res.ok) {
        throw new Error(`OSRM HTTP error ${res.status}`);
      }

      const data = await res.json();
      const route = data?.routes?.[0];

      if (!route || !route.geometry?.coordinates || route.geometry.coordinates.length === 0) {
        throw new Error('No walking route returned by OSRM');
      }

      // GeoJSON [lng, lat] -> convert to [lat, lng] for internal representation
      const coordinates = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      const distanceMeters = Math.round(route.distance || 0);
      const durationMinutes = Math.max(1, Math.round((route.duration || 0) / 60));

      return {
        coordinates,
        distanceMeters,
        durationMinutes,
        provider: 'OSRM Walking Route',
        isFallback: false,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
