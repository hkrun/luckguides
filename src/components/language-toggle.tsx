"use client"

import { usePathname } from 'next/navigation'
import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { i18nConfig, type Locale, languages, getPathname } from "@/i18n-config";
import Link from 'next/link'

interface LanguageToggleProps {
  lang: Locale;
  label: string;
}

export function LanguageToggle({ lang, label }: LanguageToggleProps) {

  const pathname = usePathname()

  const redirectedPathName = (locale: Locale) => {
    if (!pathname) return "/";
    const pathSegments = pathname.split("/").filter(Boolean);
    if (pathname === "/") {
      return locale === i18nConfig.defaultLocale ? "/" : `/${locale}`;
    }
    if (pathSegments.length === 1 && i18nConfig.locales.includes(pathSegments[0])) {
      return locale === i18nConfig.defaultLocale ? "/" : `/${locale}`;
    }
    const firstSegmentIsLocale = i18nConfig.locales.includes(pathSegments[0]);
    if (locale === i18nConfig.defaultLocale) {
      return firstSegmentIsLocale ? `/${pathSegments.slice(1).join('/')}` : pathname;
    } else {
      return firstSegmentIsLocale
        ? `/${locale}${pathname.substring(pathname.indexOf("/", 1))}`
        : `/${locale}${pathname}`;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-32 border-border bg-background"
      >
        {Object.entries(languages).map(([locale, name]) => (
          <DropdownMenuItem
            key={locale}
            className="focus:bg-accent focus:text-accent-foreground"
          >
            <Link
              href={redirectedPathName(locale)}
              locale={locale}
              className={`w-full ${locale === lang
                  ? "text-primary font-medium"
                  : "text-foreground/60 hover:text-primary"
                }`}
            >
              {name}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

