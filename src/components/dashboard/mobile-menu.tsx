"use client"

import { useState } from "react"
import Link from "next/link"
import { X, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "../theme-toggle"
import { LanguageToggle } from "../language-toggle"
import { type Locale, getPathname } from "@/i18n-config";
import { useSession, signIn, signOut } from 'next-auth/react'
import { type MobileMenuLocale } from "@/types/locales/navbar"
import { usePathname } from "next/navigation"

interface MobileMenuProps {
    lang: Locale;
    i18n: MobileMenuLocale;
    languageToggle: string;
    themeToggle: string;
}

export function MobileMenu({ lang, i18n, languageToggle, themeToggle }: MobileMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const { data: session } = useSession();
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (lang === "en") {
            // 对于首页，只匹配精确路径
            if (href === "/") {
                return pathname === "/";
            }
            // 对于其他页面，支持子路径匹配
            return pathname === href || pathname.startsWith(href + "/");
        } else {
            const langPrefix = `/${lang}`;
            const fullPath = href === "/" ? langPrefix : `${langPrefix}${href}`;
            // 对于首页，只匹配精确路径
            if (href === "/") {
                return pathname === fullPath;
            }
            // 对于其他页面，支持子路径匹配
            return pathname === fullPath || pathname.startsWith(fullPath + "/");
        }
    };

    const toggleMenu = () => {
        setIsOpen(!isOpen)

        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "unset"
        }
    }

    const handleSignIn = () => {
        signIn();
        setIsOpen(false);
    }

    const handleSignOut = () => {
        const currentUrl = typeof window !== 'undefined'
            ? window.location.pathname + window.location.search + window.location.hash
            : `/${lang}`;
        signOut({ callbackUrl: currentUrl });
        setIsOpen(false);
    }

    return (
        <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMenu}>
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                <span className="sr-only">{i18n.toggleMenu}</span>
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-40 min-h-screen h-full w-full bg-background flex flex-col">
                    {/* Header Section - Logo and Close Button */}
                    <div className="flex items-center justify-between px-4 h-16 border-b border-border">
                        <Link scroll={false} href={getPathname(lang, "/")} className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                            <div className="w-8 h-8 rounded-full bg-deep-green flex items-center justify-center">
                                <i className="fa fa-globe text-gold text-lg"></i>
                            </div>
                            <span className="text-xl font-bold text-deep-green">
                                LuckGuides
                            </span>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsOpen(false)}
                            className="text-foreground/60 hover:text-foreground"
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="container flex flex-col h-full px-4 py-6">
                            {/* Actions Section */}
                            <div className="space-y-3 mb-8">
                                {session?.user ? (
                                    <Button
                                        className="inline-flex w-full h-12 items-center justify-center bg-primary hover:bg-primary/90 
                            text-primary-foreground font-medium shadow-lg rounded-md"
                                        onClick={handleSignOut}
                                    >
                                        {i18n.actions.signOut}
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full h-12 bg-primary hover:bg-primary/90 
                            text-primary-foreground font-medium shadow-lg"
                                        onClick={handleSignIn}
                                    >
                                        {i18n.actions.signIn}
                                    </Button>
                                )}
                            </div>

                            {/* Primary Navigation */}
                            <nav className="space-y-2">
                                {i18n.navigation.map((item) => (
                                    <Link
                                        scroll={false}
                                        key={item.href}
                                        href={getPathname(lang, item.href)}
                                        className={`
                                            flex items-center h-12 px-4 rounded-lg
                                            text-sm font-medium transition-colors
                                            hover:bg-accent hover:text-accent-foreground
                                             ${isActive(item.href) ? "text-primary-foreground bg-primary" : "text-foreground/60"}`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>

                            {/* Settings Section */}
                            <div className="pt-6 border-t border-border">
                                <div className="flex items-center justify-between px-4 py-4 rounded-lg bg-muted">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">{i18n.settings.theme}</span>
                                        <ThemeToggle label={languageToggle} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">{i18n.settings.language}</span>
                                        <LanguageToggle label={themeToggle} lang={lang} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}