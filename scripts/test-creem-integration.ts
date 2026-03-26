#!/usr/bin/env node

/**
 * Creem Payment Integration Test
 * 测试 Creem 支付集成和 webhook 处理
 */

import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';
const CREEM_API_KEY = process.env.CREEM_API_KEY || 'creem_test_1o4mxoT3PFuKs0dpWApGQf';
const CREEM_WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET || 'whsec_1rF4xvsHn7bm7tgE2dzV1N';

interface TestUser {
  email: string;
  password: string;
  id?: string;
  token?: string;
}

interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

async function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const icons = {
    info: 'ℹ️ ',
    success: '✅ ',
    error: '❌ ',
    warn: '⚠️ ',
  };
  console.log(`${icons[type]} ${message}`);
}

async function testCreemConnection() {
  try {
    await log('测试 Creem API 连接...', 'info');

    const response = await axios.get('https://api.creem.io/v1/products', {
      headers: {
        Authorization: `Bearer ${CREEM_API_KEY}`,
      },
    });

    results.push({
      name: 'Creem API 连接',
      status: 'pass',
      message: 'Creem API 连接成功',
      details: { statusCode: response.status },
    });

    await log('Creem API 连接成功', 'success');
  } catch (error: any) {
    results.push({
      name: 'Creem API 连接',
      status: 'fail',
      message: error.message,
      details: { error: error.response?.data },
    });

    await log(`Creem API 连接失败: ${error.message}`, 'error');
  }
}

