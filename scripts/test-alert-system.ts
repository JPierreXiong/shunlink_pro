/**
 * 测试报警系统
 * 
 * 运行方式:
 * pnpm tsx scripts/test-alert-system.ts
 */

import { nanoid } from 'nanoid';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.error('❌ CRON_SECRET is not set');
  process.exit(1);
}

async function testAlertEndpoint(type?: string) {
  const url = type 
    ? `${APP_URL}/api/cron/check-alerts?type=${type}`
    : `${APP_URL}/api/cron/check-alerts`;
  
  console.log(`\n🧪 Testing: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success:', data);
    } else {
      console.error('❌ Failed:', data);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

async function testCreateAlertRule() {
  console.log('\n🧪 Testing: Create Alert Rule');
  
  try {
    // 首先需要获取一个站点 ID
    const sitesResponse = await fetch(`${APP_URL}/api/soloboard/sites`, {
      headers: {
        'Cookie': 'your-session-cookie', // 需要登录
      },
    });
    
    if (!sitesResponse.ok) {
      console.log('⚠️  Skipping: Need to be logged in to create alert rules');
      return;
    }
    
    const sitesData = await sitesResponse.json();
    if (sitesData.sites.length === 0) {
      console.log('⚠️  Skipping: No sites available');
      return;
    }
    
    const siteId = sitesData.sites[0].id;
    
    // 创建报警规则
    const response = await fetch(`${APP_URL}/api/soloboard/alerts/rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'your-session-cookie',
      },
      body: JSON.stringify({
        siteId,
        type: 'offline',
        threshold: 0,
        frequency: 'immediate',
        channels: ['email'],
      }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Alert rule created:', data);
    } else {
      console.error('❌ Failed to create rule:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function main() {
  console.log('🚀 Testing Alert System');
  console.log(`📍 Target: ${APP_URL}`);
  
  // 测试 1: 检查所有类型
  await testAlertEndpoint();
  
  // 测试 2: 只检查宕机
  await testAlertEndpoint('offline');
  
  // 测试 3: 检查收入和流量
  await testAlertEndpoint('revenue_drop,traffic_spike');
  
  // 测试 4: 检查无销售
  await testAlertEndpoint('no_sales');
  
  // 测试 5: 创建报警规则（需要登录）
  // await testCreateAlertRule();
  
  console.log('\n✅ All tests completed');
}

main();



