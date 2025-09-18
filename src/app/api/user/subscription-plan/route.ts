import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { sql } from '@/lib/postgres-client'
import { SubscriptionPlan, mapSubscriptionDescToPlan } from '@/lib/subscription-plans'

/**
 * 获取用户的订阅计划类型
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '用户未登录' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // 查询用户的订阅信息（包括已取消但可能仍在有效期内的订阅）
    const { rows } = await sql`
      SELECT
        plan_type,
        order_desc,
        subscription_status,
        subscription_type,
        order_date,
        trial_end
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

    let userPlan = SubscriptionPlan.FREE

    if (rows.length > 0) {
      const subscription = rows[0]

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
          userPlan = SubscriptionPlan.FREE
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
          userPlan = SubscriptionPlan.FREE
        } else {
          // 计算当前周期的结束时间
          const daysSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
          const periodsElapsed = Math.floor(daysSinceOrder / periodDays)
          const currentPeriodEndDate = new Date(orderDate)
          currentPeriodEndDate.setDate(orderDate.getDate() + ((periodsElapsed + 1) * periodDays))

          // 如果当前时间超过了有效期，返回免费计划
          if (now >= currentPeriodEndDate) {
            userPlan = SubscriptionPlan.FREE
          }

          // 否则订阅仍然有效，继续使用原计划
        }
      }
    } else {

    }

    return NextResponse.json({
      success: true,
      plan: userPlan,
      subscription: rows.length > 0 ? {
        planType: rows[0].plan_type,
        status: rows[0].subscription_status,
        type: rows[0].subscription_type,
        orderDate: rows[0].order_date,
        trialEnd: rows[0].trial_end
      } : null
    })

  } catch (error) {
    console.error('获取用户订阅计划失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
