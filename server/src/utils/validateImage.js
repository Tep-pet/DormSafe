export const IMAGE_MIN_BYTES = 50 * 1024;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']);

function isAllowedImage(file) {
  const type = (file.mimetype || '').toLowerCase();
  if (type.startsWith('image/')) return true;
  const ext = (file.originalname || '').split('.').pop()?.toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

export function validateImageFile(file, label = 'Image') {
  if (!file) {
    const err = new Error(`${label} is required`);
    err.status = 400;
    throw err;
  }
  if (!isAllowedImage(file)) {
    const err = new Error(`${label} must be an image (JPG, JPEG, PNG, WebP, or HEIC)`);
    err.status = 400;
    throw err;
  }
  if (file.size < IMAGE_MIN_BYTES) {
    const err = new Error(`${label} must be at least 50 KB`);
    err.status = 400;
    throw err;
  }
  if (file.size > IMAGE_MAX_BYTES) {
    const err = new Error(`${label} must be 5 MB or smaller`);
    err.status = 400;
    throw err;
  }
}
