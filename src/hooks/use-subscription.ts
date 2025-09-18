"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { hasValidSubscription } from '@/actions/user-order'

interface SubscriptionStatus {
  hasValidSubscription: boolean
  subscriptionType?: string
  status?: string
  expiryDate?: string
  isActive?: boolean
  isLoading: boolean
  error?: string
}

export function useSubscription() {
  const { data: session, status: sessionStatus } = useSession()
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    hasValidSubscription: false,
    isLoading: true
  })

  useEffect(() => {
    async function checkSubscription() {
      // 如果用户未登录，直接返回无权限
      if (sessionStatus === 'loading') {
        return // 继续等待
      }
      
      if (sessionStatus === 'unauthenticated' || !session?.user) {
        setSubscriptionStatus({
          hasValidSubscription: false,
          isLoading: false,
          error: 'not_authenticated'
        })
        return
      }

      try {
        setSubscriptionStatus(prev => ({ ...prev, isLoading: true }))
        const result = await hasValidSubscription()
        
        setSubscriptionStatus({
          ...result,
          isLoading: false
        })
      } catch (error) {
        console.error('检查订阅状态失败:', error)
        setSubscriptionStatus({
          hasValidSubscription: false,
          isLoading: false,
          error: 'check_failed'
        })
      }
    }

    checkSubscription()
  }, [session?.user?.id, sessionStatus])

  return subscriptionStatus
}
