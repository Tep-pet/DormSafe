import { supabaseAdmin } from '../config/supabase.js';
import { createAccountVerification } from './accountVerification.service.js';
import { isValidEmail, validateImageFile } from '../utils/validateImage.js';
import { sendAccountEmail } from './mail.service.js';

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

export async function requestPasswordReset(email, clientOrigin) {
  if (!email || !isValidEmail(email)) {
    const err = new Error('Please enter a valid email address');
    err.status = 400;
    throw err;
  }

  const cleanEmail = email.trim().toLowerCase();
  const origin = clientOrigin || process.env.CORS_ORIGIN || 'https://dormsafe.vercel.app';
  const redirectTo = `${origin.replace(/\/$/, '')}/reset-password`;

  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
      options: { redirectTo },
    });

    if (error) {
      console.warn(`[Password Reset] Generate link failed for ${cleanEmail}:`, error.message);
      return { sent: true };
    }

    const resetLink = data?.properties?.action_link;
    if (resetLink) {
      const subject = 'Reset Your DormSafe Password';
      const text = `Hello,\n\nYou requested to reset your password for DormSafe - Ateneo Student Housing Platform.\n\nPlease click the link below to set a new password:\n${resetLink}\n\nThis link is valid for 1 hour. If you did not request this, you can safely ignore this email.\n\nBest regards,\nDormSafe Ateneo Team`;

      const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #003366; color: #ffffff; font-weight: bold; font-size: 18px; padding: 10px 18px; border-radius: 8px;">
              DormSafe
            </div>
            <p style="color: #64748b; font-size: 12px; margin-top: 6px; text-transform: uppercase; letter-spacing: 1px;">Ateneo de Davao University</p>
          </div>
          <h2 style="color: #0f172a; font-size: 20px; font-weight: bold; margin-bottom: 12px;">Reset Your Password</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            We received a request to reset the password for your DormSafe account (<strong>${cleanEmail}</strong>). Click the button below to choose a new password.
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetLink}" style="display: inline-block; background-color: #003366; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 51, 102, 0.2);">
              Reset Password
            </a>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-bottom: 16px;">
            This link is valid for <strong>1 hour</strong>. If the button above doesn't work, copy and paste this URL into your browser:<br/>
            <a href="${resetLink}" style="color: #003366; word-break: break-all;">${resetLink}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 11px; text-align: center;">
            If you did not request a password reset, no further action is required. Your account remains secure.
          </p>
        </div>
      `;

      await sendAccountEmail(cleanEmail, subject, text, html);
    }
  } catch (err) {
    console.error('[Password Reset] Error generating reset link:', err.message);
  }

  return { sent: true };
}
