import nodemailer from 'nodemailer';

function smtpConfig() {
  const host = (process.env.SMTP_HOST || '').trim();
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();
  if (!host || !user || !pass) return null;
  return {
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === '1',
    auth: { user, pass },
    from: (process.env.SMTP_FROM || user).trim(),
  };
}

/** Real inboxes only. Seed addresses such as owner@dormsafe.test are skipped. */
export function canEmail(address) {
  if (!address || !address.includes('@')) return false;
  return !/@dormsafe\.test$/i.test(address.trim());
}

/**
 * Send the same notice as the in-app bell.
 * Missing SMTP settings or a non-deliverable address do not fail the request.
 */
export async function sendAccountEmail(to, subject, text) {
  if (!canEmail(to)) return { sent: false, reason: 'undeliverable' };
  const config = smtpConfig();
  if (!config) return { sent: false, reason: 'smtp_not_configured' };

  try {
    const transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });
    await transport.sendMail({
      from: config.from,
      to: to.trim(),
      subject,
      text,
    });
    return { sent: true };
  } catch (err) {
    console.warn('DormSafe email failed:', err.message);
    return { sent: false, reason: 'send_failed' };
  }
}
