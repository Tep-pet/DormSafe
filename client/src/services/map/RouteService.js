import { GoogleDirectionsService } from './GoogleDirectionsService.js';
import { OSRMRouteAdapter } from './adapters/OSRMRouteAdapter.js';
import { OpenRouteServiceAdapter } from './adapters/OpenRouteServiceAdapter.js';
import { FallbackRouteAdapter } from './adapters/FallbackRouteAdapter.js';
import { calculateHaversineMeters, distanceToPolylineMeters } from './GeoUtils.js';
import { MapConfig } from './MapConfig.js';
import { apiClient } from '../apiClient.js';
import { getVerifiedRoadRoute, getKnownTravelDuration } from '../../utils/propertyCoordinates.js';
import { ADDU_GATES } from '../../constants/campusGates.js';

class RouteServiceManager {
  constructor() {
    this.googleDirections = GoogleDirectionsService;
    this.osrmAdapter = new OSRMRouteAdapter();
    this.orsAdapter = new OpenRouteServiceAdapter();
    this.fallbackAdapter = new FallbackRouteAdapter();

    this.currentRoute = null; // { coordinates, distanceMeters, durationMinutes, summary, mode, isFallback }
    this.currentMode = 'walk'; // 'walk' | 'drive'
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
   * Request turn-by-turn road route (walking or driving)
   * Uses Google Directions API and verified road networks (no straight lines)
   * @param {Object} origin - { lat, lng }
   * @param {Object} destination - { lat, lng }
   * @param {'walk'|'drive'} [mode='walk']
   */
  async fetchRoute(origin, destination, mode = 'walk', property = null) {
    const now = Date.now();
    this.currentMode = mode;

    // 0. Primary: Google Directions Service (Directions API / verified road routes)
    try {
      const gRoute = await this.googleDirections.getRoute(origin, destination, mode, property);
      if (gRoute && gRoute.coordinates?.length >= 2) {
        this.currentRoute = gRoute;
        this.lastRequestTime = now;
        this.lastRequestPos = { ...origin };
        this.consecutiveOffRouteFixes = 0;
        return this.currentRoute;
      }
    } catch (gErr) {
      console.warn('[RouteService] Google Directions resolution notice:', gErr.message);
    }

    // 0. Check for verified Google Maps ground truth route from known Ateneo gates (0ms latency, 100% accuracy)
    const matchedGate = ADDU_GATES.find(
      (g) => Math.abs(g.lat - origin.lat) < 0.0008 && Math.abs(g.lng - origin.lng) < 0.0008
    );
    if (matchedGate) {
      const targetProp = property || { latitude: destination.lat, longitude: destination.lng };
      const verified = getVerifiedRoadRoute(matchedGate.id, targetProp, mode);
      if (verified) {
        this.currentRoute = {
          coordinates: verified.coordinates,
          distanceMeters: verified.distanceMeters,
          durationMinutes: verified.durationMinutes,
          formattedDistance: verified.formattedDistance,
          formattedDuration: verified.formattedDuration,
          summary: verified.summary,
          mode,
          isFallback: false,
        };
        this.lastRequestTime = now;
        this.lastRequestPos = { ...origin };
        this.consecutiveOffRouteFixes = 0;
        return this.currentRoute;
      }
    }

    // 1. Try Backend Road Routing Service (proxies OSM foot & car routing with zero CORS risk)
    try {
      const query = `originLat=${origin.lat}&originLng=${origin.lng}&destLat=${destination.lat}&destLng=${destination.lng}&mode=${mode}`;
      const res = await apiClient.get(`/api/proximity/route?${query}`);
      const routeData = res?.data || res;

      if (routeData?.coordinates?.length > 1) {
        // Ensure coordinates are normalized [lat, lng] array
        const coordinates = routeData.coordinates.map((c) => {
          if (Array.isArray(c)) {
            const [a, b] = c;
            // if [lng, lat] where lng > 50, lat < 50
            return a > 50 ? [b, a] : [a, b];
          }
          return [Number(c.lat), Number(c.lng)];
        });

        this.currentRoute = {
          coordinates,
          distanceMeters: routeData.distanceMeters,
          durationMinutes: routeData.durationMinutes,
          formattedDistance: routeData.formattedDistance,
          formattedDuration: routeData.formattedDuration,
          summary: routeData.summary,
          mode,
          isFallback: false,
        };
        this.lastRequestTime = now;
        this.lastRequestPos = { ...origin };
        this.consecutiveOffRouteFixes = 0;
        return this.currentRoute;
      }
    } catch (apiErr) {
      console.warn('[RouteService] Backend route endpoint notice:', apiErr.message);
    }

    // 2. Direct client-side OSRM / OpenStreetMap routed engines
    try {
      this.currentRoute = await this.osrmAdapter.getRoute(origin, destination, mode);
    } catch (osrmErr) {
      console.warn('[RouteService] OSRM direct notice:', osrmErr.message);

      // 3. Try OpenRouteService if API key configured
      try {
        if (MapConfig.orsApiKey) {
          this.currentRoute = await this.orsAdapter.getWalkingRoute(origin, destination);
        } else {
          throw new Error('ORS key not provided');
        }
      } catch (orsErr) {
        // 4. Street-grid aligned fallback (never a diagonal through buildings)
        console.warn('[RouteService] Fallback to street-grid path:', orsErr.message);
        this.currentRoute = await this.fallbackAdapter.getRoute(origin, destination, mode);
      }
    }

    this.lastRequestTime = now;
    this.lastRequestPos = { ...origin };
    this.consecutiveOffRouteFixes = 0;
    return this.currentRoute;
  }

  /**
   * Handle incoming real-time GPS coordinate from GeolocationEngine
   */
  async updateStudentPosition(currentPos, destinationPos, mode = 'walk', onRouteUpdated, onArrivalTriggered, property = null) {
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

    // 2. If no route yet, or if travel mode changed, fetch new route
    if (!this.currentRoute || this.currentMode !== mode) {
      const route = await this.fetchRoute(currentPos, destinationPos, mode, property);
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
        const updatedRoute = await this.fetchRoute(currentPos, destinationPos, mode, property);
        if (onRouteUpdated) onRouteUpdated(updatedRoute);
        return;
      }
    } else {
      // On-route: reset off-route counter
      this.consecutiveOffRouteFixes = 0;

      // Distance from origin where route was fetched
      const distFromStart = this.lastRequestPos
        ? calculateHaversineMeters(currentPos.lat, currentPos.lng, this.lastRequestPos.lat, this.lastRequestPos.lng)
        : 0;

      const totalRoadDist = this.currentRoute.distanceMeters || distToDestination;
      const initialDuration = this.currentRoute.durationMinutes || 1;

      // If user is still at or near the start (< 30 meters), keep the exact full road route metrics
      if (distFromStart < 30) {
        if (onRouteUpdated) {
          onRouteUpdated({
            ...this.currentRoute,
          });
        }
        return;
      }

      // If user has advanced along the route, calculate remaining road distance
      const remainingRoadDist = Math.max(0, totalRoadDist - distFromStart);
      const isWalk = (mode || this.currentMode) === 'walk';

      // Calibrate remaining duration using Google Maps speeds
      const remainingMinutes = Math.max(
        1,
        isWalk
          ? Math.round(remainingRoadDist / 83.3)
          : (remainingRoadDist <= 400 ? 2 : Math.round(1.5 + (remainingRoadDist / 250)))
      );

      if (onRouteUpdated) {
        onRouteUpdated({
          ...this.currentRoute,
          distanceMeters: Math.round(remainingRoadDist),
          durationMinutes: remainingMinutes,
          formattedDistance: remainingRoadDist >= 1000
            ? `${(remainingRoadDist / 1000).toFixed(1)} km`
            : `${Math.round(remainingRoadDist)} m`,
          formattedDuration: `${remainingMinutes} min`,
        });
      }
    }
  }
}

export const RouteService = new RouteServiceManager();
