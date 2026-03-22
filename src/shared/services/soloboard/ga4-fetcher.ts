/**
 * dashboard - Google Analytics 4 数据抓取服务
 * 
 * 用于�?GA4 获取实时在线人数、页面浏览量等指�? * 
 * 使用 Google Analytics Data API v1
 * 文档: https://developers.google.com/analytics/devguides/reporting/data/v1
 */

import { BetaAnalyticsDataClient } from '@google-analytics/data';
import type { SiteApiConfig } from '@/shared/lib/site-crypto';

/**
 * GA4 指标数据类型
 */
export interface GA4Metrics {
  activeUsers: number; // 实时在线用户�?  pageViews: number; // 今日页面浏览�?  sessions: number; // 今日会话�?  newUsers: number; // 今日新用户数
  averageSessionDuration: number; // 平均会话时长（秒�?  bounceRate: number; // 跳出率（百分比）
  updatedAt: string; // 更新时间（ISO 8601�?}

/**
 * �?GA4 获取实时指标
 * 
 * @param config - GA4 API 配置
 * @returns GA4 指标数据
 */
export async function fetchGA4Metrics(
  config: NonNullable<SiteApiConfig['ga4']>
): Promise<GA4Metrics> {
  try {
    // 解析 Service Account 凭证
    const credentials = JSON.parse(config.credentials);
    
    // 初始�?GA4 客户�?    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
    });
    
    // 获取实时在线用户�?    const realtimeResponse = await analyticsDataClient.runRealtimeReport({
      property: `properties/${config.propertyId}`,
      metrics: [
        { name: 'activeUsers' },
      ],
    });
    
    const activeUsers = parseInt(
      realtimeResponse[0]?.rows?.[0]?.metricValues?.[0]?.value || '0'
    );
    
    // 获取今日统计数据
    const todayResponse = await analyticsDataClient.runReport({
      property: `properties/${config.propertyId}`,
      dateRanges: [
        {
          startDate: 'today',
          endDate: 'today',
        },
      ],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'newUsers' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
    });
    
    const row = todayResponse[0]?.rows?.[0];
    const pageViews = parseInt(row?.metricValues?.[0]?.value || '0');
    const sessions = parseInt(row?.metricValues?.[1]?.value || '0');
    const newUsers = parseInt(row?.metricValues?.[2]?.value || '0');
    const averageSessionDuration = parseFloat(row?.metricValues?.[3]?.value || '0');
    const bounceRate = parseFloat(row?.metricValues?.[4]?.value || '0') * 100;
    
    return {
      activeUsers,
      pageViews,
      sessions,
      newUsers,
      averageSessionDuration,
      bounceRate,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('GA4 fetch error:', error);
    throw new Error(
      `Failed to fetch GA4 metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * 验证 GA4 配置是否有效
 * 
 * @param config - GA4 API 配置
 * @returns true 如果配置有效
 */
export async function validateGA4Config(
  config: NonNullable<SiteApiConfig['ga4']>
): Promise<boolean> {
  try {
    await fetchGA4Metrics(config);
    return true;
  } catch {
    return false;
  }
}

/**
 * 格式�?GA4 指标为显示文�? * 
 * @param metrics - GA4 指标数据
 * @returns 格式化后的文本对�? */
export function formatGA4Metrics(metrics: GA4Metrics) {
  return {
    activeUsers: metrics.activeUsers.toLocaleString(),
    pageViews: metrics.pageViews.toLocaleString(),
    sessions: metrics.sessions.toLocaleString(),
    newUsers: metrics.newUsers.toLocaleString(),
    averageSessionDuration: `${Math.round(metrics.averageSessionDuration)}s`,
    bounceRate: `${metrics.bounceRate.toFixed(1)}%`,
  };
}

























