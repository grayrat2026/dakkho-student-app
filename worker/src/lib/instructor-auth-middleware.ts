/**
 * Instructor auth middleware for DAKKHO Instructor API on Cloudflare Workers
 * Checks Bearer token against D1 instructor_sessions table
 * Also provides composite middleware that accepts instructor OR admin sessions
 */

import { Context, Next } from 'hono';
import type { Env } from '../env';
import { validateInstructorSession } from './instructor-auth';

// ─── Instructor-only auth variables ───

export type InstructorAuthVariables = {
  instructorId: string;
  instructorEmail: string;
  instructorName: string;
  instructorAvatarUrl: string;
};

// ─── Composite auth variables (instructor OR admin) ───

export type InstructorOrAdminAuthVariables = InstructorAuthVariables & {
  authRole: 'instructor' | 'admin';
  // When authRole is 'admin', these are set from admin session
  adminId?: string;
  adminEmail?: string;
  adminName?: string;
};

/**
 * Instructor-only auth middleware — validates Bearer token from D1 instructor_sessions
 * Sets c.set('instructorId'), c.set('instructorEmail'), c.set('instructorName'), c.set('instructorAvatarUrl')
 */
export async function instructorAuthMiddleware(
  c: Context<{ Bindings: Env; Variables: InstructorAuthVariables }>,
  next: Next
) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Authentication required. Provide Authorization: Bearer <token>' }, 401);
  }

  const token = authHeader.substring(7);

  if (!token) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  try {
    const result = await validateInstructorSession(c.env, token);

    if (!result.authorized) {
      return c.json({ error: 'Invalid or expired instructor session' }, 401);
    }

    c.set('instructorId', result.userId!);
    c.set('instructorEmail', result.email || '');
    c.set('instructorName', result.name || '');
    c.set('instructorAvatarUrl', result.avatarUrl || '');

    await next();
  } catch (error) {
    console.error('Instructor auth middleware error:', error);
    return c.json({ error: 'Authentication failed' }, 401);
  }
}

/**
 * Composite auth middleware — tries instructor session first, falls back to admin session
 * Sets c.set('authRole', 'instructor' | 'admin') plus the corresponding user variables
 */
export async function instructorOrAdminMiddleware(
  c: Context<{ Bindings: Env; Variables: InstructorOrAdminAuthVariables }>,
  next: Next
) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Authentication required. Provide Authorization: Bearer <token>' }, 401);
  }

  const token = authHeader.substring(7);

  if (!token) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  try {
    // Try instructor session first
    const instructorResult = await validateInstructorSession(c.env, token);

    if (instructorResult.authorized) {
      c.set('authRole', 'instructor');
      c.set('instructorId', instructorResult.userId!);
      c.set('instructorEmail', instructorResult.email || '');
      c.set('instructorName', instructorResult.name || '');
      c.set('instructorAvatarUrl', instructorResult.avatarUrl || '');
      await next();
      return;
    }

    // Fall back to admin session
    const adminSession = await c.env.DB.prepare(
      'SELECT id, user_id, email, name, role, expires_at, is_active FROM admin_sessions WHERE id = ? AND is_active = 1'
    )
      .bind(token)
      .first<{ id: string; user_id: string; email: string; name: string; role: string; expires_at: string; is_active: number }>();

    if (!adminSession) {
      return c.json({ error: 'Invalid or expired session' }, 401);
    }

    // Check admin session expiration
    const expiresAt = new Date(adminSession.expires_at);
    if (expiresAt < new Date()) {
      await c.env.DB.prepare(
        'UPDATE admin_sessions SET is_active = 0 WHERE id = ?'
      ).bind(token).run();
      return c.json({ error: 'Session expired. Please login again.' }, 401);
    }

    c.set('authRole', 'admin');
    c.set('instructorId', ''); // Admin doesn't have instructor ID by default
    c.set('instructorEmail', adminSession.email);
    c.set('instructorName', adminSession.name || '');
    c.set('instructorAvatarUrl', '');
    c.set('adminId', adminSession.user_id);
    c.set('adminEmail', adminSession.email);
    c.set('adminName', adminSession.name || '');

    await next();
  } catch (error) {
    console.error('Instructor or admin auth middleware error:', error);
    return c.json({ error: 'Authentication failed' }, 401);
  }
}
