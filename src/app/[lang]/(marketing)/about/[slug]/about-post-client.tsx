"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button"
import { Clock, User, ArrowLeft, Share, BookOpen, Check } from "lucide-react"
import { getPathname } from "@/i18n-config";
import { useState } from "react";

export default function AboutPostClient({ lang, slug, i18n, post }: { lang: string, slug: string, i18n: any, post: any }) {
  const [copied, setCopied] = useState(false);

  // 分享功能
  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const title = post.title;
    const text = post.excerpt || '查看这篇关于AI动物识别的精彩文章！';

    // 尝试使用原生分享API
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url
        });
        return;
      } catch (err) {
        console.log('分享被取消或失败');
      }
    }

    // 如果原生分享不可用，复制链接到剪贴板
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制链接失败:', err);
      // 手动选择文本作为备用方案
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-inter text-gray-800 dark:text-gray-200">
      {/* Header with breadcrumb */}
      <section className="container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href={getPathname(lang, '/about')}
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {i18n.ui.backToList}
          </Link>
          {/* Category Tag */}
          <div className="mb-4">
            <span className="px-3 py-1 text-sm font-medium bg-blue-600 dark:bg-blue-500 text-white rounded-full">
              {post.category}
            </span>
          </div>
          {/* Article Title */}
          <h1 className="font-playfair text-3xl md:text-5xl font-bold leading-tight mb-6 text-gray-900 dark:text-white">
            {post.title}
          </h1>
          {/* Article Meta */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{post.author}</span>
              <span className="text-xs">·</span>
              <span>{post.authorRole}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{post.readTime}</span>
            </div>
            <span>{post.publishDate}</span>
          </div>
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag: string, index: number) => (
              <span key={index} className="text-xs px-2 py-1 bg-blue-600/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 rounded-md">
                {tag}
              </span>
            ))}
          </div>
          {/* Share Button */}
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border/50 dark:border-gray-700">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={handleShare}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  {i18n.ui.copied}
                </>
              ) : (
                <>
                  <Share className="w-4 h-4" />
                  {i18n.ui.share}
                </>
              )}
            </Button>
          </div>
        </div>
      </section>
      {/* Article Content */}
      <section className="container px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <article
            className="prose prose-lg max-w-none dark:prose-invert
                       prose-headings:text-gray-900 dark:prose-headings:text-white prose-headings:font-bold
                       prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                       prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                       prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-4
                       prose-blockquote:border-l-4 prose-blockquote:border-blue-600 dark:prose-blockquote:border-blue-400 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400
                       prose-strong:text-gray-800 dark:prose-strong:text-gray-200 prose-strong:font-semibold
                       prose-a:text-blue-600 dark:prose-a:text-blue-400
                       prose-code:text-gray-800 dark:prose-code:text-gray-200
                       prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          {/* Article Footer */}
          <div className="mt-12 pt-8 border-t border-gray-300/50 dark:border-gray-700">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center shadow-sm">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{post.author}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{post.authorRole}</p>
              </div>
            </div>
            {/* Related Articles */}
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{i18n.ui.youMayAlsoLike}</h3>
              <div className="text-center">
                <Link href={getPathname(lang, '/about')}>
                  <Button variant="outline" className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {i18n.ui.viewMore}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}