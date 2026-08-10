import { env } from '../config/env.js';

/**
 * Google Maps Distance Matrix API — walking duration from gate to property.
 * Proposal §3.2: Logic layer communicates with Google Maps API.
 */
export async function getWalkingDurationMinutes(origin, destination) {
  if (!env.googleMapsApiKey) {
    // Fallback estimate when API key not configured (dev only)
    return null;
  }

  const params = new URLSearchParams({
    origins: `${origin.lat},${origin.lng}`,
    destinations: `${destination.lat},${destination.lng}`,
    mode: 'walking',
    key: env.googleMapsApiKey,
  });

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?${params}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK') {
    throw new Error(`Google Maps API error: ${data.status}`);
  }

  const element = data.rows?.[0]?.elements?.[0];
  if (!element || element.status !== 'OK') return null;

  return Math.ceil(element.duration.value / 60);
}

/** Batch walking durations for multiple destinations */
export async function getWalkingDurationsBatch(origin, destinations) {
  if (!destinations.length) return [];

  if (!env.googleMapsApiKey) {
    return destinations.map(() => null);
  }

  const destStr = destinations.map((d) => `${d.lat},${d.lng}`).join('|');
  const params = new URLSearchParams({
    origins: `${origin.lat},${origin.lng}`,
    destinations: destStr,
    mode: 'walking',
    key: env.googleMapsApiKey,
  });

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?${params}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK') {
    throw new Error(`Google Maps API error: ${data.status}`);
  }

  const elements = data.rows?.[0]?.elements || [];
  return elements.map((el) =>
    el.status === 'OK' ? Math.ceil(el.duration.value / 60) : null
  );
}
