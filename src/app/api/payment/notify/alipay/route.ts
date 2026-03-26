export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import {
  paymentManager,
  PaymentEventType
} from '@/extensions/payment';
import { createAlipayProvider } from '@/extensions/payment/alipay';

function initializeAlipay() {
  if (process.env.ALIPAY_APP_ID) {
    const alipayProvider = createAlipayProvider({
      appId: process.env.ALIPAY_APP_ID,
      privateKey: process.env.ALIPAY_PRIVATE_KEY!,
      alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY!,
      notifyUrl: process.env.ALIPAY_NOTIFY_URL
    });
    paymentManager.addProvider(alipayProvider);
  }
}

initializeAlipay();

export async function POST(req: NextRequest) {
  try {
    console.log('Alipay webhook received');

    const event = await paymentManager.getPaymentEvent({
      req: req as any,
      provider: 'alipay'
    });

    console.log('Alipay event type:', event.eventType);

    switch (event.eventType) {
      case PaymentEventType.PAYMENT_SUCCESS:
        await handlePaymentSuccess(event);
        break;
      case PaymentEventType.PAYMENT_FAILED:
        await handlePaymentFailed(event);
        break;
      default:
        console.log('Unhandled event type:', event.eventType);
    }

    return new Response('success', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  } catch (error: any) {
    console.error('Alipay webhook error:', error);
    return new Response('fail', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

async function handlePaymentSuccess(event: any) {
  const { paymentInfo, metadata } = event.paymentSession || {};
  console.log('Alipay payment success:', {
    transactionId: paymentInfo?.transactionId,
    amount: paymentInfo?.paymentAmount,
    currency: paymentInfo?.paymentCurrency,
    userId: metadata?.userId,
  });

  if (metadata?.userId && metadata?.credits) {
    console.log(`Grant credits: user ${metadata.userId} gets ${metadata.credits} credits`);
  }
}

async function handlePaymentFailed(event: any) {
  const { paymentInfo, metadata } = event.paymentSession || {};
  console.log('Alipay payment failed:', {
    transactionId: paymentInfo?.transactionId,
    userId: metadata?.userId
  });
}
