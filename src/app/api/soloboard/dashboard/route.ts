/**
 * API: Get All Sites with Metrics
 * 获取用户所有站点及其实时指�? * 
 * 🔧 优化版：简化错误处理，优雅降级
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth';
import { db } from '@/core/db';
import { monitoredSites, siteMetricsDaily } from '@/config/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { aggregateSiteData } from '@/shared/services/dashboard/aggregation-service';
import { detectAnomaly, calculateHistoricalAverage } from '@/shared/services/dashboard/anomaly-detection';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 从数据库获取用户的所有站�?    let userSites = [];
    try {
      userSites = await db()
        .select()
        .from(monitoredSites)
        .where(eq(monitoredSites.userId, session.user.id));
    } catch (dbError) {
      console.error('Database error:', dbError);
      // 返回空数据而不是错误，让前端显示空状�?      return NextResponse.json({
        sites: [],
        summary: {
          totalSites: 0,
          totalRevenue: 0,
          totalVisitors: 0,
          sitesOnline: 0,
        },
        lastUpdated: new Date().toISOString(),
      });
    }

    // 如果没有站点，直接返回空数据
    if (userSites.length === 0) {
      return NextResponse.json({
        sites: [],
        summary: {
          totalSites: 0,
          totalRevenue: 0,
          totalVisitors: 0,
          sitesOnline: 0,
        },
        lastUpdated: new Date().toISOString(),
      });
    }

    // 获取7天前的日�?    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 并行获取所有站点的实时数据和历史数�?    const sites = await Promise.all(
      userSites.map(async (site) => {
        const apiConfig = site.apiConfig as any || {};
        const platforms = apiConfig.platforms || {};

        // 1. 获取实时数据（调用聚合服务）- 优雅降级
        let liveMetrics = {
          revenue: { today: 0, sources: {} },
          visitors: { today: 0, sources: {} },
          uptime: { status: 'up' as 'up' | 'down', responseTime: 0 },
        };

        try {
          liveMetrics = await aggregateSiteData({
            id: site.id,
            domain: site.domain || site.url?.replace(/^https?:\/\//, '') || 'unknown',
            platforms,
          });
        } catch (error) {
          console.error(`Error fetching live metrics for ${site.domain || site.url}:`, error);
          // 继续使用默认�?        }

        // 2. 获取历史数据（最�?天）- 优雅降级
        let historyData: any[] = [];
        try {
          historyData = await db()
            .select()
            .from(siteMetricsDaily)
            .where(
              and(
                eq(siteMetricsDaily.siteId, site.id),
                gte(siteMetricsDaily.date, sevenDaysAgo)
              )
            )
            .orderBy(desc(siteMetricsDaily.date));
        } catch (error) {
          console.error(`Error fetching history for ${site.domain || site.url}:`, error);
          // 继续使用空数�?        }

        // 3. 计算历史平均�?        const historical = calculateHistoricalAverage(
          historyData.map(d => ({
            revenue: d.revenue || 0,
            visitors: d.visitors || 0,
          }))
        );

        // 4. 异常检�?        const anomaly = detectAnomaly(
          {
            revenue: liveMetrics.revenue.today,
            visitors: liveMetrics.visitors.today,
            uptimeStatus: liveMetrics.uptime.status,
          },
          historical
        );

        return {
          id: site.id,
          name: site.name,
          domain: site.domain || site.url?.replace(/^https?:\/\//, '') || 'Unknown Site',
          logoUrl: site.logoUrl,
          status: anomaly.status,
          alert: anomaly.alert,
          todayRevenue: liveMetrics.revenue.today,
          todayVisitors: liveMetrics.visitors.today,
          avgRevenue7d: historical.avgRevenue7d,
          avgVisitors7d: historical.avgVisitors7d,
          platforms: Object.keys(platforms),
          responseTime: liveMetrics.uptime.responseTime,
        };
      })
    );

    // 计算汇总数�?    const summary = {
      totalSites: sites.length,
      totalRevenue: sites.reduce((sum, site) => sum + site.todayRevenue, 0),
      totalVisitors: sites.reduce((sum, site) => sum + site.todayVisitors, 0),
      sitesOnline: sites.filter(site => site.status === 'online').length,
    };

    return NextResponse.json({
      sites,
      summary,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching sites:', error);
    
    // 返回详细错误信息用于调试
    return NextResponse.json(
      { 
        error: 'Failed to fetch sites',
        details: error instanceof Error ? error.message : 'Unknown error',
        sites: [],
        summary: {
          totalSites: 0,
          totalRevenue: 0,
          totalVisitors: 0,
          sitesOnline: 0,
        },
      },
      { status: 500 }
    );
  }
}


