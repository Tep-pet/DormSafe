import { getPublicImageUrl } from '../services/upload.service.js';

export function getPrimaryImage(property) {
  const images = (property.rooms || []).flatMap((r) => r.room_images || []);
  return images.find((i) => i.is_primary) || images[0] || null;
}

export function getPropertyPrimaryImageUrl(property) {
  return getPublicImageUrl(getPrimaryImage(property)?.storage_path) || null;
}

export function flattenRoomImages(property) {
  return (property.rooms || []).flatMap((room) =>
    (room.room_images || []).map((img) => ({
      id: img.id,
      url: getPublicImageUrl(img.storage_path),
    }))
  );
}
