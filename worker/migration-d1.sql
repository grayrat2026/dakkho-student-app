-- ============================================================
-- DAKKHO Appwrite → D1 Migration Schema
-- Creates new D1 tables for all Appwrite collections
-- ============================================================

-- users table (from Appwrite users collection)
-- Preserves Appwrite document IDs as PK (referenced by sessions, payments, etc.)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
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
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_institute ON users(institute_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- courses table (from Appwrite courses collection)
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_en TEXT,
  description TEXT DEFAULT '',
  subject_code TEXT,
  thumbnail_url TEXT DEFAULT '',
  banner_url TEXT DEFAULT '',
  is_free INTEGER DEFAULT 0,
  price_bdt REAL DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  is_trending INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',        -- 'published' | 'draft'
  is_published INTEGER DEFAULT 0,      -- computed from status
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
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_featured ON courses(is_featured);
CREATE INDEX IF NOT EXISTS idx_courses_free ON courses(is_free);

-- videos table (from Appwrite videos collection)
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT DEFAULT '',
  description TEXT DEFAULT '',
  course_id TEXT NOT NULL,
  chapter_id TEXT DEFAULT 'default',
  video_url TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  duration REAL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_preview INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_videos_course ON videos(course_id);
CREATE INDEX IF NOT EXISTS idx_videos_published ON videos(is_published);
CREATE INDEX IF NOT EXISTS idx_videos_sort ON videos(course_id, sort_order);

-- instructors table (from Appwrite instructors collection)
CREATE TABLE IF NOT EXISTS instructors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  specialization TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  department TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  total_courses INTEGER DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  rating_avg REAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_instructors_email ON instructors(email);
CREATE INDEX IF NOT EXISTS idx_instructors_active ON instructors(is_active);

-- enrollments table (from Appwrite enrollments collection)
CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  progress REAL DEFAULT 0,
  enrolled_at TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_unique ON enrollments(user_id, course_id);

-- categories table (from Appwrite categories collection)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_bn TEXT DEFAULT '',
  slug TEXT DEFAULT '',
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '',
  color TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  course_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order);

-- notifications table (from Appwrite notifications collection)
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT DEFAULT '',
  message TEXT DEFAULT '',
  type TEXT DEFAULT 'info',
  category TEXT DEFAULT '',
  read INTEGER DEFAULT 0,
  action_url TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);

-- watch_progress table (from Appwrite watch_progress collection)
CREATE TABLE IF NOT EXISTS watch_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  video_id TEXT,
  completed INTEGER DEFAULT 0,
  watch_time REAL DEFAULT 0,
  last_position REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_watch_progress_user ON watch_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_progress_course ON watch_progress(user_id, course_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_watch_progress_unique ON watch_progress(user_id, video_id);

-- bookmarks table (from Appwrite bookmarks collection)
CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_unique ON bookmarks(user_id, course_id);

-- discussions table (from Appwrite discussions collection)
CREATE TABLE IF NOT EXISTS discussions (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id TEXT,
  is_pinned INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_discussions_course ON discussions(course_id);
CREATE INDEX IF NOT EXISTS idx_discussions_user ON discussions(user_id);

-- user_settings table (from Appwrite user_settings collection)
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  settings TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);
