/**
 * GET /api/dashboard/sites/[siteId]
 * 获取站点配置信息
 * 
 * PATCH /api/dashboard/sites/[siteId]
 * 更新站点配置
 * 
 * DELETE /api/dashboard/sites/[siteId]
 * 删除监控站点
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { monitoredSites, siteMetricsHistory, syncLogs } from '@/config/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/core/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 辅助函数：遮蔽 API Key
function maskApiKey(key: string): string {
  if (!key || key.length < 8) return key;
  return `${key.substring(0, 4)}${'*'.repeat(Math.max(8, key.length - 8))}${key.substring(key.length - 4)}`;
}

// GET - 获取站点配置
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    
    // 验证用户身份
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 获取站点信息
    const [site] = await db().select()
      .from(monitoredSites)
      .where(eq(monitoredSites.id, siteId))
      .limit(1);
    
    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }
    
    if (site.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // 从 apiConfig jsonb 读取 API 配置（遮蔽敏感信息）
    const cfg: Record<string, any> = (site.apiConfig as Record<string, any>) ?? {};

    return NextResponse.json({
      id: site.id,
      name: site.name,
      domain: site.domain,
      platform: site.platform,
      status: site.status,
      stripeKey: cfg.stripeKey ? maskApiKey(cfg.stripeKey) : null,
      ga4PropertyId: cfg.ga4PropertyId || null,
      shopifyDomain: cfg.shopifyDomain || null,
      shopifyAccessToken: cfg.shopifyAccessToken ? maskApiKey(cfg.shopifyAccessToken) : null,
      lemonApiKey: cfg.lemonApiKey ? maskApiKey(cfg.lemonApiKey) : null,
      creemApiKey: cfg.creemApiKey ? maskApiKey(cfg.creemApiKey) : null,
      syncInterval: cfg.syncInterval || 3600,
    });
  } catch (error) {
    console.error('Failed to get site config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - 更新站点配置
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const body = await request.json();
    
    // 验证用户身份
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 验证站点所有权
    const [site] = await db().select()
      .from(monitoredSites)
      .where(eq(monitoredSites.id, siteId))
      .limit(1);
    
    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }
    
    if (site.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // 准备更新数据
    const updateData: any = {
      updatedAt: new Date(),
    };

    // 直接列字段
    if (body.name !== undefined) updateData.name = body.name;
    if (body.platform !== undefined) updateData.platform = body.platform;
    if (body.status !== undefined) updateData.status = body.status;

    // API 配置字段存入 apiConfig jsonb（合并现有配置）
    const apiConfigFields = ['stripeKey', 'ga4PropertyId', 'shopifyDomain',
      'shopifyAccessToken', 'lemonApiKey', 'syncInterval', 'creemApiKey'];
    const hasApiConfigUpdate = apiConfigFields.some((f) => body[f] !== undefined);

    if (hasApiConfigUpdate) {
      // 合并现有 apiConfig
      const existingConfig: Record<string, any> =
        (site.apiConfig as Record<string, any>) ?? {};
      const newApiConfig = { ...existingConfig };

      if (body.stripeKey !== undefined && !String(body.stripeKey).includes('*')) {
        newApiConfig.stripeKey = body.stripeKey;
      }
      if (body.ga4PropertyId !== undefined) {
        newApiConfig.ga4PropertyId = body.ga4PropertyId;
      }
      if (body.shopifyDomain !== undefined) {
        newApiConfig.shopifyDomain = body.shopifyDomain;
      }
      if (body.shopifyAccessToken !== undefined && !String(body.shopifyAccessToken).includes('*')) {
        newApiConfig.shopifyAccessToken = body.shopifyAccessToken;
      }
      if (body.lemonApiKey !== undefined && !String(body.lemonApiKey).includes('*')) {
        newApiConfig.lemonApiKey = body.lemonApiKey;
      }
      if (body.syncInterval !== undefined) {
        newApiConfig.syncInterval = body.syncInterval;
      }
      if (body.creemApiKey !== undefined && !String(body.creemApiKey).includes('*')) {
        newApiConfig.creemApiKey = body.creemApiKey;
      }

      updateData.apiConfig = newApiConfig;
    }

    // 更新数据库
    await db().update(monitoredSites)
      .set(updateData)
      .where(eq(monitoredSites.id, siteId));
    
    return NextResponse.json({
      success: true,
      message: 'Site updated successfully',
    });
  } catch (error) {
    console.error('Failed to update site:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - 删除站点
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    
    // 1. 验证用户身份
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 2. 验证站点所有权
    const [site] = await db().select()
      .from(monitoredSites)
      .where(eq(monitoredSites.id, siteId))
      .limit(1);
    
    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }
    
    if (site.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this site' },
        { status: 403 }
      );
    }
    
    // 3. 删除相关数据（级联删除）
    try {
      // 删除历史数据（如果存在）
      await db().delete(siteMetricsHistory)
        .where(eq(siteMetricsHistory.siteId, siteId));
    } catch (error) {
      console.log('No history data to delete or error:', error);
    }
    
    try {
      // 删除同步日志（如果存在）
      await db().delete(syncLogs)
        .where(eq(syncLogs.siteId, siteId));
    } catch (error) {
      console.log('No sync logs to delete or error:', error);
    }
    
    // 删除站点记录（主要操作）
    await db().delete(monitoredSites)
      .where(eq(monitoredSites.id, siteId));
    
    return NextResponse.json({
      success: true,
      message: 'Site deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete site:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
