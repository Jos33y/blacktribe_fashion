import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = new Resend(env.resendApiKey);

/**
 * Send a transactional email via Resend.
 * Returns { id } on success, throws on failure.
 */
export async function sendEmail({ to, subject, html }) {
  if (!env.resendApiKey) {
    console.warn('[email] RESEND_API_KEY not set. Skipping email.');
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: env.resendFrom,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      console.error('[email] Resend error:', error);
      throw new Error(error.message || 'Email send failed');
    }

    console.log(`[email] Sent "${subject}" to ${to} | ID: ${data.id}`);
    return data;
  } catch (err) {
    console.error('[email] Failed to send:', err.message);
    // Don't throw — email failure should never block the purchase flow
    return null;
  }
}
