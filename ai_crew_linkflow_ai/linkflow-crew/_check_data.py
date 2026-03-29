import psycopg2
import uuid
DSN = 'postgresql://neondb_owner:npg_6r3PnCxiIbTt@ep-sweet-block-ah1rvh25-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
conn = psycopg2.connect(DSN)
cur = conn.cursor()

# Check existing users
cur.execute("SELECT id, email, credit_balance FROM users LIMIT 5")
users = cur.fetchall()
print('[users]', users)

# Check existing platforms
cur.execute("SELECT id, site_name, platform_type FROM platforms LIMIT 5")
platforms = cur.fetchall()
print('[platforms]', platforms)

# Check existing tasks
cur.execute("SELECT id, status, target_url FROM backlink_tasks LIMIT 5")
tasks = cur.fetchall()
print('[tasks]', tasks)

conn.close()
