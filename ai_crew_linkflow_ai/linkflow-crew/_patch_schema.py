import psycopg2
DSN = 'postgresql://neondb_owner:npg_6r3PnCxiIbTt@ep-sweet-block-ah1rvh25-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
conn = psycopg2.connect(DSN)
cur = conn.cursor()

patch_sql = [
    "ALTER TABLE backlink_tasks ADD COLUMN IF NOT EXISTS worker_id TEXT",
    "ALTER TABLE backlink_tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
    "ALTER TABLE backlink_tasks ADD COLUMN IF NOT EXISTS ai_thought TEXT",
    "ALTER TABLE backlink_tasks ADD COLUMN IF NOT EXISTS execution_time_ms INT",
    "ALTER TABLE backlink_tasks ADD COLUMN IF NOT EXISTS session_storage JSONB",
    "ALTER TABLE backlink_tasks ADD COLUMN IF NOT EXISTS current_step_index INT DEFAULT 0",
    "CREATE INDEX IF NOT EXISTS idx_backlink_tasks_status_created ON backlink_tasks(status, created_at)",
]

for sql in patch_sql:
    cur.execute(sql)
    print('[OK]', sql[:70])

conn.commit()
print('[DONE] Schema patch complete')

cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='backlink_tasks' ORDER BY ordinal_position")
for r in cur.fetchall():
    print(f'  {r[0]:35} {r[1]}')

conn.close()
