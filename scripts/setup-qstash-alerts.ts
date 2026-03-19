/**
 * Setup QStash Schedules for Alert System
 * 
 * 使用 Upstash QStash 创建定时任务
 * 
 * 运行方式:
 * pnpm tsx scripts/setup-qstash-alerts.ts
 */

import { Client } from '@upstash/qstash';

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';
const CRON_SECRET = process.env.CRON_SECRET;

if (!QSTASH_TOKEN) {
  console.error('❌ QSTASH_TOKEN is not set');
  process.exit(1);
}

if (!CRON_SECRET) {
  console.error('❌ CRON_SECRET is not set');
  process.exit(1);
}

const client = new Client({
  token: QSTASH_TOKEN,
});

async function setupAlertSchedules() {
  console.log('🚀 Setting up QStash schedules for alert system...');
  console.log(`📍 Target URL: ${APP_URL}`);

  try {
    // 1. 高优先级：宕机检测（每 5 分钟）
    console.log('\n📋 Creating schedule: Offline Detection (every 5 minutes)');
    const offlineSchedule = await client.schedules.create({
      destination: `${APP_URL}/api/cron/check-alerts?type=offline`,
      cron: '*/5 * * * *', // 每 5 分钟
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
    });
    console.log(`✅ Offline detection schedule created: ${offlineSchedule.scheduleId}`);

    // 2. 中优先级：收入/流量检测（每 30 分钟）
    console.log('\n📋 Creating schedule: Revenue & Traffic Detection (every 30 minutes)');
    const revenueTrafficSchedule = await client.schedules.create({
      destination: `${APP_URL}/api/cron/check-alerts?type=revenue_drop,traffic_spike`,
      cron: '*/30 * * * *', // 每 30 分钟
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
    });
    console.log(`✅ Revenue/Traffic schedule created: ${revenueTrafficSchedule.scheduleId}`);

    // 3. 低优先级：无销售检测（每天早上 9 点）
    console.log('\n📋 Creating schedule: No Sales Detection (daily at 9 AM)');
    const noSalesSchedule = await client.schedules.create({
      destination: `${APP_URL}/api/cron/check-alerts?type=no_sales`,
      cron: '0 9 * * *', // 每天早上 9 点
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
    });
    console.log(`✅ No sales schedule created: ${noSalesSchedule.scheduleId}`);

    console.log('\n✅ All QStash schedules created successfully!');
    console.log('\n📊 Summary:');
    console.log('  - Offline Detection: Every 5 minutes (288 times/day)');
    console.log('  - Revenue/Traffic: Every 30 minutes (48 times/day)');
    console.log('  - No Sales: Daily at 9 AM (1 time/day)');
    console.log('  - Total: ~337 calls/day = ~10,110 calls/month');
    console.log('  - Estimated cost: ~$5/month');

    console.log('\n🔍 View schedules at: https://console.upstash.com/qstash');
  } catch (error) {
    console.error('❌ Failed to create schedules:', error);
    process.exit(1);
  }
}

// 列出现有的调度任务
async function listSchedules() {
  console.log('\n📋 Listing existing schedules...');
  try {
    const schedules = await client.schedules.list();
    if (schedules.length === 0) {
      console.log('  No schedules found');
    } else {
      schedules.forEach((schedule: any) => {
        console.log(`  - ${schedule.scheduleId}: ${schedule.destination}`);
        console.log(`    Cron: ${schedule.cron}`);
      });
    }
  } catch (error) {
    console.error('❌ Failed to list schedules:', error);
  }
}

// 删除所有调度任务（清理用）
async function deleteAllSchedules() {
  console.log('\n🗑️  Deleting all existing schedules...');
  try {
    const schedules = await client.schedules.list();
    for (const schedule of schedules) {
      await client.schedules.delete(schedule.scheduleId);
      console.log(`  ✅ Deleted: ${schedule.scheduleId}`);
    }
    console.log('✅ All schedules deleted');
  } catch (error) {
    console.error('❌ Failed to delete schedules:', error);
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'list':
      await listSchedules();
      break;
    
    case 'delete':
      await deleteAllSchedules();
      break;
    
    case 'reset':
      await deleteAllSchedules();
      await setupAlertSchedules();
      break;
    
    default:
      await setupAlertSchedules();
      break;
  }
}

main();



