import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_6r3PnCxiIbTt@ep-sweet-block-ah1rvh25-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require');

const cols = await sql`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name='order' AND table_schema='public' ORDER BY ordinal_position`;
console.log('=== order table columns ===');
cols.forEach(c => console.log(`  ${c.column_name} | ${c.data_type} | nullable=${c.is_nullable} | default=${c.column_default}`));








