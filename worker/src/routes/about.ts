/**
 * About page routes — Public + Admin CRUD
 * - GET /api/about — Public: all about page content
 * - GET /admin/about — Admin: get all about content
 * - PUT /admin/about/content — Admin: update about text, mission, contact
 * - CRUD /admin/about/stats — Admin: manage stats
 * - CRUD /admin/about/team — Admin: manage team members
 * - CRUD /admin/about/faq — Admin: manage FAQ items
 */

import { Hono } from 'hono';
import type { Env } from '../env';
import type { AuthVariables } from '../lib/auth';
import { adminAuthMiddleware } from '../lib/auth';
import { logAudit } from '../lib/audit';
import { getErrorMessage } from '../lib/utils';

// ─── Default about content (fallback) ───
const DEFAULT_ABOUT_CONTENT = {
  aboutText: "DAKKHO is Bangladesh's premier online learning platform built exclusively for polytechnic students. We provide high-quality video courses aligned with the BTEB curriculum, covering all major technologies from Web Development and Electronics to Civil Engineering and Architecture. Our platform connects students with expert instructors from across the country, making quality technical education accessible regardless of location or financial background.",
  missionText: "To democratize technical education in Bangladesh by providing world-class learning experiences to every polytechnic student. We believe that geographical boundaries or financial constraints should never be barriers to quality education. Through technology, community, and dedicated instructors, we are building the future skilled workforce of Bangladesh.",
  contactEmail: 'support@dakkho.com.bd',
  contactPhone1: '+8809638113227',
  contactPhone2: '+8801632373707',
  contactAddress: 'Radhaballav Road near DPHE, Rangpur',
  missionValues: ['Accessible Education', 'Quality Content', 'Student First', 'Innovation'],
};

// ─── Public route (no auth) — mounted on /api/about ───
const aboutPublicRoutes = new Hono<{ Bindings: Env }>();

aboutPublicRoutes.get('/', async (c) => {
  try {
    // Try KV cache first
    const cached = await c.env.KV_CONFIG.get('about_page_data', 'json');
    if (cached) {
      return c.json(cached);
    }

    const data = await fetchAboutData(c.env);

    // Cache in KV for 5 minutes
    await c.env.KV_CONFIG.put('about_page_data', JSON.stringify(data), { expirationTtl: 300 });

    return c.json(data);
  } catch (error) {
    // Return defaults on error
    return c.json({
      content: DEFAULT_ABOUT_CONTENT,
      stats: [],
      team: [],
      faq: [],
    });
  }
});

// ─── Admin routes (auth required) — mounted on /admin/about ───
const aboutAdminRoutes = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
aboutAdminRoutes.use('*', adminAuthMiddleware);

