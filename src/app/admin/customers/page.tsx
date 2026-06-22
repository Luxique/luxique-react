'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, JSX } from 'react'
import { supabase } from '@/lib/supabase-client'

/* ── types ── */
type Profile = {
  id: string; email: string; full_name: string; first_name: string | null; last_name: string | null;
  role: string; phone: string | null; address: string | null; city: string | null; postal_code: string | null;
  instagram: string | null; tiktok: string | null; company_name: string | null; vat_number: string | null;
  kvk_number: string | null; created_at: string
}

type Enrollment = {
  id: string; course_id: string; status: string; payment_method: string | null;
  payment_amount: number | null; paid_at: string | null; enrolled_at: string;
  granted_by: string | null; stripe_payment_intent_id: string | null;
  courses: { title: string }[]
}

type LessonProgress = {
  id: string; lesson_id: string; completed: boolean; completed_at: string | null;
  course_id: string; last_position_seconds: number; quiz_answers: Record<string, unknown>
}

type Lesson = { id: string; title: string; sort_order: number }

type PendingBooking = {
  id: string; event_type: string; slot_start: string; status: string;
  customer_name: string | null; customer_email: string | null; amount_cents: number | null
}

/* ── icons (same as /admin) ── */
function IconDashboard() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg> }
function IconUsers() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg> }
function IconBook() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg> }
function IconCalendar() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg> }
function IconEuro() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }

