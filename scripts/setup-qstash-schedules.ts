/**
 * QStash 调度配置脚本
 * 
 * 用于在 Upstash QStash 中创建定时任务
 * 替代 Vercel Cron（免费版每天只能运行1次）
 * 
 * 使用方法:
 * 1. 确保环境变量已配置: QSTASH_TOKEN, QSTASH_CURRENT_SIGNING_KEY, QSTASH_NEXT_SIGNING_KEY
 * 2. 运行: pnpm run qstash:setup
 */

import { Client } from '@upstash/qstash';

// 从环境变量获取配置
const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
const CRON_SECRET = process.env.CRON_SECRET;

if (!QSTASH_TOKEN) {
  console.error('❌ QSTASH_TOKEN not found in environment variables');
  process.exit(1);
}

if (!APP_URL) {
  console.error('❌ APP_URL not found in environment variables');
  process.exit(1);
}

if (!CRON_SECRET) {
  console.error('❌ CRON_SECRET not found in environment variables');
  process.exit(1);
}

const client = new Client({ token: QSTASH_TOKEN });

// 确保 URL 格式正确
const baseUrl = APP_URL.startsWith('http') ? APP_URL : `https://${APP_URL}`;

/**
 * 调度配置
 */
const schedules = [
  {
    name: 'store-metrics-daily',
    destination: `${baseUrl}/api/cron/store-metrics`,
    cron: '0 0 * * *', // 每天凌晨 00:00
    description: '存储付费用户的每日指标数据',
  },
  // 暂时注释掉高频调度任务，避免过高成本
  // {
  //   name: 'check-alerts-offline',
  //   destination: `${baseUrl}/api/cron/check-alerts?type=offline`,
  //   cron: '*/5 * * * *', // 每 5 分钟
  //   description: '检查网站宕机报警',
  // },
  // {
  //   name: 'check-alerts-revenue-traffic',
  //   destination: `${baseUrl}/api/cron/check-alerts?type=revenue_drop,traffic_spike`,
  //   cron: '*/30 * * * *', // 每 30 分钟
  //   description: '检查收入下降和流量激增报警',
  // },
  {
    name: 'check-alerts-no-sales',
    destination: `${baseUrl}/api/cron/check-alerts?type=no_sales`,
    cron: '0 9 * * *', // 每天早上 9:00
    description: '检查无销售报警',
  },
  {
    name: 'sync-sites-free-users',
    destination: `${baseUrl}/api/cron/sync-sites?plan=free`,
    cron: '0 9,21 * * *', // 每天 2 次: 9:00, 21:00
    description: '同步免费用户的站点数据（每天2次）',
  },
  {
    name: 'sync-sites-paid-users',
    destination: `${baseUrl}/api/cron/sync-sites?plan=paid`,
    cron: '0 */3 * * *', // 每 3 小时
    description: '同步付费用户的站点数据（每天8次）',
  },
];

/**
 * 创建或更新调度任务
 */
async function setupSchedules() {
  console.log('🚀 Setting up QStash schedules...\n');
  console.log(`Base URL: ${baseUrl}\n`);

  for (const schedule of schedules) {
    try {
      console.log(`📅 Creating schedule: ${schedule.name}`);
      console.log(`   Destination: ${schedule.destination}`);
      console.log(`   Cron: ${schedule.cron}`);
      console.log(`   Description: ${schedule.description}`);

      const result = await client.schedules.create({
        destination: schedule.destination,
        cron: schedule.cron,
        headers: {
          'Authorization': `Bearer ${CRON_SECRET}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`   ✅ Created with ID: ${result.scheduleId}\n`);
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log(`   ⚠️  Schedule already exists, skipping...\n`);
      } else {
        console.error(`   ❌ Failed to create schedule:`, error.message);
        console.error(`   Details:`, error, '\n');
      }
    }
  }

  console.log('✅ QStash setup completed!\n');
  console.log('📊 Summary:');
  console.log(`   Total schedules: ${schedules.length}`);
  console.log(`   - Daily metrics: 1 schedule (1x/day)`);
  console.log(`   - Alert checks: 1 schedule (no sales: 1x/day)`);
  console.log(`   - Site sync: 2 schedules (free: 2x/day, paid: 8x/day)`);
  console.log('\n⚠️  Note:');
  console.log('   - High-frequency alerts (offline, revenue/traffic) are commented out');
  console.log('   - Uncomment in setup-qstash-schedules.ts if needed');
  console.log('\n💡 Next steps:');
  console.log('   1. Verify schedules in Upstash Console: https://console.upstash.com/qstash');
  console.log('   2. Test endpoints manually to ensure they work');
  console.log('   3. Monitor logs for any errors');
}

/**
 * 列出现有调度任务
 */
async function listSchedules() {
  console.log('📋 Listing existing QStash schedules...\n');

  try {
    const schedules = await client.schedules.list();
    
    if (schedules.length === 0) {
      console.log('   No schedules found.\n');
      return;
    }

    schedules.forEach((schedule: any, index: number) => {
      console.log(`${index + 1}. Schedule ID: ${schedule.scheduleId}`);
      console.log(`   Destination: ${schedule.destination}`);
      console.log(`   Cron: ${schedule.cron}`);
      console.log(`   Created: ${new Date(schedule.createdAt * 1000).toLocaleString()}`);
      console.log('');
    });

    console.log(`Total: ${schedules.length} schedules\n`);
  } catch (error: any) {
    console.error('❌ Failed to list schedules:', error.message);
  }
}

/**
 * 删除所有调度任务
 */
async function deleteAllSchedules() {
  console.log('🗑️  Deleting all QStash schedules...\n');

  try {
    const schedules = await client.schedules.list();
    
    if (schedules.length === 0) {
      console.log('   No schedules to delete.\n');
      return;
    }

    for (const schedule of schedules) {
      try {
        await client.schedules.delete(schedule.scheduleId);
        console.log(`   ✅ Deleted: ${schedule.scheduleId}`);
      } catch (error: any) {
        console.error(`   ❌ Failed to delete ${schedule.scheduleId}:`, error.message);
      }
    }

    console.log(`\n✅ Deleted ${schedules.length} schedules\n`);
  } catch (error: any) {
    console.error('❌ Failed to delete schedules:', error.message);
  }
}

/**
 * 主函数
 */
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'list':
      await listSchedules();
      break;
    
    case 'delete':
      await deleteAllSchedules();
      break;
    
    case 'setup':
    default:
      await setupSchedules();
      break;
  }
}

main().catch(console.error);

