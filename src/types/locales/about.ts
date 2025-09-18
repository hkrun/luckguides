export interface About {
  hero: {
    title: string;
    description: string;
    noPosts: string;
    loadMore: string;
    allLoaded: string;
  };
  meta: {
    keywords: string;
    title: string;
    description: string;
  };
  post: {
    readTime: string;
    author: string;
    continueReading: string;
    imageAlt: string;
    tags: string;
    fallbackIcon: string;
    authorRole: string;
  };
  categories: {
    all: string;
    technology: string;
    conservation: string;
    marine: string;
    behavior: string,
    monitoring: string;
  };
  ui: {
    published: string;
    minutes: string;
    read: string;
    viewDetails: string;
    backToList: string;
    copied: string;
    share: string;
    youMayAlsoLike: string;
    viewMore: string;
  };
  blogPosts: {
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
    content: {
      section1Title: string;
      section1P1: string;
      quote1: string;
      section2Title: string;
      section2P1: string;
      section2P2: string;
      section3Title: string;
      section3P1: string;
      section3P2: string;
      section4Title: string;
      section4P1: string;
      section4P2: string;
      section5Title: string;
      section5P1: string;
      section5P2: string;
      section6Title: string;
      section6P1: string;
      section6P2: string;
      section7Title: string;
      section7P1: string;
      section7P2: string;
      section8Title: string;
      section8P1: string;
      section8P2: string;
      section8P3: string;
      section9Title?: string;
      section9P1?: string;
      section9P2?: string;
      section10Title?: string;
      section10P1?: string;
      section10P2?: string;
    };
  }[];
}