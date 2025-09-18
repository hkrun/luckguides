import { type Locale, getPathname, generateAlternates } from "@/i18n-config";
import Policy from "./policy.mdx";
import { host } from '@/config/config'

export async function generateMetadata({ params }: { params: { lang: Locale } }) {
    const { lang } = await params;
    const alternates = generateAlternates(lang, '/legal/privacy');
    
    return {
        title: "Privacy Policy - LuckGuides Travel Translation",
        description: "Privacy policy for our travel translation platform.",
        alternates: {
            canonical: `${host}${getPathname(lang, '/legal/privacy')}`,
            languages: alternates
        }
    }
}

export default async function page({ params }: { params: { lang: Locale } }) {
    return <Policy />
}