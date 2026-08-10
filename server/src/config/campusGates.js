/** Server-side campus gate coordinates (mirror client constants) */
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

export function getGate(gateId) {
  return CAMPUS_GATES[gateId] || CAMPUS_GATES.jacinto;
}
