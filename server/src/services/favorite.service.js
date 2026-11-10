import { supabaseAdmin } from '../config/supabase.js';
import { getPublicImageUrl } from './upload.service.js';
import { getPrimaryImage } from '../utils/propertyImages.js';
import { getGate } from '../config/campusGates.js';
import { getWalkingDurationMinutes } from './matrixRouting.service.js';

export async function toggleFavorite(studentId, propertyId) {
  const { data: existing } = await supabaseAdmin
    .from('saved_listings')
    .select('id')
    .eq('student_id', studentId)
    .eq('property_id', propertyId)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin.from('saved_listings').delete().eq('id', existing.id);
    return { saved: false };
  }

  await supabaseAdmin.from('saved_listings').insert({ student_id: studentId, property_id: propertyId });
  return { saved: true };
}

export async function getFavorites(studentId, gate = 'jacinto') {
  const campusGate = getGate(gate);

  const { data, error } = await supabaseAdmin
    .from('saved_listings')
    .select(`
      id, created_at,
      properties (
        id, name, type, address, description, latitude, longitude, is_verified, status,
        contact_name, contact_phone, owner_id,
        profiles:owner_id ( id, email, full_name ),
        rooms ( id, label, price, capacity, is_available, room_images ( id, storage_path, is_primary ) ),
        house_rules ( id, rule )
      )
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const items = [];
  for (const row of data || []) {
    const p = row.properties;
    if (!p || p.status !== 'approved') continue;

    const walkingMinutes = await getWalkingDurationMinutes(campusGate, {
      lat: p.latitude,
      lng: p.longitude,
    });
    const rooms = (p.rooms || [])
      .map((r) => ({
        id: r.id,
        label: r.label,
        price: r.price,
        capacity: r.capacity,
        is_available: r.is_available,
      }))
      .sort((a, b) => (a.price || 0) - (b.price || 0));
    const prices = rooms.map((r) => r.price).filter((v) => v != null);
    const primary = getPrimaryImage(p);
    const rules = (p.house_rules || [])
      .map((hr) => (typeof hr === 'string' ? hr : hr.rule))
      .filter(Boolean);

    items.push({
      saved_id: row.id,
      id: p.id,
      name: p.name,
      type: p.type,
      address: p.address,
      description: p.description || '',
      latitude: p.latitude,
      longitude: p.longitude,
      is_verified: p.is_verified,
      contact_name: p.contact_name || p.profiles?.full_name || null,
      contact_phone: p.contact_phone || null,
      contact_email: p.profiles?.email || null,
      min_price: prices.length ? Math.min(...prices) : null,
      max_price: prices.length ? Math.max(...prices) : null,
      available_rooms: rooms.filter((r) => r.is_available).length,
      total_rooms: rooms.length,
      rooms,
      house_rules: rules,
      walking_minutes: walkingMinutes,
      primary_image: primary ? getPublicImageUrl(primary.storage_path) : null,
    });
  }

  return items;
}

export async function getFavoriteIds(studentId) {
  const { data } = await supabaseAdmin
    .from('saved_listings')
    .select('property_id')
    .eq('student_id', studentId);
  return (data || []).map((r) => r.property_id);
}
