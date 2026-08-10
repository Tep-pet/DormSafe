import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';
import { getGate, SEARCH_RADIUS_KM } from '../config/campusGates.js';
import { isWithinRadiusKm } from '../utils/haversine.js';
import { getWalkingDurationsBatch, getWalkingDurationMinutes } from './googleMaps.service.js';

/** Build public URL for Supabase Storage object */
function getPublicImageUrl(storagePath) {
  if (!storagePath || !env.supabaseUrl) return null;
  return `${env.supabaseUrl}/storage/v1/object/public/room-images/${storagePath}`;
}

/**
 * Fetch approved, verified properties with rooms, images, and rules.
 */
async function fetchApprovedProperties({ propertyType, minPrice, maxPrice }) {
  let query = supabaseAdmin
    .from('properties')
    .select(`
      id, name, type, address, latitude, longitude, is_verified, status,
      rooms ( id, price, capacity, is_available ),
      room_images ( id, storage_path, is_primary ),
      house_rules ( id, rule )
    `)
    .eq('status', 'approved')
    .eq('is_verified', true);

  if (propertyType) query = query.eq('type', propertyType);

  const { data, error } = await query;
  if (error) throw error;

  let properties = data || [];

  // Price filter — property must have at least one room in range
  if (minPrice != null || maxPrice != null) {
    const min = minPrice != null ? Number(minPrice) : 0;
    const max = maxPrice != null ? Number(maxPrice) : Infinity;
    properties = properties.filter((p) =>
      (p.rooms || []).some((r) => r.price >= min && r.price <= max)
    );
  }

  return properties;
}

function enrichProperty(property, walkingMinutes) {
  const rooms = property.rooms || [];
  const availableRooms = rooms.filter((r) => r.is_available).length;
  const prices = rooms.map((r) => r.price).filter((p) => p != null);
  const primaryImage = (property.room_images || []).find((i) => i.is_primary);

  return {
    id: property.id,
    name: property.name,
    type: property.type,
    address: property.address,
    latitude: property.latitude,
    longitude: property.longitude,
    is_verified: property.is_verified,
    min_price: prices.length ? Math.min(...prices) : null,
    available_rooms: availableRooms,
    walking_minutes: walkingMinutes,
    primary_image: getPublicImageUrl(primaryImage?.storage_path) || null,
  };
}

/**
 * Proximity Algorithm (proposal §3.3):
 * 1. Load approved listings from Supabase
 * 2. Pre-filter by 2 km haversine radius from selected gate
 * 3. Compute walking time via Google Maps Distance Matrix
 * 4. Sort by walking duration
 */
export async function searchNearbyProperties({ gate, minPrice, maxPrice, propertyType }) {
  const campusGate = getGate(gate);
  const allProperties = await fetchApprovedProperties({ propertyType, minPrice, maxPrice });

  const inRadius = allProperties.filter((p) =>
    isWithinRadiusKm(p.latitude, p.longitude, campusGate.lat, campusGate.lng, SEARCH_RADIUS_KM)
  );

  const destinations = inRadius.map((p) => ({ lat: p.latitude, lng: p.longitude }));
  const walkingMinutes = await getWalkingDurationsBatch(campusGate, destinations);

  const results = inRadius
    .map((p, i) => enrichProperty(p, walkingMinutes[i]))
    .sort((a, b) => {
      if (a.walking_minutes == null) return 1;
      if (b.walking_minutes == null) return -1;
      return a.walking_minutes - b.walking_minutes;
    });

  return {
    gate: campusGate,
    radius_km: SEARCH_RADIUS_KM,
    count: results.length,
    properties: results,
  };
}

export async function getPropertyById(id, gate) {
  const campusGate = getGate(gate);

  const { data, error } = await supabaseAdmin
    .from('properties')
    .select(`
      id, name, type, address, latitude, longitude, is_verified, status,
      rooms ( id, price, capacity, is_available ),
      room_images ( id, storage_path, is_primary ),
      house_rules ( id, rule )
    `)
    .eq('id', id)
    .eq('status', 'approved')
    .eq('is_verified', true)
    .single();

  if (error || !data) {
    const err = new Error('Property not found');
    err.status = 404;
    throw err;
  }

  if (
    !isWithinRadiusKm(data.latitude, data.longitude, campusGate.lat, campusGate.lng, SEARCH_RADIUS_KM)
  ) {
    const err = new Error('Property is outside the 2 km search radius');
    err.status = 404;
    throw err;
  }

  const walkingMinutes = await getWalkingDurationMinutes(campusGate, {
    lat: data.latitude,
    lng: data.longitude,
  });

  return {
    ...data,
    walking_minutes: walkingMinutes,
    images: (data.room_images || []).map((img) => ({
      id: img.id,
      url: getPublicImageUrl(img.storage_path),
    })),
  };
}
