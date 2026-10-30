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
    id: 'jacinto',
    name: 'Ateneo Jacinto Gate',
    lat: 7.07225,
    lng: 125.61415,
    address: 'E. Jacinto St, Poblacion District, Davao City',
  },
  {
    id: 'roxas',
    name: 'Ateneo Roxas Gate',
    lat: 7.07175,
    lng: 125.61255,
    address: 'M. Roxas Ave, Poblacion District, Davao City',
  },
  {
    id: 'ccfc',
    name: 'Ateneo Roxas CCFC Gate',
    lat: 7.07135,
    lng: 125.61285,
    address: 'M. Roxas Ave / Jacinto Extension, Davao City',
  },
  {
    id: 'claveria',
    name: 'Ateneo Claveria Gate',
    lat: 7.07260,
    lng: 125.61220,
    address: 'C.M. Recto Ave (Claveria St), Poblacion District, Davao City',
  },
];

export const ADDU_GATES = [
  {
    id: 'jacinto',
    label: 'Ateneo Jacinto Gate',
    name: 'Ateneo Jacinto Gate',
    address: 'E. Jacinto St, Poblacion District, Davao City',
    lat: 7.07225,
    lng: 125.61415,
    desc: 'Finster Hall & Bellarmine Hall entrance along E. Jacinto St',
    isPrimary: true,
  },
  {
    id: 'roxas',
    label: 'Ateneo Roxas Gate',
    name: 'Ateneo Roxas Gate',
    address: 'M. Roxas Ave, Poblacion District, Davao City',
    lat: 7.07175,
    lng: 125.61255,
    desc: 'Martin Hall, Arrupe Hall & Roxas Ave entrance',
    isPrimary: true,
  },
  {
    id: 'ccfc',
    label: 'Ateneo Roxas CCFC Gate',
    name: 'Ateneo Roxas CCFC Gate',
    address: 'M. Roxas Ave / Jacinto Extension, Davao City',
    lat: 7.07135,
    lng: 125.61285,
    desc: 'Community Center of the First Companions (CCFC) entrance along Roxas Ave',
    isPrimary: false,
  },
  {
    id: 'claveria',
    label: 'Ateneo Claveria Gate',
    name: 'Ateneo Claveria Gate',
    address: 'C.M. Recto Ave (Claveria St), Poblacion District, Davao City',
    lat: 7.07260,
    lng: 125.61220,
    desc: 'North pedestrian gate along C.M. Recto Ave (Claveria)',
    isPrimary: false,
  },
];

export const CAMPUS_GATES = {
  ...Object.fromEntries(ADDU_GATES.map((gate) => [gate.id, gate])),
  finster: ADDU_GATES.find((g) => g.id === 'claveria'),
  claveria: ADDU_GATES.find((g) => g.id === 'claveria'),
  community_center: ADDU_GATES.find((g) => g.id === 'ccfc'),
  ccfc: ADDU_GATES.find((g) => g.id === 'ccfc'),
};

export const DEFAULT_GATE = 'roxas';
