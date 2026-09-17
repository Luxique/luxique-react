import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { certificateIsAvailable } from '@/lib/certificate-release'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Returns certificate metadata so the client can generate the PDF.
 * No Chromium/Puppeteer needed — PDF is rendered client-side.
 */
export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authorization.slice(7))
    if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { courseId } = await request.json()
    const userId = user.id

    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 })
    }

    const supabase = supabaseAdmin

    // 1. Fetch user name
    let recipientName = 'Student'
    const { data: authUser } = await supabase.auth.admin.getUserById(userId)
    if (authUser?.user) {
      recipientName =
        (authUser.user.user_metadata?.full_name as string) ||
        (authUser.user.user_metadata?.first_name as string) ||
        authUser.user.email?.split('@')[0] ||
        'Student'
    }

    // 2. Fetch course title
    const { data: course } = await supabase
      .from('courses')
      .select('title, certificate_review_required')
      .eq('id', courseId)
      .single()
    const courseTitle = course?.title || 'LUXIQUE Academy Course'

    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('completed_at, certificate_released_at')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (!enrollment || !certificateIsAvailable({
      courseCompletedAt: enrollment.completed_at,
      reviewRequired: Boolean(course?.certificate_review_required),
      releasedAt: enrollment.certificate_released_at,
    })) {
      return NextResponse.json({
        error: course?.certificate_review_required && enrollment?.completed_at
          ? 'Certificate awaiting manual review'
          : 'Course not completed yet',
        code: course?.certificate_review_required && enrollment?.completed_at ? 'certificate_review_pending' : 'course_incomplete',
      }, { status: 403 })
    }

    // 3. Check exam status
    const { data: examLesson } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId)
      .eq('lesson_type', 'exam')
      .single()

    let completedAt = enrollment.completed_at

    if (examLesson) {
      const { data: progress } = await supabase
        .from('lesson_progress')
        .select('completed, completed_at')
        .eq('user_id', userId)
        .eq('lesson_id', examLesson.id)
        .single()

      if (!progress?.completed) {
        return NextResponse.json({ error: 'Exam not passed yet' }, { status: 403 })
      }
      if (progress.completed_at) {
        completedAt = progress.completed_at
      }
    } else {
      // No exam — check all content lessons done
      const { data: contentLessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId)
        .neq('lesson_type', 'exam')

      if (contentLessons && contentLessons.length > 0) {
        const { data: allProgress } = await supabase
          .from('lesson_progress')
          .select('lesson_id, completed')
          .eq('user_id', userId)
          .in('lesson_id', contentLessons.map(l => l.id))

        const allDone = contentLessons.every(l =>
          allProgress?.some(p => p.lesson_id === l.id && p.completed)
        )

        if (!allDone) {
          return NextResponse.json({ error: 'Course not completed yet' }, { status: 403 })
        }
      }
    }

    // 4. Return metadata for client-side PDF generation
    return NextResponse.json({
      recipientName,
      courseTitle,
      completedAt,
      ok: true,
    })
  } catch (err) {
    console.error('Certificate metadata error:', err)
    return NextResponse.json(
      { error: 'Failed to get certificate data', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
