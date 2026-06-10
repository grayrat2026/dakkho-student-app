// Resend email client for Supabase Edge Functions
// Uses Resend REST API directly (Deno runtime)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || '';

/**
 * Send an email via the Resend API.
 */
export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
): Promise<unknown> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to send email');
  }

  return res.json();
}

/**
 * Send a test email to verify Resend configuration.
 */
export async function sendTestEmail(to: string): Promise<unknown> {
  return sendEmail(
    to,
    'DAKKHO Admin - Test Email',
    '<h1>Test Email</h1><p>This is a test email from DAKKHO Admin Panel.</p>',
  );
}
