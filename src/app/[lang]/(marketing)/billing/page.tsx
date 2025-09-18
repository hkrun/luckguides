import { BillingForm } from './billing-form';
import { getDictionary, i18nNamespaces } from '@/i18n'
import { Billing } from "@/types/locales/billing";
import { type Locale, getPathname, generateAlternates } from "@/i18n-config";
import { host } from '@/config/config'

export async function generateMetadata({ params }: { params: { lang: Locale } }) {
  const { lang } = await params;
  const alternates = generateAlternates(lang, '/billing');
  const i18nBilling = await getDictionary<Billing>(lang, i18nNamespaces.billing);
  
  return {
    title: i18nBilling.page.title,
    description: i18nBilling.page.description,
    alternates: {
      canonical: `${host}${getPathname(lang, '/billing')}`,
      languages: alternates
    }
  };
}

export default async function Page({ params }: { params: { lang: Locale } }) {
  const { lang } = await params
  const i18nBilling = await getDictionary<Billing>(lang, i18nNamespaces.billing);
  
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-background/80">
      <main className="flex-1 p-6 md:p-8 lg:p-10">
        <div className="mx-auto grid max-w-6xl gap-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{i18nBilling.page.title}</h1>
            <p className="text-muted-foreground">{i18nBilling.page.description}</p>
          </div>
          <BillingForm i18n={i18nBilling}/>
        </div>
      </main>
    </div>
  )
}