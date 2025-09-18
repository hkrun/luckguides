"use client"

import { useState, useMemo } from "react"
import { type Locale } from "@/i18n-config"
import { Pricing } from "@/types/locales/pricing"
import { Auth } from "@/types/locales/auth"
import { PaymentButton } from "./button"

type PlanKey = "basic" | "professional" | "elite"

interface PersonalCardProps {
  lang: Locale
  i18nPricing: Pricing
  i18nAuth: Auth
}

export default function PersonalPlanCard({ lang, i18nPricing, i18nAuth }: PersonalCardProps) {
  const [active, setActive] = useState<PlanKey>("professional")

  const plan = useMemo(() => {
    if (active === "basic") return i18nPricing.basic
    if (active === "elite") return i18nPricing.elite
    return i18nPricing.professional
  }, [active, i18nPricing])

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 flex flex-col h-full">
      {/* 顶部：当前选择的计划信息 */}
      <div className="p-6 border-b">
         <h3 className="text-xl font-bold mb-1">{plan.title}</h3>
        <div className="flex items-end">
          <span className="text-4xl font-bold">{plan.price.amount}</span>
          <span className="text-gray-500 ml-2">{plan.price.period}</span>
        </div>
      </div>

      {/* 计划选择（列表样式） */}
      <div className="p-4 border-b bg-white">
        <div role="radiogroup" aria-label="personal plans" className="space-y-3">
          {([
            { key: "basic", label: i18nPricing.basic.title, price: i18nPricing.basic.price },
            { key: "professional", label: i18nPricing.professional.title, price: i18nPricing.professional.price },
            { key: "elite", label: i18nPricing.elite.title, price: i18nPricing.elite.price },
          ] as Array<{ key: PlanKey; label: string; price: { amount: string; period: string } }>).map(({ key, label, price }) => {
            const selected = active === key
            return (
              <button
                key={key}
                role="radio"
                aria-checked={selected}
                onClick={() => setActive(key)}
                className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 transition-colors text-left ${
                  selected
                    ? "border-blue-600 bg-blue-50/60"
                    : "border-gray-200 hover:border-gray-300 bg-gray-50"
                }`}
              >
                <span className={`font-medium ${selected ? "text-blue-700" : "text-gray-800"}`}>{label}</span>
                <span className="text-sm text-gray-600">
                  <span className="font-semibold mr-1">{price.amount}</span>
                  <span>{price.period}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <ul className="space-y-3 text-sm flex-1">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start">
              <i className="fa fa-check text-green-500 mt-0.5 mr-2"></i>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <PaymentButton
            lang={lang}
            mode={plan.mode}
            currency={plan.currency}
            btnlabel={plan.cta}
            paymentTips={i18nPricing.paymentTips}
            product={plan.product}
            authErrorTitle={(i18nPricing as any).auth?.loginRequired?.title}
            authErrorDesc={(i18nPricing as any).auth?.loginRequired?.description}
            authTexts={{ auth: i18nAuth }}
            paymentTexts={(i18nPricing as any).payment}
            i18nPricing={i18nPricing}
            isPopular={active === "professional"}
            planType={active}
          />
        </div>
      </div>
    </div>
  )
}
