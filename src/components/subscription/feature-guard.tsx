'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useFeaturePermission } from '@/hooks/use-subscription-plan'
import { Feature, FEATURE_NAMES, PLAN_NAMES } from '@/lib/subscription-plans'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Crown, Zap, ArrowRight } from 'lucide-react'

interface FeatureGuardProps {
  feature: Feature
  currentLang?: string
  children: React.ReactNode
  fallback?: React.ReactNode
  showUpgradePrompt?: boolean
  className?: string
}

/**
 * 功能权限守卫组件
 * 根据用户订阅计划控制功能访问
 */
export function FeatureGuard({
  feature,
  currentLang = 'zh',
  children,
  fallback,
  showUpgradePrompt = true,
  className
}: FeatureGuardProps) {
  const router = useRouter()
  const permission = useFeaturePermission(feature, currentLang)

  // 如果正在加载，显示加载状态
  if (permission.isLoading) {
    return (
      <div className={`animate-pulse ${className || ''}`}>
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  // 如果有权限，直接显示内容
  if (permission.allowed) {
    return <>{children}</>
  }

  // 如果提供了自定义fallback，使用它
  if (fallback) {
    return <>{fallback}</>
  }

  // 如果不显示升级提示，返回null
  if (!showUpgradePrompt) {
    return null
  }

  // 显示升级提示
  return (
    <UpgradePrompt
      feature={feature}
      currentLang={currentLang}
      userPlan={permission.userPlan}
      requiredPlan={permission.requiredPlan}
      message={permission.message}
      upgradeUrl={permission.upgradeUrl}
      className={className}
    />
  )
}

interface UpgradePromptProps {
  feature: Feature
  currentLang: string
  userPlan: string
  requiredPlan?: string
  message?: string
  upgradeUrl?: string
  className?: string
}

/**
 * 升级提示组件
 */
function UpgradePrompt({
  feature,
  currentLang,
  userPlan,
  requiredPlan,
  message,
  upgradeUrl,
  className
}: UpgradePromptProps) {
  const router = useRouter()

  const featureName = FEATURE_NAMES[currentLang as keyof typeof FEATURE_NAMES]?.[feature] || 
                     FEATURE_NAMES.zh[feature]
  
  const currentPlanName = PLAN_NAMES[currentLang as keyof typeof PLAN_NAMES]?.[userPlan as keyof typeof PLAN_NAMES.zh] || 
                         PLAN_NAMES.zh[userPlan as keyof typeof PLAN_NAMES.zh]
  
  const requiredPlanName = requiredPlan ? 
    (PLAN_NAMES[currentLang as keyof typeof PLAN_NAMES]?.[requiredPlan as keyof typeof PLAN_NAMES.zh] || 
     PLAN_NAMES.zh[requiredPlan as keyof typeof PLAN_NAMES.zh]) : ''

  const handleUpgrade = () => {
    if (upgradeUrl) {
      router.push(upgradeUrl)
    }
  }

  const texts = {
    zh: {
      title: '功能升级',
      description: `${featureName}功能需要升级到更高版本`,
      currentPlan: `当前计划：${currentPlanName}`,
      requiredPlan: `需要计划：${requiredPlanName}`,
      upgradeButton: '立即升级',
      learnMore: '了解更多'
    },
    en: {
      title: 'Feature Upgrade',
      description: `${featureName} requires a higher subscription plan`,
      currentPlan: `Current Plan: ${currentPlanName}`,
      requiredPlan: `Required Plan: ${requiredPlanName}`,
      upgradeButton: 'Upgrade Now',
      learnMore: 'Learn More'
    }
  }

  const t = texts[currentLang as keyof typeof texts] || texts.zh

  return (
    <Card className={`border-2 border-dashed border-gray-300 ${className || ''}`}>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
          <Crown className="w-6 h-6 text-white" />
        </div>
        <CardTitle className="text-lg font-semibold text-gray-900">
          {t.title}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {message || t.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="space-y-2 text-sm text-gray-500">
          <p>{t.currentPlan}</p>
          {requiredPlanName && <p>{t.requiredPlan}</p>}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={handleUpgrade}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Zap className="w-4 h-4 mr-2" />
            {t.upgradeButton}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleUpgrade}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {t.learnMore}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 功能锁定组件
 * 用于显示功能被锁定的状态
 */
export function FeatureLocked({
  feature,
  currentLang = 'zh',
  className
}: {
  feature: Feature
  currentLang?: string
  className?: string
}) {
  const featureName = FEATURE_NAMES[currentLang as keyof typeof FEATURE_NAMES]?.[feature] || 
                     FEATURE_NAMES.zh[feature]

  const texts = {
    zh: {
      locked: '功能已锁定',
      description: `${featureName}功能需要订阅后使用`
    },
    en: {
      locked: 'Feature Locked',
      description: `${featureName} requires a subscription`
    }
  }

  const t = texts[currentLang as keyof typeof texts] || texts.zh

  return (
    <div className={`flex items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${className || ''}`}>
      <div className="text-center">
        <Lock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t.locked}</h3>
        <p className="text-gray-600">{t.description}</p>
      </div>
    </div>
  )
}

/**
 * 功能预览组件
 * 用于显示功能的预览状态，但不允许交互
 */
export function FeaturePreview({
  children,
  feature,
  currentLang = 'zh',
  className
}: {
  children: React.ReactNode
  feature: Feature
  currentLang?: string
  className?: string
}) {
  return (
    <div className={`relative ${className || ''}`}>
      {/* 内容预览 */}
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      
      {/* 覆盖层 */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
        <FeatureLocked feature={feature} currentLang={currentLang} />
      </div>
    </div>
  )
}
