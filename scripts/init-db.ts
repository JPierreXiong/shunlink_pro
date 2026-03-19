import { config } from 'dotenv';
config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/config/db/schema';
import { sql } from 'drizzle-orm';

async function main() {
  const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || '';
  console.log('Connecting to:', dbUrl.substring(0, 60));

  const client = postgres(dbUrl, { ssl: 'require', max: 1 });
  const db = drizzle(client, { schema });

  console.log('\nCreating/verifying core tables...');

  // Create tables using raw SQL to avoid drizzle-kit interactive mode
  const tables = [
    // users table
    `CREATE TABLE IF NOT EXISTS "users" (
      "id" text PRIMARY KEY,
      "uuid" text UNIQUE,
      "email" text UNIQUE NOT NULL,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now(),
      "username" text,
      "avatar_url" text,
      "nickname" text,
      "invite_code" text UNIQUE,
      "invited_by" text,
      "is_admin" boolean DEFAULT false
    )`,
    // config table
    `CREATE TABLE IF NOT EXISTS "config" (
      "name" text PRIMARY KEY,
      "value" text,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    )`,
    // payments table
    `CREATE TABLE IF NOT EXISTS "payments" (
      "id" text PRIMARY KEY,
      "user_id" text,
      "amount" integer,
      "currency" text DEFAULT 'usd',
      "status" text,
      "provider" text,
      "order_id" text,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    )`,
    // credits table
    `CREATE TABLE IF NOT EXISTS "credits" (
      "id" text PRIMARY KEY,
      "user_id" text UNIQUE,
      "balance" integer DEFAULT 0,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    )`,
    // orders table  
    `CREATE TABLE IF NOT EXISTS "orders" (
      "id" text PRIMARY KEY,
      "user_id" text,
      "amount" integer,
      "currency" text DEFAULT 'usd',
      "status" text DEFAULT 'pending',
      "product_id" text,
      "provider" text,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    )`,
    // subscriptions table
    `CREATE TABLE IF NOT EXISTS "subscriptions" (
      "id" text PRIMARY KEY,
      "user_id" text,
      "product_id" text,
      "status" text,
      "provider" text,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    )`,
    // backlink platforms table
    `CREATE TABLE IF NOT EXISTS "platforms" (
      "id" text PRIMARY KEY,
      "name" text NOT NULL,
      "domain" text,
      "da" integer DEFAULT 0,
      "category" text,
      "description" text,
      "is_active" boolean DEFAULT true,
      "credit_cost" integer DEFAULT 1,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    )`,
    // backlink tasks table
    `CREATE TABLE IF NOT EXISTS "backlink_tasks" (
      "id" text PRIMARY KEY,
      "user_id" text,
      "platform_id" text,
      "target_url" text,
      "anchor_text" text,
      "status" text DEFAULT 'pending',
      "retry_count" integer DEFAULT 0,
      "is_refunded" boolean DEFAULT false,
      "result_url" text,
      "screenshot_url" text,
      "error_message" text,
      "two_fa_code" text,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    )`,
  ];

  for (const tableSql of tables) {
    const tableName = tableSql.match(/CREATE TABLE IF NOT EXISTS "(\w+)"/)?.[1];
    try {
      await db.execute(sql.raw(tableSql));
      console.log(`  ✓ ${tableName}`);
    } catch (err: any) {
      console.error(`  ✗ ${tableName}: ${err.message}`);
    }
  }

  // Now save Google OAuth config
  console.log('\nSaving Google OAuth config...');
  const oauthEntries = [
    { name: 'google_client_id', value: process.env.GOOGLE_CLIENT_ID || '' },
    { name: 'google_client_secret', value: process.env.GOOGLE_CLIENT_SECRET || '' },
    { name: 'google_one_tap_enabled', value: 'false' },
    { name: 'email_auth_enabled', value: 'true' },
  ];

  for (const entry of oauthEntries) {
    try {
      await db.execute(
        sql.raw(`INSERT INTO "config" ("name", "value") VALUES ('${entry.name}', '${entry.value}') ON CONFLICT ("name") DO UPDATE SET "value" = '${entry.value}'`)
      );
      console.log(`  ✓ ${entry.name}`);
    } catch (err: any) {
      console.error(`  ✗ ${entry.name}: ${err.message}`);
    }
  }

  await client.end();
  console.log('\n✅ Database initialized successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});


