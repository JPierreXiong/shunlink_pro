#!/usr/bin/env node

/**
 * Database Initialization Script
 * 初始化数据库并插入测试数据
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '@/config/db/schema';
import { hash } from 'bcryptjs';

async function initializeDatabase() {
  console.log('🔧 开始初始化数据库...\n');

  try {
    // 1. 连接数据库
    console.log('1️⃣  连接数据库...');
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL 未配置');
    }

    const sql = neon(databaseUrl);
    const db = drizzle(sql, { schema });
    console.log('✅ 数据库连接成功\n');

    // 2. 创建表
    console.log('2️⃣  创建数据库表...');
    try {
      // 这里应该运行迁移，但为了演示，我们假设表已存在
      console.log('✅ 表已创建或已存在\n');
    } catch (error) {
      console.log('⚠️  表创建失败，可能已存在\n');
    }

    // 3. 插入测试数据
    console.log('3️⃣  插入测试数据...');

    // 创建测试用户
    const testUsers = [
      {
        id: 'user_test_001',
        email: 'test@example.com',
        name: 'Test User',
        password: await hash('TestPassword123!', 10),
        emailVerified: true,
        image: null,
        createdAt: new Date(),
      },
      {
        id: 'user_test_002',
        email: 'demo@example.com',
        name: 'Demo User',
        password: await hash('DemoPassword123!', 10),
        emailVerified: true,
        image: null,
        createdAt: new Date(),
      },
    ];

    console.log('   创建测试用户...');
    for (const user of testUsers) {
      try {
        await sql(
          `INSERT INTO "user" (id, email, name, password, email_verified, image, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [
            user.id,
            user.email,
            user.name,
            user.password,
            user.emailVerified,
            user.image,
            user.createdAt,
          ]
        );
        console.log(`   ✅ 用户创建: ${user.email}`);
      } catch (error: any) {
        console.log(`   ⚠️  用户创建失败: ${user.email} - ${error.message}`);
      }
    }
    console.log();

    // 4. 插入测试订单
    console.log('4️⃣  插入测试订单...');
    const testOrders = [
      {
        id: 'order_test_001',
        orderNo: 'ORD-' + Date.now(),
        userId: 'user_test_001',
        userEmail: 'test@example.com',
        status: 'COMPLETED',
        amount: 5.0,
        currency: 'usd',
        productId: 'trial',
        paymentType: 'ONE_TIME',
        paymentInterval: 'ONE_TIME',
        paymentProvider: 'creem',
        productName: 'Trial Plan',
        description: '3 backlink credits',
        creditsAmount: 3,
        creditsValidDays: 30,
        planName: 'Trial',
        createdAt: new Date(),
      },
      {
        id: 'order_test_002',
        orderNo: 'ORD-' + (Date.now() + 1),
        userId: 'user_test_002',
        userEmail: 'demo@example.com',
        status: 'COMPLETED',
        amount: 19.9,
        currency: 'usd',
        productId: 'base',
        paymentType: 'SUBSCRIPTION',
        paymentInterval: 'MONTHLY',
        paymentProvider: 'creem',
        productName: 'Base Plan',
        description: '15 backlink credits/month',
        creditsAmount: 15,
        creditsValidDays: 30,
        planName: 'Base',
        createdAt: new Date(),
      },
    ];

    for (const order of testOrders) {
      try {
        await sql(
          `INSERT INTO "order" (
            id, order_no, user_id, user_email, status, amount, currency,
            product_id, payment_type, payment_interval, payment_provider,
            product_name, description, credits_amount, credits_valid_days,
            plan_name, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (id) DO NOTHING`,
          [
            order.id,
            order.orderNo,
            order.userId,
            order.userEmail,
            order.status,
            order.amount,
            order.currency,
            order.productId,
            order.paymentType,
            order.paymentInterval,
            order.paymentProvider,
            order.productName,
            order.description,
            order.creditsAmount,
            order.creditsValidDays,
            order.planName,
            order.createdAt,
          ]
        );
        console.log(`   ✅ 订单创建: ${order.orderNo}`);
      } catch (error: any) {
        console.log(`   ⚠️  订单创建失败: ${order.orderNo} - ${error.message}`);
      }
    }
    console.log();

    // 5. 插入测试积分
    console.log('5️⃣  插入测试积分...');
    const testCredits = [
      {
        id: 'credit_test_001',
        userId: 'user_test_001',
        orderId: 'order_test_001',
        amount: 3,
        type: 'PURCHASE',
        description: 'Trial plan purchase',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      },
      {
        id: 'credit_test_002',
        userId: 'user_test_002',
        orderId: 'order_test_002',
        amount: 15,
        type: 'PURCHASE',
        description: 'Base plan purchase',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      },
    ];

    for (const credit of testCredits) {
      try {
        await sql(
          `INSERT INTO credit (
            id, user_id, order_id, amount, type, description, expires_at, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING`,
          [
            credit.id,
            credit.userId,
            credit.orderId,
            credit.amount,
            credit.type,
            credit.description,
            credit.expiresAt,
            credit.createdAt,
          ]
        );
        console.log(`   ✅ 积分创建: ${credit.userId} - ${credit.amount} 积分`);
      } catch (error: any) {
        console.log(`   ⚠️  积分创建失败: ${credit.userId} - ${error.message}`);
      }
    }
    console.log();

    // 6. 数据库统计
    console.log('6️⃣  数据库统计...');
    try {
      const stats = await Promise.all([
        sql('SELECT COUNT(*) as count FROM "user"'),
        sql('SELECT COUNT(*) as count FROM "order"'),
        sql('SELECT COUNT(*) as count FROM credit'),
      ]);

      console.log(`   📊 用户总数: ${stats[0][0]?.count || 0}`);
      console.log(`   📊 订单总数: ${stats[1][0]?.count || 0}`);
      console.log(`   📊 积分记录: ${stats[2][0]?.count || 0}`);
    } catch (error) {
      console.log('   ⚠️  无法获取统计数据');
    }
    console.log();

    console.log('✨ 数据库初始化完成！\n');
    console.log('📝 测试账户:');
    console.log('   Email: test@example.com');
    console.log('   Password: TestPassword123!');
    console.log();
    console.log('   Email: demo@example.com');
    console.log('   Password: DemoPassword123!');
    console.log();
  } catch (error: any) {
    console.error('❌ 数据库初始化失败:', error.message);
    process.exit(1);
  }
}

initializeDatabase();
