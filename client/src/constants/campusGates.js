/**
 * Ateneo de Davao University campus gate coordinates.
 * Aligned to AdDU Jacinto campus bounds (OpenStreetMap amenity/university).
 * Search radius: 2 km (proposal §1.5).
 */
import gateData from '../../../shared/campusGates.json';

export const SEARCH_RADIUS_KM = gateData.searchRadiusKm;

export const CAMPUS_GATES = Object.fromEntries(
  Object.entries(gateData.gates).map(([id, gate]) => [
    id,
    { id: gate.id, label: gate.label, lat: gate.lat, lng: gate.lng },
  ])
);

export const DEFAULT_GATE = gateData.defaultGate;
