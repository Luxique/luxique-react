'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

type Course = {
  id: string; title: string; slug: string; short_description: string; level: string; duration_text: string
}

export default function DashboardPage() {
  const { user, enrollments, loading, signOut } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    if (!loading && !user) router.push('/login?redirect=/dashboard')
  }, [user, loading, router])

  useEffect(() => {
    if (enrollments.length === 0) return
    const courseIds = enrollments.map(e => e.course_id)
    supabase
      .from('courses')
      .select('id, title, slug, short_description, level, duration_text')
      .in('id', courseIds)
      .then(({ data }) => setCourses(data || []))
  }, [enrollments])

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-[#888] text-[14px]">Laden...</div>
        </div>
      </div>
    )
  }

  const firstName = user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || ''

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-white border-b border-[#eee]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="font-['Cormorant_Garamond'] text-[24px] tracking-[0.15em] text-[#1a1a1a]">LUXIQUE</a>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] text-[13px] font-semibold">
                {firstName ? firstName[0].toUpperCase() : '?'}
              </div>
              <span className="text-[13px] text-[#888]">{firstName || user.email}</span>
            </div>
            <button onClick={signOut} className="text-[12px] text-[#aaa] hover:text-[#1a1a1a] transition px-3 py-1.5 rounded-full border border-[#eee] hover:border-[#ddd]">
              Uitloggen
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="font-['Cormorant_Garamond'] text-[clamp(28px,5vw,40px)] text-[#1a1a1a] mb-2">
          Welkom terug{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-[14px] text-[#888] mb-10">Jouw LXQ Academy dashboard</p>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[
            { label: 'Cursussen', href: '/courses', icon: '🎬' },
            { label: 'Profiel', href: '/profile', icon: '👤' },
            { label: 'Boeken', href: '/booking', icon: '📅' },
            { label: 'FAQ', href: '/faq', icon: '❓' },
          ].map(a => (
            <a key={a.href} href={a.href} className="bg-white rounded-2xl p-5 border border-[#eee] hover:border-[#D4AF37]/30 text-center transition">
              <div className="text-2xl mb-2">{a.icon}</div>
              <div className="text-[12px] font-medium text-[#1a1a1a]">{a.label}</div>
            </a>
          ))}
        </div>

        {/* Enrolled Courses */}
        <h2 className="font-['Cormorant_Garamond'] text-[24px] text-[#1a1a1a] mb-4">Mijn Cursussen</h2>

        {courses.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {courses.map(course => (
              <a key={course.id} href={`/courses/${course.slug}`} className="block bg-white rounded-2xl p-6 border border-[#eee] hover:border-[#D4AF37] hover:shadow-sm transition">
                <h3 className="font-semibold text-[16px] mb-2">{course.title}</h3>
                {course.short_description && <p className="text-[13px] text-[#888] mb-3">{course.short_description}</p>}
                <div className="flex items-center gap-3 text-[11px] text-[#aaa] tracking-wide">
                  {course.level && <span>{course.level}</span>}
                  {course.duration_text && <span>• {course.duration_text}</span>}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-10 border border-[#eee] text-center">
            <div className="text-4xl mb-4">✦</div>
            <p className="text-[14px] text-[#888] mb-4">Je bent nog niet ingeschreven voor een cursus</p>
            <a href="/courses" className="inline-block px-8 py-3 rounded-full bg-[#D4AF37] text-white font-semibold text-[14px] hover:bg-[#C5A028] transition">
              Bekijk cursussen
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
