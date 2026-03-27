import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_6r3PnCxiIbTt@ep-sweet-block-ah1rvh25-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require');

try {
  // Check tables
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
  console.log('=== TABLES IN DB ===');
  tables.forEach(t => console.log(' -', t.table_name));

  // Check counts
  const users = await sql`SELECT COUNT(*) as cnt FROM "user"`;
  console.log('\nUser count:', users[0].cnt);

  const sessions = await sql`SELECT COUNT(*) as cnt FROM session`;
  console.log('Session count:', sessions[0].cnt);

  const accounts = await sql`SELECT COUNT(*) as cnt FROM account`;
  console.log('Account count:', accounts[0].cnt);

  // Check config table
  const configs = await sql`SELECT key, value FROM config LIMIT 10`;
  console.log('\nConfig entries:', configs.length);
  configs.forEach(c => console.log(` ${c.key} = ${c.value}`));

} catch(e) {
  console.error('ERROR:', e.message);
}












