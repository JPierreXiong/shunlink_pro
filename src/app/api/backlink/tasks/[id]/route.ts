import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/core/db';
import { backlinkTasks } from '@/config/db/schema';
import { getUserInfo } from '@/shared/models/user';

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
