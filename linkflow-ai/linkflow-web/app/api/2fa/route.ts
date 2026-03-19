import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST /api/2fa — submit a 2FA code for a waiting task
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { taskId, code } = body
  if (!taskId || !code) {
    return NextResponse.json(
      { error: 'taskId and code are required' },
      { status: 400 }
    )
  }

  // Verify the task belongs to the requesting user and is in need_2fa state
  const task = await prisma.backlinkTask.findUnique({
    where: { id: taskId },
    select: { userId: true, status: true },
  })

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  if (task.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (task.status !== 'need_2fa') {
    return NextResponse.json(
      { error: `Task is not awaiting 2FA (current status: ${task.status})` },
      { status: 409 }
    )
  }

  // Store the code and re-queue the task for the worker
  const updated = await prisma.backlinkTask.update({
    where: { id: taskId },
    data: {
      twofaCode: String(code).trim(),
      status: 'pending',
      twofaPrompt: null,
    },
    select: { id: true, status: true },
  })

  return NextResponse.json({
    message: 'Code accepted. Task re-queued for processing.',
    task: updated,
  })
}


