import { NextRequest, NextResponse } from 'next/server'
import { getApiUsageStats } from '@/lib/api-keys'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

/**
 * 获取API使用统计
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const apiKeyId = searchParams.get('apiKeyId')

    let parsedApiKeyId: number | undefined
    if (apiKeyId) {
      parsedApiKeyId = parseInt(apiKeyId)
      if (isNaN(parsedApiKeyId)) {
        return NextResponse.json(
          { error: '无效的API密钥ID' },
          { status: 400 }
        )
      }
    }

    const result = await getApiUsageStats(parsedApiKeyId)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('获取API使用统计失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
