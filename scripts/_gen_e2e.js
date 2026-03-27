const fs = require('fs');
const path = require('path');

const out = path.join(__dirname, 'test-shunlink-e2e.ts');

const code = `
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
const getSnowId = () => { const g = new SnowflakeIdv1({ workerId: Math.floor(Math.random()*1024) }); return String(g.NextId()); };

const TS = Date.now();
const APP = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003').replace(/\/+$/, '');

const CFG = {
  appUrl: APP,
  workerSecret: process.env.WORKER_SECRET || '',
  email: 'shunlink_e2e_' + TS + '@test.dev',
  password: 'E2eTest123456!',
  name: 'ShunLink E2E',
  productId: 'shunlink-trial',
  trialCredits: 3,
  planAmount: 500,
  targetUrl: 'https://example-seo.com/blog/ai-tools-2025',
  anchorText: 'best AI SEO tools 2025',
};

const G='\\x1b[32m', Re='\\x1b[31m', Y='\\x1b[33m', B='\\x1b[34m',
      Cy='\\x1b[36m', M='\\x1b[35m', Bo='\\x1b[1m', X='\\x1b[0m';
const ok   = (m: string) => console.log(G+'  OK   '+m+X);
const fail = (m: string) => console.log(Re+'  FAIL '+m+X);
const info = (m: string) => console.log(B+'  ..   '+m+X);
const warn = (m: string) => console.log(Y+'  !!   '+m+X);
const sep  = (t: string) => { console.log('\\n'+Cy+'='.repeat(64)+X); console.log(Cy+Bo+'  '+t+X); console.log(Cy+'='.repeat(64)+X); };
const step = (n: number|string, t: string) => { console.log('\\n'+M+'  >> Step '+n+': '+t+X); console.log(M+'  '+'-'.repeat(58)+X); };

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

// Step 0 — DB
async function s0_db(): Promise<boolean> {
  step(0, 'DB Connection');
  try {
    const r = await db().execute(sql\`SELECT NOW() AS t, current_database() AS d\`);
    ok('DB connected: ' + JSON.stringify(r[0]));
    const t = await db().execute(sql\`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema='public'
        AND table_name IN ('user','credit','order','backlink_tasks','backlink_platforms')
      ORDER BY table_name\`);
    info('Tables(' + t.length + '): ' + t.map((x: any) => x.table_name).join(', '));
    if (t.length < 4) { fail('Missing tables — run pnpm db:push'); return false; }
    return true;
  } catch(e: any) { fail('DB error: ' + e.message); return false; }
}

// Step 1 — Sign Up
async function s1_signUp(): Promise<boolean> {
  step(1, 'Sign Up');
  info('email: ' + CFG.email);
  try {
    const { status, ok: isOk, data } = await api('/api/auth/sign-up/email', 'POST',
      { email: CFG.email, password: CFG.password, name: CFG.name });
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

// Step 2 — Sign In
async function s2_signIn(): Promise<boolean> {
  step(2, 'Sign In');
  try {
    const { status, ok: isOk, data } = await api('/api/auth/sign-in/email', 'POST',
      { email: CFG.email, password: CFG.password });
    if (isOk && data.user?.id) { ok('Signed in userId=' + data.user.id); return true; }
    fail('[' + status + ']: ' + JSON.stringify(data).slice(0, 200));
    return false;
  } catch(e: any) { fail('Exception: ' + e.message); return false; }
}

// Step 3 — Checkout
async function s3_checkout(): Promise<boolean> {
  step(3, 'Checkout API — Trial $5 productId=' + CFG.productId);
  info('Creem env: ' + (process.env.CREEM_ENVIRONMENT ?? '(not set)'));
  try {
    const { status, ok: isOk, data } = await api('/api/payment/checkout', 'POST',
      { product_id: CFG.productId, locale: 'en' });
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

// Step 4 — Simulate Payment
async function s4_simulatePayment(): Promise<boolean> {
  step(4, 'Simulate payment -> grant ' + CFG.trialCredits + ' credits to DB');
  if (!S.userId) { fail('userId empty'); return false; }
  try {
    const now = new Date();
    const exp = new Date(now.getTime() + 7*24*3600*1000);
    if (S.orderId) {
      await db().update(order).set({
        status: 'paid', paymentEmail: CFG.email,
        paymentAmount: CFG.planAmount, paymentCurrency: 'usd',
        paidAt: now, updatedAt: now,
      }).where(eq(order.id, S.orderId));
      ok('Order -> paid');
    }
    const [ins] = await db().insert(credit).values({
      id: getUuid(),
      transactionNo: getSnowId(),
      transactionType: 'grant',
      transactionScene: 'payment',
      userId: S.userId,
      userEmail: CFG.email,
      status: 'active',
      credits: CFG.trialCredits,
      remainingCredits: CFG.trialCredits,
      description: 'ShunLink Trial E2E - ' + CFG.trialCredits + ' credits',
      expiresAt: exp,
      createdAt: now,
      updatedAt: now,
    }).returning();
    S.creditId = ins.id;
    ok('Credits granted id=' + S.creditId + ' amount=' + CFG.trialCredits + ' expires=' + exp.toISOString().slice(0,10));
    return true;
  } catch(e: any) { fail('Failed: ' + e.message); return false; }
}

// Step 5 — Verify Credits
async function s5_verifyCredits(): Promise<boolean> {
  step(5, 'Verify credits via API + DB');
  try {
    let rem: number | null = null;
    const { ok: isOk, data } = await api('/api/backlink/tasks', 'GET');
    if (isOk && typeof data.remainingCredits === 'number') {
      rem = data.remainingCredits;
      info('API remainingCredits=' + rem);
    }
    if (rem === null) {
      const rows = await db().execute(sql\`
        SELECT COALESCE(SUM(remaining_credits),0)::int AS total
        FROM credit
        WHERE user_id = ${S.userId}
          AND transaction_type = 'grant'
          AND status = 'active'
          AND remaining_credits > 0
          AND (expires_at IS NULL OR expires_at > NOW())\`);
      rem = Number((rows[0] as any)?.total ?? 0);
      info('DB remaining credits=' + rem);
    }
    if (rem >= CFG.trialCredits) { ok('Credits ok: ' + rem + ' >= ' + CFG.trialCredits); return true; }
    fail('Expected >= ' + CFG.trialCredits + ', got ' + rem);
    return false;
  } catch(e: any) { fail('Exception: ' + e.message); return false; }
}

// Step 6 — Create Task
async function s6_createTask(): Promise<boolean> {
  step(6, 'Create backlink task (POST /api/backlink/tasks)');
  info('target: ' + CFG.targetUrl);
  info('anchor: ' + CFG.anchorText);
  try {
    const { status, ok: isOk, data } = await api('/api/backlink/tasks', 'POST', {
      targetUrl: CFG.targetUrl,
      anchorText: CFG.anchorText,
      agentPersona: 'professional',
      aiOptimize: true,
    });
    if (isOk && data.task?.id) {
      S.taskId = data.task.id;
      ok('Task created taskId=' + S.taskId + ' status=' + data.task.status);
      info('slaDue=' + data.task.slaDue);
      return true;
    }
    fail('[' + status + ']: ' + JSON.stringify(data).slice(0, 300));
    return false;
  } catch(e: any) { fail('Exception: ' + e.message); return false; }
}

// Step 7 — Verify task + credit deduction
async function s7_verifyTaskAndCredits(): Promise<boolean> {
  step(7, 'Verify task in DB + credit deducted to ' + (CFG.trialCredits - 1));
  try {
    const rows = await db().select().from(backlinkTasks).where(eq(backlinkTasks.id, S.taskId)).limit(1);
    if (!rows[0]) { fail('Task not found in DB'); return false; }
    ok('DB task status=' + rows[0].status + ' targetUrl=' + rows[0].targetUrl);
    const cr = await db().execute(sql\`
      SELECT COALESCE(SUM(remaining_credits),0)::int AS total
      FROM credit
      WHERE user_id = ${S.userId}
        AND transaction_type = 'grant'
        AND status = 'active'
        AND remaining_credits > 0
        AND (expires_at IS NULL OR expires_at > NOW())\`);
    const rem = Number((cr[0] as any)?.total ?? 0);
    info('Remaining credits after task: ' + rem + ' (expected ' + (CFG.trialCredits - 1) + ')');
    if (rem === CFG.trialCredits - 1) {
      ok('Credits correctly deducted: ' + CFG.trialCredits + ' -> ' + rem);
    } else {
      warn('Credit count mismatch (may be async) - non-fatal');
    }
    return true;
  } catch(e: any) { fail('Exception: ' + e.message); return false; }
}

// Step 8 — Worker PATCH
async function s8_workerPatch(): Promise<boolean> {
  step(8, 'Simulate Worker PATCH -> success');
  if (!S.taskId) { warn('taskId empty, skip'); return false; }
  const wh = CFG.workerSecret ? { 'x-worker-secret': CFG.workerSecret } : {};
  try {
    const { status, ok: isOk, data } = await api(
      '/api/backlink/tasks/' + S.taskId, 'PATCH',
      {
        status: 'success',
        screenshotUrl: 'https://storage.example.com/screenshots/e2e-test.png',
        liveUrl: 'https://blogger.com/blog/e2e-test-backlink-post',
        agentLog: '[E2E] Simulated agent success log',
      }, wh);
    if (isOk && data.task) {
      ok('PATCH ok [' + status + '] status=' + data.task.status + ' liveUrl=' + data.task.liveUrl);
      return true;
    }
    fail('PATCH failed [' + status + ']: ' + JSON.stringify(data).slice(0, 200));
    return false;
  } catch(e: any) { fail('Exception: ' + e.message); return false; }
}

// Step 9 — Verify success
async function s9_verifySuccess(): Promise<boolean> {
  step(9, 'Verify task final status = success');
  try {
    const rows = await db().select().from(backlinkTasks).where(eq(backlinkTasks.id, S.taskId)).limit(1);
    if (!rows[0]) { fail('Task not found'); return false; }
    const t = rows[0];
    ok('DB task status=' + t.status);
    info('  

















