import { createPageMetadata, type LocalizedLayoutProps } from '../layout-metadata'

export const generateMetadata = createPageMetadata('faq')

export default function FaqLayout({ children }: LocalizedLayoutProps) {
  return children
}
