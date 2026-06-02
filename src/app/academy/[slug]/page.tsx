'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/lib/auth-context'
import './course-interior.css'

interface Lesson {
  id: string
  name: string
  slug: string
  sort_order: number
  lesson_type: 'content' | 'quiz' | 'exam'
  duration_seconds?: number
  free?: boolean
}

interface Course {
  id: string
  title: string
  slug: string
  lessons?: Lesson[]
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
          .select('id, name, slug, sort_order, lesson_type, duration_seconds, free')
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
    // Admin always has access
    if (role === 'admin') {
      setEnrolled(true)
      setCheckingEnrollment(false)
      return
    }
    // Check enrollment via API
    fetch(`/api/enrollments/check?user_id=${user.id}&course_id=${course.id}`)
      .then(r => r.json())
      .then(data => setEnrolled(!!data.enrolled))
      .catch(() => setEnrolled(false))
      .finally(() => setCheckingEnrollment(false))
  }, [user, course, role])

  const isAdmin = role === 'admin'
  const hasAccess = enrolled || isAdmin
  const lessons = course?.lessons || []

  // For now: no persisted progress — all lessons are "todo" for non-admin
  // First lesson is "current" if not enrolled (or no progress)
  const getLessonStatus = (_lesson: Lesson, index: number): LessonStatus => {
    // Step B will add real progress — for now:
    if (index === 0) return 'current'
    return 'todo'
  }

  const getNextLesson = (): Lesson | null => {
    const current = lessons.find((_, i) => getLessonStatus(_, i) === 'current')
    return current || lessons[0] || null
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

  const getLessonTitle = (lesson: Lesson) => {
    return lesson.name || 'Naamloos'
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
  const completedCount = lessons.filter((_, i) => getLessonStatus(_, i) === 'done').length
  const totalCount = lessons.length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Not logged in
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
            <div className="t">{getLessonLabel(nextLesson, lessons.indexOf(nextLesson))} — {getLessonTitle(nextLesson)}</div>
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
          const status = getLessonStatus(lesson, index)
          const locked = !hasAccess && !lesson.free
          const isExam = lesson.lesson_type === 'exam'
          const isQuiz = lesson.lesson_type === 'quiz'

          return (
            <div
              key={lesson.id}
              className={`ci-lesson ${status === 'current' ? 'is-current' : ''} ${locked ? 'is-locked' : ''} ${isExam ? 'exam-row' : ''}`}
              onClick={() => {
                if (locked) return
                // TODO: navigate to lesson view (Step B)
              }}
            >
              <span className={`status ${status}`}>
                {status === 'done' && (
                  <svg viewBox="0 0 100 100"><path d="M96.975 24.985 36.627 85.332c-.702.7-1.839.7-2.542 0L3.025 54.27c-.7-.703-.7-1.84 0-2.542l7.775-7.775c.703-.7 1.84-.7 2.542 0L35.358 65.97l51.3-51.3c.703-.7 1.84-.7 2.542 0l7.775 7.774c.7.703.7 1.84 0 2.542z"/></svg>
                )}
                {status === 'todo' && <span className="n">{isExam ? '✦' : index + 1}</span>}
              </span>
              <div className="info">
                <div className="num">
                  {getLessonLabel(lesson, index)}
                  {isQuiz && <span className="ci-badge quiz">Quiz</span>}
                  {isExam && <span className="ci-badge exam">Examen</span>}
                </div>
                <div className="name">{getLessonTitle(lesson)}</div>
              </div>
              <div className="right">
                {locked ? (
                  <span className="lock-icon">🔒</span>
                ) : (
                  <>
                    {isExam && !locked && <span className="dur">85% nodig</span>}
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
