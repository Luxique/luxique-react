'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

type Course = { id: string; title: string; slug: string; short_description: string }
type Booking = { id: string; treatment_name: string; appointment_date: string; status: string; notes: string }

export default function DashboardPage() {
  const { user, enrollments, loading } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'academy' | 'treatments'>('overview')

  useEffect(() => {
    if (!loading && !user) router.push('/login?redirect=/dashboard')
  }, [user, loading, router])

  useEffect(() => {
    if (enrollments.length === 0) return
    supabase
      .from('courses')
      .select('id, title, slug, short_description, thumbnail_url')
      .in('id', enrollments.map(e => e.course_id))
      .then(({ data }) => setCourses(data || []))
  }, [enrollments])

  useEffect(() => {
    if (!user) return
    supabase
      .from('bookings')
      .select('id, treatment_name, appointment_date, status, notes')
      .eq('user_id', user.id)
      .order('appointment_date', { ascending: false })
      .then(({ data }) => setBookings(data || []))
  }, [user])

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

  const tabs = [
    { key: 'overview' as const, label: 'Overzicht' },
    { key: 'academy' as const, label: 'Academy' },
    { key: 'treatments' as const, label: 'Behandelingen' },
  ]

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Welcome */}
        <h1 className="font-['Cormorant_Garamond'] text-[clamp(28px,5vw,40px)] text-[#1a1a1a] mb-2">
          Welkom terug{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-[14px] text-[#888] mb-8">Jouw LXQ dashboard</p>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white rounded-full p-1 border border-[#eee] w-fit">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-5 py-2 rounded-full text-[13px] font-medium transition ${activeTab === t.key ? 'bg-[#D4AF37] text-white' : 'text-[#888] hover:text-[#1a1a1a]'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Cursussen', value: courses.length, icon: '🎬', href: undefined },
                { label: 'Afspraken', value: bookings.filter(b => b.status === 'confirmed').length, icon: '📅', href: undefined },
                { label: 'Cursussen bekijken', value: '', icon: '→', href: '/courses' },
                { label: 'Afspraak boeken', value: '', icon: '+', href: '/booking' },
              ].map((s, i) => (
                s.href ? (
                  <a key={i} href={s.href} className="bg-white rounded-2xl p-5 border border-[#eee] hover:border-[#D4AF37]/30 text-center transition">
                    <div className="text-xl mb-1">{s.icon}</div>
                    <div className="text-[11px] font-medium text-[#D4AF37]">{s.label}</div>
                  </a>
                ) : (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-[#eee] text-center">
                    <div className="text-2xl font-['Cormorant_Garamond'] text-[#1a1a1a] mb-1">{s.value}</div>
                    <div className="text-[11px] text-[#888]">{s.label}</div>
                  </div>
                )
              ))}
            </div>

            {/* Recent courses */}
            {courses.length > 0 && (
              <div>
                <h2 className="font-['Cormorant_Garamond'] text-[20px] text-[#1a1a1a] mb-4">Verder kijken</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {courses.slice(0, 2).map(c => (
                    <a key={c.id} href={`/courses/${c.slug}`} className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-[#eee] hover:border-[#D4AF37]/30 transition">
                      <div className="w-16 h-16 rounded-xl bg-[#f5f5f5] flex items-center justify-center text-2xl shrink-0">🎬</div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-[14px] truncate">{c.title}</h3>
                        <p className="text-[12px] text-[#D4AF37] font-medium mt-1">Verder kijken →</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming bookings */}
            {bookings.filter(b => new Date(b.appointment_date) > new Date()).length > 0 && (
              <div>
                <h2 className="font-['Cormorant_Garamond'] text-[20px] text-[#1a1a1a] mb-4">Komende afspraken</h2>
                <div className="space-y-2">
                  {bookings.filter(b => new Date(b.appointment_date) > new Date()).map(b => (
                    <div key={b.id} className="bg-white rounded-2xl p-4 border border-[#eee] flex items-center justify-between">
                      <div>
                        <span className="font-medium text-[14px]">{b.treatment_name}</span>
                        <p className="text-[12px] text-[#888] mt-0.5">{new Date(b.appointment_date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <span className="text-[11px] bg-green-50 text-green-600 px-3 py-1 rounded-full font-medium">Bevestigd</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ACADEMY TAB */}
        {activeTab === 'academy' && (
          <div>
            <h2 className="font-['Cormorant_Garamond'] text-[24px] text-[#1a1a1a] mb-6">Mijn Cursussen</h2>
            {courses.length > 0 ? (
              <div className="space-y-3">
                {courses.map(c => (
                  <a key={c.id} href={`/courses/${c.slug}`} className="flex items-center gap-5 bg-white rounded-2xl p-5 border border-[#eee] hover:border-[#D4AF37] transition group">
                    <div className="w-20 h-20 rounded-xl bg-[#f5f5f5] flex items-center justify-center text-3xl shrink-0">🎬</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[16px] mb-1">{c.title}</h3>
                      {c.short_description && <p className="text-[13px] text-[#888] truncate">{c.short_description}</p>}
                    </div>
                    <span className="text-[13px] text-[#D4AF37] font-semibold group-hover:text-[#C5A028] transition shrink-0">Verder →</span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 border border-[#eee] text-center">
                <div className="text-4xl mb-4">✦</div>
                <p className="text-[14px] text-[#888] mb-4">Je bent nog niet ingeschreven voor een cursus</p>
                <a href="/courses" className="inline-block px-8 py-3 rounded-full bg-[#D4AF37] text-white font-semibold text-[14px] hover:bg-[#C5A028] transition">Bekijk cursussen</a>
              </div>
            )}
          </div>
        )}

        {/* TREATMENTS TAB */}
        {activeTab === 'treatments' && (
          <div>
            <h2 className="font-['Cormorant_Garamond'] text-[24px] text-[#1a1a1a] mb-6">Behandelingen</h2>
            {bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.map(b => {
                  const isPast = new Date(b.appointment_date) < new Date()
                  return (
                    <div key={b.id} className="bg-white rounded-2xl p-5 border border-[#eee] flex items-center justify-between">
                      <div>
                        <span className="font-medium text-[15px]">{b.treatment_name}</span>
                        <p className="text-[12px] text-[#888] mt-1">{new Date(b.appointment_date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        {b.notes && <p className="text-[11px] text-[#aaa] mt-1">{b.notes}</p>}
                      </div>
                      <span className={`text-[11px] px-3 py-1 rounded-full font-medium ${isPast ? 'bg-[#f5f5f5] text-[#888]' : 'bg-green-50 text-green-600'}`}>
                        {isPast ? 'Afgelopen' : 'Bevestigd'}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 border border-[#eee] text-center">
                <div className="text-4xl mb-4">📅</div>
                <p className="text-[14px] text-[#888] mb-4">Nog geen behandelingen geboekt</p>
                <a href="/booking" className="inline-block px-8 py-3 rounded-full bg-[#D4AF37] text-white font-semibold text-[14px] hover:bg-[#C5A028] transition">Boek een afspraak</a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
