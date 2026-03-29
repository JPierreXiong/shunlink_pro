import psycopg2
DSN = 'postgresql://neondb_owner:npg_6r3PnCxiIbTt@ep-sweet-block-ah1rvh25-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
conn = psycopg2.connect(DSN)
cur = conn.cursor()

# List all tables
cur.execute("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")
print('[tables]')
for r in cur.fetchall():
    print(' ', r[0])

# Check backlink_platforms
cur.execute("SELECT id, site_name FROM backlink_platforms LIMIT 5")
print('[backlink_platforms]', cur.fetchall())

conn.close()
