import { env } from '../config/env.js';

/** Geocode an address to lat/lng using Google Geocoding API */
export async function geocodeAddress(address) {
  if (!env.googleMapsApiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY required for geocoding');
  }

  const params = new URLSearchParams({
    address: `${address}, Davao City, Philippines`,
    key: env.googleMapsApiKey,
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params}`
  );
  const data = await response.json();

  if (data.status !== 'OK' || !data.results?.[0]) {
    const detail = data.error_message ? `: ${data.error_message}` : '';
    throw new Error(`Could not geocode address (${data.status}${detail})`);
  }

  const { lat, lng } = data.results[0].geometry.location;
  return { latitude: lat, longitude: lng };
}
