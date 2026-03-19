export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/core/db';
import { backlinkTasks, credit } from '@/config/db/schema';
import { getUuid } from '@/shared/lib/hash';
import { getSnowId } from '@/shared/lib/hash';
import { CreditStatus, CreditTransactionType } from '@/shared/models/credit';

// POST /api/backlink/tasks/[id]/refund
// Called by Python Worker when task fails after max retries.
// Idempotent: checks is_refunded before processing.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Worker authentication via secret header
    const secret = req.headers.get('x-worker-secret');
    const workerSecret = process.env.WORKER_SECRET;
    if (workerSecret && secret !== workerSecret) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const [task] = await db()
      .select()
      .from(backlinkTasks)
      .where(eq(backlinkTasks.id, id));

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Idempotency guard — prevents double refund
    if (task.isRefunded) {
      return NextResponse.json({ success: true, message: 'Already refunded' });
    }

    // Only refund failed tasks that exhausted retries
    if (task.status !== 'failed' || (task.retryCount ?? 0) < 3) {
      return NextResponse.json(
        { error: 'Task is not eligible for refund' },
        { status: 400 }
      );
    }

    // Grant 1 credit back atomically
    await db().transaction(async (tx: any) => {
      // Mark as refunded FIRST to prevent race conditions
      await tx
        .update(backlinkTasks)
        .set({ isRefunded: true })
        .where(eq(backlinkTasks.id, id));

      // Grant 1 credit back to user
      await tx.insert(credit).values({
        id: getUuid(),
        transactionNo: getSnowId(),
        transactionType: CreditTransactionType.GRANT,
        transactionScene: 'refund',
        userId: task.userId,
        status: CreditStatus.ACTIVE,
        credits: 1,
        remainingCredits: 1,
        description: `Auto-refund for failed task ${id.slice(0, 8)}`,
        metadata: JSON.stringify({ taskId: id, reason: 'max_retries_exceeded' }),
      });
    });

    return NextResponse.json({ success: true, message: 'Credit refunded' });
  } catch (error) {
    console.error('[backlink/tasks/[id]/refund POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
