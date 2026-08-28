import { supabaseAdmin } from '../config/supabase.js';
import { createAccountVerification } from './accountVerification.service.js';
import { isValidEmail, validateImageFile } from '../utils/validateImage.js';

export async function registerUser({ fullName, email, password, role, idFile, licenseFile }) {
  if (!fullName?.trim()) {
    const err = new Error('Full name is required');
    err.status = 400;
    throw err;
  }
  if (!isValidEmail(email)) {
    const err = new Error('Please enter a valid email address');
    err.status = 400;
    throw err;
  }
  if (!password || password.length < 6) {
    const err = new Error('Password must be at least 6 characters');
    err.status = 400;
    throw err;
  }
  if (!['student', 'owner'].includes(role)) {
    const err = new Error('Invalid role');
    err.status = 400;
    throw err;
  }

  validateImageFile(idFile, 'ID photo');
  if (role === 'owner') {
    validateImageFile(licenseFile, 'Business license/permit');
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName.trim(), role },
  });

  if (authError) {
    const err = new Error(authError.message);
    err.status = 400;
    throw err;
  }

  const userId = authData.user.id;

  await new Promise((r) => setTimeout(r, 300));

  await createAccountVerification(userId, { idFile, licenseFile, role });

  return { userId, email: email.trim().toLowerCase(), role };
}
