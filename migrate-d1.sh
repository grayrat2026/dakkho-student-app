#!/bin/bash
# DAKKHO D1 Database Migration Script

echo "🗄️ Running D1 migrations..."

cd /home/z/my-project/worker

# Add new tables
echo "Creating new tables..."
npx wrangler d1 execute dakkho-admin-db --remote --command="
CREATE TABLE IF NOT EXISTS terms_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  title_bn TEXT,
  content_bn TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);"

npx wrangler d1 execute dakkho-admin-db --remote --command="
CREATE TABLE IF NOT EXISTS user_terms_acceptance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  terms_version_id INTEGER NOT NULL,
  accepted_at TEXT DEFAULT (datetime('now')),
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (terms_version_id) REFERENCES terms_versions(id),
  UNIQUE(user_id, terms_version_id)
);"

npx wrangler d1 execute dakkho-admin-db --remote --command="
CREATE TABLE IF NOT EXISTS course_subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  subject_name_bn TEXT,
  instructor_id TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);"

npx wrangler d1 execute dakkho-admin-db --remote --command="
CREATE INDEX IF NOT EXISTS idx_course_subjects_course ON course_subjects(course_id);"

npx wrangler d1 execute dakkho-admin-db --remote --command="
CREATE TABLE IF NOT EXISTS support_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT UNIQUE NOT NULL,
  user_id TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  priority TEXT DEFAULT 'medium',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  attachments TEXT,
  detected_issue TEXT,
  status TEXT DEFAULT 'open',
  assigned_to TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);"

npx wrangler d1 execute dakkho-admin-db --remote --command="
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);"

npx wrangler d1 execute dakkho-admin-db --remote --command="
CREATE TABLE IF NOT EXISTS support_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT NOT NULL,
  sender_type TEXT NOT NULL,
  sender_id TEXT,
  sender_name TEXT,
  message TEXT NOT NULL,
  attachments TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(ticket_id)
);"

npx wrangler d1 execute dakkho-admin-db --remote --command="
CREATE TABLE IF NOT EXISTS instructor_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  instructor_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  review TEXT,
  course_id TEXT,
  course_name TEXT,
  is_anonymous INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(instructor_id, user_id, course_id)
);"

npx wrangler d1 execute dakkho-admin-db --remote --command="
CREATE INDEX IF NOT EXISTS idx_reviews_instructor ON instructor_reviews(instructor_id);"

# Admin profile columns
echo "Adding admin profile columns..."
npx wrangler d1 execute dakkho-admin-db --remote --command="ALTER TABLE admin_sessions ADD COLUMN name TEXT DEFAULT '';"
npx wrangler d1 execute dakkho-admin-db --remote --command="ALTER TABLE admin_sessions ADD COLUMN avatar_url TEXT DEFAULT '';"

# Seed terms data
echo "Seeding terms data..."
npx wrangler d1 execute dakkho-admin-db --remote --file=./schema.sql

echo "✅ D1 migrations complete!"
