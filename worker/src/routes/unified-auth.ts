/**
 * Unified Auth Routes — login, check, forgot-password, reset-password
 * for students, instructors, and admins.
 * All auth is now D1-based. No more Appwrite dependency.
 */

import { Hono } from 'hono';
import type { Env } from '../env';
import { authenticateUser, hashPassword } from '../lib/auth-password';
import { generateId, getSessionExpiry, getErrorMessage } from '../lib/utils';
import { createStudentSession, deleteStudentSession } from '../lib/student-auth';
import { createInstructorSession, deleteInstructorSession } from '../lib/instructor-auth';

const unifiedAuthRoutes = new Hono<{ Bindings: Env }>();

// POST /login — Unified login for all roles (admin, instructor, student)
unifiedAuthRoutes.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json<{ email: string; password: string }>();

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Authenticate user via D1 (handles password verification)
    const authResult = await authenticateUser(c.env, email, password);

    if (!authResult.success) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const userId = authResult.userId!;
    const userEmail = authResult.userEmail!;
    const userName = authResult.userName!;
    const userRole = authResult.userRole || 'student';
    const avatarUrl = authResult.avatarUrl || '';

    let token: string;

    if (userRole === 'admin') {
      // Create admin session
      const expiresAt = getSessionExpiry(7);
      const sessionId = generateId();

      // Delete any existing sessions for this user
      await c.env.DB.prepare(
        'DELETE FROM admin_sessions WHERE user_id = ?'
      ).bind(userId).run();

      await c.env.DB.prepare(
        `INSERT INTO admin_sessions (id, user_id, email, name, role, ip_address, user_agent, expires_at, is_active, avatar_url)
         VALUES (?, ?, ?, ?, 'admin', ?, ?, ?, 1, ?)`
      )
        .bind(
          sessionId,
          userId,
          userEmail,
          userName,
          c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
          c.req.header('user-agent') || 'unknown',
          expiresAt,
          avatarUrl
        )
        .run();

      token = sessionId;
    } else if (userRole === 'instructor') {
      // Create instructor session
      token = await createInstructorSession(
        c.env,
        userId,
        userEmail,
        userName,
        c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
        c.req.header('user-agent') || 'unknown',
        avatarUrl
      );
    } else {
      // Create student session
      token = await createStudentSession(c.env, userId, userEmail);
    }

    return c.json({
      success: true,
      token,
      role: userRole,
      user: {
        id: userId,
        email: userEmail,
        name: userName,
        role: userRole,
        avatarUrl,
      },
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('Unified login error:', error);
    return c.json({ error: message }, 401);
  }
});

// POST /check — Unified auth check for all roles
unifiedAuthRoutes.post('/check', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ authenticated: false }, 401);
    }

    const token = authHeader.substring(7);

    // Check admin_sessions
    const adminSession = await c.env.DB.prepare(
      'SELECT user_id, email, name, role, avatar_url, expires_at, is_active FROM admin_sessions WHERE id = ? AND is_active = 1'
    ).bind(token).first<{ user_id: string; email: string; name: string; role: string; avatar_url: string | null; expires_at: string; is_active: number }>();

    if (adminSession && new Date(adminSession.expires_at) >= new Date()) {
      return c.json({
        authenticated: true,
        user: {
          id: adminSession.user_id,
          email: adminSession.email,
          name: adminSession.name,
          role: adminSession.role || 'admin',
          avatar_url: adminSession.avatar_url || '',
        },
      });
    }

    // Check instructor_sessions
    const instructorSession = await c.env.DB.prepare(
      'SELECT user_id, email, name, avatar_url, expires_at, is_active FROM instructor_sessions WHERE id = ? AND is_active = 1'
    ).bind(token).first<{ user_id: string; email: string; name: string | null; avatar_url: string | null; expires_at: string; is_active: number }>();

    if (instructorSession && new Date(instructorSession.expires_at) >= new Date()) {
      return c.json({
        authenticated: true,
        user: {
          id: instructorSession.user_id,
          email: instructorSession.email,
          name: instructorSession.name || '',
          role: 'instructor',
          avatar_url: instructorSession.avatar_url || '',
        },
      });
    }

    // Check student_sessions
    const studentSession = await c.env.DB.prepare(
      'SELECT user_id, email, name, expires_at, is_active FROM student_sessions WHERE id = ? AND is_active = 1'
    ).bind(token).first<{ user_id: string; email: string; name: string | null; expires_at: string; is_active: number }>();

    if (studentSession && new Date(studentSession.expires_at) >= new Date()) {
      // Get full user info for role
      const userRow = await c.env.DB.prepare(
        'SELECT role, avatar_url FROM users WHERE id = ?'
      ).bind(studentSession.user_id).first<{ role: string; avatar_url: string | null }>();

      return c.json({
        authenticated: true,
        user: {
          id: studentSession.user_id,
          email: studentSession.email,
          name: studentSession.name || '',
          role: userRow?.role || 'student',
          avatar_url: userRow?.avatar_url || '',
        },
      });
    }

    // Token not found or expired
    return c.json({ authenticated: false }, 401);
  } catch (error) {
    console.error('Auth check error:', error);
    return c.json({ authenticated: false }, 401);
  }
});

