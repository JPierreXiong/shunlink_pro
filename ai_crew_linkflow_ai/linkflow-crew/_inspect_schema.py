import psycopg2
DSN = 'postgresql://neondb_owner:npg_6r3PnCxiIbTt@ep-sweet-block-ah1rvh25-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
conn = psycopg2.connect(DSN)
cur = conn.cursor()

# Check current table schema in detail
cur.execute("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='backlink_tasks' ORDER BY ordinal_position")
print('[backlink_tasks columns]')
for r in cur.fetchall():
    print(f'  {r[0]:35} {r[1]:30} nullable={r[2]}')

cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position")
print()
print('[users columns]')
for r in cur.fetchall():
    print(f'  {r[0]:35} {r[1]}')

cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='platforms' ORDER BY ordinal_position")
print()
print('[platforms columns]')
for r in cur.fetchall():
    print(f'  {r[0]:35} {r[1]}')

conn.close()
