"use client"

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Lock, Crown, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { useSubscription } from '@/hooks/use-subscription'

interface SubscriptionGuardProps {
  children: ReactNode
  feature?: string
  currentLang?: string
}

export function SubscriptionGuard({ children, feature = "功能", currentLang = "zh" }: SubscriptionGuardProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const subscriptionStatus = useSubscription()

  // 如果正在加载，显示加载状态
  if (subscriptionStatus.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">检查订阅状态中...</p>
        </div>
      </div>
    )
  }

  // 如果有有效订阅，直接显示内容
  if (subscriptionStatus.hasValidSubscription) {
    return <>{children}</>
  }

  // 如果没有有效订阅，显示订阅提示
  const isNotAuthenticated = subscriptionStatus.error === 'not_authenticated'
  
  const handleSubscribe = () => {
    router.push(`/${currentLang}/pricing`)
  }

  const handleLogin = () => {
    signIn()
  }

  return (
    <div className="min-h-[600px] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              {isNotAuthenticated ? (
                <Lock className="w-8 h-8 text-white" />
              ) : (
                <Crown className="w-8 h-8 text-white" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              {isNotAuthenticated ? '请先登录' : `${feature}需要订阅`}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-6">
            <div className="space-y-3">
              {isNotAuthenticated ? (
                <>
                  <p className="text-gray-600 text-lg">
                    请登录您的账户以使用我们的翻译功能
                  </p>
                  <p className="text-sm text-gray-500">
                    登录后可以体验我们强大的AI翻译服务
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-600 text-lg">
                    此功能仅限订阅用户使用
                  </p>
                  <p className="text-sm text-gray-500">
                    订阅后可无限制使用所有翻译功能，包括语音翻译、图片翻译和旅游攻略
                  </p>
                </>
              )}
            </div>

            <div className="bg-white/80 rounded-lg p-4 border border-gray-100">
              <h4 className="font-semibold text-gray-800 mb-2">订阅用户专享功能：</h4>
              <ul className="text-sm text-gray-600 space-y-1 text-left">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  无限次语音翻译
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  图片文字识别翻译
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  AI旅游攻略生成
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  支持214种语言
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {isNotAuthenticated ? (
                <Button 
                  onClick={handleLogin}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  立即登录
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleSubscribe}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    立即订阅
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push(`/${currentLang}/pricing`)}
                    className="border-2 border-gray-200 hover:border-gray-300 px-6 py-3 rounded-lg font-medium transition-all duration-300"
                  >
                    查看价格
                  </Button>
                </>
              )}
            </div>

            {!isNotAuthenticated && subscriptionStatus.status === 'canceled' && subscriptionStatus.expiryDate && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  您的订阅已取消，但仍可使用至 {new Date(subscriptionStatus.expiryDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
