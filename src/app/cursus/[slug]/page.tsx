import { supabase } from '@/lib/supabase-client'
import { notFound } from 'next/navigation'
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
  const { data } = await supabase
    .from('lessons')
    .select('id, title, sort_order, is_free, duration_seconds')
    .eq('course_id', courseId)
    .order('sort_order')
  return data || []
}

export default async function CourseLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const course = await getCourse(slug)
  if (!course) notFound()

  const lessons = await getLessons(course.id)

  return <CourseLandingClient course={course} lessons={lessons} />
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
