/**
 * Neon HTTP Database Client — Vercel Serverless optimised
 *
 * Why this file exists:
 *   Vercel Serverless spins up a fresh function instance per request.
 *   Using the standard postgres.js TCP driver causes "connection storm":
 *   100 concurrent requests → 100 TCP connections → Neon free tier (10-20 limit) crashes.
 *
 *   @neondatabase/serverless routes every query over HTTPS instead of TCP.
 *   Multiple concurrent Vercel instances share the same HTTP pool at the Neon edge,
 *   so the effective connection count stays near 1 regardless of concurrency.
 *
 * Usage:
 *   import { db } from '@/lib/db';
 *   const rows = await db.select().from(myTable);
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Cache fetch connections so parallel Vercel invocations reuse the same HTTP pipeline
neonConfig.fetchConnectionCache = true;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(databaseUrl);

/**
 * Drizzle ORM instance backed by Neon HTTP transport.
 * Drop-in replacement for the existing db() function from @/core/db —
 * same query API (.select(), .insert(), .update(), .delete(), .transaction()),
 * but zero persistent TCP connections.
 */
export const db = drizzle(sql);




