import { IRouteAdapter } from './IRouteAdapter.js';
import { getDynamicGoogleMapsTimes } from '../../../utils/propertyCoordinates.js';

/**
 * High-speed routing adapter powered by Project OSRM with Google Maps Davao City calibration.
 * Supports both pedestrian ('foot') and vehicular ('driving') routes.
 */
export class OSRMRouteAdapter extends IRouteAdapter {
  async getWalkingRoute(origin, destination, mode = 'foot') {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const profile = mode === 'driving' ? 'driving' : 'foot';

    try {
      const url = `https://router.project-osrm.org/route/v1/${profile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url, { signal: controller.signal });

      if (!res.ok) {
        throw new Error(`OSRM HTTP error ${res.status}`);
      }

      const data = await res.json();
      const route = data?.routes?.[0];

      if (!route || !route.geometry?.coordinates || route.geometry.coordinates.length === 0) {
        throw new Error(`No ${profile} route returned by OSRM`);
      }

      // GeoJSON [lng, lat] -> convert to [lat, lng] for internal representation
      const coordinates = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      const distanceMeters = Math.round(route.distance || 0);

      // Calibrate duration according to Google Maps Davao City benchmark speeds
      const { walkingMinutes, drivingMinutes } = getDynamicGoogleMapsTimes(distanceMeters);
      const durationMinutes = mode === 'driving' ? drivingMinutes : walkingMinutes;

      return {
        coordinates,
        distanceMeters,
        durationMinutes,
        walkingMinutes,
        drivingMinutes,
        provider: mode === 'driving' ? 'OSRM Driving Route (Google Maps Calibrated)' : 'OSRM Walking Route (Google Maps Calibrated)',
        isFallback: false,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
