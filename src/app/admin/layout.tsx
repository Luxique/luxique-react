'use client'

import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/lib/auth-context'
import Navbar from '@/components/Navbar'
import ChatWidget from '@/components/ChatWidget'
import { NextIntlClientProvider } from 'next-intl'
import nlMessages from '../../../messages/nl.json'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isBuilderPage = pathname?.includes('/builder')
  
  return (
    <NextIntlClientProvider locale="nl" messages={nlMessages}>
      <AuthProvider>
        <Navbar />
        <main>{children}</main>
        {/* ChatWidget hidden on builder pages; admin routes never render the public footer. */}
        {!isBuilderPage && <ChatWidget />}
      </AuthProvider>
    </NextIntlClientProvider>
  )
}
