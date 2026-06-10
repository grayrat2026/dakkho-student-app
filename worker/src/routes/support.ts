/**
 * Support Ticket Routes — Public (Student), Admin, Telegram Webhook
 *
 * Public routes (mounted on /api/support):
 *   POST /tickets          — Create ticket (with optional attachments via multipart)
 *   GET  /tickets          — List user's tickets
 *   GET  /tickets/:id      — Get ticket detail + messages
 *   POST /tickets/:id/messages — Add message to ticket
 *   POST /tickets/:id/attachment — Upload attachment to R2
 *
 * Admin routes (mounted on /admin/support):
 *   GET  /tickets          — List all tickets (filterable)
 *   GET  /tickets/:id      — Get ticket detail
 *   POST /tickets/:id/reply — Admin reply to ticket
 *   PUT  /tickets/:id/resolve — Mark ticket resolved
 *   PUT  /tickets/:id/status  — Change ticket status
 *   GET  /config           — Get support config (TG chat IDs, email)
 *   PUT  /config           — Update support config
 *
 * Telegram webhook (mounted on /api/webhook/telegram):
 *   POST /                 — Receive Telegram bot messages/commands
 */

import { Hono } from 'hono';
import type { Env } from '../env';
import type { AuthVariables } from '../lib/auth';
import { adminAuthMiddleware } from '../lib/auth';
import { getErrorMessage } from '../lib/utils';
import { generateId } from '../lib/utils';
import { sendPushNotification, getUserPushTokens } from '../lib/onesignal';
import { sendWebPush } from '../lib/web-push';
import { uploadFile } from '../lib/r2';

// ─── Helper: Generate ticket ID ───
function generateTicketId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TK-${dateStr}-${rand}`;
}

// ─── Helper: Get Telegram config from app_config ───
async function getTelegramConfig(env: Env): Promise<{ botToken: string; chatIds: string[] }> {
  try {
    const tokenRow = await env.DB.prepare(
      "SELECT value FROM app_config WHERE key = 'telegram_bot_token'"
    ).first<{ value: string }>();
    const chatIdsRow = await env.DB.prepare(
      "SELECT value FROM app_config WHERE key = 'telegram_chat_ids'"
    ).first<{ value: string }>();

    const botToken = tokenRow?.value || '';
    let chatIds: string[] = [];
    if (chatIdsRow?.value) {
      try { chatIds = JSON.parse(chatIdsRow.value); } catch { chatIds = []; }
    }
    return { botToken, chatIds };
  } catch {
    return { botToken: '', chatIds: [] };
  }
}

// ─── Helper: Send Telegram message ───
async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
  replyMarkup?: Record<string, unknown>
): Promise<void> {
  if (!botToken) return;
  try {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
  }
}

// ─── Helper: Send notification for new ticket to Telegram ───
async function notifyNewTicket(env: Env, ticket: { ticket_id: string; subject: string; category: string; priority: string; email: string; name: string | null; message: string }): Promise<void> {
  const { botToken, chatIds } = await getTelegramConfig(env);
  if (!botToken || chatIds.length === 0) return;

  const priorityEmoji: Record<string, string> = {
    low: '🟢', normal: '🟡', high: '🟠', urgent: '🔴',
  };
  const emoji = priorityEmoji[ticket.priority] || '🟡';

  const text = `📩 <b>New Support Ticket</b>\n\n` +
    `🎫 Ticket: <code>${ticket.ticket_id}</code>\n` +
    `📌 Subject: ${ticket.subject}\n` +
    `📂 Category: ${ticket.category}\n` +
    `${emoji} Priority: ${ticket.priority.toUpperCase()}\n` +
    `👤 From: ${ticket.name || ticket.email}\n\n` +
    `💬 <i>${ticket.message.substring(0, 500)}${ticket.message.length > 500 ? '...' : ''}</i>\n\n` +
    `Reply: /reply ${ticket.ticket_id} Your message here\n` +
    `Resolve: /resolve ${ticket.ticket_id} Resolution details`;

  for (const chatId of chatIds) {
    await sendTelegramMessage(botToken, chatId, text);
  }
}

// ─── Helper: Send push notification for resolved ticket ───
async function notifyTicketResolved(
  env: Env,
  userId: string,
  ticketId: string,
  resolvedContent: string
): Promise<void> {
  try {
    // Try web push first (VAPID)
    const timestamp = Math.floor(Date.now() / 1000);
    const encodedContent = encodeURIComponent(resolvedContent.substring(0, 200));
    const url = `https://dakkho-student.pages.dev/help/contact-support/${ticketId}/${timestamp}/${encodedContent}`;
    await sendWebPushToUser(env, userId, {
      type: 'ticket_resolved',
      ticketId,
      title: 'Support Ticket Resolved',
      body: `Your ticket ${ticketId} has been resolved`,
      url,
    });

    // Also try OneSignal as fallback
    const tokens = await getUserPushTokens(env, userId);
    if (tokens.length === 0) return;

    await sendPushNotification(env, {
      title: 'Support Ticket Resolved',
      titleBn: 'সাপোর্ট টিকেট সমাধান হয়েছে',
      message: `Your ticket ${ticketId} has been resolved`,
      messageBn: `আপনার টিকেট ${ticketId} সমাধান করা হয়েছে`,
      url,
      data: {
        type: 'ticket_resolved',
        ticketId,
        resolvedContent,
        url,
      },
      targetPlayerIds: tokens,
    });
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}

