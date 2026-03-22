/**
 * dashboard - GA4 数据抓取服务
 * 
 * 使用 Google Analytics Data API 抓取实时和历史数�? * 
 * 支持的指标：
 * - 实时活跃用户
 * - 今日总用户数
 * - 今日页面浏览�? * - 今日会话�? */

import { google } from 'googleapis';

export interface GA4Config {
  clientEmail: string;
  privateKey: string;
  propertyId: string;
}

export interface GA4Metrics {
  liveUsers: number;
  todayUsers: number;
  todayViews: number;
  todaySessions: number;
  lastSync: string;
}

/**
 * 抓取 GA4 数据
 * 
 * @param config GA4 配置（Service Account�? * @returns GA4 指标数据
 */
export async function fetchGA4Metrics(config: GA4Config): Promise<GA4Metrics> {
  try {
    // 1. 创建 JWT 认证
    const auth = new google.auth.JWT({
      email: config.clientEmail,
      key: config.privateKey.replace(/\\n/g, '\n'), // 处理环境变量中的换行�?      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    // 2. 初始�?Analytics Data API
    const analyticsData = google.analyticsdata({
      version: 'v1beta',
      auth,
    });

    // 3. 获取实时活跃用户
    const realtimeResponse = await analyticsData.properties.runRealtimeReport({
      property: `properties/${config.propertyId}`,
      requestBody: {
        metrics: [{ name: 'activeUsers' }],
      },
    });

    // 4. 获取今日数据
    const dailyResponse = await analyticsData.properties.runReport({
      property: `properties/${config.propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: 'today', endDate: 'today' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
          { name: 'sessions' },
        ],
      },
    });

    // 5. 解析数据
    const liveUsers = parseInt(
      realtimeResponse.data.rows?.[0]?.metricValues?.[0]?.value || '0'
    );
    const todayUsers = parseInt(
      dailyResponse.data.rows?.[0]?.metricValues?.[0]?.value || '0'
    );
    const todayViews = parseInt(
      dailyResponse.data.rows?.[0]?.metricValues?.[1]?.value || '0'
    );
    const todaySessions = parseInt(
      dailyResponse.data.rows?.[0]?.metricValues?.[2]?.value || '0'
    );

    return {
      liveUsers,
      todayUsers,
      todayViews,
      todaySessions,
      lastSync: new Date().toISOString(),
    };
  } catch (error) {
    console.error('GA4 Fetch Error:', error);
    
    // 提供更详细的错误信息
    if (error instanceof Error) {
      throw new Error(`Failed to fetch GA4 metrics: ${error.message}`);
    }
    
    throw new Error('Failed to fetch GA4 metrics: Unknown error');
  }
}

/**
 * 验证 GA4 配置是否有效
 * 
 * @param config GA4 配置
 * @returns 是否有效
 */
export async function validateGA4Config(config: GA4Config): Promise<boolean> {
  try {
    await fetchGA4Metrics(config);
    return true;
  } catch (error) {
    console.error('GA4 Config Validation Failed:', error);
    return false;
  }
}







