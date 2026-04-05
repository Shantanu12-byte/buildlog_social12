-- Migration: Create app_settings table for server-side state tracking
-- Used to: prevent duplicate daily notifications, store server-side flags

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Allow server (service role) to read/write; no public access
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role only" ON app_settings
  FOR ALL USING (false); -- No direct client access; only backend service role can access

NOTIFY pgrst, 'reload schema';
