/**
 * dashboard - Cron Job: 数据同步 + 邮件告警
 * 
 * QStash 定时任务�? * - 免费用户: 每天 2 次（9:00, 21:00�? * - 付费用户: 每天 8 次（�?3 小时�? * 
 * 功能�? * 1. 同步站点数据
 * 2. 检测异常（宕机、无销售、流量骤降）
 * 3. 发送邮件告�? * 
 * 查询参数:
 * - plan: 'free' | 'paid' | 'all' (默认: 'all')
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncAllSites } from '@/shared/services/dashboard/sync-service';
import { db } from '@/core/db';
import { monitoredSites, siteMetricsDaily, user } from '@/config/db/schema';
import { eq, and, gte, desc, inArray } from 'drizzle-orm';
import { detectAnomaly, calculateHistoricalAverage } from '@/shared/services/dashboard/anomaly-detection';
import { sendAlert } from '@/shared/services/dashboard/email-alert-service';
import { verifyQStashSignature, verifyCronSecret } from '@/shared/lib/qstash-verify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 分钟超时

/**
 * Cron Job 处理函数
 * 
 * 安全验证�? * 1. QStash 签名验证（推荐）
 * 2. Authorization header 中的 Bearer Token（备用）
 */
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const planType = searchParams.get('plan') || 'all'; // 'free' | 'paid' | 'all'
    
    // 验证请求来源
    const authHeader = request.headers.get('authorization');
    const qstashSignature = request.headers.get('upstash-signature');
    
    let isAuthorized = false;
    
    // 方式 1: QStash 签名验证
    if (qstashSignature) {
      const body = await request.text();
      isAuthorized = verifyQStashSignature(qstashSignature, body);
    }
    
    // 方式 2: Cron Secret 验证（备用）
    if (!isAuthorized && authHeader) {
      isAuthorized = verifyCronSecret(authHeader);
    }
    
    if (!isAuthorized) {
      console.warn('⚠️ [Cron] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log(`🚀 [Cron] Starting site data sync for plan: ${planType}...`);
    
    // 1. 执行同步（按计划类型过滤�?    const syncResult = await syncSitesByPlan(planType);
    console.log('�?[Cron] Sync completed:', syncResult);
    
    // 2. 检查站点的异常并发送告�?    const alertsResult = await checkAndSendAlerts(planType);
    console.log('�?[Cron] Alerts check completed:', alertsResult);
    
    return NextResponse.json({
      success: true,
      message: `Site data sync and alerts completed for ${planType} users`,
      plan: planType,
      sync: syncResult,
      alerts: alertsResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('�?[Cron] Sync failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 按计划类型同步站�? */
async function syncSitesByPlan(planType: string) {
  try {
    // 构建用户计划过滤条件
    let userPlanFilter;
    if (planType === 'free') {
      userPlanFilter = eq(user.plan, 'free');
    } else if (planType === 'paid') {
      userPlanFilter = inArray(user.plan, ['base', 'pro']);
    }
    
    // 获取符合条件的站�?    const sitesQuery = db()
      .select({
        site: monitoredSites,
        user: user,
      })
      .from(monitoredSites)
      .innerJoin(user, eq(monitoredSites.userId, user.id))
      .where(eq(monitoredSites.status, 'active'));
    
    // 应用计划过滤
    const allSites = await sitesQuery;
    const sites = userPlanFilter 
      ? allSites.filter(s => {
          if (planType === 'free') return s.user.plan === 'free';
          if (planType === 'paid') return s.user.plan === 'base' || s.user.plan === 'pro';
          return true;
        })
      : allSites;
    
    console.log(`📊 [Sync] Found ${sites.length} sites for plan: ${planType}`);
    
    // 过滤出有 API 配置的站�?    const sitesToSync = sites.filter(s => {
      const apiConfig = s.site.apiConfig as any;
      return apiConfig && Object.keys(apiConfig).length > 0;
    });
    
    console.log(`📊 [Sync] Syncing ${sitesToSync.length} sites with API config`);
    
    // 执行同步
    const syncResult = await syncAllSites();
    
    return {
      totalSites: sites.length,
      sitesWithConfig: sitesToSync.length,
      syncResult,
    };
  } catch (error) {
    console.error('�?[Sync] Failed to sync sites:', error);
    throw error;
  }
}
/**
 * 检查所有站点的异常并发送告�? */
async function checkAndSendAlerts(planType: string = 'all') {
  try {
    // 构建查询条件
    const conditions = [eq(monitoredSites.status, 'active')];
    
    // 获取所有活跃站点（带用户信息）
    const sitesData = await db()
      .select({
        site: monitoredSites,
        user: user,
      })
      .from(monitoredSites)
      .innerJoin(user, eq(monitoredSites.userId, user.id))
      .where(and(...conditions));
    
    // 按计划类型过�?    const sites = sitesData.filter(s => {
      if (planType === 'free') return s.user.plan === 'free';
      if (planType === 'paid') return s.user.plan === 'base' || s.user.plan === 'pro';
      return true;
    });
    
    const alertsSent = {
      downtime: 0,
      noSales: 0,
      trafficDrop: 0,
      total: 0,
    };
    
    // 获取7天前的日�?    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // 检查每个站�?    for (const { site, user: siteUser } of sites) {
      try {
        if (!siteUser || !siteUser.email) {
          console.log(`⚠️ [Alert] No user email for site ${site.name}`);
          continue;
        }
        
        // 获取历史数据
        const historyData = await db()
          .select()
          .from(siteMetricsDaily)
          .where(
            and(
              eq(siteMetricsDaily.siteId, site.id),
              gte(siteMetricsDaily.date, sevenDaysAgo)
            )
          )
          .orderBy(desc(siteMetricsDaily.date));
        
        // 计算历史平均�?        const historical = calculateHistoricalAverage(
          historyData.map(d => ({
            revenue: d.revenue || 0,
            visitors: d.visitors || 0,
          }))
        );
        
        // 获取今日数据（从 lastSnapshot 或最新的 metrics�?        const todayData = site.lastSnapshot as any || {};
        const todayRevenue = todayData.revenue?.today || 0;
        const todayVisitors = todayData.visitors?.today || 0;
        const uptimeStatus = site.lastSyncStatus === 'success' ? 'up' : 'down';
        
        // 检测异�?        const anomaly = detectAnomaly(
          {
            revenue: todayRevenue,
            visitors: todayVisitors,
            uptimeStatus: uptimeStatus as 'up' | 'down',
          },
          historical
        );
        
        // 发送告�?        if (anomaly.alert) {
          const alertConfig = {
            userId: site.userId,
            userEmail: siteUser.email,
            userName: siteUser.name || undefined,
            siteName: site.name,
            siteUrl: site.url || `https://${site.domain}`,
            alertType: anomaly.alert.type,
            details: {
              lastChecked: site.lastSyncAt?.toISOString(),
              errorMessage: site.lastSyncError || undefined,
              avgRevenue7d: historical.avgRevenue7d,
              todayVisitors: todayVisitors,
              avgVisitors7d: historical.avgVisitors7d,
              dropPercentage: anomaly.alert.type === 'low_traffic' 
                ? Math.round(((historical.avgVisitors7d - todayVisitors) / historical.avgVisitors7d) * 100)
                : undefined,
            },
          };
          
          const result = await sendAlert(alertConfig);
          
          if (result.success) {
            alertsSent.total++;
            if (anomaly.alert.type === 'site_down') alertsSent.downtime++;
            if (anomaly.alert.type === 'no_sales') alertsSent.noSales++;
            if (anomaly.alert.type === 'low_traffic') alertsSent.trafficDrop++;
            
            console.log(`�?[Alert] Sent ${anomaly.alert.type} alert for ${site.name}`);
          }
        }
      } catch (error) {
        console.error(`�?[Alert] Failed to check site ${site.name}:`, error);
      }
    }
    
    return {
      sitesChecked: sites.length,
      alertsSent,
    };
  } catch (error) {
    console.error('�?[Alert] Failed to check alerts:', error);
    return {
      sitesChecked: 0,
      alertsSent: { downtime: 0, noSales: 0, trafficDrop: 0, total: 0 },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}


