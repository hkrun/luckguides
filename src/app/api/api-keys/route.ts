import { NextRequest, NextResponse } from 'next/server'
import { 
  createApiKey, 
  getUserApiKeys, 
  deleteApiKey, 
  updateApiKeyStatus,
  getApiUsageStats,
  CreateApiKeyParams 
} from '@/lib/api-keys'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

/**
 * 获取用户的API密钥列表
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

    const result = await getUserApiKeys()
    
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
    console.error('获取API密钥列表失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

/**
 * 创建新的API密钥
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, monthlyLimit, expiresAt } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'API密钥名称不能为空' },
        { status: 400 }
      )
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'API密钥名称不能超过100个字符' },
        { status: 400 }
      )
    }

    const params: CreateApiKeyParams = {
      name: name.trim(),
      description: description?.trim(),
      monthlyLimit: monthlyLimit ? parseInt(monthlyLimit) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    }

    // 验证月度限制
    if (params.monthlyLimit && (params.monthlyLimit < 1 || params.monthlyLimit > 100000)) {
      return NextResponse.json(
        { error: '月度限制必须在1-100000之间' },
        { status: 400 }
      )
    }

    // 验证过期时间
    if (params.expiresAt && params.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: '过期时间必须是未来的时间' },
        { status: 400 }
      )
    }

    const result = await createApiKey(params)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      apiKey: result.apiKey, // 完整的API密钥只在创建时返回
      data: result.data
    })

  } catch (error) {
    console.error('创建API密钥失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

/**
 * 删除API密钥
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const apiKeyId = searchParams.get('id')

    if (!apiKeyId || isNaN(parseInt(apiKeyId))) {
      return NextResponse.json(
        { error: '无效的API密钥ID' },
        { status: 400 }
      )
    }

    const result = await deleteApiKey(parseInt(apiKeyId))
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'API密钥已删除'
    })

  } catch (error) {
    console.error('删除API密钥失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

/**
 * 更新API密钥状态
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, status } = body

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: '无效的API密钥ID' },
        { status: 400 }
      )
    }

    if (status !== '1' && status !== '0') {
      return NextResponse.json(
        { error: '无效的状态值' },
        { status: 400 }
      )
    }

    const result = await updateApiKeyStatus(parseInt(id), status)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `API密钥已${status === '1' ? '启用' : '禁用'}`
    })

  } catch (error) {
    console.error('更新API密钥状态失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
