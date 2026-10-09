/**
 * Seed DormSafe properties from Places/ folder data.
 * Run: npm run seed (from server/)
 *
 * Creates one owner account per property + one admin account.
 */
import dotenv from 'dotenv';

dotenv.config();

if (process.env.SUPABASE_INSECURE_SSL === '1') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../');
const PLACES_DIR = path.join(ROOT, 'Places');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@dormsafe.test';
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
const DEFAULT_OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD || 'Owner123!';

/** One owner account per property (Places/ place1–place6 + place4) */
const PROPERTIES = [
  {
    ownerEmail: 'jerlyugapay@gmail.com',
    ownerName: 'Jerly Ugapay',
    contact_name: 'Jerly Ugapay',
    contact_phone: '09922506670',
    name: 'Juan Luna Boarding House',
    type: 'boarding_house',
    address: 'Brgy 29-c 102-1 purok-2 Juan Luna Street, Davao City, Davao del Sur',
    latitude: 7.0719,
    longitude: 125.6106,
    description: 'All Girls Boarding House (Female Only). Near campus (5 min walk). Amenities: Free WiFi, Family can stay, Kitchen (Can cook), Aircon available, Gated 24/7 security.',
    approved: true,
    rooms: [
      { label: 'Standard', price: 2500, capacity: 1 },
      { label: 'Standard Plus', price: 3500, capacity: 1 },
      { label: 'With AC (lower)', price: 5500, capacity: 1 },
      { label: 'With AC (upper)', price: 6500, capacity: 1 },
    ],
    rules: ['Bawal mag saba pag gabii', 'Pwede mag luto', 'No visitor pag 10 pm', 'Naka lock ang gate by 10pm', 'No pets allowed'],
    imageDir: 'place2/place2',
  },
  {
    ownerEmail: 'buildingblocks_davao@yahoo.com.ph',
    ownerName: 'Trisha Paula Gwatwo',
    contact_name: 'Trisha Paula Gwatwo',
    contact_phone: '09553561395',
    name: 'BRC Dormitory',
    type: 'dormitory',
    address: 'Padre Gomez St & A Bonifacio St, Barangay 34-D, Davao City',
    latitude: 7.0680548,
    longitude: 125.6125343,
    description: 'Co-ed Dormitory (Any Gender). Near campus (5 min walk). Amenities: Aircon, Study table, shelf, TV, and fire alarm.',
    approved: true,
    rooms: [
      { label: 'Good for 1', price: 10000, capacity: 1 },
      { label: 'Good for 2', price: 12000, capacity: 2 },
    ],
    rules: ['No pets', 'Quiet Hours: 10pm - 6am', 'Curfew for visitors/guests only till 10pm', 'No smoking', 'No illegal or prohibited drugs', 'No cooking inside the room', 'Follow security protocols', 'No firearms', 'Respect shared facilities'],
    imageDir: 'place5/place5',
  },
  {
    ownerEmail: 'w.macguilles@yahoo.com',
    ownerName: 'Williamor Corpuz',
    contact_name: 'Williamor Corpuz',
    contact_phone: '09128912466',
    name: 'Correla Dormitory',
    type: 'dormitory',
    address: '108 Roxas Avenue, Davao City, Philippines, 8000',
    latitude: 7.06945,
    longitude: 125.61468,
    description: 'Ladies Only / All Girls Dormitory. Near campus (2 min walk). Amenities: Aircon (Air-conditioned rooms), Free WiFi access, Built-in closets, Single beds, Common study area, Water Dispenser, 24/7 CCTV Security.',
    approved: true,
    rooms: [
      { label: 'Room 1', price: 4000, capacity: 1 },
    ],
    rules: ['Ladies only', 'No visitors overnight', 'Keep common areas clean', 'Quiet hours 10pm-6am'],
    imageDir: 'place5/place5',
  },
  {
    ownerEmail: 'andayamay111@gmail.com',
    ownerName: 'May Andaya',
    contact_name: 'May Andaya',
    contact_phone: '09305456322',
    name: 'Residencia de Maria Goretti',
    type: 'dormitory',
    address: '32 Padre Faura St, Poblacion District, Davao City, Davao del Sur',
    latitude: 7.0695629,
    longitude: 125.6152546,
    description: 'All Girls Dormitory (Female Only). Near campus (4 min walk). Amenities: Aircon, Electric fan, Rice cooker, heater, Kitchen. Strict student security and quiet study environment.',
    approved: true,
    rooms: [
      { label: 'Room 1', price: 3500, capacity: 1 },
      { label: 'Room 2', price: 3500, capacity: 1 },
      { label: 'Room 3', price: 3500, capacity: 1 },
      { label: 'Room 4', price: 4000, capacity: 1 },
      { label: 'Room 5', price: 4000, capacity: 1 },
    ],
    rules: ['Female only', 'No smoking', 'Curfew 10pm', 'Keep shared kitchen clean'],
    imageDir: 'place2/place2',
  },
  {
    ownerEmail: 'owner.cezar@dormsafe.test',
    ownerName: 'Cezar Verbata',
    contact_name: 'Cezar Verbata Dormitory',
    contact_phone: null,
    name: 'Cezar Verbata Dormitory',
    type: 'dormitory',
    address: 'Edes Bldg, Jacinto St, Barangay 29-C, Davao City',
    latitude: 7.0735,
    longitude: 125.6128,
    description: 'Common kitchen and CR. All girls and boys mixed. Features: Free wifi and Small karinderya. Utilities: Electricity 15kW/hr, Water 250, Appliances 150. Note: No permit yet.',
    approved: false,
    rooms: [
      { label: 'Single (3.5k)', price: 3500, capacity: 1 },
      { label: 'Single (5k)', price: 5000, capacity: 1 },
      { label: 'Single (6k)', price: 6000, capacity: 1 },
      { label: 'Good for 2', price: 7000, capacity: 2 },
    ],
    rules: ['Bawal mag inom', 'Bawal mag luto', 'Bawal mag laba', 'Bawal saba', 'Bawal manimaho ang kwarto', 'No curfew'],
    imageDir: 'place6/place6',
  },
];

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);

