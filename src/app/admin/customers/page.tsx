'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

type Profile = {
  id: string; email: string; full_name: string; first_name: string | null; last_name: string | null;
  role: string; phone: string | null; address: string | null; city: string | null; postal_code: string | null;
  instagram: string | null; tiktok: string | null; company_name: string | null; vat_number: string | null;
  kvk_number: string | null; created_at: string
}

type Enrollment = {
  id: string; course_id: string; status: string; payment_method: string | null;
  payment_amount: number | null; paid_at: string | null; enrolled_at: string;
  granted_by: string | null; courses: { title: string }[]
}

type Booking = {
  id: string; treatment_name: string; appointment_date: string; status: string; notes: string | null
}

export default function AdminCustomersPage() {
  const { user, role, loading } = useAuth()
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!loading && !user) router.push('/login') }, [user, loading])

  useEffect(() => {
    if (role !== 'admin') return
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => setProfiles(data || []))
  }, [role])

  useEffect(() => {
    if (!selectedId) return
    supabase.from('enrollments')
      .select('id, course_id, status, payment_method, payment_amount, paid_at, enrolled_at, granted_by, courses(title)')
      .eq('user_id', selectedId).order('enrolled_at', { ascending: false })
      .then(({ data }) => setEnrollments((data || []) as Enrollment[]))
    supabase.from('bookings')
      .select('id, treatment_name, appointment_date, status, notes')
      .eq('user_id', selectedId).order('appointment_date', { ascending: false })
      .then(({ data }) => setBookings(data || []))
  }, [selectedId])

  if (loading) {
    return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><div className="text-[#888] text-[14px]">Laden...</div></div>
  }

  if (!user) {
    return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><div className="text-[#888] text-[14px]">Doorverwijzen naar login...</div></div>
  }

  if (role !== 'admin') {
    return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center flex-col gap-4"><div className="text-[#888] text-[14px]">Je hebt geen toegang tot deze pagina.</div><a href="/dashboard" className="text-[13px] text-[#D4AF37]">← Terug naar dashboard</a></div>
  }

  const filtered = profiles.filter(p =>
    !search || p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase())
  )

  const selected = selectedId ? profiles.find(p => p.id === selectedId) : null

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-[11px] bg-[#D4AF37] text-[#1a1a1a] px-2.5 py-1 rounded-full font-bold tracking-wide">ADMIN</span>
            <h1 className="font-['Cormorant_Garamond'] text-[32px] text-[#1a1a1a] mt-2">Klanten</h1>
          </div>
          <a href="/admin" className="text-[12px] text-[#888] hover:text-[#D4AF37] transition px-3 py-1.5 rounded-full border border-[#eee]">← Admin</a>
        </div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-6">
          {/* LEFT: Customer list */}
          <div>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoek op naam of email..."
              className="w-full px-4 py-3 rounded-xl border border-[#ddd] bg-white text-[14px] focus:outline-none focus:border-[#D4AF37] mb-3"
            />
            <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-[#888]">Geen klanten gevonden</div>
              ) : filtered.map(p => (
                <button key={p.id} onClick={() => setSelectedId(p.id)}
                  className={`w-full text-left px-5 py-4 border-b border-[#f5f5f5] hover:bg-[#fafafa] transition ${selectedId === p.id ? 'bg-[#D4AF37]/5 border-l-2 border-l-[#D4AF37]' : ''}`}>
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
                    <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] text-[20px] font-semibold">
                      {(selected.first_name || selected.full_name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-[18px] font-semibold">{selected.full_name || 'Onbekend'}</h2>
                      <p className="text-[13px] text-[#888]">{selected.email}</p>
                      <p className="text-[11px] text-[#aaa] mt-0.5">Lid sinds {fmt(selected.created_at)}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${selected.role === 'admin' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-[#f5f5f5] text-[#888]'}`}>{selected.role}</span>
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
                  <h3 className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[#888]">Academy — Cursussen</h3>
                  <span className="text-[11px] bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded-full font-medium">{enrollments.length} inschrijvingen</span>
                </div>
                {enrollments.length > 0 ? (
                  <div className="space-y-2">
                    {enrollments.map(e => (
                      <div key={e.id} className="flex items-center justify-between py-3 border-b border-[#f5f5f5] last:border-0">
                        <div>
                          <p className="text-[13px] font-medium">{e.courses?.[0]?.title || 'Cursus'}</p>
                          <p className="text-[11px] text-[#aaa]">Ingeschreven {fmt(e.enrolled_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] font-medium">{e.payment_amount ? `€${e.payment_amount}` : '—'}</p>
                          <div className="flex items-center gap-2 justify-end mt-0.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              e.payment_method === 'stripe' ? 'bg-purple-50 text-purple-600' :
                              e.payment_method === 'manual' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' :
                              'bg-[#f5f5f5] text-[#888]'
                            }`}>{e.payment_method || 'geen'}</span>
                            {e.paid_at && <span className="text-[10px] text-green-500">✓ Betaald {fmt(e.paid_at)}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-[#888] py-2">Geen cursussen</p>
                )}
              </div>

              {/* Treatments */}
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
                          <p className="text-[13px] font-medium">{b.treatment_name}</p>
                          <p className="text-[11px] text-[#aaa]">{fmt(b.appointment_date)}</p>
                        </div>
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                          b.status === 'confirmed' ? 'bg-green-50 text-green-600' :
                          b.status === 'completed' ? 'bg-blue-50 text-blue-600' :
                          b.status === 'cancelled' ? 'bg-red-50 text-red-400' :
                          'bg-[#f5f5f5] text-[#888]'
                        }`}>{b.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-[#888] py-2">Geen afspraken</p>
                )}
              </div>

              {/* Quick actions */}
              <div className="flex gap-2">
                <a href={`mailto:${selected.email}`} className="px-4 py-2 rounded-full border border-[#eee] text-[12px] text-[#888] hover:border-[#D4AF37] hover:text-[#D4AF37] transition">✉️ Email</a>
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
  )
}
