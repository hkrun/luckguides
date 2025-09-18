import type React from "react"
import '@/styles/globals.css'
import { ThemeProvider } from "@/components/theme-provider"
import { type Locale } from "@/i18n-config";
import { Geist } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster"
import type { Metadata } from "next"
import { GoogleAnalytics } from '@next/third-parties/google'
import { NextAuthProvider } from "@/components/auth/next-auth-provider";

export const metadata: Metadata = {
  title: "LuckGuides - 五行测算与转运平台",
  description:
    "专注于五行测算与转运手串定制，为您调和气场，提升运势。",
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      }
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

const geist = Geist({
  subsets: ['latin'],
})

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode,
  params: Promise<{ lang: Locale }>
}>) {
  const { lang } = await params

  return (
    <html lang={lang} className={geist.className} suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />
      </head>
      <body>
        <NextAuthProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Toaster />
            {children}
        </ThemeProvider>
        </NextAuthProvider>
        <GoogleAnalytics gaId="G-4WQMFTCY1Q" />
      </body>
    </html>
  )
}

