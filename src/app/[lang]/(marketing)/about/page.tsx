import Link from "next/link";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, User, Tag, Eye } from "lucide-react"
import { useState, useMemo, use } from "react";
import { getPathname, type Locale, generateAlternates } from "@/i18n-config";
import { getDictionary, i18nNamespaces } from '@/i18n'
import type { About } from '@/types/locales/about'
import AboutClient from './about-client'
import { host } from '@/config/config'

// 每页显示的文章数量
const POSTS_PER_PAGE = 6;

export async function generateMetadata({ params }: { params: { lang: Locale } }) {
  const { lang } = await params
  const alternates = generateAlternates(lang, '/about');
  const i18n: About = await getDictionary<About>(lang, i18nNamespaces.about);
  return {
    title: i18n.meta.title,
    description: i18n.meta.description,
    keywords: i18n.meta.keywords,
    twitter: {
      card: "summary_large_image",
      title: i18n.meta.title,
      description: i18n.meta.description
    },
    openGraph: {
      type: "website",
      url: `${host}${getPathname(lang, '/about')}`,
      title: i18n.meta.title,
      description: i18n.meta.description,
      siteName: "LuckGuides"
    },
    alternates: {
      canonical: `${host}${getPathname(lang, '/about')}`,
      languages: alternates
    }
  }
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const i18n: About = await getDictionary<About>(lang, i18nNamespaces.about)
  return <AboutClient i18n={i18n} lang={lang} />
}