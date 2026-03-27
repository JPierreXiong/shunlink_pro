#!/usr/bin/env node

/**
 * Database Verification Script
 * 验证数据库连接、表结构和数据完整性
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '@/config/db/schema';

async function verifyDatabase() {
  console.log('🔍 开始数据库验证...\n');

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

    // 2. 检查表
    console.log('2️⃣  检查数据库表...');
    const tables = [
      { name: 'user', schema: schema.user },
      { name: 'order', schema: schema.order },
      { name: 'subscription', schema: schema.subscription },
      { name: 'credit', schema: schema.credit },
      { name: 'account', schema: schema.account },
      { name: 'session', schema: schema.session },
    ];

    for (const table of tables) {
      try {
        const result = await sql(`SELECT COUNT(*) as count FROM "${table.name}"`);
        console.log(`  ✅ ${table.name}: ${result[0]?.count || 0} 条记录`);
      } catch (error: any) {
        console.log(`  ❌ ${table.name}: 表不存在或无法访问`);
      }
    }
    console.log();

    // 3. 检查用户数据
    console.log('3️⃣  检查用户数据...');
    try {
      const users = await sql('SELECT id, email, name, created_at FROM "user" LIMIT 5');
      if (users.length > 0) {
        console.log(`  ✅ 找到 ${users.length} 个用户`);
        users.forEach((user: any, idx: number) => {
          console.log(`     ${idx + 1}. ${user.email} (${user.name || 'N/A'})`);
        });
      } else {
        console.log('  ⚠️  没有用户数据');
      }
    } catch (error) {
      console.log('  ❌ 无法查询用户数据');
    }
    console.log();

    // 4. 检查订单数据
    console.log('4️⃣  检查订单数据...');
    try {
      const orders = await sql(
        'SELECT id, user_id, amount, currency, status, payment_provider, created_at FROM "order" ORDER BY created_at DESC LIMIT 5'
      );
      if (orders.length > 0) {
        console.log(`  ✅ 找到 ${orders.length} 个订单`);
        orders.forEach((order: any, idx: number) => {
          console.log(
            `     ${idx + 1}. ${order.amount} ${order.currency} - ${order.status} (${order.payment_provider})`
          );
        });
      } else {
        console.log('  ⚠️  没有订单数据');
      }
    } catch (error) {
      console.log('  ❌ 无法查询订单数据');
    }
    console.log();

    // 5. 检查订阅数据
    console.log('5️⃣  检查订阅数据...');
    try {
      const subscriptions = await sql(
        'SELECT id, user_id, status, plan_name, current_period_start, current_period_end FROM subscription WHERE status = \'active\' LIMIT 5'
      );
      if (subscriptions.length > 0) {
        console.log(`  ✅ 找到 ${subscriptions.length} 个活跃订阅`);
        subscriptions.forEach((sub: any, idx: number) => {
          console.log(`     ${idx + 1}. ${sub.plan_name} - ${sub.status}`);
        });
      } else {
        console.log('  ⚠️  没有活跃订阅');
      }
    } catch (error) {
      console.log('  ❌ 无法查询订阅数据');
    }
    console.log();

    // 6. 检查积分数据
    console.log('6️⃣  检查用户积分...');
    try {
      const credits = await sql(
        'SELECT user_id, SUM(amount) as total_credits FROM credit GROUP BY user_id LIMIT 5'
      );
      if (credits.length > 0) {
        console.log(`  ✅ 找到 ${credits.length} 个用户有积分`);
        credits.forEach((credit: any, idx: number) => {
          console.log(`     ${idx + 1}. 用户 ${credit.user_id}: ${credit.total_credits} 积分`);
        });
      } else {
        console.log('  ⚠️  没有积分数据');
      }
    } catch (error) {
      console.log('  ❌ 无法查询积分数据');
    }
    console.log();

    // 7. 数据库统计
    console.log('7️⃣  数据库统计...');
    try {
      const stats = await Promise.all([
        sql('SELECT COUNT(*) as count FROM "user"'),
        sql('SELECT COUNT(*) as count FROM "order"'),
        sql('SELECT COUNT(*) as count FROM subscription'),
        sql('SELECT COUNT(*) as count FROM credit'),
      ]);

      console.log(`  📊 用户总数: ${stats[0][0]?.count || 0}`);
      console.log(`  📊 订单总数: ${stats[1][0]?.count || 0}`);
      console.log(`  📊 订阅总数: ${stats[2][0]?.count || 0}`);
      console.log(`  📊 积分记录: ${stats[3][0]?.count || 0}`);
    } catch (error) {
      console.log('  ❌ 无法获取统计数据');
    }
    console.log();

    console.log('✨ 数据库验证完成！\n');
  } catch (error: any) {
    console.error('❌ 数据库验证失败:', error.message);
    process.exit(1);
  }
}

verifyDatabase();
















