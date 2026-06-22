'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import LuxiqueMuxPlayer from '@/components/LuxiqueMuxPlayer'
import ExamPlayer from '@/components/ExamPlayer'
import { useAuth } from '@/lib/auth-context'
import { getLessonDisplays } from '@/lib/lesson-display'
import './lesson-page.css'

/* ── Types ─────────────────────────────────────── */
interface Lesson {
  id: string; title: string; lesson_type: 'content' | 'quiz' | 'exam'
  duration_seconds?: number; is_free?: boolean; course_id: string
}
interface Block {
  id: string; type: string; title?: string
  content?: string | { mux_playback_id?: string; [k: string]: unknown }
  question?: string; media?: { type: string; url: string; caption?: string } | null
  option_type?: 'text' | 'image'
  options?: Array<{ id: string; text: string; image_url?: string; correct: boolean }>
  file_name?: string; file_size?: number; file_url?: string; subtitle?: string
}
interface ProgressRec { lesson_id: string; completed: boolean; last_position_seconds?: number; quiz_answers?: Record<string, { chosen: string; attempts: number; result: string }> }

/* ── Helpers ───────────────────────────────────── */
function extractBlockContent(block: Block) {
  const c = typeof block.content === 'object' ? block.content as Record<string, unknown> : null
  return {
    title: (c?.title as string) || block.title,
    subtitle: (c?.subtitle as string) || block.subtitle,
    body: typeof c?.content === 'string' ? c.content : (typeof block.content === 'string' ? block.content : ''),
    muxPlaybackId: (c?.mux_playback_id as string) || undefined,
    question: (c?.question as string) || block.question,
    options: (c?.options as Array<{ id: string; text: string; image_url?: string; correct: boolean }>) || block.options || [],
    optionType: (c?.option_type as string) || block.option_type || ((c?.options as Array<{ image_url?: string }>)?.some((o: { image_url?: string }) => o.image_url) ? 'image' : 'text'),
    media: (c?.media as { type: string; url: string; caption?: string } | null) || block.media,
    imageUrl: (c?.url as string) || block.media?.url,
    caption: (c?.caption as string) || block.media?.caption,
    fileName: (block.title || (c?.file_name as string)) || 'Bestand',
    fileSize: c?.file_size as number | undefined,
    fileUrl: (c?.file_url as string) || block.file_url || '#',
  }
}

