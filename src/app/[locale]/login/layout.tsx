import { createPageMetadata, type LocalizedLayoutProps } from '../layout-metadata'

export const generateMetadata = createPageMetadata('login')

export default function LoginLayout({ children }: LocalizedLayoutProps) {
  return children
}
