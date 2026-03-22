#!/usr/bin/env node
require('dotenv').config({path:'.env.local'});
const { Pool } = require('pg');
const fetch = require('node-fetch');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const APP_URL = 'https://linkflowai.vercel.app';

async function testDatabaseConnection() {
  console.log('\n========== 🔍 第 1 步：测试数据库连接 ==========');
  try {
    const res = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`);
    console.log('✅ 数据库连接成功');
    console.log('📊 现有表:', res.rows.map(r => r.table_name).join(', '));
    return true;
  } catch(e) {
    console.log('❌ 数据库错误:', e.message);
    return false;
  }
}

async function testSignUp() {
  console.log('\n========== 📝 第 2 步：测试新用户注册 ==========');
  try {
    const email = `test-${Date.now()}@example.com`;
    const password = 'TestPassword123!';
    
    console.log(`📧 注册邮箱: ${email}`);
    console.log(`🔐 密码: ${password}`);
    
    const response = await fetch(`${APP_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: 'Test User' })
    });
    
    console.log(`📡 响应状态: ${response.status}`);
    const data = await response.json();
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ 注册成功');
      console.log('📋 响应:', JSON.stringify(data, null, 2));
      return { email, password, userId: data.user?.id };
    } else {
      console.log('❌ 注册失败');
      console.log('📋 错误:', JSON.stringify(data, null, 2));
      return null;
    }
  } catch(e) {
    console.log('❌ 注册异常:', e.message);
    return null;
  }
}

async function testSignIn(email, password) {
  console.log('\n========== 🔑 第 3 步：测试用户登录 ==========');
  try {
    console.log(`📧 登录邮箱: ${email}`);
    
    const response = await fetch(`${APP_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    console.log(`📡 响应状态: ${response.status}`);
    const data = await response.json();
    
    if (response.status === 200) {
      console.log('✅ 登录成功');
      console.log('📋 响应:', JSON.stringify(data, null, 2));
      return data.token || data.session;
    } else {
      console.log('❌ 登录失败');
      console.log('📋 错误:', JSON.stringify(data, null, 2));
      return null;
    }
  } catch(e) {
    console.log('❌ 登录异常:', e.message);
    return null;
  }
}

async function testPayment() {
  console.log('\n========== 💳 第 4 步：测试支付流程 ==========');
  try {
    console.log('🛒 创建支付订单...');
    
    const response = await fetch(`${APP_URL}/api/payment/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        productId: 'shunlink-starter_usd',
        amount: 9.99,
        currency: 'USD'
      })
    });
    
    console.log(`📡 响应状态: ${response.status}`);
    const data = await response.json();
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ 支付订单创建成功');
      console.log('📋 响应:', JSON.stringify(data, null, 2));
      return true;
    } else {
      console.log('❌ 支付订单创建失败');
      console.log('📋 错误:', JSON.stringify(data, null, 2));
      return false;
    }
  } catch(e) {
    console.log('❌ 支付异常:', e.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 开始完整端测流程...');
  console.log(`🌐 应用地址: ${APP_URL}`);
  
  const dbOk = await testDatabaseConnection();
  if (!dbOk) {
    console.log('\n❌ 数据库连接失败，停止测试');
    await pool.end();
    process.exit(1);
  }
  
  const signUpResult = await testSignUp();
  if (!signUpResult) {
    console.log('\n❌ 注册失败，停止测试');
    await pool.end();
    process.exit(1);
  }
  
  const signInResult = await testSignIn(signUpResult.email, signUpResult.password);
  if (!signInResult) {
    console.log('\n⚠️  登录失败，继续测试支付...');
  }
  
  const paymentResult = await testPayment();
  
  console.log('\n========== 📊 测试总结 ==========');
  console.log(`✅ 数据库连接: 成功`);
  console.log(`✅ 用户注册: ${signUpResult ? '成功' : '失败'}`);
  console.log(`${signInResult ? '✅' : '❌'} 用户登录: ${signInResult ? '成功' : '失败'}`);
  console.log(`${paymentResult ? '✅' : '❌'} 支付流程: ${paymentResult ? '成功' : '失败'}`);
  
  await pool.end();
  process.exit(0);
}

runAllTests().catch(e => {
  console.error('❌ 测试异常:', e);
  pool.end();
  process.exit(1);
});

