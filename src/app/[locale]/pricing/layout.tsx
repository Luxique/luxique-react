import { createPageMetadata, type LocalizedLayoutProps } from '../layout-metadata'

export const generateMetadata = createPageMetadata('pricing')

export default function PricingLayout({ children }: LocalizedLayoutProps) {
  return children
}
