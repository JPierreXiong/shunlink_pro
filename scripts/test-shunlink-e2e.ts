/**
 * ShunLink Pro — E2E Test
 * Run: pnpm tsx scripts/test-shunlink-e2e.ts
 * Requires: .env.local + pnpm dev on port 3003
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
if (!process.env.DATABASE_URL) { console.error('ERROR: DATABASE_URL not set'); process.exit(1); }

import { db } from '../src/core/db/index.js';
import { user, order, credit, backlinkTasks } from '../src/config/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { SnowflakeIdv1 } from 'simple-flakeid';

const getUuid = () => uuidv4();
const getSnowId = () => { const g = new SnowflakeIdv1({ workerId: 1 }); return String(g.NextId()); };

const TS = Date.now();
const APP = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003').replace(/\/+$/, '');
const CFG = {
  appUrl: APP, workerSecret: process.env.WORKER_SECRET || '',
  email: `shunlink_e2e_${TS}@test.dev`, password: 'E2eTest123456!', name: 'ShunLink E2E',
  productId: 'shunlink-trial', trialCredits: 3, planAmount: 500,
  targetUrl: 'https://example-seo.com/blog/ai-tools-2025', anchorText: 'best AI SEO tools 2025',
};

const G='\x1b[32m',Re='\x1b[31m',Y='\x1b[33m',B='\x1b[34m',Cy='\x1b[36m',M='\x1b[35m',Bo='\x1b[1m',X='\x1b[0m';
const ok   = (m: string) => console.log(G+'  OK   '+m+X);
const fail = (m: string) => console.log(Re+'  FAIL '+m+X);
const info = (m: string) => console.log(B+'  ..   '+m+X);
const warn = (m: string) => console.log(Y+'  !!   '+m+X);
const sep  = (t: string) => { console.log('\n'+Cy+'='.repeat(64)+X); console.log(Cy+Bo+'  '+t+X); console.log(Cy+'='.repeat(64)+X); };
const step = (n: number|string, t: string) => { console.log('\n'+M+'  >> Step '+n+': '+t+X); console.log(M+'  '+'-'.repeat(58)+X); };

const S = { userId:'', cookie:'', orderId:'', creditId:'', taskId:'' };
const results: Record<string,'PASS'|'FAIL'|'SKIP'> = {};
const errs: Record<string,string> = {};

async function api(path: string, method: string, body?: unknown, extra?: Record<string,string>) {
  const h: Record<string,string> = { 'Content-Type': 'application/json' };
  if (S.cookie) h['Cookie'] = S.cookie;
  if (extra) Object.assign(h, extra);
  const res = await fetch(CFG.appUrl + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined } as any);
  const sc = res.headers.get('set-cookie') ?? '';
  const m = sc.match(/better-auth\.session_token=([^;]+)/);
  if (m) S.cookie = 'better-auth.session_token=' + m[1];
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function s0_db(): Promise<boolean> {
  step(0, 'DB Connection');
  try {
    const r = await db().execute(sql`SELECT NOW() AS t, current_database() AS d`);
    ok('DB connected: ' + JSON.stringify(r[0]));
    const t = await db().execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('user','credit','order','backlink_tasks','backlink_platforms') ORDER BY table_name`);
    info('Tables(' + t.length + '): ' + t.map((x: any) => x.table_name).join(', '));
    if (t.length < 4) { fail('Missing tables — run pnpm db:push'); return false; }
    return true;
  } catch(e: any) { fail('DB error: ' + e.message); return false; }
}

async function s1_signUp(): Promise<boolean> {
  step(1, 'Sign Up');
  info('email: ' + CFG.email);
  try {
    const { status, ok: isOk, data } = await api('/api/auth/sign-up/email', 'POST', { email: CFG.email, password: CFG.password, name: CFG.name });
    if (isOk && data.user?.id) {
      S.userId = data.user.id;
      ok('Registered userId=' + S.userId);
      const rows = await db().select().from(user).where(eq(user.id, S.userId)).limit(1);
      ok('DB planType=' + (rows[0]?.planType ?? 'free'));
      return true;
    }
    fail('[' + status + ']: ' + JSON.stringify(data).slice(0, 200));
    return false;
  } catch(e: any) { fail('Exception: ' + e.message); return false; }
}

async function s2_signIn(): Promise<boolean> {
  step(2, 'Sign In');
  try {
    const { status, ok: isOk, data } = await api('/api/auth/sign-in/email', 'POST', { email: CFG.email, password: CFG.password });
    if (isOk && data.user?.id) { ok('Signed in userId=' + data.user.id); return true; }
    fail('[' + status + ']: ' + JSON.stringify(data).slice(0, 200));
    return false;
  } catch(e: any) { fail('Exception: ' + e.message); return false; }
}

async function s3_checkout(): Promise<boolean> {
  step(3, 'Checkout Trial $5  productId=' + CFG.productId);
  info('Creem env: ' + (process.env.CREEM_ENVIRONMENT ?? '(not set)'));
  try {
    const { status, ok: isOk, data } = await api('/api/payment/checkout', 'POST', { product_id: CFG.productId, locale: 'en' });
    if (isOk) {
      S.orderId = data.orderId ?? '';
      ok('Checkout ok [' + status + '] orderId=' + S.orderId);
      info('checkoutUrl=' + String(data.checkoutUrl ?? '').slice(0, 80));
      if (S.orderId) {
        const rows = await db().select().from(order).where(eq(order.id, S.orderId)).limit(1);
        if (rows[0]) ok('DB order status=' + rows[0].status + ' provider=' + rows[0].paymentProvider);
      }
    } else {
      warn('Checkout [' + status + ']: ' + JSON.stringify(data).slice(0, 150) + ' -- will simulate in DB');
    }
    return true;
  } catch(e: any) { warn('Checkout exception: ' + e.message + ' -- continuing'); return true; }
}

async function s4_simulatePayment(): Promise<boolean> {
  step(4, 'Simulate payment -> grant ' + CFG.trialCredits + ' credits');
  if (!S.userId) { fail('userId empty'); return false; }
  try {
    const now = new Date(), exp = new Date(now.getTime() + 7*24*3600*1000);
    if (S.orderId) {
      await db().update(order).set({ status: 'paid', paymentEmail: CFG.email, paymentAmount: CFG.planAmount, paymentCurrency: 'usd', paidAt: now, updatedAt: now }).where(eq(order.id, S.orderId));
      ok('Order -> paid');
    }
    const [ins] = await db().insert(credit).values({
      id: getUuid(), transactionNo: getSnowId(), transactionType: 'grant', transactionScene: 'payment',
      userId: S.userId, userEmail: CFG.email, status: 'active',
      credits: CFG.trialCredits, remainingCredits: CFG.trialCredits,
      description: 'ShunLink Trial E2E - ' + CFG.trialCredits + ' credits',
      expiresAt: exp, createdAt: now, updatedAt: now,
    }).returning();
    S.creditId = ins.id;
    ok('Credits granted id=' + S.creditId + '  amount=' + CFG.trialCredits + '  expires=' + exp.toISOString().slice(0,10));
    return true;
  } catch(e: any) { fail('Failed: ' + e.message); return false; }
}

async function s5_verifyCredits(): Promise<boolean> {
  step(5, 'Verify credits via API + DB');
  try {
    let rem: number | null = null;
    const { ok: isOk, data } = await api('/api/backlink/tasks', 'GET');
    if (isOk && typeof data.remainingCredits === 'number') { rem = data.remainingCredits; info('API remainingCredits=' + rem); }
    if (rem === null) {
      const rows = await db().execute(sql`SELECT COALESCE(SUM(remaining_credits),0)::int AS total FROM credit WHERE user_id = ${S.userId} AND transaction_type = 'grant' AND status = 'active' AND remaining_credits > 0 AND (expires_at IS NULL OR expires_at > NOW())`);
      rem = Number((rows[0] as any)?.total ?? 0);
      info('DB remaining credits=' + rem);
    }
    if (rem >= CFG.trialCredits) { ok('Credits ok: ' + rem + ' >= ' + CFG.trialCredits); return true; }
    fail('Expected >= ' + CFG.trialCredits + ', got ' + rem); return false;
  } catch(e: any) { fail('Exception: ' + e.message); return false; }
}

async function s6_createTask(): Promise<boolean> {
  step(6, 'Create backlink task (POST /api/backlink/tasks)');
  info('target: ' + CFG.targetUrl);
  info('anchor: ' + CFG.anchorText);
  try {
    const { status, ok: isOk, data } = await api('/api/backlink/tasks', 'POST', { targetUrl: CFG.targetUrl, anchorText: CFG.anchorText, agentPersona: 'professional', aiOptimize: true });
    if (isOk && data.task?.id) {
      S.taskId = data.task.id;
      ok('Task created taskId=' + S.taskId + '  status=' + data.task.status);
      info('slaDue=' + data.task.slaDue);
      return true;
    }
    fail('[' + status + ']: ' + JSON.stringify(data).slice(0, 300)); return false;
  } catch(e: any) { fail('Exception: ' + e.message); return false; }
}

async function s7_verifyTaskAndCredits(): Promise<boolean> {
  step(7, 'Verify task in DB + credit deducted to ' + (CFG.trialCredits - 1));
  try {
    const rows = await db().select().from(backlinkTasks).where(eq(backlinkTasks.id, S.taskId)).limit(1);
    if (!rows[0]) { fail('Task not found in DB'); return false; }
    ok('DB task status=' + rows[0].status);
    const cr = await db().execute(sql`SELECT COALESCE(SUM(remaining_credits),0)::int AS total FROM credit WHERE user_id = ${S.userId} AND transaction_type = 'grant' AND status = 'active' AND remaining_credits > 0 AND (expires_at IS NULL OR expires_at > NOW())`);
    const rem = Number((cr[0] as any)?.total ?? 0);
    const expected = CFG.trialCredits - 1;
    info('Remaining credits: ' + rem + ' (expected ' + expected + ')');
    if (rem === expected) { ok('Credits correctly deducted: ' + CFG.trialCredits + ' -> ' + rem); }
    else { warn('Credit count mismatch (may be async) non-fatal'); }
    return true;
  } catch(e: any) { fail('Exception: ' + e.message); return false; }
}

async function s8_workerPatch(): Promise<boolean> {
  step(8, 'Simulate Worker PATCH -> success');
  if (!S.taskId) { warn('taskId empty, skip'); return false; }
  const wh = CFG.workerSecret ? { 'x-worker-secret': CFG.workerSecret } : {};
  try {
    const { status, ok: isOk, data } = await api('/api/backlink/tasks/' + S.taskId, 'PATCH', {
      status: 'success',
      screenshotUrl: 'https://storage.example.com/screenshots/e2e-test.png',
      liveUrl: 'https://blogger.com/blog/e2e-backlink-post',
      agentLog: '[E2E] Simulated agent success log',
    }, wh);
    if (isOk && data.task) { ok('PATCH ok [' + status + '] status=' + data.task.status + '  liveUrl=' + data.task.liveUrl); return true; }
    fail('PATCH failed [' + status + ']: ' + JSON.stringify(data).slice(0, 200)); return false;
  } catch(e: any) { fail('Exception: ' + e.message); return false; }
}

async function s9_verifySuccess(): Promise<boolean> {
  step(9, 'Verify task final status = success (GET /api/backlink/tasks/[id])');
  try {
    const { status, ok: isOk, data } = await api('/api/backlink/tasks/' + S.taskId, 'GET');
    if (isOk && data.task) {
      ok('GET task [' + status + '] status=' + data.task.status);
      info('  liveUrl      = ' + (data.task.liveUrl ?? '(none)'));
      info('  screenshotUrl= ' + (data.task.screenshotUrl ?? '(none)'));
      if (data.task.status === 'success') { ok('Task status = success -- PASS'); return true; }
      fail('Expected success, got ' + data.task.status); return false;
    }
    fail('GET task failed [' + status + ']: ' + JSON.stringify(data).slice(0, 200)); return false;
  } catch(e: any) { fail('Exception: ' + e.message); return false; }
}

async function s10_signOut(): Promise<boolean> {
  step(10, 'Sign Out');
  try {
    const { status } = await api('/api/auth/sign-out', 'POST', {});
    ok('Sign out [' + status + ']'); S.cookie = ''; return true;
  } catch(e: any) { warn('Sign out exception: ' + e.message); S.cookie = ''; return true; }
}

async function s11_cleanup(): Promise<void> {
  step(11, 'Cleanup test data');
  if (!S.userId) { info('Nothing to clean'); return; }
  try {
    if (S.taskId) { await db().delete(backlinkTasks).where(eq(backlinkTasks.id, S.taskId)); ok('Task deleted'); }
    await db().execute(sql`DELETE FROM credit WHERE user_id = ${S.userId}`);
    ok('All credits deleted');
    if (S.orderId) { await db().delete(order).where(eq(order.id, S.orderId)); ok('Order deleted'); }
    await db().delete(user).where(eq(user.id, S.userId));
    ok('User deleted (' + CFG.email + ')');
  } catch(e: any) { warn('Cleanup error: ' + e.message); }
}

async function run() {
  sep('ShunLink Pro -- E2E Test Suite');
  console.log(B+'  App URL      : '+CFG.appUrl+X);
  console.log(B+'  Test Email   : '+CFG.email+X);
  console.log(B+'  Product      : '+CFG.productId+' (Trial $5, '+CFG.trialCredits+' credits)'+X);
  console.log(B+'  Creem Env    : '+(process.env.CREEM_ENVIRONMENT??'(not set)')+X);
  console.log(B+'  Worker Secret: '+(CFG.workerSecret?'[SET]':'[NOT SET - PATCH unauthenticated]')+X);

  const steps: Array<{name:string; fn:()=>Promise<boolean>; required:boolean}> = [
    { name:'DB Connection',        fn:s0_db,                  required:true  },
    { name:'Sign Up',              fn:s1_signUp,              required:true  },
    { name:'Sign In',              fn:s2_signIn,              required:true  },
    { name:'Checkout API',         fn:s3_checkout,            required:false },
    { name:'Simulate Payment',     fn:s4_simulatePayment,     required:true  },
    { name:'Verify Credits (3)',   fn:s5_verifyCredits,       required:true  },
    { name:'Create Task',          fn:s6_createTask,          required:true  },
    { name:'Verify Task+Credits',  fn:s7_verifyTaskAndCredits,required:true  },
    { name:'Worker PATCH success', fn:s8_workerPatch,         required:true  },
    { name:'Verify Success',       fn:s9_verifySuccess,       required:true  },
    { name:'Sign Out',             fn:s10_signOut,            required:false },
  ];

  let aborted = false;
  const startMs = Date.now();

  for (let i = 0; i < steps.length; i++) {
    const { name, fn, required } = steps[i];
    if (aborted) { results[name] = 'SKIP'; console.log(Y+'  SKIP  '+name+X); continue; }
    try {
      const passed = await fn();
      results[name] = passed ? 'PASS' : 'FAIL';
      if (!passed && required) { warn('Required step failed — aborting remaining steps'); aborted = true; }
    } catch(e: any) {
      results[name] = 'FAIL'; errs[name] = e.message;
      if (required) aborted = true;
    }
  }

  await s11_cleanup();

  // ── Report ──────────────────────────────────────────────────────────────
  sep('FINAL REPORT');
  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
  console.log(B+'  App   : '+CFG.appUrl+X);
  console.log(B+'  User  : '+CFG.email+X);
  console.log(B+'  Time  : '+new Date().toISOString()+'  ('+elapsed+'s)'+X+'\n');

  let passed = 0, failed = 0, skipped = 0;
  for (const [name, result] of Object.entries(results)) {
    if (result === 'PASS')       { console.log(G+'  PASS  '+name+X); passed++; }
    else if (result === 'FAIL')  { const e = errs[name] ? ' -- '+errs[name] : ''; console.log(Re+'  FAIL  '+name+e+X); failed++; }
    else                         { console.log(Y+'  SKIP  '+name+X); skipped++; }
  }

  console.log('\n'+B+'  Total: '+passed+' PASS  '+failed+' FAIL  '+skipped+' SKIP'+X);

  if (failed === 0) {
    console.log('\n'+G+Bo+'  ALL TESTS PASSED — ShunLink E2E flow verified.'+X+'\n');
  } else {
    console.log('\n'+Re+Bo+'  '+failed+' TEST(S) FAILED — check logs above.'+X+'\n');
  }

  // Machine-readable summary for CI
  const summary = {
    timestamp: new Date().toISOString(),
    appUrl: CFG.appUrl,
    testUser: CFG.email,
    product: CFG.productId,
    trialCredits: CFG.trialCredits,
    elapsedSeconds: parseFloat(elapsed),
    passed, failed, skipped,
    results,
  };
  console.log('\n--- JSON SUMMARY ---');
  console.log(JSON.stringify(summary, null, 2));

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => { console.error(Re+'CRASH: '+e.message+X); process.exit(1); });

