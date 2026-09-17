import { createPageMetadata, type LocalizedLayoutProps } from '../layout-metadata'

export const generateMetadata = createPageMetadata('persoonlijk-traject')

export default function PersonalTrainingLayout({ children }: LocalizedLayoutProps) {
  return children
}
