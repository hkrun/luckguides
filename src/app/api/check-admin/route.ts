import { NextResponse } from 'next/server'
import { getToken } from "next-auth/jwt"

export async function GET(request: Request) {
  try {
    // 获取 NextAuth token
    const nextAuthToken = await getToken({
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET,
    })

    return NextResponse.json({
      adminId: process.env.APP_ROLE_ADMIN,
      nextAuth: {
        token: nextAuthToken,
        userId: nextAuthToken?.userId,
      },
      isAdmin: nextAuthToken?.userId === process.env.APP_ROLE_ADMIN
    }, { status: 200 })
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json({ error: 'Failed to check admin status' }, { status: 500 })
  }
} 