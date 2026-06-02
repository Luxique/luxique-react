'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/lib/auth-context'
import './course-interior.css'

interface Lesson {
  id: string
  title: string
  slug: string
  sort_order: number
  lesson_type: 'content' | 'quiz' | 'exam'
  duration_seconds?: number
  is_free?: boolean
}

interface Course {
  id: string
  title: string
  slug: string
  lessons?: Lesson[]
}

interface ProgressRecord {
  lesson_id: string
  completed: boolean
  last_position_seconds?: number
}

type LessonStatus = 'done' | 'current' | 'todo'

export default function CourseInteriorPage() {
  const params = useParams()
  const slug = params.slug as string
  const { user, role } = useAuth()

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolled, setEnrolled] = useState(false)
  const [checkingEnrollment, setCheckingEnrollment] = useState(true)
  const [progress, setProgress] = useState<Map<string, ProgressRecord>>(new Map())
  const [marking, setMarking] = useState<string | null>(null)

  // Fetch course + lessons
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('id, title, slug')
          .eq('slug', slug)
          .single()

        if (error || !data) {
          setLoading(false)
          return
        }

        const { data: lessons } = await supabase
          .from('lessons')
          .select('id, title, slug, sort_order, lesson_type, duration_seconds, is_free')
          .eq('course_id', data.id)
          .order('sort_order')

        setCourse({ ...data, lessons: lessons || [] })
      } finally {
        setLoading(false)
      }
    }
    if (slug) fetchCourse()
  }, [slug])

  // Check enrollment
  useEffect(() => {
    if (!user || !course) {
      setCheckingEnrollment(false)
      return
    }
    if (role === 'admin') {
      setEnrolled(true)
      setCheckingEnrollment(false)
      return
    }
    fetch(`/api/enrollments/check?user_id=${user.id}&course_id=${course.id}`)
      .then(r => r.json())
      .then(data => setEnrolled(!!data.enrolled))
      .catch(() => setEnrolled(false))
      .finally(() => setCheckingEnrollment(false))
  }, [user, course, role])

  // Fetch progress (Step B)
  useEffect(() => {
    if (!user || !course) return
    const fetchProgress = async () => {
      const { data } = await supabase
        .from('lesson_progress')
        .select('lesson_id, completed, last_position_seconds')
        .eq('user_id', user!.id)
        .in('lesson_id', course!.lessons?.map(l => l.id) || [])
      if (data) {
        const map = new Map<string, ProgressRecord>()
        data.forEach((r: ProgressRecord & { lesson_id: string }) => {
          map.set(r.lesson_id, r)
        })
        setProgress(map)
      }
    }
    fetchProgress()
  }, [user, course])

  const isAdmin = role === 'admin'
  const hasAccess = enrolled || isAdmin
  const lessons = course?.lessons || []

  // Mark lesson as completed (test button)
  const markComplete = useCallback(async (lessonId: string) => {
    if (!user || !course) return
    setMarking(lessonId)
    try {
      const existing = progress.get(lessonId)
      if (existing) {
        await supabase
          .from('lesson_progress')
          .update({ completed: true, completed_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
      } else {
        await supabase
          .from('lesson_progress')
          .insert({
            user_id: user.id,
            lesson_id: lessonId,
            course_id: course.id,
            completed: true,
            completed_at: new Date().toISOString(),
          })
      }
      // Update local state
      setProgress(prev => {
        const next = new Map(prev)
        next.set(lessonId, { ...prev.get(lessonId)!, completed: true })
        return next
      })
    } finally {
      setMarking(null)
    }
  }, [user, course, progress])

  // Determine lesson status from progress
  const getLessonStatus = (lesson: Lesson): LessonStatus => {
    const rec = progress.get(lesson.id)
    if (rec?.completed) return 'done'
    return 'todo'
  }

  const getNextLesson = (): Lesson | null => {
    // First not-done lesson
    const next = lessons.find((l) => getLessonStatus(l) !== 'done')
    return next || lessons[0] || null
  }

  // Find the "current" lesson (first non-done, for highlighting)
  const getCurrentLessonIndex = (): number => {
    return lessons.findIndex((l) => getLessonStatus(l) !== 'done')
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return ''
    const m = Math.round(seconds / 60)
    return m > 0 ? `${m} min` : ''
  }

  const getLessonLabel = (lesson: Lesson, index: number) => {
    if (lesson.lesson_type === 'quiz') return 'Tussentijdse toets'
    if (lesson.lesson_type === 'exam') return 'Eindtoets'
    return `Les ${index + 1}`
  }

  if (loading || checkingEnrollment) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF8F4' }}>
        <div style={{ color: '#7A7268', fontSize: 16 }}>Cursus wordt geladen...</div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4" style={{ background: '#FAF8F4' }}>
        <div style={{ color: '#7A7268', fontSize: 16 }}>Cursus niet gevonden</div>
        <a href="/academy" style={{ fontSize: 14, color: '#C4A265' }}>← Terug naar academie</a>
      </div>
    )
  }

  const nextLesson = getNextLesson()
  const currentIdx = getCurrentLessonIndex()
  const completedCount = lessons.filter((l) => getLessonStatus(l) === 'done').length
  const totalCount = lessons.length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  if (!user) {
    return (
      <div className="ci-wrap" style={{ paddingTop: 120 }}>
        <div className="ci-login-prompt">
          <h2>Log in om verder te gaan</h2>
          <p>Je moet ingelogd zijn om deze cursus te bekijken.</p>
          <a href={`/auth/login?redirect=/academy/${slug}`} className="ci-login-btn">Inloggen</a>
        </div>
      </div>
    )
  }

  const checkSVG = <svg viewBox="0 0 100 100"><path d="M96.975 24.985 36.627 85.332c-.702.7-1.839.7-2.542 0L3.025 54.27c-.7-.703-.7-1.84 0-2.542l7.775-7.775c.703-.7 1.84-.7 2.542 0L35.358 65.97l51.3-51.3c.703-.7 1.84-.7 2.542 0l7.775 7.774c.7.703.7 1.84 0 2.542z"/></svg>

  return (
    <div className="ci-wrap" style={{ paddingTop: 100 }}>
      {/* Header */}
      <div className="ci-eyebrow">Academy · jouw cursus</div>
      <h1>{course.title?.split(' ').map((w, i) => i === course.title.split(' ').length - 1 ? <em key={i}>{w}</em> : w + ' ')}</h1>
      <p className="ci-sub">Welkom terug. Je bent goed op weg.</p>

      {/* Progress */}
      <div className="ci-progress-wrap">
        <div className="ci-progress-meta">
          <span className="label">{completedCount} van {totalCount} onderdelen voltooid</span>
          <span className="pct">{progressPct}%</span>
        </div>
        <div className="ci-bar"><div className="ci-bar-fill" style={{ width: `${progressPct}%` }} /></div>
      </div>

      {/* Continue card */}
      {nextLesson && (
        <div className="ci-continue">
          <div className="thumb">
            <span className="play-btn" />
          </div>
          <div className="body">
            <div className="k">Ga verder waar je was</div>
            <div className="t">{getLessonLabel(nextLesson, lessons.indexOf(nextLesson))} — {nextLesson.title || 'Naamloos'}</div>
            <div className="meta">Video · {formatDuration(nextLesson.duration_seconds) || 'Binnenkort'}</div>
          </div>
          {hasAccess ? (
            <button className="go">Verder kijken →</button>
          ) : (
            <a href={`/cursus/${slug}`} className="go">Inschrijven →</a>
          )}
        </div>
      )}

      {/* Lessons */}
      <h2 className="ci-section-title">Alle onderdelen</h2>
      <div className="ci-lessons">
        {lessons.map((lesson, index) => {
          const status = getLessonStatus(lesson)
          const isCurrent = index === currentIdx && status !== 'done'
          const locked = !hasAccess && !lesson.is_free
          const isExam = lesson.lesson_type === 'exam'
          const isQuiz = lesson.lesson_type === 'quiz'
          const isMarking = marking === lesson.id

          return (
            <div
              key={lesson.id}
              className={`ci-lesson ${isCurrent ? 'is-current' : ''} ${locked ? 'is-locked' : ''} ${isExam ? 'exam-row' : ''}`}
            >
              <span className={`status ${status === 'done' ? 'done' : isCurrent ? 'current' : 'todo'}`}>
                {status === 'done' && checkSVG}
                {status === 'todo' && !isCurrent && <span className="n">{isExam ? '✦' : index + 1}</span>}
              </span>
              <div className="info">
                <div className="num">
                  {getLessonLabel(lesson, index)}
                  {isQuiz && <span className="ci-badge quiz">Quiz</span>}
                  {isExam && <span className="ci-badge exam">Examen</span>}
                </div>
                <div className="name">{lesson.title || 'Naamloos'}</div>
              </div>
              <div className="right">
                {locked ? (
                  <span className="lock-icon">🔒</span>
                ) : status === 'done' ? (
                  <span className="ci-result pass">Afgerond ✓</span>
                ) : (
                  <>
                    {hasAccess && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markComplete(lesson.id) }}
                        disabled={isMarking}
                        style={{
                          fontSize: 11, padding: '4px 10px', borderRadius: 8,
                          border: '1px solid rgba(94,132,99,0.3)', background: 'rgba(94,132,99,0.08)',
                          color: '#5E8463', cursor: 'pointer', fontWeight: 500,
                          opacity: isMarking ? 0.5 : 1,
                        }}
                      >
                        {isMarking ? '...' : '✓ Voltooid'}
                      </button>
                    )}
                    {isExam && <span className="dur">85% nodig</span>}
                    {!isExam && <span className="dur">{formatDuration(lesson.duration_seconds)}</span>}
                    <span className="chev">›</span>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
