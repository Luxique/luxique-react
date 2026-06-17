import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

import { AuthProvider } from '@/lib/auth-context'
import ChatWidget from '@/components/ChatWidget'
import CookieBanner from '@/components/CookieBanner'
import ThemeColorManager from '@/components/ThemeColorManager'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'LXQ Academy — The Art of Lashes, Perfected',
  description: 'Behandelingen in Arnhem. Opleidingen voor de nieuwe lichting lash artists — door Nederland\'s #1 lash educator.',
  keywords: 'lash extensions, lash artist, lash opleiding, wispy, medusa, Arnhem, LXQ Academy',
  openGraph: {
    title: 'LXQ Academy — The Art of Lashes, Perfected',
    description: 'Opleidingen voor de nieuwe lichting lash artists — door Nederland\'s #1 lash educator.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <head>
        <meta name="theme-color" content="#FAF8F4" />
        <meta name="color-scheme" content="light" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <ChatWidget />
          <CookieBanner />
          <ThemeColorManager />
        </AuthProvider>
      </body>
    </html>
  )
}
