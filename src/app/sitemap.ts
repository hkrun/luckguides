import { MetadataRoute } from 'next'
import { host } from '@/config/config'
import { localizationsKV } from '@/i18n-config'

export default function sitemap(): MetadataRoute.Sitemap {
    const commonPages = [
        '/contact',
        '/pricing',
        '/about'
    ]

    const singleUrls = [
        '/legal/privacy',
        '/legal/terms',
        '/legal/payments-refund'
    ];

    // 博客文章的slugs
    const blogSlugs = [
        'travel-translation-guide'
    ];

    const generateLocalizedUrls = (path: string) => {
        return Object.keys(localizationsKV).map((lang) => ({
            url: lang === 'en' 
                ? `${host}${path}` 
                : `${host}/${lang}${path}`,
            lastModified: new Date(),
            priority: path === '' ? 1.0 : (lang === 'en' ? 0.8 : 0.64),
        }))
    }

    const generateSingleUrl = (path: string) => ({
        url: `${host}${path}`,
        lastModified: new Date(),
        priority: 0.64,
    })

    // 生成博客文章的URL
    const generateBlogUrls = () => {
        // 生成所有语言的所有博客文章URL
        return blogSlugs.flatMap(slug => 
            Object.keys(localizationsKV).map(lang => ({
                url: lang === 'en' 
                    ? `${host}/about/${slug}` 
                    : `${host}/${lang}/about/${slug}`,
                lastModified: new Date(),
                priority: 0.6,
            }))
        );
    };

    const sitemapEntries: MetadataRoute.Sitemap = [
        ...generateLocalizedUrls(''),
        ...commonPages.flatMap(page => generateLocalizedUrls(`${page}`)),
        ...singleUrls.map(url => generateSingleUrl(url)),
        ...generateBlogUrls() // 添加博客文章URL
    ]

    return sitemapEntries
}