import type { MetadataRoute } from 'next'

const BASE_URL = 'https://www.luxique.nl'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/*/academy/',
        '/*/dashboard',
        '/*/profile',
        '/*/login',
        '/*/register',
        '/*/forgot-password',
        '/*/reset-password',
        '/*/email-verified',
        '/*/boeking/',
        '/*/traject-boeken',
        '/*/traject/bevestigd',
        '/*/bedankt',
        '/*/seeyousoon',
        '/api/',
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
