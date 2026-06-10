import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendEmail(to: string | string[], subject: string, html: string) {
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject,
    html,
  });
}

export async function sendTestEmail(to: string) {
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: 'DAKKHO Admin - Test Email',
    html: '<h1>Test Email</h1><p>This is a test email from DAKKHO Admin Panel.</p>',
  });
}

export { resend };
