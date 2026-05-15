import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

import { AuthProvider } from '@/lib/auth-context'
import ChatWidget from '@/components/ChatWidget'
import ThemeColorManager from '@/components/ThemeColorManager'

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
        <meta name="theme-color" content="#0C0A07" />
        <meta name="color-scheme" content="dark" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script type="module" src="https://cdn.mux.com/mux-player/1.15.0/mux-player.mjs" async></script>
      </head>
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <ChatWidget />
          <ThemeColorManager />
        </AuthProvider>
      </body>
    </html>
  )
}
