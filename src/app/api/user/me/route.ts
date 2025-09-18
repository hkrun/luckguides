import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  try {
    // 获取 NextAuth token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.userId) {
      return NextResponse.json(
        { error: '未找到用户信息' },
        { status: 401 }
      );
    }

    const userId = token.userId as string;

    // 从数据库查询最新用户数据
    const { sql } = await import('@/lib/postgres-client');
    
    // 查询用户基本信息
    const { rows } = await sql`
      SELECT 
        id,
        user_id as "userId",
        email_address as email,
        username,
        first_name as "firstName",
        last_name as "lastName",
        credits,
        status,
        email_verified as "emailVerified"
      FROM nf_users 
      WHERE user_id = ${userId} AND status = '1'
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: '用户不存在或已被禁用' },
        { status: 404 }
      );
    }

    const user = rows[0];
    
    // 查询用户是否有有效订阅
    const { rows: subscriptionRows } = await sql`
      SELECT COUNT(*) as count
      FROM nf_subscription 
      WHERE user_id = ${userId} AND order_type = '1'
    `;
    
    const hasMember = subscriptionRows[0]?.count > 0;
    
    return NextResponse.json({
      success: true,
      user: {
        ...user,
        isAdmin: user.userId === process.env.APP_ROLE_ADMIN,
        hasMember: hasMember
      }
    });

  } catch (error) {
    console.error('API Error in /api/user/me:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 