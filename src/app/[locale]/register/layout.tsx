import { createPageMetadata, type LocalizedLayoutProps } from '../layout-metadata'

export const generateMetadata = createPageMetadata('register')

export default function RegisterLayout({ children }: LocalizedLayoutProps) {
  return children
}
