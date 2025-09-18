'use client'

import { useState } from 'react'
import { type Locale } from "@/i18n-config"
import { Pricing } from "@/types/locales/pricing"
import { Auth } from '@/types/locales/auth'
import { UnifiedPricingCard } from './unified-pricing-card'
import { OneTimeCard } from './one-time-card'
import { BusinessCard } from './business-card'

interface PricingPageClientProps {
  lang: Locale
  i18nPricing: Pricing
  i18nAuth: Auth
}

export default function PricingPageClient({ lang, i18nPricing, i18nAuth }: PricingPageClientProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')

  return (
    <div className="bg-gray-50 dark:bg-gray-900 font-inter text-gray-900 dark:text-white overflow-x-hidden">
      <main className="py-12 bg-gray-50 dark:bg-gray-900 relative">
        <section id="pricing" className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">{i18nPricing.billing.title}</span>
            <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-bold mt-2 mb-6 text-gray-900 dark:text-white">
              {i18nPricing.hero.title}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {i18nPricing.hero.description}
            </p>

            <div className="mt-8 inline-flex bg-white dark:bg-gray-800 p-1 rounded-full shadow-sm">
              <button 
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  billingPeriod === 'monthly' 
                    ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {i18nPricing.billing.monthly}
              </button>
              <button 
                onClick={() => setBillingPeriod('annual')}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  billingPeriod === 'annual' 
                    ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {i18nPricing.billing.annual} 
                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded ml-1">{i18nPricing.billing.save}</span>
              </button>
            </div>
          </div>

          {/* 价格卡片容器 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8 max-w-screen-2xl mx-auto">
            {/* 单次购买卡片 */}
            <OneTimeCard
              lang={lang}
              i18nPricing={i18nPricing}
              i18nAuth={i18nAuth}
              billingPeriod={billingPeriod}
            />

            {/* 个人版订阅卡片 */}
            <UnifiedPricingCard
              lang={lang}
              i18nPricing={i18nPricing}
              i18nAuth={i18nAuth}
              billingPeriod={billingPeriod}
            />

            {/* 商业版卡片 */}
            <BusinessCard
              lang={lang}
              i18nPricing={i18nPricing}
              i18nAuth={i18nAuth}
              billingPeriod={billingPeriod}
            />
          </div>




        </section>
      </main>
    </div>
  )
}