// POST /logout — Unified logout for all roles
unifiedAuthRoutes.post('/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: true });
    }

    const token = authHeader.substring(7);

    // Try to invalidate in all session tables
    try { await c.env.DB.prepare('UPDATE admin_sessions SET is_active = 0 WHERE id = ?').bind(token).run(); } catch {}
    try { await deleteInstructorSession(c.env, token); } catch {}
    try { await deleteStudentSession(c.env, token); } catch {}

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: true }); // Always return success for logout
  }
});

// POST /forgot-password — Send OTP for password reset (all roles)
unifiedAuthRoutes.post('/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json<{ email: string }>();
    if (!email) return c.json({ error: 'Email is required' }, 400);

    // Check if user exists in D1
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, role FROM users WHERE email = ?'
    ).bind(email).first();

    // Always return success to prevent email enumeration
    if (!user) {
      return c.json({
        success: true,
        message: 'If an account exists with this email, you will receive password reset instructions.',
      });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    // Store OTP in D1
    await c.env.DB.prepare(`
      INSERT INTO otp_codes (target, code, type, expires_at, verified, attempts)
      VALUES (?, ?, 'password_reset', ?, 0, 0)
    `).bind(email, otp, expiresAt).run();

    // Send OTP email via Resend
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; text-align: center;">
        <div style="background: linear-gradient(135deg, #0ea5e9, #3b82f6); padding: 30px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">DAKKHO</h1>
        </div>
        <div style="padding: 30px; background: white; border-radius: 0 0 16px 16px;">
          <h2 style="color: #1e293b;">Reset Your Password</h2>
          <p style="color: #64748b;">Your password reset code is:</p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 12px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0ea5e9;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 14px;">This code expires in 10 minutes. Do not share it with anyone.</p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `;

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: c.env.RESEND_FROM_EMAIL,
          to: [email],
          subject: 'DAKKHO - Password Reset Code',
          html: emailHtml,
        }),
      });
    } catch (otpErr) {
      console.error('Failed to send OTP:', otpErr);
    }

    return c.json({
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions.',
    });
  } catch (error) {
    return c.json({
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions.',
    });
  }
});

// POST /instructor/forgot-password — Same as forgot-password (kept for backward compat)
unifiedAuthRoutes.post('/instructor/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json<{ email: string }>();
    if (!email) return c.json({ error: 'Email is required' }, 400);

    // Check if user exists in D1
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, role FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user) {
      return c.json({ success: true, message: 'If an instructor account exists with this email, you will receive a password reset link.' });
    }

    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await c.env.DB.prepare(`
      INSERT INTO otp_codes (target, code, type, expires_at, verified, attempts)
      VALUES (?, ?, 'password_reset', ?, 0, 0)
    `).bind(email, otp, expiresAt).run();

    // Send email
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: c.env.RESEND_FROM_EMAIL,
          to: [email],
          subject: 'DAKKHO - Password Reset Code',
          html: `<div style="font-family:sans-serif;text-align:center;"><h2>DAKKHO Password Reset</h2><p>Your code: <strong style="font-size:24px;">${otp}</strong></p><p>Expires in 10 minutes.</p></div>`,
        }),
      });
    } catch {}

    return c.json({ success: true, message: 'If an instructor account exists with this email, you will receive a password reset link.' });
  } catch {
    return c.json({ success: true, message: 'If an instructor account exists with this email, you will receive a password reset link.' });
  }
});

