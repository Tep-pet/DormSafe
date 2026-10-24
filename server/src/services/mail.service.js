import nodemailer from 'nodemailer';

function smtpConfig() {
  const host = (process.env.SMTP_HOST || '').trim();
  const user = (process.env.SMTP_USER || '').trim();
  // Strip any accidental spaces from Google App Password (e.g. "abcd efgh ijkl mnop")
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '').trim();
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT) || 465;
  const isSecure = process.env.SMTP_SECURE === '1' || port === 465;

  return {
    host,
    port,
    secure: isSecure,
    auth: { user, pass },
    from: (process.env.SMTP_FROM || `DormSafe <${user}>`).trim(),
  };
}

/** Real inboxes only. Seed addresses such as owner@dormsafe.test are skipped. */
export function canEmail(address) {
  if (!address || !address.includes('@')) return false;
  return !/@dormsafe\.test$/i.test(address.trim());
}

/**
 * Send notification email via SMTP (e.g. Gmail).
 * Supports both text and optional html body.
 * Failures are caught and logged without crashing the caller.
 */
export async function sendAccountEmail(to, subject, text, html = null) {
  if (!canEmail(to)) {
    console.log(`[DormSafe Mail] Skipped test/non-deliverable email address: ${to}`);
    return { sent: false, reason: 'undeliverable' };
  }
  const config = smtpConfig();
  if (!config) {
    console.warn('[DormSafe Mail] SMTP not configured in environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS).');
    return { sent: false, reason: 'smtp_not_configured' };
  }

  try {
    const transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });

    const mailOptions = {
      from: config.from,
      to: to.trim(),
      subject,
      text,
    };
    if (html) {
      mailOptions.html = html;
    }

    const info = await transport.sendMail(mailOptions);
    console.log(`[DormSafe Mail] Email successfully sent to ${to.trim()} (MessageID: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[DormSafe Mail] Failed to send email to ${to.trim()}:`, err.message);
    return { sent: false, reason: 'send_failed', error: err.message };
  }
}
