/**
 * DormSafe Free & Independent Map Configuration
 * Zero Google Maps services or billing.
 */

export const MapConfig = {
  // Provider Selection: 'maptiler' | 'osm' | 'pmtiles'
  tileProvider: import.meta.env.VITE_MAP_PROVIDER || 'osm',

  // Routing Provider: 'openrouteservice' | 'geoapify' | 'fallback'
  routingProvider: import.meta.env.VITE_ROUTING_PROVIDER || 'openrouteservice',

  // API Keys (Optional, fallback modes exist for zero-key setups)
  orsApiKey: (import.meta.env.VITE_ORS_API_KEY || '').trim(),
  maptilerApiKey: (import.meta.env.VITE_MAPTILER_API_KEY || '').trim(),
  geoapifyApiKey: (import.meta.env.VITE_GEOAPIFY_API_KEY || '').trim(),

  // Navigation Logic Thresholds
  THRESHOLDS: {
    RE_ROUTE_METERS: 50,       // Only request re-route if student deviates > 50m
    RE_ROUTE_THROTTLE_MS: 20000, // 20s minimum between routing API requests
    ARRIVAL_METERS: 20,         // "You've arrived" within 20m of accommodation
    WALKING_SPEED_MPS: 1.33,    // ~4.8 km/h pedestrian velocity
    ACCURACY_REJECT_METERS: 250, // Allow laptop/tablet Wi-Fi location (reject only >250m)
  },

  // Campus Bounding Box (Ateneo de Davao Jacinto + 2km perimeter)
  CAMPUS_BOUNDS: {
    minLat: 7.055,
    maxLat: 7.085,
    minLng: 125.600,
    maxLng: 125.630,
    defaultCenter: [7.0715, 125.6135], // AdDU Jacinto campus center
  },
};
