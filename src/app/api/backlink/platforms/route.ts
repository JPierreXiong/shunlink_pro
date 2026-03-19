export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/core/db';
import { backlinkPlatforms } from '@/config/db/schema';

// GET /api/backlink/platforms â€?public, no auth required (SEO landing page)
export async function GET() {
  try {
    const platforms = await db()
      .select()
      .from(backlinkPlatforms)
      .where(eq(backlinkPlatforms.isActive, true))
      .orderBy(backlinkPlatforms.successRate);

    return NextResponse.json({ success: true, platforms });
  } catch (error) {
    console.error('[backlink/platforms GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