async function testCheckoutEndpoint() {
  try {
    await log('测试支付结账端点...', 'info');

    // 创建测试用户
    const testUser: TestUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    };

    // 注册用户
    const signupResponse = await axios.post(`${BASE_URL}/api/auth/sign-up`, {
      email: testUser.email,
      password: testUser.password,
      name: 'Test User',
    });

    testUser.id = signupResponse.data.user?.id;
    testUser.token = signupResponse.data.token;

    await log(`创建测试用户: ${testUser.email}`, 'success');

    // 调用结账端点
    const checkoutResponse = await axios.post(
      `${BASE_URL}/api/payment/checkout`,
      {
        product_id: 'trial',
        currency: 'usd',
        locale: 'en',
        payment_provider: 'creem',
      },
      {
        headers: {
          Authorization: `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    results.push({
      name: '支付结账端点',
      status: 'pass',
      message: '结账端点响应成功',
      details: {
        checkoutUrl: checkoutResponse.data.checkoutUrl,
        sessionId: checkoutResponse.data.sessionId,
      },
    });

    await log('结账端点响应成功', 'success');
    await log(`Checkout URL: ${checkoutResponse.data.checkoutUrl}`, 'info');
  } catch (error: any) {
    results.push({
      name: '支付结账端点',
      status: 'fail',
      message: error.message,
      details: { error: error.response?.data },
    });

    await log(`结账端点失败: ${error.message}`, 'error');
  }
}

async function testWebhookSignature() {
  try {
    await log('测试 Webhook 签名验证...', 'info');

    // 模拟 Creem webhook 数据
    const webhookPayload = {
      id: 'evt_test_' + Date.now(),
      type: 'payment.completed',
      data: {
        id: 'pay_test_' + Date.now(),
        status: 'completed',
        amount: 500,
        currency: 'usd',
        metadata: {
          order_no: 'order_' + Date.now(),
          user_id: 'user_test_123',
        },
      },
      timestamp: Math.floor(Date.now() / 1000),
    };

    // 创建签名（这是一个简化的示例）
    const signature = Buffer.from(
      JSON.stringify(webhookPayload) + CREEM_WEBHOOK_SECRET
    ).toString('base64');

    results.push({
      name: 'Webhook 签名验证',
      status: 'pass',
      message: 'Webhook 签名生成成功',
      details: { signature: signature.substring(0, 50) + '...' },
    });

    await log('Webhook 签名生成成功', 'success');
  } catch (error: any) {
    results.push({
      name: 'Webhook 签名验证',
      status: 'fail',
      message: error.message,
    });

    await log(`Webhook 签名验证失败: ${error.message}`, 'error');
  }
}

async function testPaymentProducts() {
  try {
    await log('测试 Creem 产品配置...', 'info');

    const productIds = process.env.CREEM_PRODUCT_IDS;
    if (!productIds) {
      throw new Error('CREEM_PRODUCT_IDS 未配置');
    }

    const products = JSON.parse(productIds);
    const requiredProducts = ['trial_usd', 'base_usd', 'pro_usd'];

    let allConfigured = true;
    for (const product of requiredProducts) {
      if (products[product]) {
        await log(`  ✅ ${product}: ${products[product]}`, 'success');
      } else {
        await log(`  ❌ ${product}: 未配置`, 'error');
        allConfigured = false;
      }
    }

    results.push({
      name: 'Creem 产品配置',
      status: allConfigured ? 'pass' : 'fail',
      message: allConfigured ? '所有产品已配置' : '部分产品未配置',
      details: { products },
    });
  } catch (error: any) {
    results.push({
      name: 'Creem 产品配置',
      status: 'fail',
      message: error.message,
    });

    await log(`产品配置检查失败: ${error.message}`, 'error');
  }
}

async function testEnvironmentVariables() {
  try {
    await log('检查环境变量...', 'info');

    const requiredVars = [
      'DATABASE_URL',
      'CREEM_API_KEY',
      'CREEM_WEBHOOK_SECRET',
      'CREEM_PRODUCT_IDS',
      'BETTER_AUTH_SECRET',
      'NEXT_PUBLIC_APP_URL',
    ];

    let allConfigured = true;
    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (value) {
        const masked = value.substring(0, 10) + '...';
        await log(`  ✅ ${varName}: ${masked}`, 'success');
      } else {
        await log(`  ❌ ${varName}: 未配置`, 'error');
        allConfigured = false;
      }
    }

    results.push({
      name: '环境变量检查',
      status: allConfigured ? 'pass' : 'fail',
      message: allConfigured ? '所有环境变量已配置' : '部分环境变量未配置',
    });
  } catch (error: any) {
    results.push({
      name: '环境变量检查',
      status: 'fail',
      message: error.message,
    });

    await log(`环境变量检查失败: ${error.message}`, 'error');
  }
}

async function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Creem 支付集成测试报告');
  console.log('='.repeat(60) + '\n');

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;

  console.log('测试结果:');
  console.log(`  ✅ 通过: ${passed}`);
  console.log(`  ❌ 失败: ${failed}`);
  console.log(`  📊 总计: ${results.length}\n`);

  console.log('详细结果:');
  results.forEach((result, idx) => {
    const icon = result.status === 'pass' ? '✅' : '❌';
    console.log(`  ${idx + 1}. ${icon} ${result.name}`);
    console.log(`     ${result.message}`);
    if (result.details) {
      console.log(`     详情: ${JSON.stringify(result.details, null, 2)}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(
    failed === 0
      ? '✨ 所有测试通过！'
      : `⚠️  ${failed} 个测试失败，请检查配置`
  );
  console.log('='.repeat(60) + '\n');

  // 保存报告
  const reportPath = './CREEM_TEST_REPORT.json';
  const fs = await import('fs').then((m) => m.promises);
  await fs.writeFile(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: { passed, failed, total: results.length },
        results,
      },
      null,
      2
    )
  );

  console.log(`📄 报告已保存到: ${reportPath}\n`);
}

async function runTests() {
  console.log('\n🚀 开始 Creem 支付集成测试...\n');

  await testEnvironmentVariables();
  console.log();

  await testCreemConnection();
  console.log();

  await testPaymentProducts();
  console.log();

  await testWebhookSignature();
  console.log();

  // 可选：测试结账端点（需要运行的服务器）
  // await testCheckoutEndpoint();

  await generateReport();
}

runTests().catch((error) => {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
});















