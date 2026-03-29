import psycopg2
DSN = 'postgresql://neondb_owner:npg_6r3PnCxiIbTt@ep-sweet-block-ah1rvh25-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
conn = psycopg2.connect(DSN)
cur = conn.cursor()

USER_ID = '12a67bd2-b637-48b9-b3c7-9f100f0b6071'
TASK_ID = 'd9901803-2087-4df0-9520-bac6dd09900d'

# 1. Check if user exists in "user" table
cur.execute("SELECT id, email FROM \"user\" WHERE id=%s", (USER_ID,))
u = cur.fetchone()
print('[user lookup]', u)

# 2. Insert into users table (the linkflow worker users table)
cur.execute("""
    INSERT INTO users (id, email, name, credit_balance, provider)
    VALUES (%s, %s, %s, 10, %s)
    ON CONFLICT (id) DO UPDATE SET credit_balance = 10
""", (USER_ID, 'test@linkflow.ai', 'Test User', 'github'))
print('[OK] users row upserted')

# 3. Insert a platform into backlink_platforms
cur.execute("""
    INSERT INTO backlink_platforms (id, name, slug, home_url, is_active, difficulty, sensitivity)
    VALUES ('plat_wordpress', 'WordPress.com', 'wordpress', 'https://wordpress.com', true, 'easy', 'low')
    ON CONFLICT (id) DO NOTHING
""")
print('[OK] backlink_platforms row inserted')

# 4. Update the task with platform_id
cur.execute("""
    UPDATE backlink_tasks
    SET platform_id = 'plat_wordpress',
        anchor_text = COALESCE(anchor_text, 'best SEO tool 2025'),
        status = 'pending',
        retry_count = 0
    WHERE id = %s
""", (TASK_ID,))
print('[OK] task updated')

conn.commit()

# 5. Verify
cur.execute("SELECT id, email, credit_balance FROM users")
print('[users]', cur.fetchall())
cur.execute("SELECT id, name FROM backlink_platforms")
print('[platforms]', cur.fetchall())
cur.execute("SELECT id, status, user_id, platform_id, anchor_text FROM backlink_tasks WHERE id=%s", (TASK_ID,))
print('[task]', cur.fetchone())

conn.close()
print('[DONE] Seed data ready')
