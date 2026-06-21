'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/lib/auth-context'

/* ── Types ── */
interface ExamProps {
  lessonId: string
  courseId: string
  courseTitle: string
  passingScore: number
  slug: string
}

interface ExamBlock {
  id: string
  question: string
  options: Array<{ id: string; text: string; image_url?: string; correct: boolean }>
  optionType: 'text' | 'image'
  media?: { type: string; url: string } | null
}

type ExamScreen = 'start' | 'question' | 'pass' | 'fail'

/* ── Design tokens from mockup ── */
const colors = {
  bg: '#0c100d',
  bg2: '#141814',
  bg3: '#1a1e1a',
  gold: '#c9a86a',
  goldLight: '#dfc08a',
  goldDark: '#7a6340',
  goldSoft: 'rgba(201,168,106,0.08)',
  goldBorder: 'rgba(201,168,106,0.2)',
  white: '#f0ece4',
  muted: '#8a8578',
  green: '#4ade80',
  greenSoft: 'rgba(74,222,128,0.1)',
  red: '#f87171',
  redSoft: 'rgba(248,113,113,0.1)',
}

/* ── Component ── */
export default function ExamPlayer({ lessonId, courseId, courseTitle, passingScore, slug }: ExamProps) {
  const router = useRouter()
  const { user } = useAuth()

  const [screen, setScreen] = useState<ExamScreen>('start')
  const [blocks, setBlocks] = useState<ExamBlock[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [results, setResults] = useState<Record<string, boolean>>({})
  const [score, setScore] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [wrongQuestionIds, setWrongQuestionIds] = useState<string[]>([])
  const [isRetake, setIsRetake] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [completedDate, setCompletedDate] = useState<string>('')

  // Fetch exam blocks
  useEffect(() => {
    const fetchBlocks = async () => {
      const { data } = await supabase.from('blocks').select('*').eq('lesson_id', lessonId).order('sort_order')
      if (data) {
        const parsed: ExamBlock[] = data.map(b => {
          const c = b.content || {}
          return {
            id: b.id,
            question: c.question || '',
            options: c.options || [],
            optionType: c.option_type || 'text',
            media: c.media || null,
          }
        })
        setBlocks(parsed)
        setTotalQuestions(parsed.length)
      }
      setLoading(false)
    }
    fetchBlocks()
  }, [lessonId])

  // Check for existing attempt (to support retake)
  useEffect(() => {
    if (!user) return
    const checkPrevious = async () => {
      const { data } = await supabase.from('lesson_progress')
        .select('quiz_answers, completed')
        .eq('user_id', user!.id)
        .eq('lesson_id', lessonId)
        .single()
      if (data?.quiz_answers && typeof data.quiz_answers === 'object') {
        const prev = data.quiz_answers as Record<string, { chosen: string; correct: boolean }>
        const prevAnswers: Record<string, string> = {}
        const prevResults: Record<string, boolean> = {}
        const wrong: string[] = []
        Object.entries(prev).forEach(([blockId, val]) => {
          prevAnswers[blockId] = val.chosen
          prevResults[blockId] = val.correct
          if (!val.correct) wrong.push(blockId)
        })
        setAnswers(prevAnswers)
        setResults(prevResults)
        setWrongQuestionIds(wrong)
      }
    }
    checkPrevious()
  }, [user, lessonId])

  const handleStart = () => {
    if (isRetake && wrongQuestionIds.length > 0) {
      // Only show wrong questions
      const wrongBlocks = blocks.filter(b => wrongQuestionIds.includes(b.id))
      setBlocks(wrongBlocks)
      setTotalQuestions(wrongBlocks.length)
      setAnswers({})
      setResults({})
    }
    setCurrentIndex(0)
    setScreen('question')
  }

  const handleSelectOption = (blockId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [blockId]: optionId }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    // Calculate score
    let correct = 0
    const newResults: Record<string, boolean> = {}
    const wrongIds: string[] = []

    blocks.forEach(block => {
      const chosenId = answers[block.id]
      const correctOpt = block.options.find(o => o.correct)
      const isCorrect = chosenId === correctOpt?.id
      newResults[block.id] = isCorrect
      if (isCorrect) correct++
      else wrongIds.push(block.id)
    })

    const pct = blocks.length > 0 ? Math.round((correct / blocks.length) * 100) : 0
    setResults(newResults)
    setScore(pct)
    setWrongQuestionIds(wrongIds)

    // Save exam answers to DB
    if (user) {
      const examAnswers: Record<string, { chosen: string; correct: boolean }> = {}
      blocks.forEach(block => {
        examAnswers[block.id] = {
          chosen: answers[block.id] || '',
          correct: newResults[block.id],
        }
      })

      const passed = pct >= passingScore
      await supabase.from('lesson_progress').upsert({
        user_id: user.id,
        lesson_id: lessonId,
        course_id: courseId,
        quiz_answers: examAnswers,
        completed: passed,
        completed_at: passed ? new Date().toISOString() : null,
      }, { onConflict: 'user_id,lesson_id' })
    }

    setSubmitting(false)
    const passed = pct >= passingScore
    if (passed) {
      setCompletedDate(new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }))
    }
    setScreen(passed ? 'pass' : 'fail')
  }

  const handleRetakeWrong = () => {
    setIsRetake(true)
    setScreen('start')
  }

  const handleDownloadCertificate = async () => {
    setGeneratingPdf(true)
    try {
      const res = await fetch('/api/exam/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          courseId,
          courseTitle,
          lessonId,
        }),
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'luxique-certificaat.pdf'
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Certificate generation failed:', err)
    }
    setGeneratingPdf(false)
  }

  const currentBlock = blocks[currentIndex]
  const progress = totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: colors.muted }}>Examen laden...</div>

  /* ── START Screen ── */
  if (screen === 'start') {
    return (
      <div style={{ background: colors.bg, borderRadius: 20, padding: '48px 32px', maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: colors.gold, marginBottom: 16, fontFamily: '"Jost", sans-serif' }}>
          {isRetake ? 'Herkansing' : 'Certificaat'}
        </div>
        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 36, fontWeight: 500, color: colors.white, margin: '0 0 12px', lineHeight: 1.2 }}>
          {isRetake ? 'Herkans de foute vragen' : 'Klaar voor je certificaat?'}
        </h2>
        <p style={{ color: colors.muted, fontSize: 15, lineHeight: 1.6, margin: '0 0 32px', fontFamily: '"Jost", sans-serif' }}>
          {isRetake
            ? `Je hebt ${wrongQuestionIds.length} vraag${wrongQuestionIds.length !== 1 ? 'en' : ''} fout. Probeer ze opnieuw!`
            : 'Beantwoord alle vragen om je certificaat te verdienen. Je hebt unlimited pogingen.'
          }
        </p>

        {/* Meta pills */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 36 }}>
          <Pill icon="📝" text={`${isRetake ? wrongQuestionIds.length : totalQuestions} vragen`} />
          <Pill icon="🎯" text={`${passingScore}% om te slagen`} />
          <Pill icon="♾️" text="Onbeperkt proberen" />
          {!isRetake && <Pill icon="🔄" text="Alleen foute vragen herkansen" />}
        </div>

        <button
          onClick={handleStart}
          style={{
            background: colors.gold,
            color: colors.bg,
            border: 'none',
            borderRadius: 12,
            padding: '14px 32px',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: '"Jost", sans-serif',
            letterSpacing: '0.02em',
          }}
        >
          Start de toets →
        </button>
      </div>
    )
  }

  /* ── QUESTION Screen ── */
  if (screen === 'question' && currentBlock) {
    const chosenId = answers[currentBlock.id]
    const isImage = currentBlock.optionType === 'image'

    return (
      <div style={{ background: colors.bg, borderRadius: 20, padding: '40px 32px', maxWidth: 640, margin: '0 auto' }}>
        {/* Progress */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: colors.gold, fontFamily: '"Jost", sans-serif', fontWeight: 600 }}>
              Vraag {currentIndex + 1} van {totalQuestions}
            </span>
            <span style={{ fontSize: 13, color: colors.muted, fontFamily: '"Jost", sans-serif' }}>
              {progress}%
            </span>
          </div>
          <div style={{ width: '100%', height: 4, background: colors.bg3, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: colors.gold, borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Media */}
        {currentBlock.media?.url && (
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <img src={currentBlock.media.url} alt="" style={{ maxHeight: 180, borderRadius: 12, maxWidth: '100%' }} />
          </div>
        )}

        {/* Question */}
        <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 24, textAlign: 'center', color: colors.white, margin: '0 0 24px', fontWeight: 500, lineHeight: 1.4 }}>
          {currentBlock.question}
        </h3>

        {/* Options */}
        {isImage ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
            {currentBlock.options.map(opt => {
              const selected = chosenId === opt.id
              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelectOption(currentBlock.id, opt.id)}
                  style={{
                    border: selected ? `2px solid ${colors.gold}` : `1.5px solid ${colors.goldBorder}`,
                    borderRadius: 12,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                    background: selected ? colors.goldSoft : 'transparent',
                  }}
                >
                  <div style={{ aspectRatio: '1', background: colors.bg3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {opt.image_url ? (
                      <img src={opt.image_url} alt={opt.text} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 28, color: colors.muted }}>⛶</span>
                    )}
                  </div>
                  {opt.text && (
                    <div style={{ padding: '8px 12px', fontSize: 12, color: colors.white, fontFamily: '"Jost", sans-serif' }}>{opt.text}</div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
            {currentBlock.options.map((opt, oi) => {
              const selected = chosenId === opt.id
              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelectOption(currentBlock.id, opt.id)}
                  style={{
                    background: selected ? colors.goldSoft : colors.bg2,
                    border: selected ? `1.5px solid ${colors.gold}` : `1.5px solid ${colors.goldBorder}`,
                    borderRadius: 12,
                    padding: '14px 18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'all 0.15s',
                    fontFamily: '"Jost", sans-serif',
                  }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: selected ? colors.gold : colors.bg3,
                    color: selected ? colors.bg : colors.muted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 600, flexShrink: 0,
                  }}>
                    {String.fromCharCode(65 + oi)}
                  </span>
                  <span style={{ color: colors.white, fontSize: 14, flex: 1 }}>{opt.text}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => {
              if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
              else setScreen('start')
            }}
            style={{
              background: 'transparent',
              border: `1.5px solid ${colors.goldBorder}`,
              borderRadius: 10,
              padding: '10px 20px',
              color: colors.muted,
              cursor: 'pointer',
              fontFamily: '"Jost", sans-serif',
              fontSize: 14,
            }}
          >
            {currentIndex > 0 ? '← Vorige' : 'Stoppen'}
          </button>

          {currentIndex < blocks.length - 1 ? (
            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              disabled={!chosenId}
              style={{
                background: chosenId ? colors.gold : colors.bg3,
                color: chosenId ? colors.bg : colors.muted,
                border: 'none',
                borderRadius: 10,
                padding: '10px 24px',
                cursor: chosenId ? 'pointer' : 'default',
                fontFamily: '"Jost", sans-serif',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Volgende →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!chosenId || submitting}
              style={{
                background: chosenId ? colors.gold : colors.bg3,
                color: chosenId ? colors.bg : colors.muted,
                border: 'none',
                borderRadius: 10,
                padding: '10px 24px',
                cursor: chosenId ? 'pointer' : 'default',
                fontFamily: '"Jost", sans-serif',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {submitting ? 'Bezig...' : 'Inleveren →'}
            </button>
          )}
        </div>
      </div>
    )
  }

  /* ── PASS Screen ── */
  if (screen === 'pass') {
    const circumference = 2 * Math.PI * 54
    const strokeDashoffset = circumference - (score / 100) * circumference

    return (
      <div style={{ background: colors.bg, borderRadius: 20, padding: '48px 32px', maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        {/* Score ring */}
        <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 24px' }}>
          <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="60" cy="60" r="54" stroke={colors.bg3} strokeWidth="6" fill="none" />
            <circle cx="60" cy="60" r="54" stroke={colors.gold} strokeWidth="6" fill="none"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 32, fontWeight: 600, color: colors.white }}>{score}%</span>
          </div>
        </div>

        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 36, fontWeight: 500, color: colors.gold, margin: '0 0 12px' }}>
          Geslaagd!
        </h2>
        <p style={{ color: colors.muted, fontSize: 15, lineHeight: 1.6, margin: '0 0 32px', fontFamily: '"Jost", sans-serif' }}>
          Gefeliciteerd! Je hebt de eindtoets succesvol afgerond.
        </p>

        {/* Certificate card */}
        <div style={{
          background: colors.bg2,
          border: `1px solid ${colors.goldBorder}`,
          borderRadius: 16,
          padding: 32,
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: colors.gold, fontFamily: '"Jost", sans-serif', marginBottom: 16 }}>
            Certificaat van Voltooiing
          </div>
          <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 24, fontWeight: 500, color: colors.white, marginBottom: 8 }}>
            LUXIQUE Academy
          </div>
          <div style={{ width: 40, height: 1, background: colors.gold, margin: '0 auto 16px' }} />
          <div style={{ fontSize: 14, color: colors.muted, fontFamily: '"Jost", sans-serif', marginBottom: 4 }}>
            Dit certificeert dat
          </div>
          <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 22, color: colors.white, marginBottom: 12 }}>
            {user?.user_metadata?.full_name || user?.email || 'Student'}
          </div>
          <div style={{ fontSize: 14, color: colors.muted, fontFamily: '"Jost", sans-serif', marginBottom: 4 }}>
            succesvol heeft afgerond
          </div>
          <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 18, color: colors.gold, marginBottom: 16 }}>
            {courseTitle}
          </div>
          <div style={{ fontSize: 12, color: colors.muted, fontFamily: '"Jost", sans-serif' }}>
            {completedDate}
          </div>
        </div>

        <button
          onClick={handleDownloadCertificate}
          disabled={generatingPdf}
          style={{
            background: colors.gold,
            color: colors.bg,
            border: 'none',
            borderRadius: 12,
            padding: '14px 32px',
            fontSize: 15,
            fontWeight: 600,
            cursor: generatingPdf ? 'default' : 'pointer',
            fontFamily: '"Jost", sans-serif',
          }}
        >
          {generatingPdf ? 'PDF wordt gegenereerd...' : 'Download certificaat (PDF)'}
        </button>
      </div>
    )
  }

  /* ── FAIL Screen ── */
  if (screen === 'fail') {
    const circumference = 2 * Math.PI * 54
    const strokeDashoffset = circumference - (score / 100) * circumference
    const wrongCount = wrongQuestionIds.length
    const correctCount = totalQuestions - wrongCount

    return (
      <div style={{ background: colors.bg, borderRadius: 20, padding: '48px 32px', maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        {/* Score ring */}
        <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 24px' }}>
          <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="60" cy="60" r="54" stroke={colors.bg3} strokeWidth="6" fill="none" />
            <circle cx="60" cy="60" r="54" stroke={colors.red} strokeWidth="6" fill="none"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 32, fontWeight: 600, color: colors.white }}>{score}%</span>
          </div>
        </div>

        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 36, fontWeight: 500, color: colors.white, margin: '0 0 8px' }}>
          Net niet
        </h2>
        <p style={{ color: colors.muted, fontSize: 15, lineHeight: 1.6, margin: '0 0 8px', fontFamily: '"Jost", sans-serif' }}>
          Je hebt {correctCount} van de {totalQuestions} vragen goed. Je hebt minimaal {passingScore}% nodig.
        </p>
        <p style={{ color: colors.muted, fontSize: 14, lineHeight: 1.6, margin: '0 0 32px', fontFamily: '"Jost", sans-serif' }}>
          Geen zorgen — je kunt de foute vragen opnieuw proberen!
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320, margin: '0 auto' }}>
          <button
            onClick={handleRetakeWrong}
            style={{
              background: colors.gold,
              color: colors.bg,
              border: 'none',
              borderRadius: 12,
              padding: '14px 32px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: '"Jost", sans-serif',
            }}
          >
            Herkans de foute vragen →
          </button>
          <button
            onClick={() => router.push(`/academy/${slug}`)}
            style={{
              background: 'transparent',
              border: `1.5px solid ${colors.goldBorder}`,
              borderRadius: 12,
              padding: '14px 32px',
              color: colors.muted,
              cursor: 'pointer',
              fontFamily: '"Jost", sans-serif',
              fontSize: 15,
            }}
          >
            ← Eerst herhalen
          </button>
        </div>
      </div>
    )
  }

  return null
}

/* ── Pill component ── */
function Pill({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 16px',
      borderRadius: 100,
      background: colors.bg2,
      border: `1px solid ${colors.goldBorder}`,
      fontSize: 13,
      color: colors.muted,
      fontFamily: '"Jost", sans-serif',
    }}>
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  )
}
