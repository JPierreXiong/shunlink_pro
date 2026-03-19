/**
 * SoloBoard - Neon 数据库 + Vercel Blob 端测脚本
 *
 * 测试内容:
 * Phase 1: Neon 数据库连接与核心表验证
 * Phase 2: Vercel Blob 上传 / 列举 / 读取 / 删除
 * Phase 3: Blob 写入业务场景（头像、指标归档、同步日志）
 * Phase 4: Storage Service 集成（走 getStorageService 统一层）
 *
 * 运行方式:
 *   pnpm tsx scripts/test-neon-blob.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { db } from '@/core/db';
import { sql } from 'drizzle-orm';
import {
  uploadToBlob,
  uploadJsonToBlob,
  listBlobFiles,
  deleteFromBlob,
  archiveMetricsHistory,
  uploadSyncLog,
} from '@/lib/blob-storage';
import { getStorageService } from '@/shared/services/storage';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const PASS = '✅ PASS';
const FAIL = '❌ FAIL';
const SKIP = '⚠️  SKIP';

interface Result {
  phase: string;
  step: string;
  status: 'pass' | 'fail' | 'skip';
  detail: string;
}

const results: Result[] = [];

function record(
  phase: string,
  step: string,
  status: 'pass' | 'fail' | 'skip',
  detail: string
) {
  results.push({ phase, step, status, detail });
  const icon = status === 'pass' ? PASS : status === 'fail' ? FAIL : SKIP;
  console.log(`  ${icon}  [${step}] ${detail}`);
}

// ─────────────────────────────────────────────
// Phase 1: Neon 数据库
// ─────────────────────────────────────────────
async function testNeonDatabase() {
  console.log('\n══════════════════════════════════════════');
  console.log('Phase 1: Neon 数据库连接与表验证');
  console.log('══════════════════════════════════════════');

  const phase = 'Phase 1';

  // 1-1 检查环境变量
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    record(phase, '1-1 ENV', 'fail', 'DATABASE_URL 未设置');
    return false;
  }
  const masked = dbUrl.replace(/:([^:@]+)@/, ':***@');
  record(phase, '1-1 ENV', 'pass', `DATABASE_URL 已设置 → ${masked}`);

  // 1-2 基本连接
  let database: any;
  try {
    database = db();
    await database.execute(sql`SELECT 1 AS ping`);
    record(phase, '1-2 Connect', 'pass', 'PostgreSQL 连接成功');
  } catch (e: any) {
    record(phase, '1-2 Connect', 'fail', `连接失败: ${e.message}`);
    return false;
  }

  // 1-3 时间戳查询（验证 Neon 服务器时区）
  try {
    const rows = await database.execute(sql`SELECT NOW() AS ts, version() AS ver`);
    const row = rows[0] as any;
    record(phase, '1-3 Timestamp', 'pass', `Server time: ${row.ts} | ${String(row.ver).split(' ').slice(0, 2).join(' ')}`);
  } catch (e: any) {
    record(phase, '1-3 Timestamp', 'fail', e.message);
  }

  // 1-4 核心表存在性检查
  const requiredTables = [
    'user', 'session', 'account', 'order', 'subscription', 'credit',
    'monitored_sites', 'site_metrics_history', 'site_metrics_daily',
    'sync_logs', 'alert_rules', 'alert_history',
  ];

  try {
    const rows = await database.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    const existing = new Set(rows.map((r: any) => r.table_name as string));
    let allOk = true;
    for (const tbl of requiredTables) {
      if (existing.has(tbl)) {
        record(phase, `1-4 Table:${tbl}`, 'pass', `表存在`);
      } else {
        record(phase, `1-4 Table:${tbl}`, 'fail', `表不存在 ← 需要运行 pnpm init:soloboard`);
        allOk = false;
      }
    }
    if (!allOk) {
      console.log('\n  💡 运行以下命令初始化 SoloBoard 表:');
      console.log('     pnpm init:soloboard');
    }
  } catch (e: any) {
    record(phase, '1-4 Tables', 'fail', e.message);
  }

  // 1-5 写入 + 读取 + 删除测试（用 sync_logs 替代，无外键依赖）
  const testSyncId = `test-sync-${Date.now()}`;
  // 先创建临时 monitored_site（需要先有 user），改用直接测试 config 表
  try {
    // 用 config 表做 CRUD（无外键约束）
    await database.execute(sql`
      INSERT INTO config (name, value) VALUES (${testSyncId}, 'e2e-test') ON CONFLICT (name) DO UPDATE SET value = 'e2e-test'
    `);
    record(phase, '1-5 Insert', 'pass', `插入测试行 config.name=${testSyncId}`);

    const rows2 = await database.execute(sql`
      SELECT name, value FROM config WHERE name = ${testSyncId}
    `);
    if ((rows2 as any[]).length === 1) {
      record(phase, '1-5 Read', 'pass', `读回正确: ${JSON.stringify(rows2[0])}`);
    } else {
      record(phase, '1-5 Read', 'fail', '未读回测试行');
    }

    await database.execute(sql`DELETE FROM config WHERE name = ${testSyncId}`);
    record(phase, '1-5 Delete', 'pass', '测试行清理完成');
  } catch (e: any) {
    record(phase, '1-5 CRUD', 'fail', e.message);
    try { await database.execute(sql`DELETE FROM config WHERE name = ${testSyncId}`); } catch {}
  }

  return true;
}

// ─────────────────────────────────────────────
// Phase 2: Vercel Blob 基础操作
// ─────────────────────────────────────────────
async function testVercelBlobBasic(): Promise<string[]> {
  console.log('\n══════════════════════════════════════════');
  console.log('Phase 2: Vercel Blob 基础操作');
  console.log('══════════════════════════════════════════');

  const phase = 'Phase 2';
  const uploadedUrls: string[] = [];

  // 2-1 检查 Token
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    record(phase, '2-1 ENV', 'skip',
      'BLOB_READ_WRITE_TOKEN 未设置，跳过 Blob 测试。\n' +
      '  请在 Vercel Dashboard → Storage → Blob → Connect → 获取 Token 后写入 .env.local');
    return [];
  }
  record(phase, '2-1 ENV', 'pass', `BLOB_READ_WRITE_TOKEN 已设置 (${token.substring(0, 16)}...)`);

  // 2-2 上传文本文件（Vercel Blob 免费层只支持 public）
  const testPath = `e2e-tests/test-${Date.now()}.txt`;
  let uploadedUrl = '';
  try {
    uploadedUrl = await uploadToBlob(testPath, 'SoloBoard Blob test OK', {
      contentType: 'text/plain',
      access: 'public',
    });
    uploadedUrls.push(uploadedUrl);
    record(phase, '2-2 Upload', 'pass', `上传成功 → ${uploadedUrl}`);
  } catch (e: any) {
    record(phase, '2-2 Upload', 'fail', e.message);
    return uploadedUrls;
  }

  // 2-3 上传 JSON
  const jsonPath = `e2e-tests/meta-${Date.now()}.json`;
  try {
    const url = await uploadJsonToBlob(jsonPath, {
      project: 'SoloBoard',
      test: true,
      timestamp: new Date().toISOString(),
    }, { access: 'public' });
    uploadedUrls.push(url);
    record(phase, '2-3 UploadJSON', 'pass', `JSON 上传成功 → ${url}`);
  } catch (e: any) {
    record(phase, '2-3 UploadJSON', 'fail', e.message);
  }

  // 2-4 列举文件
  try {
    const blobs = await listBlobFiles('e2e-tests/');
    record(phase, '2-4 List', 'pass', `列举到 ${blobs.length} 个文件 (prefix=e2e-tests/)`);
  } catch (e: any) {
    record(phase, '2-4 List', 'fail', e.message);
  }

  // 2-5 读取内容（通过 fetch）
  if (uploadedUrl) {
    try {
      const resp = await fetch(uploadedUrl);
      const text = await resp.text();
      if (text.includes('SoloBoard')) {
        record(phase, '2-5 Read', 'pass', `内容读取正确: "${text}"`);
      } else {
        record(phase, '2-5 Read', 'fail', `内容不匹配: "${text}"`);
      }
    } catch (e: any) {
      record(phase, '2-5 Read', 'fail', e.message);
    }
  }

  return uploadedUrls;
}

// ─────────────────────────────────────────────
// Phase 3: Blob 业务场景
// ─────────────────────────────────────────────
async function testVercelBlobBusiness(): Promise<string[]> {
  console.log('\n══════════════════════════════════════════');
  console.log('Phase 3: Blob 业务场景写入');
  console.log('══════════════════════════════════════════');

  const phase = 'Phase 3';
  const uploadedUrls: string[] = [];

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    record(phase, '3-x ALL', 'skip', 'BLOB_READ_WRITE_TOKEN 未设置，跳过业务场景');
    return [];
  }

  const fakeUserId = `e2e-user-${Date.now()}`;
  const fakeSiteId = `e2e-site-${Date.now()}`;

  // 3-1 指标历史归档
  try {
    const now = new Date();
    const sampleData = Array.from({ length: 5 }, (_, i) => ({
      date: `2026-01-0${i + 1}`,
      revenue: (i + 1) * 1000,
      visitors: (i + 1) * 100,
      orders: i + 1,
    }));
    const url = await archiveMetricsHistory(fakeUserId, now.getFullYear(), now.getMonth() + 1, sampleData);
    uploadedUrls.push(url);
    record(phase, '3-1 ArchiveMetrics', 'pass', `指标归档成功 → ${url}`);
  } catch (e: any) {
    record(phase, '3-1 ArchiveMetrics', 'fail', e.message);
  }

  // 3-2 同步日志
  try {
    const logContent = [
      `[${new Date().toISOString()}] E2E Test sync started`,
      `[${new Date().toISOString()}] Site ${fakeSiteId} - OK`,
      `[${new Date().toISOString()}] Sync completed in 123ms`,
    ].join('\n');
    const url = await uploadSyncLog(fakeSiteId, logContent);
    uploadedUrls.push(url);
    record(phase, '3-2 SyncLog', 'pass', `同步日志上传成功 → ${url}`);
  } catch (e: any) {
    record(phase, '3-2 SyncLog', 'fail', e.message);
  }

  // 3-3 头像上传（模拟 1×1 像素 PNG）
  try {
    // Minimal valid 1x1 PNG (67 bytes)
    const pngBytes = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
      '2e00000000c4944415478016360f8cfc00000000200017e21bc330000000049454e44ae426082',
      'hex'
    );
    const { uploadAvatar } = await import('@/lib/blob-storage');
    const url = await uploadAvatar(fakeUserId, pngBytes, 'image/png');
    uploadedUrls.push(url);
    record(phase, '3-3 Avatar', 'pass', `头像上传成功 → ${url}`);
  } catch (e: any) {
    record(phase, '3-3 Avatar', 'fail', e.message);
  }

  return uploadedUrls;
}

// ─────────────────────────────────────────────
// Phase 4: StorageManager 集成层
// ─────────────────────────────────────────────
async function testStorageService() {
  console.log('\n══════════════════════════════════════════');
  console.log('Phase 4: StorageManager 集成层 (getStorageService)');
  console.log('══════════════════════════════════════════');

  const phase = 'Phase 4';

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    record(phase, '4-x ALL', 'skip', 'BLOB_READ_WRITE_TOKEN 未设置，跳过 StorageManager 测试');
    return;
  }

  try {
    const storage = await getStorageService();
    record(phase, '4-1 Init', 'pass', 'StorageManager 实例化成功');

    // 上传测试文件
    const key = `e2e-tests/storage-manager-${Date.now()}.txt`;
    const result = await storage.uploadFile({
      body: Buffer.from('StorageManager E2E test'),
      key,
      contentType: 'text/plain',
      disposition: 'inline',
    });

    if (result.success) {
      record(phase, '4-2 Upload', 'pass', `StorageManager 上传成功 → ${result.url}`);
      // 清理
      try {
        await deleteFromBlob(result.url!);
        record(phase, '4-3 Cleanup', 'pass', '清理 StorageManager 测试文件成功');
      } catch (e: any) {
        record(phase, '4-3 Cleanup', 'fail', e.message);
      }
    } else {
      record(phase, '4-2 Upload', 'fail', result.error || 'unknown error');
    }
  } catch (e: any) {
    record(phase, '4-1 Init', 'fail', e.message);
  }
}

// ─────────────────────────────────────────────
// Cleanup: 删除所有测试上传文件
// ─────────────────────────────────────────────
async function cleanup(urls: string[]) {
  if (urls.length === 0) return;
  console.log('\n🧹 清理 Blob 测试文件...');
  for (const url of urls) {
    try {
      await deleteFromBlob(url);
      console.log(`  🗑  已删除: ${url.split('/').pop()}`);
    } catch (e: any) {
      console.log(`  ⚠️  删除失败 (${url.split('/').pop()}): ${e.message}`);
    }
  }
}

// ─────────────────────────────────────────────
// 汇总报告 + 主入口
// ─────────────────────────────────────────────
function printReport() {
  console.log('\n══════════════════════════════════════════');
  console.log('📊 端测报告汇总');
  console.log('══════════════════════════════════════════');

  const pass = results.filter(r => r.status === 'pass').length;
  const fail = results.filter(r => r.status === 'fail').length;
  const skip = results.filter(r => r.status === 'skip').length;

  if (fail > 0) {
    console.log('\n❌ 失败项目:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`  [${r.phase}][${r.step}] ${r.detail}`);
    });
  }

  console.log(`\n  总计: ${results.length} 项`);
  console.log(`  ✅ PASS: ${pass}`);
  console.log(`  ❌ FAIL: ${fail}`);
  console.log(`  ⚠️  SKIP: ${skip}`);
  console.log(`  通过率: ${results.length > 0 ? ((pass / (pass + fail)) * 100).toFixed(1) : 'N/A'}%`);

  if (fail === 0 && skip === 0) {
    console.log('\n🎉 所有测试项通过！Neon 数据库与 Vercel Blob 均正常。\n');
  } else if (fail === 0) {
    console.log('\n✅ 无失败项。部分功能因缺少环境变量被跳过。\n');
    console.log('💡 如需启用 Blob 测试，请配置 BLOB_READ_WRITE_TOKEN：');
    console.log('   Vercel Dashboard → Storage → Blob → Connect to Project\n');
  } else {
    console.log('\n⚠️  存在失败项，请根据上方提示排查。\n');
  }

  return fail;
}

async function main() {
  console.log('🚀 SoloBoard — Neon DB + Vercel Blob 端测');
  console.log(`   时间: ${new Date().toISOString()}`);
  console.log(`   环境: ${process.env.NODE_ENV || 'development'}`);

  const allBlobUrls: string[] = [];

  await testNeonDatabase();

  const phase2Urls = await testVercelBlobBasic();
  allBlobUrls.push(...phase2Urls);

  const phase3Urls = await testVercelBlobBusiness();
  allBlobUrls.push(...phase3Urls);

  await testStorageService();

  await cleanup(allBlobUrls);

  const failCount = printReport();
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('❌ 未捕获异常:', e);
  process.exit(1);
});

