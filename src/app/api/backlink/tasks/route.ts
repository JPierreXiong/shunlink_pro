import { NextRequest, NextResponse } from 'next/server';
import { desc, eq, and } from 'drizzle-orm';
import { db } from '@/core/db';
import { backlinkTasks, backlinkPlatforms } from '@/config/db/schema';
import { getUuid } from '@/shared/lib/hash';
import { getRemainingCredits, consumeCredits } from '@/shared/models/credit';
import { auth } from '@/shared/lib/auth';

// GET /api/backlink/tasks — list current user's tasks
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    const user = session?.user;
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const status = searchParams.get('status');

    const tasks = await db()
      .select({
        id: backlinkTasks.id,
        targetUrl: backlinkTasks.targetUrl,
        anchorText: backlinkTasks.anchorText,
        agentPersona: backlinkTasks.agentPersona,
        aiOptimize: backlinkTasks.aiOptimize,
        status: backlinkTasks.status,
        screenshotUrl: backlinkTasks.screenshotUrl,
        liveUrl: backlinkTasks.liveUrl,
        retryCount: backlinkTasks.retryCount,
        isRefunded: backlinkTasks.isRefunded,
        slaDue: backlinkTasks.slaDue,
        errorMessage: backlinkTasks.errorMessage,
        createdAt: backlinkTasks.createdAt,
        updatedAt: backlinkTasks.updatedAt,
        platformId: backlinkTasks.platformId,
        platformName: backlinkPlatforms.name,
        platformSlug: backlinkPlatforms.slug,
        platformIconUrl: backlinkPlatforms.iconUrl,
      })
      .from(backlinkTasks)
      .leftJoin(backlinkPlatforms, eq(backlinkTasks.platformId, backlinkPlatforms.id))
      .where(
        and(
          eq(backlinkTasks.userId, user.id),
          status ? eq(backlinkTasks.status, status) : undefined
        )
      )
      .orderBy(desc(backlinkTasks.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const remainingCredits = await getRemainingCredits(user.id);

    return NextResponse.json({
      success: true,
      tasks,
      remainingCredits,
      page,
      limit,
    });
  } catch (error) {
    console.error('[backlink/tasks GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/backlink/tasks — create a new task (deducts 1 credit)
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    const user = session?.user;
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { targetUrl, anchorText, platformId, agentPersona = 'professional', aiOptimize = true } = body;

    // Validate required fields
    if (!targetUrl || !anchorText) {
      return NextResponse.json(
        { error: 'targetUrl and anchorText are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(targetUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Server-side credit check
    const remaining = await getRemainingCredits(user.id);
    if (remaining < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please purchase more credits to continue.' },
        { status: 402 }
      );
    }

    // Deduct 1 credit atomically
    await consumeCredits({
      userId: user.id,
      credits: 1,
      scene: 'backlink_task',
      description: `Backlink deployment: ${targetUrl}`,
      metadata: JSON.stringify({ targetUrl, anchorText, platformId }),
    });

    // Calculate SLA (48 hours from now)
    const slaDue = new Date();
    slaDue.setHours(slaDue.getHours() + 48);

    // Create task
    const taskId = getUuid();
    const [task] = await db()
      .insert(backlinkTasks)
      .values({
        id: taskId,
        userId: user.id,
        targetUrl,
        anchorText,
        platformId: platformId || null,
        agentPersona,
        aiOptimize,
        status: 'pending',
        slaDue,
        retryCount: 0,
        isRefunded: false,
      })
      .returning();

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error: any) {
    console.error('[backlink/tasks POST]', error);
    if (error?.message?.includes('Insufficient credits')) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


