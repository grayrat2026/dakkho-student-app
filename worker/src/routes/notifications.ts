/**
 * Notifications routes — GET, POST
 * In-app notifications stored in Appwrite + logged to D1
 */

import { Hono } from 'hono';
import type { Env } from '../env';
import type { AuthVariables } from '../lib/auth';
import { adminAuthMiddleware } from '../lib/auth';
import { listDocuments, createDocument, Query } from '../lib/appwrite';
import { APPWRITE_COLLECTIONS } from '../lib/types';
import { logAudit } from '../lib/audit';
import { getErrorMessage } from '../lib/utils';

const notificationRoutes = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// Apply auth middleware to all notification routes
notificationRoutes.use('*', adminAuthMiddleware);

// GET / — List notifications from D1 log + Appwrite
notificationRoutes.get('/', async (c) => {
  try {
    const source = c.req.query('source') || 'all'; // 'appwrite', 'd1', or 'all'
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;

    const results: Record<string, unknown>[] = [];
    let total = 0;

    // Always include D1 notification logs (they're the reliable record)
    const d1Result = await c.env.DB.prepare(
      "SELECT * FROM notification_logs WHERE type = 'in-app' ORDER BY created_at DESC LIMIT ? OFFSET ?"
    ).bind(limit, offset).all();

    const d1Count = await c.env.DB.prepare(
      "SELECT COUNT(*) as total FROM notification_logs WHERE type = 'in-app'"
    ).first();

    total = (d1Count as any)?.total || 0;

    for (const row of d1Result.results as any[]) {
      results.push({
        id: row.id,
        title: row.title,
        message: row.message,
        type: row.metadata ? (JSON.parse(row.metadata || '{}').notifType || 'info') : 'info',
        targetType: row.target_type,
        targetId: row.target_id,
        sentCount: row.sent_count,
        failedCount: row.failed_count,
        createdAt: row.created_at,
        source: 'd1',
      });
    }

    // Also try Appwrite for per-user delivery details
    if (source === 'all' || source === 'appwrite') {
      try {
        const userId = c.req.query('userId') || '';
        const queries: string[] = [
          Query.limit(limit),
          Query.offset(offset),
          Query.orderDesc('$createdAt'),
        ];
        if (userId) queries.push(Query.equal('userId', userId));

        const appwriteResult = await listDocuments(c.env, APPWRITE_COLLECTIONS.NOTIFICATIONS, queries);
        total = Math.max(total, appwriteResult.total);

        for (const doc of appwriteResult.documents as any[]) {
          results.push({
            id: doc.$id,
            title: doc.title || '',
            message: doc.message || '',
            type: doc.type || 'info',
            targetType: 'user',
            targetId: doc.userId || '',
            sentCount: 1,
            failedCount: 0,
            createdAt: doc.$createdAt,
            source: 'appwrite',
            userId: doc.userId || '',
            read: doc.read || false,
          });
        }
      } catch (appwriteErr) {
        // Appwrite collection might not exist yet — that's OK, D1 logs still show
        console.error('Appwrite notification fetch failed:', getErrorMessage(appwriteErr));
      }
    }

    // Sort combined results by date
    results.sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime());

    return c.json({ documents: results.slice(0, limit), total });
  } catch (error) {
    const message = getErrorMessage(error);
    return c.json({ error: message }, 500);
  }
});

// POST / — Send notification(s)
notificationRoutes.post('/', async (c) => {
  try {
    const data = await c.req.json<{
      title: string;
      message: string;
      type?: string;
      targetAll?: boolean;
      targetUserId?: string;
      targetInstitute?: string;
      actionUrl?: string;
      [key: string]: unknown;
    }>();

    const { title, message, type = 'info', targetAll, targetUserId, targetInstitute, actionUrl, ...extraData } = data;

    if (!title || !message) {
      return c.json({ error: 'Title and message are required' }, 400);
    }

    const created: Record<string, unknown>[] = [];
    let targetType = 'user';
    let targetId = targetUserId || '';

    if (targetAll) {
      targetType = 'all';
      targetId = 'all';
      // Send to all users — paginate through users
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const usersResult = await listDocuments(c.env, APPWRITE_COLLECTIONS.USERS, [
          Query.limit(limit),
          Query.offset(offset),
        ]);

        for (const user of usersResult.documents) {
          const userObj = user as { $id: string };
          try {
            const doc = await createDocument(c.env, APPWRITE_COLLECTIONS.NOTIFICATIONS, {
              title,
              message,
              type,
              userId: userObj.$id,
              actionUrl: actionUrl || '',
              read: false,
            });
            created.push(doc);
          } catch (docErr) {
            // Skip individual failures
            console.error('Failed to create notification for user:', userObj.$id, getErrorMessage(docErr));
          }
        }

        offset += limit;
        hasMore = usersResult.documents.length === limit;
      }
    } else if (targetInstitute) {
      targetType = 'institute';
      targetId = targetInstitute;
      // Send to all users in an institute
      const usersResult = await listDocuments(c.env, APPWRITE_COLLECTIONS.USERS, [
        Query.equal('institute', targetInstitute),
        Query.limit(500),
      ]);

      for (const user of usersResult.documents) {
        const userObj = user as { $id: string };
        try {
          const doc = await createDocument(c.env, APPWRITE_COLLECTIONS.NOTIFICATIONS, {
            title,
            message,
            type,
            userId: userObj.$id,
            actionUrl: actionUrl || '',
            read: false,
          });
          created.push(doc);
        } catch (docErr) {
          console.error('Failed to create notification for user:', userObj.$id, getErrorMessage(docErr));
        }
      }
    } else if (targetUserId) {
      // Send to specific user
      try {
        const doc = await createDocument(c.env, APPWRITE_COLLECTIONS.NOTIFICATIONS, {
          title,
          message,
          type,
          userId: targetUserId,
          actionUrl: actionUrl || '',
          read: false,
        });
        created.push(doc);
      } catch (docErr) {
        console.error('Failed to create notification:', getErrorMessage(docErr));
      }
    } else {
      return c.json({ error: 'Specify targetAll, targetUserId, or targetInstitute' }, 400);
    }

    // ALWAYS log to D1 notification_logs (even if 0 Appwrite docs created)
    const user = c.get('user');
    const logMetadata = JSON.stringify({ notifType: type, actionUrl: actionUrl || '', ...extraData });

    await c.env.DB.prepare(`
      INSERT INTO notification_logs (type, category, title, message, target_type, target_id, sent_count, failed_count, metadata, created_by)
      VALUES ('in-app', 'targeted', ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title,
      message,
      targetType,
      targetId,
      created.length,
      0, // failedCount — we skip individual failures silently
      logMetadata,
      user.id
    ).run();

    await logAudit(c.env, user.id, 'SEND_NOTIFICATION', 'notifications', undefined, {
      targetType,
      targetId,
      targetAll,
      targetUserId,
      targetInstitute,
      sentCount: created.length,
    });

    return c.json({ created, count: created.length, logged: true });
  } catch (error) {
    const message = getErrorMessage(error);
    return c.json({ error: message }, 500);
  }
});

export default notificationRoutes;
