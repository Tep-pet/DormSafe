import { supabaseAdmin } from '../config/supabase.js';
import { geocodeAddress } from './geocoding.service.js';
import { getPublicImageUrl } from './upload.service.js';
import { getPrimaryImage } from '../utils/propertyImages.js';
import { notifyAdmins, createNotification } from './notification.service.js';
import { resolveOwnerIds } from '../utils/ownership.js';

const PROPERTY_SELECT = `
  id, name, type, address, latitude, longitude, description,
  contact_name, contact_phone,
  status, is_verified, owner_id, created_at, updated_at,
  profiles:owner_id ( id, email, full_name ),
  rooms ( id, label, price, capacity, is_available, room_images ( id, storage_path, is_primary ) ),
  house_rules ( id, rule, sort_order )
`;

const OWNER_PUBLIC_EMAILS = {
  'owner.ivory1104@dormsafe.test': 'blancotwinkle@gmail.com',
  'owner.ivory2004@dormsafe.test': 'rheapalima09@gmail.com',
  'owner.brc@dormsafe.test': 'sgpalima@addu.edu.ph',
  'buildingblocks.davao@gmail.com': 'sgpalima@addu.edu.ph',
  'buildingblocks_davao@yahoo.com.ph': 'sgpalima@addu.edu.ph',
  'w.macguilles@gmail.com': 'lssaguirre@addu.edu.ph',
  'andayamay111@gmail.com': 'lssaguirre@addu.edu.ph',
  'owner.juan@dormsafe.test': 'fmppacatang@addu.edu.ph',
  'jerlyugapay@gmail.com': 'fmppacatang@addu.edu.ph',
};

export async function createProperty(ownerId, payload) {
  let latitude = payload.latitude;
  let longitude = payload.longitude;

  if (!latitude || !longitude) {
    const geo = await geocodeAddress(payload.address);
    latitude = geo.latitude;
    longitude = geo.longitude;
  }

  let description = payload.description || null;
  if (payload.contact_email) {
    const emailStr = `Email: ${payload.contact_email.trim()}`;
    if (!description) {
      description = emailStr;
    } else if (!/Email:\s*[^\s,]+/i.test(description)) {
      description = `${description.trim()}\n${emailStr}`;
    }
  }

  const { data: property, error } = await supabaseAdmin
    .from('properties')
    .insert({
      owner_id: ownerId,
      name: payload.name,
      type: payload.type,
      address: payload.address,
      latitude,
      longitude,
      description,
      contact_name: payload.contact_name || null,
      contact_phone: payload.contact_phone || null,
      status: 'pending',
      is_verified: false,
    })
    .select()
    .single();

  if (error) throw error;

  if (payload.rooms?.length) {
    const roomRows = payload.rooms.map((r) => ({
      property_id: property.id,
      label: r.label || null,
      price: r.price,
      capacity: r.capacity || 1,
      is_available: r.is_available ?? true,
    }));
    const { error: roomError } = await supabaseAdmin.from('rooms').insert(roomRows);
    if (roomError) throw roomError;
  }

  if (payload.house_rules?.length) {
    const rules = payload.house_rules.map((rule, i) => ({
      property_id: property.id,
      rule,
      sort_order: i,
    }));
    const { error: ruleError } = await supabaseAdmin.from('house_rules').insert(rules);
    if (ruleError) throw ruleError;
  }

  await notifyAdmins({
    type: 'listing_submitted',
    title: 'New listing for review',
    body: `${payload.name} was submitted and needs approval.`,
    metadata: { property_id: property.id, owner_id: ownerId },
  });

  return getPropertyById(property.id, ownerId, 'owner');
}

