import { createPageMetadata, type LocalizedLayoutProps } from '../layout-metadata'

export const generateMetadata = createPageMetadata('about')

export default function AboutLayout({ children }: LocalizedLayoutProps) {
  return children
}
