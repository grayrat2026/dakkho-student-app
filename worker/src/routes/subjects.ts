/**
 * Subjects routes — GET, POST, PUT, DELETE
 * D1-only: CRUD for subjects with pagination, search, and technology filter
 */

import { Hono } from 'hono';
import type { Env } from '../env';
import type { AuthVariables } from '../lib/auth';
import { adminAuthMiddleware } from '../lib/auth';
import { logAudit } from '../lib/audit';
import { getErrorMessage, normalizeKeys } from '../lib/utils';

const subjectRoutes = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// Apply auth middleware to all subject routes
subjectRoutes.use('*', adminAuthMiddleware);

// Helper: generate slug from name
function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// GET / — List subjects with pagination, search, technology filter
subjectRoutes.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const search = c.req.query('search') || '';
    const technologyId = c.req.query('technologyId') || '';
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params: unknown[] = [];

    if (search) {
      where += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }
    if (technologyId) {
      where += ' AND technology_id = ?';
      params.push(technologyId);
    }

    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM subjects ${where}`
    ).bind(...params).first();
    const total = (countResult as any)?.total || 0;

    const result = await c.env.DB.prepare(
      `SELECT * FROM subjects ${where} ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all();

    return c.json({ documents: result.results, total });
  } catch (error) {
    const message = getErrorMessage(error);
    return c.json({ error: message }, 500);
  }
});

// POST / — Create subject (auto-generate UUID and slug)
subjectRoutes.post('/', async (c) => {
  try {
    const rawData = await c.req.json<Record<string, unknown>>();
    const allowedFields = ['name', 'slug', 'description', 'icon', 'color', 'technology_id', 'sort_order', 'course_count', 'is_active'];
    const data = normalizeKeys(rawData, allowedFields);
    const id = crypto.randomUUID();
    const slug = (data.slug as string) || slugify(data.name as string);

    if (!data.name) {
      return c.json({ error: 'Name is required' }, 400);
    }

    // Check for duplicate slug
    const existing = await c.env.DB.prepare(
      'SELECT id FROM subjects WHERE slug = ?'
    ).bind(slug).first();
    if (existing) {
      return c.json({ error: 'Slug already exists' }, 400);
    }

    await c.env.DB.prepare(`
      INSERT INTO subjects (id, name, slug, description, icon, color, technology_id, sort_order, course_count, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.name,
      slug,
      data.description || null,
      data.icon || null,
      data.color || null,
      data.technology_id || null,
      data.sort_order || 0,
      data.course_count || 0,
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1
    ).run();

    const created = await c.env.DB.prepare('SELECT * FROM subjects WHERE id = ?').bind(id).first();

    const user = c.get('user');
    await logAudit(c.env, user.id, 'CREATE_SUBJECT', 'subjects', id, data);

    return c.json({ document: created });
  } catch (error) {
    const message = getErrorMessage(error);
    return c.json({ error: message }, 500);
  }
});

// PUT / — Update subject by subjectId
subjectRoutes.put('/', async (c) => {
  try {
    const rawData = await c.req.json<Record<string, unknown>>();
    const { subjectId, ...rawUpdates } = rawData;

    if (!subjectId) {
      return c.json({ error: 'Subject ID required' }, 400);
    }

    // Check if subject exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM subjects WHERE id = ?'
    ).bind(String(subjectId)).first();
    if (!existing) {
      return c.json({ error: 'Subject not found' }, 404);
    }

    const allowedFields = ['name', 'slug', 'description', 'icon', 'color', 'technology_id', 'sort_order', 'course_count', 'is_active'];
    // Normalize camelCase keys from admin panel to snake_case for D1
    const updates = normalizeKeys(rawUpdates, allowedFields);
    const setClauses: string[] = [];
    const setValues: unknown[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        // Convert boolean to integer for SQLite
        if (key === 'is_active') {
          setClauses.push(`${key} = ?`);
          setValues.push(value ? 1 : 0);
        } else {
          setClauses.push(`${key} = ?`);
          setValues.push(value);
        }
      }
    }

    if (setClauses.length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }

    setClauses.push("updated_at = datetime('now')");
    setValues.push(String(subjectId));

    await c.env.DB.prepare(
      `UPDATE subjects SET ${setClauses.join(', ')} WHERE id = ?`
    ).bind(...setValues).run();

    const updated = await c.env.DB.prepare('SELECT * FROM subjects WHERE id = ?').bind(String(subjectId)).first();

    const user = c.get('user');
    await logAudit(c.env, user.id, 'UPDATE_SUBJECT', 'subjects', String(subjectId), updates);

    return c.json({ document: updated });
  } catch (error) {
    const message = getErrorMessage(error);
    return c.json({ error: message }, 500);
  }
});

// DELETE / — Delete subject by id query param
subjectRoutes.delete('/', async (c) => {
  try {
    const id = c.req.query('id');

    if (!id) {
      return c.json({ error: 'Subject ID required' }, 400);
    }

    await c.env.DB.prepare('DELETE FROM subjects WHERE id = ?').bind(id).run();

    const user = c.get('user');
    await logAudit(c.env, user.id, 'DELETE_SUBJECT', 'subjects', id);

    return c.json({ success: true });
  } catch (error) {
    const message = getErrorMessage(error);
    return c.json({ error: message }, 500);
  }
});

export default subjectRoutes;
