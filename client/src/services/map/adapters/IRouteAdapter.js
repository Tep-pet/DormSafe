/**
 * Route Adapter Interface Contract
 */
export class IRouteAdapter {
  /**
   * Calculate walking route from origin to destination.
   * @param {{ lat: number, lng: number }} origin
   * @param {{ lat: number, lng: number }} destination
   * @returns {Promise<{
   *   coordinates: [number, number][], // Array of [lat, lng]
   *   distanceMeters: number,
   *   durationMinutes: number,
   *   provider: string,
   *   isFallback: boolean
   * }>}
   */
  async getWalkingRoute(origin, destination) {
    throw new Error('Method getWalkingRoute() must be implemented.');
  }
}
