import psycopg2
DSN = 'postgresql://neondb_owner:npg_6r3PnCxiIbTt@ep-sweet-block-ah1rvh25-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
conn = psycopg2.connect(DSN)
cur = conn.cursor()

# Reset task to pending for fresh test
cur.execute("UPDATE backlink_tasks SET status='pending', retry_count=0, error_message=NULL, worker_id=NULL WHERE id='d9901803-2087-4df0-9520-bac6dd09900d'")
cur.execute("UPDATE users SET credit_balance=10 WHERE id='12a67bd2-b637-48b9-b3c7-9f100f0b6071'")
conn.commit()
print('[RESET] Task reset to pending, credits=10')

# Test fetch_next_job
import sys
sys.path.insert(0, 'd:/AIsoftware/linkflow/shunlink_pro/ai_crew_linkflow_ai/linkflow-crew')
from db_connector import get_connection, fetch_next_job

conn2 = get_connection()
job = fetch_next_job(conn2)
conn2.close()

if job:
    print('[OK] fetch_next_job returned:')
    for k, v in job.items():
        print(f'  {k:25} = {v}')
else:
    print('[FAIL] No job returned - check query')

conn.close()
