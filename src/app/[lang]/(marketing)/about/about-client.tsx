"use client";
import Link from "next/link";
import { Clock, Calendar, ArrowRight, Search, User } from "lucide-react"
import { useState, useMemo } from "react";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishDate: string;
  author: string;
  authorRole: string;
  image: string;
  tags: string[];
  content?: any;
  meta?: any;
}

const POSTS_PER_PAGE = 6;

export default function AboutClient({ i18n, lang }: { i18n: any, lang: string }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [displayCount, setDisplayCount] = useState(POSTS_PER_PAGE);
  const [searchQuery, setSearchQuery] = useState("");

  const blogPosts: BlogPost[] = i18n.blogPosts || [];

  const categories = [
    { name: i18n.categories.all, slug: "all" },
    { name: i18n.categories["ai-technology"], slug: "ai-technology" },
    { name: i18n.categories.tutorials, slug: "tutorials" },
    { name: i18n.categories["use-cases"], slug: "use-cases" },
    { name: i18n.categories.ethics, slug: "ethics" },
    { name: i18n.categories["product-updates"], slug: "product-updates" },
    { name: i18n.categories["tips-tricks"], slug: "tips-tricks" }
  ];

  const filteredPosts = useMemo(() => {
    let posts = blogPosts;

    // Filter by category
    if (activeCategory !== "all") {
      const categoryName = categories.find(c => c.slug === activeCategory)?.name;
      posts = posts.filter((post: BlogPost) => post.category === categoryName);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      posts = posts.filter((post: BlogPost) =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return posts;
  }, [activeCategory, searchQuery, categories, blogPosts]);

  const displayedPosts = useMemo(() => {
    return filteredPosts.slice(0, displayCount);
  }, [filteredPosts, displayCount]);

  const hasMorePosts = displayCount < filteredPosts.length;

  const handleCategoryClick = (categorySlug: string) => {
    setActiveCategory(categorySlug);
    setDisplayCount(POSTS_PER_PAGE);
  };

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + POSTS_PER_PAGE);
  };

  return (
    <div className="font-inter bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      {/* Blog Hero Section */}
      <section className="py-12 bg-gradient-to-br from-blue-600/5 to-gray-50 dark:from-blue-600/10 dark:to-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">{i18n.hero.subtitle}</span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900 dark:text-white mb-6 mt-2">
              {i18n.hero.title}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
              {i18n.hero.description}
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <input
                type="text"
                placeholder={i18n.hero.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/50 dark:focus:ring-blue-400/50 focus:border-blue-600 dark:focus:border-blue-400"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Categories */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto scrollbar-hide pb-4 gap-3">
            {categories.map((category) => (
              <button
                key={category.slug}
                onClick={() => handleCategoryClick(category.slug)}
                className={`px-5 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                  activeCategory === category.slug
                    ? "bg-blue-600 dark:bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-600/10 dark:hover:bg-blue-400/10"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Blog Post */}
      {displayedPosts.length > 0 && (
        <section className="py-10 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-gray-700 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-600 hover:scale-105">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <img
                    src={displayedPosts[0].image || "https://picsum.photos/id/1/800/600"}
                    alt={displayedPosts[0].title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="md:w-1/2 p-8 flex flex-col justify-center">
                  <div className="flex items-center mb-4">
                    <span className="bg-blue-600/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 text-sm font-medium px-3 py-1 rounded-full">{i18n.sections.featured}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm ml-4">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {displayedPosts[0].publishDate}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white">{displayedPosts[0].title}</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">{displayedPosts[0].excerpt}</p>
                  <div className="flex items-center mt-auto">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full mr-3 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{displayedPosts[0].author}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{displayedPosts[0].authorRole}</p>
                    </div>
                    <Link
                      href={`/${lang}/about/${displayedPosts[0].id}`}
                      className="ml-auto text-blue-600 dark:text-blue-400 font-medium hover:text-blue-600/80 dark:hover:text-blue-400/80 transition-colors"
                    >
                      {i18n.sections.readMore} <ArrowRight className="w-4 h-4 inline ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Latest Blog Posts */}
      <section className="py-16 bg-gray-100 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{i18n.sections.latestArticles}</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">{i18n.sections.latestDescription}</p>
            </div>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">{i18n.sections.noArticlesFound}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(displayedPosts.length === 1 ? displayedPosts : displayedPosts.slice(1)).map((post: BlogPost) => (
                <div key={post.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:scale-105">
                  <div className="relative">
                    <img
                      src={post.image || "https://picsum.photos/id/2/600/400"}
                      alt={post.title}
                      className="w-full h-56 object-cover"
                      loading="lazy"
                    />
                    <span className="absolute top-4 left-4 bg-blue-600/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 text-xs font-medium px-2 py-1 rounded-full">
                      {post.category}
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <span><Calendar className="w-4 h-4 inline mr-1" /> {post.publishDate}</span>
                      <span className="mx-2">•</span>
                      <span><Clock className="w-4 h-4 inline mr-1" /> {post.readTime}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{post.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">{post.excerpt}</p>
                    <Link
                      href={`/${lang}/about/${post.id}`}
                      className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-600/80 dark:hover:text-blue-400/80 transition-colors"
                    >
                      {i18n.sections.continueReading} <ArrowRight className="w-4 h-4 inline ml-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMorePosts && (
            <div className="mt-10 text-center">
              <button
                onClick={handleLoadMore}
                className="inline-flex items-center px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600/90 dark:hover:bg-blue-500/90 transition-colors shadow-md"
              >
                {i18n.sections.loadMoreArticles} <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          )}


        </div>
      </section>


    </div>
  )
} 