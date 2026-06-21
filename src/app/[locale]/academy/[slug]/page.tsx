'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/lib/auth-context'
import { getLessonDisplays } from '@/lib/lesson-display'
import './course-interior.css'

interface Lesson {
  id: string; title: string; slug: string; sort_order: number
  lesson_type: 'content' | 'quiz' | 'exam'; duration_seconds?: number; is_free?: boolean
}
interface Course { id: string; title: string; slug: string; lessons?: Lesson[] }
interface ProgressRecord { lesson_id: string; completed: boolean; last_position_seconds?: number }
type LessonStatus = 'done' | 'current' | 'todo'

export default function CourseInteriorPage() {
  const params = useParams(); const router = useRouter()
  const slug = params.slug as string; const { user, role } = useAuth()

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolled, setEnrolled] = useState(false)
  const [checkingEnrollment, setCheckingEnrollment] = useState(true)
  const [progress, setProgress] = useState<Map<string, ProgressRecord>>(new Map())

  // Fetch course + lessons
  useEffect(() => {
    if (!slug) return
    const fetchCourse = async () => {
      try {
        const { data, error } = await supabase.from('courses').select('id, title, slug').eq('slug', slug).single()
        if (error || !data) { setLoading(false); return }
        const { data: lessons } = await supabase.from('lessons')
          .select('id, title, slug, sort_order, lesson_type, duration_seconds, is_free')
          .eq('course_id', data.id).order('sort_order')
        setCourse({ ...data, lessons: lessons || [] })
      } finally { setLoading(false) }
    }
    fetchCourse()
  }, [slug])

  // Check enrollment
  useEffect(() => {
    if (!user || !course) { setCheckingEnrollment(false); return }
    if (role === 'admin') { setEnrolled(true); setCheckingEnrollment(false); return }
    fetch(`/api/enrollments/check?user_id=${user.id}&course_id=${course.id}`)
      .then(r => r.json()).then(d => setEnrolled(!!d.enrolled)).catch(() => setEnrolled(false))
      .finally(() => setCheckingEnrollment(false))
  }, [user, course, role])

  // Fetch progress
  useEffect(() => {
    if (!user || !course) return
    const ids = course.lessons?.map(l => l.id) || []
    if (ids.length === 0) return
    supabase.from('lesson_progress').select('lesson_id, completed, last_position_seconds')
      .eq('user_id', user.id).in('lesson_id', ids)
      .then(({ data }) => {
        if (data) { const m = new Map<string, ProgressRecord>(); data.forEach((r: { lesson_id: string; completed: boolean; last_position_seconds?: number }) => m.set(r.lesson_id, r)); setProgress(m) }
      })
  }, [user, course])

  const isAdmin = role === 'admin'
  const hasAccess = enrolled || isAdmin
  const lessons = course?.lessons || []

  const getLessonStatus = (lesson: Lesson): LessonStatus => {
    const rec = progress.get(lesson.id)
    if (rec?.completed) return 'done'
    return 'todo'
  }

  const getNextLesson = (): Lesson | null => {
    return lessons.find(l => getLessonStatus(l) !== 'done') || lessons[0] || null
  }

  const getCurrentLessonIndex = (): number => {
    return lessons.findIndex(l => getLessonStatus(l) !== 'done')
  }

  const fmtDur = (s?: number) => { if (!s) return ''; const m = Math.round(s / 60); return m > 0 ? `${m} min` : '' }
  const lessonDisplays = getLessonDisplays(lessons)
  const getLabel = (l: Lesson) => lessonDisplays.get(l.id)?.shortLabel || l.title

  if (loading || checkingEnrollment) return <div className="ci-loader"><div>Cursus wordt geladen...</div></div>
  if (!course) return <div className="ci-loader"><div>Cursus niet gevonden</div><a href="/academy" className="ci-link">← Terug naar academie</a></div>

  const nextLesson = getNextLesson()
  const currentIdx = getCurrentLessonIndex()
  const completedCount = lessons.filter(l => getLessonStatus(l) === 'done').length
  const totalCount = lessons.length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  if (!user) return (
    <div className="ci-wrap">
      <div className="ci-login-prompt"><h2>Log in om verder te gaan</h2><p>Je moet ingelogd zijn om deze cursus te bekijken.</p><a href={`/auth/login?redirect=/academy/${slug}`} className="ci-login-btn">Inloggen</a></div>
    </div>
  )

  const checkSVG = <svg viewBox="0 0 100 100"><path d="M96.975 24.985 36.627 85.332c-.702.7-1.839.7-2.542 0L3.025 54.27c-.7-.703-.7-1.84 0-2.542l7.775-7.775c.703-.7 1.84-.7 2.542 0L35.358 65.97l51.3-51.3c.703-.7 1.84-.7 2.542 0l7.775 7.774c.7.703.7 1.84 0 2.542z"/></svg>

  return (
    <div className="ci-wrap">
      <div className="ci-eyebrow">Academy · jouw cursus</div>
      <h1>{course.title?.split(' ').map((w, i) => i === course.title!.split(' ').length - 1 ? <em key={i}>{w}</em> : w + ' ')}</h1>
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
          <div className="thumb"><span className="play-btn" /></div>
          <div className="body">
            <div className="k">Ga verder waar je was</div>
            <div className="t">{getLabel(nextLesson)} — {nextLesson.title || 'Naamloos'}</div>
            <div className="meta">Video · {fmtDur(nextLesson.duration_seconds) || 'Binnenkort'}</div>
          </div>
          {hasAccess ? (
            <button className="go" onClick={() => router.push(`/academy/${slug}/${nextLesson.id}`)}>Verder kijken →</button>
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

          return (
            <div key={lesson.id}
              className={`ci-lesson ${isCurrent ? 'is-current' : ''} ${locked ? 'is-locked' : ''} ${isExam ? 'exam-row' : ''}`}
              onClick={() => { if (!locked) router.push(`/academy/${slug}/${lesson.id}`) }}
              style={{ cursor: locked ? 'default' : 'pointer' }}
            >
              <span className={`status ${status === 'done' ? 'done' : isCurrent ? 'current' : 'todo'}`}>
                {status === 'done' && checkSVG}
                {status === 'todo' && !isCurrent && <span className="n">{isExam || isQuiz ? '✦' : (lessonDisplays.get(lesson.id)?.number || index + 1)}</span>}
              </span>
              <div className="info">
                <div className="num">
                  {getLabel(lesson)}
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
                    {isExam && <span className="dur">85% nodig</span>}
                    {!isExam && <span className="dur">{fmtDur(lesson.duration_seconds)}</span>}
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
