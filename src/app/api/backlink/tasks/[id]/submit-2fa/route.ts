import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/core/db';
import { backlinkTasks } from '@/config/db/schema';
import { auth } from '@/shared/lib/auth';

// POST /api/backlink/tasks/[id]/submit-2fa
export async function POST(
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
    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return NextResponse.json({ error: '2FA code is required' }, { status: 400 });
    }

    // Verify task belongs to user and is in need_2fa state
    const [task] = await db()
      .select()
      .from(backlinkTasks)
      .where(
        and(
          eq(backlinkTasks.id, id),
          eq(backlinkTasks.userId, user.id),
          eq(backlinkTasks.status, 'need_2fa')
        )
      );

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or not awaiting 2FA' },
        { status: 404 }
      );
    }

    // Store the 2FA code and reset status to pending so Python worker picks it up
    const [updated] = await db()
      .update(backlinkTasks)
      .set({
        twoFaCode: code.trim(),
        status: 'pending',
      })
      .where(eq(backlinkTasks.id, id))
      .returning();

    return NextResponse.json({ success: true, task: updated });
  } catch (error) {
    console.error('[backlink/tasks/[id]/submit-2fa POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


