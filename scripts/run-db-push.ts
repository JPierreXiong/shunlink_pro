import { config } from 'dotenv';
import { execSync } from 'child_process';

config({ path: '.env.local' });

// Use unpooled URL for migrations
const unpooled = process.env.DATABASE_URL_UNPOOLED;
if (unpooled) {
  process.env.DATABASE_URL = unpooled;
}

console.log('Using DB URL:', process.env.DATABASE_URL?.substring(0, 70));

try {
  const out = execSync(
    'npx drizzle-kit push --config=src/core/db/config.ts --force',
    {
      env: { ...process.env },
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 120000,
    }
  );
  console.log(out);
  console.log('✅ DB push complete!');
} catch (e: any) {
  if (e.stdout) console.log('STDOUT:', e.stdout);
  if (e.stderr) console.error('STDERR:', e.stderr);
  process.exit(1);
}
