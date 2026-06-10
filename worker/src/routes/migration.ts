/**
 * Migration endpoint — Migrates all Appwrite collections to D1
 *
 * POST /admin/migration/d1 — One-time migration (admin only)
 * GET  /admin/migration/status — Check migration status
 * POST /admin/migration/init-schema — Create D1 tables at runtime
 *
 * Strategy:
 * 1. Read all documents from each Appwrite collection (paginated)
 * 2. Map Appwrite attributes to D1 columns
 * 3. INSERT OR IGNORE into D1 tables (idempotent)
 * 4. Return detailed migration report
 */

import { Hono } from 'hono';
import type { Env } from '../env';
import type { AuthVariables } from '../lib/auth';
import { adminAuthMiddleware } from '../lib/auth';
import { listDocuments, createDocument, Query } from '../lib/appwrite';
import { APPWRITE_COLLECTIONS } from '../lib/types';
import { logAudit } from '../lib/audit';
import { getErrorMessage } from '../lib/utils';

const migrationRoutes = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
migrationRoutes.use('*', adminAuthMiddleware);

// ─── D1 Table Creation SQL ───
// Matches the actual D1 schema (merged from migration-d1.sql and live D1)
const CREATE_TABLE_SQL = [`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  full_name TEXT DEFAULT '',
  role TEXT DEFAULT 'student',
  password_hash TEXT,
  password_migrated INTEGER DEFAULT 0,
  email_verified INTEGER DEFAULT 0,
  avatar_url TEXT DEFAULT '',
  institute_id TEXT,
  technology TEXT,
  phone TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  semester TEXT,
  is_active INTEGER DEFAULT 1,
  appwrite_prefs TEXT DEFAULT '{}',
  appwrite_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)`,
`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`,
`CREATE INDEX IF NOT EXISTS idx_users_institute ON users(institute_id)`,
`CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)`,

`CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_en TEXT,
  description TEXT DEFAULT '',
  subject_code TEXT,
  slug TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  banner_url TEXT DEFAULT '',
  is_free INTEGER DEFAULT 0,
  price_bdt REAL DEFAULT 0,
  discount_price REAL DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  is_trending INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  is_published INTEGER DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  total_chapters INTEGER DEFAULT 0,
  total_videos INTEGER DEFAULT 0,
  enrollment_count INTEGER DEFAULT 0,
  rating_avg REAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  tags TEXT DEFAULT '',
  preview_video_url TEXT DEFAULT '',
  category_id TEXT DEFAULT '',
  instructor_id TEXT DEFAULT '',
  level TEXT DEFAULT '',
  language TEXT DEFAULT 'bn',
  technology TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  appwrite_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)`,
`CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status)`,
`CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published)`,
`CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id)`,
`CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id)`,
`CREATE INDEX IF NOT EXISTS idx_courses_featured ON courses(is_featured)`,
`CREATE INDEX IF NOT EXISTS idx_courses_free ON courses(is_free)`,

`CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT DEFAULT '',
  description TEXT DEFAULT '',
  course_id TEXT NOT NULL DEFAULT '',
  chapter_id TEXT DEFAULT 'default',
  video_url TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  duration INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_preview INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 0,
  is_free INTEGER DEFAULT 0,
  subject_id TEXT DEFAULT '',
  appwrite_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)`,
`CREATE INDEX IF NOT EXISTS idx_videos_course ON videos(course_id)`,
`CREATE INDEX IF NOT EXISTS idx_videos_published ON videos(is_published)`,
`CREATE INDEX IF NOT EXISTS idx_videos_sort ON videos(course_id, sort_order)`,

`CREATE TABLE IF NOT EXISTS instructors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  email TEXT DEFAULT '',
  specialization TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  department TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  title TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  total_courses INTEGER DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  rating_avg REAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  appwrite_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)`,
`CREATE INDEX IF NOT EXISTS idx_instructors_email ON instructors(email)`,
`CREATE INDEX IF NOT EXISTS idx_instructors_active ON instructors(is_active)`,

`CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  progress REAL DEFAULT 0,
  completed INTEGER DEFAULT 0,
  enrolled_via TEXT DEFAULT '',
  pp_id TEXT DEFAULT '',
  enrolled_at TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, course_id)
)`,
`CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id)`,
`CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id)`,

`CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  name_bn TEXT DEFAULT '',
  slug TEXT DEFAULT '',
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '',
  color TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  course_count INTEGER DEFAULT 0,
  appwrite_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)`,
`CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)`,
`CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order)`,

`CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT DEFAULT '',
  message TEXT DEFAULT '',
  type TEXT DEFAULT 'info',
  category TEXT DEFAULT '',
  read INTEGER DEFAULT 0,
  action_url TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)`,
`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`,
`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read)`,

`CREATE TABLE IF NOT EXISTS watch_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  video_id TEXT NOT NULL DEFAULT '',
  course_id TEXT NOT NULL DEFAULT '',
  completed INTEGER DEFAULT 0,
  watch_time INTEGER DEFAULT 0,
  last_position INTEGER DEFAULT 0,
  course_name TEXT DEFAULT '',
  appwrite_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, video_id)
)`,
`CREATE INDEX IF NOT EXISTS idx_watch_progress_user ON watch_progress(user_id)`,
`CREATE INDEX IF NOT EXISTS idx_watch_progress_course ON watch_progress(user_id, course_id)`,

`CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
)`,
`CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id)`,
`CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_unique ON bookmarks(user_id, course_id)`,

`CREATE TABLE IF NOT EXISTS discussions (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id TEXT,
  is_pinned INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)`,
`CREATE INDEX IF NOT EXISTS idx_discussions_course ON discussions(course_id)`,
`CREATE INDEX IF NOT EXISTS idx_discussions_user ON discussions(user_id)`,

`CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  settings TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)`,
`CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id)`,
];

