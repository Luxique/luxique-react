import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/login?error=' + encodeURIComponent(error), request.url))
  }

  if (code) {
    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await client.auth.exchangeCodeForSession(code)
    // Redirect to a branded "email verified" page instead of silently going to dashboard
    return NextResponse.redirect(new URL('/email-verified', request.url))
  }

  // No code — redirect to login
  return NextResponse.redirect(new URL('/login', request.url))
}
