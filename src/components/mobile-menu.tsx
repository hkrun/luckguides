"use client"

import { useState } from "react"
import Link from "next/link"
import { X, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import { LanguageToggle } from "./language-toggle"
import { type Locale, getPathname } from "@/i18n-config";
import { useSession } from 'next-auth/react'
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
            if (href === "/") {
                return pathname === "/";
            }
            return pathname === href || pathname.startsWith(href + "/");
        } else {
            const langPrefix = `/${lang}`;
            const fullPath = href === "/" ? langPrefix : `${langPrefix}${href}`;
            if (href === "/") {
            return pathname === fullPath;
            }
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



    return (
        <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMenu}>
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                <span className="sr-only">{i18n.toggleMenu}</span>
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-40 min-h-screen h-full w-full bg-[#8B4513]/95 text-white flex flex-col">
                    {/* Header Section - Logo and Close Button */}
                    <div className="flex items-center justify-between px-4 h-16 border-b border-[#c8a96e]/30">
                        <Link scroll = {false} href={getPathname(lang, "/")} className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                            <span className="text-[#c8a96e] text-2xl"><i className="fa fa-star-o"></i></span>
                            <span className="text-xl font-bold">
                                LuckGuides
                            </span>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsOpen(false)}
                            className="text-white/60 hover:text-white"
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="container flex flex-col h-full px-4 py-6">
                            {/* Primary Navigation */}
                            <nav className="space-y-2 mb-8">
                                {i18n.navigation.map((item) => (
                                    <Link
                                        scroll = {false}
                                        key={item.href}
                                        href={getPathname(lang, item.href)}
                                        className={`
                                            flex items-center h-12 px-4 rounded-lg
                                            text-sm font-medium transition-colors
                                            hover:bg-[#c8a96e]/20 hover:text-[#c8a96e]
                                             ${isActive(item.href) ? "text-white bg-[#c8a96e]" : "text-white/80"}`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>

                            {/* Actions Section */}
                            <div className="space-y-3 mb-8 pt-6 border-t border-[#c8a96e]/30">
                                {session?.user && (
                                    <Link
                                        scroll = {false}
                                        href={getPathname(lang, "/pricing")}
                                        className="inline-flex w-full h-12 items-center justify-center border border-[#c8a96e]/30
                            hover:bg-[#c8a96e]/20 rounded-md text-white font-medium shadow-sm"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {i18n.actions.upgradePlan}
                                    </Link>
                                )}
                                <Link
                                    scroll = {false}
                                    href={getPathname(lang, "/contact")}
                                    className="inline-flex w-full h-12 items-center justify-center border border-[#c8a96e]/30
                        hover:bg-[#c8a96e]/20 rounded-md text-white"
                                    onClick={() => setIsOpen(false)}
                                >
                                    {i18n.actions.contactUs}
                                </Link>
                            </div>

                            {/* Settings Section */}
                            <div className="pt-6">
                                <div className="flex items-center justify-between px-4 py-4 rounded-lg bg-[#c8a96e]/10">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-white/80">{i18n.settings.theme}</span>
                                        <ThemeToggle label={languageToggle} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-white/80">{i18n.settings.language}</span>
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