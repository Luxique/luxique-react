import { AuthProvider } from '@/lib/auth-context'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ChatWidget from '@/components/ChatWidget'
import CookieBanner from '@/components/CookieBanner'
import { NextIntlClientProvider } from 'next-intl'
import nlMessages from '../../../messages/nl.json'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="nl" messages={nlMessages}>
      <AuthProvider>
        <Navbar />
        <main>{children}</main>
        <Footer />
        <ChatWidget />
        <CookieBanner />
      </AuthProvider>
    </NextIntlClientProvider>
  )
}
