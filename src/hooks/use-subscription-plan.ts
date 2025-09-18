/**
 * 用户订阅计划管理Hook
 * 提供订阅计划信息和权限检查功能
 */

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { 
  SubscriptionPlan, 
  Feature, 
  checkFeaturePermission, 
  getPlanConfig,
  PLAN_NAMES,
  FEATURE_NAMES
} from '@/lib/subscription-plans'

interface SubscriptionPlanInfo {
  plan: SubscriptionPlan
  planName: string
  isLoading: boolean
  error: string | null
  hasFeature: (feature: Feature) => boolean
  checkPermission: (feature: Feature, lang?: string) => {
    allowed: boolean
    message?: string
    upgradeUrl?: string
  }
  refresh: () => void
}

/**
 * 获取用户订阅计划信息的Hook
 */
export function useSubscriptionPlan(currentLang: string = 'zh'): SubscriptionPlanInfo {
  const { data: session, status } = useSession()
  const [plan, setPlan] = useState<SubscriptionPlan>(SubscriptionPlan.FREE)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscriptionPlan = useCallback(async (retryCount = 0) => {
    if (status === 'loading') {
      return
    }

    if (status === 'unauthenticated' || !session?.user) {
      setPlan(SubscriptionPlan.FREE)
      setIsLoading(false)
      setError(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // 添加超时控制，避免无限加载
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.warn('订阅计划请求超时，正在取消请求...')
        controller.abort()
      }, 8000) // 增加到8秒超时，给数据库查询更多时间

      const response = await fetch('/api/user/subscription-plan', {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' // 确保不使用缓存
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 401) {
          setPlan(SubscriptionPlan.FREE)
          setIsLoading(false)
          return
        }
        throw new Error('Failed to fetch subscription plan')
      }

      const data = await response.json()

      if (data.success) {
        setPlan(data.plan || SubscriptionPlan.FREE)
      } else {
        throw new Error(data.error || 'Unknown error')
      }

    } catch (err) {
      // 处理 AbortError（超时或手动取消）
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('订阅计划请求被取消或超时')
        // 在开发环境中，如果是超时，直接设为免费用户而不显示错误
        if (process.env.NODE_ENV === 'development') {
          console.log('开发环境：订阅计划请求超时，默认设为免费用户')
          setError(null) // 不显示错误信息
        } else {
          // 生产环境中，如果是超时且重试次数少于2次，则自动重试
          if (retryCount < 2) {
            console.log(`重试获取订阅计划 (${retryCount + 1}/2)`)
            setTimeout(() => fetchSubscriptionPlan(retryCount + 1), 1000)
            return
          }
          setError('请求超时，请稍后重试')
        }
      } else {
        console.error('获取订阅计划失败:', err)
        setError(err instanceof Error ? err.message : '获取订阅计划失败')
      }
      setPlan(SubscriptionPlan.FREE) // 默认设为免费用户
    } finally {
      setIsLoading(false)
    }
  }, [session, status])

  useEffect(() => {
    fetchSubscriptionPlan()
  }, [fetchSubscriptionPlan])

  const hasFeature = useCallback((feature: Feature): boolean => {
    const planConfig = getPlanConfig(plan)
    return planConfig.features.includes(feature)
  }, [plan])

  const checkPermission = useCallback((feature: Feature, lang: string = currentLang) => {
    return checkFeaturePermission(plan, feature, lang)
  }, [plan, currentLang])

  const planName = PLAN_NAMES[currentLang as keyof typeof PLAN_NAMES]?.[plan] ||
                   PLAN_NAMES.zh[plan]

  return {
    plan,
    planName,
    isLoading,
    error,
    hasFeature,
    checkPermission,
    refresh: fetchSubscriptionPlan
  }
}

/**
 * 功能权限检查Hook
 * 专门用于检查特定功能的权限
 */
export function useFeaturePermission(feature: Feature, currentLang: string = 'zh') {
  const subscriptionPlan = useSubscriptionPlan(currentLang)
  
  const permission = subscriptionPlan.checkPermission(feature, currentLang)
  
  return {
    ...permission,
    isLoading: subscriptionPlan.isLoading,
    userPlan: subscriptionPlan.plan,
    planName: subscriptionPlan.planName,
    refresh: subscriptionPlan.refresh
  }
}

/**
 * 多功能权限检查Hook
 * 用于同时检查多个功能的权限
 */
export function useMultipleFeaturePermissions(
  features: Feature[], 
  currentLang: string = 'zh'
) {
  const subscriptionPlan = useSubscriptionPlan(currentLang)
  
  const permissions = features.reduce((acc, feature) => {
    acc[feature] = subscriptionPlan.checkPermission(feature, currentLang)
    return acc
  }, {} as Record<Feature, ReturnType<typeof checkFeaturePermission>>)
  
  const hasAnyFeature = features.some(feature => subscriptionPlan.hasFeature(feature))
  const hasAllFeatures = features.every(feature => subscriptionPlan.hasFeature(feature))
  
  return {
    permissions,
    hasAnyFeature,
    hasAllFeatures,
    isLoading: subscriptionPlan.isLoading,
    userPlan: subscriptionPlan.plan,
    planName: subscriptionPlan.planName,
    refresh: subscriptionPlan.refresh
  }
}
