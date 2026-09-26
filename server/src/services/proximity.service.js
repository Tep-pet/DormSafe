import { supabaseAdmin } from '../config/supabase.js';
import { getGate, SEARCH_RADIUS_KM } from '../config/campusGates.js';
import { getBoundingBox, isWithinRadiusKm } from '../utils/haversine.js';
import { getPropertyPrimaryImageUrl, flattenRoomImages, mapRoomImages } from '../utils/propertyImages.js';
import { getWalkingDurationsBatch, getWalkingDurationMinutes } from './googleMaps.service.js';
import { enrichRoomsWithStayInfo } from './stay.service.js';
import { getApprovedReviews } from './review.service.js';
import { getFavoriteIds } from './favorite.service.js';

const SEARCH_SELECT = `
  id, name, type, address, latitude, longitude, is_verified, status,
  contact_name, contact_phone,
  rooms ( id, price, capacity, is_available, room_images ( id, storage_path, is_primary ) )
`;

/**
 * Fetch approved listings near a gate (bounding-box SQL pre-filter + haversine).
 */
async function fetchApprovedPropertiesNearGate({ gate, propertyType, minPrice, maxPrice }) {
  const campusGate = getGate(gate);
  const box = getBoundingBox(campusGate.lat, campusGate.lng, SEARCH_RADIUS_KM);

  let query = supabaseAdmin
    .from('properties')
    .select(SEARCH_SELECT)
    .eq('status', 'approved')
    .eq('is_verified', true)
    .gte('latitude', box.minLat)
    .lte('latitude', box.maxLat)
    .gte('longitude', box.minLng)
    .lte('longitude', box.maxLng);

  if (propertyType) query = query.eq('type', propertyType);

  const { data, error } = await query;
  if (error) throw error;

  let properties = (data || []).filter((p) =>
    isWithinRadiusKm(p.latitude, p.longitude, campusGate.lat, campusGate.lng, SEARCH_RADIUS_KM)
  );

  if (minPrice != null || maxPrice != null) {
    const min = minPrice != null ? Number(minPrice) : 0;
    const max = maxPrice != null ? Number(maxPrice) : Infinity;
    properties = properties.filter((p) =>
      (p.rooms || []).some((r) => r.price >= min && r.price <= max)
    );
  }

  return { campusGate, properties };
}

function enrichProperty(property, walkingMinutes) {
  const rooms = property.rooms || [];
  const availableRooms = rooms.filter((r) => r.is_available).length;
  const prices = rooms.map((r) => r.price).filter((p) => p != null);

  return {
    id: property.id,
    name: property.name,
    type: property.type,
    address: property.address,
    latitude: property.latitude,
    longitude: property.longitude,
    is_verified: property.is_verified,
    contact_name: property.contact_name,
    contact_phone: property.contact_phone,
    min_price: prices.length ? Math.min(...prices) : null,
    available_rooms: availableRooms,
    walking_minutes: walkingMinutes,
    primary_image: getPropertyPrimaryImageUrl(property),
  };
}

/**
 * Proximity Algorithm (proposal §3.3):
 * 1. Load approved listings near gate (SQL bbox + haversine)
 * 2. Compute walking time via Google Maps Distance Matrix
 * 3. Sort by walking duration
 */
export async function searchNearbyProperties({ gate, minPrice, maxPrice, propertyType }) {
  const { campusGate, properties: inRadius } = await fetchApprovedPropertiesNearGate({
    gate,
    propertyType,
    minPrice,
    maxPrice,
  });

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

export async function getPropertyById(id, gate, studentId = null) {
  const campusGate = getGate(gate);

  const { data, error } = await supabaseAdmin
    .from('properties')
    .select(`
      id, name, type, address, latitude, longitude, description, is_verified, status,
      contact_name, contact_phone,
      rooms ( id, label, price, capacity, is_available, room_images ( id, storage_path, is_primary ) ),
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

  const rooms = (await enrichRoomsWithStayInfo(data.rooms || [], studentId)).map((room) => {
    const { room_images, ...rest } = room;
    return { ...rest, images: mapRoomImages({ room_images }) };
  });
  const reviews = await getApprovedReviews(id);
  let is_saved = false;
  if (studentId) {
    const favIds = await getFavoriteIds(studentId);
    is_saved = favIds.includes(id);
  }

  return {
    ...data,
    rooms,
    walking_minutes: walkingMinutes,
    images: flattenRoomImages(data),
    reviews,
    is_saved,
  };
}
