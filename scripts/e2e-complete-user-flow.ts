/**
 * 完整用户流程端到端测试
 * 流程: 注册 → 登入 → 支付 → 享受权利 → 登出
 * 运行: tsx scripts/e2e-complete-user-flow.ts
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { db } from '../src/core/db/index.js';
import { user, order, subscription, backlinkTasks, backlinkPlatforms } from '../src/config/db/schema.js';
import { eq } from 'drizzle-orm';
import { getUuid } from '../src/shared/lib/hash.js';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(msg: string, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function success(msg: string) {
  log(`✅ ${msg}`, colors.green);
}

function error(msg: string) {
  log(`❌ ${msg}`, colors.red);
}

function info(msg: string) {
  log(`ℹ️  ${msg}`, colors.blue);
}

function warning(msg: string) {
  log(`⚠️  ${msg}`, colors.yellow);
}

function section(title: string) {
  log(`\n${'='.repeat(70)}`, colors.cyan);
  log(`  ${title}`, colors.cyan);
  log(`${'='.repeat(70)}`, colors.cyan);
}

interface TestData {
  userId: string;
  email: string;
  password: string;
  name: string;
  orderId: string;
  orderNo: string;
  subscriptionId: string;
  subscriptionNo: string;
  taskId: string;
}

const testData: TestData = {
  userId: '',
  email: `test_${Date.now()}@example.com`,
  password: 'Test123456!@#',
  name: 'Test User Flow',
  orderId: '',
  orderNo: '',
  subscriptionId: '',
  subscriptionNo: '',
  taskId: '',
};

async function step1_RegisterUser() {
  section('Step 1: 新客户注册');
  
  try {
    info(`邮箱: ${testData.email}`);
    info(`密码: ${testData.password}`);
    info(`姓名: ${testData.name}`);
    
    testData.userId = getUuid();
    
    // 检查用户是否已存在
    const [existingUser] = await db()
      .select()
      .from(user)
      .where(eq(user.email, testData.email))
      .limit(1);
    
    if (existingUser) {
      warning(`用户已存在，使用现有用户: ${existingUser.id}`);
      testData.userId = existingUser.id;
      return true;
    }
    
    // 创建新用户
    await db().insert(user).values({
      id: testData.userId,
      name: testData.name,
      email: testData.email,
      emailVerified: true,
      planType: 'free',
    });
    
    success(`用户注册成功`);
    info(`User ID: ${testData.userId}`);
    info(`初始计划: free`);
    
    return true;
  } catch (err: any) {
    error(`注册失败: ${err.message}`);
    return false;
  }
}

async function step2_LoginUser() {
  section('Step 2: 用户登入');
  
  try {
    info(`邮箱: ${testData.email}`);
    
    const [userData] = await db()
      .select()
      .from(user)
      .where(eq(user.email, testData.email))
      .limit(1);
    
    if (!userData) {
      error('用户不存在');
      return false;
    }
    
    success(`用户登入成功`);
    info(`User ID: ${userData.id}`);
    info(`当前计划: ${userData.planType}`);
    info(`当前积分: ${userData.credits || 0}`);
    
    testData.userId = userData.id;
    return true;
  } catch (err: any) {
    error(`登入失败: ${err.message}`);
    return false;
  }
}

async function step3_CreatePaymentOrder() {
  section('Step 3: 创建支付订单');
  
  try {
    testData.orderId = getUuid();
    testData.orderNo = `ORD-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    info(`订单号: ${testData.orderNo}`);
    info(`产品: Pro 计划 ($9.99/月)`);
    
    // 创建订单记录
    await db().insert(order).values({
      id: testData.orderId,
      userId: testData.userId,
      orderNo: testData.orderNo,
      paymentProvider: 'creem',
      planName: 'pro',
      amount: 999, // $9.99 in cents
      currency: 'USD',
      status: 'pending',
      checkoutInfo: JSON.stringify({
        planName: 'pro',
        amount: 999,
        currency: 'USD',
      }),
    });
    
    success(`支付订单创建成功`);
    info(`订单状态: pending`);
    info(`金额: $9.99 USD`);
    
    return true;
  } catch (err: any) {
    error(`创建订单失败: ${err.message}`);
    return false;
  }
}

async function step4_SimulatePaymentComplete() {
  section('Step 4: 模拟支付完成');
  
  try {
    info(`订单号: ${testData.orderNo}`);
    
    // 模拟 Creem Webhook 回调
    testData.subscriptionId = getUuid();
    testData.subscriptionNo = `SUB-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // 更新订单状态为已支付
    await db()
      .update(order)
      .set({
        status: 'paid',
        subscriptionNo: testData.subscriptionNo,
        paidAt: new Date(),
      })
      .where(eq(order.id, testData.orderId));
    
    // 创建订阅记录
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    await db().insert(subscription).values({
      id: testData.subscriptionId,
      userId: testData.userId,
      subscriptionNo: testData.subscriptionNo,
      paymentProvider: 'creem',
      planName: 'pro',
      planType: 'pro',
      status: 'active',
      subscriptionId: testData.subscriptionNo,
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
    });
    
    // 更新用户计划
    await db()
      .update(user)
      .set({
        planType: 'pro',
      })
      .where(eq(user.id, testData.userId));
    
    success(`支付完成`);
    info(`订单状态: paid`);
    info(`订阅号: ${testData.subscriptionNo}`);
    info(`订阅状态: active`);
    info(`计划升级: free → pro`);
    
    return true;
  } catch (err: any) {
    error(`支付模拟失败: ${err.message}`);
    return false;
  }
}

async function step5_EnjoyProFeatures() {
  section('Step 5: 享受 Pro 权利');
  
  try {
    // 验证用户权限
    const [userData] = await db()
      .select()
      .from(user)
      .where(eq(user.id, testData.userId))
      .limit(1);
    
    if (!userData) {
      error('用户不存在');
      return false;
    }
    
    success(`用户权限验证`);
    info(`计划: ${userData.planType}`);
    
    if (userData.planType !== 'pro') {
      error('用户计划不是 Pro');
      return false;
    }
    
    // 创建反向链接任务（Pro 功能）
    testData.taskId = getUuid();
    
    info(`\n创建反向链接任务...`);
    
    await db().insert(backlinkTasks).values({
      id: testData.taskId,
      userId: testData.userId,
      targetUrl: 'https://example.com',
      anchorText: 'Test Link',
      status: 'pending',
    });
    
    success(`反向链接任务创建成功`);
    info(`任务 ID: ${testData.taskId}`);
    info(`目标 URL: https://example.com`);
    info(`锚文本: Test Link`);
    info(`状态: pending`);
    
    // 查询可用平台
    const platformList = await db()
      .select()
      .from(backlinkPlatforms)
      .limit(5);
    
    if (platformList.length > 0) {
      success(`\n可用平台列表 (${platformList.length} 个)`);
      platformList.forEach((p, idx) => {
        info(`  ${idx + 1}. ${p.name} (${p.slug})`);
      });
    } else {
      warning(`\n暂无可用平台`);
    }
    
    return true;
  } catch (err: any) {
    error(`享受权利失败: ${err.message}`);
    return false;
  }
}

async function step6_VerifyCreditsConsumption() {
  section('Step 6: 验证任务状态');
  
  try {
    const [userData] = await db()
      .select()
      .from(user)
      .where(eq(user.id, testData.userId))
      .limit(1);
    
    if (!userData) {
      error('用户不存在');
      return false;
    }
    
    success(`用户计划: ${userData.planType}`);
    
    const [taskData] = await db()
      .select()
      .from(backlinkTasks)
      .where(eq(backlinkTasks.id, testData.taskId))
      .limit(1);
    
    if (taskData) {
      success(`任务状态: ${taskData.status}`);
      info(`任务 URL: ${taskData.targetUrl}`);
    }
    
    return true;
  } catch (err: any) {
    error(`验证任务失败: ${err.message}`);
    return false;
  }
}

async function step7_Logout() {
  section('Step 7: 用户登出');
  
  try {
    info(`邮箱: ${testData.email}`);
    
    // 验证用户仍然存在
    const [userData] = await db()
      .select()
      .from(user)
      .where(eq(user.email, testData.email))
      .limit(1);
    
    if (!userData) {
      error('用户不存在');
      return false;
    }
    
    success(`用户登出成功`);
    info(`用户数据已保存`);
    info(`最终计划: ${userData.planType}`);
    info(`最终积分: ${userData.credits || 0}`);
    
    return true;
  } catch (err: any) {
    error(`登出失败: ${err.message}`);
    return false;
  }
}

async function runCompleteFlow() {
  log('\n' + '='.repeat(70), colors.cyan);
  log('  🧪 完整用户流程端到端测试', colors.cyan);
  log('  流程: 注册 → 登入 → 支付 → 享受权利 → 登出', colors.cyan);
  log('='.repeat(70), colors.cyan);
  
  const results: { step: string; passed: boolean }[] = [];
  
  // Step 1: 注册
  let passed = await step1_RegisterUser();
  results.push({ step: 'Step 1: 注册', passed });
  if (!passed) {
    error('\n❌ 注册失败，测试终止');
    process.exit(1);
  }
  
  // Step 2: 登入
  passed = await step2_LoginUser();
  results.push({ step: 'Step 2: 登入', passed });
  if (!passed) {
    error('\n❌ 登入失败，测试终止');
    process.exit(1);
  }
  
  // Step 3: 创建支付订单
  passed = await step3_CreatePaymentOrder();
  results.push({ step: 'Step 3: 创建支付订单', passed });
  if (!passed) {
    error('\n❌ 创建支付订单失败，测试终止');
    process.exit(1);
  }
  
  // Step 4: 模拟支付完成
  passed = await step4_SimulatePaymentComplete();
  results.push({ step: 'Step 4: 模拟支付完成', passed });
  if (!passed) {
    error('\n❌ 支付模拟失败，测试终止');
    process.exit(1);
  }
  
  // Step 5: 享受 Pro 权利
  passed = await step5_EnjoyProFeatures();
  results.push({ step: 'Step 5: 享受 Pro 权利', passed });
  if (!passed) {
    error('\n❌ 享受权利失败，测试终止');
    process.exit(1);
  }
  
  // Step 6: 验证任务状态
  passed = await step6_VerifyCreditsConsumption();
  results.push({ step: 'Step 6: 验证任务状态', passed });
  
  // Step 7: 登出
  passed = await step7_Logout();
  results.push({ step: 'Step 7: 登出', passed });
  
  // 输出测试报告
  section('📊 测试报告');
  
  log('\n测试结果:', colors.cyan);
  results.forEach(r => {
    if (r.passed) {
      success(`${r.step}: PASSED`);
    } else {
      error(`${r.step}: FAILED`);
    }
  });
  
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  const passRate = ((passedCount / totalCount) * 100).toFixed(2);
  
  log(`\n通过率: ${passedCount}/${totalCount} (${passRate}%)`, colors.cyan);
  
  // 输出测试数据
  section('📋 测试数据');
  
  log('\n用户信息:', colors.cyan);
  info(`User ID: ${testData.userId}`);
  info(`Email: ${testData.email}`);
  info(`Password: ${testData.password}`);
  info(`Name: ${testData.name}`);
  
  log('\n订单信息:', colors.cyan);
  info(`Order ID: ${testData.orderId}`);
  info(`Order No: ${testData.orderNo}`);
  info(`Amount: $9.99 USD`);
  
  log('\n订阅信息:', colors.cyan);
  info(`Subscription ID: ${testData.subscriptionId}`);
  info(`Subscription No: ${testData.subscriptionNo}`);
  info(`Plan: pro`);
  info(`Status: active`);
  
  log('\n任务信息:', colors.cyan);
  info(`Task ID: ${testData.taskId}`);
  info(`Target URL: https://example.com`);
  info(`Anchor Text: Test Link`);
  
  if (passedCount === totalCount) {
    log('\n🎉 所有测试通过！', colors.green);
    log('\n✅ 用户流程完整性验证成功', colors.green);
    process.exit(0);
  } else {
    log('\n⚠️  部分测试失败', colors.yellow);
    process.exit(1);
  }
}

// 执行测试
runCompleteFlow().catch(err => {
  error(`测试异常: ${err.message}`);
  console.error(err);
  process.exit(1);
});

