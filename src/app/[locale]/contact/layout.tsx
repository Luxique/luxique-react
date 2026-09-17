import { createPageMetadata, type LocalizedLayoutProps } from '../layout-metadata'

export const generateMetadata = createPageMetadata('contact')

export default function ContactLayout({ children }: LocalizedLayoutProps) {
  return children
}
