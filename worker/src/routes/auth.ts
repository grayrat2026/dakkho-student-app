/**
 * Auth routes — POST /login, POST /check, DELETE /logout
 * D1-only: Password verification uses SHA-256 hash from users table
 */

import { Hono } from 'hono';
import type { Env } from '../env';
import type { AuthVariables } from '../lib/auth';
import { adminAuthMiddleware } from '../lib/auth';
import { generateId, getSessionExpiry, getErrorMessage } from '../lib/utils';
import { logAudit } from '../lib/audit';

const authRoutes = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

/**
 * Hash a password using Web Crypto API (SHA-256)
 * In production, consider using bcrypt via a service worker or Argon2
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// POST /login — Create admin session
authRoutes.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json<{ email: string; password: string }>();

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Step 1: Look up user in D1 users table
    const user = await c.env.DB.prepare(
      'SELECT id, email, full_name, role, password_hash, is_active FROM users WHERE email = ? AND is_active = 1'
    )
      .bind(email)
      .first<{ id: string; email: string; full_name: string; role: string; password_hash: string; is_active: number }>();

    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Step 2: Verify password
    const hashedInput = await hashPassword(password);
    if (hashedInput !== user.password_hash) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Step 3: Check admin role (admin or super_admin)
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return c.json(
        { error: 'Access denied. Admin role required. Your account does not have admin privileges.' },
        403
      );
    }

    // Step 4: Create admin session in D1
    const expiresAt = getSessionExpiry(7);
    const sessionId = generateId();

    // Delete any existing sessions for this user (active or inactive)
    await c.env.DB.prepare(
      'DELETE FROM admin_sessions WHERE user_id = ?'
    ).bind(user.id).run();

    await c.env.DB.prepare(
      `INSERT INTO admin_sessions (id, user_id, email, name, role, ip_address, user_agent, expires_at, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
    )
      .bind(
        sessionId,
        user.id,
        user.email,
        user.full_name,
        user.role,
        c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
        c.req.header('user-agent') || 'unknown',
        expiresAt
      )
      .run();

    // Step 5: Return success with session token
    return c.json({
      success: true,
      token: sessionId,
      user: { id: user.id, email: user.email, name: user.full_name, role: user.role },
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('Login error:', error);
    return c.json({ error: message }, 401);
  }
});

// POST /check — Verify if session is valid
authRoutes.post('/check', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ authenticated: false }, 401);
    }

    const token = authHeader.substring(7);

    const session = await c.env.DB.prepare(
      'SELECT id, user_id, email, name, role, expires_at, is_active FROM admin_sessions WHERE id = ? AND is_active = 1'
    )
      .bind(token)
      .first<{ id: string; user_id: string; email: string; name: string; role: string; expires_at: string; is_active: number }>();

    if (!session || new Date(session.expires_at) < new Date()) {
      return c.json({ authenticated: false }, 401);
    }

    return c.json({
      authenticated: true,
      user: { id: session.user_id, email: session.email, name: session.name, role: session.role },
    });
  } catch {
    return c.json({ authenticated: false }, 401);
  }
});

// DELETE /logout — Invalidate admin session
authRoutes.delete('/logout', adminAuthMiddleware, async (c) => {
  try {
    const user = c.get('user');

    await c.env.DB.prepare(
      'UPDATE admin_sessions SET is_active = 0 WHERE user_id = ?'
    ).bind(user.id).run();

    return c.json({ success: true });
  } catch (error) {
    const message = getErrorMessage(error);
    return c.json({ error: message }, 500);
  }
});

// DELETE /sessions — Clear all admin sessions (danger zone)
authRoutes.delete('/sessions', adminAuthMiddleware, async (c) => {
  try {
    const result = await c.env.DB.prepare(
      "UPDATE admin_sessions SET is_active = 0 WHERE is_active = 1"
    ).run();

    const user = c.get('user');
    await logAudit(c.env, user.id, 'CLEAR_ALL_SESSIONS', 'auth', undefined, { action: 'clear_all' });

    return c.json({ success: true, cleared: result.meta?.changes || 0 });
  } catch (error) {
    const message = getErrorMessage(error);
    return c.json({ error: message }, 500);
  }
});

export default authRoutes;