// POST /init-schema — Create D1 tables at runtime (admin only, safe to re-run)
migrationRoutes.post('/init-schema', async (c) => {
  try {
    const results: { sql: string; success: boolean; error?: string }[] = [];

    for (const sql of CREATE_TABLE_SQL) {
      try {
        await c.env.DB.prepare(sql).run();
        results.push({ sql: sql.substring(0, 80) + '...', success: true });
      } catch (err: any) {
        results.push({ sql: sql.substring(0, 80) + '...', success: false, error: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    const user = c.get('user');
    await logAudit(c.env, user.id, 'D1_INIT_SCHEMA', 'system', undefined, {
      tablesCreated: successCount,
      failed: failCount,
    });

    return c.json({
      success: true,
      message: `Created ${successCount} tables/indexes, ${failCount} failed`,
      results,
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /status — Check which tables have data and if migration tables exist
migrationRoutes.get('/status', async (c) => {
  try {
    const tables = [
      'users', 'courses', 'videos', 'instructors', 'enrollments',
      'categories', 'notifications', 'watch_progress', 'bookmarks',
      'discussions', 'user_settings',
    ];

    const status: Record<string, { d1Count: number; exists: boolean }> = {};

    for (const table of tables) {
      try {
        const result = await c.env.DB.prepare(
          `SELECT COUNT(*) as count FROM ${table}`
        ).first<{ count: number }>();
        status[table] = {
          d1Count: result?.count || 0,
          exists: true,
        };
      } catch {
        status[table] = { d1Count: 0, exists: false };
      }
    }

    return c.json({ success: true, status });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// POST /d1 — Full Appwrite → D1 migration
migrationRoutes.post('/d1', async (c) => {
  const report: Record<string, { migrated: number; skipped: number; errors: string[] }> = {};
  const BATCH_SIZE = 100;

  try {
    // ─── 1. Migrate Users ───
    {
      const errors: string[] = [];
      let migrated = 0;
      let skipped = 0;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        try {
          const result = await listDocuments(c.env, APPWRITE_COLLECTIONS.USERS, [
            JSON.stringify({ method: 'limit', values: [BATCH_SIZE] }),
            JSON.stringify({ method: 'offset', values: [offset] }),
          ]);

          for (const doc of result.documents as any[]) {
            try {
              const id = doc.$id;
              const email = doc.email || '';
              const name = doc.fullName || doc.name || '';
              const role = doc.role || 'student';
              const emailVerified = doc.emailVerified ? 1 : 0;
              const avatarUrl = doc.avatarUrl || '';
              const instituteId = doc.instituteId || null;
              const technology = doc.technology || null;
              const phone = doc.phone || '';
              const bio = doc.bio || '';
              const semester = doc.semester || null;
              const isActive = doc.isActive !== false ? 1 : 0;
              const createdAt = doc.created_at || doc.$createdAt || new Date().toISOString();
              const updatedAt = doc.updated_at || doc.$updatedAt || new Date().toISOString();

              await c.env.DB.prepare(`
                INSERT OR IGNORE INTO users (id, email, name, full_name, role, password_migrated, email_verified, avatar_url, institute_id, technology, phone, bio, semester, is_active, appwrite_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(id, email, name, name, role, emailVerified, avatarUrl, instituteId, technology, phone, bio, semester, isActive, id, createdAt, updatedAt).run();

              migrated++;
            } catch (err: any) {
              errors.push(`User ${doc.$id}: ${err.message}`);
              skipped++;
            }
          }

          hasMore = result.documents.length === BATCH_SIZE;
          offset += BATCH_SIZE;
        } catch (err: any) {
          errors.push(`Users batch at offset ${offset}: ${err.message}`);
          hasMore = false;
        }
      }

      report.users = { migrated, skipped, errors };
    }

    // ─── 2. Migrate Courses ───
    {
      const errors: string[] = [];
      let migrated = 0;
      let skipped = 0;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        try {
          const result = await listDocuments(c.env, APPWRITE_COLLECTIONS.COURSES, [
            JSON.stringify({ method: 'limit', values: [BATCH_SIZE] }),
            JSON.stringify({ method: 'offset', values: [offset] }),
          ]);

          for (const doc of result.documents as any[]) {
            try {
              const id = doc.$id;
              const status = doc.status || 'draft';
              const isPublished = status === 'published' || doc.isPublished === true ? 1 : 0;
              const priceBdt = doc.price_bdt || doc.price || 0;
              const isFree = doc.is_free !== undefined ? (doc.is_free ? 1 : 0) : (priceBdt === 0 ? 1 : 0);

              await c.env.DB.prepare(`
                INSERT OR IGNORE INTO courses (id, title, title_en, description, subject_code, slug, thumbnail_url, banner_url, is_free, price_bdt, is_featured, is_trending, status, is_published, total_duration_minutes, total_chapters, total_videos, enrollment_count, rating_avg, rating_count, tags, preview_video_url, category_id, instructor_id, level, language, technology, appwrite_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                id,
                doc.title || '',
                doc.title_en || '',
                doc.description || '',
                doc.subject_code || '',
                doc.slug || '',
                doc.thumbnail_url || doc.thumbnailUrl || '',
                doc.banner_url || '',
                isFree,
                priceBdt,
                doc.is_featured ? 1 : (doc.isFeatured ? 1 : 0),
                doc.is_trending ? 1 : 0,
                status,
                isPublished,
                doc.total_duration_minutes || 0,
                doc.total_chapters || 0,
                doc.total_videos || doc.totalVideos || 0,
                doc.enrollment_count || doc.totalStudents || 0,
                doc.rating_avg || doc.rating || 0,
                doc.rating_count || doc.totalReviews || 0,
                doc.tags || '',
                doc.previewVideoUrl || doc.preview_video_url || '',
                doc.categoryId || doc.category_id || '',
                doc.instructorId || doc.instructor_id || '',
                doc.level || '',
                doc.language || 'bn',
                doc.technology || '',
                id,
                doc.created_at || doc.$createdAt || new Date().toISOString(),
                doc.updated_at || doc.$updatedAt || new Date().toISOString()
              ).run();

              migrated++;
            } catch (err: any) {
              errors.push(`Course ${doc.$id}: ${err.message}`);
              skipped++;
            }
          }

          hasMore = result.documents.length === BATCH_SIZE;
          offset += BATCH_SIZE;
        } catch (err: any) {
          errors.push(`Courses batch at offset ${offset}: ${err.message}`);
          hasMore = false;
        }
      }

      report.courses = { migrated, skipped, errors };
    }

    // ─── 3. Migrate Videos ───
    {
      const errors: string[] = [];
      let migrated = 0;
      let skipped = 0;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        try {
          const result = await listDocuments(c.env, APPWRITE_COLLECTIONS.VIDEOS, [
            JSON.stringify({ method: 'limit', values: [BATCH_SIZE] }),
            JSON.stringify({ method: 'offset', values: [offset] }),
          ]);

          for (const doc of result.documents as any[]) {
            try {
              const id = doc.$id;
              const videoUrl = doc.video_url || doc.videoUrl || '';
              const thumbnailUrl = doc.thumbnail_url || doc.thumbnailUrl || '';
              const courseId = doc.course_id || doc.courseId || '';
              const sortOrder = doc.order || doc.sort_order || 0;

              await c.env.DB.prepare(`
                INSERT OR IGNORE INTO videos (id, title, slug, description, course_id, chapter_id, video_url, thumbnail_url, duration, sort_order, is_preview, is_published, is_free, subject_id, appwrite_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                id,
                doc.title || '',
                doc.slug || '',
                doc.description || '',
                courseId,
                doc.chapter_id || 'default',
                videoUrl,
                thumbnailUrl,
                doc.duration || 0,
                sortOrder,
                doc.isPreview ? 1 : (doc.is_preview ? 1 : 0),
                doc.isPublished ? 1 : (doc.is_published ? 1 : 0),
                doc.is_free ? 1 : 0,
                doc.subject_id || '',
                id,
                doc.created_at || doc.$createdAt || new Date().toISOString(),
                doc.updated_at || doc.$updatedAt || new Date().toISOString()
              ).run();

              migrated++;
            } catch (err: any) {
              errors.push(`Video ${doc.$id}: ${err.message}`);
              skipped++;
            }
          }

          hasMore = result.documents.length === BATCH_SIZE;
          offset += BATCH_SIZE;
        } catch (err: any) {
          errors.push(`Videos batch at offset ${offset}: ${err.message}`);
          hasMore = false;
        }
      }

      report.videos = { migrated, skipped, errors };
    }

    // ─── 4. Migrate Instructors ───
    {
      const errors: string[] = [];
      let migrated = 0;
      let skipped = 0;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        try {
          const result = await listDocuments(c.env, APPWRITE_COLLECTIONS.INSTRUCTORS, [
            JSON.stringify({ method: 'limit', values: [BATCH_SIZE] }),
            JSON.stringify({ method: 'offset', values: [offset] }),
          ]);

          for (const doc of result.documents as any[]) {
            try {
              const id = doc.$id;
              const avatarUrl = doc.avatarUrl || doc.avatar || doc.avatar_url || '';

              await c.env.DB.prepare(`
                INSERT OR IGNORE INTO instructors (id, name, email, specialization, phone, department, bio, title, avatar_url, total_courses, total_students, rating_avg, rating_count, is_active, appwrite_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                id,
                doc.name || '',
                doc.email || '',
                doc.specialization || '',
                doc.phone || '',
                doc.department || '',
                doc.bio || '',
                doc.title || '',
                avatarUrl,
                doc.totalCourses || doc.total_courses || 0,
                doc.totalStudents || doc.total_students || 0,
                doc.rating || doc.rating_avg || 0,
                doc.rating_count || 0,
                doc.is_active !== false ? 1 : 0,
                id,
                doc.created_at || doc.$createdAt || new Date().toISOString(),
                doc.updated_at || doc.$updatedAt || new Date().toISOString()
              ).run();

              migrated++;
            } catch (err: any) {
              errors.push(`Instructor ${doc.$id}: ${err.message}`);
              skipped++;
            }
          }

          hasMore = result.documents.length === BATCH_SIZE;
          offset += BATCH_SIZE;
        } catch (err: any) {
          errors.push(`Instructors batch at offset ${offset}: ${err.message}`);
          hasMore = false;
        }
      }

      report.instructors = { migrated, skipped, errors };
    }

    // ─── 5. Migrate Enrollments ───
    {
      const errors: string[] = [];
      let migrated = 0;
      let skipped = 0;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        try {
          const result = await listDocuments(c.env, APPWRITE_COLLECTIONS.ENROLLMENTS, [
            JSON.stringify({ method: 'limit', values: [BATCH_SIZE] }),
            JSON.stringify({ method: 'offset', values: [offset] }),
          ]);

          for (const doc of result.documents as any[]) {
            try {
              await c.env.DB.prepare(`
                INSERT OR IGNORE INTO enrollments (id, user_id, course_id, status, progress, completed, enrolled_via, pp_id, enrolled_at, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                doc.$id,
                doc.userId || doc.user_id || '',
                doc.courseId || doc.course_id || '',
                doc.status || 'active',
                doc.progress || 0,
                doc.completed ? 1 : 0,
                doc.enrolled_via || '',
                doc.pp_id || '',
                doc.enrolled_at || doc.$createdAt || new Date().toISOString(),
                doc.created_at || doc.$createdAt || new Date().toISOString(),
                doc.updated_at || doc.$updatedAt || new Date().toISOString()
              ).run();

              migrated++;
            } catch (err: any) {
              errors.push(`Enrollment ${doc.$id}: ${err.message}`);
              skipped++;
            }
          }

          hasMore = result.documents.length === BATCH_SIZE;
          offset += BATCH_SIZE;
        } catch (err: any) {
          errors.push(`Enrollments batch at offset ${offset}: ${err.message}`);
          hasMore = false;
        }
      }

      report.enrollments = { migrated, skipped, errors };
    }

    // ─── 6. Migrate Categories ───
    {
      const errors: string[] = [];
      let migrated = 0;
      let skipped = 0;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        try {
          const result = await listDocuments(c.env, APPWRITE_COLLECTIONS.CATEGORIES, [
            JSON.stringify({ method: 'limit', values: [BATCH_SIZE] }),
            JSON.stringify({ method: 'offset', values: [offset] }),
          ]);

          for (const doc of result.documents as any[]) {
            try {
              await c.env.DB.prepare(`
                INSERT OR IGNORE INTO categories (id, name, name_bn, slug, description, icon, color, sort_order, is_active, course_count, appwrite_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                doc.$id,
                doc.name || '',
                doc.name_bn || '',
                doc.slug || '',
                doc.description || '',
                doc.icon || '',
                doc.color || '',
                doc.sort_order || doc.order || 0,
                1,
                doc.course_count || doc.courseCount || 0,
                doc.$id,
                doc.created_at || doc.$createdAt || new Date().toISOString(),
                doc.updated_at || doc.$updatedAt || new Date().toISOString()
              ).run();

              migrated++;
            } catch (err: any) {
              errors.push(`Category ${doc.$id}: ${err.message}`);
              skipped++;
            }
          }

          hasMore = result.documents.length === BATCH_SIZE;
          offset += BATCH_SIZE;
        } catch (err: any) {
          errors.push(`Categories batch at offset ${offset}: ${err.message}`);
          hasMore = false;
        }
      }

      report.categories = { migrated, skipped, errors };
    }

    // ─── 7. Migrate Notifications ───
    {
      const errors: string[] = [];
      let migrated = 0;
      let skipped = 0;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        try {
          const result = await listDocuments(c.env, APPWRITE_COLLECTIONS.NOTIFICATIONS, [
            JSON.stringify({ method: 'limit', values: [BATCH_SIZE] }),
            JSON.stringify({ method: 'offset', values: [offset] }),
          ]);

          for (const doc of result.documents as any[]) {
            try {
              await c.env.DB.prepare(`
                INSERT OR IGNORE INTO notifications (id, user_id, title, message, type, category, read, action_url, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                doc.$id,
                doc.userId || doc.user_id || '',
                doc.title || '',
                doc.message || '',
                doc.type || 'info',
                doc.category || '',
                doc.read || doc.isRead ? 1 : 0,
                doc.action_url || doc.actionUrl || '',
                doc.created_at || doc.$createdAt || new Date().toISOString(),
                doc.updated_at || doc.$updatedAt || new Date().toISOString()
              ).run();

              migrated++;
            } catch (err: any) {
              errors.push(`Notification ${doc.$id}: ${err.message}`);
              skipped++;
            }
          }

          hasMore = result.documents.length === BATCH_SIZE;
          offset += BATCH_SIZE;
        } catch (err: any) {
          errors.push(`Notifications batch at offset ${offset}: ${err.message}`);
          hasMore = false;
        }
      }

      report.notifications = { migrated, skipped, errors };
    }

    // ─── 8. Migrate Watch Progress ───
    {
      const errors: string[] = [];
      let migrated = 0;
      let skipped = 0;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        try {
          const result = await listDocuments(c.env, APPWRITE_COLLECTIONS.WATCH_PROGRESS, [
            JSON.stringify({ method: 'limit', values: [BATCH_SIZE] }),
            JSON.stringify({ method: 'offset', values: [offset] }),
          ]);

          for (const doc of result.documents as any[]) {
            try {
              await c.env.DB.prepare(`
                INSERT OR IGNORE INTO watch_progress (id, user_id, course_id, video_id, completed, watch_time, last_position, course_name, appwrite_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                doc.$id,
                doc.userId || doc.user_id || '',
                doc.courseId || doc.course_id || '',
                doc.videoId || doc.video_id || '',
                doc.completed ? 1 : 0,
                doc.watchTime || doc.watch_time || 0,
                doc.last_position || doc.lastPosition || 0,
                doc.course_name || '',
                doc.$id,
                doc.created_at || doc.$createdAt || new Date().toISOString(),
                doc.updated_at || doc.$updatedAt || new Date().toISOString()
              ).run();

              migrated++;
            } catch (err: any) {
              errors.push(`WatchProgress ${doc.$id}: ${err.message}`);
              skipped++;
            }
          }

          hasMore = result.documents.length === BATCH_SIZE;
          offset += BATCH_SIZE;
        } catch (err: any) {
          errors.push(`WatchProgress batch at offset ${offset}: ${err.message}`);
          hasMore = false;
        }
      }

      report.watch_progress = { migrated, skipped, errors };
    }

    // ─── 9. Migrate Bookmarks ───
    {
      const errors: string[] = [];
      let migrated = 0;
      let skipped = 0;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        try {
          const result = await listDocuments(c.env, APPWRITE_COLLECTIONS.BOOKMARKS, [
            JSON.stringify({ method: 'limit', values: [BATCH_SIZE] }),
            JSON.stringify({ method: 'offset', values: [offset] }),
          ]);

          for (const doc of result.documents as any[]) {
            try {
              await c.env.DB.prepare(`
                INSERT OR IGNORE INTO bookmarks (id, user_id, course_id, created_at)
                VALUES (?, ?, ?, ?)
              `).bind(
                doc.$id,
                doc.userId || doc.user_id || '',
                doc.courseId || doc.course_id || '',
                doc.created_at || doc.$createdAt || new Date().toISOString()
              ).run();

              migrated++;
            } catch (err: any) {
              errors.push(`Bookmark ${doc.$id}: ${err.message}`);
              skipped++;
            }
          }

          hasMore = result.documents.length === BATCH_SIZE;
          offset += BATCH_SIZE;
        } catch (err: any) {
          errors.push(`Bookmarks batch at offset ${offset}: ${err.message}`);
          hasMore = false;
        }
      }

      report.bookmarks = { migrated, skipped, errors };
    }

    // ─── 10. Migrate Discussions ───
    {
      const errors: string[] = [];
      let migrated = 0;
      let skipped = 0;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        try {
          const result = await listDocuments(c.env, APPWRITE_COLLECTIONS.DISCUSSIONS, [
            JSON.stringify({ method: 'limit', values: [BATCH_SIZE] }),
            JSON.stringify({ method: 'offset', values: [offset] }),
          ]);

          for (const doc of result.documents as any[]) {
            try {
              await c.env.DB.prepare(`
                INSERT OR IGNORE INTO discussions (id, course_id, user_id, content, parent_id, is_pinned, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                doc.$id,
                doc.courseId || doc.course_id || '',
                doc.userId || doc.user_id || '',
                doc.content || '',
                doc.parentId || doc.parent_id || null,
                doc.is_pinned ? 1 : 0,
                doc.created_at || doc.$createdAt || new Date().toISOString(),
                doc.updated_at || doc.$updatedAt || new Date().toISOString()
              ).run();

              migrated++;
            } catch (err: any) {
              errors.push(`Discussion ${doc.$id}: ${err.message}`);
              skipped++;
            }
          }

          hasMore = result.documents.length === BATCH_SIZE;
          offset += BATCH_SIZE;
        } catch (err: any) {
          errors.push(`Discussions batch at offset ${offset}: ${err.message}`);
          hasMore = false;
        }
      }

      report.discussions = { migrated, skipped, errors };
    }

    // ─── 11. Migrate User Settings ───
    {
      const errors: string[] = [];
      let migrated = 0;
      let skipped = 0;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        try {
          const result = await listDocuments(c.env, APPWRITE_COLLECTIONS.USER_SETTINGS, [
            JSON.stringify({ method: 'limit', values: [BATCH_SIZE] }),
            JSON.stringify({ method: 'offset', values: [offset] }),
          ]);

          for (const doc of result.documents as any[]) {
            try {
              await c.env.DB.prepare(`
                INSERT OR IGNORE INTO user_settings (id, user_id, settings, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
              `).bind(
                doc.$id,
                doc.userId || doc.user_id || '',
                JSON.stringify(doc.settings || doc || {}),
                doc.created_at || doc.$createdAt || new Date().toISOString(),
                doc.updated_at || doc.$updatedAt || new Date().toISOString()
              ).run();

              migrated++;
            } catch (err: any) {
              errors.push(`UserSettings ${doc.$id}: ${err.message}`);
              skipped++;
            }
          }

          hasMore = result.documents.length === BATCH_SIZE;
          offset += BATCH_SIZE;
        } catch (err: any) {
          errors.push(`UserSettings batch at offset ${offset}: ${err.message}`);
          hasMore = false;
        }
      }

      report.user_settings = { migrated, skipped, errors };
    }

    // ─── 12. Sync Appwrite auth users → D1 users (INSERT missing + UPDATE prefs) ───
    {
      const errors: string[] = [];
      let inserted = 0;
      let updated = 0;

      try {
        const { listUsers } = await import('../lib/appwrite');
        let userOffset = 0;
        let hasMoreUsers = true;

        while (hasMoreUsers) {
          const usersResult = await listUsers(c.env, [
            JSON.stringify({ method: 'limit', values: [BATCH_SIZE] }),
            JSON.stringify({ method: 'offset', values: [userOffset] }),
          ]);

          for (const acc of usersResult.users as any[]) {
            try {
              const prefs = acc.prefs || {};
              const appwriteRole = String(prefs.role || 'student');
              const avatarUrl = String(prefs.avatar_url || '');
              const name = acc.name || '';

              // Try to insert first (for users not in the Appwrite "users" collection)
              const insertResult = await c.env.DB.prepare(`
                INSERT OR IGNORE INTO users (id, email, name, full_name, role, password_migrated, email_verified, avatar_url, is_active, appwrite_id, appwrite_prefs, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 0, ?, ?, 1, ?, ?, ?, ?)
              `).bind(
                acc.$id,
                acc.email || '',
                name,
                name,
                appwriteRole,
                acc.emailVerification ? 1 : 0,
                avatarUrl,
                acc.$id,
                JSON.stringify(prefs),
                acc.$createdAt || new Date().toISOString(),
                acc.$updatedAt || new Date().toISOString()
              ).run();

              // Check if the insert actually added a row
              if (insertResult.meta?.changes && insertResult.meta.changes > 0) {
                inserted++;
              } else {
                // User already exists — update prefs
                await c.env.DB.prepare(
                  'UPDATE users SET role = COALESCE(NULLIF(?, \'\'), role), avatar_url = COALESCE(NULLIF(?, \'\'), avatar_url), appwrite_prefs = ?, email_verified = ? WHERE id = ?'
                ).bind(
                  appwriteRole,
                  avatarUrl,
                  JSON.stringify(prefs),
                  acc.emailVerification ? 1 : 0,
                  acc.$id
                ).run();
                updated++;
              }
            } catch (err: any) {
              errors.push(`UserSync ${acc.$id}: ${err.message}`);
            }
          }

          hasMoreUsers = usersResult.users.length === BATCH_SIZE;
          userOffset += BATCH_SIZE;
        }
      } catch (err: any) {
        errors.push(`User auth sync: ${err.message}`);
      }

      report.auth_users_sync = { migrated: inserted, skipped: 0, errors };
      report.auth_users_updated = { migrated: updated, skipped: 0, errors: [] };
    }

    // Log migration
    const user = c.get('user');
    await logAudit(c.env, user.id, 'D1_MIGRATION', 'system', undefined, {
      report: Object.fromEntries(
        Object.entries(report).map(([k, v]) => [k, { migrated: v.migrated, skipped: v.skipped }])
      ),
    });

    return c.json({ success: true, report });
  } catch (error) {
    return c.json({ error: getErrorMessage(error), partialReport: report }, 500);
  }
});

export default migrationRoutes;
