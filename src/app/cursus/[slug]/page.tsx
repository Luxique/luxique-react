import { supabase } from '@/lib/supabase-client'
import { notFound } from 'next/navigation'
import { REVIEWS } from '@/lib/reviews'
import CourseLandingClient from './CourseLandingClient'

export const revalidate = 60

async function getCourse(slug: string) {
  const { data } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .single()
  return data
}

async function getLessons(courseId: string) {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, title, sort_order, is_free, duration_seconds, what_you_learn_text, lesson_type, parent_lesson_id')
    .eq('course_id', courseId)
    .order('sort_order')
  if (!error) return data || []
  // Pre-migratie fallback: zonder parent_lesson_id-kolom
  if (error.code === '42703' || (error.message || '').includes('does not exist')) {
    const { data: fallback } = await supabase
      .from('lessons')
      .select('id, title, sort_order, is_free, duration_seconds, what_you_learn_text, lesson_type')
      .eq('course_id', courseId)
      .order('sort_order')
    return fallback || []
  }
  return []
}

export default async function CourseLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const course = await getCourse(slug)
  if (!course) notFound()

  const lessons = await getLessons(course.id)

  return <CourseLandingClient course={course} lessons={lessons} reviews={REVIEWS} />
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const course = await getCourse(slug)
  if (!course) return { title: 'Cursus niet gevonden' }
  return {
    title: `${course.hero_title || course.title} — Luxique Academy`,
    description: course.hero_tagline || course.description || '',
  }
}
