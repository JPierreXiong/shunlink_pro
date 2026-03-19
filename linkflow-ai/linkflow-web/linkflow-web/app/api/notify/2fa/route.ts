/**
 * POST /api/notify/2fa
 * Called by the Python worker (via webhook) when a task hits a 2FA gate.
 * Sends an email to the task owner and returns 200.
 *
 * Body: { taskId: string, platformName: string, promptMessage: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { send2FAAlert } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { taskId, platformName, promptMessage } = await req.json();

    if (!taskId || !platformName || !promptMessage) {
      return NextResponse.json(
        { error: 'taskId, platformName, and promptMessage are required' },
        { status: 400 }
      );
    }

    // Look up task + owner via Prisma
    const task = await prisma.backlinkTask.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        user: {
          select: { email: true, name: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://linkflow.ai';

    await send2FAAlert({
      toEmail: task.user.email!,
      toName: task.user.name || 'there',
      taskId,
      platformName,
      promptMessage,
      dashboardUrl,
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/api/notify/2fa] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
