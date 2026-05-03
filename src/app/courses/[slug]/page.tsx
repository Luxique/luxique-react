'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

type Lesson = {
  id: string; title: string; slug: string; description: string; video_url: string; duration_seconds: number; is_free: boolean; sort_order: number
}

type Module = {
  id: string; title: string; description: string; sort_order: number; lessons: Lesson[]
}

type Course = {
  id: string; title: string; slug: string; description: string; level: string; duration_text: string
}

export default function CoursePage() {
  const { user, enrollments, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/login?redirect=/courses/' + slug)
  }, [user, loading, router, slug])

  useEffect(() => {
    if (!user) return

    // Check enrollment
    const isEnrolled = async () => {
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single()

      if (!courseData) { router.push('/dashboard'); return }
      setCourse(courseData)

      // Check if enrolled
      const enrolled = enrollments.some(e => e.course_id === courseData.id)
      if (!enrolled) { router.push('/pricing'); return }

      // Get modules with lessons
      const { data: mods } = await supabase
        .from('modules')
        .select('*, lessons(*)')
        .eq('course_id', courseData.id)
        .order('sort_order')

      if (mods) {
        const sorted = mods.map(m => ({
          ...m,
          lessons: (m.lessons as Lesson[]).sort((a, b) => a.sort_order - b.sort_order)
        }))
        setModules(sorted)
        if (sorted[0]?.lessons[0]) setActiveLesson(sorted[0].lessons[0])
      }
    }

    isEnrolled()
  }, [user, slug, enrollments, router])

  if (loading || !user || !course) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-[#888] text-[14px]">Laden...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* Sidebar */}
      <aside className="w-[320px] bg-white border-r border-[#eee] overflow-y-auto fixed h-full">
        <div className="p-6 border-b border-[#eee]">
          <a href="/dashboard" className="text-[12px] text-[#aaa] hover:text-[#1a1a1a] transition mb-3 block">← Terug naar dashboard</a>
          <h2 className="font-semibold text-[16px]">{course.title}</h2>
          <div className="flex items-center gap-2 text-[11px] text-[#aaa] mt-1">
            {course.level && <span>{course.level}</span>}
            {course.duration_text && <span>• {course.duration_text}</span>}
          </div>
        </div>

        <div className="p-4">
          {modules.map(mod => (
            <div key={mod.id} className="mb-4">
              <h3 className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-2 px-2">
                {mod.title}
              </h3>
              {mod.lessons.map(lesson => (
                <button
                  key={lesson.id}
                  onClick={() => setActiveLesson(lesson)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-[13px] transition mb-1 ${
                    activeLesson?.id === lesson.id
                      ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium'
                      : 'text-[#666] hover:bg-[#f5f5f5]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]">
                      {lesson.video_url ? '▶' : '📄'}
                    </span>
                    {lesson.title}
                  </div>
                  {lesson.duration_seconds > 0 && (
                    <span className="text-[10px] text-[#aaa] ml-5">
                      {Math.round(lesson.duration_seconds / 60)} min
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[320px]">
        {activeLesson ? (
          <div>
            {/* Video Player */}
            {activeLesson.video_url ? (
              <div className="aspect-video bg-black">
                <video
                  key={activeLesson.id}
                  src={activeLesson.video_url}
                  controls
                  className="w-full h-full"
                  controlsList="nodownload"
                />
              </div>
            ) : (
              <div className="aspect-video bg-[#1a1a1a] flex items-center justify-center">
                <span className="text-white/50 text-[14px]">Geen video beschikbaar</span>
              </div>
            )}

            {/* Lesson Info */}
            <div className="max-w-3xl mx-auto px-8 py-8">
              <h1 className="font-['Cormorant_Garamond'] text-[28px] text-[#1a1a1a] mb-3">
                {activeLesson.title}
              </h1>
              {activeLesson.description && (
                <p className="text-[14px] text-[#888] leading-relaxed">
                  {activeLesson.description}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-screen">
            <p className="text-[#888]">Selecteer een les</p>
          </div>
        )}
      </main>
    </div>
  )
}
