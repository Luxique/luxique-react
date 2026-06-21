import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip entirely for API routes and Next internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // For admin routes, apply security headers only (no intl processing)
  if (pathname.startsWith('/admin')) {
    const response = NextResponse.next()
    response.headers.set('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.mux.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mux.com https://*.mux.com https://direct-uploads.oci-us-phoenix-1-vgp1.production.mux.com https://storage.googleapis.com https://inferred.litix.io",
      "media-src 'self' https://*.mux.com blob:",
      "img-src 'self' data: https://*.mux.com https://image.mux.com https://*.supabase.co",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "frame-src 'self' https://*.mux.com",
    ].join('; '))
    return response
  }

  // Check if pathname already has a locale prefix
  const hasLocale = routing.locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  let response: NextResponse

  if (hasLocale) {
    // Already has locale — process with intl middleware for cookie management
    response = intlMiddleware(request) as NextResponse
  } else {
    // No locale prefix — let intl middleware handle redirect to default locale
    response = intlMiddleware(request) as NextResponse
  }

  // Apply security headers to all responses
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return response
}

export const config = {
  // Skip static files, API routes, admin routes, and Next internals
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api|admin).*)'],
}
