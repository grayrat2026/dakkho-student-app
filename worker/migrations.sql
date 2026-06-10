-- DAKKHO Admin API - D1 Migration Script
-- Contains ALTER TABLE statements that cannot be run in schema.sql
-- Run these separately against the D1 database

-- Admin profile columns
ALTER TABLE admin_sessions ADD COLUMN name TEXT DEFAULT '';
ALTER TABLE admin_sessions ADD COLUMN avatar_url TEXT DEFAULT '';
