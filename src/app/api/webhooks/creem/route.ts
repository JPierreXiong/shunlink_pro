/**
 * 统一�?Creem Webhook Handler
 * 
 * 智能处理两种类型�?webhook�? * 1. dashboard 自己的收款（用户购买订阅�? * 2. 用户 Creem 店铺的订单（监控用户的店铺收入）
 * 
 * 通过检�?webhook 数据中的 metadata 来判断类�? */

import { NextRequest, NextResponse } from 'next/server';
import { createCreemProvider } from '@/extensions/payment/creem';
import { db } from '@/core/db';
import { order, subscription, user, monitoredSites, siteMetricsDaily } from '@/config/db/schema';
import { eq } from 'drizzle-orm';
import { PaymentEventType } from '@/extensions/payment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log('🔔 [Webhook] Unified Creem webhook received:', {
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method,
  });

  try {
    // 1. 检�?Creem 配置
    const creemApiKey = process.env.CREEM_API_KEY;
    const creemSigningSecret = process.env.CREEM_SIGNING_SECRET;
    const creemEnvironment = process.env.CREEM_ENVIRONMENT as 'sandbox' | 'production';

    if (!creemApiKey || !creemSigningSecret) {
      console.error('�?[Webhook] Creem not configured');
      return NextResponse.json(
        { error: 'Payment provider not configured' },
        { status: 500 }
      );
    }

    console.log('�?[Webhook] Creem configuration found');

    // 2. 创建 Creem Provider 并验�?webhook
    const creemProvider = createCreemProvider({
      apiKey: creemApiKey,
      signingSecret: creemSigningSecret,
      environment: creemEnvironment || 'production',
    });

    console.log('🔍 [Webhook] Verifying webhook signature...');
    const paymentEvent = await creemProvider.getPaymentEvent({ req });

    console.log('�?[Webhook] Webhook verified successfully:', {
      eventType: paymentEvent.eventType,
      hasMetadata: !!paymentEvent.paymentSession?.metadata,
      metadata: paymentEvent.paymentSession?.metadata,
    });

    // 3. 判断 webhook 类型
    const metadata = paymentEvent.paymentSession?.metadata || {};
    const isdashboardPayment = metadata.app_name === 'LinkFlow AI' || 
                               metadata.userId || 
                               metadata.orderId ||
                               metadata.order_no;

    if (isdashboardPayment) {
      console.log('💰 [Webhook] Detected dashboard payment webhook');
      return await handledashboardPayment(paymentEvent, startTime);
    } else {
      console.log('🏪 [Webhook] Detected user store monitoring webhook');
      return await handleUserStoreOrder(paymentEvent, startTime);
    }

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('�?[Webhook] Webhook processing failed:', {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });
    
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 处理 dashboard 自己的收款（用户购买订阅�? */
async function handledashboardPayment(paymentEvent: any, startTime: number) {
  console.log('📦 [dashboardPayment] Processing payment event...');
  
  let handlerResult;
  if (paymentEvent.eventType === PaymentEventType.CHECKOUT_SUCCESS) {
    console.log('📦 [dashboardPayment] Processing CHECKOUT_SUCCESS event...');
    handlerResult = await handleCheckoutSuccess(paymentEvent);
  } else if (paymentEvent.eventType === PaymentEventType.PAYMENT_SUCCESS) {
    console.log('📦 [dashboardPayment] Processing PAYMENT_SUCCESS event...');
    handlerResult = await handlePaymentSuccess(paymentEvent);
  } else if (paymentEvent.eventType === PaymentEventType.SUBSCRIBE_UPDATED) {
    console.log('📦 [dashboardPayment] Processing SUBSCRIBE_UPDATED event...');
    handlerResult = await handleSubscriptionUpdated(paymentEvent);
  } else if (paymentEvent.eventType === PaymentEventType.SUBSCRIBE_CANCELED) {
    console.log('📦 [dashboardPayment] Processing SUBSCRIBE_CANCELED event...');
    handlerResult = await handleSubscriptionCanceled(paymentEvent);
  } else {
    console.warn('⚠️ [dashboardPayment] Unknown event type:', paymentEvent.eventType);
  }

  const duration = Date.now() - startTime;
  console.log('�?[dashboardPayment] Payment processed successfully:', {
    eventType: paymentEvent.eventType,
    duration: `${duration}ms`,
    result: handlerResult,
  });

  return NextResponse.json({ 
    received: true,
    type: 'dashboard_payment',
    eventType: paymentEvent.eventType,
    processedAt: new Date().toISOString(),
  });
}

/**
 * 处理用户店铺订单（监控功能）
 */
async function handleUserStoreOrder(paymentEvent: any, startTime: number) {
  console.log('🏪 [UserStore] Processing store order...');
  
  const session = paymentEvent.paymentSession;
  const amount = session.paymentInfo?.amount || 0;
  const customerEmail = session.paymentInfo?.paymentEmail;
  
  console.log('🏪 [UserStore] Order details:', {
    amount,
    customerEmail,
    transactionId: session.paymentInfo?.transactionId,
  });

  // 这里可以添加用户店铺订单的处理逻辑
  // 例如：更新用户的店铺收入统计�?  
  const duration = Date.now() - startTime;
  console.log('�?[UserStore] Store order processed:', {
    duration: `${duration}ms`,
  });

  return NextResponse.json({ 
    received: true,
    type: 'user_store_order',
    processedAt: new Date().toISOString(),
  });
}

/**
 * 处理订单完成事件
 * 更新站点的今日收入数�? */
async function handleOrderCompleted(payload: CreemWebhookPayload) {
  const { data } = payload;
  
  // 如果 Webhook 中包含 site_id，直接使用
  let siteId = data.site_id;

  // 如果没有 site_id，尝试通过 customer_email 或其他方式查找
  if (!siteId) {
    // 查找所有配置了 Creem 的站点
    const sites = await db()
      .select()
      .from(monitoredSites)
      .where(eq(monitoredSites.platform, 'creem'));

    if (sites.length === 0) {
      console.warn('No Creem sites found in database');
      return;
    }

    // 如果只有一�?Creem 站点，默认使用它
    if (sites.length === 1) {
      siteId = sites[0].id;
    } else {
      console.warn('Multiple Creem sites found, cannot determine which one');
      return;
    }
  }

  // 更新今日收入数据
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 检查今天是否已有记录
  const existingMetrics = await db()
    .select()
    .from(siteMetricsDaily)
    .where(eq(siteMetricsDaily.siteId, siteId))
    .limit(1);

  const revenueInCents = Math.round(data.amount * 100); // 转换为 cents

  if (existingMetrics.length > 0) {
    // 更新现有记录
    await db()
      .update(siteMetricsDaily)
      .set({
        revenue: (existingMetrics[0].revenue || 0) + revenueInCents,
      })
      .where(eq(siteMetricsDaily.id, existingMetrics[0].id));
  } else {
    // 创建新记录
    await db()
      .insert(siteMetricsDaily)
      .values({
        id: `metric-${Date.now()}-${siteId}`,
        siteId,
        date: today,
        revenue: revenueInCents,
        visitors: 0,
        uptimePercentage: 100,
        responseTime: 0,
        createdAt: new Date(),
      });
  }

  // 更新站点的最后同步时间
  await db()
    .update(monitoredSites)
    .set({
      lastSyncAt: new Date(),
      lastSyncStatus: 'success',
      updatedAt: new Date(),
    })
    .where(eq(monitoredSites.id, siteId));

  console.log('Creem order processed:', {
    siteId,
    orderId: data.order_id,
    amount: data.amount,
    revenueInCents,
  });
}

// 处理首次支付成功（从 /api/payment/notify/creem 复制）
async function handleCheckoutSuccess(paymentEvent: any) {
  const session = paymentEvent.paymentSession;
  const metadata = session.metadata || {};
  let userId = metadata.userId || metadata.user_id;
  let orderId = metadata.orderId || metadata.order_no;
  const userEmail = metadata.userEmail || session.paymentInfo?.paymentEmail;

  console.log('💰 [CheckoutSuccess] Processing checkout success:', {
    userId,
    orderId,
    userEmail,
    hasSubscriptionInfo: !!session.subscriptionInfo,
    amount: session.paymentInfo?.amount,
    currency: session.paymentInfo?.currency,
    metadata: metadata,
  });

  // 如果没有 userId 但有邮箱，尝试通过邮箱查找用户
  if (!userId && userEmail) {
    console.log('🔍 [CheckoutSuccess] No userId in metadata, searching by email:', userEmail);
    try {
      const users = await db().select()
        .from(user)
        .where(eq(user.email, userEmail))
        .limit(1);
      
      if (users.length > 0) {
        userId = users[0].id;
        console.log('�?[CheckoutSuccess] Found user by email:', { userId, email: userEmail });
      } else {
        console.warn('⚠️ [CheckoutSuccess] User not found by email, will create new user');
        // 创建新用户
        const newUserId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const newUser = await db().insert(user).values({
          id: newUserId,
          email: userEmail,
          name: session.paymentInfo?.paymentUserName || userEmail.split('@')[0],
          emailVerified: false,
          planType: 'free',
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();
        
        userId = newUser[0].id;
        console.log('�?[CheckoutSuccess] Created new user:', { userId, email: userEmail });
      }
    } catch (error: any) {
      console.error('�?[CheckoutSuccess] Error finding/creating user:', error);
    }
  }

  // 如果没有 orderId，尝试通过其他信息查找订单
  if (!orderId && session.paymentInfo?.transactionId) {
    console.log('🔍 [CheckoutSuccess] No orderId in metadata, searching by transactionId');
    try {
      const orders = await db().select()
        .from(order)
        .where(eq(order.paymentSessionId, session.paymentInfo.transactionId))
        .limit(1);
      
      if (orders.length > 0) {
        orderId = orders[0].id;
        console.log('�?[CheckoutSuccess] Found order by transactionId:', orderId);
      }
    } catch (error: any) {
      console.error('�?[CheckoutSuccess] Error finding order:', error);
    }
  }

  if (!userId) {
    console.error('�?[CheckoutSuccess] Cannot determine userId:', { metadata, userEmail });
    throw new Error('Cannot determine userId from webhook data');
  }

  if (!orderId) {
    console.warn('⚠️ [CheckoutSuccess] No orderId found, will create subscription without order');
  }

  try {
    // 如果有订单ID，更新订单状态
    if (orderId) {
      console.log('📝 [CheckoutSuccess] Updating order status to paid...');
      const updateResult = await db().update(order)
        .set({
          status: 'paid',
          amount: session.paymentInfo.amount,
          currency: session.paymentInfo.currency,
          paymentAmount: session.paymentInfo.paymentAmount,
          paymentCurrency: session.paymentInfo.paymentCurrency,
          paymentEmail: session.paymentInfo.paymentEmail,
          paymentUserName: session.paymentInfo.paymentUserName,
          paymentUserId: session.paymentInfo.paymentUserId,
          transactionId: session.paymentInfo.transactionId,
          paidAt: session.paymentInfo.paidAt,
          paymentResult: JSON.stringify(session.paymentResult),
          subscriptionId: session.subscriptionId,
          updatedAt: new Date(),
        })
        .where(eq(order.id, orderId))
        .returning();

      if (updateResult.length === 0) {
        console.warn('⚠️ [CheckoutSuccess] Order not found, continuing without order update');
      } else {
        console.log('�?[CheckoutSuccess] Order updated to paid:', {
          orderId,
          orderNo: updateResult[0].orderNo,
          amount: updateResult[0].amount,
        });
      }
    }

    // 如果有订阅信息，创建订阅记录
    if (session.subscriptionInfo) {
      const subInfo = session.subscriptionInfo;
      const subscriptionNo = `SUB-${Date.now()}-${orderId ? orderId.substring(0, 8) : 'webhook'}`;
      const planType = determinePlanType(subInfo.amount);

      console.log('📋 [CheckoutSuccess] Creating subscription:', {
        subscriptionId: session.subscriptionId,
        subscriptionNo,
        amount: subInfo.amount,
        planType,
        status: subInfo.status,
        interval: subInfo.interval,
        currentPeriodStart: subInfo.currentPeriodStart,
        currentPeriodEnd: subInfo.currentPeriodEnd,
      });

      try {
        const insertResult = await db().insert(subscription).values({
          id: session.subscriptionId,
          subscriptionNo,
          userId,
          userEmail: session.paymentInfo.paymentEmail,
          status: subInfo.status,
          paymentProvider: 'creem',
          paymentUserId: session.paymentInfo.paymentUserId,
          subscriptionId: session.subscriptionId,
          subscriptionResult: JSON.stringify(session.subscriptionResult),
          productId: subInfo.productId || 'unknown',
          description: subInfo.description || 'Subscription',
          amount: subInfo.amount,
          currency: subInfo.currency,
          interval: subInfo.interval,
          intervalCount: subInfo.intervalCount || 1,
          currentPeriodStart: subInfo.currentPeriodStart,
          currentPeriodEnd: subInfo.currentPeriodEnd,
          planType: planType,
          planName: planType === 'base' ? 'Base Plan' : planType === 'pro' ? 'Pro Plan' : 'Free Plan',
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();

        console.log('�?[CheckoutSuccess] Subscription created successfully:', {
          subscriptionId: insertResult[0].subscriptionId,
          subscriptionNo: insertResult[0].subscriptionNo,
          planType: insertResult[0].planType,
        });

        // 更新用户的计划类型
        console.log('👤 [CheckoutSuccess] Upgrading user plan...');
        const userUpdateResult = await db().update(user)
          .set({
            planType: planType,
            updatedAt: new Date(),
          })
          .where(eq(user.id, userId))
          .returning();

        console.log('�?[CheckoutSuccess] User upgraded successfully:', {
          userId,
          planType,
          userName: userUpdateResult[0]?.name,
        });

        return {
          success: true,
          orderId,
          subscriptionId: session.subscriptionId,
          planType,
        };

      } catch (subError: any) {
        console.error('�?[CheckoutSuccess] Failed to create subscription:', {
          error: subError.message,
          code: subError.code,
          detail: subError.detail,
          subscriptionId: session.subscriptionId,
        });
        
        // 如果是重复键错误，可能订阅已存在
        if (subError.code === '23505') {
          console.warn('⚠️ [CheckoutSuccess] Subscription already exists, updating instead...');
          await db().update(subscription)
            .set({
              status: subInfo.status,
              currentPeriodStart: subInfo.currentPeriodStart,
              currentPeriodEnd: subInfo.currentPeriodEnd,
              updatedAt: new Date(),
            })
            .where(eq(subscription.subscriptionId, session.subscriptionId));
          
          return {
            success: true,
            orderId,
            subscriptionId: session.subscriptionId,
            note: 'Subscription already existed, updated',
          };
        }
        
        throw subError;
      }
    } else {
      console.warn('⚠️ [CheckoutSuccess] No subscription info in payment session');
      return {
        success: true,
        orderId,
        note: 'No subscription info',
      };
    }
  } catch (error: any) {
    console.error('�?[CheckoutSuccess] Error processing checkout:', {
      error: error.message,
      stack: error.stack,
      userId,
      orderId,
    });
    throw error;
  }
}

// 处理订阅续费成功
async function handlePaymentSuccess(paymentEvent: any) {
  const session = paymentEvent.paymentSession;
  const subInfo = session.subscriptionInfo;

  if (!subInfo) return;

  await db().update(subscription)
    .set({
      status: subInfo.status,
      currentPeriodStart: subInfo.currentPeriodStart,
      currentPeriodEnd: subInfo.currentPeriodEnd,
      updatedAt: new Date(),
    })
    .where(eq(subscription.subscriptionId, session.subscriptionId));

  console.log('Subscription renewed:', session.subscriptionId);
}

// 处理订阅更新
async function handleSubscriptionUpdated(paymentEvent: any) {
  const session = paymentEvent.paymentSession;
  const subInfo = session.subscriptionInfo;

  if (!subInfo) return;

  await db().update(subscription)
    .set({
      status: subInfo.status,
      currentPeriodStart: subInfo.currentPeriodStart,
      currentPeriodEnd: subInfo.currentPeriodEnd,
      updatedAt: new Date(),
    })
    .where(eq(subscription.subscriptionId, session.subscriptionId));

  console.log('Subscription updated:', session.subscriptionId);
}

// 处理订阅取消
async function handleSubscriptionCanceled(paymentEvent: any) {
  const session = paymentEvent.paymentSession;
  const subInfo = session.subscriptionInfo;

  if (!subInfo) return;

  await db().update(subscription)
    .set({
      status: 'canceled',
      canceledAt: subInfo.canceledAt,
      updatedAt: new Date(),
    })
    .where(eq(subscription.subscriptionId, session.subscriptionId));

  const subs = await db().select()
    .from(subscription)
    .where(eq(subscription.subscriptionId, session.subscriptionId))
    .limit(1);

  if (subs.length > 0) {
    const sub = subs[0];
    await db().update(user)
      .set({
        planType: 'free',
        updatedAt: new Date(),
      })
      .where(eq(user.id, sub.userId));

    console.log('Subscription canceled and user downgraded:', {
      userId: sub.userId,
      subscriptionId: session.subscriptionId,
    });
  }
}

// 根据金额判断计划类型
function determinePlanType(amount: number): string {
  if (amount === 0) return 'free';
  if (amount <= 2000) return 'base'; // <= $20
  return 'pro'; // > $20
}

/**
 * GET 方法用于测试 Webhook 是否正常工作
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Creem monitoring webhook endpoint is active',
    endpoint: '/api/webhooks/creem',
    methods: ['POST'],
    requiredHeaders: ['x-creem-signature'],
  });
}








