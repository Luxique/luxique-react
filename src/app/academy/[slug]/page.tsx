'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
// MuxPlayer will be dynamically imported to avoid SSR issues

interface Course {
  id: string
  title: string
  slug: string
  description?: string
  short_description?: string
  thumbnail_url?: string
  price: number
  level: string
  is_published: boolean
  first_lesson_free: boolean
  intro_video_mux_id?: string
  status: string
  lessons?: Lesson[]
}

interface Lesson {
  id: string
  title: string
  slug: string
  description?: string
  duration_seconds?: number
  is_free: boolean
  sort_order: number
}

export default function CoursePage() {
  const params = useParams()
  const slug = params.slug as string
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        // Fetch course by slug
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .single()

        if (courseError) {
          throw courseError
        }

        if (!courseData) {
          setError('Cursus niet gevonden')
          return
        }

        setCourse(courseData)

        // Fetch lessons for this course
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', courseData.id)
          .order('sort_order')

        if (lessonsError) {
          console.error('Error fetching lessons:', lessonsError)
        } else {
          setLessons(lessonsData || [])
        }
      } catch (err) {
        console.error('Error fetching course:', err)
        setError('Er is een fout opgetreden bij het laden van de cursus')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchCourse()
    }
  }, [slug])

  const formatDuration = (seconds?: number) => {
    if (!seconds) return ''
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}u ${minutes}min`
    }
    return `${minutes} min`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center">
        <div className="text-[#7A7268] text-[16px]">Cursus wordt geladen...</div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center flex-col gap-4">
        <div className="text-[#7A7268] text-[16px]">{error || 'Cursus niet gevonden'}</div>
        <a href="/academy" className="text-[14px] text-[#C4A265] hover:underline">
          ← Terug naar academie
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      {/* Hero Section */}
      <div className="relative">
        {course.intro_video_mux_id ? (
          <div className="w-full aspect-video bg-black flex items-center justify-center">
            <div className="text-white text-center">
              <div className="w-16 h-16 bg-[#C4A265] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <p className="text-lg font-medium">Intro video</p>
              <p className="text-sm opacity-75">Klik om te starten</p>
            </div>
          </div>
        ) : (
          <div 
            className="w-full aspect-video bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: course.thumbnail_url 
                ? `url(${course.thumbnail_url})` 
                : 'linear-gradient(135deg, #C4A265 0%, #7A6340 100%)'
            }}
          />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium bg-[#C4A265] text-white px-3 py-1 rounded-full">
                {course.level}
              </span>
              {course.first_lesson_free && (
                <span className="text-sm font-medium bg-white/20 text-white px-3 py-1 rounded-full">
                  Eerste les gratis
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {course.title}
            </h1>
            {course.short_description && (
              <p className="text-lg md:text-xl text-white/90 mb-6">
                {course.short_description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Course Description */}
            {course.description && (
              <div className="bg-white rounded-lg p-6 mb-8">
                <h2 className="text-2xl font-bold mb-4 text-[#1E1A14]">Over deze cursus</h2>
                <div className="prose prose-lg text-[#7A7268]">
                  {course.description.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Lessons List */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6 text-[#1E1A14]">Cursusinhoud</h2>
              <div className="space-y-4">
                {lessons.map((lesson, index) => (
                  <div 
                    key={lesson.id} 
                    className={`p-4 rounded-lg border transition-all ${
                      lesson.is_free 
                        ? 'border-[#C4A265] bg-[#FAF8F4]' 
                        : 'border-[#E8E3DB] hover:border-[#C4A265] hover:bg-[#FAF8F4]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="w-8 h-8 rounded-full bg-[#C4A265] text-white flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <h3 className="text-lg font-semibold text-[#1E1A14]">
                            {lesson.title}
                          </h3>
                          {lesson.is_free && (
                            <span className="text-xs font-medium bg-[#C4A265] text-white px-2 py-1 rounded-full">
                              Gratis
                            </span>
                          )}
                        </div>
                        {lesson.description && (
                          <p className="text-[#7A7268] text-sm mb-2 ml-11">
                            {lesson.description}
                          </p>
                        )}
                        {lesson.duration_seconds && (
                          <div className="flex items-center gap-4 text-sm text-[#7A7268] ml-11">
                            <span>⏱️ {formatDuration(lesson.duration_seconds)}</span>
                          </div>
                        )}
                      </div>
                      <button 
                        className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          lesson.is_free
                            ? 'bg-[#C4A265] text-white hover:bg-[#7A6340]'
                            : 'bg-[#E8E3DB] text-[#7A7268] hover:bg-[#C4A265] hover:text-white'
                        }`}
                      >
                        {lesson.is_free ? 'Bekijken' : 'Inschrijven'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Course Card */}
            <div className="bg-white rounded-lg p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-[#1E1A14] mb-2">
                  €{(course.price / 100).toFixed(2)}
                </div>
                <div className="text-[#7A7268] text-sm">
                  Eenmalige betaling
                </div>
              </div>

              <button className="w-full bg-[#C4A265] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#7A6340] transition-colors mb-4">
                Direct inschrijven
              </button>

              {course.first_lesson_free && (
                <button className="w-full border border-[#C4A265] text-[#C4A265] py-3 px-6 rounded-lg font-semibold hover:bg-[#FAF8F4] transition-colors">
                  Eerste les gratis proberen
                </button>
              )}

              <div className="mt-6 pt-6 border-t border-[#E8E3DB]">
                <h3 className="font-semibold text-[#1E1A14] mb-3">Inbegrepen</h3>
                <ul className="space-y-2 text-sm text-[#7A7268]">
                  <li className="flex items-center gap-2">
                    <span className="text-[#C4A265]">✓</span>
                    Levenslange toegang
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#C4A265]">✓</span>
                    Certificaat bij afronding
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#C4A265]">✓</span>
                    Toegang op alle apparaten
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#C4A265]">✓</span>
                    Updates van de cursus
                  </li>
                </ul>
              </div>

              {/* Admin Link */}
              <div className="mt-6 pt-6 border-t border-[#E8E3DB]">
                <a 
                  href={`/admin/courses/${course.id}/builder`}
                  className="text-xs text-[#7A7268] hover:text-[#C4A265] transition-colors"
                >
                  → Cursus beheren (admin)
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}