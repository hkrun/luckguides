
import {
  CheckCircle2
} from "lucide-react"
import { type Locale, getPathname, generateAlternates } from "@/i18n-config"
import { getDictionary, i18nNamespaces } from '@/i18n'
import { Pricing } from "@/types/locales/pricing"
import { PaymentButton } from './button'
import { host } from '@/config/config'
import { Auth } from '@/types/locales/auth'
import { UnifiedPricingCard } from './unified-pricing-card'
import { OneTimeCard } from './one-time-card'
import { BusinessCard } from './business-card'

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params
  const alternates = generateAlternates(lang, '/pricing');
  const i18nPricing = await getDictionary<Pricing>(lang, i18nNamespaces.pricing);
  return {
    title: i18nPricing.meta.title,
    description: i18nPricing.meta.description,
    keywords: i18nPricing.meta.keywords,
    twitter: {
      card: "summary_large_image", title: i18nPricing.meta.title,
      description: i18nPricing.meta.description
    },
    openGraph: {
      type: "website",
      url: `${host}${getPathname(lang, '/pricing')}`,
      title: i18nPricing.meta.title,
      description: i18nPricing.meta.description,
      siteName: "LuckGuides"
    },
    alternates: {
      canonical: `${host}${getPathname(lang, '/pricing')}`,
      languages: alternates
    }
  }
}

import PricingPageClient from './pricing-client'

export default async function Page({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params
  const i18nPricing = await getDictionary<Pricing>(lang, i18nNamespaces.pricing)
  const i18nAuth = await getDictionary<Auth>(lang, i18nNamespaces.auth)

  return (
    <PricingPageClient 
      lang={lang}
      i18nPricing={i18nPricing}
      i18nAuth={i18nAuth}
    />
  )
}

