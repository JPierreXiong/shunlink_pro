import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/tasks — list tasks for the current user
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tasks = await prisma.backlinkTask.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      targetUrl: true,
      anchorText: true,
      platformType: true,
      status: true,
      retryCount: true,
      screenshotUrl: true,
      liveLinkUrl: true,
      errorMessage: true,
      twofaPrompt: true,
      createdAt: true,
      deadline: true,
    },
  })

  return NextResponse.json({ tasks })
}

// POST /api/tasks — create a new backlink task
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

  const { targetUrl, anchorText, articleContent, platformType } = body

  if (!targetUrl || !anchorText) {
    return NextResponse.json(
      { error: 'targetUrl and anchorText are required' },
      { status: 400 }
    )
  }

  // Validate URL format
  try {
    new URL(targetUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid targetUrl format' }, { status: 400 })
  }

  // Check user has credits (atomic: check + create in transaction)
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: session.user.id },
      select: { creditBalance: true },
    })

    if (!user || user.creditBalance < 1) {
      return { error: 'Insufficient credits', status: 402 }
    }

    const task = await tx.backlinkTask.create({
      data: {
        userId: session.user.id,
        targetUrl,
        anchorText,
        articleContent: articleContent || null,
        platformType: platformType || 'Web2.0',
        status: 'pending',
        deadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    })

    return { task }
  })

  if ('error' in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status as number }
    )
  }

  return NextResponse.json(result.task, { status: 201 })
}


