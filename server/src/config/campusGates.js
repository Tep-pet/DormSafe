import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const FALLBACK_GATE_DATA = {
  searchRadiusKm: 2,
  gates: {
    jacinto: {
      id: 'jacinto',
      label: 'Jacinto Campus Gate',
      lat: 7.072,
      lng: 125.6141,
      note: 'E. Jacinto St entrance, east side of AdDU Jacinto campus (OSM bounds)',
    },
    roxas: {
      id: 'roxas',
      label: 'Roxas Campus Gate',
      lat: 7.0718,
      lng: 125.6123,
      note: 'Roxas Ave entrance, west side of AdDU Jacinto campus (OSM bounds)',
    },
    claveria: {
      id: 'claveria',
      label: 'Claveria Campus Gate',
      lat: 7.0694,
      lng: 125.6129,
      note: 'C.M. Recto Ave / Claveria entrance, south side of AdDU Jacinto campus (OSM bounds)',
    },
  },
  defaultGate: 'jacinto',
};

let gateData = FALLBACK_GATE_DATA;

try {
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const jsonPath = join(currentDir, '../../../shared/campusGates.json');
    if (existsSync(jsonPath)) {
      gateData = JSON.parse(readFileSync(jsonPath, 'utf8'));
    }
  }
} catch {
  // Safe fallback if shared folder is not in deployment container
}

/** Server-side campus gate coordinates (shared with client via shared/campusGates.json) */
export const SEARCH_RADIUS_KM = gateData.searchRadiusKm;

export const CAMPUS_GATES = Object.fromEntries(
  Object.entries(gateData.gates).map(([id, gate]) => [
    id,
    { id: gate.id, label: gate.label, lat: gate.lat, lng: gate.lng },
  ])
);

export function getGate(gateId) {
  return CAMPUS_GATES[gateId] || CAMPUS_GATES[gateData.defaultGate];
}

