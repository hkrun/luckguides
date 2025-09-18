'use client'

import { PaymentButton } from './button'
import { Pricing } from "@/types/locales/pricing"
import { Auth } from '@/types/locales/auth'
import { type Locale } from "@/i18n-config"

interface BusinessCardProps {
  lang: Locale
  i18nPricing: Pricing
  i18nAuth: Auth
  billingPeriod: 'monthly' | 'annual'
}

export function BusinessCard({ lang, i18nPricing, i18nAuth, billingPeriod }: BusinessCardProps) {
  // 根据语言设置标签文本
  const getLabels = () => {
    switch (lang) {
      case 'zh':
        return {
          title: '商业版',
          subtitle: '企业级解决方案，适合团队协作',
          badge: '企业推荐'
        }
      case 'ja':
        return {
          title: 'ビジネス版',
          subtitle: 'エンタープライズソリューション、チーム協力に適用',
          badge: '企業推奨'
        }
      case 'en':
      default:
        return {
          title: 'Business Plan',
          subtitle: 'Enterprise solution for team collaboration',
          badge: 'Enterprise Recommended'
        }
    }
  }
  
  const labels = getLabels()
  const businessPlan = i18nPricing.business

  return (
    <div className="w-full">
      {/* 商业版价格卡片 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 relative h-full min-h-[500px] flex flex-col">
        {/* 企业推荐标签 */}
        <div className="absolute top-0 right-0 bg-purple-600 dark:bg-purple-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
          {labels.badge}
        </div>

        {/* 固定的标题和价格信息 */}
        <div className="p-6 border-b dark:border-gray-700">
          <h3 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">{labels.title}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm">{labels.subtitle}</p>
          <div className="flex items-end mb-1">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {billingPeriod === 'annual' && businessPlan.annualPrice 
                ? businessPlan.annualPrice.amount 
                : businessPlan.price.amount}
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-1 text-sm">
              {billingPeriod === 'annual' && businessPlan.annualPrice 
                ? businessPlan.annualPrice.period 
                : businessPlan.price.period}
            </span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400">{businessPlan.trial}</p>
        </div>

        {/* 功能列表 */}
        <div className="p-4 flex-1">
          <ul className="space-y-1.5">
            {businessPlan.features.map((feature, index) => (
              <li key={index} className="flex items-start text-sm">
                <i className="fa fa-check text-green-500 dark:text-green-400 mt-0.5 mr-2 text-xs"></i>
                <span className="text-gray-900 dark:text-white">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 支付按钮 */}
        <div className="p-4 border-t dark:border-gray-700">
          <PaymentButton
            lang={lang}
            mode={businessPlan.mode}
            currency={businessPlan.currency}
            btnlabel={businessPlan.cta}
            paymentTips={i18nPricing.paymentTips}
            product={billingPeriod === 'annual' && businessPlan.annualProduct 
              ? businessPlan.annualProduct 
              : businessPlan.product}
            authErrorTitle={(i18nPricing as any).auth?.loginRequired?.title}
            authErrorDesc={(i18nPricing as any).auth?.loginRequired?.description}
            authTexts={{auth: i18nAuth}}
            paymentTexts={(i18nPricing as any).payment}
            i18nPricing={i18nPricing}
            isPopular={false}
            planType="business"
          />
        </div>
      </div>
    </div>
  )
}
