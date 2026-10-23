import { IRouteAdapter } from './IRouteAdapter.js';
import { MapConfig } from '../MapConfig.js';

export class OpenRouteServiceAdapter extends IRouteAdapter {
  constructor(apiKey = MapConfig.orsApiKey) {
    super();
    this.apiKey = apiKey;
  }

  async getWalkingRoute(origin, destination) {
    if (!this.apiKey) {
      throw new Error('OpenRouteService API key not configured');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const url = `https://api.openrouteservice.org/v2/directions/foot-walking?api_key=${this.apiKey}&start=${origin.lng},${origin.lat}&end=${destination.lng},${destination.lat}`;
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`OpenRouteService HTTP ${response.status}`);
      }

      const data = await response.json();
      const feature = data.features?.[0];

      if (!feature || !feature.geometry?.coordinates) {
        throw new Error('No route features returned by OpenRouteService');
      }

      // GeoJSON coordinates are [lng, lat] -> convert to [lat, lng] for map consumers
      const coordinates = feature.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      const summary = feature.properties?.summary || {};
      const distanceMeters = Math.round(summary.distance || 0);
      const durationMinutes = Math.max(1, Math.round((summary.duration || 0) / 60));

      return {
        coordinates,
        distanceMeters,
        durationMinutes,
        provider: 'OpenRouteService',
        isFallback: false,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