export default function AdminCustomersPage() {
  const { user, role, loading, signOut } = useAuth()
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [bookings, setBookings] = useState<PendingBooking[]>([])
  const [progress, setProgress] = useState<LessonProgress[]>([])
  const [lessonsByCourse, setLessonsByCourse] = useState<Record<string, Lesson[]>>({})

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!loading && !user) router.push('/login') }, [user, loading])

  useEffect(() => {
    if (role !== 'admin') return
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => setProfiles(data || []))
  }, [role])

  useEffect(() => {
    if (!selectedId) return
    const sel = profiles.find(p => p.id === selectedId)
    const email = sel?.email

    // Fetch enrollments
    supabase.from('enrollments')
      .select('id, course_id, status, payment_method, payment_amount, paid_at, enrolled_at, granted_by, stripe_payment_intent_id, courses(title)')
      .eq('user_id', selectedId).order('enrolled_at', { ascending: false })
      .then(({ data }) => {
        const enrolled = (data || []) as Enrollment[]
        setEnrollments(enrolled)
        const courseIds = Array.from(new Set(enrolled.map(e => e.course_id)))
        if (courseIds.length > 0) {
          supabase.from('lessons')
            .select('id, title, sort_order, course_id')
            .in('course_id', courseIds)
            .order('sort_order')
            .then(({ data: lessonsData }) => {
              const grouped: Record<string, Lesson[]> = {}
              ;(lessonsData || []).forEach((l: Lesson & { course_id: string }) => {
                if (!grouped[l.course_id]) grouped[l.course_id] = []
                grouped[l.course_id].push({ id: l.id, title: l.title, sort_order: l.sort_order })
              })
              setLessonsByCourse(grouped)
            })
        }
      })

    // Fetch lesson progress
    supabase.from('lesson_progress')
      .select('id, lesson_id, completed, completed_at, course_id, last_position_seconds, quiz_answers')
      .eq('user_id', selectedId)
      .then(({ data }) => setProgress((data || []) as LessonProgress[]))

    // Fetch bookings from pending_bookings (cal.com) — match by email or user_id
    let bookingQuery = supabase.from('pending_bookings')
      .select('id, event_type, slot_start, status, customer_name, customer_email, amount_cents')
      .order('slot_start', { ascending: false })

    if (email) {
      bookingQuery = bookingQuery.or(`customer_email.eq.${email},user_id.eq.${selectedId}`)
    } else {
      bookingQuery = bookingQuery.eq('user_id', selectedId)
    }

    bookingQuery.then(({ data }) => setBookings((data || []) as PendingBooking[]))
  }, [selectedId, profiles])

  if (loading) return <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center"><div className="text-[#888] text-[14px]">Laden...</div></div>
  if (!user) return <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center"><div className="text-[#888] text-[14px]">Doorverwijzen...</div></div>
  if (role !== 'admin') return <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center flex-col gap-4"><div className="text-[#888] text-[14px]">Geen toegang.</div><a href="/dashboard" className="text-[13px] text-[#C4A265]">← Terug</a></div>

  const filtered = profiles.filter(p =>
    !search || p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase())
  )

  const selected = selectedId ? profiles.find(p => p.id === selectedId) : null
  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

  const navItems: { key: string; label: string; icon: JSX.Element; href: string; active?: boolean }[] = [
    { key: 'overview', label: 'Overzicht', icon: <IconDashboard />, href: '/admin' },
    { key: 'customers', label: 'Klanten', icon: <IconUsers />, href: '/admin/customers', active: true },
    { key: 'courses', label: 'Cursussen', icon: <IconBook />, href: '/admin/courses' },
    { key: 'calendar', label: 'Agenda', icon: <IconCalendar />, href: '/admin' },
    { key: 'finance', label: 'Financiën', icon: <IconEuro />, href: '/admin' },
  ]

  return (
    <div className="min-h-screen bg-[#F5F5F4]">
      {/* Top bar — same as /admin */}
      <div className="bg-white border-b border-[#eee] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[10px] bg-[#0C0A07] text-white px-2.5 py-1 rounded-full font-bold tracking-[0.12em] uppercase">LXQ Admin</span>
            <h1 className="font-['Cormorant_Garamond'] text-[24px] text-[#1a1a1a]">Klanten</h1>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-[12px] text-[#888] hover:text-[#1a1a1a] px-3 py-1.5 rounded-full border border-[#eee]">← Website</a>
            <button onClick={signOut} className="text-[12px] text-[#888] hover:text-[#1a1a1a] px-3 py-1.5 rounded-full border border-[#eee]">Uitloggen</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* ── Sidebar — same as /admin ── */}
        <div className="w-[220px] shrink-0">
          <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden sticky top-6">
            {navItems.map(t => (
              <a key={t.key} href={t.href}
                className={`w-full flex items-center gap-3 px-5 py-3.5 text-[13px] border-b border-[#f5f5f5] last:border-0 transition ${t.active ? 'bg-[#0C0A07] text-white' : 'text-[#666] hover:bg-[#fafafa]'}`}>
                {t.icon}
                {t.label}
              </a>
            ))}
            <a href="/admin/courses" className="w-full flex items-center gap-3 px-5 py-4 text-[13px] border-t-2 border-[#C4A265]/20 bg-[#C4A265]/5 text-[#C4A265] font-semibold hover:bg-[#C4A265]/10 transition">
              <span className="text-[16px]">📚</span>
              Bouw Cursus
            </a>
            <a href="/admin/lux-knowledge" className="w-full flex items-center gap-3 px-5 py-4 text-[13px] border-b border-[#f5f5f5] text-[#666] hover:bg-[#fafafa] transition">
              <span className="text-[16px]">🤖</span>
              Luxique Kennis
            </a>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">
          <div className="grid lg:grid-cols-[340px_1fr] gap-5">
            {/* LEFT: Customer list */}
            <div>
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoek op naam of email..."
                className="w-full px-4 py-3 rounded-xl border border-[#ddd] bg-white text-[14px] focus:outline-none focus:border-[#C4A265] mb-3"
              />
              <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden">
                {filtered.length === 0 ? (
                  <div className="p-8 text-center text-[13px] text-[#888]">Geen klanten gevonden</div>
                ) : filtered.map(p => (
                  <button key={p.id} onClick={() => setSelectedId(p.id)}
                    className={`w-full text-left px-5 py-4 border-b border-[#f5f5f5] hover:bg-[#fafafa] transition ${selectedId === p.id ? 'bg-[#C4A265]/5 border-l-2 border-l-[#C4A265]' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#f5f5f5] flex items-center justify-center text-[13px] font-semibold text-[#888] shrink-0">
                        {(p.first_name || p.full_name || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium truncate">{p.full_name || 'Onbekend'}</p>
                        <p className="text-[11px] text-[#888] truncate">{p.email}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#aaa] mt-2">{filtered.length} klanten</p>
            </div>

            {/* RIGHT: Customer detail */}
            {selected ? (
              <div className="space-y-4">
                {/* Header */}
                <div className="bg-white rounded-2xl p-6 border border-[#eee]">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-[#0C0A07] flex items-center justify-center text-white text-[20px] font-semibold">
                        {(selected.first_name || selected.full_name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-[18px] font-semibold">{selected.full_name || 'Onbekend'}</h2>
                        <p className="text-[13px] text-[#888]">{selected.email}</p>
                        <p className="text-[11px] text-[#aaa] mt-0.5">Lid sinds {fmt(selected.created_at)}</p>
                      </div>
                    </div>
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${selected.role === 'admin' ? 'bg-[#0C0A07] text-white' : 'bg-[#f5f5f5] text-[#888]'}`}>{selected.role}</span>
                  </div>
                </div>

                {/* Contact */}
                <div className="bg-white rounded-2xl p-6 border border-[#eee]">
                  <h3 className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-4">Contactgegevens</h3>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                    {[
                      ['Email', selected.email],
                      ['Telefoon', selected.phone],
                      ['Adres', [selected.address, selected.postal_code, selected.city].filter(Boolean).join(', ') || null],
                      ['Instagram', selected.instagram],
                      ['TikTok', selected.tiktok],
                    ].map(([label, value]) => (
                      <div key={label as string}>
                        <p className="text-[11px] text-[#aaa]">{label as string}</p>
                        <p className="text-[13px]">{value || <span className="text-[#ccc]">—</span>}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Business */}
                {(selected.company_name || selected.vat_number || selected.kvk_number) && (
                  <div className="bg-white rounded-2xl p-6 border border-[#eee]">
                    <h3 className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-4">Bedrijfsgegevens</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        ['Bedrijfsnaam', selected.company_name],
                        ['BTW-nummer', selected.vat_number],
                        ['KVK-nummer', selected.kvk_number],
                      ].map(([label, value]) => (
                        <div key={label as string}>
                          <p className="text-[11px] text-[#aaa]">{label as string}</p>
                          <p className="text-[13px]">{value || <span className="text-[#ccc]">—</span>}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Academy */}
                <div className="bg-white rounded-2xl p-6 border border-[#eee]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[#888]">Academy — Cursussen & Voortgang</h3>
                    <span className="text-[11px] bg-[#0C0A07] text-white px-2 py-0.5 rounded-full font-medium">{enrollments.length} inschrijvingen</span>
                  </div>
                  {enrollments.length > 0 ? (
                    <div className="space-y-4">
                      {enrollments.map(e => {
                        const courseLessons = lessonsByCourse[e.course_id] || []
                        const courseProgress = progress.filter(p => p.course_id === e.course_id)
                        const completedCount = courseProgress.filter(p => p.completed).length
                        const totalCount = courseLessons.length
                        const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

                        const enrolledDate = new Date(e.enrolled_at)
                        const expiryDate = new Date(enrolledDate)
                        expiryDate.setDate(expiryDate.getDate() + 365)
                        const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                        const isExpired = daysLeft < 0
                        const monthsLeft = Math.floor(Math.abs(daysLeft) / 30)

                        return (
                          <div key={e.id} className="border border-[#f0f0f0] rounded-xl p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="text-[14px] font-semibold">{e.courses?.[0]?.title || 'Cursus'}</p>
                                <p className="text-[11px] text-[#aaa] mt-0.5">Ingeschreven {fmt(e.enrolled_at)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[14px] font-semibold">{e.payment_amount ? `€${e.payment_amount}` : '—'}</p>
                                <div className="flex items-center gap-1.5 justify-end mt-0.5">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                    e.payment_method === 'stripe' ? 'bg-purple-50 text-purple-600' :
                                    e.payment_method === 'manual' ? 'bg-[#C4A265]/10 text-[#C4A265]' :
                                    'bg-[#f5f5f5] text-[#888]'
                                  }`}>{e.payment_method || 'geen'}</span>
                                  {e.stripe_payment_intent_id && (
                                    <span className="text-[10px] text-[#bbb] font-mono" title={e.stripe_payment_intent_id}>Stripe✓</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mb-3 text-[11px]">
                              <span className={`px-2 py-0.5 rounded-full font-medium ${isExpired ? 'bg-red-50 text-red-500' : daysLeft < 30 ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-600'}`}>
                                {isExpired ? `Verlopen ${Math.abs(monthsLeft)} md geleden` : daysLeft < 30 ? `${daysLeft} dagen over` : `${monthsLeft} maanden over`}
                              </span>
                              <span className="text-[#aaa]">Toegang tot {fmt(expiryDate.toISOString())}</span>
                            </div>

                            {totalCount > 0 && (
                              <div className="mb-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[11px] font-medium text-[#666]">Voortgang</span>
                                  <span className="text-[11px] font-semibold text-[#1a1a1a]">{completedCount}/{totalCount} lessen · {pct}%</span>
                                </div>
                                <div className="h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-[#C4A265]' : 'bg-transparent'}`} style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            )}

                            {courseLessons.length > 0 && (
                              <div className="space-y-1 mt-2">
                                {courseLessons.map(lesson => {
                                  const lp = courseProgress.find(p => p.lesson_id === lesson.id)
                                  const hasQuiz = lp?.quiz_answers && Object.keys(lp.quiz_answers).length > 0
                                  return (
                                    <div key={lesson.id} className="flex items-center gap-2 py-1 text-[12px]">
                                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${lp?.completed ? 'bg-green-100 text-green-600' : 'bg-[#f0f0f0] text-[#aaa]'}`}>
                                        {lp?.completed ? '✓' : '○'}
                                      </span>
                                      <span className={lp?.completed ? 'text-[#333]' : 'text-[#999]'}>{lesson.title}</span>
                                      {hasQuiz && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-500 font-medium">quiz</span>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-[13px] text-[#888] py-2">Geen cursussen</p>
                  )}
                </div>

                {/* Treatments — from pending_bookings (cal.com) */}
                <div className="bg-white rounded-2xl p-6 border border-[#eee]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[#888]">Behandelingen</h3>
                    <span className="text-[11px] bg-[#f5f5f5] text-[#888] px-2 py-0.5 rounded-full font-medium">{bookings.length} afspraken</span>
                  </div>
                  {bookings.length > 0 ? (
                    <div className="space-y-2">
                      {bookings.map(b => (
                        <div key={b.id} className="flex items-center justify-between py-3 border-b border-[#f5f5f5] last:border-0">
                          <div>
                            <p className="text-[13px] font-medium">{b.event_type}</p>
                            <p className="text-[11px] text-[#aaa]">{fmt(b.slot_start)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {b.amount_cents != null && b.amount_cents > 0 && (
                              <span className="text-[11px] text-[#666]">€{(b.amount_cents / 100).toFixed(2)}</span>
                            )}
                            <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                              b.status === 'paid' ? 'bg-green-50 text-green-600' :
                              b.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                              b.status === 'cancelled' ? 'bg-red-50 text-red-400' :
                              b.status === 'expired' ? 'bg-[#f5f5f5] text-[#aaa]' :
                              'bg-[#f5f5f5] text-[#888]'
                            }`}>{b.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-[#888] py-2">Geen afspraken</p>
                  )}
                </div>

                {/* Quick actions */}
                <div className="flex gap-2">
                  <a href={`mailto:${selected.email}`} className="px-4 py-2 rounded-full border border-[#eee] text-[12px] text-[#888] hover:border-[#C4A265] hover:text-[#C4A265] transition">✉️ Email</a>
                  {selected.phone && (
                    <a href={`https://wa.me/${selected.phone.replace(/[^0-9+]/g, '')}`} target="_blank" className="px-4 py-2 rounded-full border border-[#eee] text-[12px] text-[#888] hover:border-[#25D366] hover:text-[#25D366] transition">💬 WhatsApp</a>
                  )}
                  {selected.instagram && (
                    <a href={`https://instagram.com/${selected.instagram.replace('@', '')}`} target="_blank" className="px-4 py-2 rounded-full border border-[#eee] text-[12px] text-[#888] hover:border-[#E1306C] hover:text-[#E1306C] transition">📷 Instagram</a>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-16 border border-[#eee] text-center">
                <div className="text-4xl mb-4">👤</div>
                <p className="text-[14px] text-[#888]">Selecteer een klant om details te bekijken</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
