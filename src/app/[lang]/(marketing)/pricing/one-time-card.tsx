'use client'

import { useState } from 'react'
import { PaymentButton } from './button'
import { Pricing } from "@/types/locales/pricing"
import { Auth } from '@/types/locales/auth'
import { type Locale } from "@/i18n-config"

interface OneTimeCardProps {
  lang: Locale
  i18nPricing: Pricing
  i18nAuth: Auth
  billingPeriod: 'monthly' | 'annual'
}

type OneTimePlanType = 'oneTimeBasic' | 'oneTimePremium' | 'oneTimeProfessional'

export function OneTimeCard({ lang, i18nPricing, i18nAuth, billingPeriod }: OneTimeCardProps) {
  const [selectedPlan, setSelectedPlan] = useState<OneTimePlanType>('oneTimePremium')

  // 根据语言设置标签文本
  const getLabels = () => {
    switch (lang) {
      case 'zh':
        return {
          title: '单次购买',
          subtitle: '按需购买，无需订阅',
          validity: '永久有效，无过期时间'
        }
      case 'ja':
        return {
          title: '一回購入',
          subtitle: '必要に応じて購入、サブスクリプション不要',
          validity: '永続有効、有効期限なし'
        }
      case 'en':
      default:
        return {
          title: 'One-time Purchase',
          subtitle: 'Buy as needed, no subscription required',
          validity: 'Lifetime validity, no expiration'
        }
    }
  }

  const labels = getLabels()

  const plans = {
    oneTimeBasic: {
      data: i18nPricing.oneTimeBasic,
      description: i18nPricing.planDescriptions.oneTimeBasic,
      planType: 'oneTimeBasic' as const
    },
    oneTimePremium: {
      data: (i18nPricing as any).oneTimePremium,
      // 复用原有的描述键：premium 对应之前的 professional 描述
      description: i18nPricing.planDescriptions.oneTimeProfessional,
      planType: 'oneTimePremium' as const
    },
    oneTimeProfessional: {
      data: i18nPricing.oneTimeProfessional,
      // 复用原有的描述键：现在的 professional 对应之前的 elite 描述
      description: i18nPricing.planDescriptions.oneTimeElite,
      planType: 'oneTimeProfessional' as const
    }
  }

  const currentPlan = plans[selectedPlan]

  return (
    <div className="w-full">
      {/* 单次购买价格卡片 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 relative h-full min-h-[500px] flex flex-col">
        {/* 固定的标题和选中计划的价格信息 */}
        <div className="p-6 border-b dark:border-gray-700">
          <h3 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">{labels.title}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm">{labels.subtitle}</p>
          <div className="flex items-end mb-1">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{currentPlan.data.price.amount}</span>
            <span className="text-gray-500 dark:text-gray-400 ml-1 text-sm">{currentPlan.data.price.period}</span>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400">{labels.validity}</p>
        </div>

        {/* 版本选择器 */}
        <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="space-y-1.5">
            {Object.entries(plans).map(([key, plan]) => (
              <div
                key={key}
                onClick={() => setSelectedPlan(key as OneTimePlanType)}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                  selectedPlan === key
                    ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-sm'
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
                    <div className="text-base font-bold text-gray-900 dark:text-white">{plan.data.price.amount}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{plan.data.price.period}</div>
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
            product={currentPlan.data.product}
            authErrorTitle={(i18nPricing as any).auth?.loginRequired?.title}
            authErrorDesc={(i18nPricing as any).auth?.loginRequired?.description}
            authTexts={{auth: i18nAuth}}
            paymentTexts={(i18nPricing as any).payment}
            i18nPricing={i18nPricing}
            isPopular={false}
            planType={currentPlan.planType}
          />
        </div>

        {/* 功能列表 */}
        <div className="p-4 flex-1">
          <ul className="space-y-1.5">
            {(currentPlan.data.features as string[]).map((feature: string, index: number) => (
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
