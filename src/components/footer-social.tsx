import Link from "next/link"
import { type Footer as FooterSocialType } from "@/types/locales/footer"
import { SOCIAL_ICONS } from "@/components/icons/social-icons"
import { type Locale, getPathname } from "@/i18n-config";

interface FooterSocialProps {
    lang: Locale;
    i18n: FooterSocialType;
}

export function FooterSocial({ lang, i18n }: FooterSocialProps) {
    return (
        <footer className="bg-[#8B4513] text-white pt-16 pb-8">
            <div className="container mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
                    <div className="lg:col-span-2">
                        <Link scroll={true} href={getPathname(lang,"/")} className="flex items-center mb-6" title={i18n.logoTitle}>
                            <span className="text-[#c8a96e] text-2xl mr-3"><i className="fa fa-star-o"></i></span>
                            <span className="text-2xl font-bold text-white">
                                {i18n.logo}
                            </span>
                        </Link>
                        <p className="text-gray-300 mb-6 max-w-md leading-relaxed">
                            {i18n.description}
                        </p>
                        <div className="flex space-x-4">
                            {i18n.socials.map((social) => {
                                const Icon = SOCIAL_ICONS[social.name]
                                return (
                                    <Link
                                        target="_blank"
                                        key={social.name}
                                        href={social.href}
                                        className="w-10 h-10 rounded-full bg-[#c8a96e]/20 flex items-center justify-center hover:bg-[#c8a96e] transition-colors duration-200"
                                    >
                                        <span className="sr-only">{social.name}</span>
                                        <Icon className="h-5 w-5 text-white" />
                                    </Link>
                                )
                            })}
                        </div>
                    </div>

                    {/* 在手机端将三个部分放在一行显示 */}
                    <div className="col-span-full flex flex-row justify-between md:hidden">
                        {i18n.sections.map((section) => (
                            <div key={section.title} className="w-1/3 pr-2">
                                <h3 className="mb-3 text-xs font-semibold tracking-wide uppercase text-white">{section.title}</h3>
                                <ul className="space-y-2 text-xs">
                                    {section.links.map((link) => (
                                        <li key={link.label}>
                                            <Link
                                                href={link.href.startsWith('#') || link.href.startsWith('http') ? link.href : getPathname(lang, link.href)}
                                                className="text-gray-300 hover:text-[#c8a96e] transition-colors duration-200"
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* 在平板和桌面显示原始布局 */}
                    <div className="hidden md:grid md:grid-cols-3 md:col-span-2 lg:col-span-3 md:gap-8">
                        {i18n.sections.map((section) => (
                            <div key={section.title}>
                                <h3 className="mb-6 text-lg font-bold text-white">{section.title}</h3>
                                <ul className="space-y-3 text-sm">
                                    {section.links.map((link) => (
                                        <li key={link.label}>
                                            <Link
                                                href={link.href.startsWith('#') || link.href.startsWith('http') ? link.href : getPathname(lang, link.href)}
                                                className="text-gray-300 hover:text-[#c8a96e] transition-colors duration-200"
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-400 text-sm mb-4 md:mb-0">
                        {i18n.copyright.replace('{year}', new Date().getFullYear().toString())}
                    </p>

                    {/* 法律链接 */}
                    <div className="flex space-x-6 text-sm">
                        <Link href={getPathname(lang, '/legal/privacy')} className="text-gray-400 hover:text-[#c8a96e] transition-colors">
                            {i18n.legal.privacyPolicy}
                        </Link>
                        <Link href={getPathname(lang, '/legal/terms')} className="text-gray-400 hover:text-[#c8a96e] transition-colors">
                            {i18n.legal.termsOfService}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}