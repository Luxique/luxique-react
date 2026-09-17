import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')?.trim()
  if (!slug) return NextResponse.json({ error: 'Course slug required' }, { status: 400 })

  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ hasAccess: false }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data: { user }, error: authError } = await supabase.auth.getUser(authorization.slice(7))
  if (authError || !user) return NextResponse.json({ hasAccess: false }, { status: 401 })

  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (!course) return NextResponse.json({ hasAccess: false }, { status: 404 })

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('access_expires_at')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .eq('status', 'active')
    .maybeSingle()

  const hasAccess = Boolean(
    enrollment && (!enrollment.access_expires_at || new Date(enrollment.access_expires_at) > new Date()),
  )

  return NextResponse.json({ hasAccess }, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
