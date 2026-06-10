-- DAKKHO Incremental Migration - Add missing tables and columns
-- Date: 2026-06-04

-- 1. Add email_verified column to student_sessions (if not exists)
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we just try it
ALTER TABLE student_sessions ADD COLUMN email_verified INTEGER DEFAULT 0;

-- 2. Add idx_student_sessions_token index (if not exists)
CREATE INDEX IF NOT EXISTS idx_student_sessions_token ON student_sessions(id);

-- 3. email_verification_tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_email_verif_user ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verif_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verif_expires ON email_verification_tokens(expires_at);

-- 4. announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  action_url TEXT,
  is_active INTEGER DEFAULT 1,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(type);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);

-- 5. quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  time_limit_minutes INTEGER,
  passing_score INTEGER DEFAULT 70,
  max_attempts INTEGER DEFAULT 3,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON quizzes(course_id);

-- 6. quiz_questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL,
  explanation TEXT,
  order_num INTEGER DEFAULT 0,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);

-- 7. quiz_attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  total_questions INTEGER NOT NULL,
  percentage INTEGER DEFAULT 0,
  passed INTEGER DEFAULT 0,
  answers TEXT,
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  time_taken INTEGER
);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id, user_id);

-- 8. certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  certificate_number TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  course_id TEXT NOT NULL,
  course_title TEXT NOT NULL,
  instructor_name TEXT,
  organization_name TEXT DEFAULT 'DAKKHO',
  issued_at TEXT DEFAULT (datetime('now')),
  grade TEXT,
  pdf_url TEXT,
  UNIQUE(user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON certificates(certificate_number);

-- 9. Add appwrite_id column to institutes for reliable Appwrite↔D1 sync
ALTER TABLE institutes ADD COLUMN appwrite_id TEXT;
CREATE INDEX IF NOT EXISTS idx_institutes_appwrite_id ON institutes(appwrite_id);
