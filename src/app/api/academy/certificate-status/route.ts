import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { certificateReleaseStatus } from '@/lib/certificate-release'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authorization.slice(7))
  if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const courseId = request.nextUrl.searchParams.get('courseId')
  if (!courseId) return NextResponse.json({ error: 'Missing courseId' }, { status: 400 })

  const [{ data: course, error: courseError }, { data: enrollment, error: enrollmentError }] = await Promise.all([
    supabaseAdmin.from('courses').select('certificate_review_required').eq('id', courseId).maybeSingle(),
    supabaseAdmin.from('enrollments').select('completed_at, certificate_released_at').eq('user_id', user.id).eq('course_id', courseId).maybeSingle(),
  ])

  if (courseError || enrollmentError) return NextResponse.json({ error: 'Certificate status lookup failed' }, { status: 500 })
  if (!course || !enrollment) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })

  return NextResponse.json(certificateReleaseStatus({
    courseCompletedAt: enrollment.completed_at,
    reviewRequired: Boolean(course.certificate_review_required),
    releasedAt: enrollment.certificate_released_at,
  }))
}

