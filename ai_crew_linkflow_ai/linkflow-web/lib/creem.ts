/**
 * Creem payment utility for LinkFlow AI
 *
 * Handles:
 *  - Webhook signature verification
 *  - Product ID → credits mapping
 *  - Credit grant after successful payment
 */

import { prisma } from './db'
import crypto from 'crypto'

// ── Product → Credits mapping ─────────────────────────────────────────────────
// Keep this server-side only. Never derive credits from webhook payload amount.
const PRODUCT_CREDITS_MAP: Record<string, number> = {
  [process.env.CREEM_PRODUCT_10_CREDITS ?? '']: 10,  // $39 plan
  [process.env.CREEM_PRODUCT_25_CREDITS ?? '']: 25,  // $89 plan
}

/**
 * Verify the Creem webhook HMAC-SHA256 signature.
 * Throws if the signature is invalid.
 */
export function verifyCreemWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string,
): void {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex')

  const sigBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid Creem webhook signature')
  }
}

/**
 * Get the number of credits for a given Creem product ID.
 * Returns 0 if the product ID is not recognized.
 */
export function getCreditsForProduct(productId: string): number {
  return PRODUCT_CREDITS_MAP[productId] ?? 0
}

/**
 * Idempotently grant credits to a user after a successful payment.
 *
 * - Uses creem_checkout_id as the idempotency key
 * - Runs as a transaction: update payment + increment credits atomically
 * - Safe to call multiple times for the same checkout ID
 *
 * Returns the number of credits added (0 if already processed).
 */
export async function grantCreditsForPayment(params: {
  userId: string
  creemCheckoutId: string
  creemProductId: string
  amount: number
  currency: string
}): Promise<number> {
  const { userId, creemCheckoutId, creemProductId, amount, currency } = params

  const creditsToAdd = getCreditsForProduct(creemProductId)
  if (creditsToAdd === 0) {
    console.warn(`[Creem] Unknown product ID: ${creemProductId}`)
    return 0
  }

  return prisma.$transaction(async (tx) => {
    // Idempotency check — if payment already completed, skip
    const existing = await tx.payment.findUnique({
      where: { creemCheckoutId },
      select: { status: true },
    })

    if (existing?.status === 'completed') {
      console.log(`[Creem] Payment ${creemCheckoutId} already processed — skipping`)
      return 0
    }

    // Upsert payment record
    await tx.payment.upsert({
      where: { creemCheckoutId },
      create: {
        userId,
        creemCheckoutId,
        creemProductId,
        amount,
        currency,
        creditsAdded: creditsToAdd,
        status: 'completed',
      },
      update: {
        status: 'completed',
        creditsAdded: creditsToAdd,
      },
    })

    // Atomically increment user credits
    await tx.user.update({
      where: { id: userId },
      data: { creditBalance: { increment: creditsToAdd } },
    })

    console.log(`[Creem] Granted ${creditsToAdd} credits to user ${userId}`)
    return creditsToAdd
  })
}


