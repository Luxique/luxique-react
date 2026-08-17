'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AcademySection from '@/components/AcademySection'

interface Course {
  id: string
  title: string
  subtitle: string | null
  slug: string
  level: string | null
  price: number | null
  price_cents: number | null
  status: string
  is_first_lesson_free: boolean | null
  intro_video_mux_id: string | null
  hero_mux_playback_id: string | null
  thumbnail_time: number | null
  thumbnail_url: string | null
  duration_text: string | null
  short_description: string | null
  description: string | null
  what_you_learn: string[] | null
  access_duration_text: string | null
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Ghost-cursussen (👻) niet in het publieke overzicht.
    // Fallback: als de is_ghost-kolom nog niet bestaat (migratie niet uitgevoerd),
    // dan zonder dat filter door — zo breekt de pagina niet.
    supabase
      .from('courses')
      .select('id, title, short_description, description, slug, level, price, price_cents, status, is_first_lesson_free, intro_video_mux_id, hero_mux_playback_id, thumbnail_time, thumbnail_url, duration_text, what_you_learn, access_duration_text')
      .eq('status', 'published')
      .or('is_ghost.is.null,is_ghost.eq.false')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error && (error.code === 'PGRST204' || error.code === '42703' || (error.message || '').includes('does not exist'))) {
          return supabase
            .from('courses')
            .select('id, title, short_description, description, slug, level, price, price_cents, status, is_first_lesson_free, intro_video_mux_id, hero_mux_playback_id, thumbnail_time, thumbnail_url, duration_text, what_you_learn, access_duration_text')
            .eq('status', 'published')
            .order('created_at', { ascending: true })
            .then(({ data: d2, error: e2 }) => {
              if (e2) console.error('Courses fetch error:', e2)
              const mapped = (d2 ?? []).map(c => ({ ...c, subtitle: c.short_description }))
              setCourses(mapped)
              setLoading(false)
            })
        }
        if (error) console.error('Courses fetch error:', error)
        const mapped = (data ?? []).map(c => ({ ...c, subtitle: c.short_description }))
        setCourses(mapped)
        setLoading(false)
      })
  }, [])

  return <AcademySection courses={courses} loading={loading} />
}