// ─── Helper: Send push notification for new reply ───
async function notifyTicketReply(
  env: Env,
  userId: string,
  ticketId: string,
  senderType: string,
  replyPreview: string
): Promise<void> {
  try {
    // Only notify user if reply is from admin/telegram/email
    if (senderType === 'user') return;

    // Try web push first (VAPID)
    await sendWebPushToUser(env, userId, {
      type: 'ticket_reply',
      ticketId,
      title: 'New Support Reply',
      body: replyPreview.substring(0, 100),
      url: `https://dakkho-student.pages.dev/help/contact-support`,
    });

    // Also try OneSignal as fallback
    const tokens = await getUserPushTokens(env, userId);
    if (tokens.length === 0) return;

    const url = `https://dakkho-student.pages.dev/help/contact-support`;

    await sendPushNotification(env, {
      title: 'New Support Reply',
      titleBn: 'নতুন সাপোর্ট রিপ্লাই',
      message: replyPreview.substring(0, 100),
      messageBn: replyPreview.substring(0, 100),
      url,
      data: {
        type: 'ticket_reply',
        ticketId,
      },
      targetPlayerIds: tokens,
    });
  } catch (error) {
    console.error('Failed to send push notification for reply:', error);
  }
}

// ─── Helper: Send web push notification to a user via VAPID ───
async function sendWebPushToUser(
  env: Env,
  userId: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    if (!env.VAPID_PRIVATE_KEY || !env.VAPID_PUBLIC_KEY) return;

    // Get all active push tokens/subscriptions for this user
    const result = await env.DB.prepare(
      "SELECT push_token, device_type, device_info FROM user_push_tokens WHERE user_id = ? AND is_active = 1"
    ).bind(userId).all();

    for (const row of result.results as { push_token: string; device_type: string; device_info: string }[]) {
      if (row.device_type === 'webpush' && row.device_info) {
        // This is a web push subscription
        try {
          const subscription = JSON.parse(row.device_info);
          if (subscription.endpoint && subscription.keys) {
            await sendWebPush(env, subscription, payload);
          }
        } catch (e) {
          console.error('Failed to send web push:', e);
        }
      }
    }
  } catch (error) {
    console.error('Failed to send web push to user:', error);
  }
}

