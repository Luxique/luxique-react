import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/_next') || pathname.startsWith('/api/')) {
    return response
  }

  // Skip restrictive headers for admin routes (course builder needs eval for React hydration + Mux)
  if (pathname.startsWith('/admin')) {
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

  // Security headers for non-admin routes
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}