/* ── Component ─────────────────────────────────── */
export default function LessonPage() {
  const params = useParams(); const router = useRouter()
  const { user, role, loading: authLoading } = useAuth()
  const slug = params.slug as string; const lessonId = params.lessonId as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [courseTitle, setCourseTitle] = useState('')
  const [allLessons, setAllLessons] = useState<Lesson[]>([])
  const [blocks, setBlocks] = useState<Block[]>([])
  const [progress, setProgress] = useState<Map<string, ProgressRec>>(new Map())
  const [loading, setLoading] = useState(true)
  const [enrolled, setEnrolled] = useState(false)
  const [videoCompleted, setVideoCompleted] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const convertDismissedRef = useRef(false) // one dismissal per session
  const hasMarkedRef = useRef(false)  // idempotency guard — markComplete fires once per lesson

  // Rail
  const lastBlockRef = useRef<HTMLDivElement>(null)
  const [railOpen, setRailOpen] = useState(true)
  const [railMobileOpen, setRailMobileOpen] = useState(false)

  // Load rail state from localStorage after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRailOpen(localStorage.getItem('lux-rail-open') !== 'closed')
    }
  }, [])

  // Quiz: track attempts per question block
  const [quizAttempts, setQuizAttempts] = useState<Record<string, number>>({})      // blockId → attempt count
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})         // blockId → chosen optionId
  const [quizResults, setQuizResults] = useState<Record<string, 'correct' | 'wrong' | 'tryAgain' | 'revealed'>>({})

  /* ── Data fetching ────────────────────────────── */
  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: ld } = await supabase.from('lessons').select('id,title,lesson_type,duration_seconds,is_free,course_id').eq('id', lessonId).single()
        if (!ld) { setLoading(false); return }
        setLesson(ld)
        const { data: cd } = await supabase.from('courses').select('title').eq('id', ld.course_id).single()
        if (cd) setCourseTitle(cd.title)
        const { data: als } = await supabase.from('lessons').select('id,title,lesson_type,duration_seconds,is_free,course_id').eq('course_id', ld.course_id).order('sort_order')
        setAllLessons(als || [])
        const { data: bdata } = await supabase.from('blocks').select('*').eq('lesson_id', lessonId).order('sort_order')
        setBlocks(bdata || [])
      } finally { setLoading(false) }
    }
    if (lessonId) fetch()
  }, [lessonId])

  // Enrollment
  useEffect(() => {
    if (!user || !lesson) return
    if (role === 'admin') { setEnrolled(true); return }
    fetch(`/api/enrollments/check?user_id=${user.id}&course_id=${lesson.course_id}`)
      .then(r => r.json()).then(d => setEnrolled(!!d.enrolled)).catch(() => setEnrolled(false))
  }, [user, lesson, role])

  // Progress
  useEffect(() => {
    if (!user || allLessons.length === 0) return
    supabase.from('lesson_progress').select('lesson_id,completed,last_position_seconds,quiz_answers')
      .eq('user_id', user!.id).in('lesson_id', allLessons.map(l => l.id))
      .then(({ data }) => {
        if (data) {
          const m = new Map<string, ProgressRec>(); 
          data.forEach((r: { lesson_id: string; completed: boolean; last_position_seconds?: number; quiz_answers?: Record<string, { chosen: string; attempts: number; result: string }> }) => {
            m.set(r.lesson_id, r)
            // Restore quiz state from DB for current lesson
            if (r.lesson_id === lessonId && r.quiz_answers && typeof r.quiz_answers === 'object') {
              const qa = r.quiz_answers
              const attempts: Record<string, number> = {}
              const answers: Record<string, string> = {}
              const results: Record<string, 'correct' | 'wrong' | 'tryAgain' | 'revealed'> = {}
              Object.entries(qa).forEach(([blockId, val]) => {
                const v = val as { chosen: string; attempts: number; result: string }
                attempts[blockId] = v.attempts
                answers[blockId] = v.chosen
                results[blockId] = v.result as 'correct' | 'wrong' | 'tryAgain' | 'revealed'
              })
              setQuizAttempts(attempts)
              setQuizAnswers(answers)
              setQuizResults(results)
            }
          })
          setProgress(m)
        }
      })
  }, [user, allLessons, lessonId])

  useEffect(() => { localStorage.setItem('lux-rail-open', railOpen ? 'open' : 'closed') }, [railOpen])

  /* ── Derived ──────────────────────────────────── */
  const hasAccess = enrolled || role === 'admin'
  const isFreeLesson = lesson?.is_free
  const isLocked = !hasAccess && !isFreeLesson
  // Gate: if free lesson and user is not logged in, redirect to login
  useEffect(() => {
    if (!authLoading && !user && isFreeLesson) {
      router.replace(`/login?redirect=/academy/${slug}/${lessonId}`)
    }
  }, [authLoading, user, isFreeLesson, slug, lessonId, router])
  const currentIdx = allLessons.findIndex(l => l.id === lessonId)
  const prevLessonNav = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const nextLessonNav = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null
  // Exclude exam from progress calculation — exam is a separate milestone
  const contentLessons = allLessons.filter(l => l.lesson_type !== 'exam')
  const examLesson = allLessons.find(l => l.lesson_type === 'exam')
  const completedCount = contentLessons.filter(l => progress.get(l.id)?.completed).length
  const totalCount = contentLessons.length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const examStatus: 'passed' | 'not_started' | null = examLesson
    ? (progress.get(examLesson.id)?.completed ? 'passed' : 'not_started')
    : null
  const quizBlocks = blocks.filter(b => b.type === 'quiz')
  const isQuizLesson = lesson?.lesson_type === 'quiz'
  const isExamLesson = lesson?.lesson_type === 'exam'

  // Video detection
  const videoBlock = blocks.find(b => b.type === 'video')
  const videoContent = typeof videoBlock?.content === 'object' ? videoBlock.content as Record<string, unknown> : null
  const hasPlayableVideo = !!(videoContent?.mux_playback_id)

  // Quiz completion: all quiz blocks have been answered (correct or revealed)
  const quizComplete = quizBlocks.length > 0 && quizBlocks.every(b => {
    const r = quizResults[b.id]
    return r === 'correct' || r === 'revealed'
  })

  // Overall lesson completion
  const isLessonComplete = !!progress.get(lessonId)?.completed || videoCompleted

  // Can proceed to next lesson?
  const canProceed = isExamLesson
    ? true // Exam has its own completion flow
    : isQuizLesson
      ? quizComplete
      : hasPlayableVideo
        ? isLessonComplete
        : isLessonComplete

  // Reset idempotency guard when lesson changes
  useEffect(() => {
    hasMarkedRef.current = false
    setVideoCompleted(false)
  }, [lessonId])

  /* ── Handlers ─────────────────────────────────── */
  const markComplete = useCallback(async (lid?: string) => {
    const targetId = lid || lessonId
    if (!user || !lesson) return
    // IDEMPOTENCY: ref guard prevents multiple fires from timeupdate (~4x/sec)
    if (hasMarkedRef.current) return
    hasMarkedRef.current = true
    setVideoCompleted(true)
    console.log('[completion] markComplete fired for lesson:', targetId)
    const { error } = await supabase.from('lesson_progress').upsert({
      user_id: user.id, lesson_id: targetId, course_id: lesson.course_id,
      completed: true, completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lesson_id' })
    if (error) {
      console.error('[completion] upsert error:', error.message)
      hasMarkedRef.current = false
      setVideoCompleted(false)
    } else {
      console.log('[completion] upsert OK — completed=true for', targetId)
      // Show conversion modal if: free lesson, user logged in, not enrolled, not admin, not already dismissed
      if (isFreeLesson && !hasAccess && !convertDismissedRef.current) {
        setTimeout(() => setShowConvertModal(true), 800)
      }
    }
    setProgress(prev => { const n = new Map(prev); n.set(targetId, { ...prev.get(targetId)!, completed: true }); return n })
  }, [user, lesson, lessonId])

  // When quiz becomes complete, mark lesson as complete
  useEffect(() => {
    if (isQuizLesson && quizComplete && !isLessonComplete) {
      markComplete()
    }
  }, [isQuizLesson, quizComplete, isLessonComplete, markComplete])

  // Video completion: fire markComplete at >=90% or on ended
  const handleVideoProgress = useCallback((pct: number) => {
    if (pct >= 90 && !hasMarkedRef.current) {
      console.log('[completion] video progress >=90%:', pct.toFixed(1) + '%')
      markComplete()
    }
  }, [markComplete])

  const handleVideoEnded = useCallback(() => {
    if (!hasMarkedRef.current) {
      console.log('[completion] video ended event')
      markComplete()
    }
  }, [markComplete])

  // Scroll-to-end completion for content lessons without video
  useEffect(() => {
    if (!lastBlockRef.current || hasPlayableVideo || isQuizLesson || isLessonComplete) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) markComplete()
    }, { threshold: 0.5 })
    observer.observe(lastBlockRef.current)
    return () => observer.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks, hasPlayableVideo, isQuizLesson, isLessonComplete, markComplete])

  // Quiz answer handler — 2 attempts max
  const handleQuizAnswer = (blockId: string, optionId: string) => {
    const currentResult = quizResults[blockId]
    // Already finalized (correct or revealed) — no more changes
    if (currentResult === 'correct' || currentResult === 'revealed') return
    // Currently showing "try again" — allow retry
    if (currentResult === 'tryAgain') {
      // Reset for second attempt
      setQuizResults(p => { const n = { ...p }; delete n[blockId]; return n })
      setQuizAnswers(p => { const n = { ...p }; delete n[blockId]; return n })
    }

    const b = blocks.find(bl => bl.id === blockId)
    const opts = extractBlockContent(b!).options
    const chosen = opts.find(o => o.id === optionId)
    if (!chosen) return

    const attempts = (quizAttempts[blockId] || 0) + 1
    setQuizAttempts(p => {
      const next = { ...p, [blockId]: attempts }
      // Build updated state for persist
      const newResults = { ...quizResults }; if (chosen.correct) { newResults[blockId] = 'correct' } else if (attempts >= 2) { newResults[blockId] = 'revealed' } else { newResults[blockId] = 'tryAgain' }
      const newAnswers = { ...quizAnswers, [blockId]: optionId }
      persistQuizState(next, newAnswers, newResults as Record<string, 'correct' | 'wrong' | 'tryAgain' | 'revealed'>)
      return next
    })
    setQuizAnswers(p => ({ ...p, [blockId]: optionId }))

    if (chosen.correct) {
      setQuizResults(p => ({ ...p, [blockId]: 'correct' }))
    } else if (attempts >= 2) {
      setQuizResults(p => ({ ...p, [blockId]: 'revealed' }))
    } else {
      setQuizResults(p => ({ ...p, [blockId]: 'tryAgain' }))
    }
  }

  // Save quiz state to DB
  const persistQuizState = useCallback(async (newAttempts: Record<string, number>, newAnswers: Record<string, string>, newResults: Record<string, 'correct' | 'wrong' | 'tryAgain' | 'revealed'>) => {
    if (!user || !lesson) return
    const qa: Record<string, { chosen: string; attempts: number; result: string }> = {}
    Object.keys(newResults).forEach(blockId => {
      qa[blockId] = {
        chosen: newAnswers[blockId] || '',
        attempts: newAttempts[blockId] || 0,
        result: newResults[blockId],
      }
    })
    await supabase.from('lesson_progress').upsert({
      user_id: user.id, lesson_id: lessonId, course_id: lesson.course_id,
      quiz_answers: qa,
    }, { onConflict: 'user_id,lesson_id' })
  }, [user, lesson, lessonId])

  const fmtDur = (s?: number) => { if (!s) return ''; const m = Math.round(s / 60); return m > 0 ? `${m} min` : '' }
  const getLessonStatus = (l: Lesson) => progress.get(l.id)?.completed ? 'done' as const : 'todo' as const

  /* ── Loading / not found ──────────────────────── */
  if (loading) return <div className="lp-loader"><div>Cursus wordt geladen...</div></div>
  if (!lesson) return <div className="lp-loader"><div>Les niet gevonden</div><a href={`/academy/${slug}`} className="lp-link">← Terug naar cursus</a></div>

  // Auth gate for free lessons — show loader while checking
  if (isFreeLesson && authLoading) return <div className="lp-loader"><div>Controleren...</div></div>
  if (isFreeLesson && !user) return <div className="lp-loader"><div>Doorverwijzen naar login...</div></div>

  const lessonDisplays = getLessonDisplays(allLessons.map(l => ({ id: l.id, title: l.title, lesson_type: l.lesson_type })))

  /* ── Rail ─────────────────────────────────────── */
  const railItems = allLessons.map((l, i) => {
    const status = getLessonStatus(l)
    const isActive = l.id === lessonId
    const isLockedPay = !hasAccess && !l.is_free
    const prevL = i > 0 ? allLessons[i - 1] : null
    const prevDone = !prevL || getLessonStatus(prevL) === 'done'
    const isLinearLocked = role !== 'admin' && !isLockedPay && !prevDone && status !== 'done'
    const isClickLocked = isLockedPay || isLinearLocked
    const isQuizItem = l.lesson_type === 'quiz' || l.lesson_type === 'exam'
    let sqCls = 'available'
    if (status === 'done') sqCls = 'done'
    else if (isActive) sqCls = 'current'
    else if (isLockedPay) sqCls = 'locked-pay'
    else if (isLinearLocked) sqCls = 'locked-linear'

    return (
      <a key={l.id} className={`ri ${isActive ? 'active' : ''} ${isClickLocked ? 'is-grey' : ''}`}
        onClick={() => { if (!isClickLocked) router.push(`/academy/${slug}/${l.id}`); setRailMobileOpen(false) }}>
        <span className={`sq ${sqCls}`}>
          {status === 'done' ? <svg viewBox="0 0 100 100"><path d="M96.975 24.985 36.627 85.332c-.702.7-1.839.7-2.542 0L3.025 54.27c-.7-.703-.7-1.84 0-2.542l7.775-7.775c.703-.7 1.84-.7 2.542 0L35.358 65.97l51.3-51.3c.703-.7 1.84-.7 2.542 0l7.775 7.774c.7.703.7 1.84 0 2.542z"/></svg>
            : isLockedPay ? '🔒' : isQuizItem ? '✦' : (lessonDisplays.get(l.id)?.number || i + 1)}
        </span>
        <span className="nm">{lessonDisplays.get(l.id)?.label || l.title}</span>
        {l.is_free && <span className="freebadge">Gratis</span>}
      </a>
    )
  })

  /* ── Render ───────────────────────────────────── */
  const checkSVG = <svg viewBox="0 0 100 100"><path d="M96.975 24.985 36.627 85.332c-.702.7-1.839.7-2.542 0L3.025 54.27c-.7-.703-.7-1.84 0-2.542l7.775-7.775c.703-.7 1.84-.7 2.542 0L35.358 65.97l51.3-51.3c.703-.7 1.84-.7 2.542 0l7.775 7.774c.7.703.7 1.84 0 2.542z"/></svg>

  return (
    <div className="lp-shell">
      {railMobileOpen && <div className="lp-rail-overlay" onClick={() => setRailMobileOpen(false)} />}

      <nav className={`lp-rail ${railOpen ? 'expanded' : ''} ${railMobileOpen ? 'mobile-open' : ''}`}>
        <div className="rail-head">
          <span className="rail-brand">{courseTitle}</span>
          {/* Single close button — 44x44 touch target */}
          <button className="rail-close-btn" onClick={() => {
            if (window.innerWidth <= 768) { setRailMobileOpen(false) }
            else { setRailOpen(!railOpen) }
          }} aria-label={railOpen ? "Sluiten" : "Lessen"}>{railOpen ? '✕' : '☰'}</button>
        </div>
        <div className="rail-prog">
          <div className="ring" style={{ background: `conic-gradient(var(--gold) ${progressPct}%, var(--cream-2) 0)` }}><span>{progressPct}%</span></div>
          <div className="prog-full">
            <span className="lbl">{completedCount} van {totalCount} lessen voltooid · {progressPct}%</span>
            <div className="bar"><i style={{ width: `${progressPct}%` }} /></div>
            {examStatus && (
              <span className="lbl" style={{ marginTop: 6, display: 'block', fontSize: 11, color: examStatus === 'passed' ? 'var(--green)' : 'var(--muted)' }}>
                Eindtoets: {examStatus === 'passed' ? '✓ Geslaagd' : 'nog niet gestart'}
              </span>
            )}
          </div>
        </div>
        <div className="rail-list">{railItems}</div>
      </nav>

      <div className="lp-main">
        <div className="lp-topbar">
          <a className="back" onClick={() => router.push(`/academy/${slug}`)}>← Terug naar overzicht</a>
          <div className="nav-mini">
            <button className="rail-mobile-btn" onClick={() => setRailMobileOpen(true)}>☰ Lessen</button>
            {prevLessonNav && <button onClick={() => router.push(`/academy/${slug}/${prevLessonNav.id}`)}>← Vorige</button>}
            {nextLessonNav && <button onClick={() => canProceed ? router.push(`/academy/${slug}/${nextLessonNav.id}`) : null} disabled={!canProceed} style={{ opacity: canProceed ? 1 : 0.4, cursor: canProceed ? 'pointer' : 'not-allowed' }}>Volgende →</button>}
          </div>
        </div>

        <div className="lp-stage">
          <div className="crumb">{lessonDisplays.get(lessonId)?.label || `Les ${currentIdx + 1} van ${totalCount}`}</div>
          <h1 className="lesson-title">{lesson.title}</h1>
          {lesson.duration_seconds ? <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>Video · {fmtDur(lesson.duration_seconds)}</div> : null}

          {isLocked ? (
            <div className="lp-paywall">
              <div className="t">Dit is een voorproefje</div>
              <div className="s">Schrijf je in om alle lessen, toetsen en je voortgang te ontgrendelen.</div>
              <a href={`/cursus/${slug}`}>Schrijf je in →</a>
            </div>
          ) : isExamLesson ? (
            <ExamPlayer
              lessonId={lessonId}
              courseId={lesson.course_id}
              courseTitle={courseTitle}
              passingScore={85}
              slug={slug}
            />
          ) : (
            <>
              {blocks.map((block, blockIdx) => {
                const bc = extractBlockContent(block)
                const isLastBlock = blockIdx === blocks.length - 1

                return (
                  <div key={block.id} className="blk" ref={isLastBlock && !hasPlayableVideo && !isQuizLesson ? lastBlockRef : undefined}>

                    {/* VIDEO */}
                    {block.type === 'video' && (() => {
                      const rec = progress.get(lessonId)
                      const done = !!rec?.completed
                      return bc.muxPlaybackId ? (
                        <>
                          <div className="video" style={{ position: 'relative' }}>
                            <LuxiqueMuxPlayer
                              key={bc.muxPlaybackId}
                              playbackId={bc.muxPlaybackId}
                              variant="lesson"
                              title={block.title || 'Video'}
                              signed={!lesson.is_free}
                              courseId={lesson.course_id}
                              isFree={lesson.is_free}
                              onProgress={handleVideoProgress}
                              onEnded={handleVideoEnded}
                            />
                            <div className="video-scrub" style={{ width: done ? '100%' : '0%' }} />
                          </div>
                          <div className="vid-meta">
                            <span className="l">Video · {fmtDur(lesson.duration_seconds)}</span>
                            {done && <span className="ctag show">{checkSVG} Voltooid</span>}
                          </div>
                        </>
                      ) : <div className="video"><div style={{ color: '#888' }}>Video wordt verwerkt...</div></div>
                    })()}

                    {/* TEXT */}
                    {block.type === 'text' && (
                      <div className="tt">
                        {bc.title && <h2>{bc.title}</h2>}
                        {bc.subtitle && <div className="subtitle">{bc.subtitle}</div>}
                        {bc.body && <div dangerouslySetInnerHTML={{ __html: bc.body }} />}
                      </div>
                    )}

                    {/* IMAGE */}
                    {block.type === 'image' && (
                      <>
                        <div className="photo">{bc.imageUrl ? <img src={bc.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} /> : '⛶'}</div>
                        {bc.caption && <div className="photo-cap">{bc.caption}</div>}
                      </>
                    )}

                    {/* DOWNLOAD */}
                    {block.type === 'download' && (
                      <a className="download" href={bc.fileUrl} target="_blank" rel="noopener">
                        <span className="ic">↓</span>
                        <span><span className="nm">{bc.fileName}</span>{bc.fileSize ? <span className="sz" style={{ display: 'block', marginTop: 2 }}>{`${(bc.fileSize / 1024 / 1024).toFixed(1)} MB`}</span> : null}</span>
                      </a>
                    )}

                    {/* DIVIDER */}
                    {block.type === 'divider' && <div className="divider" />}

                    {/* QUIZ */}
                    {block.type === 'quiz' && (() => {
                      const result = quizResults[block.id]
                      const chosenId = quizAnswers[block.id]
                      const correctOpt = bc.options.find(o => o.correct)
                      const isImage = bc.optionType === 'image'

                      return (
                        <div className="quiz-block">
                          {quizBlocks.length > 1 && (
                            <div className="quiz-dots">
                              {quizBlocks.map(qb => (
                                <span key={qb.id} className={qb.id === block.id ? 'active' : quizResults[qb.id] ? 'answered' : ''} />
                              ))}
                            </div>
                          )}
                          <div className="quiz-counter">Vraag {quizBlocks.indexOf(block) + 1} van {quizBlocks.length}</div>
                          {bc.media?.url && <div style={{ textAlign: 'center', marginBottom: 16 }}><img src={bc.media.url} alt="" style={{ maxHeight: 180, borderRadius: 12, maxWidth: '100%' }} /></div>}
                          <h3 style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: 24, textAlign: 'center', color: 'var(--ink)', margin: '0 0 8px', fontWeight: 500 }}>{bc.question || 'Typ je vraag...'}</h3>
                          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', marginBottom: 20 }}>
                            {(bc.options.filter(o => o.correct).length || 0) > 1 ? 'Meerdere antwoorden mogelijk' : 'Kies één antwoord'}
                          </div>

                          {isImage ? (
                            <div className="quiz-image-grid">
                              {bc.options.map(opt => {
                                const isChosen = chosenId === opt.id; const isCorrect = opt.correct
                                let border = '1.5px solid var(--line)'
                                if (result === 'correct' && isChosen) border = '2px solid var(--green)'
                                if ((result === 'wrong' || result === 'tryAgain') && isChosen) border = '2px solid var(--red)'
                                if (result === 'revealed' && isCorrect) border = '2px solid var(--green)'
                                return <div key={opt.id} onClick={() => handleQuizAnswer(block.id, opt.id)} style={{ border, borderRadius: 12, overflow: 'hidden', cursor: (result === 'correct' || result === 'revealed') ? 'default' : 'pointer' }}>
                                  <div style={{ aspectRatio: '1', background: 'var(--cream-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {opt.image_url ? <img src={opt.image_url} alt={opt.text} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 28, color: 'var(--muted)' }}>⛶</span>}
                                  </div>
                                </div>
                              })}
                            </div>
                          ) : (
                            <div className="quiz-options">
                              {bc.options.map((opt, oi) => {
                                const isChosen = chosenId === opt.id; const isCorrect = opt.correct
                                let bg: string = 'var(--paper)', border: string = '1.5px solid var(--line)'; const color = 'var(--ink)'
                                if (result === 'correct' && isChosen) { bg = 'var(--green-soft)'; border = '1.5px solid var(--green)' }
                                if ((result === 'wrong' || result === 'tryAgain') && isChosen) { bg = '#F5EAEA'; border = '1.5px solid var(--red)' }
                                if (result === 'revealed' && isCorrect) { bg = 'var(--green-soft)'; border = '1.5px solid var(--green)' }
                                if (result === 'revealed' && isChosen && !isCorrect) { bg = '#F5EAEA'; border = '1.5px solid var(--red)' }
                                return (
                                  <div key={opt.id} onClick={() => handleQuizAnswer(block.id, opt.id)} className="quiz-opt" style={{ background: bg, border, color }}>
                                    <span className="quiz-opt-letter">{String.fromCharCode(65 + oi)}</span>
                                    <span style={{ flex: 1 }}>{opt.text || `Optie ${String.fromCharCode(65 + oi)}`}</span>
                                    {result === 'correct' && isChosen && <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: 13 }}>✓ Goed!</span>}
                                    {(result === 'wrong' || result === 'tryAgain') && isChosen && <span style={{ color: 'var(--red)', fontWeight: 600, fontSize: 13 }}>✕ Fout</span>}
                                    {result === 'revealed' && isCorrect && !isChosen && <span style={{ color: 'var(--green)', fontSize: 12 }}>Juist antwoord</span>}
                                    {result === 'revealed' && isChosen && !isCorrect && <span style={{ color: 'var(--red)', fontSize: 12 }}>Jouw keuze</span>}
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Feedback */}
                          {result === 'correct' && <div className="quiz-feedback correct">✓ Goed gedaan!</div>}
                          {result === 'tryAgain' && <div className="quiz-feedback" style={{ background: 'rgba(181,99,92,0.08)', color: 'var(--red)' }}>✕ Niet goed — probeer het nog een keer!</div>}
                          {result === 'revealed' && correctOpt && <div className="quiz-feedback reveal">Het juiste antwoord is: <strong>{correctOpt.text}</strong></div>}
                        </div>
                      )
                    })()}
                  </div>
                )
              })}

              {/* Next/Prev navigation — desktop */}
              <div className="next-wrap next-wrap-desktop">
                {prevLessonNav ? (
                  <button className="next-prev" onClick={() => router.push(`/academy/${slug}/${prevLessonNav.id}`)}>← {prevLessonNav.title}</button>
                ) : <div />}
                <div>
                  <button
                    className={`next-btn ${canProceed ? 'ready' : ''}`}
                    onClick={() => nextLessonNav ? router.push(`/academy/${slug}/${nextLessonNav.id}`) : router.push(`/academy/${slug}`)}
                    disabled={!canProceed}
                  >
                    {nextLessonNav ? `${nextLessonNav.title} →` : 'Terug naar overzicht →'}
                  </button>
                  {!canProceed && hasPlayableVideo && <div className="next-hint">Kijk de video af om verder te gaan</div>}
                  {!canProceed && isQuizLesson && <div className="next-hint">Rond de quiz af om verder te gaan</div>}
                </div>
              </div>

              {/* 3-button bottom bar — mobile only */}
              <div className="mobile-nav-bar">
                <button
                  className="mn-btn mn-prev"
                  onClick={() => prevLessonNav ? router.push(`/academy/${slug}/${prevLessonNav.id}`) : null}
                  disabled={!prevLessonNav}
                >
                  <span className="mn-arrow">←</span>
                  <span className="mn-label">Vorige</span>
                </button>
                <button
                  className="mn-btn mn-lessons"
                  onClick={() => setRailMobileOpen(true)}
                >
                  <span className="mn-icon">☰</span>
                  <span className="mn-label">Lessen</span>
                </button>
                <button
                  className={`mn-btn mn-next ${canProceed ? 'ready' : ''}`}
                  onClick={() => canProceed ? (nextLessonNav ? router.push(`/academy/${slug}/${nextLessonNav.id}`) : router.push(`/academy/${slug}`)) : null}
                  disabled={!canProceed}
                >
                  <span className="mn-label">Volgende</span>
                  <span className="mn-arrow">→</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Conversion modal — after free lesson completion */}
      {showConvertModal && (
        <div
          onClick={() => { setShowConvertModal(false); convertDismissedRef.current = true }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(12,10,7,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#FBF8F2', borderRadius: 22, maxWidth: 440, width: '100%',
              padding: '36px 32px 28px', textAlign: 'center',
              boxShadow: '0 40px 100px -30px rgba(0,0,0,0.5)',
              border: '1px solid rgba(196,162,101,0.18)',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 500, color: '#1C1814', marginBottom: 10 }}>
              Klaar voor de volledige cursus?
            </h2>
            <p style={{ fontSize: 15, color: '#4A433B', lineHeight: 1.6, marginBottom: 24 }}>
              Je hebt de gratis les afgerond. Krijg toegang tot alle lessen, de eindtoets en je certificaat.
            </p>
            <a
              href={`/cursus/${slug}`}
              style={{
                display: 'inline-block', background: 'linear-gradient(180deg,#E4C98A,#C4A265)',
                color: '#0C0A07', borderRadius: 12, padding: '14px 36px',
                fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 15,
                textDecoration: 'none', marginBottom: 12,
              }}
            >
              Schrijf je in →
            </a>
            <br />
            <button
              onClick={() => { setShowConvertModal(false); convertDismissedRef.current = true }}
              style={{
                background: 'transparent', border: 'none', color: '#A39C8E',
                fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
                padding: '8px 16px',
              }}
            >
              Misschien later
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
