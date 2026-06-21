import { redirect } from 'next/navigation'

// /courses/[slug] → redirect to course lander (sales page at /cursus/[slug])
export default async function CourseSlugRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  redirect(`/cursus/${slug}`)
}
