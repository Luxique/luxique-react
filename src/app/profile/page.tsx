'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

export default function ProfilePage() {
  const { user, enrollments, loading, signOut } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<{id:string;title:string;slug:string;short_description:string}[]>([])

  useEffect(() => {
    if (!loading && !user) router.push('/login?redirect=/profile')
  }, [user, loading, router])

  useEffect(() => {
    if (enrollments.length === 0) return
    supabase
      .from('courses')
      .select('id, title, slug, short_description')
      .in('id', enrollments.map(e => e.course_id))
      .then(({ data }) => setCourses(data || []))
  }, [enrollments])

  if (loading || !user) {
    return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><div className="text-[#888] text-[14px]">Laden...</div></div>
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-white border-b border-[#eee]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="font-['Cormorant_Garamond'] text-[24px] tracking-[0.15em] text-[#1a1a1a]">LUXIQUE</a>
          <button onClick={signOut} className="text-[12px] text-[#aaa] hover:text-[#1a1a1a] transition">Uitloggen</button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-['Cormorant_Garamond'] text-[36px] text-[#1a1a1a] mb-2">Mijn Profiel</h1>
        <div className="w-20 h-0.5 bg-[#D4AF37] mb-10" />

        {/* Profile Info */}
        <div className="bg-white rounded-2xl p-6 border border-[#eee] mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] text-[20px] font-semibold">
              {(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-[16px]">{user.user_metadata?.full_name || 'Gebruiker'}</h3>
              <p className="text-[13px] text-[#888]">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Enrolled Courses */}
        <h2 className="font-['Cormorant_Garamond'] text-[24px] text-[#1a1a1a] mb-4">Mijn Cursussen</h2>
        {courses.length > 0 ? (
          <div className="space-y-3">
            {courses.map(c => (
              <a key={c.id} href={`/courses/${c.slug}`} className="block bg-white rounded-2xl p-5 border border-[#eee] hover:border-[#D4AF37]/30 transition">
                <h3 className="font-semibold text-[14px]">{c.title}</h3>
                {c.short_description && <p className="text-[12px] text-[#888] mt-1">{c.short_description}</p>}
              </a>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 border border-[#eee] text-center">
            <p className="text-[14px] text-[#888] mb-4">Nog niet ingeschreven</p>
            <a href="/courses" className="px-6 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-[13px] hover:bg-[#C5A028] transition">Bekijk cursussen</a>
          </div>
        )}

        {/* Bookings */}
        <h2 className="font-['Cormorant_Garamond'] text-[24px] text-[#1a1a1a] mt-10 mb-4">Afspraken</h2>
        <div className="bg-white rounded-2xl p-6 border border-[#eee]">
          <p className="text-[13px] text-[#888]">Nog geen afspraken gepland.</p>
          <a href="/booking" className="inline-block mt-3 text-[13px] text-[#D4AF37] font-semibold hover:underline">Plan een afspraak →</a>
        </div>
      </div>
    </div>
  )
}
