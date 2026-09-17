import { createPageMetadata, type LocalizedLayoutProps } from '../layout-metadata'

export const generateMetadata = createPageMetadata('behandelingen')

export default function BehandelingenLayout({ children }: LocalizedLayoutProps) {
  return children
}
