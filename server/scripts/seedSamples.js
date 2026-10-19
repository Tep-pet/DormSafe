/**
 * DormSafe Sample Data Seeder
 *
 * Populates realistic sample data connecting the 5 students with
 * the existing property owners and their listings:
 * - 5 Students: Stephanie Palima, Samantha Aguirre, Franshiska Pacatang, Zhea Zafra, Rachel Tan
 * - Existing property owners: Jerly Ugapay, Williamor Corpuz, Trisha Paula Gwatwo, May Andaya, etc.
 *
 * Seeded collections:
 * 1. Tenants (active student stays)
 * 2. Room availability updates
 * 3. Payment history (paid, pending, overdue)
 * 4. Maintenance requests (open, in_progress, resolved)
 * 5. Room reservations (upcoming stays)
 * 6. Room inquiries (pending, accepted, declined applications)
 * 7. Property reviews (approved star ratings & pending for admin moderation)
 * 8. Saved listings (bookmarks)
 * 9. In-app notifications
 *
 * Usage: npm run seed:samples (from server/)
 */
import dotenv from 'dotenv';
dotenv.config();

if (process.env.SUPABASE_INSECURE_SSL === '1') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEFAULT_STUDENT_PASSWORD = process.env.SEED_STUDENT_PASSWORD || 'Student123!';

// The 5 requested students
const STUDENTS_CONFIG = [
  {
    name: 'Stephanie Palima',
    email: 'stephanie.palima@addu.edu.ph',
    altEmails: [],
    contact: '0917-234-5678',
  },
  {
    name: 'Samantha Aguirre',
    email: 'samantha.aguirre@addu.edu.ph',
    altEmails: [],
    contact: '0928-876-5432',
  },
  {
    name: 'Franshiska Pacatang',
    email: 'franshiska.pacatang@addu.edu.ph',
    altEmails: [],
    contact: '0939-555-4321',
  },
  {
    name: 'Zhea Zafra',
    email: 'zhea.zafra@addu.edu.ph',
    altEmails: [],
    contact: '0947-333-8899',
  },
  {
    name: 'Rachel Tan',
    email: 'rachel.tan@addu.edu.ph',
    altEmails: [],
    contact: '0995-111-2233',
  },
];

async function getOrCreateStudent(config) {
  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;

  const usersList = list?.users || [];
  let primaryUser = usersList.find((u) => u.email?.toLowerCase() === config.email.toLowerCase());

  // Create primary account if it doesn't exist yet
  if (!primaryUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: config.email,
      password: DEFAULT_STUDENT_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: config.name, role: 'student' },
    });
    if (error) throw error;
    primaryUser = data.user;
    console.log(`  + Created primary student account: ${config.name} (${config.email})`);
  } else {
    await supabase.auth.admin.updateUserById(primaryUser.id, {
      password: DEFAULT_STUDENT_PASSWORD,
      user_metadata: { full_name: config.name, role: 'student' },
    });
    console.log(`  ✓ Updated primary student account: ${config.name} (${config.email})`);
  }

  await supabase.from('profiles').upsert({
    id: primaryUser.id,
    email: primaryUser.email,
    full_name: config.name,
    role: 'student',
    verification_status: 'approved',
    updated_at: new Date().toISOString(),
  });

  // Also sync any alternate accounts previously used by the user
  for (const altEmail of config.altEmails) {
    const altUser = usersList.find((u) => u.email?.toLowerCase() === altEmail.toLowerCase());
    if (altUser) {
      await supabase.auth.admin.updateUserById(altUser.id, {
        password: DEFAULT_STUDENT_PASSWORD,
        user_metadata: { full_name: config.name, role: 'student' },
      });
      await supabase.from('profiles').upsert({
        id: altUser.id,
        email: altUser.email,
        full_name: config.name,
        role: 'student',
        verification_status: 'approved',
        updated_at: new Date().toISOString(),
      });
      console.log(`  ✓ Synced alternate account: ${config.name} (${altEmail})`);
    }
  }

  return {
    id: primaryUser.id,
    email: primaryUser.email,
    name: config.name,
    contact: config.contact,
  };
}

