'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

type Profile = { id: string; email: string; full_name: string; role: string; phone: string | null; created_at: string }
type Booking = { id: string; treatment_name: string; appointment_date: string; status: string; profiles: { email: string; full_name: string } | null }
type Course = { id: string; title: string; slug: string; is_published: boolean }

export default function AdminPage() {
  const { user, role, loading, signOut } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'users' | 'bookings' | 'courses'>('users')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) router.push('/dashboard')
  }, [user, role, loading, router])

  useEffect(() => {
    if (role !== 'admin') return
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => setProfiles(data || []))
    supabase.from('courses').select('*').order('title').then(({ data }) => setCourses(data || []))
    // Bookings need join — try directly first
    supabase.from('bookings').select('id, treatment_name, appointment_date, status').order('appointment_date', { ascending: false }).then(({ data }) => {
      if (data) setBookings(data.map(b => ({ ...b, profiles: null })))
    })
  }, [role])

  const toggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin'
    await supabase.from('profiles').update({ role: newRole }).eq('id', id)
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, role: newRole } : p))
  }

  const togglePublished = async (id: string, current: boolean) => {
    await supabase.from('courses').update({ is_published: !current }).eq('id', id)
    setCourses(prev => prev.map(c => c.id === id ? { ...c, is_published: !current } : c))
  }

  if (loading || role !== 'admin') {
    return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><div className="text-[#888] text-[14px]">Laden...</div></div>
  }

  const tabs = [
    { key: 'users' as const, label: `Gebruikers (${profiles.length})` },
    { key: 'bookings' as const, label: `Afspraken (${bookings.length})` },
    { key: 'courses' as const, label: `Cursussen (${courses.length})` },
  ]

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-[#1a1a1a] text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="font-['Cormorant_Garamond'] text-[20px] tracking-[0.2em]">LUXIQUE</a>
            <span className="text-[11px] bg-[#D4AF37] text-[#1a1a1a] px-2.5 py-1 rounded-full font-bold tracking-wide">ADMIN</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-[12px] text-white/60 hover:text-white transition">Dashboard</a>
            <button onClick={signOut} className="text-[12px] text-white/40 hover:text-white transition">Uitloggen</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="font-['Cormorant_Garamond'] text-[32px] text-[#1a1a1a] mb-6">Admin Dashboard</h1>

        <div className="flex gap-1 mb-6 bg-white rounded-full p-1 border border-[#eee] w-fit">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-5 py-2 rounded-full text-[13px] font-medium transition ${activeTab === t.key ? 'bg-[#1a1a1a] text-white' : 'text-[#888] hover:text-[#1a1a1a]'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* USERS */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#eee]">
                  <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Naam</th>
                  <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Email</th>
                  <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Rol</th>
                  <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Aangemeld</th>
                  <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Actie</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(p => (
                  <tr key={p.id} className="border-b border-[#f5f5f5] hover:bg-[#fafafa]">
                    <td className="px-5 py-3 text-[13px]">{p.full_name || '—'}</td>
                    <td className="px-5 py-3 text-[13px] text-[#888]">{p.email}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${p.role === 'admin' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-[#f5f5f5] text-[#888]'}`}>
                        {p.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-[#888]">{new Date(p.created_at).toLocaleDateString('nl-NL')}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => toggleRole(p.id, p.role)}
                        className="text-[11px] px-3 py-1 rounded-full border border-[#ddd] hover:border-[#D4AF37] text-[#888] hover:text-[#D4AF37] transition">
                        {p.role === 'admin' ? 'Demote' : 'Make admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden">
            {bookings.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#eee]">
                    <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Behandeling</th>
                    <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Datum</th>
                    <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} className="border-b border-[#f5f5f5]">
                      <td className="px-5 py-3 text-[13px]">{b.treatment_name}</td>
                      <td className="px-5 py-3 text-[12px] text-[#888]">{new Date(b.appointment_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                          b.status === 'confirmed' ? 'bg-green-50 text-green-600' :
                          b.status === 'cancelled' ? 'bg-red-50 text-red-500' :
                          b.status === 'completed' ? 'bg-blue-50 text-blue-600' :
                          'bg-[#f5f5f5] text-[#888]'
                        }`}>{b.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-[14px] text-[#888]">Nog geen afspraken</div>
            )}
          </div>
        )}

        {/* COURSES */}
        {activeTab === 'courses' && (
          <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden">
            {courses.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#eee]">
                    <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Cursus</th>
                    <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Slug</th>
                    <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Status</th>
                    <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">Actie</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(c => (
                    <tr key={c.id} className="border-b border-[#f5f5f5]">
                      <td className="px-5 py-3 text-[13px] font-medium">{c.title}</td>
                      <td className="px-5 py-3 text-[12px] text-[#888]">{c.slug}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${c.is_published ? 'bg-green-50 text-green-600' : 'bg-[#f5f5f5] text-[#888]'}`}>
                          {c.is_published ? 'Live' : 'Concept'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <button onClick={() => togglePublished(c.id, c.is_published)}
                          className="text-[11px] px-3 py-1 rounded-full border border-[#ddd] hover:border-[#D4AF37] text-[#888] hover:text-[#D4AF37] transition">
                          {c.is_published ? 'Unpublish' : 'Publish'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-[14px] text-[#888]">Nog geen cursussen — voeg ze toe via Supabase</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
