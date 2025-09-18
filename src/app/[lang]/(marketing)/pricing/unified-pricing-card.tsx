'use client'

import { useState } from 'react'
import { PaymentButton } from './button'
import { Pricing } from "@/types/locales/pricing"
import { Auth } from '@/types/locales/auth'
import { type Locale } from "@/i18n-config"

interface UnifiedPricingCardProps {
  lang: Locale
  i18nPricing: Pricing
  i18nAuth: Auth
  billingPeriod: 'monthly' | 'annual'
}

type PlanType = 'basic' | 'premium' | 'professional'

export function UnifiedPricingCard({ lang, i18nPricing, i18nAuth, billingPeriod }: UnifiedPricingCardProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('premium')

  // 根据语言设置标签文本
  const getLabels = () => {
    switch (lang) {
      case 'zh':
        return {
          badge: '新用户推荐'
        }
      case 'ja':
        return {
          badge: '新規ユーザー推奨'
        }
      case 'en':
      default:
        return {
          badge: 'Recommended for New Users'
        }
    }
  }

  const labels = getLabels()

  const plans = {
    basic: {
      data: i18nPricing.basic,
      description: i18nPricing.planDescriptions.basic,
      planType: 'basic' as const
    },
    premium: {
      data: (i18nPricing as any).premium,
      description: i18nPricing.planDescriptions.professional, // 复用原“高级版”对应描述键
      planType: 'premium' as const
    },
    professional: {
      data: i18nPricing.professional,
      description: i18nPricing.planDescriptions.elite, // 复用原“专业版(最高档)”描述
      planType: 'professional' as const
    }
  }

  const currentPlan = plans[selectedPlan]

  return (
    <div className="w-full">
      {/* 统一价格卡片 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl border-2 border-blue-400 dark:border-blue-500 relative h-full min-h-[500px] flex flex-col ring-1 ring-blue-100 dark:ring-blue-900/30">
        {/* 新用户推荐标签 */}
        <div className="absolute top-0 left-0 bg-green-600 dark:bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-br-lg">
          {i18nPricing.personal.badge}
        </div>
        {/* Popular 标签 */}
        <div className="absolute top-0 right-0 bg-blue-600 dark:bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
          {i18nPricing.personal.popular}
        </div>

        {/* 固定的标题和选中计划的价格信息 */}
        <div className="p-6 border-b dark:border-gray-700">
          <h3 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">{i18nPricing.personal.title}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm">{i18nPricing.personal.description}</p>
          <div className="flex items-end mb-1">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {billingPeriod === 'annual' && currentPlan.data.annualPrice 
                ? currentPlan.data.annualPrice.amount 
                : currentPlan.data.price.amount}
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-1 text-sm">
              {billingPeriod === 'annual' && currentPlan.data.annualPrice 
                ? currentPlan.data.annualPrice.period 
                : currentPlan.data.price.period}
            </span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400">{currentPlan.data.trial}</p>
        </div>

        {/* 版本选择器 */}
        <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="space-y-1.5">
            {Object.entries(plans).map(([key, plan]) => (
              <div
                key={key}
                onClick={() => setSelectedPlan(key as PlanType)}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                  selectedPlan === key
                    ? 'border-orange-400 dark:border-orange-500 bg-orange-50 dark:bg-orange-900/30 shadow-sm'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm">{plan.data.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{plan.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-gray-900 dark:text-white">
                      {billingPeriod === 'annual' && plan.data.annualPrice 
                        ? plan.data.annualPrice.amount 
                        : plan.data.price.amount}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {billingPeriod === 'annual' && plan.data.annualPrice 
                        ? plan.data.annualPrice.period 
                        : plan.data.price.period}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 支付按钮 */}
        <div className="p-4 border-b dark:border-gray-700">
          <PaymentButton
            lang={lang}
            mode={currentPlan.data.mode}
            currency={currentPlan.data.currency}
            btnlabel={currentPlan.data.cta}
            paymentTips={i18nPricing.paymentTips}
            product={billingPeriod === 'annual' && currentPlan.data.annualProduct 
              ? currentPlan.data.annualProduct 
              : currentPlan.data.product}
            authErrorTitle={(i18nPricing as any).auth?.loginRequired?.title}
            authErrorDesc={(i18nPricing as any).auth?.loginRequired?.description}
            authTexts={{auth: i18nAuth}}
            paymentTexts={(i18nPricing as any).payment}
            i18nPricing={i18nPricing}
            isPopular={selectedPlan === 'premium'}
            planType={currentPlan.planType}
          />
        </div>

        {/* 功能列表 */}
        <div className="p-4 flex-1">
          <ul className="space-y-1.5">
            {(billingPeriod === 'annual' && currentPlan.data.annualFeatures 
              ? currentPlan.data.annualFeatures 
              : currentPlan.data.features).map((feature, index) => (
              <li key={index} className="flex items-start text-sm">
                <i className="fa fa-check text-green-500 dark:text-green-400 mt-0.5 mr-2 text-xs"></i>
                <span className="text-gray-900 dark:text-white">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
