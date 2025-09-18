import { getDictionary, i18nNamespaces } from '@/i18n'
import type { About } from '@/types/locales/about'
import { type Locale, i18nConfig, getPathname, generateAlternates } from "@/i18n-config";
import { notFound } from 'next/navigation'
import AboutPostClient from './about-post-client'
import { generateBlogPosts } from '@/data/blog-posts'
import { host } from '@/config/config'

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale; slug: string }> }) {
  const { lang, slug } = await params;
  const alternates = generateAlternates(lang, `/about/${slug}`);
  const i18n: About = await getDictionary<About>(lang, i18nNamespaces.about);
  
  // 生成博客文章数据
  const blogPosts = generateBlogPosts(i18n);
  const post = blogPosts[slug as keyof typeof blogPosts];
  
  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested blog post could not be found.'
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags.join(', '),
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt
    },
    openGraph: {
      type: "article",
      url: `${host}${getPathname(lang, `/about/${slug}`)}`,
      title: post.title,
      description: post.excerpt,
      siteName: "LuckGuides",
      publishedTime: post.publishDate,
      authors: [post.author]
    },
    alternates: {
      canonical: `${host}${getPathname(lang, `/about/${slug}`)}`,
      languages: alternates
    }
  };
}

export default async function Page({ params }: { params: Promise<{ lang: Locale; slug: string }> }) {
  const { lang, slug } = await params;
  const i18n: About = await getDictionary<About>(lang, i18nNamespaces.about);

  // 使用新的数据生成函数
  const blogPosts = generateBlogPosts(i18n);
  const post = blogPosts[slug as keyof typeof blogPosts];
  
  // 如果找不到文章，重定向到 404 页面
  if (!post) {
    notFound();
  }

  return <AboutPostClient lang={lang} slug={slug} i18n={i18n} post={post} />;
}

// 生成静态页面参数
export async function generateStaticParams() {
  // 获取默认语言的文章列表
  const i18n: About = await getDictionary<About>('en', i18nNamespaces.about);
  const blogPosts = generateBlogPosts(i18n);
  const slugs = Object.keys(blogPosts);
  
  // 为每个语言和文章生成参数
  const params = i18nConfig.locales.flatMap((lang) => 
    slugs.map((slug) => ({
      lang,
      slug,
    }))
  );
  
  return params;
} 