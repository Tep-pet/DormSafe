import { IRouteAdapter } from './IRouteAdapter.js';
import { calculateHaversineMeters } from '../GeoUtils.js';
import { MapConfig } from '../MapConfig.js';

export class FallbackRouteAdapter extends IRouteAdapter {
  async getWalkingRoute(origin, destination) {
    const directMeters = calculateHaversineMeters(origin.lat, origin.lng, destination.lat, destination.lng);
    // Add 15% estimated detour for urban street grid walking
    const estimatedDistanceMeters = Math.round(directMeters * 1.15);
    const estimatedDurationMinutes = Math.max(
      1,
      Math.round(estimatedDistanceMeters / (MapConfig.THRESHOLDS.WALKING_SPEED_MPS * 60))
    );

    // Provide straight line coordinates
    const coordinates = [
      [origin.lat, origin.lng],
      [destination.lat, destination.lng],
    ];

    return {
      coordinates,
      distanceMeters: estimatedDistanceMeters,
      durationMinutes: estimatedDurationMinutes,
      provider: 'Haversine Direct Line',
      isFallback: true,
    };
  }
}
