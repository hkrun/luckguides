import { About } from '@/types/locales/about'

export interface BlogPost {
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishDate: string;
  author: string;
  authorRole: string;
  tags: string[];
  content: string;
}

export type BlogPosts = Record<string, BlogPost>;

export function generateBlogPosts(i18n: About): BlogPosts {
  // 直接使用 about.json 中每篇文章的 id 作为 slug，避免顺序变动导致错配
  const generateAllPosts = () => {
    return i18n.blogPosts.reduce((acc, post) => {
      const slug = (post as any).id as string;
      if (!slug) return acc;

      acc[slug] = {
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        readTime: post.readTime,
        publishDate: post.publishDate,
        author: post.author,
        authorRole: post.authorRole,
        tags: post.tags,
        content: generatePostContent(post.content)
      };

      return acc;
    }, {} as BlogPosts);
  };

  return generateAllPosts();
}

function generatePostContent(content: any): string {
  let html = '';

  // 循环处理最多15个章节
  for (let i = 1; i < 15; i++) {
    const titleKey = `section${i}Title`;
    const quoteKey = `quote${i}`;

    // 如果找不到章节标题，就停止处理
    if (!content[titleKey]) {
      break;
    }

    // 第一个章节使用 h2 标题，其他使用 h3
    const titleTag = i === 1 ? 'h2' : 'h3';
    html += `<${titleTag}>${content[titleKey]}</${titleTag}>`;

    // 循环处理每个章节的段落 (p1, p2, p3...)
    for (let p = 1; p < 10; p++) {
      const pKey = `section${i}P${p}`;
      if (content[pKey]) {
        html += `<p>${content[pKey]}</p>`;
      } else {
        // 没有更多段落了，跳出循环
        break;
      }
    }

    // 如果有引用，就添加引用
    if (content[quoteKey]) {
      html += `<blockquote>${content[quoteKey]}</blockquote>`;
    }
  }

  return html;
} 