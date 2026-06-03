'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import '@mux/mux-player'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/lib/auth-context'
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
  file_name?: string; file_size?: number; file_url?: string
  subtitle?: string
}
interface ProgressRec { lesson_id: string; completed: boolean; last_position_seconds?: number }

/* ── Component ─────────────────────────────────── */
export default function LessonPage() {
  const params = useParams(); const router = useRouter()
  const { user, role } = useAuth()
  const slug = params.slug as string; const lessonId = params.lessonId as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [courseTitle, setCourseTitle] = useState('')
  const [allLessons, setAllLessons] = useState<Lesson[]>([])
  const [blocks, setBlocks] = useState<Block[]>([])
  const [progress, setProgress] = useState<Map<string, ProgressRec>>(new Map())
  const [loading, setLoading] = useState(true)
  const [enrolled, setEnrolled] = useState(false)
  const [videoCompleted, setVideoCompleted] = useState(false)

  // Rail
  const muxPlayerRef = useRef<HTMLElement>(null)
  const [railOpen, setRailOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('lux-rail-open') !== 'closed'
  })
  const [railMobileOpen, setRailMobileOpen] = useState(false)

  // Quiz
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
  const [quizResults, setQuizResults] = useState<Record<string, 'correct' | 'wrong' | 'revealed'>>({})

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
    supabase.from('lesson_progress').select('lesson_id,completed,last_position_seconds')
      .eq('user_id', user!.id).in('lesson_id', allLessons.map(l => l.id))
      .then(({ data }) => {
        if (data) { const m = new Map<string, ProgressRec>(); data.forEach((r: { lesson_id: string; completed: boolean; last_position_seconds?: number }) => m.set(r.lesson_id, r)); setProgress(m) }
      })
  }, [user, allLessons])

  // Persist rail state
  useEffect(() => { localStorage.setItem('lux-rail-open', railOpen ? 'open' : 'closed') }, [railOpen])

  /* ── Derived ──────────────────────────────────── */
  const hasAccess = enrolled || role === 'admin'
  const isLocked = !hasAccess && !lesson?.is_free
  const currentIdx = allLessons.findIndex(l => l.id === lessonId)
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null
  const completedCount = allLessons.filter(l => progress.get(l.id)?.completed).length
  const totalCount = allLessons.length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const quizBlocks = blocks.filter(b => b.type === 'quiz')
  const videoBlock = blocks.find(b => b.type === 'video')
  const hasVideoBlock = !!videoBlock
  const isLessonComplete = !!progress.get(lessonId)?.completed || videoCompleted
  const canProceed = !hasVideoBlock || isLessonComplete

  /* ── Handlers ─────────────────────────────────── */
  const markComplete = useCallback(async (lid?: string) => {
    const targetId = lid || lessonId
    if (!user || !lesson) return
    setVideoCompleted(true)
    await supabase.from('lesson_progress').upsert({
      user_id: user.id, lesson_id: targetId, course_id: lesson.course_id,
      completed: true, completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lesson_id' })
    setProgress(prev => { const n = new Map(prev); n.set(targetId, { ...prev.get(targetId)!, completed: true }); return n })
  }, [user, lesson, lessonId])

  // Mux player native event listeners for completion detection
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const player = muxPlayerRef.current as any
    if (!player || !hasVideoBlock) return

    const handleTimeUpdate = () => {
      if (!player.duration || !player.currentTime) return
      if (player.currentTime / player.duration >= 0.9) {
        const rec = progress.get(lessonId)
        if (!rec?.completed) markComplete()
      }
    }
    const handleEnded = () => {
      const rec = progress.get(lessonId)
      if (!rec?.completed) markComplete()
    }

    player.addEventListener('timeupdate', handleTimeUpdate)
    player.addEventListener('ended', handleEnded)
    return () => {
      player.removeEventListener('timeupdate', handleTimeUpdate)
      player.removeEventListener('ended', handleEnded)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasVideoBlock, lessonId])

  const handleQuizAnswer = (blockId: string, optionId: string) => {
    if (quizResults[blockId]) return
    const block = blocks.find(b => b.id === blockId)
    const chosen = block?.options?.find(o => o.id === optionId)
    if (!chosen) return
    setQuizAnswers(p => ({ ...p, [blockId]: optionId }))
    if (chosen.correct) { setQuizResults(p => ({ ...p, [blockId]: 'correct' })) }
    else { setQuizResults(p => ({ ...p, [blockId]: 'wrong' })); setTimeout(() => setQuizResults(p => ({ ...p, [blockId]: 'revealed' })), 1500) }
  }

  const fmtDur = (s?: number) => { if (!s) return ''; const m = Math.round(s / 60); return m > 0 ? `${m} min` : '' }

  const getLessonStatus = (l: Lesson) => {
    if (progress.get(l.id)?.completed) return 'done' as const
    return 'todo' as const
  }

  /* ── Loading / not found ──────────────────────── */
  if (loading) return <div className="lp-loader"><div>Cursus wordt geladen...</div></div>
  if (!lesson) return <div className="lp-loader"><div>Les niet gevonden</div><a href={`/academy/${slug}`} className="lp-link">← Terug naar cursus</a></div>

  /* ── Rail lesson items ────────────────────────── */
  const railItems = allLessons.map((l, i) => {
    const status = getLessonStatus(l)
    const isActive = l.id === lessonId
    const isLockedItem = !hasAccess && !l.is_free
    const isQuizItem = l.lesson_type === 'quiz' || l.lesson_type === 'exam'
    let sqCls = 'available'
    if (status === 'done') sqCls = 'done'
    else if (isActive) sqCls = 'current'
    else if (isLockedItem) sqCls = 'locked-pay'
    else sqCls = 'available'

    return (
      <a key={l.id} className={`ri ${isActive ? 'active' : ''} ${isLockedItem ? 'is-grey' : ''}`}
        onClick={() => { if (!isLockedItem) router.push(`/academy/${slug}/${l.id}`); setRailMobileOpen(false) }}>
        <span className={`sq ${sqCls}`}>
          {status === 'done' ? <svg viewBox="0 0 100 100"><path d="M96.975 24.985 36.627 85.332c-.702.7-1.839.7-2.542 0L3.025 54.27c-.7-.703-.7-1.84 0-2.542l7.775-7.775c.703-.7 1.84-.7 2.542 0L35.358 65.97l51.3-51.3c.703-.7 1.84-.7 2.542 0l7.775 7.774c.7.703.7 1.84 0 2.542z"/></svg>
            : isLockedItem ? '🔒'
            : isQuizItem ? '✦'
            : i + 1}
        </span>
        <span className="nm">{l.title}</span>
        {l.is_free && <span className="freebadge">Gratis</span>}
      </a>
    )
  })

  /* ── Render ───────────────────────────────────── */
  return (
    <div className="lp-shell">
      {/* Mobile rail overlay */}
      {railMobileOpen && <div className="lp-rail-overlay" onClick={() => setRailMobileOpen(false)} />}

      {/* Rail */}
      <nav className={`lp-rail ${railOpen ? 'expanded' : ''} ${railMobileOpen ? 'mobile-open' : ''}`}>
        <div className="rail-head">
          <span className="rail-brand">{courseTitle}</span>
          <button className="rail-toggle" onClick={() => { setRailOpen(!railOpen); setRailMobileOpen(false) }}>
            {railOpen ? '‹' : '›'}
          </button>
        </div>
        <div className="rail-prog">
          <div className="ring" style={{ background: `conic-gradient(var(--gold) ${progressPct}%, var(--cream-2) 0)` }}>
            <span>{progressPct}%</span>
          </div>
          <div className="prog-full">
            <span className="lbl">{completedCount} van {totalCount} voltooid · {progressPct}%</span>
            <div className="bar"><i style={{ width: `${progressPct}%` }} /></div>
          </div>
        </div>
        <div className="rail-list">{railItems}</div>
      </nav>

      {/* Main */}
      <div className="lp-main">
        {/* Topbar */}
        <div className="lp-topbar">
          <a className="back" onClick={() => router.push(`/academy/${slug}`)}>← Terug naar overzicht</a>
          <div className="nav-mini">
            {/* Mobile rail toggle */}
            <button className="rail-mobile-btn" onClick={() => setRailMobileOpen(true)}>☰ Lessen</button>
            {prevLesson && <button onClick={() => router.push(`/academy/${slug}/${prevLesson.id}`)}>← Vorige</button>}
            {nextLesson && <button onClick={() => router.push(`/academy/${slug}/${nextLesson.id}`)}>Volgende →</button>}
          </div>
        </div>

        {/* Stage */}
        <div className="lp-stage">
          <div className="crumb">Les {currentIdx + 1} van {totalCount}</div>
          <h1 className="lesson-title">{lesson.title}</h1>
          {lesson.duration_seconds ? <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>Video · {fmtDur(lesson.duration_seconds)}</div> : null}

          {/* Locked */}
          {isLocked ? (
            <div className="lp-paywall">
              <div className="t">Dit is een voorproefje</div>
              <div className="s">Schrijf je in om alle lessen, toetsen en je voortgang te ontgrendelen.</div>
              <a href={`/cursus/${slug}`}>Schrijf je in →</a>
            </div>
          ) : (
            <>
              {/* Content blocks */}
              {blocks.map(block => (
                <div key={block.id} className="blk">
                  {/* VIDEO */}
                  {block.type === 'video' && (() => {
                    const content = typeof block.content === 'object' ? block.content : {}
                    const pid = (content as Record<string, unknown>)?.mux_playback_id as string | undefined
                    const rec = progress.get(lessonId)
                    const done = !!rec?.completed
                    const resumeSec = rec?.last_position_seconds || 0
                    return pid ? (
                      <>
                        <div className="video" style={{ position: 'relative' }}>
                          <mux-player
                            ref={muxPlayerRef}
                            playback-id={pid}
                            stream-type="on-demand"
                            start-time={resumeSec > 0 ? resumeSec : undefined}
                            style={{ width: '100%', height: '100%', '--controls': '', aspectRatio: '16/9' } as React.CSSProperties}
                            title={block.title || 'Video'}
                          />
                          <div className="video-scrub" style={{ width: done ? '100%' : '0%' }} />
                        </div>
                        <div className="vid-meta">
                          <span className="l">Video · {fmtDur(lesson.duration_seconds)}</span>
                          {done && <span className="ctag show"><svg viewBox="0 0 100 100" width="13" height="13"><path fill="#5E8463" d="M96.975 24.985 36.627 85.332c-.702.7-1.839.7-2.542 0L3.025 54.27c-.7-.703-.7-1.84 0-2.542l7.775-7.775c.703-.7 1.84-.7 2.542 0L35.358 65.97l51.3-51.3c.703-.7 1.84-.7 2.542 0l7.775 7.774c.7.703.7 1.84 0 2.542z"/></svg> Voltooid</span>}
                        </div>
                      </>
                    ) : <div className="video"><div style={{ color: '#888' }}>Video wordt verwerkt...</div></div>
                  })()}

                  {/* TITEL + TEKST */}
                  {block.type === 'text' && (
                    <div className="tt">
                      {block.title && <h2>{block.title}</h2>}
                      {block.subtitle && <div className="subtitle">{block.subtitle}</div>}
                      {block.content && typeof block.content === 'string' && (
                        <div dangerouslySetInnerHTML={{ __html: block.content }} />
                      )}
                    </div>
                  )}

                  {/* FOTO */}
                  {block.type === 'image' && (() => {
                    const content = typeof block.content === 'object' ? block.content as Record<string, unknown> : {}
                    const url = (content?.url as string) || (block.media?.url)
                    return (
                      <>
                        <div className="photo">{url ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} /> : '⛶'}</div>
                        {((content?.caption as string) || block.media?.caption) && <div className="photo-cap">{(content?.caption as string) || block.media?.caption}</div>}
                      </>
                    )
                  })()}

                  {/* DOWNLOAD */}
                  {block.type === 'download' && (() => {
                    const content = typeof block.content === 'object' ? block.content as Record<string, unknown> : {}
                    const name: string = (block.title || (content?.file_name as string)) || 'Bestand'
                    const fileSize = content?.file_size as number | undefined
                    const size = fileSize ? `${(fileSize / 1024 / 1024).toFixed(1)} MB` : ''
                    const url = (content?.file_url as string) || block.file_url || '#'
                    return (
                      <a className="download" href={url} target="_blank" rel="noopener">
                        <span className="ic">↓</span>
                        <span><span className="nm">{name}</span>{size ? <span className="sz" style={{ display: 'block', marginTop: 2 }}>{size}</span> : null}</span>
                      </a>
                    )
                  })()}

                  {/* DIVIDER */}
                  {block.type === 'divider' && <div className="divider" />}

                  {/* QUIZ — reuse existing quiz UI */}
                  {block.type === 'quiz' && (() => {
                    const result = quizResults[block.id]
                    const chosenId = quizAnswers[block.id]
                    const correctOpt = block.options?.find(o => o.correct)
                    const isImage = block.option_type === 'image'
                    return (
                      <div className="quiz-block">
                        {quizBlocks.length > 1 && (
                          <div className="quiz-dots">
                            {quizBlocks.map((qb) => (
                              <span key={qb.id} className={qb.id === block.id ? 'active' : quizResults[qb.id] ? 'answered' : ''} />
                            ))}
                          </div>
                        )}
                        <div className="quiz-counter">Vraag {quizBlocks.indexOf(block) + 1} van {quizBlocks.length}</div>
                        {block.media?.url && <div style={{ textAlign: 'center', marginBottom: 16 }}><img src={block.media.url} alt="" style={{ maxHeight: 180, borderRadius: 12, maxWidth: '100%' }} /></div>}
                        <h3 style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: 24, textAlign: 'center', color: 'var(--ink)', margin: '0 0 8px', fontWeight: 500 }}>{block.question || 'Typ je vraag...'}</h3>
                        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', marginBottom: 20 }}>
                          {(block.options?.filter(o => o.correct).length || 0) > 1 ? 'Meerdere antwoorden mogelijk' : 'Kies één antwoord'}
                        </div>
                        {isImage ? (
                          <div className="quiz-image-grid">
                            {(block.options || []).map(opt => {
                              const isChosen = chosenId === opt.id; const isCorrect = opt.correct
                              let border = '1.5px solid var(--line)'
                              if (result === 'correct' && isChosen) border = '2px solid var(--green)'
                              if (result === 'wrong' && isChosen) border = '2px solid var(--red)'
                              if (result === 'revealed' && isCorrect) border = '2px solid var(--green)'
                              return <div key={opt.id} onClick={() => handleQuizAnswer(block.id, opt.id)} style={{ border, borderRadius: 12, overflow: 'hidden', cursor: result ? 'default' : 'pointer' }}>
                                <div style={{ aspectRatio: '1', background: 'var(--cream-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {opt.image_url ? <img src={opt.image_url} alt={opt.text} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 28, color: 'var(--muted)' }}>⛶</span>}
                                </div>
                              </div>
                            })}
                          </div>
                        ) : (
                          <div className="quiz-options">
                            {(block.options || []).map((opt, oi) => {
                              const isChosen = chosenId === opt.id; const isCorrect = opt.correct
                              let bg: string = 'var(--paper)', border: string = '1.5px solid var(--line)'; const color = 'var(--ink)'
                              if (result === 'correct' && isChosen) { bg = 'var(--green-soft)'; border = '1.5px solid var(--green)' }
                              if (result === 'wrong' && isChosen) { bg = '#F5EAEA'; border = '1.5px solid var(--red)' }
                              if (result === 'revealed' && isCorrect) { bg = 'var(--green-soft)'; border = '1.5px solid var(--green)' }
                              return (
                                <div key={opt.id} onClick={() => handleQuizAnswer(block.id, opt.id)} className="quiz-opt" style={{ background: bg, border, color }}>
                                  <span className="quiz-opt-letter">{String.fromCharCode(65 + oi)}</span>
                                  <span style={{ flex: 1 }}>{opt.text || `Optie ${String.fromCharCode(65 + oi)}`}</span>
                                  {result === 'correct' && isChosen && <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: 13 }}>✓ Goed!</span>}
                                  {result === 'wrong' && isChosen && <span style={{ color: 'var(--red)', fontWeight: 600, fontSize: 13 }}>✕ Fout</span>}
                                  {result === 'revealed' && isCorrect && !isChosen && <span style={{ color: 'var(--green)', fontSize: 12 }}>Juist antwoord</span>}
                                </div>
                              )
                            })}
                          </div>
                        )}
                        {result === 'correct' && <div className="quiz-feedback correct">✓ Goed gedaan!</div>}
                        {result === 'revealed' && correctOpt && <div className="quiz-feedback reveal">Het juiste antwoord is: <strong>{correctOpt.text}</strong></div>}
                      </div>
                    )
                  })()}
                </div>
              ))}

              {/* Mark complete */}
              {/* Auto-complete via video ~90% */}

              {/* Next/Prev navigation */}
              <div className="next-wrap">
                {prevLesson ? (
                  <button className="next-prev" onClick={() => router.push(`/academy/${slug}/${prevLesson.id}`)}>← {prevLesson.title}</button>
                ) : <div />}
                <div>
                  <button
                    className={`next-btn ${canProceed ? 'ready' : ''}`}
                    onClick={() => nextLesson ? router.push(`/academy/${slug}/${nextLesson.id}`) : router.push(`/academy/${slug}`)}
                    disabled={!canProceed && hasVideoBlock}
                  >
                    {nextLesson ? `${nextLesson.title} →` : 'Terug naar overzicht →'}
                  </button>
                  {!canProceed && hasVideoBlock && <div className="next-hint">Kijk de video af om verder te gaan</div>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
