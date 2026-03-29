import psycopg2
DSN = 'postgresql://neondb_owner:npg_6r3PnCxiIbTt@ep-sweet-block-ah1rvh25-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
conn = psycopg2.connect(DSN)
cur = conn.cursor()

# Get the existing task detail
cur.execute("SELECT id, user_id, status, target_url, anchor_text, platform_id FROM backlink_tasks WHERE status=\'pending\' LIMIT 3")
tasks = cur.fetchall()
print("[pending tasks]")
for t in tasks:
    print(f"  id={t[0]}  user_id={t[1]}  status={t[2]}  url={t[3]}  platform_id={t[5]}")

conn.close()