function collectImages(dir) {
  const fullDir = path.join(PLACES_DIR, dir);
  if (!fs.existsSync(fullDir)) return [];

  const files = [];
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (IMAGE_EXT.has(path.extname(entry.name).toLowerCase())) files.push(full);
    }
  }
  walk(fullDir);
  return files;
}

async function getOrCreateUser(email, password, fullName, role) {
  const { data: list, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    throw new Error(
      `Cannot reach Supabase Auth: ${listError.message}. ` +
        'If you see "fetch failed", add SUPABASE_INSECURE_SSL=1 to server/.env and retry.'
    );
  }

  let user = list?.users?.find((u) => u.email === email);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });
    if (error) throw error;
    user = data.user;
    console.log(`Created ${role}: ${email} / ${password}`);
  } else {
    await supabase.from('profiles').upsert({
      id: user.id,
      email,
      full_name: fullName,
      role,
    });
    console.log(`Using existing ${role}: ${email}`);
  }

  return user.id;
}

async function seedAdmin() {
  return getOrCreateUser(SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, 'DormSafe Admin', 'admin');
}

async function uploadImages(ownerId, roomId, imagePaths) {
  for (let i = 0; i < imagePaths.length; i++) {
    const filePath = imagePaths[i];
    const filename = path.basename(filePath);
    const buffer = fs.readFileSync(filePath);
    const storagePath = `${ownerId}/${roomId}/${filename}`;

    await supabase.storage.from('room-images').upload(storagePath, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

    await supabase.from('room_images').insert({
      room_id: roomId,
      storage_path: storagePath,
      is_primary: i === 0,
    });
  }
}

async function hasContactColumns() {
  const { error } = await supabase.from('properties').select('contact_name, contact_phone').limit(0);
  return !error;
}

async function seedProperty(prop, includeContact) {
  const ownerId = await getOrCreateUser(
    prop.ownerEmail,
    DEFAULT_OWNER_PASSWORD,
    prop.ownerName,
    'owner'
  );

  const { data: existing } = await supabase
    .from('properties')
    .select('id')
    .eq('name', prop.name)
    .maybeSingle();

  if (existing?.id) {
    const updates = {
      owner_id: ownerId,
      address: prop.address,
      latitude: prop.latitude,
      longitude: prop.longitude,
      description: prop.description,
    };
    if (includeContact) {
      updates.contact_name = prop.contact_name;
      updates.contact_phone = prop.contact_phone;
    }
    await supabase.from('properties').update(updates).eq('id', existing.id);

    for (const room of prop.rooms || []) {
      await supabase
        .from('rooms')
        .update({ price: room.price, capacity: room.capacity, label: room.label })
        .eq('property_id', existing.id)
        .eq('label', room.label);
    }

    if (prop.rules) {
      await supabase.from('house_rules').delete().eq('property_id', existing.id);
      if (prop.rules.length) {
        await supabase.from('house_rules').insert(
          prop.rules.map((rule, i) => ({ property_id: existing.id, rule, sort_order: i }))
        );
      }
    }

    console.log(`Skip (exists, updated details): ${prop.name}`);
    return;
  }

  const insertRow = {
    owner_id: ownerId,
    name: prop.name,
    type: prop.type,
    address: prop.address,
    latitude: prop.latitude,
    longitude: prop.longitude,
    description: prop.description,
    status: prop.approved ? 'approved' : 'pending',
    is_verified: !!prop.approved,
  };
  if (includeContact) {
    insertRow.contact_name = prop.contact_name;
    insertRow.contact_phone = prop.contact_phone;
  }

  const { data: property, error } = await supabase
    .from('properties')
    .insert(insertRow)
    .select()
    .single();

  if (error) throw error;

  const { data: rooms, error: roomError } = await supabase
    .from('rooms')
    .insert(
      prop.rooms.map((r) => ({
        property_id: property.id,
        label: r.label,
        price: r.price,
        capacity: r.capacity,
        is_available: true,
      }))
    )
    .select();

  if (roomError) throw roomError;

  if (prop.rules?.length) {
    await supabase.from('house_rules').insert(
      prop.rules.map((rule, i) => ({ property_id: property.id, rule, sort_order: i }))
    );
  }

  const images = collectImages(prop.imageDir);
  if (images.length && rooms?.[0]) {
    await uploadImages(ownerId, rooms[0].id, images.slice(0, 8));
    console.log(`  Uploaded ${Math.min(images.length, 8)} images`);
  }

  console.log(`Seeded: ${prop.name} (${prop.approved ? 'approved' : 'pending'}) → ${prop.ownerEmail}`);
}

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server/.env');
    process.exit(1);
  }

  console.log('Seeding DormSafe — one owner per property + admin account…\n');

  await seedAdmin();

  const includeContact = await hasContactColumns();
  if (!includeContact) {
    console.warn(
      'Note: Run supabase/migrations/005_contact_and_receipts.sql in Supabase SQL Editor ' +
        'to enable contact info and payment receipts.\n'
    );
  }

  for (const prop of PROPERTIES) {
    await seedProperty(prop, includeContact);
  }

  console.log('\nDone! Approved listings are visible to students on the map.');
  console.log('Cezar Verbata Dormitory is pending (no permit) — approve via admin when ready.');
  console.log(`\nAdmin login: ${SEED_ADMIN_EMAIL} / ${SEED_ADMIN_PASSWORD}`);
  console.log(`Owner password (all owners): ${DEFAULT_OWNER_PASSWORD}`);
  console.log('Owner emails: see seed output above (owner.*@dormsafe.test)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
