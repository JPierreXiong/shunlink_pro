export const dynamic = 'force-dynamic';

/**
 * Admin Users API
 * View and manage all users
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth';
import { db } from '@/core/db';
import { user, order, subscription } from '@/config/db/schema';
import { isAdmin } from '@/config/admin';
import { eq, like, or, sql } from 'drizzle-orm';

/**
 * GET user list
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const planFilter = searchParams.get('plan') || '';

    const offset = (page - 1) * limit;
    const database = db();

    let whereConditions: any[] = [];

    if (search) {
      whereConditions.push(
        or(
          like(user.email, `%${search}%`),
          like(user.name, `%${search}%`)
        )
      );
    }

    if (planFilter) {
      whereConditions.push(eq(user.planType, planFilter));
    }

    const users = await database
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        planType: user.planType,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(whereConditions.length > 0 ? sql`${whereConditions.join(' AND ')}` : undefined)
      .orderBy(sql`${user.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    const totalCount = await database
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(whereConditions.length > 0 ? sql`${whereConditions.join(' AND ')}` : undefined);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: Number(totalCount[0]?.count || 0),
        totalPages: Math.ceil(Number(totalCount[0]?.count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Admin users list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update user plan (admin action)
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, planType, reason } = body;

    if (!userId || !planType) {
      return NextResponse.json(
        { error: 'userId and planType are required' },
        { status: 400 }
      );
    }

    if (!['free', 'base', 'pro'].includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    const database = db();

    await database
      .update(user)
      .set({
        planType,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    console.log('Admin action:', {
      admin: session.user.email,
      action: 'update_user_plan',
      userId,
      newPlan: planType,
      reason,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'User plan updated successfully',
    });
  } catch (error: any) {
    console.error('Admin update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user', message: error.message },
      { status: 500 }
    );
  }
}
