import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

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
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
