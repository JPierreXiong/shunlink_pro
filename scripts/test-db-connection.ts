import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';

async function main() {
  const sql = postgres({
    host: 'ep-sweet-block-ah1rvh25.c-3.us-east-1.aws.neon.tech',
    port: 5432,
    database: 'neondb',
    username: 'neondb_owner',
    password: 'npg_6r3PnCxiIbTt',
    ssl: 'require',
    connect_timeout: 15,
    max: 1,
  });
  try {
    const result = await sql`SELECT current_database(), current_user`;
    console.log('✅ Connection SUCCESS - DB:', result[0].current_database, '| User:', result[0].current_user);
  } catch (err: any) {
    console.error('❌ FAILED:', err.message);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

main();