// ─── Helper: Save a notification to the notifications table for tray ───
async function saveNotification(
  env: Env,
  userId: string,
  title: string,
  message: string,
  actionUrl: string,
  type: string = 'info',
  category: string = ''
): Promise<void> {
  try {
    await env.DB.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, category, read, action_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, datetime('now'), datetime('now'))
    `).bind(generateId(), userId, title, message, type, category, actionUrl).run();
  } catch (error) {
    console.error('Failed to save notification:', error);
  }
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC ROUTES (Student-facing, mounted on /api/support)
// ═══════════════════════════════════════════════════════════════

const supportPublicRoutes = new Hono<{ Bindings: Env }>();

// POST /tickets — Create new ticket
supportPublicRoutes.post('/tickets', async (c) => {
  try {
    const contentType = c.req.header('Content-Type') || '';
    let subject = '';
    let category = 'General';
    let priority = 'normal';
    let description = '';
    let userEmail = '';
    let userName = '';
    let userId: string | null = null;
    let attachmentUrls: string[] = [];

    // Get user info from auth token if available
    const authHeader = c.req.header('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const session = await c.env.DB.prepare(
          'SELECT user_id, email, name FROM student_sessions WHERE id = ? AND is_active = 1'
        ).bind(token).first<{ user_id: string; email: string; name: string }>();
        if (session) {
          userId = session.user_id;
          userEmail = session.email;
          userName = session.name || '';
        }
      } catch {}
    }

    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData();
      subject = (formData.get('subject') as string) || '';
      category = (formData.get('category') as string) || 'General';
      priority = (formData.get('priority') as string) || 'normal';
      description = (formData.get('description') as string) || '';
      userEmail = userEmail || (formData.get('email') as string) || '';
      userName = userName || (formData.get('name') as string) || '';

      // Handle file attachments
      const files = formData.getAll('files') as unknown as File[];
      for (const file of files) {
        if (!file || file.size === 0) continue;
        if (file.size > 10 * 1024 * 1024) continue; // 10MB max per file

        const arrayBuffer = await file.arrayBuffer();
        const key = `support/${Date.now()}-${file.name}`;
        await uploadFile(c.env.R2_SUPPORT_ATTACHMENTS, key, arrayBuffer, file.type);
        attachmentUrls.push(key);
      }
    } else {
      const body = await c.req.json();
      subject = body.subject || '';
      category = body.category || 'General';
      priority = body.priority || 'normal';
      description = body.description || '';
      userEmail = userEmail || body.email || '';
      userName = userName || body.name || '';
      attachmentUrls = body.attachmentUrls || [];
    }

    if (!subject.trim() || !description.trim()) {
      return c.json({ error: 'Subject and description are required' }, 400);
    }
    if (!userEmail.trim()) {
      return c.json({ error: 'Email is required' }, 400);
    }

    const ticketId = generateTicketId();

    // Insert ticket
    await c.env.DB.prepare(`
      INSERT INTO support_tickets (ticket_id, user_id, name, email, subject, category, priority, status, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?)
    `).bind(ticketId, userId, userName, userEmail, subject, category, priority, description).run();

    // Insert first message
    await c.env.DB.prepare(`
      INSERT INTO support_messages (ticket_id, sender_type, sender_name, message, attachments, source)
      VALUES (?, 'user', ?, ?, ?, 'app')
    `).bind(ticketId, userName || userEmail, description, JSON.stringify(attachmentUrls)).run();

    // Notify via Telegram
    await notifyNewTicket(c.env, { ticket_id: ticketId, subject, category, priority, email: userEmail, name: userName, message: description });

    // Send confirmation email
    try {
      const supportEmail = c.env.RESEND_SUPPORT_EMAIL || 'support@dakkho.pro.bd';
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0ea5e9;">DAKKHO Support</h2>
          <p>Hi ${userName || userEmail},</p>
          <p>Your support ticket has been created successfully.</p>
          <p><strong>Ticket ID:</strong> ${ticketId}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Category:</strong> ${category}</p>
          <p>Our team will respond within 24-48 hours.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 12px;">DAKKHO Academy — Support Team</p>
        </div>
      `;
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: supportEmail,
          to: [userEmail],
          subject: `[DAKKHO Support] Ticket ${ticketId} Created`,
          html,
        }),
      });
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
    }

    return c.json({
      success: true,
      ticketId,
      message: 'Ticket created successfully',
    }, 201);
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /tickets — List user's tickets
supportPublicRoutes.get('/tickets', async (c) => {
  try {
    const email = c.req.query('email');
    const userId = c.req.query('userId');

    if (!email && !userId) {
      return c.json({ error: 'email or userId is required' }, 400);
    }

    let query = 'SELECT * FROM support_tickets WHERE ';
    const params: unknown[] = [];

    if (userId) {
      query += 'user_id = ?';
      params.push(userId);
    } else {
      query += 'email = ?';
      params.push(email);
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({ tickets: result.results });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /tickets/:ticketId — Get ticket detail + messages
supportPublicRoutes.get('/tickets/:ticketId', async (c) => {
  try {
    const ticketId = c.req.param('ticketId');

    const ticket = await c.env.DB.prepare(
      'SELECT * FROM support_tickets WHERE ticket_id = ?'
    ).bind(ticketId).first();

    if (!ticket) {
      return c.json({ error: 'Ticket not found' }, 404);
    }

    const messages = await c.env.DB.prepare(
      'SELECT * FROM support_messages WHERE ticket_id = ? ORDER BY created_at ASC'
    ).bind(ticketId).all();

    return c.json({ ticket, messages: messages.results });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// POST /tickets/:ticketId/messages — Add message to ticket
supportPublicRoutes.post('/tickets/:ticketId/messages', async (c) => {
  try {
    const ticketId = c.req.param('ticketId');
    const contentType = c.req.header('Content-Type') || '';
    let message = '';
    let senderName = '';
    let senderType = 'user';
    let attachmentUrls: string[] = [];

    // Check ticket exists
    const ticket = await c.env.DB.prepare(
      'SELECT * FROM support_tickets WHERE ticket_id = ?'
    ).bind(ticketId).first<{ status: string; user_id: string | null; email: string }>();

    if (!ticket) {
      return c.json({ error: 'Ticket not found' }, 404);
    }

    // Try to get user info from auth token
    const authHeader = c.req.header('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const session = await c.env.DB.prepare(
          'SELECT user_id, email, name FROM student_sessions WHERE id = ? AND is_active = 1'
        ).bind(token).first<{ user_id: string; email: string; name: string }>();
        if (session) {
          senderName = session.name || session.email;
        }
      } catch {}
    }

    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData();
      message = (formData.get('message') as string) || '';
      senderName = senderName || (formData.get('name') as string) || '';
      senderType = (formData.get('senderType') as string) || 'user';

      const files = formData.getAll('files') as unknown as File[];
      for (const file of files) {
        if (!file || file.size === 0) continue;
        if (file.size > 10 * 1024 * 1024) continue;
        const arrayBuffer = await file.arrayBuffer();
        const key = `support/${ticketId}/${Date.now()}-${file.name}`;
        await uploadFile(c.env.R2_SUPPORT_ATTACHMENTS, key, arrayBuffer, file.type);
        attachmentUrls.push(key);
      }
    } else {
      const body = await c.req.json();
      message = body.message || '';
      senderName = senderName || body.name || '';
      senderType = body.senderType || 'user';
      attachmentUrls = body.attachmentUrls || [];
    }

    if (!message.trim()) {
      return c.json({ error: 'Message is required' }, 400);
    }

    await c.env.DB.prepare(`
      INSERT INTO support_messages (ticket_id, sender_type, sender_name, message, attachments, source)
      VALUES (?, ?, ?, ?, ?, 'app')
    `).bind(ticketId, senderType, senderName, message, JSON.stringify(attachmentUrls)).run();

    // Update ticket updated_at and reopen if was resolved
    const newStatus = ticket.status === 'resolved' ? 'open' : ticket.status;
    await c.env.DB.prepare(
      "UPDATE support_tickets SET updated_at = datetime('now'), status = ? WHERE ticket_id = ?"
    ).bind(newStatus, ticketId).run();

    // If user is replying, notify admin via Telegram
    if (senderType === 'user') {
      const { botToken, chatIds } = await getTelegramConfig(c.env);
      for (const chatId of chatIds) {
        await sendTelegramMessage(botToken, chatId,
          `💬 <b>User Reply on ${ticketId}</b>\n\n` +
          `👤 ${senderName}\n` +
          `💬 <i>${message.substring(0, 500)}${message.length > 500 ? '...' : ''}</i>\n\n` +
          `Reply: /reply ${ticketId} Your message here`
        );
      }
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /attachment-url — Get a presigned/public URL for an attachment
supportPublicRoutes.get('/attachment-url', async (c) => {
  try {
    const key = c.req.query('key');
    if (!key) {
      return c.json({ error: 'key is required' }, 400);
    }

    // Serve the file from R2 via our upload route
    const file = await c.env.R2_SUPPORT_ATTACHMENTS.get(key);
    if (!file) {
      return c.json({ error: 'File not found' }, 404);
    }

    const headers = new Headers();
    if (file.httpMetadata?.contentType) {
      headers.set('Content-Type', file.httpMetadata.contentType);
    }
    headers.set('Cache-Control', 'public, max-age=86400');
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(file.body, { headers });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// ADMIN ROUTES (mounted on /admin/support)
// ═══════════════════════════════════════════════════════════════

const supportAdminRoutes = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
supportAdminRoutes.use('*', adminAuthMiddleware);

// GET /tickets — List all tickets (filterable)
supportAdminRoutes.get('/tickets', async (c) => {
  try {
    const status = c.req.query('status') || 'all';
    const priority = c.req.query('priority') || 'all';
    const category = c.req.query('category') || 'all';
    const search = c.req.query('search') || '';
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM support_tickets';
    let countQuery = 'SELECT COUNT(*) as total FROM support_tickets';
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }
    if (priority !== 'all') {
      conditions.push('priority = ?');
      params.push(priority);
    }
    if (category !== 'all') {
      conditions.push('category = ?');
      params.push(category);
    }
    if (search) {
      conditions.push('(subject LIKE ? OR ticket_id LIKE ? OR email LIKE ? OR name LIKE ?)');
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = (countResult as any)?.total || 0;

    const result = await c.env.DB.prepare(query).bind(...params, limit, offset).all();

    return c.json({ tickets: result.results, total, page, limit });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /tickets/:ticketId — Get ticket detail + messages
supportAdminRoutes.get('/tickets/:ticketId', async (c) => {
  try {
    const ticketId = c.req.param('ticketId');

    const ticket = await c.env.DB.prepare(
      'SELECT * FROM support_tickets WHERE ticket_id = ?'
    ).bind(ticketId).first();

    if (!ticket) {
      return c.json({ error: 'Ticket not found' }, 404);
    }

    const messages = await c.env.DB.prepare(
      'SELECT * FROM support_messages WHERE ticket_id = ? ORDER BY created_at ASC'
    ).bind(ticketId).all();

    return c.json({ ticket, messages: messages.results });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// POST /tickets/:ticketId/reply — Admin reply to ticket (supports file attachments)
supportAdminRoutes.post('/tickets/:ticketId/reply', async (c) => {
  try {
    const ticketId = c.req.param('ticketId');
    const contentType = c.req.header('Content-Type') || '';
    let message = '';
    let attachmentUrls: string[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData();
      message = (formData.get('message') as string) || '';

      // Handle file attachments
      const files = formData.getAll('files') as unknown as File[];
      for (const file of files) {
        if (!file || file.size === 0) continue;
        if (file.size > 10 * 1024 * 1024) continue; // 10MB max
        const arrayBuffer = await file.arrayBuffer();
        const key = `support/${ticketId}/${Date.now()}-${file.name}`;
        await uploadFile(c.env.R2_SUPPORT_ATTACHMENTS, key, arrayBuffer, file.type);
        attachmentUrls.push(key);
      }
    } else {
      const body = await c.req.json();
      message = body.message || '';
      attachmentUrls = body.attachmentUrls || [];
    }

    if (!message.trim() && attachmentUrls.length === 0) {
      return c.json({ error: 'Message or attachment is required' }, 400);
    }

    const ticket = await c.env.DB.prepare(
      'SELECT * FROM support_tickets WHERE ticket_id = ?'
    ).bind(ticketId).first<{ status: string; user_id: string | null; email: string; ticket_id: string }>();

    if (!ticket) {
      return c.json({ error: 'Ticket not found' }, 404);
    }

    const user = c.get('user');

    // Save reply message
    await c.env.DB.prepare(`
      INSERT INTO support_messages (ticket_id, sender_type, sender_name, message, attachments, source)
      VALUES (?, 'admin', ?, ?, ?, 'admin')
    `).bind(ticketId, user.name || 'Admin', message, JSON.stringify(attachmentUrls)).run();

    // Update ticket status to in_progress if it was open
    if (ticket.status === 'open') {
      await c.env.DB.prepare(
        "UPDATE support_tickets SET status = 'in_progress', updated_at = datetime('now') WHERE ticket_id = ?"
      ).bind(ticketId).run();
    } else {
      await c.env.DB.prepare(
        "UPDATE support_tickets SET updated_at = datetime('now') WHERE ticket_id = ?"
      ).bind(ticketId).run();
    }

    // Notify user via push
    if (ticket.user_id) {
      await notifyTicketReply(c.env, ticket.user_id, ticketId, 'admin', message);
      // Save notification for tray
      const timestamp = Math.floor(Date.now() / 1000);
      const notifUrl = `https://dakkho-student.pages.dev/help/contact-support/${ticketId}`;
      await saveNotification(c.env, ticket.user_id, 'New Support Reply', message.substring(0, 200), notifUrl, 'info', 'support');
    }

    // Notify via Telegram about admin reply
    const { botToken, chatIds } = await getTelegramConfig(c.env);
    for (const chatId of chatIds) {
      await sendTelegramMessage(botToken, chatId,
        `✅ <b>Admin Reply on ${ticketId}</b>\n\n` +
        `👤 ${user.name || 'Admin'}\n` +
        `💬 <i>${message.substring(0, 500)}${message.length > 500 ? '...' : ''}</i>`
      );
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// PUT /tickets/:ticketId/resolve — Mark ticket resolved
supportAdminRoutes.put('/tickets/:ticketId/resolve', async (c) => {
  try {
    const ticketId = c.req.param('ticketId');
    const { resolvedContent } = await c.req.json();

    if (!resolvedContent?.trim()) {
      return c.json({ error: 'resolvedContent is required' }, 400);
    }

    const ticket = await c.env.DB.prepare(
      'SELECT * FROM support_tickets WHERE ticket_id = ?'
    ).bind(ticketId).first<{ status: string; user_id: string | null; email: string; ticket_id: string }>();

    if (!ticket) {
      return c.json({ error: 'Ticket not found' }, 404);
    }

    const user = c.get('user');

    // Update ticket
    await c.env.DB.prepare(`
      UPDATE support_tickets
      SET status = 'resolved', resolved_content = ?, resolved_at = datetime('now'), resolved_by = ?, updated_at = datetime('now')
      WHERE ticket_id = ?
    `).bind(resolvedContent, user.name || 'Admin', ticketId).run();

    // Add resolution message
    await c.env.DB.prepare(`
      INSERT INTO support_messages (ticket_id, sender_type, sender_name, message, attachments, source)
      VALUES (?, 'admin', ?, ?, '[]', 'admin')
    `).bind(ticketId, user.name || 'Admin', `✅ Ticket Resolved: ${resolvedContent}`).run();

    // Push notification to user
    if (ticket.user_id) {
      await notifyTicketResolved(c.env, ticket.user_id, ticketId, resolvedContent);

      // Save notification for tray
      const timestamp = Math.floor(Date.now() / 1000);
      const encodedContent = encodeURIComponent(resolvedContent.substring(0, 200));
      const notifUrl = `https://dakkho-student.pages.dev/help/contact-support/${ticketId}/${timestamp}/${encodedContent}`;
      await saveNotification(c.env, ticket.user_id, 'Support Ticket Resolved', `Your ticket ${ticketId} has been resolved: ${resolvedContent.substring(0, 100)}`, notifUrl, 'success', 'support');
    }

    // Send resolution email
    try {
      const supportEmail = c.env.RESEND_SUPPORT_EMAIL || 'support@dakkho.pro.bd';
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">✅ Ticket Resolved</h2>
          <p>Hi ${ticket.email},</p>
          <p>Your support ticket has been resolved.</p>
          <p><strong>Ticket ID:</strong> ${ticketId}</p>
          <p><strong>Resolution:</strong> ${resolvedContent}</p>
          <p>If you need further assistance, feel free to reply to the ticket.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 12px;">DAKKHO Academy — Support Team</p>
        </div>
      `;
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: supportEmail,
          to: [ticket.email],
          subject: `[DAKKHO Support] Ticket ${ticketId} Resolved`,
          html,
        }),
      });
    } catch (error) {
      console.error('Failed to send resolution email:', error);
    }

    // Notify Telegram
    const { botToken, chatIds } = await getTelegramConfig(c.env);
    for (const chatId of chatIds) {
      await sendTelegramMessage(botToken, chatId,
        `✅ <b>Ticket ${ticketId} Resolved</b>\n\n` +
        `📝 ${resolvedContent.substring(0, 500)}\n\n` +
        `Resolved by: ${user.name || 'Admin'}`
      );
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// PUT /tickets/:ticketId/status — Change ticket status
supportAdminRoutes.put('/tickets/:ticketId/status', async (c) => {
  try {
    const ticketId = c.req.param('ticketId');
    const { status } = await c.req.json();

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return c.json({ error: 'Invalid status. Must be: open, in_progress, resolved, closed' }, 400);
    }

    const ticket = await c.env.DB.prepare(
      'SELECT * FROM support_tickets WHERE ticket_id = ?'
    ).bind(ticketId).first<{ status: string; user_id: string | null; email: string; ticket_id: string }>();

    if (!ticket) {
      return c.json({ error: 'Ticket not found' }, 404);
    }

    await c.env.DB.prepare(
      "UPDATE support_tickets SET status = ?, updated_at = datetime('now') WHERE ticket_id = ?"
    ).bind(status, ticketId).run();

    // Save notification to user about status change
    if (ticket.user_id && status !== (ticket as any).status) {
      const statusLabels: Record<string, string> = {
        open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed',
      };
      const notifUrl = `https://dakkho-student.pages.dev/help/contact-support/${ticketId}`;
      const notifType = status === 'resolved' ? 'success' : status === 'closed' ? 'warning' : 'info';
      await saveNotification(
        c.env, ticket.user_id,
        `Ticket Status Updated`,
        `Your ticket ${ticketId} status changed to ${statusLabels[status] || status}.`,
        notifUrl, notifType, 'support'
      );
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /config — Get support config
supportAdminRoutes.get('/config', async (c) => {
  try {
    const tokenRow = await c.env.DB.prepare(
      "SELECT value FROM app_config WHERE key = 'telegram_bot_token'"
    ).first<{ value: string }>();
    const chatIdsRow = await c.env.DB.prepare(
      "SELECT value FROM app_config WHERE key = 'telegram_chat_ids'"
    ).first<{ value: string }>();
    const emailRow = await c.env.DB.prepare(
      "SELECT value FROM app_config WHERE key = 'support_email'"
    ).first<{ value: string }>();

    let chatIds: string[] = [];
    if (chatIdsRow?.value) {
      try { chatIds = JSON.parse(chatIdsRow.value); } catch {}
    }

    return c.json({
      telegramBotToken: tokenRow?.value ? '••••••••' + tokenRow.value.slice(-6) : '',
      telegramChatIds: chatIds,
      supportEmail: emailRow?.value || '',
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// PUT /config — Update support config
supportAdminRoutes.put('/config', async (c) => {
  try {
    const { telegramChatIds, supportEmail } = await c.req.json();

    if (telegramChatIds !== undefined) {
      await c.env.DB.prepare(
        `INSERT INTO app_config (key, value, updated_at) VALUES ('telegram_chat_ids', ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
      ).bind(JSON.stringify(telegramChatIds)).run();
    }

    if (supportEmail !== undefined) {
      await c.env.DB.prepare(
        `INSERT INTO app_config (key, value, updated_at) VALUES ('support_email', ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
      ).bind(supportEmail).run();
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /stats — Support statistics
supportAdminRoutes.get('/stats', async (c) => {
  try {
    const open = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM support_tickets WHERE status = 'open'"
    ).first();
    const inProgress = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM support_tickets WHERE status = 'in_progress'"
    ).first();
    const resolved = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM support_tickets WHERE status = 'resolved'"
    ).first();
    const closed = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM support_tickets WHERE status = 'closed'"
    ).first();
    const total = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM support_tickets"
    ).first();

    return c.json({
      open: (open as any)?.count || 0,
      inProgress: (inProgress as any)?.count || 0,
      resolved: (resolved as any)?.count || 0,
      closed: (closed as any)?.count || 0,
      total: (total as any)?.count || 0,
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// TELEGRAM WEBHOOK (mounted on /api/webhook/telegram)
// ═══════════════════════════════════════════════════════════════

const telegramWebhookRoutes = new Hono<{ Bindings: Env }>();

telegramWebhookRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();

    // Verify the bot token from query param for security
    const botToken = c.req.query('token');
    const { botToken: configToken } = await getTelegramConfig(c.env);
    if (!configToken || botToken !== configToken) {
      console.error('Telegram webhook auth failed. Token mismatch or missing config.');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Handle both message and callback_query
    const message = body.message || (body.callback_query?.message);
    const text = body.message?.text || '';
    const fromName = body.message?.from?.first_name || body.callback_query?.from?.first_name || 'Admin';
    const chatId = String((body.message?.chat?.id) || (body.callback_query?.message?.chat?.id) || '');

    if (!text && !body.callback_query) {
      return c.json({ ok: true });
    }

    const trimmedText = (text || '').trim();

    // Handle commands
    if (trimmedText === '/start') {
      await sendTelegramMessage(configToken, chatId,
        `👋 <b>Welcome to DAKKHO Support Bot!</b>\n\n` +
        `Commands:\n` +
        `/tickets [status] — List tickets\n` +
        `/view TK-XXXXXX — View ticket\n` +
        `/reply TK-XXXXXX message — Reply to ticket\n` +
        `/resolve TK-XXXXXX details — Resolve ticket\n` +
        `/close TK-XXXXXX — Close ticket\n` +
        `/stats — Support statistics\n` +
        `/chatids — Show chat IDs`
      );
      return c.json({ ok: true });
    }

    if (trimmedText === '/chatids') {
      const { chatIds } = await getTelegramConfig(c.env);
      await sendTelegramMessage(configToken, chatId,
        `📋 <b>Chat IDs:</b>\n\n` +
        chatIds.map((id, i) => `${i + 1}. <code>${id}</code>`).join('\n') +
        `\n\nCurrent chat: <code>${chatId}</code>`
      );
      return c.json({ ok: true });
    }

    if (trimmedText === '/stats') {
      const open = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM support_tickets WHERE status = 'open'"
      ).first();
      const inProgress = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM support_tickets WHERE status = 'in_progress'"
      ).first();
      const resolved = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM support_tickets WHERE status = 'resolved'"
      ).first();
      const total = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM support_tickets"
      ).first();

      await sendTelegramMessage(configToken, chatId,
        `📊 <b>Support Statistics</b>\n\n` +
        `🟢 Open: ${(open as any)?.count || 0}\n` +
        `🟡 In Progress: ${(inProgress as any)?.count || 0}\n` +
        `✅ Resolved: ${(resolved as any)?.count || 0}\n` +
        `📋 Total: ${(total as any)?.count || 0}`
      );
      return c.json({ ok: true });
    }

    // /tickets [status]
    const ticketsMatch = trimmedText.match(/^\/tickets(?:\s+(\w+))?$/);
    if (ticketsMatch) {
      const statusFilter = ticketsMatch[1] || 'open';
      let query = 'SELECT ticket_id, subject, status, priority, created_at FROM support_tickets';
      const params: string[] = [];

      if (statusFilter !== 'all') {
        query += ' WHERE status = ?';
        params.push(statusFilter);
      }
      query += ' ORDER BY created_at DESC LIMIT 10';

      const result = await c.env.DB.prepare(query).bind(...params).all();

      if (result.results.length === 0) {
        await sendTelegramMessage(configToken, chatId, `No ${statusFilter} tickets found.`);
      } else {
        const statusEmoji: Record<string, string> = { open: '🟢', in_progress: '🟡', resolved: '✅', closed: '🔒' };
        const list = result.results.map((t: any) =>
          `${statusEmoji[t.status] || '⚪'} <code>${t.ticket_id}</code> — ${t.subject}\n` +
          `   ${t.priority.toUpperCase()} | ${t.created_at}`
        ).join('\n\n');

        await sendTelegramMessage(configToken, chatId,
          `📋 <b>${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Tickets:</b>\n\n${list}\n\n` +
          `View: /view TK-XXXXXX\nReply: /reply TK-XXXXXX message\nResolve: /resolve TK-XXXXXX details`
        );
      }
      return c.json({ ok: true });
    }

    // /view TK-XXXXXX
    const viewMatch = trimmedText.match(/^\/view\s+(TK-[\w-]+)$/);
    if (viewMatch) {
      const ticketId = viewMatch[1];
      const ticket = await c.env.DB.prepare(
        'SELECT * FROM support_tickets WHERE ticket_id = ?'
      ).bind(ticketId).first<any>();

      if (!ticket) {
        await sendTelegramMessage(configToken, chatId, `❌ Ticket ${ticketId} not found.`);
        return c.json({ ok: true });
      }

      const messages = await c.env.DB.prepare(
        'SELECT * FROM support_messages WHERE ticket_id = ? ORDER BY created_at ASC LIMIT 20'
      ).bind(ticketId).all();

      const statusEmoji: Record<string, string> = { open: '🟢', in_progress: '🟡', resolved: '✅', closed: '🔒' };
      let msgText = `🎫 <b>Ticket ${ticketId}</b>\n\n` +
        `📌 Subject: ${ticket.subject}\n` +
        `📂 Category: ${ticket.category}\n` +
        `⚠️ Priority: ${ticket.priority.toUpperCase()}\n` +
        `${statusEmoji[ticket.status] || '⚪'} Status: ${ticket.status}\n` +
        `👤 User: ${ticket.name || ticket.email}\n` +
        `📅 Created: ${ticket.created_at}`;

      if (ticket.resolved_content) {
        msgText += `\n\n✅ <b>Resolution:</b> ${ticket.resolved_content}`;
      }

      if (messages.results.length > 0) {
        msgText += '\n\n💬 <b>Messages:</b>';
        for (const msg of messages.results as any[]) {
          const senderIcon = msg.sender_type === 'user' ? '👤' : '🛡️';
          msgText += `\n\n${senderIcon} <b>${msg.sender_name || msg.sender_type}</b> (${msg.source})\n${msg.message.substring(0, 300)}`;
        }
      }

      msgText += `\n\nReply: /reply ${ticketId} message\nResolve: /resolve ${ticketId} details`;

      await sendTelegramMessage(configToken, chatId, msgText);
      return c.json({ ok: true });
    }

    // /reply TK-XXXXXX message
    const replyMatch = trimmedText.match(/^\/reply\s+(TK-[\w-]+)\s+(.+)$/s);
    if (replyMatch) {
      const ticketId = replyMatch[1];
      const replyMessage = replyMatch[2].trim();

      const ticket = await c.env.DB.prepare(
        'SELECT * FROM support_tickets WHERE ticket_id = ?'
      ).bind(ticketId).first<any>();

      if (!ticket) {
        await sendTelegramMessage(configToken, chatId, `❌ Ticket ${ticketId} not found.`);
        return c.json({ ok: true });
      }

      // Save reply
      await c.env.DB.prepare(`
        INSERT INTO support_messages (ticket_id, sender_type, sender_name, message, attachments, source)
        VALUES (?, 'telegram', ?, ?, '[]', 'telegram')
      `).bind(ticketId, fromName, replyMessage).run();

      // Update ticket status
      if (ticket.status === 'open') {
        await c.env.DB.prepare(
          "UPDATE support_tickets SET status = 'in_progress', updated_at = datetime('now') WHERE ticket_id = ?"
        ).bind(ticketId).run();
      } else {
        await c.env.DB.prepare(
          "UPDATE support_tickets SET updated_at = datetime('now') WHERE ticket_id = ?"
        ).bind(ticketId).run();
      }

      // Push notify user
      if (ticket.user_id) {
        await notifyTicketReply(c.env, ticket.user_id, ticketId, 'telegram', replyMessage);
        const notifUrl = `https://dakkho-student.pages.dev/help/contact-support/${ticketId}`;
        await saveNotification(c.env, ticket.user_id, 'New Support Reply', replyMessage.substring(0, 200), notifUrl, 'info', 'support');
      }

      await sendTelegramMessage(configToken, chatId, `✅ Reply sent on ${ticketId}`);
      return c.json({ ok: true });
    }

    // /resolve TK-XXXXXX details
    const resolveMatch = trimmedText.match(/^\/resolve\s+(TK-[\w-]+)\s+(.+)$/s);
    if (resolveMatch) {
      const ticketId = resolveMatch[1];
      const resolvedContent = resolveMatch[2].trim();

      const ticket = await c.env.DB.prepare(
        'SELECT * FROM support_tickets WHERE ticket_id = ?'
      ).bind(ticketId).first<any>();

      if (!ticket) {
        await sendTelegramMessage(configToken, chatId, `❌ Ticket ${ticketId} not found.`);
        return c.json({ ok: true });
      }

      // Update ticket
      await c.env.DB.prepare(`
        UPDATE support_tickets
        SET status = 'resolved', resolved_content = ?, resolved_at = datetime('now'), resolved_by = ?, updated_at = datetime('now')
        WHERE ticket_id = ?
      `).bind(resolvedContent, `TG:${fromName}`, ticketId).run();

      // Add resolution message
      await c.env.DB.prepare(`
        INSERT INTO support_messages (ticket_id, sender_type, sender_name, message, attachments, source)
        VALUES (?, 'telegram', ?, ?, '[]', 'telegram')
      `).bind(ticketId, fromName, `✅ Ticket Resolved: ${resolvedContent}`).run();

      // Push notify user
      if (ticket.user_id) {
        await notifyTicketResolved(c.env, ticket.user_id, ticketId, resolvedContent);
        const timestamp = Math.floor(Date.now() / 1000);
        const encodedContent = encodeURIComponent(resolvedContent.substring(0, 200));
        const notifUrl = `https://dakkho-student.pages.dev/help/contact-support/${ticketId}/${timestamp}/${encodedContent}`;
        await saveNotification(c.env, ticket.user_id, 'Support Ticket Resolved', `Ticket ${ticketId} resolved: ${resolvedContent.substring(0, 100)}`, notifUrl, 'success', 'support');
      }

      await sendTelegramMessage(configToken, chatId, `✅ Ticket ${ticketId} resolved!`);
      return c.json({ ok: true });
    }

    // /close TK-XXXXXX
    const closeMatch = trimmedText.match(/^\/close\s+(TK-[\w-]+)$/);
    if (closeMatch) {
      const ticketId = closeMatch[1];

      const ticket = await c.env.DB.prepare(
        'SELECT * FROM support_tickets WHERE ticket_id = ?'
      ).bind(ticketId).first();

      if (!ticket) {
        await sendTelegramMessage(configToken, chatId, `❌ Ticket ${ticketId} not found.`);
        return c.json({ ok: true });
      }

      await c.env.DB.prepare(
        "UPDATE support_tickets SET status = 'closed', updated_at = datetime('now') WHERE ticket_id = ?"
      ).bind(ticketId).run();

      // Notify user about closed ticket
      if ((ticket as any).user_id) {
        const notifUrl = `https://dakkho-student.pages.dev/help/contact-support/${ticketId}`;
        await saveNotification(c.env, (ticket as any).user_id, 'Support Ticket Closed', `Your ticket ${ticketId} has been closed.`, notifUrl, 'warning', 'support');
      }

      await sendTelegramMessage(configToken, chatId, `🔒 Ticket ${ticketId} closed.`);
      return c.json({ ok: true });
    }

    // Unknown command
    await sendTelegramMessage(configToken, chatId,
      `❓ Unknown command. Use /start to see available commands.`
    );

    return c.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return c.json({ ok: true }); // Always return ok to Telegram
  }
});

export { supportPublicRoutes, supportAdminRoutes, telegramWebhookRoutes };
