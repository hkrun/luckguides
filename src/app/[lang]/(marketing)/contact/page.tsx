import { Users, Globe2, Mail} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type Locale, getPathname, generateAlternates  } from "@/i18n-config"
import { getDictionary, i18nNamespaces } from '@/i18n'
import { Contact } from "@/types/locales/contact"
import { ContactForm } from "./contact-form"
import { host } from '@/config/config'
import { Auth } from '@/types/locales/auth'

export async function generateMetadata({ params }: { params: { lang: Locale } }) {
  const { lang } = await params
  const alternates = generateAlternates(lang, '/contact');
  const i18nContact = await getDictionary<Contact>(lang, i18nNamespaces.contact);
  return {
    title: i18nContact.meta.title,
    description: i18nContact.meta.description,
    keywords: i18nContact.meta.keywords,
    twitter: {
      card: "summary_large_image", title: i18nContact.meta.title,
      description: i18nContact.meta.description
    },
    openGraph: {
      type: "website",
      url: `${host}${getPathname(lang, '/contact')}`,
      title: i18nContact.meta.title,
      description: i18nContact.meta.description,
      siteName: "LuckGuides"
    },
    alternates: {
      canonical: `${host}${getPathname(lang, '/contact')}`,
      languages: alternates
    }
  }
}

export default async function Page({ params }: { params: { lang: Locale } }) {

  const { lang } = await params
  const i18nContact = await getDictionary<Contact>(lang, i18nNamespaces.contact)
  const i18nAuth = await getDictionary<Auth>(lang, i18nNamespaces.auth)

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900 font-inter text-gray-900 dark:text-white">
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="container py-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">CONTACT US</span>
            <h1 className="text-[clamp(1.8rem,4vw,3rem)] font-bold mt-2 mb-6 text-gray-900 dark:text-white">
              {i18nContact.hero.title||"联系AI动物识别团队"}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {i18nContact.hero.description||"需要动物识别技术支持？联系我们的专家团队获取识别咨询、技术帮助和动物保护建议。"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700">
              <div className="p-8 border-b dark:border-gray-700">
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{i18nContact.info.title||"联系信息"}</h3>
                <p className="text-gray-600 dark:text-gray-300">{i18nContact.info.description||"我们的联系方式和地址，方便您随时联系我们。"}</p>
              </div>
              <div className="p-8 space-y-6">
                {i18nContact.info.contacts.map((contact, index) => (
                  <div key={index} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    {index === 0 && <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                    {index === 1 && <Globe2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                    {index === 2 && <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                    <span>{contact.text||"联系我们"}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700">
              <div className="p-8 border-b dark:border-gray-700">
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{i18nContact.form.title||"联系我们"}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {i18nContact.form.description||"请填写以下信息，我们将尽快回复您。"}
                </p>
              </div>
              <div className="p-8">
              <ContactForm
                formLabels={i18nContact.form}
                lang={lang}
                authTexts={{auth: i18nAuth}}
                authErrorTitle={(i18nContact as any).auth?.loginRequired?.title}
                authErrorDesc={(i18nContact as any).auth?.loginRequired?.description}
              />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}