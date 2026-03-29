-- LinkFlow AI — Seed a test task for local debugging
-- Run: psql $DATABASE_URL -f scripts/seed_test_task.sql
-- This creates a test user (if not exists) and inserts one pending task.

-- ── 1. Upsert a test user ─────────────────────────────────────────────────
INSERT INTO users (id, email, name, credit_balance, provider)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@linkflow.ai',
  'Local Test User',
  10,
  'github'
)
ON CONFLICT (email) DO UPDATE
  SET credit_balance = 10;

-- ── 2. Insert a pending test task ────────────────────────────────────────────
INSERT INTO backlink_tasks (
  id,
  user_id,
  target_url,
  anchor_text,
  article_content,
  platform_type,
  platform_id,
  status,
  deadline
)
VALUES (
  '00000000-0000-0000-0000-000000000099',
  '00000000-0000-0000-0000-000000000001',
  'https://example.com/seo-guide',
  'best SEO tool 2025',
  'This is a test article about SEO strategies. The best SEO tool 2025 can help you rank faster with less effort. Modern link building requires consistent deployment across multiple Web 2.0 platforms.',
  'Web2.0',
  1,  -- WordPress.com (platform_id=1 from seed data)
  'pending',
  NOW() + INTERVAL '48 hours'
)
ON CONFLICT (id) DO UPDATE
  SET status = 'pending',
      retry_count = 0,
      error_message = NULL;

SELECT
  'Test task seeded:' AS info,
  id,
  status,
  target_url,
  anchor_text
FROM backlink_tasks
WHERE id = '00000000-0000-0000-0000-000000000099';


