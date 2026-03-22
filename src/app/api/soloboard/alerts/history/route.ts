/**
 * Alert History API
 * 
 * GET /api/dashboard/alerts/history - 获取报警历史
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { alertHistory } from '@/config/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/core/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 获取报警历史
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
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // 构建查询条件
    const conditions = [eq(alertHistory.userId, session.user.id)];
    if (siteId) {
      conditions.push(eq(alertHistory.siteId, siteId));
    }
    
    // 查询历史
    const history = await db()
      .select()
      .from(alertHistory)
      .where(and(...conditions))
      .orderBy(desc(alertHistory.createdAt))
      .limit(limit);
    
    return NextResponse.json({
      success: true,
      history: history.map(record => ({
        ...record,
        channels: JSON.parse(record.channels),
        data: record.data,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch alert history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert history' },
      { status: 500 }
    );
  }
}




