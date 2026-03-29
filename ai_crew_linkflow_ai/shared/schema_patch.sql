-- LinkFlow AI — Schema Patch v2
-- Run this AFTER schema.sql if your DB is already live.
-- Safe to run multiple times (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).

-- ============================================================
-- PATCH 1: backlink_tasks — add client_ip_hint for IP locality
-- ============================================================
ALTER TABLE backlink_tasks
  ADD COLUMN IF NOT EXISTS client_ip_hint TEXT;  -- e.g. 'US', 'CN', 'DE'

-- ============================================================
-- PATCH 2: platforms — add failure tracking for selector versioning
-- ============================================================
ALTER TABLE platforms
  ADD COLUMN IF NOT EXISTS last_success_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failure_count    INT NOT NULL DEFAULT 0;

-- Index for quick lookup of healthy platforms
CREATE INDEX IF NOT EXISTS idx_platforms_failure_count
  ON platforms(failure_count)
  WHERE is_active = true;

-- ============================================================
-- PATCH 3: Update existing platforms to healthy state
-- ============================================================
UPDATE platforms SET failure_count = 0 WHERE failure_count IS NULL;

SELECT 'Schema patch v2 applied successfully.' AS result;