async function loadExistingProperties() {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      id, name, type, status, owner_id, address, contact_name, contact_phone,
      profiles(id, email, full_name),
      rooms(id, label, price, capacity, is_available)
    `);

  if (error) throw error;
  if (!data?.length) {
    throw new Error('No properties found! Please run "npm run seed" first to seed properties.');
  }

  const map = new Map();
  map.allProperties = data;
  for (const p of data) {
    const key = p.name.trim().toLowerCase();
    if (!map.has(key)) {
      map.set(key, p);
    }
    map.set(p.id, p);
  }
  return map;
}

async function main() {
  console.log('====================================================');
  console.log('   DormSafe Sample Data Seeder                     ');
  console.log('====================================================\n');

  // 1. Resolve existing properties & owners (do NOT create new owner accounts)
  console.log('1. Loading existing properties and owners...');
  const propMap = await loadExistingProperties();
  console.log(`   Found ${propMap.allProperties?.length || propMap.size} existing properties.\n`);

  // 2. Resolve / Create the 5 students
  console.log('2. Preparing 5 student accounts...');
  const students = {};
  for (const cfg of STUDENTS_CONFIG) {
    const s = await getOrCreateStudent(cfg);
    students[cfg.name] = s;
  }
  console.log(`   All 5 student profiles verified.\n`);

  const studentIds = Object.values(students).map((s) => s.id);

  const studentNames = STUDENTS_CONFIG.map((c) => c.name);

  // 3. Clean up previously seeded sample records for these students (idempotent run)
  console.log('3. Cleaning up previous sample data for these students...');
  await supabase.from('tenants').delete().in('student_id', studentIds);
  await supabase.from('tenants').delete().in('tenant_name', studentNames);
  await supabase.from('maintenance_requests').delete().in('student_id', studentIds);
  await supabase.from('room_reservations').delete().in('student_id', studentIds);
  await supabase.from('property_reviews').delete().in('student_id', studentIds);
  await supabase.from('saved_listings').delete().in('student_id', studentIds);

  // Clean previous inquiry notifications for these students
  await supabase.from('notifications').delete().in('user_id', studentIds);
  for (const name of studentNames) {
    await supabase.from('notifications').delete().eq('metadata->>student_name', name);
  }
  console.log('   Previous sample records cleared.\n');

  // 4. Seed Active Tenants & Stays
  console.log('4. Seeding active student stays (Tenants)...');
  const juanLuna = propMap.get('juan luna boarding house');
  const correla = propMap.get('correla dormitory');
  const goretti = propMap.get('residencia de maria goretti');
  const brc = propMap.get('brc dormitory');
  const ivory1104 = propMap.get('ivory residences');

  const tenantRecords = [];

  // Tenant 1: Stephanie Palima at Juan Luna Boarding House
  if (juanLuna) {
    const room = juanLuna.rooms.find((r) => r.label.toLowerCase().includes('plus')) || juanLuna.rooms[0];
    const { data: t } = await supabase
      .from('tenants')
      .insert({
        property_id: juanLuna.id,
        room_id: room.id,
        student_id: students['Stephanie Palima'].id,
        tenant_name: 'Stephanie Palima',
        contact: students['Stephanie Palima'].contact,
        move_in_date: '2026-06-15',
        move_out_date: '2027-04-15',
        move_out_confirmed: true,
      })
      .select()
      .single();

    tenantRecords.push({ ...t, room, property: juanLuna, studentKey: 'Stephanie Palima' });
    await supabase.from('rooms').update({ is_available: false }).eq('id', room.id);
  }

  // Tenant 2: Samantha Aguirre at Correla Dormitory
  if (correla) {
    const room = correla.rooms[0];
    const { data: t } = await supabase
      .from('tenants')
      .insert({
        property_id: correla.id,
        room_id: room.id,
        student_id: students['Samantha Aguirre'].id,
        tenant_name: 'Samantha Aguirre',
        contact: students['Samantha Aguirre'].contact,
        move_in_date: '2026-07-01',
        move_out_date: '2027-03-31',
        move_out_confirmed: false,
      })
      .select()
      .single();

    tenantRecords.push({ ...t, room, property: correla, studentKey: 'Samantha Aguirre' });
    await supabase.from('rooms').update({ is_available: false }).eq('id', room.id);
  }

  // Tenant 3: Franshiska Pacatang at Residencia de Maria Goretti
  if (goretti) {
    const room = goretti.rooms.find((r) => r.label === 'Room 2') || goretti.rooms[1] || goretti.rooms[0];
    const { data: t } = await supabase
      .from('tenants')
      .insert({
        property_id: goretti.id,
        room_id: room.id,
        student_id: students['Franshiska Pacatang'].id,
        tenant_name: 'Franshiska Pacatang',
        contact: students['Franshiska Pacatang'].contact,
        move_in_date: '2026-08-01',
        move_out_date: '2027-05-30',
        move_out_confirmed: true,
      })
      .select()
      .single();

    tenantRecords.push({ ...t, room, property: goretti, studentKey: 'Franshiska Pacatang' });
    await supabase.from('rooms').update({ is_available: false }).eq('id', room.id);
  }

  // Tenant 4: Zhea Zafra at BRC Dormitory
  if (brc) {
    const room = brc.rooms[0];
    const { data: t } = await supabase
      .from('tenants')
      .insert({
        property_id: brc.id,
        room_id: room.id,
        student_id: students['Zhea Zafra'].id,
        tenant_name: 'Zhea Zafra',
        contact: students['Zhea Zafra'].contact,
        move_in_date: '2026-09-01',
        move_out_date: '2027-06-30',
        move_out_confirmed: false,
      })
      .select()
      .single();

    tenantRecords.push({ ...t, room, property: brc, studentKey: 'Zhea Zafra' });
    await supabase.from('rooms').update({ is_available: false }).eq('id', room.id);
  }

  console.log(`   Seeded ${tenantRecords.length} active tenant leases.`);

  // 5. Seed Payments for active tenants
  console.log('5. Seeding payment history (paid, pending, overdue)...');
  for (const t of tenantRecords) {
    const price = Number(t.room?.price || 4000);

    // Paid payment 1: August 2026
    await supabase.from('payments').insert({
      tenant_id: t.id,
      amount: price,
      due_date: '2026-08-05',
      paid_date: '2026-08-04',
      status: 'paid',
      notes: 'Rent payment for August 2026 (Bank Transfer confirmed)',
      receipt_storage_path: 'samples/sample-receipt.png',
    });

    // Paid payment 2: September 2026
    await supabase.from('payments').insert({
      tenant_id: t.id,
      amount: price,
      due_date: '2026-09-05',
      paid_date: '2026-09-05',
      status: 'paid',
      notes: 'Rent payment for September 2026 (Cash with official receipt)',
      receipt_storage_path: 'samples/sample-receipt.png',
    });

    // Pending payment 3: October 2026
    await supabase.from('payments').insert({
      tenant_id: t.id,
      amount: price,
      due_date: '2026-10-25',
      paid_date: null,
      status: 'pending',
      notes: 'Current billing period rent payment',
    });
  }
  console.log(`   Seeded payments for all active tenants.\n`);

  // 6. Seed Maintenance Requests
  console.log('6. Seeding maintenance tickets...');
  const stephStay = tenantRecords.find((t) => t.studentKey === 'Stephanie Palima');
  if (stephStay) {
    await supabase.from('maintenance_requests').insert({
      tenant_id: stephStay.id,
      property_id: stephStay.property.id,
      room_id: stephStay.room.id,
      student_id: stephStay.student_id,
      description: 'Air conditioning water drainage hose is dripping onto the outside ledge. Requesting a technician to clean and reposition the hose.',
      status: 'in_progress',
    });
  }

  const samStay = tenantRecords.find((t) => t.studentKey === 'Samantha Aguirre');
  if (samStay) {
    await supabase.from('maintenance_requests').insert({
      tenant_id: samStay.id,
      property_id: samStay.property.id,
      room_id: samStay.room.id,
      student_id: samStay.student_id,
      description: 'Study desk overhead LED lamp stopped working. Requesting bulb replacement.',
      status: 'resolved',
    });
  }

  const franStay = tenantRecords.find((t) => t.studentKey === 'Franshiska Pacatang');
  if (franStay) {
    await supabase.from('maintenance_requests').insert({
      tenant_id: franStay.id,
      property_id: franStay.property.id,
      room_id: franStay.room.id,
      student_id: franStay.student_id,
      description: 'Bathroom shower hot water dial is loose and needs tightening.',
      status: 'open',
    });
  }
  console.log('   Seeded maintenance tickets (open, in_progress, resolved).\n');

  // 7. Seed Room Reservations (Queue & Advance Booking)
  console.log('7. Seeding room reservations...');
  if (juanLuna) {
    // Rachel Tan reserves Standard Plus starting May 1, 2027 (after Stephanie moves out)
    const room = juanLuna.rooms.find((r) => r.label.toLowerCase().includes('plus')) || juanLuna.rooms[0];
    await supabase.from('room_reservations').insert({
      room_id: room.id,
      property_id: juanLuna.id,
      student_id: students['Rachel Tan'].id,
      reserved_start_date: '2027-05-01',
      status: 'pending',
    });
  }

  if (goretti) {
    // Zhea Zafra reserves Room 2 starting June 1, 2027 (after Franshiska moves out)
    const room = goretti.rooms.find((r) => r.label === 'Room 2') || goretti.rooms[1] || goretti.rooms[0];
    await supabase.from('room_reservations').insert({
      room_id: room.id,
      property_id: goretti.id,
      student_id: students['Zhea Zafra'].id,
      reserved_start_date: '2027-06-01',
      status: 'pending',
    });
  }
  console.log('   Seeded advance room reservations.\n');

  // 8. Seed Room Inquiries / Booking Requests (Notifications with kind = 'room_request')
  console.log('8. Seeding room inquiries & booking applications...');
  const rachel = students['Rachel Tan'];

  // Inquiry 1: Rachel Tan pending inquiry at Juan Luna Boarding House
  if (juanLuna) {
    const room = juanLuna.rooms.find((r) => r.label.toLowerCase().includes('standard')) || juanLuna.rooms[0];
    const owner = juanLuna.profiles || {};
    const meta = {
      kind: 'room_request',
      status: 'pending',
      property_id: juanLuna.id,
      property_name: juanLuna.name,
      room_id: room.id,
      room_label: room.label,
      student_id: rachel.id,
      student_name: rachel.name,
      student_email: rachel.email,
      owner_id: juanLuna.owner_id,
      owner_name: owner.full_name || 'Jerly Ugapay',
      owner_email: owner.email || 'jerlyugapay@gmail.com',
      move_in_date: '2026-11-01',
      move_out_date: '2027-04-30',
      note: 'Good day Ate Jerly! Inquiring for 2nd semester accommodation. Moving in right after midterms.',
      owner_message: '',
    };

    const body = `${rachel.name} wants to avail this room.\nProperty: ${juanLuna.name}\nUnit: ${room.label}\nMove in: ${meta.move_in_date}\nMove out: ${meta.move_out_date}\nNote: ${meta.note}`;

    // Student notification record (acts as the inquiry ledger)
    const { data: rec } = await supabase
      .from('notifications')
      .insert({
        user_id: rachel.id,
        type: 'room_reserved',
        title: 'Room request sent',
        body,
        metadata: meta,
        read_at: new Date().toISOString(),
      })
      .select()
      .single();

    // Landlord notification record
    await supabase.from('notifications').insert({
      user_id: juanLuna.owner_id,
      type: 'room_reserved',
      title: `New room booking request from ${rachel.name}`,
      body,
      metadata: { ...meta, kind: 'room_request_event', inquiry_id: rec.id },
    });
  }

  // Inquiry 2: Rachel Tan accepted inquiry at BRC Dormitory
  if (brc) {
    const room = brc.rooms[0];
    const owner = brc.profiles || {};
    const meta = {
      kind: 'room_request',
      status: 'accepted',
      property_id: brc.id,
      property_name: brc.name,
      room_id: room.id,
      room_label: room.label,
      student_id: rachel.id,
      student_name: rachel.name,
      student_email: rachel.email,
      owner_id: brc.owner_id,
      owner_name: owner.full_name || 'Trisha Paula Gwatwo',
      owner_email: owner.email || 'buildingblocks_davao@yahoo.com.ph',
      move_in_date: '2026-12-01',
      move_out_date: '2027-05-31',
      note: 'Transferring closer to campus for laboratory classes.',
      owner_message: 'Welcome Rachel! Please bring your 2x2 ID photos and 1-month deposit during check-in.',
    };

    const body = `${rachel.name} wants to avail this room.\nProperty: ${brc.name}\nUnit: ${room.label}\nMove in: ${meta.move_in_date}\nMove out: ${meta.move_out_date}`;

    await supabase.from('notifications').insert({
      user_id: rachel.id,
      type: 'room_reserved',
      title: 'Room request accepted',
      body,
      metadata: meta,
      read_at: new Date().toISOString(),
    });
  }
  console.log('   Seeded pending and accepted room inquiries.\n');

  // 9. Seed Property Reviews
  console.log('9. Seeding student property reviews...');
  const reviewsToSeed = [
    {
      studentKey: 'Stephanie Palima',
      propKey: 'juan luna boarding house',
      rating: 5,
      comment: 'Very convenient location, only 5 minutes walk to Ateneo Jacinto campus. Tita Jerly is very kind and responsive to tenant concerns. Quiet study environment!',
      status: 'approved',
    },
    {
      studentKey: 'Samantha Aguirre',
      propKey: 'correla dormitory',
      rating: 5,
      comment: 'Super safe and quiet along Roxas Avenue. Built-in closets, study desk, and 24/7 CCTV. Strict curfew gives my parents peace of mind.',
      status: 'approved',
    },
    {
      studentKey: 'Franshiska Pacatang',
      propKey: 'residencia de maria goretti',
      rating: 5,
      comment: 'Clean facilities and complete shared kitchen appliances. All-female setup creates a comfortable and respectful study environment.',
      status: 'approved',
    },
    {
      studentKey: 'Zhea Zafra',
      propKey: 'brc dormitory',
      rating: 4,
      comment: 'Spacious rooms with study tables and dependable WiFi. Security protocols are well enforced. Very close to Bonifacio gate.',
      status: 'approved',
    },
    {
      studentKey: 'Rachel Tan',
      propKey: 'ivory residences',
      rating: 5,
      comment: 'Premium condominium living just a short walk to school. High security, quiet study spaces, and excellent amenities.',
      status: 'approved',
    },
    {
      studentKey: 'Stephanie Palima',
      propKey: 'residencia de maria goretti',
      rating: 5,
      comment: 'Visited a classmate here for group study. Very clean hallways, good ventilation, and peaceful environment.',
      status: 'pending', // Pending for admin moderation queue
    },
  ];

  for (const rev of reviewsToSeed) {
    const prop = propMap.get(rev.propKey);
    const stud = students[rev.studentKey];
    if (prop && stud) {
      await supabase.from('property_reviews').insert({
        property_id: prop.id,
        student_id: stud.id,
        rating: rev.rating,
        comment: rev.comment,
        status: rev.status,
      });
    }
  }
  console.log(`   Seeded ${reviewsToSeed.length} student reviews.\n`);

  // 10. Seed Saved Listings (Favorites)
  console.log('10. Seeding saved listings (bookmarks)...');
  const favoritesToSeed = [
    { studentKey: 'Stephanie Palima', props: ['correla dormitory', 'residencia de maria goretti'] },
    { studentKey: 'Samantha Aguirre', props: ['juan luna boarding house', 'ivory residences'] },
    { studentKey: 'Franshiska Pacatang', props: ['brc dormitory', 'juan luna boarding house'] },
    { studentKey: 'Zhea Zafra', props: ['residencia de maria goretti', 'correla dormitory'] },
    { studentKey: 'Rachel Tan', props: ['juan luna boarding house', 'brc dormitory', 'ivory residences'] },
  ];

  let favCount = 0;
  for (const f of favoritesToSeed) {
    const stud = students[f.studentKey];
    for (const pKey of f.props) {
      const prop = propMap.get(pKey);
      if (prop && stud) {
        await supabase.from('saved_listings').upsert(
          { student_id: stud.id, property_id: prop.id },
          { onConflict: 'student_id,property_id' }
        );
        favCount++;
      }
    }
  }
  console.log(`   Seeded ${favCount} saved listing bookmarks.\n`);

  console.log('====================================================');
  console.log('   SEEDING COMPLETED SUCCESSFULLY!                  ');
  console.log('====================================================\n');
  console.log('Student Accounts (Password: Student123!):');
  for (const s of Object.values(students)) {
    console.log(`  - ${s.name.padEnd(20)} | Email: ${s.email}`);
  }
  console.log('\nExisting Owner Accounts (No new accounts created):');
  for (const p of (propMap.allProperties || propMap.values())) {
    console.log(`  - ${p.name.padEnd(30)} | Owner: ${p.profiles?.full_name || 'N/A'} (${p.profiles?.email || 'N/A'})`);
  }
  console.log('\n');
}

main().catch((err) => {
  console.error('\nSeed failed with error:', err);
  process.exit(1);
});
