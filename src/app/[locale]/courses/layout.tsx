import { createPageMetadata, type LocalizedLayoutProps } from '../layout-metadata'

export const generateMetadata = createPageMetadata('courses')

export default function CoursesLayout({ children }: LocalizedLayoutProps) {
  return children
}
