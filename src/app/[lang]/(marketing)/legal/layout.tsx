import { i18nConfig, type Locale, getPathname, localizationsKV, languages } from "@/i18n-config";
import { getDictionary, i18nNamespaces } from '@/i18n'
import { host } from '@/config/config'
import { Home } from "@/types/locales";


export async function generateMetadata({ params }: { params: { lang: Locale } }) {
  const { lang } = await params;
  const alternates = Object.keys(languages).reduce((acc, l) => {
    acc[localizationsKV[l]] = `${host}${getPathname(l as Locale, '')}`;
    return acc;
  }, {} as { [key: string]: string });

  // Try to read translated meta, but fall back safely if missing
  let title = 'LuckGuides';
  let description = 'AI video luck guides website';
  try {
    const i18nHome = await getDictionary<Home>(lang, i18nNamespaces.home);
    const t = (i18nHome as any)?.meta;
    if (t?.title) title = t.title;
    if (t?.description) description = t.description;
  } catch {
    // Ignore and use defaults
  }

  return {
    title,
    description,
    twitter: {
      card: "summary_large_image",
      title,
      description
    },
    openGraph: {
      type: "website",
      url: `${host}${getPathname(lang, '')}`,
      title,
      description,
      siteName: "LuckGuides"
    },
    alternates: {
      canonical: `${host}${getPathname(lang, '')}`,
      languages: alternates
    }
  }
}

export default async function Layout({
  children, params
}: Readonly<{
  children: React.ReactNode,
  params: { lang: Locale }
}>) {
  return (
    <div className={`prose max-w-none m-5 mb-20 dark:prose-h1:text-gray-200 dark:prose-h2:text-gray-200 dark:prose-a:text-gray-200
       dark:prose-h3:text-gray-200 dark:prose-strong:text-gray-200 dark:prose-p:text-gray-400 dark:prose-li:text-gray-400`}>
      {children}
    </div>
  );
}
