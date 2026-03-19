/**
 * Alert Rule Management API
 * 
 * PATCH /api/soloboard/alerts/rules/[ruleId] - 更新报警规则
 * DELETE /api/soloboard/alerts/rules/[ruleId] - 删除报警规则
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { alertRules } from '@/config/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/core/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 更新报警规则
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const { ruleId } = await params;
    
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
    
    // 验证规则所有权
    const [rule] = await db()
      .select()
      .from(alertRules)
      .where(
        and(
          eq(alertRules.id, ruleId),
          eq(alertRules.userId, session.user.id)
        )
      )
      .limit(1);
    
    if (!rule) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      );
    }
    
    // 准备更新数据
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (body.threshold !== undefined) updateData.threshold = body.threshold;
    if (body.frequency !== undefined) updateData.frequency = body.frequency;
    if (body.channels !== undefined) updateData.channels = JSON.stringify(body.channels);
    if (body.enabled !== undefined) updateData.enabled = body.enabled;
    
    // 更新规则
    await db()
      .update(alertRules)
      .set(updateData)
      .where(eq(alertRules.id, ruleId));
    
    return NextResponse.json({
      success: true,
      message: 'Rule updated successfully',
    });
  } catch (error) {
    console.error('Failed to update alert rule:', error);
    return NextResponse.json(
      { error: 'Failed to update alert rule' },
      { status: 500 }
    );
  }
}

/**
 * 删除报警规则
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const { ruleId } = await params;
    
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 验证规则所有权
    const [rule] = await db()
      .select()
      .from(alertRules)
      .where(
        and(
          eq(alertRules.id, ruleId),
          eq(alertRules.userId, session.user.id)
        )
      )
      .limit(1);
    
    if (!rule) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      );
    }
    
    // 删除规则
    await db()
      .delete(alertRules)
      .where(eq(alertRules.id, ruleId));
    
    return NextResponse.json({
      success: true,
      message: 'Rule deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete alert rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert rule' },
      { status: 500 }
    );
  }
}



