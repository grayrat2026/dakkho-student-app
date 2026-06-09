/**
 * DAKKHO Admin API — Cloudflare Workers + Hono
 *
 * D1-only backend — All Appwrite dependencies removed
 * - Hono framework for routing & middleware
 * - Native R2Bucket bindings for file storage
 * - D1 for all data (users, courses, videos, etc.)
 * - Workers KV for config broadcast/cache
 * - Resend REST API with fetch() for email
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env } from './env';
import authRoutes from './routes/auth';
import systemRoutes from './routes/system';
import userRoutes from './routes/users';
import categoryRoutes from './routes/categories';
import instructorRoutes from './routes/instructors';
import courseRoutes from './routes/courses';
import videoRoutes from './routes/videos';
import instituteRoutes from './routes/institutes';
import configRoutes from './routes/config';
import notificationRoutes from './routes/notifications';
import analyticsRoutes from './routes/analytics';
import uploadRoutes from './routes/upload';
import emailRoutes from './routes/email';
import adminRoutes from './routes/admin';
import couponRoutes from './routes/coupons';
import discountRoutes from './routes/discounts';
import eventRoutes from './routes/events';
import liveClassRoutes from './routes/live-classes';
import paymentRoutes from './routes/payments';
import instituteRequestRoutes from './routes/institute-requests';
import studentApiRoutes from './routes/student-api';
import pushRoutes from './routes/push';
import techRoutes from './routes/technologies';
import packageRoutes from './routes/packages';
import enrollmentRoutes from './routes/enrollments';
import achievementRoutes from './routes/achievements';

// R2 file serving (no auth needed — public access for images/videos)
import { getFile, getBucketForType } from './lib/r2';

const app = new Hono<{ Bindings: Env }>();

// ─── Global Middleware ───

app.use('*', cors({
  origin: [
    'https://grayrat2026.github.io',
    'https://dakkho.pro.bd',
    'http://localhost:3000',
    // Cloudflare Pages domains
    'https://dakkho-admin.pages.dev',
    // Student app domains
    'https://dakkhostudent.pages.dev',
    'https://dakkho-student.pages.dev',
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'apikey'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
  credentials: true,
}));

app.use('*', logger());

// ─── Health Check ───

app.get('/', (c) => c.json({
  service: 'DAKKHO Admin API',
  version: '2.0.0',
  status: 'healthy',
  timestamp: new Date().toISOString(),
  runtime: 'Cloudflare Workers',
  framework: 'Hono',
  backend: 'D1',
}));

// ─── Mount Route Groups ───

app.route('/admin/auth', authRoutes);
app.route('/admin/system', systemRoutes);
app.route('/admin/users', userRoutes);
app.route('/admin/categories', categoryRoutes);
app.route('/admin/instructors', instructorRoutes);
app.route('/admin/courses', courseRoutes);
app.route('/admin/videos', videoRoutes);
app.route('/admin/institutes', instituteRoutes);
app.route('/admin/config', configRoutes);
app.route('/admin/notifications', notificationRoutes);
app.route('/admin/analytics', analyticsRoutes);
app.route('/admin/upload', uploadRoutes);
app.route('/admin/email', emailRoutes);
app.route('/admin/admin', adminRoutes);
app.route('/admin/coupons', couponRoutes);
app.route('/admin/discounts', discountRoutes);
app.route('/admin/events', eventRoutes);
app.route('/admin/live-classes', liveClassRoutes);
app.route('/admin/payments', paymentRoutes);
app.route('/admin/institute-requests', instituteRequestRoutes);
app.route('/admin/push', pushRoutes);
app.route('/admin/technologies', techRoutes);
app.route('/admin/packages', packageRoutes);
app.route('/admin/enrollments', enrollmentRoutes);
app.route('/admin/achievements', achievementRoutes);

// Student-facing API (no admin auth)
app.route('/api', studentApiRoutes);

// ─── Public R2 File Serving ───
// Serves files from R2 buckets — no auth required.
// Pattern: /upload/:bucketType/:key{.+}
// e.g., /upload/thumbnails/1780907668784-1000093181.jpg

app.get('/upload/:bucketType/:key{.+}', async (c) => {
  const bucketType = c.req.param('bucketType');
  const key = c.req.param('key');

  try {
    const r2Bucket = getBucketForType(bucketType, c.env);
    const file = await getFile(r2Bucket, key);

    if (!file) {
      return c.json({ error: 'File not found' }, 404);
    }

    const headers = new Headers();
    // Set content type from R2 metadata
    if (file.httpMetadata?.contentType) {
      headers.set('Content-Type', file.httpMetadata.contentType);
    }
    // Cache for 7 days (images/videos rarely change)
    headers.set('Cache-Control', 'public, max-age=604800, immutable');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('CDN-Cache-Control', 'public, max-age=2592000');  // 30 days at CDN edge

    return new Response(file.body, { headers });
  } catch (error) {
    return c.json({ error: 'Failed to serve file' }, 500);
  }
});

// ─── 404 Handler ───

app.notFound((c) => c.json({ error: 'Not found' }, 404));

// ─── Global Error Handler ───

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: err.message || 'Internal server error' }, 500);
});

export default app;
