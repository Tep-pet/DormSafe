import { IRouteAdapter } from './IRouteAdapter.js';
import { calculateHaversineMeters } from '../GeoUtils.js';
import { getKnownTravelDuration } from '../../../utils/propertyCoordinates.js';
import { ADDU_GATES } from '../../../constants/campusGates.js';

/**
 * Street-aligned fallback adapter for offline or network edge cases.
 * Instead of drawing a straight diagonal through buildings, it routes
 * along the downtown Davao urban street grid (Manhattan path).
 */
export class FallbackRouteAdapter extends IRouteAdapter {
  async getWalkingRoute(origin, destination) {
    return this.getRoute(origin, destination, 'walk');
  }

  async getDrivingRoute(origin, destination) {
    return this.getRoute(origin, destination, 'drive');
  }

  async getRoute(origin, destination, mode = 'walk') {
    const isWalk = mode === 'walk';

    const matchedGate = ADDU_GATES.find(
      (g) => Math.abs(g.lat - origin.lat) < 0.0008 && Math.abs(g.lng - origin.lng) < 0.0008
    );
    const knownDuration = matchedGate
      ? getKnownTravelDuration(matchedGate.id, { latitude: destination.lat, longitude: destination.lng }, mode)
      : null;

    // Direct distance
    const directMeters = calculateHaversineMeters(origin.lat, origin.lng, destination.lat, destination.lng);
    // Manhattan grid distance along streets (~1.25x of direct distance)
    const estimatedDistanceMeters = Math.max(10, Math.round(directMeters * 1.25));

    const estimatedDurationMinutes = knownDuration != null
      ? knownDuration
      : (isWalk
          ? Math.max(1, Math.round(estimatedDistanceMeters / 83.3)) // 83.3 m/min = 5.0 km/h (Google Maps standard)
          : (estimatedDistanceMeters <= 400 ? 2 : Math.max(2, Math.round(1.5 + (estimatedDistanceMeters / 250)))));

    // 3-point road-aligned path: [origin] -> [street intersection] -> [destination]
    const cornerLat = origin.lat;
    const cornerLng = destination.lng;

    const coordinates = [
      [origin.lat, origin.lng],
      [cornerLat, cornerLng],
      [destination.lat, destination.lng],
    ];

    return {
      coordinates,
      distanceMeters: estimatedDistanceMeters,
      durationMinutes: estimatedDurationMinutes,
      formattedDistance: estimatedDistanceMeters >= 1000
        ? `${(estimatedDistanceMeters / 1000).toFixed(1)} km`
        : `${estimatedDistanceMeters} m`,
      formattedDuration: `${estimatedDurationMinutes} min`,
      summary: isWalk ? 'Walking route via street grid' : 'Driving route via street grid',
      mode: isWalk ? 'walk' : 'drive',
      provider: 'Davao Street Grid Route',
      isFallback: true,
    };
  }
}
