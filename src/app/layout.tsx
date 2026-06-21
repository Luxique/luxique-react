import type { Metadata, Viewport } from 'next'
import { Outfit, Cormorant_Garamond, Jost, Pinyon_Script } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-body',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-serif',
})

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
  variable: '--font-display',
})

const pinyon = Pinyon_Script({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-script',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'LXQ Academy — The Art of Lashes, Perfected',
  description: 'Behandelingen in Arnhem. Opleidingen voor de nieuwe lichting lash artists — door Nederland\'s #1 lash educator.',
  icons: {
    icon: '/favicon.ico',
  },
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
    <html lang="nl" className={`${outfit.variable} ${cormorant.variable} ${jost.variable} ${pinyon.variable}`}>
      <head>
        <meta name="theme-color" content="#FAF8F4" />
        <meta name="color-scheme" content="light" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var p = window.location.pathname.split('/')[1];
              var locales = ['nl','en','es','fr','de','it'];
              if (locales.indexOf(p) !== -1) {
                document.documentElement.lang = p;
              }
            } catch(e){}
          })();
        ` }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
