/**
 * Seed script: populate backlink_platforms with initial data
 * Run: npx tsx scripts/seed-backlink-platforms.ts
 */
import { db } from '../src/core/db';
import { backlinkPlatforms } from '../src/config/db/schema';
import { getUuid } from '../src/shared/lib/hash';

const platforms = [
  {
    name: 'Blogger',
    slug: 'blogger',
    description: 'Google-owned blogging platform with high DA. Easiest for AI agent deployment.',
    homeUrl: 'https://www.blogger.com',
    successRate: 92,
    difficulty: 'easy',
    sensitivity: 'low',
    notes: 'Most reliable platform. Google-owned, stable API. Low risk of detection.',
  },
  {
    name: 'Medium',
    slug: 'medium',
    description: 'High-authority publishing platform. Links carry strong SEO weight.',
    homeUrl: 'https://medium.com',
    successRate: 88,
    difficulty: 'easy',
    sensitivity: 'low',
    notes: 'Requires account age > 7 days for optimal results.',
  },
  {
    name: 'WordPress.com',
    slug: 'wordpress-com',
    description: 'Large blogging network. Hosted WordPress sites with strong domain authority.',
    homeUrl: 'https://wordpress.com',
    successRate: 85,
    difficulty: 'medium',
    sensitivity: 'medium',
    notes: 'Rate limiting applies. Space tasks 30+ minutes apart.',
  },
  {
    name: 'Tumblr',
    slug: 'tumblr',
    description: 'Microblogging platform owned by Automattic. Fast indexing.',
    homeUrl: 'https://www.tumblr.com',
    successRate: 83,
    difficulty: 'easy',
    sensitivity: 'low',
    notes: 'Quick indexing. Good for tier-2 link building.',
  },
  {
    name: 'Reddit',
    slug: 'reddit',
    description: 'Highest DA social platform. Links are extremely valuable when successful.',
    homeUrl: 'https://www.reddit.com',
    successRate: 71,
    difficulty: 'hard',
    sensitivity: 'high',
    notes: 'CRITICAL: Reddit karma and account age are crucial. New accounts get shadow-banned. Use aged accounts only. Never spam.',
  },
  {
    name: 'Mix',
    slug: 'mix',
    description: 'Content curation platform. Good for diverse backlink profiles.',
    homeUrl: 'https://mix.com',
    successRate: 87,
    difficulty: 'easy',
    sensitivity: 'low',
    notes: 'Formerly StumbleUpon. Easy deployment with high success rate.',
  },
  {
    name: 'Pearltrees',
    slug: 'pearltrees',
    description: 'Visual bookmarking platform. Unique link profile diversification.',
    homeUrl: 'https://www.pearltrees.com',
    successRate: 89,
    difficulty: 'easy',
    sensitivity: 'low',
    notes: 'Excellent for diversifying anchor text profiles.',
  },
  {
    name: 'Diigo',
    slug: 'diigo',
    description: 'Social bookmarking and annotation platform with established authority.',
    homeUrl: 'https://www.diigo.com',
    successRate: 84,
    difficulty: 'medium',
    sensitivity: 'medium',
    notes: 'Requires account verification. Links are do-follow.',
  },
  {
    name: 'Instapaper',
    slug: 'instapaper',
    description: 'Read-later service that indexes submitted URLs. Good for content amplification.',
    homeUrl: 'https://www.instapaper.com',
    successRate: 90,
    difficulty: 'easy',
    sensitivity: 'low',
    notes: 'Very low detection risk. Consistent performance.',
  },
  {
    name: 'Scoop.it',
    slug: 'scoop-it',
    description: 'Content curation platform with high domain authority. Business-friendly.',
    homeUrl: 'https://www.scoop.it',
    successRate: 82,
    difficulty: 'medium',
    sensitivity: 'medium',
    notes: 'Free tier has posting limits. Best for niche topics.',
  },
];

async function seed() {
  console.log('🌱 Seeding backlink platforms...');

  for (const platform of platforms) {
    try {
      await db()
        .insert(backlinkPlatforms)
        .values({
          id: getUuid(),
          ...platform,
          isActive: true,
          totalTasks: 0,
        })
        .onConflictDoUpdate({
          target: backlinkPlatforms.slug,
          set: {
            name: platform.name,
            description: platform.description,
            successRate: platform.successRate,
            difficulty: platform.difficulty,
            sensitivity: platform.sensitivity,
            notes: platform.notes,
          },
        });
      console.log(`  ✓ ${platform.name}`);
    } catch (err) {
      console.error(`  ✗ ${platform.name}:`, err);
    }
  }

  console.log('✅ Seed complete.');
  process.exit(0);
}

seed();








