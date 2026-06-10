/**
 * Notifications routes — GET, POST
 * D1-only: All notifications stored in D1 notifications table + notification_logs
 * Also sends OneSignal push notifications
 *
 * Category-based notification delivery:
 * - Admin selects a category when sending notification
 * - If user has that category OFF → skip user entirely (no in-app, no push)
 * - If user has category ON + quiet hours active → in-app only (no push sound)
 * - If user has category ON + no quiet hours → in-app + push with sound
 */

import { Hono } from 'hono';
import type { Env } from '../env';
import type { AuthVariables } from '../lib/auth';
import { adminAuthMiddleware } from '../lib/auth';
import { logAudit } from '../lib/audit';
import { getErrorMessage } from '../lib/utils';
import { sendPushNotification, getUserPushTokens, getBatchUserPushTokens } from '../lib/onesignal';

const notificationRoutes = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// Apply auth middleware to all notification routes
notificationRoutes.use('*', adminAuthMiddleware);

// ─── Helper: Check if current time is within user's quiet hours ───
function isInQuietHours(
  quietHoursEnabled: boolean,
  quietStart: string,
  quietEnd: string
): boolean {
  if (!quietHoursEnabled) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = (quietStart || '22:00').split(':').map(Number);
  const [endH, endM] = (quietEnd || '08:00').split(':').map(Number);

  const startMinutes = (startH || 0) * 60 + (startM || 0);
  const endMinutes = (endH || 0) * 60 + (endM || 0);

  // Handle overnight quiet hours (e.g., 22:00 → 08:00)
  if (startMinutes > endMinutes) {
    // e.g., 22:00 to 08:00 — current time is in quiet hours if >= 22:00 OR < 08:00
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } else {
    // e.g., 12:00 to 14:00 — current time is in quiet hours if >= start AND < end
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
}

// ─── Helper: Map notification type/category to preference columns ───
function getCategoryPushColumn(category: string): string {
  const map: Record<string, string> = {
    'course-update': 'course_updates_push',
    'info': 'course_updates_push',
    'success': 'course_updates_push',
    'grades': 'grades_push',
    'schedule': 'schedule_push',
    'payment': 'payment_push',
    'announcement': 'promotions_push',
    'promotions': 'promotions_push',
    'social': 'social_push',
    'system': 'system_push',
    'warning': 'system_push',
    'error': 'system_push',
    'support': 'system_push',
  };
  return map[category] || map['info'];
}

// ─── Helper: Get user notification preferences for a given category ───
// Returns: { shouldDeliver: boolean, shouldPush: boolean }
async function checkDeliveryPrefs(
  env: Env,
  userId: string,
  category: string
): Promise<{ shouldDeliver: boolean; shouldPush: boolean }> {
  try {
    const prefs = await env.DB.prepare(
      'SELECT * FROM notification_preferences WHERE user_id = ?'
    ).bind(userId).first() as any;

    if (!prefs) {
      // No preferences set → deliver with push by default
      return { shouldDeliver: true, shouldPush: true };
    }

    // Check master push switch
    if (!prefs.push_enabled) {
      // Master push is off — still deliver in-app, but no push
      // But check if category itself is off
      const categoryCol = getCategoryPushColumn(category);
      const categoryEnabled = !!prefs[categoryCol];
      if (!categoryEnabled) {
        // Category is off → don't deliver at all
        return { shouldDeliver: false, shouldPush: false };
      }
      // Category is on, master push is off → in-app only
      return { shouldDeliver: true, shouldPush: false };
    }

    // Check per-category preference
    const categoryCol = getCategoryPushColumn(category);
    const categoryEnabled = !!prefs[categoryCol];
    if (!categoryEnabled) {
      // Category is off → don't deliver at all
      return { shouldDeliver: false, shouldPush: false };
    }

    // Category is on — check quiet hours
    const quietHoursEnabled = !!prefs.quiet_hours_enabled;
    if (isInQuietHours(quietHoursEnabled, prefs.quiet_hours_start, prefs.quiet_hours_end)) {
      // Quiet hours active → deliver in-app silently, no push
      return { shouldDeliver: true, shouldPush: false };
    }

    // All good → deliver with push
    return { shouldDeliver: true, shouldPush: true };
  } catch (error) {
    // On error, default to delivering with push
    console.error('Failed to check delivery prefs:', error);
    return { shouldDeliver: true, shouldPush: true };
  }
}

// GET / — List notifications
notificationRoutes.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const userId = c.req.query('userId') || '';
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params: unknown[] = [];

    if (userId) {
      where += ' AND user_id = ?';
      params.push(userId);
    }

    // Count total
    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM notifications ${where}`
    ).bind(...params).first();
    const total = (countResult as any)?.total || 0;

    // Get notifications
    const result = await c.env.DB.prepare(
      `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all();

    // Also get notification logs for broadcast/sent info
    const logsResult = await c.env.DB.prepare(
      "SELECT * FROM notification_logs ORDER BY created_at DESC LIMIT ? OFFSET ?"
    ).bind(limit, offset).all();

    // Combine results
    const documents = [
      ...(result.results as any[]).map(row => ({
        id: row.id,
        title: row.title,
        message: row.message,
        type: row.type || 'info',
        category: row.category || '',
        userId: row.user_id,
        isRead: !!row.read,
        actionUrl: row.action_url,
        createdAt: row.created_at,
        source: 'd1',
      })),
      ...(logsResult.results as any[]).map(row => ({
        id: `log-${row.id}`,
        title: row.title,
        message: row.message,
        type: row.metadata ? (JSON.parse(row.metadata || '{}').notifType || 'info') : 'info',
        category: row.category || '',
        targetType: row.target_type,
        targetId: row.target_id,
        sentCount: row.sent_count,
        failedCount: row.failed_count,
        createdAt: row.created_at,
        source: 'log',
      })),
    ];

    // Sort combined by date
    documents.sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime());

    return c.json({ documents: documents.slice(0, limit), total: Math.max(total, documents.length) });
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
      category?: string;
      targetAll?: boolean;
      targetUserId?: string;
      targetInstitute?: string;
      targetTechnology?: string;
      actionUrl?: string;
      [key: string]: unknown;
    }>();

    const {
      title, message, type = 'info', category = 'info',
      targetAll, targetUserId, targetInstitute, targetTechnology,
      actionUrl, ...extraData
    } = data;

    if (!title || !message) {
      return c.json({ error: 'Title and message are required' }, 400);
    }

    // The effective category for preference matching is the type or explicit category
    const effectiveCategory = category || type;

    const created: Record<string, unknown>[] = [];
    const skippedByPref: string[] = [];  // Users skipped because category is OFF
    const silentDelivery: string[] = [];  // Users getting silent (quiet hours) delivery
    const pushDelivery: string[] = [];    // Users getting push notification
    let failedCount = 0;
    let targetType = 'user';
    let targetId = targetUserId || '';

    // ─── Helper: Process a single user's notification ───
    async function processUser(userId: string): Promise<void> {
      // Check delivery preferences for this user
      const { shouldDeliver, shouldPush } = await checkDeliveryPrefs(c.env, userId, effectiveCategory);

      if (!shouldDeliver) {
        // User has this category OFF — skip entirely
        skippedByPref.push(userId);
        return;
      }

      // Create in-app notification
      try {
        const notifId = crypto.randomUUID();
        await c.env.DB.prepare(`
          INSERT INTO notifications (id, user_id, title, message, type, category, read, action_url)
          VALUES (?, ?, ?, ?, ?, ?, 0, ?)
        `).bind(notifId, userId, title, message, type, effectiveCategory, actionUrl || null).run();
        created.push({ id: notifId, userId });
      } catch (docErr) {
        failedCount++;
        console.error('Failed to create notification for user:', userId, getErrorMessage(docErr));
        return;
      }

      if (shouldPush) {
        pushDelivery.push(userId);
      } else {
        silentDelivery.push(userId);
      }
    }

    if (targetAll) {
      targetType = 'all';
      targetId = 'all';
      // Send to all users — paginate through users
      let offset = 0;
      const batchLimit = 100;
      let hasMore = true;

      while (hasMore) {
        const usersResult = await c.env.DB.prepare(
          'SELECT id FROM users WHERE is_active = 1 LIMIT ? OFFSET ?'
        ).bind(batchLimit, offset).all();

        for (const user of usersResult.results as { id: string }[]) {
          await processUser(user.id);
        }

        offset += batchLimit;
        hasMore = usersResult.results.length === batchLimit;
      }
    } else if (targetInstitute) {
      targetType = 'institute';
      targetId = targetInstitute;
      // Send to all users in an institute
      const usersResult = await c.env.DB.prepare(
        'SELECT id FROM users WHERE institute_id = ? AND is_active = 1 LIMIT 500'
      ).bind(targetInstitute).all();

      for (const user of usersResult.results as { id: string }[]) {
        await processUser(user.id);
      }
    } else if (targetTechnology) {
      targetType = 'technology';
      targetId = targetTechnology;
      // Send to all users with a specific technology
      const usersResult = await c.env.DB.prepare(
        'SELECT id FROM users WHERE technology = ? AND is_active = 1 LIMIT 500'
      ).bind(targetTechnology).all();

      for (const user of usersResult.results as { id: string }[]) {
        await processUser(user.id);
      }
    } else if (targetUserId) {
      // Send to specific user
      await processUser(targetUserId);
    } else {
      return c.json({ error: 'Specify targetAll, targetUserId, targetInstitute, or targetTechnology' }, 400);
    }

    // ─── Send OneSignal push notifications to eligible users ───
    try {
      if (pushDelivery.length > 0) {
        // Send push to users who have push enabled and are not in quiet hours
        const pushTokens = await getBatchUserPushTokens(c.env, pushDelivery);
        if (pushTokens.length > 0) {
          await sendPushNotification(c.env, {
            title,
            message,
            targetPlayerIds: pushTokens,
            url: actionUrl || undefined,
          });
        }
      }

      // For targetAll with no preferences set, also try segment-based push as fallback
      if (targetAll && pushDelivery.length === 0 && skippedByPref.length === 0) {
        await sendPushNotification(c.env, {
          title,
          message,
          targetSegment: 'All',
          url: actionUrl || undefined,
        });
      }
    } catch (pushErr) {
      console.error('Push notification failed:', getErrorMessage(pushErr));
    }

    // Log to notification_logs
    const user = c.get('user');
    const logMetadata = JSON.stringify({
      notifType: type,
      category: effectiveCategory,
      actionUrl: actionUrl || '',
      skippedByPref: skippedByPref.length,
      silentDelivery: silentDelivery.length,
      pushDelivery: pushDelivery.length,
      ...extraData,
    });

    await c.env.DB.prepare(`
      INSERT INTO notification_logs (type, category, title, message, target_type, target_id, sent_count, failed_count, metadata, created_by)
      VALUES ('in-app', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      effectiveCategory,
      title,
      message,
      targetType,
      targetId,
      created.length,
      failedCount,
      logMetadata,
      user.id
    ).run();

    await logAudit(c.env, user.id, 'SEND_NOTIFICATION', 'notifications', undefined, {
      targetType,
      targetId,
      targetAll,
      targetUserId,
      targetInstitute,
      targetTechnology,
      category: effectiveCategory,
      sentCount: created.length,
      failedCount,
      skippedByPref: skippedByPref.length,
      silentDelivery: silentDelivery.length,
      pushDelivery: pushDelivery.length,
    });

    return c.json({
      created,
      count: created.length,
      failedCount,
      skippedByPref: skippedByPref.length,
      silentDelivery: silentDelivery.length,
      pushDelivery: pushDelivery.length,
      logged: true,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    return c.json({ error: message }, 500);
  }
});

export default notificationRoutes;
