"use client"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { MobileMenu } from "./mobile-menu"
import { type Locale, getPathname } from "@/i18n-config";
import { AuthButton } from '@/components/dashboard/auth/auth-button';
import { Navbar } from "@/types/locales/navbar"
import { usePathname } from "next/navigation"

interface NavbarStickyProps {
    lang: Locale;
    navbarLocal: Navbar,
}

export function NavbarSticky({ lang, navbarLocal }: NavbarStickyProps) {
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

    return (
        <header className="sticky top-0 z-50 w-full border-b border-primary-gold/20 bg-background">
            <div className="container flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <Link scroll={true} href={getPathname(lang,"/")} className="flex items-center gap-3 flex-shrink-0" title={navbarLocal.logoTitle}>
                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                        <i className="fa fa-magic text-xl"></i>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">
                        {navbarLocal.logo}
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6">
                    {navbarLocal.navigation.map((item) => (
                        <Link
                            scroll={false}
                            key={item.href}
                            href={getPathname(lang, item.href)}
                            className={`text-sm font-medium transition-colors hover:text-primary-gold
                            ${isActive(item.href) ? "text-primary-gold" : "text-foreground/60"}`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Right Side Actions */}
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Language, Theme Toggles - Hidden on mobile */}
                    <div className="hidden md:flex items-center gap-4">
                        <ThemeToggle label={navbarLocal.themeToggle.label} />
                    </div>
                        
                        <AuthButton
                            lang={lang}
                            userButton={navbarLocal.userButton}
                            loginLabel={navbarLocal.actions.signIn}/>

                    {/* Mobile Navigation Menu (Hidden by default) */}
                    <MobileMenu lang={lang} i18n={navbarLocal.mobileMenu}
                        themeToggle={navbarLocal.languageToggle.label}
                        languageToggle={navbarLocal.themeToggle.label} />
                </div>
            </div>
        </header>
    )
}