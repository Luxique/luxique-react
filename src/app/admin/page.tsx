'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

type Profile = { id: string; email: string; full_name: string; role: string }
type Course = { id: string; title: string; slug: string; is_published: boolean; price: number | null }
type Enrollment = {
  id: string; user_id: string; course_id: string; status: string;
  payment_method: string | null; payment_amount: number | null; paid_at: string | null;
  enrolled_at: string; granted_by: string | null;
  courses: { title: string }[]; profiles: { email: string; full_name: string }[]
}

export default function AdminPage() {
  const { user, role, loading, signOut } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'enrollments' | 'courses'>('enrollments')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [showGrant, setShowGrant] = useState(false)
  const [grantUserId, setGrantUserId] = useState('')
  const [grantCourseId, setGrantCourseId] = useState('')
  const [granting, setGranting] = useState(false)

  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) router.push('/dashboard')
  }, [user, role, loading, router])

  const refresh = () => {
    if (role !== 'admin') return
    supabase.from('profiles').select('id, email, full_name, role').order('created_at', { ascending: false }).then(({ data }) => setProfiles(data || []))
    supabase.from('courses').select('*').order('title').then(({ data }) => setCourses(data || []))
    supabase.from('enrollments')
      .select('id, user_id, course_id, status, payment_method, payment_amount, paid_at, enrolled_at, granted_by, courses(title), profiles(email, full_name)')
      .order('enrolled_at', { ascending: false })
      .then(({ data }) => setEnrollments(data || []))
  }

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
    refresh()
    setGranting(false)
  }

  const revokeAccess = async (id: string) => {
    await supabase.from('enrollments').delete().eq('id', id)
    setEnrollments(prev => prev.filter(e => e.id !== id))
  }

  const togglePublished = async (id: string, current: boolean) => {
    await supabase.from('courses').update({ is_published: !current }).eq('id', id)
    setCourses(prev => prev.map(c => c.id === id ? { ...c, is_published: !current } : c))
  }

  if (loading || role !== 'admin') {
    return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><div className="text-[#888] text-[14px]">Laden...</div></div>
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-[11px] bg-[#D4AF37] text-[#1a1a1a] px-2.5 py-1 rounded-full font-bold tracking-wide">ADMIN</span>
            <h1 className="font-['Cormorant_Garamond'] text-[32px] text-[#1a1a1a] mt-2">Dashboard</h1>
          </div>
          <button onClick={signOut} className="text-[12px] text-[#aaa] hover:text-[#1a1a1a] transition px-3 py-1.5 rounded-full border border-[#eee]">Uitloggen</button>
        </div>

        {/* Quick links */}
        <div className="flex gap-2 mb-6">
          <a href="/admin/customers" className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#1a1a1a] text-white text-[13px] font-medium hover:bg-[#333] transition">
            👥 Klanten ({profiles.length})
          </a>
          <button onClick={() => setShowGrant(true)} className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#D4AF37] text-white text-[13px] font-medium hover:bg-[#C5A028] transition">
            + Cursus toewijzen
          </button>
        </div>

        <div className="flex gap-1 mb-6 bg-white rounded-full p-1 border border-[#eee] w-fit">
          {[
            { key: 'enrollments' as const, label: `Inschrijvingen (${enrollments.length})` },
            { key: 'courses' as const, label: `Cursussen (${courses.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-5 py-2 rounded-full text-[13px] font-medium transition ${activeTab === t.key ? 'bg-[#1a1a1a] text-white' : 'text-[#888] hover:text-[#1a1a1a]'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ENROLLMENTS */}
        {activeTab === 'enrollments' && (
          <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden">
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
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                        e.payment_method === 'stripe' ? 'bg-purple-50 text-purple-600' :
                        e.payment_method === 'manual' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-[#f5f5f5] text-[#888]'
                      }`}>{e.payment_method || '—'}</span>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-[#888]">{e.paid_at ? new Date(e.paid_at).toLocaleDateString('nl-NL') : new Date(e.enrolled_at).toLocaleDateString('nl-NL')}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => revokeAccess(e.id)} className="text-[11px] px-3 py-1 rounded-full border border-red-200 text-red-400 hover:bg-red-50 transition">Intrekken</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* COURSES */}
        {activeTab === 'courses' && (
          <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#eee]">
                  <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Cursus</th>
                  <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Prijs</th>
                  <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Status</th>
                  <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Actie</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id} className="border-b border-[#f5f5f5]">
                    <td className="px-5 py-3 text-[13px] font-medium">{c.title}</td>
                    <td className="px-5 py-3 text-[13px]">{c.price ? `€${c.price}` : '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${c.is_published ? 'bg-green-50 text-green-600' : 'bg-[#f5f5f5] text-[#888]'}`}>{c.is_published ? 'Live' : 'Concept'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => togglePublished(c.id, c.is_published)} className="text-[11px] px-3 py-1 rounded-full border border-[#ddd] hover:border-[#D4AF37] text-[#888] hover:text-[#D4AF37] transition">
                        {c.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* GRANT MODAL */}
        {showGrant && (
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowGrant(false)}>
            <div className="bg-white rounded-2xl p-8 w-[400px] shadow-2xl border border-[#eee]" onClick={e => e.stopPropagation()}>
              <h3 className="font-['Cormorant_Garamond'] text-[24px] mb-6">Cursus toewijzen</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Cursist</label>
                  <select value={grantUserId} onChange={e => setGrantUserId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#D4AF37]">
                    <option value="">Selecteer...</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Cursus</label>
                  <select value={grantCourseId} onChange={e => setGrantCourseId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#D4AF37]">
                    <option value="">Selecteer...</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowGrant(false)} className="flex-1 py-3 rounded-full border border-[#eee] text-[13px] text-[#888]">Annuleren</button>
                  <button onClick={grantAccess} disabled={granting || !grantUserId || !grantCourseId} className="flex-1 py-3 rounded-full bg-[#D4AF37] text-white font-semibold text-[13px] hover:bg-[#C5A028] transition disabled:opacity-50">
                    {granting ? 'Toewijzen...' : 'Toewijzen'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
