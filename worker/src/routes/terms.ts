/**
 * Terms & Conditions Routes — Public view, acceptance & admin CRUD
 * Uses D1 tables: terms_versions, user_terms_acceptance
 */

import { Hono } from 'hono';
import type { Env } from '../env';
import type { AuthVariables } from '../lib/auth';
import { adminAuthMiddleware } from '../lib/auth';
import { logAudit } from '../lib/audit';
import { getErrorMessage } from '../lib/utils';

const termsRoutes = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// ─── Public Routes (no auth) ───

// GET /active — Get current active terms (public)
termsRoutes.get('/active', async (c) => {
  try {
    const type = c.req.query('type'); // optional filter by type

    let query = 'SELECT id, type, title, title_bn, content, content_bn, version, is_active, created_at, updated_at FROM terms_versions WHERE is_active = 1';
    const params: any[] = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY version DESC';

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({ success: true, terms: result.results });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /status — Get user's acceptance status for all active terms (authenticated)
termsRoutes.get('/status', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const token = authHeader.slice(7);

    // Verify student session
    const session = await c.env.DB.prepare(
      'SELECT user_id FROM student_sessions WHERE token = ? AND expires_at > datetime("now")'
    ).bind(token).first();

    if (!session) {
      return c.json({ error: 'Invalid or expired session' }, 401);
    }

    const userId = (session as any).user_id;

    // Get all active terms
    const activeTerms = await c.env.DB.prepare(
      'SELECT id, type, title, version FROM terms_versions WHERE is_active = 1'
    ).all();

    // Get user's acceptances
    const acceptances = await c.env.DB.prepare(
      'SELECT terms_version_id, accepted_at FROM user_terms_acceptance WHERE user_id = ?'
    ).bind(userId).all();

    const acceptanceMap = new Map(
      acceptances.results.map((a: any) => [a.terms_version_id, a.accepted_at])
    );

    const status = activeTerms.results.map((term: any) => ({
      terms_version_id: term.id,
      type: term.type,
      title: term.title,
      version: term.version,
      accepted: acceptanceMap.has(term.id),
      accepted_at: acceptanceMap.get(term.id) || null,
    }));

    const allAccepted = status.every((s: any) => s.accepted);
    return c.json({ success: true, terms: status, all_accepted: allAccepted });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// POST /accept — Accept terms versions (authenticated)
termsRoutes.post('/accept', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const token = authHeader.slice(7);
    const session = await c.env.DB.prepare(
      'SELECT user_id FROM student_sessions WHERE token = ? AND expires_at > datetime("now")'
    ).bind(token).first();

    if (!session) {
      return c.json({ error: 'Invalid or expired session' }, 401);
    }

    const userId = (session as any).user_id;
    const body = await c.req.json();
    const { termsVersionIds } = body as { termsVersionIds: number[] };

    if (!termsVersionIds || !Array.isArray(termsVersionIds) || termsVersionIds.length === 0) {
      return c.json({ error: 'termsVersionIds array required' }, 400);
    }

    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const userAgent = c.req.header('User-Agent') || 'unknown';

    let accepted = 0;
    for (const versionId of termsVersionIds) {
      try {
        await c.env.DB.prepare(
          'INSERT OR IGNORE INTO user_terms_acceptance (user_id, terms_version_id, ip_address, user_agent) VALUES (?, ?, ?, ?)'
        ).bind(userId, versionId, ip, userAgent).run();
        accepted++;
      } catch {
        // Skip duplicates
      }
    }

    return c.json({ success: true, accepted, message: `${accepted} terms accepted` });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ─── Admin Routes ───

// GET /admin/list — List all terms versions (admin only)
termsRoutes.get('/admin/list', adminAuthMiddleware, async (c) => {
  try {
    const type = c.req.query('type');

    let query = 'SELECT * FROM terms_versions';
    const params: any[] = [];

    if (type) {
      query += ' WHERE type = ?';
      params.push(type);
    }

    query += ' ORDER BY type, version DESC';

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({ terms: result.results });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// POST /admin/create — Create new terms version (admin only)
termsRoutes.post('/admin/create', adminAuthMiddleware, async (c) => {
  try {
    const data = await c.req.json();
    const { type, title, content, title_bn, content_bn, is_active } = data;

    if (!type || !title || !content) {
      return c.json({ error: 'type, title, content required' }, 400);
    }

    const user = c.get('user');

    // Get the latest version number for this type
    const latest = await c.env.DB.prepare(
      'SELECT MAX(version) as max_version FROM terms_versions WHERE type = ?'
    ).bind(type).first();
    const nextVersion = ((latest as any)?.max_version || 0) + 1;

    await c.env.DB.prepare(`
      INSERT INTO terms_versions (type, title, content, title_bn, content_bn, version, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(type, title, content, title_bn || null, content_bn || null, nextVersion, is_active !== false ? 1 : 0).run();

    await logAudit(c.env, user.id, 'CREATE_TERMS', 'terms_versions', `${type}-v${nextVersion}`, data);

    return c.json({ success: true, version: nextVersion, message: 'Terms version created successfully' }, 201);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// PUT /admin/:id — Update terms version (admin only)
termsRoutes.put('/admin/:id', adminAuthMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const user = c.get('user');

    const updates: string[] = [];
    const params: any[] = [];

    if (data.title !== undefined) { updates.push('title = ?'); params.push(data.title); }
    if (data.content !== undefined) { updates.push('content = ?'); params.push(data.content); }
    if (data.title_bn !== undefined) { updates.push('title_bn = ?'); params.push(data.title_bn); }
    if (data.content_bn !== undefined) { updates.push('content_bn = ?'); params.push(data.content_bn); }
    if (data.is_active !== undefined) { updates.push('is_active = ?'); params.push(data.is_active ? 1 : 0); }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push("updated_at = datetime('now')");
    params.push(id);

    await c.env.DB.prepare(
      `UPDATE terms_versions SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    await logAudit(c.env, user.id, 'UPDATE_TERMS', 'terms_versions', id, data);

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// DELETE /admin/:id — Delete terms version (admin only)
termsRoutes.delete('/admin/:id', adminAuthMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');

    // Delete associated acceptances first
    await c.env.DB.prepare('DELETE FROM user_terms_acceptance WHERE terms_version_id = ?').bind(id).run();
    await c.env.DB.prepare('DELETE FROM terms_versions WHERE id = ?').bind(id).run();

    await logAudit(c.env, user.id, 'DELETE_TERMS', 'terms_versions', id);

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

export default termsRoutes;
