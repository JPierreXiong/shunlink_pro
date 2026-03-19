export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/core/db';
import { backlinkTasks, backlinkPlatforms } from '@/config/db/schema';
import { auth } from '@/shared/lib/auth';

// GET /api/backlink/tasks/[id] — TaskCard polls this for real-time status
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    const user = session?.user;
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const rows = await db()
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
        agentLog: backlinkTasks.agentLog,
        createdAt: backlinkTasks.createdAt,
        updatedAt: backlinkTasks.updatedAt,
        platformId: backlinkTasks.platformId,
        platformName: backlinkPlatforms.name,
        platformSlug: backlinkPlatforms.slug,
      })
      .from(backlinkTasks)
      .leftJoin(backlinkPlatforms, eq(backlinkTasks.platformId, backlinkPlatforms.id))
      .where(
        and(
          eq(backlinkTasks.id, id),
          eq(backlinkTasks.userId, user.id)
        )
      )
      .limit(1);

    if (!rows.length) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, task: rows[0] });
  } catch (error) {
    console.error('[backlink/tasks/[id] GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/backlink/tasks/[id] — Python Worker updates task status/proof
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const secret = req.headers.get('x-worker-secret');
    const workerSecret = process.env.WORKER_SECRET;
    if (workerSecret && secret !== workerSecret) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      status,
      screenshotUrl,
      liveUrl,
      retryCount,
      errorMessage,
      agentLog,
      browserFingerprint,
      proxyIp,
    } = body;

    const updateData: Record<string, any> = {};
    if (status !== undefined) updateData.status = status;
    if (screenshotUrl !== undefined) updateData.screenshotUrl = screenshotUrl;
    if (liveUrl !== undefined) updateData.liveUrl = liveUrl;
    if (retryCount !== undefined) updateData.retryCount = retryCount;
    if (errorMessage !== undefined) updateData.errorMessage = errorMessage;
    if (agentLog !== undefined) updateData.agentLog = agentLog;
    if (browserFingerprint !== undefined) updateData.browserFingerprint = browserFingerprint;
    if (proxyIp !== undefined) updateData.proxyIp = proxyIp;

    const [updated] = await db()
      .update(backlinkTasks)
      .set(updateData)
      .where(eq(backlinkTasks.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, task: updated });
  } catch (error) {
    console.error('[backlink/tasks/[id] PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
