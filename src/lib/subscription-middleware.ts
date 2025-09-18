import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { hasValidSubscription } from '@/actions/user-order'
import {
  SubscriptionPlan,
  Feature,
  checkFeaturePermission,
  mapSubscriptionDescToPlan
} from '@/lib/subscription-plans'

/**
 * 检查用户是否有有效订阅的中间件（保持向后兼容）
 * @param request NextRequest对象
 * @returns 如果有有效订阅返回null，否则返回错误响应
 */
export async function checkSubscription(request: NextRequest): Promise<NextResponse | null> {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions)

    // 如果用户未登录
    if (!session?.user) {
      return NextResponse.json(
        {
          error: '请先登录',
          code: 'NOT_AUTHENTICATED',
          message: '此功能需要登录后使用'
        },
        { status: 401 }
      )
    }

    // 检查订阅状态
    const subscriptionStatus = await hasValidSubscription()

    // 如果没有有效订阅
    if (!subscriptionStatus.hasValidSubscription) {
      return NextResponse.json(
        {
          error: '需要订阅',
          code: 'SUBSCRIPTION_REQUIRED',
          message: '此功能仅限订阅用户使用，请先订阅我们的服务',
          subscriptionStatus
        },
        { status: 403 }
      )
    }

    // 有有效订阅，返回null表示通过检查
    return null

  } catch (error) {
    console.error('订阅检查失败:', error)
    return NextResponse.json(
      {
        error: '服务暂时不可用',
        code: 'SUBSCRIPTION_CHECK_FAILED',
        message: '无法验证订阅状态，请稍后重试'
      },
      { status: 500 }
    )
  }
}

/**
 * 检查用户是否有权限使用特定功能
 * @param request NextRequest对象
 * @param feature 要检查的功能
 * @param currentLang 当前语言
 * @returns 如果有权限返回null，否则返回错误响应
 */
export async function checkFeaturePermissionMiddleware(
  request: NextRequest,
  feature: Feature,
  currentLang: string = 'zh'
): Promise<NextResponse | null> {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions)

    // 如果用户未登录
    if (!session?.user) {
      return NextResponse.json(
        {
          error: '请先登录',
          code: 'NOT_AUTHENTICATED',
          message: '此功能需要登录后使用'
        },
        { status: 401 }
      )
    }

    // 直接获取用户的订阅计划类型
    const userPlan = await getUserSubscriptionPlan(session.user.id)

    // 检查功能权限
    const permissionCheck = checkFeaturePermission(userPlan, feature, currentLang)

    if (!permissionCheck.allowed) {
      return NextResponse.json(
        {
          error: '功能需要升级',
          code: 'FEATURE_UPGRADE_REQUIRED',
          message: permissionCheck.message || '此功能需要订阅基础版或更高版本',
          userPlan: permissionCheck.userPlan,
          requiredPlan: permissionCheck.requiredPlan,
          upgradeUrl: permissionCheck.upgradeUrl,
          friendly: true // 标记这是一个友好的错误，不是技术错误
        },
        { status: 403 }
      )
    }

    // 有权限，返回null表示通过检查
    return null

  } catch (error) {
    console.error('功能权限检查失败:', error)
    return NextResponse.json(
      {
        error: '服务暂时不可用',
        code: 'PERMISSION_CHECK_FAILED',
        message: '无法验证功能权限，请稍后重试'
      },
      { status: 500 }
    )
  }
}

/**
 * 获取用户的订阅计划类型
 * @param userId 用户ID
 * @returns 用户的订阅计划类型
 */
async function getUserSubscriptionPlan(userId: string): Promise<SubscriptionPlan> {
  try {
    const { sql } = await import('@/lib/postgres-client')

    const { rows } = await sql`
      SELECT plan_type, order_desc, subscription_status, trial_end, subscription_type, order_date
      FROM nf_subscription
      WHERE user_id = ${userId}
        AND (
          (order_type = '1' AND subscription_status IN ('active', 'trialing'))
          OR
          (order_type = '0' AND subscription_status = 'canceled')
        )
      ORDER BY order_date DESC
      LIMIT 1
    `

    if (rows.length === 0) {
        return SubscriptionPlan.FREE
    }

    const subscription = rows[0]

    let userPlan = SubscriptionPlan.FREE

    // 先确定计划类型
    if (subscription.plan_type) {
      switch (subscription.plan_type) {
        case 'basic':
          userPlan = SubscriptionPlan.BASIC
          break
        case 'professional':
          userPlan = SubscriptionPlan.PROFESSIONAL
          break
        case 'business':
          userPlan = SubscriptionPlan.BUSINESS
          break
        default:
          userPlan = SubscriptionPlan.FREE
      }
    } else {
      // 如果plan_type为空，则根据order_desc推断
      userPlan = mapSubscriptionDescToPlan(subscription.order_desc || '')
    }

    // 检查订阅是否仍然有效
    const now = new Date()

    // 如果是试用状态，检查试用期是否过期
    if (subscription.subscription_status === 'trialing' && subscription.trial_end) {
      const trialEnd = new Date(subscription.trial_end)
      if (trialEnd < now) {
        return SubscriptionPlan.FREE
      }
    }

    // 如果是已取消的订阅，检查是否仍在有效期内
    if (subscription.subscription_status === 'canceled') {
      const orderDate = new Date(subscription.order_date)
      let periodDays = 30 // 默认月度

      if (subscription.subscription_type === 'quarterly') {
        periodDays = 90
      } else if (subscription.subscription_type === 'annual') {
        periodDays = 365
      } else if (subscription.subscription_type === 'trial') {
        // 试用期已在上面处理
        return SubscriptionPlan.FREE
      }

      // 计算当前周期的结束时间
      const daysSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
      const periodsElapsed = Math.floor(daysSinceOrder / periodDays)
      const currentPeriodEndDate = new Date(orderDate)
      currentPeriodEndDate.setDate(orderDate.getDate() + ((periodsElapsed + 1) * periodDays))

      // 如果当前时间超过了有效期，返回免费计划
      if (now >= currentPeriodEndDate) {
        return SubscriptionPlan.FREE
      }

      // 否则订阅仍然有效，继续使用原计划
    }

    return userPlan

  } catch (error) {
    console.error('获取用户订阅计划失败:', error)
    return SubscriptionPlan.FREE
  }
}

/**
 * 包装API处理函数，自动进行订阅检查
 * @param handler 原始的API处理函数
 * @returns 包装后的处理函数
 */
export function withSubscriptionCheck(
  handler: (request: NextRequest) => Promise<Response | NextResponse>
) {
  return async (request: NextRequest): Promise<Response | NextResponse> => {
    // 先检查订阅状态
    const subscriptionError = await checkSubscription(request)
    if (subscriptionError) {
      return subscriptionError
    }

    // 如果订阅检查通过，执行原始处理函数
    return handler(request)
  }
}

/**
 * 包装API处理函数，自动进行功能权限检查
 * @param feature 要检查的功能
 * @param handler 原始的API处理函数
 * @param currentLang 当前语言
 * @returns 包装后的处理函数
 */
export function withFeaturePermissionCheck(
  feature: Feature,
  handler: (request: NextRequest) => Promise<Response | NextResponse>,
  currentLang: string = 'zh'
) {
  return async (request: NextRequest): Promise<Response | NextResponse> => {
    // 先检查功能权限
    const permissionError = await checkFeaturePermissionMiddleware(request, feature, currentLang)
    if (permissionError) {
      return permissionError
    }

    // 如果权限检查通过，执行原始处理函数
    return handler(request)
  }
}
