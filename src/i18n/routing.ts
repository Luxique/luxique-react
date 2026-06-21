import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

export const routing = defineRouting({
  locales: ['nl', 'en', 'es', 'fr', 'de'],
  defaultLocale: 'nl',
  localePrefix: 'always'
})

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
