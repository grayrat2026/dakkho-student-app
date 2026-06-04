/**
 * DAKKHO Admin API — Cloudflare Workers + Hono
 *
 * Migrated from Next.js API routes to Cloudflare Workers using:
 * - Hono framework for routing & middleware
 * - Native R2Bucket bindings for file storage (replaces AWS S3 SDK)
 * - D1 for sessions, audit, config (replaces Prisma/SQLite)
 * - Workers KV for config broadcast (replaces MQTT)
 * - Appwrite REST API with fetch() (replaces node-appwrite SDK)
 * - Resend REST API with fetch() (replaces Resend SDK)
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
  version: '1.0.0',
  status: 'healthy',
  timestamp: new Date().toISOString(),
  runtime: 'Cloudflare Workers',
  framework: 'Hono',
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

// Student-facing API (no admin auth)
app.route('/api', studentApiRoutes);

// ─── 404 Handler ───

app.notFound((c) => c.json({ error: 'Not found' }, 404));

// ─── Global Error Handler ───

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: err.message || 'Internal server error' }, 500);
});

export default app;
