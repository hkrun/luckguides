import { host } from '@/config/config'

export const languages: Record<string, string> = {
  en: "English",
  es: "Español",
  zh: "中文",
  de: "Deutsch",
  fr: "Français",
  ja: "日本語",
  ko: "한국어",
};

export const i18nConfig = {
  defaultLocale: "en",
  locales: Object.keys(languages),
  localeDetector: false,
  prefixDefault : true
} as const;

export type Locale = (typeof i18nConfig)["locales"][number];

export const localizationsKV: Record<string, string> = {
  en: 'en-US',
  zh: 'zh-CN',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
  ja: 'ja-JP',
  ko: 'ko-KR'
}

export function getPathname(lang: Locale, pathname: string) {
  if (lang === i18nConfig.defaultLocale) {
    return pathname;
  }else{
    return `/${lang}${pathname}`;
  }
}

export function generateAlternates(lang: string, path:string) {
  const alternates = Object.keys(languages).reduce((acc, lang) => {
    acc[localizationsKV[lang]] = `${host}${getPathname(lang, path)}`;
    return acc;
  }, {} as { [key: string]: string });
  
  // 添加默认语言配置
  alternates['x-default'] = `${host}${getPathname(i18nConfig.defaultLocale, path)}`;
  
  return alternates;
}