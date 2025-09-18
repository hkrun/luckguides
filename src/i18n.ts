import { i18nConfig } from '@/i18n-config'

export const i18nNamespaces = {
    about: 'about',
    home: 'home',
    contact: 'contact',
    navbar: 'navbar',
    footer: 'footer',
    policy: 'policy',
    pricing: 'pricing',
    billing: 'billing',
    auth: 'auth',

    subscriptionDialog: 'subscription-dialog',
    textTranslation: 'text-translation',
    photoTranslation: 'photo-translation',
    voiceTranslation: 'voice-translation',
    travelGuide: 'travel-guide',
    features: 'features'
};

export async function getDictionary<T>(
    locale: string, 
    namespace: string, 
    subDir?: string
): Promise<T> {
    try {
        const basePath = subDir ? `${subDir}/` : '';
        const localeConfig = await import(`@/locales/${basePath}${locale}/${namespace}.json`).then(
            (module) => module.default
        );
        return localeConfig;
    } catch (error) {
        console.error(`Failed to load locale "${locale}", falling back to default locale.`, error);
        const basePath = subDir ? `${subDir}/` : '';
        const defaultConfig = await import(
            `@/locales/${basePath}${i18nConfig.defaultLocale}/${namespace}.json`
        ).then((module) => module.default);
        return defaultConfig;
    }
}