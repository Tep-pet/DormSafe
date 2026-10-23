import { OpenRouteServiceAdapter } from './adapters/OpenRouteServiceAdapter.js';
import { FallbackRouteAdapter } from './adapters/FallbackRouteAdapter.js';
import { calculateHaversineMeters, distanceToPolylineMeters } from './GeoUtils.js';
import { MapConfig } from './MapConfig.js';

class RouteServiceManager {
  constructor() {
    this.primaryAdapter = new OpenRouteServiceAdapter();
    this.fallbackAdapter = new FallbackRouteAdapter();

    this.currentRoute = null; // { coordinates, distanceMeters, durationMinutes, isFallback }
    this.lastRequestTime = 0;
    this.lastRequestPos = null;
    this.consecutiveOffRouteFixes = 0;
  }

  /**
   * Reset session state
   */
  reset() {
    this.currentRoute = null;
    this.lastRequestTime = 0;
    this.lastRequestPos = null;
    this.consecutiveOffRouteFixes = 0;
  }

  /**
   * Request initial walking route
   */
  async fetchRoute(origin, destination) {
    const now = Date.now();
    try {
      this.currentRoute = await this.primaryAdapter.getWalkingRoute(origin, destination);
    } catch (err) {
      console.warn('Primary routing unavailable, using direct walking fallback:', err.message);
      this.currentRoute = await this.fallbackAdapter.getWalkingRoute(origin, destination);
    }
    this.lastRequestTime = now;
    this.lastRequestPos = { ...origin };
    this.consecutiveOffRouteFixes = 0;
    return this.currentRoute;
  }

  /**
   * Handle incoming real-time GPS coordinate from GeolocationEngine
   */
  async updateStudentPosition(currentPos, destinationPos, onRouteUpdated, onArrivalTriggered) {
    // 1. Arrival Detection (< 20 meters)
    const distToDestination = calculateHaversineMeters(
      currentPos.lat,
      currentPos.lng,
      destinationPos.lat,
      destinationPos.lng
    );

    if (distToDestination <= MapConfig.THRESHOLDS.ARRIVAL_METERS) {
      if (onArrivalTriggered) onArrivalTriggered(distToDestination);
      return;
    }

    // 2. If no route yet, fetch initial route
    if (!this.currentRoute) {
      const route = await this.fetchRoute(currentPos, destinationPos);
      if (onRouteUpdated) onRouteUpdated(route);
      return;
    }

    // 3. Off-route detection via orthogonal cross-track distance
    const offRouteDistance = distanceToPolylineMeters(
      currentPos.lat,
      currentPos.lng,
      this.currentRoute.coordinates
    );

    const now = Date.now();
    const timeSinceLastFetch = now - this.lastRequestTime;

    if (offRouteDistance > MapConfig.THRESHOLDS.RE_ROUTE_METERS) {
      this.consecutiveOffRouteFixes += 1;

      // Require 2 consecutive off-route GPS fixes to prevent erratic GPS jumps
      if (
        this.consecutiveOffRouteFixes >= 2 &&
        timeSinceLastFetch > MapConfig.THRESHOLDS.RE_ROUTE_THROTTLE_MS
      ) {
        const updatedRoute = await this.fetchRoute(currentPos, destinationPos);
        if (onRouteUpdated) onRouteUpdated(updatedRoute);
        return;
      }
    } else {
      // On-route: reset off-route counter
      this.consecutiveOffRouteFixes = 0;

      // Dynamic local update of remaining distance without calling API
      const remainingMinutes = Math.max(
        1,
        Math.round(distToDestination / (MapConfig.THRESHOLDS.WALKING_SPEED_MPS * 60))
      );

      if (onRouteUpdated) {
        onRouteUpdated({
          ...this.currentRoute,
          distanceMeters: distToDestination,
          durationMinutes: remainingMinutes,
        });
      }
    }
  }
}

export const RouteService = new RouteServiceManager();
