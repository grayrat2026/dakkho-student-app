/**
 * Password hashing and verification for Cloudflare Workers
 * Uses PBKDF2 with SHA-256 via Web Crypto API
 *
 * All users are now in D1 — no more Appwrite auth fallback.
 */

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16; // bytes
const KEY_LENGTH = 256; // bits

/**
 * Hash a plaintext password using PBKDF2-SHA256
 * Returns format: "saltHex:hashHex"
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH
  );

  const saltHex = bufferToHex(salt);
  const hashHex = bufferToHex(new Uint8Array(derivedBits));
  return `${saltHex}:${hashHex}`;
}

/**
 * Verify a plaintext password against a stored hash
 * storedHash format: "saltHex:hashHex"
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;

  const [saltHex, hashHex] = parts;
  if (!saltHex || !hashHex) return false;

  const salt = hexToBuffer(saltHex);
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH
  );

  const computedHash = bufferToHex(new Uint8Array(derivedBits));

  // Constant-time comparison to prevent timing attacks
  return constantTimeEqual(computedHash, hashHex);
}

/**
 * Authenticate a user — D1 only, no Appwrite fallback
 *
 * Returns { success, userId, userName, userEmail, userRole, avatarUrl, needsMigration }
 */
export async function authenticateUser(
  env: any,
  email: string,
  password: string
): Promise<{
  success: boolean;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  avatarUrl?: string;
  prefs?: Record<string, unknown>;
  needsMigration?: boolean;
}> {
  // Look up user in D1
  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).bind(email).first();

  if (!user) {
    return { success: false };
  }

  const u = user as any;

  // Check if password exists
  if (!u.password_hash) {
    return { success: false };
  }

  // If password not yet migrated (legacy Appwrite user without D1 password)
  // They need to reset their password
  if (u.password_migrated === 0) {
    // Try to verify with the stored hash anyway — it might have been set during migration
    const valid = await verifyPassword(password, u.password_hash);
    if (valid) {
      // Mark as migrated
      await env.DB.prepare(
        'UPDATE users SET password_migrated = 1, updated_at = ? WHERE id = ?'
      ).bind(new Date().toISOString(), u.id).run();

      return {
        success: true,
        userId: u.id,
        userName: u.name || u.full_name || '',
        userEmail: u.email,
        userRole: u.role || 'student',
        avatarUrl: u.avatar_url || '',
        needsMigration: true,
      };
    }
    return { success: false };
  }

  // Fully migrated — verify with D1 password hash
  const valid = await verifyPassword(password, u.password_hash);
  if (!valid) {
    return { success: false };
  }

  return {
    success: true,
    userId: u.id,
    userName: u.name || u.full_name || '',
    userEmail: u.email,
    userRole: u.role || 'student',
    avatarUrl: u.avatar_url || '',
    needsMigration: false,
  };
}

// ─── Helpers ───

function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
