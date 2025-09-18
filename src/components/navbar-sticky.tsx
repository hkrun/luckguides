"use client"
import Link from "next/link"
import { LanguageToggle } from "@/components/language-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { MobileMenu } from "@/components/mobile-menu"
// 不再需要自定义AuthProvider，使用NextAuth的SessionProvider
import { type Locale, getPathname } from "@/i18n-config";
import { AuthButton } from '@/components/auth/auth-button';
import { Navbar } from "@/types/locales/navbar"
import { usePathname } from "next/navigation"
import dynamic from "next/dynamic"
// 避免 SSR/CSR 渲染差异导致 Radix useId 链错位：积分组件仅在客户端渲染
const CreditsDisplay = dynamic(() => import("@/components/credits-display").then(m => m.CreditsDisplay), { ssr: false })
import { SubscriptionLocal, ToastLocal } from "@/types/locales/billing";

interface NavbarStickyProps {
    lang: Locale;
    navbarLocal: Navbar,
    subscriptionLocal: SubscriptionLocal,
    toastLocal: ToastLocal,
    i18n: {
        auth: {
            login: {
                title: string;
                googleButton: string;
                orDivider: string;
                emailLabel: string;
                emailPlaceholder: string;
                passwordLabel: string;
                passwordPlaceholder: string;
                loginButton: string;
                registerLink: string;
                registerButton: string;
                forgotPassword: string;
            };
            register: {
                title: string;
                googleButton: string;
                orDivider: string;
                emailLabel: string;
                emailPlaceholder: string;
                passwordLabel: string;
                passwordPlaceholder: string;
                firstNameLabel: string;
                firstNamePlaceholder: string;
                lastNameLabel: string;
                lastNamePlaceholder: string;
                registerButton: string;
                loginLink: string;
                loginButton: string;
            };
            errors: {
                emailRequired: string;
                emailInvalid: string;
                passwordRequired: string;
                passwordLength: string;
                firstNameRequired: string;
                lastNameRequired: string;
                loginFailed: string;
                registerFailed: string;
                googleLoginFailed: string;
                networkError: string;
                userNotFound: string;
                invalidCredentials: string;
                accountDisabled: string;
                [key: string]: string;
            };
            success: {
                welcomeBack: string;
                welcomeNew: string;
                [key: string]: string;
            };
        };
    };
}

export function NavbarSticky({ lang, navbarLocal, subscriptionLocal, toastLocal, i18n }: NavbarStickyProps) {
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

    return (
        <header className="sticky top-0 z-50 w-full bg-[#8B4513]/95 text-white shadow-md transition-all duration-300">
            <div className="container mx-auto">
                <div className="flex justify-between items-center py-3">
                    {/* Left Side: Logo + Navigation */}
                    <div className="flex items-center gap-8 flex-1">
                    {/* Logo */}
                    <Link scroll={true} href={getPathname(lang,"/")} className="flex items-center gap-3 flex-shrink-0" title="LuckGuides">
                        <span className="text-[#c8a96e] text-2xl"><i className="fa fa-star-o"></i></span>
                        <span className="text-xl font-bold">
                            LuckGuides
                        </span>
                    </Link>

                    {/* Desktop Navigation - Right next to logo */}
                    <nav className="hidden md:flex items-center gap-6">
                        {navbarLocal.navigation
                            .filter((item) => !["/", "/about", "/pricing", "/contact"].includes(item.href))
                            .map((item) => (
                            <Link
                                scroll={false}
                                key={item.href}
                                href={getPathname(lang, item.href)}
                                className={`text-sm font-medium transition-colors hover:text-[#c8a96e]
                                ${isActive(item.href) ? "text-[#c8a96e]" : "text-white/80"}`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-1 md:gap-4 flex-shrink-0">
                    {/* Credits (Client-only to prevent hydration mismatch) */}
                    <CreditsDisplay lang={lang} creditsDisplay={navbarLocal.creditsDisplay} />

                    {/* Desktop: show only language toggle; hide theme */}
                    <div className="hidden md:flex items-center gap-4">
                        <LanguageToggle lang={lang} label={navbarLocal.languageToggle.label} />
                    </div>

                    {/* Mobile Language Toggle */}
                    <div className="md:hidden">
                        <LanguageToggle lang={lang} label={navbarLocal.languageToggle.label} />
                    </div>
                    
                    {/* Auth Button hidden on all (as requested) */}

                    {/* Mobile Navigation Menu hidden as requested */}
                    </div>
                </div>
            </div>
        </header>
    )
}