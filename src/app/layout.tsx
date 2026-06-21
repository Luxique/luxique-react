import type { Metadata, Viewport } from 'next'
import './globals.css'

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
    <html>
      <head>
        <meta name="theme-color" content="#FAF8F4" />
        <meta name="color-scheme" content="light" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>{children}</body>
    </html>
  )
}
