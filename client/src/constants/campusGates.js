/**
 * Ateneo de Davao University campus gate coordinates.
 * Verify exact gate locations during Sprint 1 testing with Google Maps.
 * Search radius: 2 km (proposal §1.5).
 */
export const SEARCH_RADIUS_KM = 2;

export const CAMPUS_GATES = {
  jacinto: {
    id: 'jacinto',
    label: 'Jacinto Campus Gate',
    lat: 7.0729,
    lng: 125.6118,
  },
  roxas: {
    id: 'roxas',
    label: 'Roxas Campus Gate',
    lat: 7.0656,
    lng: 125.6078,
  },
};

export const DEFAULT_GATE = 'jacinto';
