import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const user_id = searchParams.get('user_id')
  const course_id = searchParams.get('course_id')

  if (!user_id || !course_id) {
    return NextResponse.json({ error: 'user_id and course_id required' }, { status: 400 })
  }

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('enrollments')
    .select('id, status, access_expires_at')
    .eq('user_id', user_id)
    .eq('course_id', course_id)
    .eq('status', 'active')
    .limit(1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Check if access has expired
  let accessExpired = false
  let accessExpiresAt: string | null = null
  if (data && data.length > 0) {
    const enrollment = data[0]
    accessExpiresAt = enrollment.access_expires_at
    if (enrollment.access_expires_at && new Date(enrollment.access_expires_at) < new Date()) {
      accessExpired = true
    }
  }

  // Also check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, role_level')
    .eq('id', user_id)
    .single()

  const isAdmin = (profile?.role_level >= 100) || (profile?.role === 'admin')

  return NextResponse.json({ 
    enrolled: ((data && data.length > 0) && !accessExpired) || isAdmin, 
    role: isAdmin ? 'admin' : 'student',
    accessExpired,
    accessExpiresAt,
  })
}
