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
    name: 'Ateneo Jacinto Main Gate',
    lat: 7.07200,
    lng: 125.61410,
    address: 'E. Jacinto St, Poblacion District, Davao City',
  },
  {
    id: 'claveria',
    name: 'Ateneo Claveria Gate (Finster Gate)',
    lat: 7.07270,
    lng: 125.61390,
    address: 'C.M. Recto Ave (Claveria St), Poblacion District, Davao City',
  },
  {
    id: 'martin_hall',
    name: 'Ateneo Martin Hall Gate',
    lat: 7.07150,
    lng: 125.61350,
    address: 'E. Jacinto St, Poblacion District, Davao City',
  },
  {
    id: 'community_center',
    name: 'Ateneo Community Center Gate (Bapa Benny)',
    lat: 7.07110,
    lng: 125.61220,
    address: 'Jacinto Extension, Davao City',
  },
  {
    id: 'dotterweich',
    name: 'Ateneo Dotterweich Gate',
    lat: 7.07080,
    lng: 125.61260,
    address: 'Fr. Selga St, Davao City',
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
    desc: 'Martin Hall, Arrupe Hall & Roxas Ave main entrance',
    isPrimary: true,
  },
  {
    id: 'jacinto',
    label: 'Ateneo Jacinto Main Gate',
    name: 'Ateneo Jacinto Main Gate',
    address: 'E. Jacinto St, Poblacion District, Davao City',
    lat: 7.07200,
    lng: 125.61410,
    desc: 'Finster Hall & Bellarmine Hall main entrance',
    isPrimary: true,
  },
  {
    id: 'finster',
    label: 'Ateneo Claveria Gate (Finster Gate)',
    name: 'Ateneo Claveria Gate (Finster Gate)',
    address: 'C.M. Recto Ave (Claveria St), Poblacion District, Davao City',
    lat: 7.07270,
    lng: 125.61390,
    desc: 'North pedestrian gate along C.M. Recto Ave (Claveria)',
    isPrimary: false,
  },
  {
    id: 'martin_hall',
    label: 'Ateneo Martin Hall Gate',
    name: 'Ateneo Martin Hall Gate',
    address: 'E. Jacinto St, Poblacion District, Davao City',
    lat: 7.07150,
    lng: 125.61350,
    desc: 'Pedestrian access to university sports gym & arena',
    isPrimary: false,
  },
  {
    id: 'community_center',
    label: 'Ateneo Community Center Gate (Bapa Benny)',
    name: 'Ateneo Community Center Gate (Bapa Benny)',
    address: 'Jacinto Extension, Davao City',
    lat: 7.07110,
    lng: 125.61220,
    desc: 'Southwest entrance by Bapa Benny Community Center',
    isPrimary: false,
  },
  {
    id: 'dotterweich',
    label: 'Ateneo Dotterweich Gate',
    name: 'Ateneo Dotterweich Gate',
    address: 'Fr. Selga St, Davao City',
    lat: 7.07080,
    lng: 125.61260,
    desc: 'South pedestrian gate near Canisius Hall',
    isPrimary: false,
  },
  {
    id: 'matina',
    label: 'Ateneo Matina Campus Gate',
    name: 'Ateneo Matina Campus Gate',
    address: 'McArthur Highway, Matina, Davao City',
    lat: 7.06120,
    lng: 125.59750,
    desc: 'Grade school & junior high school campus entrance',
    isPrimary: false,
  },
];

export const CAMPUS_GATES = {
  ...Object.fromEntries(ADDU_GATES.map((gate) => [gate.id, gate])),
  claveria: ADDU_GATES.find((g) => g.id === 'finster'),
};

export const DEFAULT_GATE = 'roxas';

