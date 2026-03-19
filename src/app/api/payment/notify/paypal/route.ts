export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import {
  paymentManager,
  PaymentEventType,
  createPayPalProvider
} from '@/extensions/payment';

function initializePayPal() {
  if (process.env.PAYPAL_CLIENT_ID) {
    const paypalProvider = createPayPalProvider({
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
      webhookSecret: process.env.PAYPAL_WEBHOOK_ID,
      environment: (process.env.PAYPAL_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
    });
    paymentManager.addProvider(paypalProvider);
  }
}

initializePayPal();

export async function POST(req: NextRequest) {
  try {
    console.log('PayPal webhook received');

    const event = await paymentManager.getPaymentEvent({
      req: req as any,
      provider: 'paypal'
    });

    console.log('PayPal event type:', event.eventType);

    const eventType = event.eventType as string;
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCompleted(event);
        break;
      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentDenied(event);
        break;
      case 'BILLING.SUBSCRIPTION.CREATED':
        await handleSubscriptionCreated(event);
        break;
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(event);
        break;
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(event);
        break;
      default:
        console.log('Unhandled event type:', eventType);
    }

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('PayPal webhook error:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}

async function handlePaymentCompleted(event: any) {
  console.log('PayPal payment completed:', event.eventResult);
}

async function handlePaymentDenied(event: any) {
  console.log('PayPal payment denied:', event.eventResult);
}

async function handleSubscriptionCreated(event: any) {
  console.log('PayPal subscription created:', event.eventResult);
}

async function handleSubscriptionActivated(event: any) {
  console.log('PayPal subscription activated:', event.eventResult);
}

async function handleSubscriptionCancelled(event: any) {
  console.log('PayPal subscription cancelled:', event.eventResult);
}
