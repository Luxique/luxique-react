import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Returns certificate metadata so the client can generate the PDF.
 * No Chromium/Puppeteer needed — PDF is rendered client-side.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, courseId } = await request.json()

    if (!userId || !courseId) {
      return NextResponse.json({ error: 'Missing userId or courseId' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

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
      .select('title')
      .eq('id', courseId)
      .single()
    const courseTitle = course?.title || 'LUXIQUE Academy Course'

    // 3. Check exam status
    const { data: examLesson } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId)
      .eq('lesson_type', 'exam')
      .single()

    let completedAt = new Date().toISOString()

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
