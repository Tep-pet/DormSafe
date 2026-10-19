export const IMAGE_MIN_BYTES = 50 * 1024;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']);

export const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif';

function isAllowedImage(file) {
  const type = (file.type || '').toLowerCase();
  if (type.startsWith('image/')) return true;
  const ext = (file.name || '').split('.').pop()?.toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

export function validateImageFile(file, label = 'Image') {
  if (!file) return `${label} is required`;
  if (!isAllowedImage(file)) {
    return `${label} must be an image (JPG, JPEG, PNG, WebP, or HEIC)`;
  }
  if (file.size < IMAGE_MIN_BYTES) {
    return `${label} must be at least 50 KB`;
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return `${label} must be 5 MB or smaller`;
  }
  return '';
}
