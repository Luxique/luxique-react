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
  status: string
  is_first_lesson_free: boolean | null
  intro_video_mux_id: string | null
  thumbnail_time: number | null
  thumbnail_url: string | null
  duration_text: string | null
  short_description: string | null
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('courses')
      .select('id, title, short_description, slug, level, price, status, is_first_lesson_free, intro_video_mux_id, thumbnail_time, thumbnail_url, duration_text')
      .eq('status', 'published')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Courses fetch error:', error)
        // Map short_description → subtitle for AcademySection compatibility
        const mapped = (data ?? []).map(c => ({ ...c, subtitle: c.short_description }))
        setCourses(mapped)
        setLoading(false)
      })
  }, [])

  return <AcademySection courses={courses} loading={loading} />
}
