/**
 * Ateneo de Davao University campus gate coordinates & definitions.
 * All gates are geocoded to accurate OpenStreetMap campus entrances.
 */

export const SEARCH_RADIUS_KM = 2;

/**
 * Verified Ateneo de Davao University (AdDU) campus gate config array: { name, lat, lng }
 * Coordinates verified through Google Maps / Places.
 */
export const ADDU_GATE_COORDINATES = [
  {
    id: 'roxas',
    name: 'Ateneo Roxas Gate',
    lat: 7.07180,
    lng: 125.61230,
    address: 'M. Roxas Ave, Poblacion District, Davao City',
  },
  {
    id: 'jacinto',
    name: 'Ateneo Jacinto Gate',
    lat: 7.07200,
    lng: 125.61410,
    address: 'E. Jacinto St, Poblacion District, Davao City',
  },
];

export const ADDU_GATES = [
  {
    id: 'roxas',
    label: 'Ateneo Roxas Gate',
    name: 'Ateneo Roxas Gate',
    address: 'M. Roxas Ave, Poblacion District, Davao City',
    lat: 7.07180,
    lng: 125.61230,
    desc: 'Martin Hall, Arrupe Hall & Roxas Ave entrance',
    isPrimary: true,
  },
  {
    id: 'jacinto',
    label: 'Ateneo Jacinto Gate',
    name: 'Ateneo Jacinto Gate',
    address: 'E. Jacinto St, Poblacion District, Davao City',
    lat: 7.07200,
    lng: 125.61410,
    desc: 'Finster Hall & Bellarmine Hall entrance along E. Jacinto St',
    isPrimary: true,
  },
];

export const CAMPUS_GATES = {
  ...Object.fromEntries(ADDU_GATES.map((gate) => [gate.id, gate])),
  finster: ADDU_GATES.find((g) => g.id === 'jacinto'),
  claveria: ADDU_GATES.find((g) => g.id === 'jacinto'),
  community_center: ADDU_GATES.find((g) => g.id === 'roxas'),
  ccfc: ADDU_GATES.find((g) => g.id === 'roxas'),
};

export const DEFAULT_GATE = 'roxas';