// GET / — Get all about content
aboutAdminRoutes.get('/', async (c) => {
  try {
    const data = await fetchAboutData(c.env);
    return c.json(data);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// PUT /content — Update about text, mission, contact info
aboutAdminRoutes.put('/content', async (c) => {
  try {
    const body = await c.req.json();

    const content = {
      aboutText: body.aboutText || DEFAULT_ABOUT_CONTENT.aboutText,
      missionText: body.missionText || DEFAULT_ABOUT_CONTENT.missionText,
      contactEmail: body.contactEmail || DEFAULT_ABOUT_CONTENT.contactEmail,
      contactPhone1: body.contactPhone1 || DEFAULT_ABOUT_CONTENT.contactPhone1,
      contactPhone2: body.contactPhone2 || DEFAULT_ABOUT_CONTENT.contactPhone2,
      contactAddress: body.contactAddress || DEFAULT_ABOUT_CONTENT.contactAddress,
      missionValues: body.missionValues || DEFAULT_ABOUT_CONTENT.missionValues,
    };

    await c.env.DB.prepare(
      `INSERT INTO app_config (key, value, updated_at) VALUES ('about_content', ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
    ).bind(JSON.stringify(content)).run();

    // Invalidate KV cache
    await c.env.KV_CONFIG.delete('about_page_data');

    const user = c.get('user');
    await logAudit(c.env, user.id, 'UPDATE_ABOUT_CONTENT', 'about', undefined, content);

    return c.json({ success: true, content });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ─── STATS CRUD ───

aboutAdminRoutes.get('/stats', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      'SELECT * FROM about_stats ORDER BY sort_order ASC'
    ).all();
    return c.json({ stats: result.results });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

aboutAdminRoutes.post('/stats', async (c) => {
  try {
    const { label, value, icon, sortOrder, isActive } = await c.req.json();
    if (!label || !value) {
      return c.json({ error: 'label and value are required' }, 400);
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO about_stats (label, value, icon, sort_order, is_active) VALUES (?, ?, ?, ?, ?)`
    ).bind(label, value, icon || 'book-open', sortOrder || 0, isActive !== undefined ? (isActive ? 1 : 0) : 1).run();

    await invalidateAboutCache(c.env);

    const user = c.get('user');
    await logAudit(c.env, user.id, 'CREATE_ABOUT_STAT', 'about_stats', undefined, { label, value });

    return c.json({ success: true, id: result.meta.last_row_id });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

aboutAdminRoutes.put('/stats', async (c) => {
  try {
    const { id, label, value, icon, sortOrder, isActive } = await c.req.json();
    if (!id) {
      return c.json({ error: 'id is required' }, 400);
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (label !== undefined) { updates.push('label = ?'); params.push(label); }
    if (value !== undefined) { updates.push('value = ?'); params.push(value); }
    if (icon !== undefined) { updates.push('icon = ?'); params.push(icon); }
    if (sortOrder !== undefined) { updates.push('sort_order = ?'); params.push(sortOrder); }
    if (isActive !== undefined) { updates.push('is_active = ?'); params.push(isActive ? 1 : 0); }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push("updated_at = datetime('now')");
    params.push(id);

    await c.env.DB.prepare(
      `UPDATE about_stats SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    await invalidateAboutCache(c.env);

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

aboutAdminRoutes.delete('/stats', async (c) => {
  try {
    // Support both query param (?id=X) and JSON body { id }
    const urlId = c.req.query('id');
    let id: number | undefined = urlId ? Number(urlId) : undefined;
    if (!id) {
      try {
        const body = await c.req.json();
        id = body?.id;
      } catch {}
    }
    if (!id) {
      return c.json({ error: 'id is required' }, 400);
    }

    await c.env.DB.prepare('DELETE FROM about_stats WHERE id = ?').bind(id).run();
    await invalidateAboutCache(c.env);

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ─── TEAM CRUD ───

aboutAdminRoutes.get('/team', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      'SELECT * FROM about_team ORDER BY sort_order ASC'
    ).all();
    return c.json({ team: result.results });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

aboutAdminRoutes.post('/team', async (c) => {
  try {
    const { name, role, avatarUrl, icon, sortOrder, isActive } = await c.req.json();
    if (!name || !role) {
      return c.json({ error: 'name and role are required' }, 400);
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO about_team (name, role, avatar_url, icon, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(name, role, avatarUrl || null, icon || 'users', sortOrder || 0, isActive !== undefined ? (isActive ? 1 : 0) : 1).run();

    await invalidateAboutCache(c.env);

    return c.json({ success: true, id: result.meta.last_row_id });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

aboutAdminRoutes.put('/team', async (c) => {
  try {
    const { id, name, role, avatarUrl, icon, sortOrder, isActive } = await c.req.json();
    if (!id) {
      return c.json({ error: 'id is required' }, 400);
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (role !== undefined) { updates.push('role = ?'); params.push(role); }
    if (avatarUrl !== undefined) { updates.push('avatar_url = ?'); params.push(avatarUrl); }
    if (icon !== undefined) { updates.push('icon = ?'); params.push(icon); }
    if (sortOrder !== undefined) { updates.push('sort_order = ?'); params.push(sortOrder); }
    if (isActive !== undefined) { updates.push('is_active = ?'); params.push(isActive ? 1 : 0); }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push("updated_at = datetime('now')");
    params.push(id);

    await c.env.DB.prepare(
      `UPDATE about_team SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    await invalidateAboutCache(c.env);

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

aboutAdminRoutes.delete('/team', async (c) => {
  try {
    // Support both query param (?id=X) and JSON body { id }
    const urlId = c.req.query('id');
    let id: number | undefined = urlId ? Number(urlId) : undefined;
    if (!id) {
      try {
        const body = await c.req.json();
        id = body?.id;
      } catch {}
    }
    if (!id) {
      return c.json({ error: 'id is required' }, 400);
    }

    await c.env.DB.prepare('DELETE FROM about_team WHERE id = ?').bind(id).run();
    await invalidateAboutCache(c.env);

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ─── FAQ CRUD ───

aboutAdminRoutes.get('/faq', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      'SELECT * FROM about_faq ORDER BY sort_order ASC'
    ).all();
    return c.json({ faq: result.results });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

aboutAdminRoutes.post('/faq', async (c) => {
  try {
    const { question, answer, sortOrder, isActive } = await c.req.json();
    if (!question || !answer) {
      return c.json({ error: 'question and answer are required' }, 400);
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO about_faq (question, answer, sort_order, is_active) VALUES (?, ?, ?, ?)`
    ).bind(question, answer, sortOrder || 0, isActive !== undefined ? (isActive ? 1 : 0) : 1).run();

    await invalidateAboutCache(c.env);

    return c.json({ success: true, id: result.meta.last_row_id });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

aboutAdminRoutes.put('/faq', async (c) => {
  try {
    const { id, question, answer, sortOrder, isActive } = await c.req.json();
    if (!id) {
      return c.json({ error: 'id is required' }, 400);
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (question !== undefined) { updates.push('question = ?'); params.push(question); }
    if (answer !== undefined) { updates.push('answer = ?'); params.push(answer); }
    if (sortOrder !== undefined) { updates.push('sort_order = ?'); params.push(sortOrder); }
    if (isActive !== undefined) { updates.push('is_active = ?'); params.push(isActive ? 1 : 0); }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push("updated_at = datetime('now')");
    params.push(id);

    await c.env.DB.prepare(
      `UPDATE about_faq SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    await invalidateAboutCache(c.env);

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

aboutAdminRoutes.delete('/faq', async (c) => {
  try {
    // Support both query param (?id=X) and JSON body { id }
    const urlId = c.req.query('id');
    let id: number | undefined = urlId ? Number(urlId) : undefined;
    if (!id) {
      try {
        const body = await c.req.json();
        id = body?.id;
      } catch {}
    }
    if (!id) {
      return c.json({ error: 'id is required' }, 400);
    }

    await c.env.DB.prepare('DELETE FROM about_faq WHERE id = ?').bind(id).run();
    await invalidateAboutCache(c.env);

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ─── Helper: Fetch all about data from D1 ───
async function fetchAboutData(env: Env) {
  // Fetch about content from app_config
  const configRow = await env.DB.prepare(
    "SELECT value FROM app_config WHERE key = 'about_content'"
  ).first<{ value: string }>();

  let content = DEFAULT_ABOUT_CONTENT;
  if (configRow?.value) {
    try {
      content = { ...DEFAULT_ABOUT_CONTENT, ...JSON.parse(configRow.value) };
    } catch {}
  }

  // Fetch stats
  const statsResult = await env.DB.prepare(
    'SELECT * FROM about_stats WHERE is_active = 1 ORDER BY sort_order ASC'
  ).all();

  // Fetch team
  const teamResult = await env.DB.prepare(
    'SELECT * FROM about_team WHERE is_active = 1 ORDER BY sort_order ASC'
  ).all();

  // Fetch FAQ
  const faqResult = await env.DB.prepare(
    'SELECT * FROM about_faq WHERE is_active = 1 ORDER BY sort_order ASC'
  ).all();

  return {
    content,
    stats: statsResult.results,
    team: teamResult.results,
    faq: faqResult.results,
  };
}

// ─── Helper: Invalidate KV cache ───
async function invalidateAboutCache(env: Env) {
  try {
    await env.KV_CONFIG.delete('about_page_data');
  } catch {}
}

export { aboutPublicRoutes, aboutAdminRoutes };
