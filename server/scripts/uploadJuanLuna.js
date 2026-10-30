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
const imagesDir = path.join(ROOT, 'Places/place2');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const propertyId = '1965b0c6-b3d0-4549-9b28-8e84d5e92936';
  const ownerId = 'a12a011b-7536-4f59-93c1-789c4aa45a64'; // Jerly Ugapay (jerlyugapay@gmail.com)

  // 1. Update property name to Juan Luna Boarding House
  const { error: updateError } = await supabase
    .from('properties')
    .update({ name: 'Juan Luna Boarding House' })
    .eq('id', propertyId);

  if (updateError) {
    console.error('Error updating name:', updateError);
  } else {
    console.log('Updated property name to Juan Luna Boarding House');
  }

  // 2. Fetch rooms
  const { data: rooms, error: roomError } = await supabase
    .from('rooms')
    .select('id, label')
    .eq('property_id', propertyId);

  if (roomError || !rooms?.length) {
    console.error('No rooms found', roomError);
    return;
  }
  console.log('Rooms:', rooms.map((r) => `${r.label} (${r.id})`).join(', '));

  // Clear existing room_images for this property's rooms if any
  const roomIds = rooms.map((r) => r.id);
  await supabase.from('room_images').delete().in('room_id', roomIds);

  const imageFiles = [
    'd48a2b12fd49543ee3b1e46627138f6b.JPEG', // exterior front gate
    '0bd910ee2e31ff02f5622ae225df46e0.JPEG', // hallway
    '209154d4a3ce82e92c0af91a855c9a75.JPEG', // dining
    'abb73c0aba1b2c96a3c886dc4929b527.JPEG', // stairs / second floor walkway
    '03263a8fe84de06f580f7e40045e3f54.JPEG', // side exterior
    'b5be1c3bf9ccc7c3a2941d49d58f3564.JPEG', // bedroom
  ];

  const primaryRoom = rooms.find((r) => r.label === 'Standard') || rooms[0];

  for (let i = 0; i < imageFiles.length; i++) {
    const filename = imageFiles[i];
    const filePath = path.join(imagesDir, filename);
    const buffer = fs.readFileSync(filePath);
    const storagePath = `${ownerId}/${primaryRoom.id}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('room-images')
      .upload(storagePath, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error(`Error uploading ${filename}:`, uploadError);
      continue;
    }

    const { error: insertError } = await supabase.from('room_images').insert({
      room_id: primaryRoom.id,
      storage_path: storagePath,
      is_primary: i === 0,
    });

    if (insertError) {
      console.error(`Error inserting room_images for ${filename}:`, insertError);
    } else {
      console.log(`Attached ${filename} to room ${primaryRoom.label} (primary: ${i === 0})`);
    }
  }

  // Also attach the bedroom and exterior pictures to the other rooms
  for (const room of rooms) {
    if (room.id === primaryRoom.id) continue;
    const bedroomFile = 'b5be1c3bf9ccc7c3a2941d49d58f3564.JPEG';
    const filePath = path.join(imagesDir, bedroomFile);
    const buffer = fs.readFileSync(filePath);
    const storagePath = `${ownerId}/${room.id}/${bedroomFile}`;

    await supabase.storage
      .from('room-images')
      .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });

    await supabase.from('room_images').insert({
      room_id: room.id,
      storage_path: storagePath,
      is_primary: true,
    });
    console.log(`Attached bedroom to room ${room.label}`);
  }

  console.log('Successfully completed image setup for Juan Luna Boarding House!');
}

run().catch(console.error);
