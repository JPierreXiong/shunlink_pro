/**
 * Cron Job: Check Alert Rules
 * 
 * 定时检查所有报警规则
 * 支持 QStash 和 Vercel Cron 两种方式
 * 
 * QStash 调度:
 * - 宕机检测: 每 5 分钟
 * - 收入/流量: 每 30 分钟
 * - 无销售: 每天 1 次
 * 
 * 使用方式:
 * GET /api/cron/check-alerts?type=offline
 * GET /api/cron/check-alerts?type=revenue_drop,traffic_spike
 * GET /api/cron/check-alerts (检查所有类型)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { alertRules, monitoredSites, alertHistory } from '@/config/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { sendAlert } from '@/shared/services/soloboard/email-alert-service';
import { verifyQStashSignature, verifyCronSecret } from '@/shared/lib/qstash-verify';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 最长执行 60 秒

/**
 * Cron Job 入口
 */
export async function GET(request: NextRequest) {
  try {
    // 验证请求来源（QStash 或 Cron Secret）
    const authHeader = request.headers.get('authorization');
    const qstashSignature = request.headers.get('upstash-signature');
    
    let isAuthorized = false;
    
    // 方式 1: QStash 签名验证
    if (qstashSignature) {
      const body = await request.text();
      isAuthorized = verifyQStashSignature(qstashSignature, body);
      if (!isAuthorized) {
        console.error('Invalid QStash signature');
      }
    }
    
    // 方式 2: Cron Secret 验证（备用）
    if (!isAuthorized && authHeader) {
      isAuthorized = verifyCronSecret(authHeader);
      if (!isAuthorized) {
        console.error('Invalid Cron Secret');
      }
    }
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('🔔 Starting alert check...');
    const startTime = Date.now();
    
    // 获取查询参数：检查类型
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type');
    const types = typeParam ? typeParam.split(',') : [];
    
    console.log(`Alert types to check: ${types.length > 0 ? types.join(', ') : 'all'}`);
    
    // 构建查询条件
    const conditions = [eq(alertRules.enabled, true)];
    if (types.length > 0) {
      conditions.push(inArray(alertRules.type, types));
    }
    
    // 获取启用的报警规则
    const rules = await db()
      .select()
      .from(alertRules)
      .where(and(...conditions));
    
    console.log(`Found ${rules.length} enabled alert rules`);
    
    let checkedCount = 0;
    let triggeredCount = 0;
    const errors: string[] = [];
    
    // 检查每个规则
    for (const rule of rules) {
      try {
        checkedCount++;
        
        // 获取站点信息
        const [site] = await db()
          .select()
          .from(monitoredSites)
          .where(eq(monitoredSites.id, rule.siteId))
          .limit(1);
        
        if (!site) {
          console.warn(`Site not found: ${rule.siteId}`);
          continue;
        }
        
        // 检查是否应该触发报警
        const shouldTrigger = await evaluateAlertRule(rule, site);
        
        if (shouldTrigger && canTriggerAlert(rule)) {
          // 触发报警
          await triggerAlert(rule, site);
          triggeredCount++;
        }
      } catch (error) {
        const errorMsg = `Failed to check rule ${rule.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ Alert check completed: ${checkedCount} checked, ${triggeredCount} triggered, ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      message: 'Alert check completed',
      types: types.length > 0 ? types : ['all'],
      checked: checkedCount,
      triggered: triggeredCount,
      duration,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Alert check failed:', error);
    return NextResponse.json(
      { 
        error: 'Alert check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * 评估报警规则
 */
async function evaluateAlertRule(rule: any, site: any): Promise<boolean> {
  switch (rule.type) {
    case 'offline':
      return await checkOfflineAlert(site);
    
    case 'revenue_drop':
      return await checkRevenueDropAlert(site, rule.threshold);
    
    case 'traffic_spike':
      return await checkTrafficSpikeAlert(site, rule.threshold);
    
    case 'no_sales':
      return await checkNoSalesAlert(site);
    
    default:
      return false;
  }
}

/**
 * 检查网站是否离线
 */
async function checkOfflineAlert(site: any): Promise<boolean> {
  try {
    const url = site.url || `https://${site.domain}`;
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000),
    });
    
    return !response.ok;
  } catch (error) {
    return true; // 请求失败视为离线
  }
}

/**
 * 检查收入下降
 */
async function checkRevenueDropAlert(site: any, threshold: number): Promise<boolean> {
  // TODO: 实现收入下降检测逻辑
  // 需要查询历史数据并计算平均值
  return false;
}

/**
 * 检查流量激增
 */
async function checkTrafficSpikeAlert(site: any, threshold: number): Promise<boolean> {
  // TODO: 实现流量激增检测逻辑
  return false;
}

/**
 * 检查无销售
 */
async function checkNoSalesAlert(site: any): Promise<boolean> {
  // TODO: 实现无销售检测逻辑
  return false;
}

/**
 * 检查是否可以触发报警（频率限制）
 */
function canTriggerAlert(rule: any): boolean {
  if (!rule.lastTriggeredAt) {
    return true;
  }
  
  const now = new Date();
  const lastTriggered = new Date(rule.lastTriggeredAt);
  const timeDiff = now.getTime() - lastTriggered.getTime();
  
  switch (rule.frequency) {
    case 'immediate':
      return timeDiff > 5 * 60 * 1000; // 5 分钟
    
    case 'daily':
      return timeDiff > 24 * 60 * 60 * 1000; // 24 小时
    
    case 'weekly':
      return timeDiff > 7 * 24 * 60 * 60 * 1000; // 7 天
    
    default:
      return false;
  }
}

/**
 * 触发报警
 */
async function triggerAlert(rule: any, site: any): Promise<void> {
  const channels = JSON.parse(rule.channels);
  const historyId = nanoid();
  
  try {
    // 发送邮件报警
    if (channels.includes('email')) {
      const result = await sendAlert({
        userId: rule.userId,
        userEmail: site.userEmail || 'support@soloboard.app', // TODO: 从 user 表获取
        userName: site.userName,
        siteName: site.name,
        siteUrl: site.url || site.domain,
        alertType: rule.type,
        details: {
          lastChecked: new Date().toISOString(),
        },
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email');
      }
    }
    
    // 记录报警历史
    await db().insert(alertHistory).values({
      id: historyId,
      ruleId: rule.id,
      siteId: site.id,
      userId: rule.userId,
      type: rule.type,
      status: 'sent',
      channels: rule.channels,
      data: {
        siteName: site.name,
        domain: site.domain,
        triggeredAt: new Date().toISOString(),
      },
      createdAt: new Date(),
    });
    
    // 更新最后触发时间
    await db()
      .update(alertRules)
      .set({ lastTriggeredAt: new Date() })
      .where(eq(alertRules.id, rule.id));
    
    console.log(`✅ Alert triggered: ${rule.type} for site ${site.name}`);
  } catch (error) {
    console.error(`Failed to trigger alert:`, error);
    
    // 记录失败历史
    await db().insert(alertHistory).values({
      id: historyId,
      ruleId: rule.id,
      siteId: site.id,
      userId: rule.userId,
      type: rule.type,
      status: 'failed',
      channels: rule.channels,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      createdAt: new Date(),
    });
  }
}

