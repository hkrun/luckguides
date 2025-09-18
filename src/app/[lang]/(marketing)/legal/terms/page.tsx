import { Locale, getPathname, generateAlternates } from "@/i18n-config";
import { host } from '@/config/config'
import Terms from './terms.mdx'

export async function generateMetadata({ params }: { params: { lang: Locale } }) {
    const { lang } = await params;
    const alternates = generateAlternates(lang, '/legal/terms');
    
    return {
        title: "Terms of Service - LuckGuides Travel Translation",
        description: "Terms of service for our travel translation platform.",
        alternates: {
            canonical: `${host}${getPathname(lang, '/legal/terms')}`,
            languages: alternates
        }
    }
}

export default function page({ params }: { params: { lang: Locale } }) {

    return <Terms />
}