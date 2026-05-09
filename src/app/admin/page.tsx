'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase-client'

/* ── types ── */
type Profile = { id: string; email: string; full_name: string; role: string; created_at: string }
type Course = { id: string; title: string; slug: string; is_published: boolean; price: number | null; sort_order: number }
type Enrollment = {
  id: string; user_id: string; course_id: string; status: string;
  payment_method: string | null; payment_amount: number | null; paid_at: string | null;
  enrolled_at: string; granted_by: string | null;
  courses: { title: string }[]; profiles: { email: string; full_name: string }[]
}
type Booking = { id: string; treatment_name: string; appointment_date: string; status: string }

/* ── icons ── */
function IconDashboard() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg> }
function IconUsers() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg> }
function IconBook() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg> }
function IconCalendar() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg> }
function IconEuro() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
function IconPlus() { return <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> }

type Tab = 'overview' | 'customers' | 'courses' | 'calendar' | 'finance'

export default function AdminPage() {
  const { user, role, loading, signOut } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [showGrant, setShowGrant] = useState(false)
  const [grantUserId, setGrantUserId] = useState('')
  const [grantCourseId, setGrantCourseId] = useState('')
  const [granting, setGranting] = useState(false)

  // Auth guard
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!loading && !user) router.push('/login') }, [user, loading])

  const refresh = useCallback(() => {
    if (role !== 'admin') return
    supabase.from('profiles').select('id, email, full_name, role, created_at').order('created_at', { ascending: false }).then(({ data }) => setProfiles(data || []))
    supabase.from('courses').select('*').order('sort_order').then(({ data }) => setCourses(data || []))
    supabase.from('enrollments')
      .select('id, user_id, course_id, status, payment_method, payment_amount, paid_at, enrolled_at, granted_by, courses(title), profiles(email, full_name)')
      .order('enrolled_at', { ascending: false })
      .then(({ data }) => setEnrollments(data || []))
    supabase.from('bookings').select('id, treatment_name, appointment_date, status').order('appointment_date', { ascending: false }).then(({ data }) => setBookings(data || []))
  }, [role])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refresh() }, [role])

  const grantAccess = async () => {
    if (!grantUserId || !grantCourseId) return
    setGranting(true)
    await supabase.from('enrollments').upsert({
      user_id: grantUserId, course_id: grantCourseId, status: 'active',
      payment_method: 'manual', paid_at: new Date().toISOString(),
      enrolled_at: new Date().toISOString(), granted_by: user?.id,
    }, { onConflict: 'user_id,course_id' })
    setShowGrant(false); setGrantUserId(''); setGrantCourseId('')
    refresh(); setGranting(false)
  }

  const revokeAccess = async (id: string) => {
    await supabase.from('enrollments').delete().eq('id', id)
    setEnrollments(prev => prev.filter(e => e.id !== id))
  }

  const togglePublished = async (id: string, current: boolean) => {
    await supabase.from('courses').update({ is_published: !current }).eq('id', id)
    setCourses(prev => prev.map(c => c.id === id ? { ...c, is_published: !current } : c))
  }

  const deleteCourse = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze cursus wilt verwijderen?')) return
    await supabase.from('courses').delete().eq('id', id)
    setCourses(prev => prev.filter(c => c.id !== id))
  }

  // ── Computed stats ──
  const now = new Date()
  const thisMonth = enrollments.filter(e => {
    const d = new Date(e.paid_at || e.enrolled_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const totalRevenue = enrollments.reduce((sum, e) => sum + (e.payment_amount || 0), 0)
  const monthlyRevenue = thisMonth.reduce((sum, e) => sum + (e.payment_amount || 0), 0)
  const activeStudents = new Set(enrollments.filter(e => e.status === 'active').map(e => e.user_id)).size
  const upcomingBookings = bookings.filter(b => new Date(b.appointment_date) >= now && b.status !== 'cancelled').slice(0, 5)

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : '—'

  if (loading) return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><div className="text-[#888] text-[14px]">Laden...</div></div>
  if (!user) return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><div className="text-[#888] text-[14px]">Doorverwijzen...</div></div>
  if (role !== 'admin') return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center flex-col gap-4"><div className="text-[#888] text-[14px]">Geen toegang.</div><a href="/dashboard" className="text-[13px] text-[#D4AF37]">← Terug</a></div>

  const tabs: { key: Tab; label: string; icon: JSX.Element }[] = [
    { key: 'overview', label: 'Overzicht', icon: <IconDashboard /> },
    { key: 'customers', label: `Klanten (${profiles.length})`, icon: <IconUsers /> },
    { key: 'courses', label: `Cursussen (${courses.length})`, icon: <IconBook /> },
    { key: 'calendar', label: 'Agenda', icon: <IconCalendar /> },
    { key: 'finance', label: 'Financiën', icon: <IconEuro /> },
  ]

  return (
    <div className="min-h-screen bg-[#F5F5F4]">
      {/* Top bar */}
      <div className="bg-white border-b border-[#eee] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[10px] bg-[#0C0A07] text-white px-2.5 py-1 rounded-full font-bold tracking-[0.12em] uppercase">LXQ Admin</span>
            <h1 className="font-['Cormorant_Garamond'] text-[24px] text-[#1a1a1a]">
              {tabs.find(t => t.key === tab)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-[12px] text-[#888] hover:text-[#1a1a1a] px-3 py-1.5 rounded-full border border-[#eee]">← Website</a>
            <button onClick={signOut} className="text-[12px] text-[#888] hover:text-[#1a1a1a] px-3 py-1.5 rounded-full border border-[#eee]">Uitloggen</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* ── Sidebar nav ── */}
        <div className="w-[220px] shrink-0">
          <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden sticky top-6">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-3 px-5 py-3.5 text-[13px] text-left border-b border-[#f5f5f5] last:border-0 transition ${tab === t.key ? 'bg-[#0C0A07] text-white' : 'text-[#666] hover:bg-[#fafafa]'}`}>
                {t.icon}
                {t.key === 'overview' ? 'Overzicht' : t.key === 'customers' ? `Klanten` : t.key === 'courses' ? 'Cursussen' : t.key === 'calendar' ? 'Agenda' : 'Financiën'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">

          {/* ═══ OVERVIEW ═══ */}
          {tab === 'overview' && (
            <div className="space-y-5">
              {/* Stat cards */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Inkomen deze maand', value: `€${monthlyRevenue.toLocaleString('nl-NL')}`, sub: `${thisMonth.length} betalingen`, accent: true },
                  { label: 'Totaal inkomen', value: `€${totalRevenue.toLocaleString('nl-NL')}`, sub: `${enrollments.length} inschrijvingen` },
                  { label: 'Actieve studenten', value: String(activeStudents), sub: `${profiles.length} totaal` },
                  { label: 'Aankomende afspraken', value: String(upcomingBookings.length), sub: 'deze week' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl p-5 border border-[#eee]">
                    <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-2">{s.label}</p>
                    <p className={`text-[28px] font-['Cormorant_Garamond'] leading-1 ${s.accent ? 'text-[#C4A265]' : 'text-[#1a1a1a]'}`}>{s.value}</p>
                    <p className="text-[11px] text-[#aaa] mt-1">{s.sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-[1fr_340px] gap-5">
                {/* Recent enrollments */}
                <div className="bg-white rounded-2xl border border-[#eee] p-5">
                  <h3 className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-4">Recente inschrijvingen</h3>
                  {enrollments.length > 0 ? (
                    <div className="space-y-3">
                      {enrollments.slice(0, 8).map(e => (
                        <div key={e.id} className="flex items-center justify-between py-2 border-b border-[#f5f5f5] last:border-0">
                          <div>
                            <p className="text-[13px] font-medium">{e.profiles?.[0]?.full_name || e.profiles?.[0]?.email || '—'}</p>
                            <p className="text-[11px] text-[#aaa]">{e.courses?.[0]?.title}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[13px] font-medium">{e.payment_amount ? `€${e.payment_amount}` : '—'}</p>
                            <p className="text-[11px] text-[#aaa]">{fmt(e.paid_at || e.enrolled_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-[13px] text-[#888]">Nog geen inschrijvingen</p>}
                </div>

                {/* Upcoming bookings / mini calendar */}
                <div className="bg-white rounded-2xl border border-[#eee] p-5">
                  <h3 className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-4">Aankomende afspraken</h3>
                  {upcomingBookings.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingBookings.map(b => (
                        <div key={b.id} className="flex items-center gap-3 py-2 border-b border-[#f5f5f5] last:border-0">
                          <div className="w-10 h-10 rounded-xl bg-[#0C0A07] flex flex-col items-center justify-center text-white shrink-0">
                            <span className="text-[10px] font-semibold leading-none">{new Date(b.appointment_date).toLocaleDateString('nl-NL', { weekday: 'short' })}</span>
                            <span className="text-[14px] font-bold leading-none">{new Date(b.appointment_date).getDate()}</span>
                          </div>
                          <div>
                            <p className="text-[13px] font-medium">{b.treatment_name}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${b.status === 'confirmed' ? 'bg-green-50 text-green-600' : 'bg-[#f5f5f5] text-[#888]'}`}>{b.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-[13px] text-[#888]">Geen aankomende afspraken</p>}
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex gap-3">
                <button onClick={() => setShowGrant(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0C0A07] text-white text-[13px] font-medium hover:bg-[#333] transition">
                  <IconPlus /> Cursus toewijzen
                </button>
              </div>
            </div>
          )}

          {/* ═══ CUSTOMERS ═══ */}
          {tab === 'customers' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#eee]">
                      <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Naam</th>
                      <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Email</th>
                      <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Rol</th>
                      <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Sinds</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map(p => (
                      <tr key={p.id} className="border-b border-[#f5f5f5] hover:bg-[#fafafa]">
                        <td className="px-5 py-3 text-[13px] font-medium">{p.full_name || '—'}</td>
                        <td className="px-5 py-3 text-[13px] text-[#888]">{p.email}</td>
                        <td className="px-5 py-3"><span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${p.role === 'admin' ? 'bg-[#0C0A07] text-white' : 'bg-[#f5f5f5] text-[#888]'}`}>{p.role}</span></td>
                        <td className="px-5 py-3 text-[12px] text-[#aaa]">{fmt(p.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ COURSES ═══ */}
          {tab === 'courses' && (
            <div className="space-y-4">
              {/* Enrollments table */}
              <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#eee] flex items-center justify-between">
                  <h3 className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[#888]">Alle inschrijvingen</h3>
                  <span className="text-[11px] bg-[#f5f5f5] text-[#888] px-2.5 py-1 rounded-full">{enrollments.length}</span>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#eee]">
                      <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Cursist</th>
                      <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Cursus</th>
                      <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Betaald</th>
                      <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Methode</th>
                      <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Datum</th>
                      <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Actie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map(e => (
                      <tr key={e.id} className="border-b border-[#f5f5f5] hover:bg-[#fafafa]">
                        <td className="px-5 py-3 text-[13px]">{e.profiles?.[0]?.full_name || e.profiles?.[0]?.email || '—'}</td>
                        <td className="px-5 py-3 text-[13px]">{e.courses?.[0]?.title || '—'}</td>
                        <td className="px-5 py-3 text-[13px]">{e.payment_amount ? `€${e.payment_amount}` : e.payment_method === 'manual' ? 'Handmatig' : '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${e.payment_method === 'stripe' ? 'bg-purple-50 text-purple-600' : e.payment_method === 'manual' ? 'bg-[#C4A265]/10 text-[#C4A265]' : 'bg-[#f5f5f5] text-[#888]'}`}>{e.payment_method || '—'}</span>
                        </td>
                        <td className="px-5 py-3 text-[12px] text-[#888]">{fmt(e.paid_at || e.enrolled_at)}</td>
                        <td className="px-5 py-3"><button onClick={() => revokeAccess(e.id)} className="text-[11px] px-3 py-1 rounded-full border border-red-200 text-red-400 hover:bg-red-50 transition">Intrekken</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Course management */}
              <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#eee] flex items-center justify-between">
                  <h3 className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[#888]">Cursusbeheer</h3>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#eee]">
                      <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Cursus</th>
                      <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Slug</th>
                      <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Prijs</th>
                      <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Status</th>
                      <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Acties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map(c => (
                      <tr key={c.id} className="border-b border-[#f5f5f5] hover:bg-[#fafafa]">
                        <td className="px-5 py-3 text-[13px] font-medium">{c.title}</td>
                        <td className="px-5 py-3 text-[12px] text-[#888] font-mono">{c.slug}</td>
                        <td className="px-5 py-3 text-[13px]">{c.price ? `€${c.price}` : '—'}</td>
                        <td className="px-5 py-3"><span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${c.is_published ? 'bg-green-50 text-green-600' : 'bg-[#f5f5f5] text-[#888]'}`}>{c.is_published ? 'Live' : 'Concept'}</span></td>
                        <td className="px-5 py-3 flex gap-2">
                          <button onClick={() => togglePublished(c.id, c.is_published)} className="text-[11px] px-3 py-1 rounded-full border border-[#ddd] hover:border-[#C4A265] text-[#888] hover:text-[#C4A265] transition">{c.is_published ? 'Unpublish' : 'Publish'}</button>
                          <button onClick={() => deleteCourse(c.id)} className="text-[11px] px-3 py-1 rounded-full border border-red-200 text-red-400 hover:bg-red-50 transition">Verwijder</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ CALENDAR ═══ */}
          {tab === 'calendar' && (
            <div className="bg-white rounded-2xl border border-[#eee] p-6">
              <h3 className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-6">Alle afspraken</h3>
              {bookings.length > 0 ? (
                <div className="space-y-3">
                  {bookings.map(b => (
                    <div key={b.id} className="flex items-center gap-4 py-3 border-b border-[#f5f5f5] last:border-0">
                      <div className="w-14 h-14 rounded-xl bg-[#0C0A07] flex flex-col items-center justify-center text-white shrink-0">
                        <span className="text-[9px] font-semibold uppercase">{new Date(b.appointment_date).toLocaleDateString('nl-NL', { weekday: 'short' })}</span>
                        <span className="text-[18px] font-bold">{new Date(b.appointment_date).getDate()}</span>
                        <span className="text-[9px]">{new Date(b.appointment_date).toLocaleDateString('nl-NL', { month: 'short' })}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-medium">{b.treatment_name}</p>
                        <p className="text-[12px] text-[#aaa]">{new Date(b.appointment_date).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <span className={`text-[11px] px-3 py-1 rounded-full font-medium ${b.status === 'confirmed' ? 'bg-green-50 text-green-600' : b.status === 'completed' ? 'bg-blue-50 text-blue-600' : b.status === 'cancelled' ? 'bg-red-50 text-red-400' : 'bg-[#f5f5f5] text-[#888]'}`}>{b.status}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-[14px] text-[#888]">Geen afspraken gevonden</p>}
            </div>
          )}

          {/* ═══ FINANCE ═══ */}
          {tab === 'finance' && (
            <div className="space-y-5">
              {/* Revenue cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-[#eee]">
                  <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-2">Totaal omzet</p>
                  <p className="text-[36px] font-['Cormorant_Garamond'] text-[#1a1a1a]">€{totalRevenue.toLocaleString('nl-NL')}</p>
                  <p className="text-[11px] text-[#aaa] mt-1">{enrollments.length} inschrijvingen</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#eee]">
                  <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-2">Deze maand</p>
                  <p className="text-[36px] font-['Cormorant_Garamond'] text-[#C4A265]">€{monthlyRevenue.toLocaleString('nl-NL')}</p>
                  <p className="text-[11px] text-[#aaa] mt-1">{thisMonth.length} betalingen</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#eee]">
                  <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-2">Gemiddeld per inschrijving</p>
                  <p className="text-[36px] font-['Cormorant_Garamond'] text-[#1a1a1a]">€{enrollments.length > 0 ? Math.round(totalRevenue / enrollments.length).toLocaleString('nl-NL') : '0'}</p>
                </div>
              </div>

              {/* Payment breakdown */}
              <div className="bg-white rounded-2xl border border-[#eee] p-6">
                <h3 className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-4">Betalingsoverzicht</h3>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#eee]">
                      <th className="pb-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Methode</th>
                      <th className="pb-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Aantal</th>
                      <th className="pb-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Totaal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['stripe', 'manual'].map(method => {
                      const items = enrollments.filter(e => e.payment_method === method)
                      const total = items.reduce((s, e) => s + (e.payment_amount || 0), 0)
                      return (
                        <tr key={method} className="border-b border-[#f5f5f5]">
                          <td className="py-3 text-[13px] font-medium capitalize">{method === 'stripe' ? 'Stripe' : 'Handmatig'}</td>
                          <td className="py-3 text-[13px]">{items.length}</td>
                          <td className="py-3 text-[13px] font-medium">€{total.toLocaleString('nl-NL')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* All transactions */}
              <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#eee]">
                  <h3 className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[#888]">Alle transacties</h3>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#eee]">
                      <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Datum</th>
                      <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Cursist</th>
                      <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Cursus</th>
                      <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Bedrag</th>
                      <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Methode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.filter(e => e.payment_amount).map(e => (
                      <tr key={e.id} className="border-b border-[#f5f5f5]">
                        <td className="px-5 py-3 text-[12px] text-[#888]">{fmt(e.paid_at || e.enrolled_at)}</td>
                        <td className="px-5 py-3 text-[13px]">{e.profiles?.[0]?.full_name || e.profiles?.[0]?.email || '—'}</td>
                        <td className="px-5 py-3 text-[13px]">{e.courses?.[0]?.title || '—'}</td>
                        <td className="px-5 py-3 text-[13px] font-medium">€{e.payment_amount}</td>
                        <td className="px-5 py-3"><span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${e.payment_method === 'stripe' ? 'bg-purple-50 text-purple-600' : 'bg-[#C4A265]/10 text-[#C4A265]'}`}>{e.payment_method === 'stripe' ? 'Stripe' : 'Handmatig'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grant modal */}
      {showGrant && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowGrant(false)}>
          <div className="bg-white rounded-2xl p-8 w-[400px] shadow-2xl border border-[#eee]" onClick={e => e.stopPropagation()}>
            <h3 className="font-['Cormorant_Garamond'] text-[24px] mb-6">Cursus toewijzen</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Cursist</label>
                <select value={grantUserId} onChange={e => setGrantUserId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265]">
                  <option value="">Selecteer...</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Cursus</label>
                <select value={grantCourseId} onChange={e => setGrantCourseId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265]">
                  <option value="">Selecteer...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowGrant(false)} className="flex-1 py-3 rounded-full border border-[#eee] text-[13px] text-[#888]">Annuleren</button>
                <button onClick={grantAccess} disabled={granting || !grantUserId || !grantCourseId} className="flex-1 py-3 rounded-full bg-[#0C0A07] text-white font-semibold text-[13px] hover:bg-[#333] transition disabled:opacity-50">
                  {granting ? 'Toewijzen...' : 'Toewijzen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
