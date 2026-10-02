const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

export function emailValidationMessage(email) {
  if (!email?.trim()) return 'Email is required';
  if (!isValidEmail(email)) return 'Please enter a valid email address';
  return '';
}
