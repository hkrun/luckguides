import type React from "react"
import { NavbarSticky } from "@/components/navbar-sticky"
import { FooterSocial } from "@/components/footer-social"
import { i18nConfig, type Locale } from "@/i18n-config";
import { getDictionary, i18nNamespaces } from '@/i18n'
import { Navbar, Footer, Billing, Auth } from "@/types/locales";

import { setCurrentLanguage } from '@/actions/constants'

export async function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ lang: locale }));
}

export async function generateMetadata({ params }: { params: { lang: Locale } }) {
  return {
    robots: { index: true, follow: true },
    other: { "shortcut icon": "favicon.ico" }
  }
}

export default async function Layout({
  children,
  params
}: Readonly<{
  children: React.ReactNode,
  params: Promise<{ lang: Locale }>
}>) {
  const { lang } = await params
  
  setCurrentLanguage(lang)
  
  const i18nNavbar = await getDictionary<Navbar>(lang, i18nNamespaces.navbar);
  const i18nFooter = await getDictionary<Footer>(lang, i18nNamespaces.footer);
  const i18nBilling = await getDictionary<Billing>(lang, i18nNamespaces.billing);
  const i18nAuth = await getDictionary<Auth>(lang, i18nNamespaces.auth);

  return (
    <>
      {/* Navigation Bar */}
      <NavbarSticky
        lang={lang}
        navbarLocal={i18nNavbar}
        subscriptionLocal={i18nBilling.subscription}
        toastLocal={i18nBilling.toast}
        i18n={{ auth: i18nAuth }}
      />
      {children}
      {/* Footer */}
      <FooterSocial i18n={i18nFooter} lang={lang} />
    </>
  )
}

