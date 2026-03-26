// Direct schema migration — creates missing backlink tables
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_6r3PnCxiIbTt@ep-sweet-block-ah1rvh25-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

const SQL = `
-- Create backlink_platforms if not exists
CREATE TABLE IF NOT EXISTS backlink_platforms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  home_url TEXT,
  success_rate INTEGER DEFAULT 85,
  total_tasks INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  difficulty TEXT DEFAULT 'medium',
  sensitivity TEXT DEFAULT 'medium',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create backlink_tasks if not exists (full schema)
CREATE TABLE IF NOT EXISTS backlink_tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  platform_id TEXT REFERENCES backlink_platforms(id),
  target_url TEXT NOT NULL,
  anchor_text TEXT NOT NULL,
  agent_persona TEXT DEFAULT 'professional',
  ai_optimize BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending',
  two_fa_code TEXT,
  screenshot_url TEXT,
  live_url TEXT,
  retry_count INTEGER DEFAULT 0,
  is_refunded BOOLEAN NOT NULL DEFAULT false,
  sla_due TIMESTAMP,
  browser_fingerprint JSONB,
  proxy_ip TEXT,
  error_message TEXT,
  agent_log TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add missing columns to backlink_tasks if table already existed with old schema
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='backlink_tasks' AND column_name='agent_persona') THEN
    ALTER TABLE backlink_tasks ADD COLUMN agent_persona TEXT DEFAULT 'professional';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='backlink_tasks' AND column_name='ai_optimize') THEN
    ALTER TABLE backlink_tasks ADD COLUMN ai_optimize BOOLEAN DEFAULT true;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='backlink_tasks' AND column_name='two_fa_code') THEN
    ALTER TABLE backlink_tasks ADD COLUMN two_fa_code TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='backlink_tasks' AND column_name='is_refunded') THEN
    ALTER TABLE backlink_tasks ADD COLUMN is_refunded BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='backlink_tasks' AND column_name='sla_due') THEN
    ALTER TABLE backlink_tasks ADD COLUMN sla_due TIMESTAMP;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='backlink_tasks' AND column_name='browser_fingerprint') THEN
    ALTER TABLE backlink_tasks ADD COLUMN browser_fingerprint JSONB;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='backlink_tasks' AND column_name='proxy_ip') THEN
    ALTER TABLE backlink_tasks ADD COLUMN proxy_ip TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='backlink_tasks' AND column_name='error_message') THEN
    ALTER TABLE backlink_tasks ADD COLUMN error_message TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='backlink_tasks' AND column_name='agent_log') THEN
    ALTER TABLE backlink_tasks ADD COLUMN agent_log TEXT;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_backlink_platforms_active ON backlink_platforms(is_active);
CREATE INDEX IF NOT EXISTS idx_backlink_platforms_slug ON backlink_platforms(slug);
CREATE INDEX IF NOT EXISTS idx_backlink_tasks_user ON backlink_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_backlink_tasks_status ON backlink_tasks(status);
CREATE INDEX IF NOT EXISTS idx_backlink_tasks_user_status ON backlink_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_backlink_tasks_created ON backlink_tasks(created_at);
`;

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log('Connected to Neon DB');
  try {
    await client.query(SQL);
    console.log('Schema migration complete!');
    // Verify
    const r = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('backlink_platforms','backlink_tasks') ORDER BY table_name`);
    console.log('Tables:', r.rows.map(x => x.table_name).join(', '));
    const cols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='backlink_tasks' ORDER BY ordinal_position`);
    console.log('backlink_tasks columns:', cols.rows.map(x => x.column_name).join(', '));
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error('Migration failed:', e.message); process.exit(1); });

















