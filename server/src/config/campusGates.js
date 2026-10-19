import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const gateData = JSON.parse(
  readFileSync(join(__dirname, '../../../shared/campusGates.json'), 'utf8')
);

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
