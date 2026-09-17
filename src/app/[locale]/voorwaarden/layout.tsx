import { createPageMetadata, type LocalizedLayoutProps } from '../layout-metadata'

export const generateMetadata = createPageMetadata('voorwaarden')

export default function TermsLayout({ children }: LocalizedLayoutProps) {
  return children
}
