export const IMAGE_MIN_BYTES = 50 * 1024;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file, label = 'Image') {
  if (!file) return `${label} is required`;
  if (!file.type.startsWith('image/')) {
    return `${label} must be an image (JPEG, PNG, or WebP)`;
  }
  if (file.size < IMAGE_MIN_BYTES) {
    return `${label} must be at least 50 KB`;
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return `${label} must be 5 MB or smaller`;
  }
  return '';
}
