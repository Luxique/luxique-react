import type { Metadata } from 'next'
import { buildLocalizedPageMetadata, type PageKey } from '@/lib/seo-metadata'

export type LocalizedLayoutProps = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function createPageMetadata(page: PageKey) {
  return async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params
    return buildLocalizedPageMetadata(locale, page)
  }
}
