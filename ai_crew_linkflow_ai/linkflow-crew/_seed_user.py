import psycopg2
DSN = 'postgresql://neondb_owner:npg_6r3PnCxiIbTt@ep-sweet-block-ah1rvh25-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
conn = psycopg2.connect(DSN)
cur = conn.cursor()

# Insert test user matching the existing task user_id
cur.execute("""
    INSERT INTO users (id, email, name, credit_balance, provider)
    VALUES ('12a67bd2-b637-48b9-b3c7-9f100f0b6071', 'test@linkflow.ai', 'Test User', 10, 'github')
    ON CONFLICT (id) DO UPDATE SET credit_balance = 10
""")

# Also ensure the task has a platform_id set
cur.execute("""
    UPDATE backlink_tasks
    SET platform_id = 'plat_wordpress'
    WHERE id = 'd9901803-2087-4df0-9520-bac6dd09900d' AND platform_id IS NULL
""")

conn.commit()
print('[OK] Test user inserted, task platform_id set')

# Verify
cur.execute("SELECT id, email, credit_balance FROM users")
print('[users]', cur.fetchall())
cur.execute("SELECT id, status, user_id, platform_id FROM backlink_tasks WHERE id='d9901803-2087-4df0-9520-bac6dd09900d'")
print('[task]', cur.fetchone())

conn.close()
