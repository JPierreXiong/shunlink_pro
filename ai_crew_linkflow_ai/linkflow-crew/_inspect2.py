import psycopg2
DSN = 'postgresql://neondb_owner:npg_6r3PnCxiIbTt@ep-sweet-block-ah1rvh25-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
conn = psycopg2.connect(DSN)
cur = conn.cursor()

# Inspect backlink_platforms columns
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='backlink_platforms' ORDER BY ordinal_position")
print('[backlink_platforms columns]')
for r in cur.fetchall():
    print(f'  {r[0]:35} {r[1]}')

cur.execute("SELECT * FROM backlink_platforms LIMIT 3")
rows = cur.fetchall()
print(f'[backlink_platforms data] {len(rows)} rows')
for r in rows:
    print(' ', r)

# Also check users vs user table
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='user' ORDER BY ordinal_position")
print('[user columns]')
for r in cur.fetchall():
    print(f'  {r[0]}')

conn.close()
