import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/lib/auth-context'
import ChatWidget from '@/components/ChatWidget'
import CookieBanner from '@/components/CookieBanner'
import ThemeColorManager from '@/components/ThemeColorManager'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }
  
  setRequestLocale(locale)
  const messages = await getMessages({ locale })
  
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AuthProvider>
        <Navbar />
        <main>{children}</main>
        <Footer />
        <ChatWidget />
        <CookieBanner />
        <ThemeColorManager />
      </AuthProvider>
    </NextIntlClientProvider>
  )
}
