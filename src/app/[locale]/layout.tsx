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

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const messages = await getMessages({ locale })
  const homepage = (messages as any).Homepage || {}
  
  const title = homepage.metaTitle || 'LXQ Academy — The Art of Lashes, Perfected'
  const description = homepage.metaDescription || 'Behandelingen in Arnhem. Opleidingen voor de nieuwe lichting lash artists.'
  
  // Generate hreflang alternate links
  const alternates: Record<string, string> = {}
  for (const loc of routing.locales) {
    alternates[loc] = `/${loc}`
  }
  
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: alternates,
    },
    openGraph: {
      title,
      description,
      type: 'website',
    }
  }
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
      <head>
        <link rel="preconnect" href="https://osldoolmbpqayxhgmbum.supabase.co" />
        <link rel="dns-prefetch" href="https://osldoolmbpqayxhgmbum.supabase.co" />
      </head>
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
