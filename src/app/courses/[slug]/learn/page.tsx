'use client'

import { useAuth } from '@/lib/auth-context'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

type Lesson = {
  id: string; title: string; slug: string; description: string; video_url: string; duration_seconds: number; is_free: boolean; sort_order: number
}

type Module = {
  id: string; title: string; description: string; sort_order: number; lessons: Lesson[]
}

type Course = {
  id: string; title: string; slug: string; description: string; level: string; duration_text: string; price: number | null
}

export default function CoursePage() {
  const { user, role, enrollments, loading } = useAuth()
  const params = useParams()
  const slug = params.slug as string

  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [courseLoading, setCourseLoading] = useState(true)

  useEffect(() => {
    const loadCourse = async () => {
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single()

      if (!courseData) { setCourseLoading(false); return }
      setCourse(courseData)

      // Load modules + lessons for all users (logged in or not)
      const { data: mods } = await supabase
        .from('modules')
        .select('*, lessons(*)')
        .eq('course_id', courseData.id)
        .order('sort_order')

      if (mods) {
        const sorted = mods.map(m => ({
          ...m,
          lessons: ((m.lessons as Lesson[]) || []).sort((a, b) => a.sort_order - b.sort_order)
        }))
        setModules(sorted)
        // Set first free lesson or first lesson as active
        const firstFree = sorted.flatMap(m => m.lessons).find(l => l.is_free)
        const firstLesson = sorted[0]?.lessons[0]
        if (firstFree || firstLesson) setActiveLesson(firstFree || firstLesson || null)
      }
      setCourseLoading(false)
    }
    loadCourse()
  }, [slug])

  if (loading || courseLoading) {
    return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><div className="text-[#888] text-[14px]">Laden...</div></div>
  }

  if (!course) {
    return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center pt-24"><p className="text-[#888]">Cursus niet gevonden</p></div>
  }

  const isAdmin = role === 'admin'
  const isEnrolled = isAdmin || enrollments.some(e => e.course_id === course.id)
  const allLessons = modules.flatMap(m => m.lessons)
  const freeLessons = allLessons.filter(l => l.is_free)

  const canAccessLesson = (lesson: Lesson) => {
    if (isAdmin) return true
    if (isEnrolled) return true
    if (lesson.is_free) return true
    return false
  }

  const handleCheckout = async () => {
    if (!user) { window.location.href = '/login?redirect=/courses/' + slug; return }
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: course.id, user_id: user.id, email: user.email }),
      })
      const { url, error } = await res.json()
      if (url) window.location.href = url
      else alert(error || 'Er ging iets mis')
    } catch { alert('Er ging iets mis') }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-20">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Course Header */}
        <div className="mb-8">
          <a href="/courses" className="text-[12px] text-[#888] hover:text-[#D4AF37] transition mb-3 inline-block">← Cursussen</a>
          <h1 className="font-['Cormorant_Garamond'] text-[clamp(28px,5vw,42px)] text-[#1a1a1a] mb-2">{course.title}</h1>
          {course.description && <p className="text-[14px] text-[#888] max-w-[600px] leading-relaxed mb-3">{course.description}</p>}
          <div className="flex items-center gap-3 text-[11px] text-[#aaa] tracking-wide">
            {course.level && <span className="bg-[#f5f5f5] px-2.5 py-1 rounded-full">{course.level}</span>}
            {course.duration_text && <span>{course.duration_text}</span>}
            {isAdmin && <span className="bg-[#D4AF37]/10 text-[#D4AF37] px-2.5 py-1 rounded-full font-medium">ADMIN</span>}
            {isEnrolled && !isAdmin && <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-full font-medium">✓ Ingeschreven</span>}
          </div>
        </div>

        {/* Paywall banner for non-enrolled */}
        {!isEnrolled && !isAdmin && (
          <div className="bg-white rounded-2xl p-6 border border-[#D4AF37]/30 mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-semibold text-[15px] mb-1">Ontgrendel deze cursus</h3>
              <p className="text-[13px] text-[#888]">
                {freeLessons.length > 0
                  ? `Bekijk ${freeLessons.length} gratis les${freeLessons.length > 1 ? 'sen' : ''} hieronder, of krijg volledige toegang.`
                  : 'Krijg toegang tot alle lessen en materialen.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {course.price && <span className="text-[20px] font-['Cormorant_Garamond']">€{course.price}</span>}
              <button onClick={handleCheckout}
                className="px-6 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-[13px] hover:bg-[#C5A028] transition">
                {user ? 'Koop cursus' : 'Inloggen om te kopen'}
              </button>
            </div>
          </div>
        )}

        {/* Course Content */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Main: Video/lesson */}
          <div>
            {activeLesson && canAccessLesson(activeLesson) ? (
              <div>
                <div className="aspect-video bg-[#1a1a1a] rounded-2xl overflow-hidden mb-6">
                  {activeLesson.video_url ? (
                    <video key={activeLesson.id} src={activeLesson.video_url} controls className="w-full h-full" controlsList="nodownload" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-white/50 text-[14px]">Geen video beschikbaar</span>
                    </div>
                  )}
                </div>
                <h2 className="font-['Cormorant_Garamond'] text-[24px] text-[#1a1a1a] mb-3">{activeLesson.title}</h2>
                {activeLesson.description && <p className="text-[14px] text-[#888] leading-relaxed">{activeLesson.description}</p>}
              </div>
            ) : activeLesson && !canAccessLesson(activeLesson) ? (
              <div className="aspect-video bg-[#1a1a1a] rounded-2xl flex items-center justify-center relative overflow-hidden">
                <div className="text-center">
                  <div className="text-4xl mb-4">🔒</div>
                  <p className="text-white/70 text-[14px] mb-4">Deze les vereist toegang</p>
                  <button onClick={handleCheckout}
                    className="px-6 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-[13px] hover:bg-[#C5A028] transition">
                    Ontgrendel cursus{course.price ? ` — €${course.price}` : ''}
                  </button>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-[#f5f5f5] rounded-2xl flex items-center justify-center">
                <p className="text-[#888]">Selecteer een les</p>
              </div>
            )}
          </div>

          {/* Sidebar: Lesson list */}
          <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden h-fit max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-[#eee]">
              <h3 className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[#888]">Lessen</h3>
            </div>
            {modules.map(mod => (
              <div key={mod.id}>
                <div className="px-4 py-2 bg-[#fafafa]">
                  <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#aaa]">{mod.title}</p>
                </div>
                {mod.lessons.map(lesson => {
                  const accessible = canAccessLesson(lesson)
                  const isActive = activeLesson?.id === lesson.id
                  return (
                    <button key={lesson.id} onClick={() => setActiveLesson(lesson)}
                      className={`w-full text-left px-4 py-3 border-b border-[#f5f5f5] transition text-[13px] flex items-center gap-2
                        ${isActive ? 'bg-[#D4AF37]/5 text-[#D4AF37] font-medium' : 'hover:bg-[#fafafa] text-[#666]'}
                        ${!accessible ? 'opacity-60' : ''}`}>
                      <span className="text-[11px] shrink-0">
                        {accessible ? (lesson.video_url ? '▶' : '📄') : '🔒'}
                      </span>
                      <span className="truncate">{lesson.title}</span>
                      {lesson.is_free && !isEnrolled && (
                        <span className="text-[9px] bg-[#D4AF37]/10 text-[#D4AF37] px-1.5 py-0.5 rounded-full font-medium shrink-0">GRATIS</span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
