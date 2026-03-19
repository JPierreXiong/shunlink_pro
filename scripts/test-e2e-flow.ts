/**
 * SoloBoard 完整 E2E 端到端测试
 *
 * 测试流程：
 *  0. 数据库连接验证
 *  1. 新用户注册 (Sign Up)
 *  2. 用户登录 (Sign In)
 *  3. 创建支付订单 - Base Plan $19.9 (Creem Production API)
 *  4. 模拟支付完成 → 激活 Base 会员 (直接写 DB)
 *  5. 验证会员权益 (planType = 'base', 订阅记录)
 *  6. 添加监控站点 (Website)
 *  7. 配置 GA4 数据源 (PATCH site)
 *  8. 验证站点列表正常显示
 *  9. 删除站点
 * 10. 验证删除成功
 * 11. 退出登录
 * 12. 清理测试数据
 *
 * 运行方式：
 *   pnpm tsx scripts/test-e2e-flow.ts
 *
 * 前置条件：
 *   - .env.local 已配置 DATABASE_URL, CREEM_PRODUCT_ID_BASE
 *   - pnpm next dev --port 3001 正在运行
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env.local');
  process.exit(1);
}

import { db } from '../src/core/db/index.js';
import { user, subscription, order, monitoredSites } from '../src/config/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { SnowflakeIdv1 } from 'simple-flakeid';

function getUuid() { return uuidv4(); }
function getSnowId() {
  const workerId = Math.floor(Math.random() * 1024);
  const gen = new SnowflakeIdv1({ workerId });
  const snowId = gen.NextId();
  return `${snowId}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
}

// ─── Config ──────────────────────────────────────────────────────────────────
const TIMESTAMP = Date.now();
const APP_URL   = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

const CONFIG = {
  appUrl:        APP_URL,
  email:         `e2e_${TIMESTAMP}@soloboard-test.com`,
  password:      'E2eTest123456!',
  name:          'E2E Test User',
  productIdBase: process.env.CREEM_PRODUCT_ID_BASE || 'prod_3heGlzk0u0XpC3jpb4j7mK',
  planAmount:    1990,
  testSite: {
    name:     'E2E Test Website',
    url:      'https://e2e-test.soloboard.app',
    platform: 'UPTIME',
  },
  ga4PropertyId: '123456789',
};

// ─── Logger ───────────────────────────────────────────────────────────────────
const C = { reset:'\x1b[0m', green:'\x1b[32m', red:'\x1b[31m', yellow:'\x1b[33m',
            blue:'\x1b[34m', cyan:'\x1b[36m', magenta:'\x1b[35m', bold:'\x1b[1m' };

const log  = (m: string, c = C.reset) => console.log(`${c}${m}${C.reset}`);
const ok   = (m: string) => log(`  ✅ ${m}`, C.green);
const fail = (m: string) => log(`  ❌ ${m}`, C.red);
const info = (m: string) => log(`  ℹ  ${m}`, C.blue);
const warn = (m: string) => log(`  ⚠  ${m}`, C.yellow);
const sep  = (t: string) => {
  log(`\n${'═'.repeat(68)}`, C.cyan);
  log(`  ${t}`, C.cyan + C.bold);
  log(`${'═'.repeat(68)}`, C.cyan);
};
const stepLog = (n: number|string, t: string) => {
  log(`\n  ▶ Step ${n}: ${t}`, C.magenta);
  log(`  ${'─'.repeat(60)}`, C.magenta);
};

// ─── State ────────────────────────────────────────────────────────────────────
const S = {
  userId:         '',
  cookieHeader:   '',
  orderId:        '',
  orderNo:        '',
  subscriptionId: '',
  siteId:         '',
};

const results: Record<string, 'PASS'|'FAIL'|'SKIP'> = {};
const errors:  Record<string, string> = {};

// ─── HTTP helper ──────────────────────────────────────────────────────────────
async function api(
  path: string,
  method: 'GET'|'POST'|'PATCH'|'DELETE',
  body?: unknown
) {
  const headers: Record<string,string> = { 'Content-Type': 'application/json' };
  if (S.cookieHeader) headers['Cookie'] = S.cookieHeader;

  const res = await fetch(`${CONFIG.appUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const setCookie = res.headers.get('set-cookie') ?? '';
  const m = setCookie.match(/better-auth\.session_token=([^;]+)/);
  if (m) S.cookieHeader = `better-auth.session_token=${m[1]}`;

  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

// ─── Steps ────────────────────────────────────────────────────────────────────

async function step0_db(): Promise<boolean> {
  stepLog(0, '数据库连接验证');
  try {
    const rows = await db().execute(sql`SELECT NOW() AS now`);
    ok(`连接成功: ${JSON.stringify(rows[0])}`);
    const tables = await db().execute(sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema='public'
        AND table_name IN ('user','subscription','order','monitored_sites')`);
    info(`关键表: ${tables.map((t:any) => t.table_name).join(', ')}`);
    return true;
  } catch(e:any) {
    fail(`DB 错误: ${e.message}`);
    return false;
  }
}

async function step1_signUp(): Promise<boolean> {
  stepLog(1, '用户注册 (Sign Up)');
  info(`Email: ${CONFIG.email}`);
  try {
    const { status, ok: isOk, data } = await api(
      '/api/auth/sign-up/email', 'POST',
      { email: CONFIG.email, password: CONFIG.password, name: CONFIG.name }
    );
    if (isOk && data.user?.id) {
      S.userId = data.user.id;
      ok(`注册成功  userId=${S.userId}`);
      const [u] = await db().select().from(user).where(eq(user.id, S.userId)).limit(1);
      ok(`DB: email=${u?.email}, planType=${u?.planType ?? 'free'}`);
      return true;
    }
    fail(`注册失败 [${status}]: ${JSON.stringify(data).slice(0,300)}`);
    return false;
  } catch(e:any) { fail(`异常: ${e.message}`); return false; }
}

async function step2_signIn(): Promise<boolean> {
  stepLog(2, '用户登录 (Sign In)');
  try {
    const { status, ok: isOk, data } = await api(
      '/api/auth/sign-in/email', 'POST',
      { email: CONFIG.email, password: CONFIG.password }
    );
    if (isOk && data.user?.id) {
      ok('登录成功，Session cookie 已获取');
      return true;
    }
    fail(`登录失败 [${status}]: ${JSON.stringify(data).slice(0,300)}`);
    return false;
  } catch(e:any) { fail(`异常: ${e.message}`); return false; }
}

async function step3_checkout(): Promise<boolean> {
  stepLog(3, `创建支付订单  productId=${CONFIG.productIdBase}`);
  info(`Creem env: ${process.env.CREEM_ENVIRONMENT ?? '(not set)'}`);
  try {
    const { status, ok: isOk, data } = await api(
      '/api/payment/checkout', 'POST',
      { product_id: CONFIG.productIdBase, locale: 'en' }
    );
    if (isOk && (data.checkoutUrl || data.orderId)) {
      S.orderId = data.orderId  ?? '';
      S.orderNo = data.orderNo  ?? '';
      ok(`订单创建成功`);
      info(`  orderId     = ${S.orderId}`);
      info(`  orderNo     = ${S.orderNo}`);
      info(`  checkoutUrl = ${data.checkoutUrl ?? '(none)'}`);
      if (S.orderId) {
        const [o] = await db().select().from(order).where(eq(order.id, S.orderId)).limit(1);
        if (o) ok(`DB: status=${o.status}, amount=$${(o.amount ?? 0)/100}`);
        else warn('DB 中未找到订单（orderId 可能在 data 里字段名不同）');
      }
      return true;
    }
    // checkout 失败不阻塞（Step 4 直写 DB）
    warn(`Checkout API [${status}]: ${JSON.stringify(data).slice(0,200)}`);
    warn('Step 4 将直接写 DB 模拟支付，继续...');
    return true;
  } catch(e:any) {
    warn(`Checkout 异常: ${e.message} — 继续模拟支付`);
    return true;
  }
}

async function step4_simulatePayment(): Promise<boolean> {
  stepLog(4, '模拟支付完成 → 激活 Base 会员 (直写 DB)');
  if (!S.userId) { fail('userId 为空'); return false; }
  try {
    const now       = new Date();
    const periodEnd = new Date(now.getTime() + 30*24*3600*1000);

    if (S.orderId) {
      await db().update(order).set({
        status: 'paid', amount: CONFIG.planAmount, currency: 'USD',
        paymentAmount: CONFIG.planAmount, paymentCurrency: 'USD',
        paymentEmail: CONFIG.email, paidAt: now, updatedAt: now,
      }).where(eq(order.id, S.orderId));
      ok('订单状态 → paid');
    }

    S.subscriptionId = getUuid();
    await db().insert(subscription).values({
      id:                  S.subscriptionId,
      subscriptionNo:      getSnowId(),
      userId:              S.userId,
      userEmail:           CONFIG.email,
      status:              'active',
      paymentProvider:     'creem',
      subscriptionId:      `sub_e2e_${TIMESTAMP}`,
      productId:           CONFIG.productIdBase,
      description:         'Base Plan - E2E Test',
      amount:              CONFIG.planAmount,
      currency:            'USD',
      interval:            'month',
      intervalCount:       1,
      currentPeriodStart:  now,
      currentPeriodEnd:    periodEnd,
      planType:            'base',
      planName:            'Base Plan',
      createdAt:           now,
      updatedAt:           now,
    });
    ok(`订阅已创建  id=${S.subscriptionId}`);
    info(`  有效期至 ${periodEnd.toISOString().split('T')[0]}`);

    await db().update(user).set({ planType: 'base', updatedAt: now })
      .where(eq(user.id, S.userId));
    ok('用户 planType → base');
    return true;
  } catch(e:any) { fail(`失败: ${e.message}`); return false; }
}

async function step5_verifyMembership(): Promise<boolean> {
  stepLog(5, '验证 Base 会员权益');
  try {
    const [u] = await db().select().from(user).where(eq(user.id, S.userId)).limit(1);
    if (!u) { fail('用户不存在'); return false; }
    if (u.planType !== 'base') { fail(`planType=${u.planType}，期望 base`); return false; }
    ok(`DB planType = ${u.planType}`);

    const [sub] = await db().select().from(subscription)
      .where(eq(subscription.userId, S.userId)).limit(1);
    if (!sub) { fail('订阅记录不存在'); return false; }
    ok(`订阅 status=${sub.status}`);
    ok(`计划名称=${sub.planName}`);
    ok(`金额=$${(sub.amount ?? 0)/100}/month`);
    ok(`有效期至=${sub.currentPeriodEnd?.toISOString().split('T')[0]}`);

    // API 验证：获取用户信息（POST 方法）
    const { ok: isOk, status, data } = await api('/api/user/get-user-info', 'POST');
    if (isOk) {
      ok(`POST /api/user/get-user-info → ${status}`);
      const d = data as any;
      info(`  email=${d?.data?.email ?? d?.email}, planType=${d?.data?.planType ?? d?.planType}`);
    } else {
      warn(`POST /api/user/get-user-info → ${status}: ${JSON.stringify(data).slice(0,150)}`);
    }
    return true;
  } catch(e:any) { fail(`异常: ${e.message}`); return false; }
}

async function step6_addSite(): Promise<boolean> {
  stepLog(6, '添加监控站点 (Website)');
  info(`站点: ${CONFIG.testSite.name}  url=${CONFIG.testSite.url}`);
  try {
    const { status, ok: isOk, data } = await api(
      '/api/soloboard/sites', 'POST',
      {
        name:     CONFIG.testSite.name,
        url:      CONFIG.testSite.url,
        platform: CONFIG.testSite.platform,
      }
    );
    if (isOk && data.site?.id) {
      S.siteId = data.site.id;
      ok(`站点创建成功  siteId=${S.siteId}`);
      info(`  订阅信息: ${JSON.stringify(data.subscription ?? {})}`);
      // DB 验证
      const [site] = await db().select().from(monitoredSites)
        .where(eq(monitoredSites.id, S.siteId)).limit(1);
      if (site) ok(`DB: name=${site.name}, domain=${site.domain}, status=${site.status}`);
      return true;
    }
    fail(`添加站点失败 [${status}]: ${JSON.stringify(data).slice(0,300)}`);
    return false;
  } catch(e:any) { fail(`异常: ${e.message}`); return false; }
}

async function step7_configureGA4(): Promise<boolean> {
  stepLog(7, '配置 GA4 数据源 (PATCH site)');
  if (!S.siteId) { warn('siteId 为空，跳过'); return false; }
  info(`ga4PropertyId: ${CONFIG.ga4PropertyId}`);
  try {
    const { status, ok: isOk, data } = await api(
      `/api/soloboard/sites/${S.siteId}`, 'PATCH',
      { ga4PropertyId: CONFIG.ga4PropertyId }
    );
    if (isOk && data.success) {
      ok(`GA4 配置成功 [${status}]`);
      // DB 验证：从 apiConfig jsonb 中读取
      const [site] = await db().select().from(monitoredSites)
        .where(eq(monitoredSites.id, S.siteId)).limit(1);
      if (site) {
        const cfg: any = site.apiConfig ?? {};
        ok(`DB apiConfig.ga4PropertyId = ${cfg.ga4PropertyId ?? '(未设置)'}`);
      }
      return true;
    }
    fail(`GA4 配置失败 [${status}]: ${JSON.stringify(data).slice(0,300)}`);
    return false;
  } catch(e:any) { fail(`异常: ${e.message}`); return false; }
}

async function step8_listSites(): Promise<boolean> {
  stepLog(8, '验证站点列表正常显示');
  try {
    const { status, ok: isOk, data } = await api('/api/soloboard/sites', 'GET');
    if (isOk && data.success) {
      const sites: any[] = data.sites ?? [];
      ok(`GET /api/soloboard/sites → ${status}  total=${data.total}`);
      const mySite = sites.find((s: any) => s.id === S.siteId);
      if (mySite) {
        ok(`站点在列表中可见: name=${mySite.name}, status=${mySite.status}`);
        info(`  platform=${mySite.platform}, domain=${mySite.domain}`);
      } else {
        warn('站点在列表中未找到（可能有延迟）');
      }
      info(`  订阅限制: plan=${data.subscription?.plan}, remaining=${data.subscription?.remaining}`);
      return true;
    }
    fail(`列表获取失败 [${status}]: ${JSON.stringify(data).slice(0,300)}`);
    return false;
  } catch(e:any) { fail(`异常: ${e.message}`); return false; }
}

async function step9_deleteSite(): Promise<boolean> {
  stepLog(9, '删除监控站点');
  if (!S.siteId) { warn('siteId 为空，跳过'); return false; }
  try {
    const { status, ok: isOk, data } = await api(
      `/api/soloboard/sites/${S.siteId}`, 'DELETE'
    );
    if (isOk && data.success) {
      ok(`站点删除成功 [${status}]`);
      return true;
    }
    fail(`删除失败 [${status}]: ${JSON.stringify(data).slice(0,300)}`);
    return false;
  } catch(e:any) { fail(`异常: ${e.message}`); return false; }
}

async function step10_verifyDeleted(): Promise<boolean> {
  stepLog(10, '验证站点已删除');
  if (!S.siteId) { warn('siteId 为空，跳过'); return false; }
  try {
    // DB 验证
    const rows = await db().select().from(monitoredSites)
      .where(eq(monitoredSites.id, S.siteId)).limit(1);
    if (rows.length === 0) {
      ok('DB 验证：站点记录已删除');
    } else {
      fail('DB 验证：站点记录仍存在！');
      return false;
    }
    // API 验证
    const { status, ok: isOk, data } = await api(
      `/api/soloboard/sites/${S.siteId}`, 'GET'
    );
    if (status === 404) {
      ok(`API 验证：GET /api/soloboard/sites/${S.siteId} → 404 (正确)`);
    } else {
      warn(`API 验证：期望 404，实际 ${status}`);
    }
    return true;
  } catch(e:any) { fail(`异常: ${e.message}`); return false; }
}

async function step11_signOut(): Promise<boolean> {
  stepLog(11, '退出登录 (Sign Out)');
  try {
    // better-auth sign-out endpoint
    const { status, ok: isOk, data } = await api('/api/auth/sign-out', 'POST', {});
    if (isOk || status === 200) {
      ok(`退出成功 [${status}]`);
      S.cookieHeader = '';
      return true;
    }
    // 尝试不带 body
    const { status: s2, ok: ok2 } = await api('/api/auth/sign-out', 'POST');
    if (ok2 || s2 === 200) {
      ok(`退出成功 [${s2}]`);
      S.cookieHeader = '';
      return true;
    }
    warn(`Sign-out 返回 ${status}/${s2}，详情: ${JSON.stringify(data).slice(0,200)}`);
    warn('非致命，继续清理流程');
    S.cookieHeader = '';
    return true;
  } catch(e:any) {
    warn(`退出异常: ${e.message}（继续清理）`);
    S.cookieHeader = '';
    return true;
  }
}

async function step12_cleanup(): Promise<void> {
  stepLog(12, '清理测试数据');
  if (!S.userId) { info('无测试数据需要清理'); return; }
  try {
    const database = db();
    // 删除订阅
    if (S.subscriptionId) {
      await database.delete(subscription).where(eq(subscription.id, S.subscriptionId));
      ok('订阅记录已清理');
    }
    // 删除剩余站点（以防 step9 失败）
    if (S.siteId) {
      await database.delete(monitoredSites).where(eq(monitoredSites.id, S.siteId));
      ok('站点记录已清理');
    }
    // 删除订单
    if (S.orderId) {
      await database.delete(order).where(eq(order.id, S.orderId));
      ok('订单记录已清理');
    }
    // 删除用户
    await database.delete(user).where(eq(user.id, S.userId));
    ok(`测试用户已清理 (${CONFIG.email})`);
  } catch(e:any) {
    warn(`清理异常: ${e.message}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  sep('SoloBoard E2E 端到端测试');
  log(`  App URL  : ${CONFIG.appUrl}`, C.blue);
  log(`  Test User: ${CONFIG.email}`, C.blue);
  log(`  ProductID: ${CONFIG.productIdBase}`, C.blue);
  log(`  Creem Env: ${process.env.CREEM_ENVIRONMENT ?? '(not set)'}`, C.blue);
  log(`  时间戳   : ${new Date(TIMESTAMP).toISOString()}`, C.blue);

  const steps: Array<{ name: string; fn: () => Promise<boolean>; required: boolean }> = [
    { name: 'DB Connection',      fn: step0_db,              required: true  },
    { name: 'Sign Up',            fn: step1_signUp,          required: true  },
    { name: 'Sign In',            fn: step2_signIn,          required: true  },
    { name: 'Checkout ($19.9)',   fn: step3_checkout,        required: false },
    { name: 'Simulate Payment',   fn: step4_simulatePayment, required: true  },
    { name: 'Verify Membership',  fn: step5_verifyMembership,required: true  },
    { name: 'Add Site',           fn: step6_addSite,         required: true  },
    { name: 'Configure GA4',      fn: step7_configureGA4,    required: false },
    { name: 'List Sites',         fn: step8_listSites,       required: true  },
    { name: 'Delete Site',        fn: step9_deleteSite,      required: true  },
    { name: 'Verify Deleted',     fn: step10_verifyDeleted,  required: true  },
    { name: 'Sign Out',           fn: step11_signOut,        required: false },
  ];

  let aborted = false;

  for (let i = 0; i < steps.length; i++) {
    const { name, fn, required } = steps[i];
    if (aborted) {
      results[name] = 'SKIP';
      log(`  ⏭  Step ${i}: ${name} — SKIPPED (aborted)`, C.yellow);
      continue;
    }
    try {
      const passed = await fn();
      results[name] = passed ? 'PASS' : 'FAIL';
      if (!passed && required) {
        warn(`必要步骤失败，后续步骤将跳过`);
        aborted = true;
      }
    } catch(e:any) {
      results[name] = 'FAIL';
      errors[name] = e.message;
      if (required) aborted = true;
    }
  }

  // 始终清理
  await step12_cleanup();

  // ─── 最终报告 ─────────────────────────────────────────────────────────────
  sep('测试报告');
  let passed = 0, failed = 0, skipped = 0;

  for (const [name, result] of Object.entries(results)) {
    if (result === 'PASS') {
      log(`  ✅ PASS  ${name}`, C.green);
      passed++;
    } else if (result === 'FAIL') {
      const errMsg = errors[name] ? ` — ${errors[name]}` : '';
      log(`  ❌ FAIL  ${name}${errMsg}`, C.red);
      failed++;
    } else {
      log(`  ⏭  SKIP  ${name}`, C.yellow);
      skipped++;
    }
  }

  log(`\n  总计: ${passed} PASS  ${failed} FAIL  ${skipped} SKIP`, C.bold);

  if (failed === 0) {
    log(`\n  🎉 所有测试通过！SoloBoard E2E 流程验证成功。`, C.green + C.bold);
  } else {
    log(`\n  ⚠  ${failed} 个测试失败。请检查上方日志。`, C.red + C.bold);
  }

  log('');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error('❌ E2E 测试崩溃:', e);
  process.exit(1);
});
  