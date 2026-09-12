import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authorization.slice(7))
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const { courseId } = await request.json()
  if (typeof courseId !== 'string' || !courseId) {
    return NextResponse.json({ error: 'Missing courseId' }, { status: 400 })
  }

  const { data: enrollment, error: enrollmentError } = await supabaseAdmin
    .from('enrollments')
    .select('id, completed_at')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle()

  if (enrollmentError) {
    console.error('[completion] Enrollment lookup failed:', enrollmentError.message)
    return NextResponse.json({ error: 'Enrollment lookup failed' }, { status: 500 })
  }
  if (!enrollment) {
    return NextResponse.json({ completed: false, reason: 'not_enrolled' })
  }
  if (enrollment.completed_at) {
    return NextResponse.json({ completed: true, completedAt: enrollment.completed_at })
  }

  const { data: lessons, error: lessonsError } = await supabaseAdmin
    .from('lessons')
    .select('id, lesson_type')
    .eq('course_id', courseId)

  if (lessonsError) {
    console.error('[completion] Lesson lookup failed:', lessonsError.message)
    return NextResponse.json({ error: 'Lesson lookup failed' }, { status: 500 })
  }

  const examLessons = (lessons || []).filter(lesson => lesson.lesson_type === 'exam')
  const contentLessons = (lessons || []).filter(lesson => lesson.lesson_type !== 'exam')
  if (examLessons.length === 0) {
    return NextResponse.json({ completed: false, reason: 'exam_not_found' })
  }

  const lessonIds = (lessons || []).map(lesson => lesson.id)
  const { data: progress, error: progressError } = lessonIds.length > 0
    ? await supabaseAdmin
        .from('lesson_progress')
        .select('lesson_id, completed')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .in('lesson_id', lessonIds)
    : { data: [], error: null }

  if (progressError) {
    console.error('[completion] Progress lookup failed:', progressError.message)
    return NextResponse.json({ error: 'Progress lookup failed' }, { status: 500 })
  }

  const completedLessonIds = new Set((progress || [])
    .filter(item => item.completed)
    .map(item => item.lesson_id))
  const allContentComplete = contentLessons.every(lesson => completedLessonIds.has(lesson.id))
  const examPassed = examLessons.every(lesson => completedLessonIds.has(lesson.id))

  if (!allContentComplete || !examPassed) {
    return NextResponse.json({
      completed: false,
      reason: 'requirements_incomplete',
      allContentComplete,
      examPassed,
    })
  }

  const completedAt = new Date().toISOString()
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('enrollments')
    .update({ completed_at: completedAt })
    .eq('id', enrollment.id)
    .is('completed_at', null)
    .select('completed_at')
    .maybeSingle()

  if (updateError) {
    console.error('[completion] Enrollment update failed:', updateError.message)
    return NextResponse.json({ error: 'Enrollment update failed' }, { status: 500 })
  }

  return NextResponse.json({
    completed: true,
    completedAt: updated?.completed_at || enrollment.completed_at || completedAt,
  })
}