export async function getOwnerProperties(ownerId) {
  const ownerIds = resolveOwnerIds(ownerId);
  const { data, error } = await supabaseAdmin
    .from('properties')
    .select(PROPERTY_SELECT)
    .in('owner_id', ownerIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return enrichProperties(data || []);
}

export async function getPropertyById(id, userId, role) {
  const { data, error } = await supabaseAdmin
    .from('properties')
    .select(PROPERTY_SELECT)
    .eq('id', id)
    .single();

  if (error || !data) {
    const err = new Error('Property not found');
    err.status = 404;
    throw err;
  }

  if (role === 'owner') {
    const ownerIds = resolveOwnerIds(userId);
    if (!ownerIds.includes(data.owner_id)) {
      const err = new Error('Not authorized');
      err.status = 403;
      throw err;
    }
  }

  return enrichProperty(data);
}

export async function updateRoomAvailability(roomId, ownerId, isAvailable) {
  const { data: room, error: roomError } = await supabaseAdmin
    .from('rooms')
    .select('id, property_id, properties!inner(owner_id)')
    .eq('id', roomId)
    .single();

  const ownerIds = resolveOwnerIds(ownerId);
  if (roomError || !room || !ownerIds.includes(room.properties.owner_id)) {
    const err = new Error('Room not found or not authorized');
    err.status = 404;
    throw err;
  }

  const { data, error } = await supabaseAdmin
    .from('rooms')
    .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
    .eq('id', roomId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAdminListings(filters = {}) {
  const {
    page = 1,
    limit = 5,
    sort = 'desc',
    propertyId,
    dateFrom,
    dateTo,
    status = 'pending',
  } = filters;

  const from = (Math.max(1, page) - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from('properties')
    .select(PROPERTY_SELECT, { count: 'exact' });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  } else {
    query = query.in('status', ['pending', 'approved', 'rejected']);
  }

  if (propertyId) query = query.eq('id', propertyId);
  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo) query = query.lte('created_at', `${dateTo}T23:59:59.999Z`);

  query = query.order('created_at', { ascending: sort === 'asc' }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    items: enrichProperties(data || []),
    total: count || 0,
    page: Math.max(1, page),
    limit,
    totalPages: Math.ceil((count || 0) / limit) || 1,
  };
}

/** @deprecated use getAdminListings */
export async function getPendingProperties(filters = {}) {
  return getAdminListings({ ...filters, status: filters.status || 'pending' });
}

export async function getAllPropertyNames() {
  const { data, error } = await supabaseAdmin
    .from('properties')
    .select('id, name, status, created_at')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function updatePropertyStatus(propertyId, status, isVerified = null, adminId = null) {
  const updates = { status, updated_at: new Date().toISOString() };
  if (isVerified !== null) updates.is_verified = isVerified;

  const { data, error } = await supabaseAdmin
    .from('properties')
    .update(updates)
    .eq('id', propertyId)
    .select()
    .single();

  if (error) throw error;

  if (adminId && (status === 'approved' || status === 'rejected')) {
    const { data: property } = await supabaseAdmin
      .from('properties')
      .select('id, name, owner_id, rooms(id)')
      .eq('id', propertyId)
      .single();

    if (property?.owner_id) {
      const roomCount = property.rooms?.length || 0;
      await createNotification(property.owner_id, {
        type: 'listing_reviewed',
        title: status === 'approved' ? 'Listing approved' : 'Listing rejected',
        body:
          status === 'approved'
            ? `${property.name} was approved with ${roomCount} room${roomCount === 1 ? '' : 's'}.`
            : `${property.name} was not approved.`,
        metadata: { property_id: propertyId, status, room_count: roomCount },
      });
    }
  }

  return data;
}

export async function updateProperty(ownerId, propertyId, payload) {
  const existing = await getPropertyById(propertyId, ownerId, 'owner');

  const updates = {
    updated_at: new Date().toISOString(),
  };
  if (payload.name != null) updates.name = payload.name;
  if (payload.description != null) updates.description = payload.description;
  if (payload.contact_name != null) updates.contact_name = payload.contact_name;
  if (payload.contact_phone != null) updates.contact_phone = payload.contact_phone;
  if (payload.contact_email != null) {
    let desc = updates.description !== undefined ? updates.description : (existing.description || '');
    if (payload.contact_email.trim()) {
      const emailStr = `Email: ${payload.contact_email.trim()}`;
      if (/Email:\s*[^\s,]+/i.test(desc)) {
        desc = desc.replace(/Email:\s*[^\s,]+/i, emailStr);
      } else if (desc.trim()) {
        desc = `${desc.trim()}\n${emailStr}`;
      } else {
        desc = emailStr;
      }
    } else {
      desc = desc.replace(/\s*Email:\s*[^\s,]+/gi, '').trim();
    }
    updates.description = desc || null;
  }
  if (payload.latitude != null && payload.longitude != null) {
    updates.latitude = payload.latitude;
    updates.longitude = payload.longitude;
  }
  if (payload.address != null && payload.address.trim() !== existing.address?.trim()) {
    updates.address = payload.address;
    if (payload.latitude == null || payload.longitude == null) {
      try {
        const geo = await geocodeAddress(payload.address);
        updates.latitude = geo.latitude;
        updates.longitude = geo.longitude;
      } catch {
        // Keep existing coordinates if server geocoding is unavailable
      }
    }
  } else if (payload.address != null) {
    updates.address = payload.address;
  }

  const ownerIds = resolveOwnerIds(ownerId);
  const { error } = await supabaseAdmin
    .from('properties')
    .update(updates)
    .eq('id', propertyId)
    .in('owner_id', ownerIds);

  if (error) throw error;

  if (payload.rooms?.length) {
    for (const room of payload.rooms) {
      if (!room.id) continue;
      await supabaseAdmin
        .from('rooms')
        .update({
          label: room.label,
          price: room.price,
          capacity: room.capacity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', room.id)
        .eq('property_id', propertyId);
    }
  }

  if (payload.house_rules) {
    await supabaseAdmin.from('house_rules').delete().eq('property_id', propertyId);
    if (payload.house_rules.length) {
      await supabaseAdmin.from('house_rules').insert(
        payload.house_rules.map((rule, i) => ({
          property_id: propertyId,
          rule,
          sort_order: i,
        }))
      );
    }
  }

  return getPropertyById(propertyId, ownerId, 'owner');
}

export async function getOwnerDashboardStats(ownerId, propertyId = null) {
  const ownerIds = resolveOwnerIds(ownerId);
  let query = supabaseAdmin
    .from('properties')
    .select('id, rooms(id, is_available, price)')
    .in('owner_id', ownerIds);

  if (propertyId) {
    query = query.eq('id', propertyId);
  }

  const { data: properties, error } = await query;

  if (error) throw error;

  let totalRooms = 0;
  let occupiedRooms = 0;
  let vacantRooms = 0;
  let potentialRevenue = 0;

  for (const p of properties || []) {
    for (const r of p.rooms || []) {
      totalRooms++;
      if (r.is_available) {
        vacantRooms++;
        potentialRevenue += Number(r.price);
      } else {
        occupiedRooms++;
      }
    }
  }

  const propertyIds = (properties || []).map((p) => p.id);

  let monthlyRevenue = 0;
  if (propertyIds.length) {
    const { data: tenants } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .in('property_id', propertyIds);

    const tenantIds = (tenants || []).map((t) => t.id);
    if (tenantIds.length) {
      const { data: payments } = await supabaseAdmin
        .from('payments')
        .select('amount')
        .in('tenant_id', tenantIds)
        .eq('status', 'paid');

      monthlyRevenue = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
    }
  }

  return { totalRooms, occupiedRooms, vacantRooms, potentialRevenue, monthlyRevenue, propertyCount: properties?.length || 0 };
}

function enrichProperty(p) {
  const primary = getPrimaryImage(p);
  const images = primary
    ? [{ ...primary, url: getPublicImageUrl(primary.storage_path) }]
    : [];

  const parsedEmail = p.description?.match(/Email:\s*([^\s,]+)/i)?.[1]?.trim() || null;
  const ownerEmail = p.profiles?.email || null;
  const contactEmail =
    parsedEmail ||
    OWNER_PUBLIC_EMAILS[ownerEmail] ||
    ownerEmail ||
    null;

  return { ...p, contact_email: contactEmail, room_images: images };
}

function enrichProperties(list) {
  return list.map(enrichProperty);
}

const CAMPUS_GATES = [
  { name: 'Jacinto Campus', latitude: 7.0718, longitude: 125.6131 },
  { name: 'Matina Campus', latitude: 7.0543, longitude: 125.5991 },
];

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function suggestPropertyLocations(query) {
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return [];
  }

  const cleanQ = query.trim();
  const suggestions = [];
  const seenAddresses = new Set();

  // 1. Search existing properties in database
  try {
    const { data: dbProps } = await supabaseAdmin
      .from('properties')
      .select('name, address, latitude, longitude')
      .or(`address.ilike.%${cleanQ}%,name.ilike.%${cleanQ}%`)
      .limit(4);

    if (dbProps && dbProps.length > 0) {
      for (const prop of dbProps) {
        if (!prop.address || seenAddresses.has(prop.address.toLowerCase())) continue;
        seenAddresses.add(prop.address.toLowerCase());

        let minDistance = null;
        let nearestCampus = null;
        if (prop.latitude && prop.longitude) {
          for (const gate of CAMPUS_GATES) {
            const d = haversineDistance(prop.latitude, prop.longitude, gate.latitude, gate.longitude);
            if (minDistance === null || d < minDistance) {
              minDistance = d;
              nearestCampus = gate.name;
            }
          }
        }

        const parts = prop.address.split(',');
        const primary = (prop.name || parts[0] || '').trim();
        const secondary = (parts.length > 1 ? parts.slice(1).join(', ') : prop.address).trim();

        suggestions.push({
          id: `db-${prop.address}`,
          label: prop.address,
          primary,
          secondary,
          latitude: prop.latitude ? Number(prop.latitude) : null,
          longitude: prop.longitude ? Number(prop.longitude) : null,
          isCampusZone: minDistance !== null ? minDistance <= 2.0 : true,
          distanceKm: minDistance !== null ? Number(minDistance.toFixed(2)) : null,
          nearestCampus,
          source: 'database',
        });
      }
    }
  } catch (err) {
    console.warn('[suggestPropertyLocations] Database search note:', err.message);
  }

  // 2. Search Photon geocoding API with Davao City bias
  try {
    const photonQuery = cleanQ.toLowerCase().includes('davao') ? cleanQ : `${cleanQ} Davao City`;
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(photonQuery)}&lat=7.07&lon=125.61&limit=6`;
    const response = await fetch(photonUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'DormSafe/1.0 (Ateneo de Davao student housing)',
      },
    });

    if (response.ok) {
      const data = await response.json();
      for (const feature of data.features || []) {
        const props = feature.properties || {};
        const [lon, lat] = feature.geometry?.coordinates || [];
        if (!lat || !lon) continue;

        // Skip locations clearly outside Davao Region (bounds check)
        if (lat < 6.95 || lat > 7.35 || lon < 125.35 || lon > 125.75) continue;

        const street = props.street || props.name || '';
        const district = props.district || props.suburb || props.city || 'Davao City';
        const formattedAddress = [props.name, props.street, district, 'Davao City']
          .filter(Boolean)
          .filter((val, idx, arr) => arr.indexOf(val) === idx)
          .join(', ');

        if (seenAddresses.has(formattedAddress.toLowerCase())) continue;
        seenAddresses.add(formattedAddress.toLowerCase());

        let minDistance = null;
        let nearestCampus = null;
        for (const gate of CAMPUS_GATES) {
          const d = haversineDistance(lat, lon, gate.latitude, gate.longitude);
          if (minDistance === null || d < minDistance) {
            minDistance = d;
            nearestCampus = gate.name;
          }
        }

        const primary = (props.name || street || cleanQ).trim();
        const secondary = [district, 'Davao City', 'Philippines'].filter(Boolean).join(', ');

        suggestions.push({
          id: `geo-${lat.toFixed(5)}-${lon.toFixed(5)}`,
          label: formattedAddress,
          primary,
          secondary,
          latitude: Number(lat),
          longitude: Number(lon),
          isCampusZone: minDistance <= 2.5,
          distanceKm: Number(minDistance.toFixed(2)),
          nearestCampus,
          source: 'geocoding',
        });
      }
    }
  } catch (err) {
    console.warn('[suggestPropertyLocations] Geocoding API notice:', err.message);
  }

  return suggestions.slice(0, 7);
}

