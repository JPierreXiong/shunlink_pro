import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  verifyCreemWebhookSignature,
  grantCreditsForPayment,
} from '@/lib/creem'

export const runtime = 'nodejs'

// POST /api/webhooks/creem — receives payment events from Creem
export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('creem-signature') ?? ''
  const secret = process.env.CREEM_WEBHOOK_SECRET ?? ''

  // 1. Verify HMAC signature
  try {
    verifyCreemWebhookSignature(rawBody, signature, secret)
  } catch (err) {
    console.error('[Creem Webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // 2. Only handle successful payment events
  const eventType: string = event?.type ?? event?.event ?? ''
  if (!eventType.includes('payment') && !eventType.includes('checkout')) {
    // Acknowledge but don't process other event types
    return NextResponse.json({ received: true })
  }

  const data = event?.data ?? event
  const checkoutId: string = data?.id ?? data?.checkout_id ?? ''
  const productId: string = data?.product_id ?? data?.product?.id ?? ''
  const customerEmail: string =
    data?.customer?.email ?? data?.email ?? ''
  const amount: number = parseFloat(data?.amount ?? data?.total ?? '0')
  const currency: string = data?.currency ?? 'USD'

  if (!checkoutId || !productId || !customerEmail) {
    console.warn('[Creem Webhook] Missing required fields:', { checkoutId, productId, customerEmail })
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // 3. Find or create user by email
  let user = await prisma.user.findUnique({
    where: { email: customerEmail },
    select: { id: true },
  })

  if (!user) {
    // Auto-create user from payment (edge case: paid before signing up)
    user = await prisma.user.create({
      data: {
        email: customerEmail,
        provider: 'creem',
        creditBalance: 0,
      },
      select: { id: true },
    })
  }

  // 4. Grant credits (idempotent)
  try {
    const creditsAdded = await grantCreditsForPayment({
      userId: user.id,
      creemCheckoutId: checkoutId,
      creemProductId: productId,
      amount,
      currency,
    })

    console.log(
      `[Creem Webhook] Processed: user=${user.id} +${creditsAdded} credits (checkout=${checkoutId})`
    )

    return NextResponse.json({ received: true, creditsAdded })
  } catch (err) {
    console.error('[Creem Webhook] Failed to grant credits:', err)
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}


