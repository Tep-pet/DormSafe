export const IMAGE_MIN_BYTES = 50 * 1024;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

export function validateImageFile(file, label = 'Image') {
  if (!file) {
    const err = new Error(`${label} is required`);
    err.status = 400;
    throw err;
  }
  if (!file.mimetype?.startsWith('image/')) {
    const err = new Error(`${label} must be an image (JPEG, PNG, or WebP)`);
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
