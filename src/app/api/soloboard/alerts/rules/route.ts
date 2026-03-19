/**
 * Alert Rules API
 * 
 * GET /api/soloboard/alerts/rules - 获取用户的所有报警规则
 * POST /api/soloboard/alerts/rules - 创建新的报警规则
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { alertRules } from '@/config/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/core/auth';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 获取用户的所有报警规则
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    
    // 构建查询条件
    const conditions = [eq(alertRules.userId, session.user.id)];
    if (siteId) {
      conditions.push(eq(alertRules.siteId, siteId));
    }
    
    // 查询规则
    const rules = await db()
      .select()
      .from(alertRules)
      .where(and(...conditions));
    
    return NextResponse.json({
      success: true,
      rules: rules.map(rule => ({
        ...rule,
        channels: JSON.parse(rule.channels),
      })),
    });
  } catch (error) {
    console.error('Failed to fetch alert rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert rules' },
      { status: 500 }
    );
  }
}

/**
 * 创建新的报警规则
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { siteId, type, threshold, frequency, channels } = body;
    
    // 验证必填字段
    if (!siteId || !type || threshold === undefined || !frequency || !channels) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // 验证类型
    const validTypes = ['offline', 'revenue_drop', 'traffic_spike', 'no_sales'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid alert type' },
        { status: 400 }
      );
    }
    
    // 验证频率
    const validFrequencies = ['immediate', 'daily', 'weekly'];
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency' },
        { status: 400 }
      );
    }
    
    // 创建规则
    const ruleId = nanoid();
    await db().insert(alertRules).values({
      id: ruleId,
      userId: session.user.id,
      siteId,
      type,
      threshold,
      frequency,
      channels: JSON.stringify(channels),
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return NextResponse.json({
      success: true,
      rule: {
        id: ruleId,
        siteId,
        type,
        threshold,
        frequency,
        channels,
        enabled: true,
      },
    });
  } catch (error) {
    console.error('Failed to create alert rule:', error);
    return NextResponse.json(
      { error: 'Failed to create alert rule' },
      { status: 500 }
    );
  }
}



