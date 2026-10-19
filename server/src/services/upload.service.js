import { randomUUID } from 'crypto';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';
import { assertRoomOwnedBy } from '../utils/ownership.js';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif']);

export function getPublicImageUrl(storagePath) {
  if (!storagePath) return null;
  return `${env.supabaseUrl}/storage/v1/object/public/room-images/${storagePath}`;
}

export async function uploadPermit(file, ownerId) {
  const ext = file.originalname.split('.').pop() || 'pdf';
  const path = `${ownerId}/permit-${Date.now()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from('permits')
    .upload(path, file.buffer, { contentType: file.mimetype });

  if (error) throw error;

  const { data, error: dbError } = await supabaseAdmin
    .from('owner_verifications')
    .insert({ owner_id: ownerId, permit_storage_path: path, status: 'pending' })
    .select()
    .single();

  if (dbError) throw dbError;
  return data;
}

export async function uploadRoomImages(files, roomId, ownerId) {
  if (!files?.length) {
    const err = new Error('No images provided');
    err.status = 400;
    throw err;
  }

  await assertRoomOwnedBy(roomId, ownerId);

  const { count } = await supabaseAdmin
    .from('room_images')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', roomId);

  const existingCount = count || 0;
  const uploaded = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const rawExt = (file.originalname.split('.').pop() || '').toLowerCase();
    const typeOk = file.mimetype?.startsWith('image/') || IMAGE_EXTENSIONS.has(rawExt);
    if (!typeOk) {
      const err = new Error('Only image files are allowed (JPG, JPEG, PNG, WebP, or HEIC)');
      err.status = 400;
      throw err;
    }

    const ext = IMAGE_EXTENSIONS.has(rawExt) ? rawExt : 'jpg';
    const storagePath = `${ownerId}/${roomId}/${randomUUID()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('room-images')
      .upload(storagePath, file.buffer, { contentType: file.mimetype });

    if (uploadError) throw uploadError;

    const { data, error: dbError } = await supabaseAdmin
      .from('room_images')
      .insert({
        room_id: roomId,
        storage_path: storagePath,
        is_primary: existingCount === 0 && i === 0,
      })
      .select()
      .single();

    if (dbError) throw dbError;
    uploaded.push({ ...data, url: getPublicImageUrl(storagePath) });
  }

  return uploaded;
}