// POST /reset-password — Reset password using OTP
unifiedAuthRoutes.post('/reset-password', async (c) => {
  try {
    const { email, otp, password } = await c.req.json<{ email: string; otp: string; password: string }>();
    if (!email || !otp || !password) {
      return c.json({ error: 'email, otp, and password are required' }, 400);
    }
    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }

    // Verify OTP
    const otpRecord = await c.env.DB.prepare(
      "SELECT id, expires_at, verified, attempts FROM otp_codes WHERE target = ? AND code = ? AND type = 'password_reset' ORDER BY created_at DESC LIMIT 1"
    ).bind(email, otp).first<{ id: number; expires_at: string; verified: number; attempts: number }>();

    if (!otpRecord) {
      return c.json({ error: 'Invalid OTP code' }, 400);
    }

    if (otpRecord.verified) {
      return c.json({ error: 'This OTP has already been used' }, 400);
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      return c.json({ error: 'OTP has expired. Please request a new one.' }, 400);
    }

    // Mark OTP as verified
    await c.env.DB.prepare(
      'UPDATE otp_codes SET verified = 1 WHERE id = ?'
    ).bind(otpRecord.id).run();

    // Find user and update password
    const user = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first<{ id: string }>();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const passwordHash = await hashPassword(password);
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ?, password_migrated = 1, updated_at = ? WHERE id = ?'
    ).bind(passwordHash, new Date().toISOString(), user.id).run();

    // Invalidate all sessions
    try { await c.env.DB.prepare('UPDATE admin_sessions SET is_active = 0 WHERE user_id = ?').bind(user.id).run(); } catch {}
    try { await c.env.DB.prepare('UPDATE student_sessions SET is_active = 0 WHERE user_id = ?').bind(user.id).run(); } catch {}
    try { await c.env.DB.prepare('UPDATE instructor_sessions SET is_active = 0 WHERE user_id = ?').bind(user.id).run(); } catch {}

    return c.json({ success: true, message: 'Password has been reset successfully. Please login with your new password.' });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// POST /instructor/reset-password — Legacy route, now uses OTP too
unifiedAuthRoutes.post('/instructor/reset-password', async (c) => {
  try {
    const { userId, secret, password, email, otp } = await c.req.json<{ userId?: string; secret?: string; password: string; email?: string; otp?: string }>();

    if (!password || password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }

    // Support both old format (userId + secret) and new format (email + otp)
    let targetUserId = userId;
    let targetEmail = email;

    if (email && otp) {
      // New OTP-based reset
      const otpRecord = await c.env.DB.prepare(
        "SELECT id, expires_at, verified FROM otp_codes WHERE target = ? AND code = ? AND type = 'password_reset' ORDER BY created_at DESC LIMIT 1"
      ).bind(email, otp).first<{ id: number; expires_at: string; verified: number }>();

      if (!otpRecord || otpRecord.verified || new Date(otpRecord.expires_at) < new Date()) {
        return c.json({ error: 'Invalid or expired OTP code' }, 400);
      }

      await c.env.DB.prepare('UPDATE otp_codes SET verified = 1 WHERE id = ?').bind(otpRecord.id).run();

      const user = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<{ id: string }>();
      if (!user) return c.json({ error: 'User not found' }, 404);
      targetUserId = user.id;
    } else if (!userId) {
      return c.json({ error: 'Provide either (email + otp) or (userId + secret)' }, 400);
    }

    if (!targetUserId) {
      return c.json({ error: 'User identification failed' }, 400);
    }

    // Update password in D1
    const passwordHash = await hashPassword(password);
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ?, password_migrated = 1, updated_at = ? WHERE id = ?'
    ).bind(passwordHash, new Date().toISOString(), targetUserId).run();

    // Invalidate sessions
    try { await c.env.DB.prepare('UPDATE instructor_sessions SET is_active = 0 WHERE user_id = ?').bind(targetUserId).run(); } catch {}
    try { await c.env.DB.prepare('UPDATE student_sessions SET is_active = 0 WHERE user_id = ?').bind(targetUserId).run(); } catch {}

    return c.json({ success: true, message: 'Password has been reset successfully. Please login with your new password.' });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

export default unifiedAuthRoutes;
