/**
 * Initialize Google OAuth credentials in the database config table.
 * Run: npx tsx scripts/init-google-oauth.ts
 */
import 'dotenv/config';
import { db } from '../src/core/db';
import { config } from '../src/config/db/schema';

async function main() {
  console.log('🔑 Saving Google OAuth config to database...');

  const entries = [
    { name: 'google_client_id', value: process.env.GOOGLE_CLIENT_ID || '' },
    { name: 'google_client_secret', value: process.env.GOOGLE_CLIENT_SECRET || '' },
    { name: 'google_one_tap_enabled', value: 'false' },
    { name: 'email_auth_enabled', value: 'true' },
  ];

  for (const entry of entries) {
    await db()
      .insert(config)
      .values(entry)
      .onConflictDoUpdate({
        target: config.name,
        set: { value: entry.value },
      });
    console.log(`  ✓ ${entry.name}`);
  }

  console.log('\n✅ Google OAuth config saved.');
  console.log('Users can now sign in with Google OAuth.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});



