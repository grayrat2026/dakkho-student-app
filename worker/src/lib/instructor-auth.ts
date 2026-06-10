/**
 * Instructor authentication for DAKKHO Instructor API
 * Validates instructor sessions against D1 instructor_sessions table
 * Also provides composite middleware that accepts instructor OR admin sessions
 */

import type { Env } from '../env';
import { generateId, getSessionExpiry } from './utils';

// ─── Instructor Session CRUD ───

/**
 * Validate an instructor session token
 * Returns authorized status and user info if valid
 */
export async function validateInstructorSession(
  env: Env,
  token: string
): Promise<{ authorized: boolean; userId?: string; email?: string; name?: string; avatarUrl?: string }> {
  try {
    const session = await env.DB.prepare(
      'SELECT user_id, email, name, avatar_url, expires_at, is_active FROM instructor_sessions WHERE id = ? AND is_active = 1'
    )
      .bind(token)
      .first<{ user_id: string; email: string; name: string | null; avatar_url: string | null; expires_at: string; is_active: number }>();

    if (!session) {
      return { authorized: false };
    }

    // Check expiration
    const expiresAt = new Date(session.expires_at);
    if (expiresAt < new Date()) {
      await env.DB.prepare(
        'UPDATE instructor_sessions SET is_active = 0 WHERE id = ?'
      ).bind(token).run();
      return { authorized: false };
    }

    return {
      authorized: true,
      userId: session.user_id,
      email: session.email,
      name: session.name || undefined,
      avatarUrl: session.avatar_url || undefined,
    };
  } catch (error) {
    console.error('Instructor session validation error:', error);
    return { authorized: false };
  }
}

/**
 * Create a new instructor session
 * Returns the session token (ID)
 */
export async function createInstructorSession(
  env: Env,
  userId: string,
  email: string,
  name: string,
  ipAddress?: string,
  deviceInfo?: string,
  avatarUrl?: string
): Promise<string> {
  const sessionId = generateId();
  const expiresAt = getSessionExpiry(7); // 7-day session for instructors (same as admin)

  // Delete any existing sessions for this user (one device strictly, like students)
  await env.DB.prepare(
    'DELETE FROM instructor_sessions WHERE user_id = ?'
  ).bind(userId).run();

  await env.DB.prepare(
    `INSERT INTO instructor_sessions (id, user_id, email, name, ip_address, device_info, expires_at, is_active, avatar_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`
  )
    .bind(sessionId, userId, email, name, ipAddress || null, deviceInfo || null, expiresAt, avatarUrl || null)
    .run();

  return sessionId;
}

/**
 * Delete (deactivate) an instructor session
 */
export async function deleteInstructorSession(
  env: Env,
  token: string
): Promise<boolean> {
  try {
    await env.DB.prepare(
      'UPDATE instructor_sessions SET is_active = 0 WHERE id = ?'
    ).bind(token).run();
    return true;
  } catch {
    return false;
  }
}
