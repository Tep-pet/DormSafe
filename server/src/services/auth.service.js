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

const EMAIL_ALIASES = {
  'stephanie.palima@addu.edu.ph': 'sgpalima@addu.edu.ph',
  'samantha.aguirre@addu.edu.ph': 'lssaguirre@addu.edu.ph',
  'franshiska.pacatang@addu.edu.ph': 'fmppacatang@addu.edu.ph',
  'sgpalima@addu.edu.ph': 'stephanie.palima@addu.edu.ph',
  'lssaguirre@addu.edu.ph': 'samantha.aguirre@addu.edu.ph',
  'fmppacatang@addu.edu.ph': 'franshiska.pacatang@addu.edu.ph',
};

export async function requestPasswordReset(email, clientOrigin) {
  if (!email || !isValidEmail(email)) {
    const err = new Error('Please enter a valid email address');
    err.status = 400;
    throw err;
  }

  const cleanEmail = email.trim().toLowerCase();
  const origin = clientOrigin || process.env.CORS_ORIGIN || 'https://dormsafe.vercel.app';
  const redirectTo = `${origin.replace(/\/$/, '')}/reset-password`;

  // Candidate emails to try in Supabase Auth (e.g. primary and aliases)
  const candidateEmails = [cleanEmail];
  if (EMAIL_ALIASES[cleanEmail] && !candidateEmails.includes(EMAIL_ALIASES[cleanEmail])) {
    candidateEmails.push(EMAIL_ALIASES[cleanEmail]);
  }

  let activeEmail = null;
  let tokenHash = null;
  let emailOtp = null;

  for (const cand of candidateEmails) {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: cand,
        options: { redirectTo },
      });

      if (!error && (data?.properties?.hashed_token || data?.properties?.action_link)) {
        tokenHash = data.properties.hashed_token;
        emailOtp = data.properties.email_otp;
        activeEmail = cand;
        break;
      }
    } catch {
      // try next candidate
    }
  }

  if (!tokenHash && !emailOtp) {
    const notFoundErr = new Error(
      `No DormSafe account found for ${cleanEmail}. Please check the spelling or sign up for a new account.`
    );
    notFoundErr.status = 404;
    throw notFoundErr;
  }

  // Construct direct link to our frontend reset page with token_hash and email
  const baseResetUrl = `${origin.replace(/\/$/, '')}/reset-password`;
  const directResetUrl = `${baseResetUrl}?email=${encodeURIComponent(cleanEmail)}&code=${emailOtp || ''}`;
  const resetLink = tokenHash
    ? `${baseResetUrl}?token_hash=${tokenHash}&type=recovery&email=${encodeURIComponent(cleanEmail)}`
    : directResetUrl;

  const subject = `Your DormSafe Verification Code: ${emailOtp || 'Password Reset'}`;
  const text = `Hello,\n\nYou requested to reset your password for DormSafe - Ateneo Student Housing Platform.\n\nYour One-Time Verification Code is: ${emailOtp || 'N/A'}\n\nEnter this code on the DormSafe reset page to create your new password.\n\nYou can also click the link below to open the reset page directly:\n${directResetUrl}\n\nThis code is valid for 1 hour. If you did not request this, you can safely ignore this email.\n\nBest regards,\nDormSafe Ateneo Team`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background-color: #003366; color: #ffffff; font-weight: bold; font-size: 18px; padding: 10px 20px; border-radius: 10px; letter-spacing: 0.5px;">
          DormSafe
        </div>
        <p style="color: #64748b; font-size: 11px; margin-top: 6px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Ateneo de Davao University</p>
      </div>

      <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-bottom: 8px; text-align: center;">Password Reset Code</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
        We received a request to reset the password for your DormSafe account (<strong style="color: #0f172a;">${cleanEmail}</strong>).
      </p>

      ${emailOtp ? `
      <div style="background-color: #f8fafc; border: 2px dashed #003366; border-radius: 14px; padding: 24px 16px; margin: 24px 0; text-align: center;">
        <p style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 10px 0;">Your Verification Code</p>
        <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 38px; font-weight: 800; color: #003366; letter-spacing: 8px; margin: 6px 0;">
          ${emailOtp}
        </div>
        <p style="color: #64748b; font-size: 12px; margin: 12px 0 0 0;">Type this code on the DormSafe verification screen to set your new password.</p>
      </div>
      ` : ''}

      <div style="text-align: center; margin: 24px 0 20px 0;">
        <a href="${directResetUrl}" style="display: inline-block; background-color: #003366; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(0, 51, 102, 0.2);">
          Open DormSafe Reset Page
        </a>
      </div>

      <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-bottom: 16px; text-align: center;">
        This code is valid for <strong>1 hour</strong>.
      </p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
        If you did not request a password reset, you can safely disregard this email. Your account remains secure.
      </p>
    </div>
  `;

  // Dispatch to the requested email
  const mailResult = await sendAccountEmail(cleanEmail, subject, text, html);

  // If requested email differs from auth activeEmail (alias), also dispatch to activeEmail
  if (activeEmail && activeEmail !== cleanEmail) {
    await sendAccountEmail(activeEmail, subject, text, html).catch(() => {});
  }

  if (!mailResult.sent) {
    console.error(`[Password Reset] Failed to send email to ${cleanEmail}:`, mailResult.reason, mailResult.error);
    const sendErr = new Error(
      mailResult.error || 'Failed to dispatch password reset email. Please check your spam folder or contact support.'
    );
    sendErr.status = 502;
    throw sendErr;
  }

  return {
    sent: true,
    email: cleanEmail,
    message: 'Verification code has been sent to your email. Please check your inbox.',
  };
}

export async function resetPasswordWithCode({ email, code, newPassword }) {
  const cleanEmail = email?.trim().toLowerCase();
  const cleanCode = code?.trim().replace(/\s+/g, '');
  const pass = newPassword?.trim();

  if (!cleanEmail || !cleanCode) {
    const err = new Error('Email and verification code are required.');
    err.status = 400;
    throw err;
  }

  if (!pass || pass.length < 6) {
    const err = new Error('Password must be at least 6 characters long.');
    err.status = 400;
    throw err;
  }

  const candidateEmails = [cleanEmail];
  if (EMAIL_ALIASES[cleanEmail] && !candidateEmails.includes(EMAIL_ALIASES[cleanEmail])) {
    candidateEmails.push(EMAIL_ALIASES[cleanEmail].toLowerCase());
  }

  let verifiedUser = null;
  let lastError = null;

  for (const cand of candidateEmails) {
    try {
      const { data, error } = await supabaseAdmin.auth.verifyOtp({
        email: cand,
        token: cleanCode,
        type: 'recovery',
      });

      if (!error && data?.user) {
        verifiedUser = data.user;
        break;
      }
      if (error) lastError = error;
    } catch (err) {
      lastError = err;
    }
  }

  if (!verifiedUser) {
    const isExpired = lastError?.message?.toLowerCase().includes('expired');
    const err = new Error(
      isExpired
        ? 'Verification code has expired. Please request a new code.'
        : 'Invalid verification code. Please check the code sent to your email.'
    );
    err.status = 400;
    throw err;
  }

  // Update user password directly using admin client to guarantee success
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    verifiedUser.id,
    { password: pass, email_confirm: true }
  );

  if (updateError) {
    const err = new Error(updateError.message || 'Failed to update password.');
    err.status = 500;
    throw err;
  }

  return {
    success: true,
    email: cleanEmail,
    message: 'Your password has been successfully updated. You can now sign in.',
  };
}

