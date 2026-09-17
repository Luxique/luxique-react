import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { supabase } from '@/lib/supabase-client'

const BASE_URL = 'https://www.luxique.nl'
const PUBLIC_ROUTES = [
  '',
  '/about',
  '/behandelingen',
  '/contact',
  '/courses',
  '/faq',
  '/persoonlijk-traject',
  '/pricing',
  '/voorwaarden',
]

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const localizedPages: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    PUBLIC_ROUTES.map((path) => ({
      url: `${BASE_URL}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: path === '' ? 'weekly' : 'monthly',
      priority: path === '' ? 1 : path === '/courses' || path === '/behandelingen' ? 0.9 : 0.7,
    })),
  )

  let courses: Array<{ slug: string; updated_at: string | null }> = []
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const { data } = await supabase
      .from('courses')
      .select('slug, updated_at')
      .eq('status', 'published')
      .eq('is_published', true)
    courses = data || []
  }

  const coursePages: MetadataRoute.Sitemap = courses
    .filter((course) => course.slug)
    .map((course) => ({
      url: `${BASE_URL}/cursus/${course.slug}`,
      lastModified: course.updated_at ? new Date(course.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    }))

  return [...localizedPages, ...coursePages]
}
