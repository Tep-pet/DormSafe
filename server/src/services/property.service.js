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
  'owner.brc@dormsafe.test': 'buildingblocks_davao@yahoo.com.ph',
  'owner.juan@dormsafe.test': 'jerlyugapay@gmail.com',
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
