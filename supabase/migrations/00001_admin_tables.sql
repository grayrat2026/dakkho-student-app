-- DAKKHO Admin Panel - Supabase Database Migration
-- Run this in Supabase Dashboard > SQL Editor

-- ============================================
-- 1. Admin Sessions Table
-- ============================================
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Index for fast session lookups
CREATE INDEX IF NOT EXISTS idx_admin_sessions_session_id ON admin_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- ============================================
-- 2. App Config Table
-- ============================================
CREATE TABLE IF NOT EXISTS app_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast config lookups
CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(key);

-- Seed default config
INSERT INTO app_config (key, value, description) VALUES
  ('app_settings', '{"appName": "DAKKHO", "maintenanceMode": false, "maxUploadSize": 500, "defaultLanguage": "bn"}', 'General app settings'),
  ('streaming', '{"defaultQuality": "720p", "maxConcurrentStreams": 3, "enableDVR": true, "enableChat": true}', 'Streaming configuration'),
  ('notifications', '{"pushEnabled": true, "emailEnabled": true, "smsEnabled": false, "quietHoursStart": "22:00", "quietHoursEnd": "08:00"}', 'Notification settings'),
  ('features', '{"enableCourses": true, "enableLiveClasses": true, "enableQuizzes": true, "enableCertificates": true, "enableLeaderboard": true}', 'Feature flags')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 3. Audit Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  user_id TEXT,
  user_email TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- 4. Enable RLS (Row Level Security)
-- ============================================
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS Policies - Allow service role full access
-- ============================================
-- Admin Sessions: only service role can access
CREATE POLICY "Service role can manage admin_sessions" ON admin_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- App Config: anyone can read, service role can write
CREATE POLICY "Anyone can read app_config" ON app_config
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage app_config" ON app_config
  FOR ALL USING (auth.role() = 'service_role');

-- Audit Logs: service role can manage
CREATE POLICY "Service role can manage audit_logs" ON audit_logs
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 6. Cleanup expired sessions function
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
