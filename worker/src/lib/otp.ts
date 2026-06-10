// /worker/src/lib/otp.ts

import { Resend } from 'resend';

interface OTPCode {
  id: number;
  target: string;
  code: string;
  type: string;
  expires_at: string;
  verified: number;
  attempts: number;
  created_at: string;
}

const OTP_EXPIRY_MINUTES = 10;
const MAX_VERIFY_ATTEMPTS = 5;

export function generateOTPCode(): string {
  // Generate a cryptographically secure 6-digit code
  const array = new Uint8Array(4);
  crypto.getRandomValues(array);
  const num = (array[0] << 24 | array[1] << 16 | array[2] << 8 | array[3]) >>> 0;
  return (num % 900000 + 100000).toString();
}

export async function createAndSendOTP(
  db: D1Database,
  target: string,
  type: 'email' | 'phone',
  resendApiKey?: string,
  resendFromEmail?: string
): Promise<{ success: boolean; message: string; expiresAt: string }> {
  // Check if there's a recent OTP sent within last 60 seconds
  const recent = await db.prepare(
    "SELECT * FROM otp_codes WHERE target = ? AND created_at > datetime('now', '-60 seconds') AND verified = 0"
  ).bind(target).first();

  if (recent) {
    return { success: false, message: 'OTP already sent. Please wait 60 seconds.', expiresAt: (recent as any).expires_at };
  }

  const code = generateOTPCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  // Store in D1
  await db.prepare(
    'INSERT INTO otp_codes (target, code, type, expires_at) VALUES (?, ?, ?, ?)'
  ).bind(target, code, type, expiresAt).run();

  // Send via email if type is email
  if (type === 'email' && resendApiKey && resendFromEmail) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: resendFromEmail,
          to: target,
          subject: 'DAKKHO - আপনার ভেরিফিকেশন কোড',
          html: `
            <div style="font-family: 'Nunito', sans-serif; max-width: 480px; margin: 0 auto; background: #0F0F1A; border-radius: 16px; padding: 40px; text-align: center;">
              <h1 style="color: #0ea5e9; font-size: 28px; margin-bottom: 8px;">DAKKHO</h1>
              <p style="color: #94a3b8; margin-bottom: 24px;">আপনার ভেরিফিকেশন কোড</p>
              <div style="background: rgba(14,165,233,0.1); border: 2px dashed #0ea5e9; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <span style="font-size: 36px; font-weight: 800; color: #0ea5e9; letter-spacing: 8px;">${code}</span>
              </div>
              <p style="color: #64748b; font-size: 14px; margin-top: 20px;">এই কোডটি ${OTP_EXPIRY_MINUTES} মিনিটের জন্য বৈধ।</p>
              <p style="color: #475569; font-size: 12px; margin-top: 12px;">আপনি এই অনুরোধ করেননি? এই ইমেইলটি উপেক্ষা করুন।</p>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        console.error('Failed to send OTP email:', await response.text());
        return { success: false, message: 'Failed to send OTP email', expiresAt };
      }
    } catch (error) {
      console.error('OTP email send error:', error);
      return { success: false, message: 'Failed to send OTP email', expiresAt };
    }
  }

  // For phone OTP, we'd integrate an SMS provider here
  if (type === 'phone') {
    // TODO: Integrate SMS provider (e.g., Twilio, BulkSMSBD)
    console.log(`Phone OTP for ${target}: ${code} (SMS not yet configured)`);
  }

  return { success: true, message: 'OTP sent successfully', expiresAt };
}

export async function verifyOTP(
  db: D1Database,
  target: string,
  code: string
): Promise<{ valid: boolean; message: string }> {
  // Find the most recent unverified OTP for this target
  const otp = await db.prepare(
    "SELECT * FROM otp_codes WHERE target = ? AND verified = 0 AND expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1"
  ).bind(target).first() as OTPCode | null;

  if (!otp) {
    return { valid: false, message: 'No valid OTP found. Please request a new one.' };
  }

  // Check attempts
  if (otp.attempts >= MAX_VERIFY_ATTEMPTS) {
    // Mark as used up
    await db.prepare('UPDATE otp_codes SET verified = -1 WHERE id = ?').bind(otp.id).run();
    return { valid: false, message: 'Too many attempts. Please request a new OTP.' };
  }

  // Increment attempts
  await db.prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?').bind(otp.id).run();

  // Check code
  if (otp.code !== code) {
    return { valid: false, message: `Invalid OTP. ${MAX_VERIFY_ATTEMPTS - otp.attempts - 1} attempts remaining.` };
  }

  // Mark as verified
  await db.prepare('UPDATE otp_codes SET verified = 1 WHERE id = ?').bind(otp.id).run();

  // Invalidate all other OTPs for this target
  await db.prepare("UPDATE otp_codes SET verified = -1 WHERE target = ? AND verified = 0 AND id != ?").bind(target, otp.id).run();

  return { valid: true, message: 'OTP verified successfully' };
}

// Clean up expired OTPs (called periodically)
export async function cleanupExpiredOTPs(db: D1Database): Promise<number> {
  const result = await db.prepare(
    "DELETE FROM otp_codes WHERE expires_at < datetime('now', '-1 hour')"
  ).run();
  return result.meta.changes;
}
