'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

type Course = { id: string; title: string; slug: string; short_description: string }
type Booking = { id: string; treatment_name: string; appointment_date: string; status: string; notes: string }
type PendingBooking = {
  id: string
  cal_booking_uid: string
  event_type: string
  slot_start: string
  amount_cents: number
  status: string
  customer_name: string | null
  customer_email: string | null
  cancelled_within_24h?: boolean
}

function formatDateNL(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function formatTimeNL(iso: string) {
  return new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}
function isWithin24h(slotStart: string) {
  const diff = new Date(slotStart).getTime() - Date.now()
  return diff < 24 * 60 * 60 * 1000
}

export default function DashboardPage() {
  const { user, enrollments, loading } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<PendingBooking | null>(null)
  const [cancelMode, setCancelMode] = useState(false)
  const [cancelAgreed, setCancelAgreed] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'academy' | 'boekingen'>('overview')
  const [profileFirstName, setProfileFirstName] = useState<string>('')

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('first_name')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setProfileFirstName(data?.first_name || ''))
  }, [user])

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

  // Fetch pending_bookings (lash appointments) via API
  useEffect(() => {
    if (!user) return
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.access_token) return
      fetch('/api/boeking/my-bookings', {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      })
        .then(res => res.json())
        .then(data => setPendingBookings(data.bookings || []))
        .catch(() => {})
    })
  }, [user])

  const handleCancelBooking = async () => {
    if (!selectedBooking || !user) return
    if (isWithin24h(selectedBooking.slot_start) && !cancelAgreed) return
    setCancelling(true)
    try {
      const { data } = await supabase.auth.getSession()
      const res = await fetch('/api/boeking/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token}` },
        body: JSON.stringify({ bookingId: selectedBooking.id, within24h: isWithin24h(selectedBooking.slot_start) }),
      })
      const result = await res.json()
      if (result.success) {
        // Update local state
        setPendingBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, status: 'cancelled' } : b))
        setSelectedBooking(null)
        setCancelMode(false)
        setCancelAgreed(false)
      }
    } catch (err) {
      console.error('Cancel failed:', err)
    }
    setCancelling(false)
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#F3EFE7] flex items-center justify-center" style={{ paddingTop: 'var(--content-pad-top)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-[#888] text-[14px]">Laden...</div>
        </div>
      </div>
    )
  }

  const firstName = profileFirstName || user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || ''

  const tabs = [
    { key: 'overview' as const, label: 'Overzicht' },
    { key: 'academy' as const, label: 'Academy' },
    { key: 'boekingen' as const, label: 'Boekingen' },
  ]

  return (
    <div className="min-h-screen bg-[#F3EFE7]" style={{ paddingTop: 'var(--content-pad-top)' }}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Welcome */}
        <h1 className="font-['Cormorant_Garamond'] text-[clamp(28px,5vw,40px)] text-[#1a1a1a] mb-2">
          Welkom terug{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-[14px] text-[#888] mb-8">Jouw LXQ dashboard</p>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-[#FBF8F2] rounded-full p-1 border border-[#eee] w-fit">
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
            {/* Next appointment highlight */}
            {(() => {
              const upcoming = pendingBookings
                .filter(b => b.status === 'paid' && new Date(b.slot_start) > new Date())
                .sort((a, b) => new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime())
              if (upcoming.length === 0) return (
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2520] rounded-3xl p-8 text-center">
                  <div className="text-3xl mb-3">✦</div>
                  <p className="text-[#D4AF37] font-medium text-[15px] mb-4">Geen aankomende afspraak</p>
                  <a href="/behandelingen" className="inline-block px-6 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-[13px] hover:bg-[#C5A028] transition">Boek nu</a>
                </div>
              )
              const next = upcoming[0]
              return (
                <button onClick={() => { setSelectedBooking(next); setActiveTab('boekingen') }} className="block w-full text-left bg-gradient-to-br from-[#1a1a1a] to-[#2a2520] rounded-3xl p-7 hover:shadow-2xl transition group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] tracking-[0.2em] uppercase text-[#D4AF37] font-medium">Volgende afspraak</span>
                    <span className="text-[11px] text-[#666] group-hover:text-[#D4AF37] transition">Details →</span>
                  </div>
                  <h2 className="font-['Cormorant_Garamond'] text-[28px] text-white mb-2">{next.event_type}</h2>
                  <div className="flex flex-wrap gap-4 text-[13px] text-[#aaa]">
                    <span>📅 {formatDateNL(next.slot_start)}</span>
                    <span>🕐 {formatTimeNL(next.slot_start)} uur</span>
                    <span>📍 Venlosingel 166, Arnhem</span>
                  </div>
                </button>
              )
            })()}

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Cursussen', value: courses.length, icon: '🎬', href: undefined },
                { label: 'Afspraken', value: pendingBookings.filter(b => b.status === 'paid' && new Date(b.slot_start) > new Date()).length, icon: '📅', href: undefined },
                { label: 'Cursussen bekijken', value: '', icon: '→', href: '/courses' },
                { label: 'Afspraak boeken', value: '', icon: '+', href: '/behandelingen' },
              ].map((s, i) => (
                s.href ? (
                  <a key={i} href={s.href} className="bg-[#FBF8F2] rounded-2xl p-5 border border-[#eee] hover:border-[#D4AF37]/30 text-center transition">
                    <div className="text-xl mb-1">{s.icon}</div>
                    <div className="text-[11px] font-medium text-[#D4AF37]">{s.label}</div>
                  </a>
                ) : (
                  <div key={i} className="bg-[#FBF8F2] rounded-2xl p-5 border border-[#eee] text-center">
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
                                      <a key={c.id} href={`/academy/${c.slug}`} className="flex items-center gap-4 bg-[#FBF8F2] rounded-2xl p-4 border border-[#eee] hover:border-[#D4AF37]/30 transition">
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
                    <div key={b.id} className="bg-[#FBF8F2] rounded-2xl p-4 border border-[#eee] flex items-center justify-between">
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
                                    <a key={c.id} href={`/academy/${c.slug}`} className="flex items-center gap-5 bg-[#FBF8F2] rounded-2xl p-5 border border-[#eee] hover:border-[#D4AF37] transition group">
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
              <div className="bg-[#FBF8F2] rounded-2xl p-12 border border-[#eee] text-center">
                <div className="text-4xl mb-4">✦</div>
                <p className="text-[14px] text-[#888] mb-4">Je bent nog niet ingeschreven voor een cursus</p>
                <a href="/courses" className="inline-block px-8 py-3 rounded-full bg-[#D4AF37] text-white font-semibold text-[14px] hover:bg-[#C5A028] transition">Bekijk cursussen</a>
              </div>
            )}
          </div>
        )}

        {/* BOEKINGEN TAB */}
        {activeTab === 'boekingen' && (
          <div>
            <h2 className="font-['Cormorant_Garamond'] text-[24px] text-[#1a1a1a] mb-6">Mijn Boekingen</h2>
            
            {/* Booking detail modal */}
            {selectedBooking ? (
              <div className="bg-[#FBF8F2] rounded-2xl p-6 border border-[#eee] mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-['Cormorant_Garamond'] text-[22px]">{selectedBooking.event_type}</h3>
                  <button onClick={() => { setSelectedBooking(null); setCancelMode(false); setCancelAgreed(false) }} className="text-[#888] hover:text-[#1a1a1a] text-[20px]">✕</button>
                </div>
                
                <div className="space-y-2 text-[14px] mb-5">
                  <div className="flex justify-between border-b border-[#f0f0f0] pb-2"><span className="text-[#888]">Datum</span><span className="font-medium">{formatDateNL(selectedBooking.slot_start)}</span></div>
                  <div className="flex justify-between border-b border-[#f0f0f0] pb-2"><span className="text-[#888]">Tijd</span><span className="font-medium">{formatTimeNL(selectedBooking.slot_start)} uur</span></div>
                  <div className="flex justify-between border-b border-[#f0f0f0] pb-2"><span className="text-[#888]">Locatie</span><span className="font-medium text-right">Venlosingel 166, 6845 JD Arnhem</span></div>
                  <div className="flex justify-between border-b border-[#f0f0f0] pb-2"><span className="text-[#888]">Aanbetaling</span><span className="font-medium">€{(selectedBooking.amount_cents / 100).toFixed(0)}</span></div>
                  <div className="flex justify-between border-b border-[#f0f0f0] pb-2"><span className="text-[#888]">Rest in studio</span><span className="font-medium">€{(selectedBooking.amount_cents / 100).toFixed(0)}</span></div>
                  <div className="flex justify-between pb-2"><span className="text-[#888]">Status</span>
                    <span className={`font-medium capitalize ${selectedBooking.status === 'paid' ? 'text-green-600' : selectedBooking.status === 'cancelled' || selectedBooking.status === 'expired' ? 'text-red-500' : 'text-[#D4AF37]'}`}>{selectedBooking.status}</span>
                  </div>
                </div>

                {/* Cancelled within 24h warning */}
                {selectedBooking.status === 'cancelled' && selectedBooking.cancelled_within_24h && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-[13px] text-red-700">
                    Geannuleerd binnen 24 uur — aanbetaling van €{(selectedBooking.amount_cents / 100).toFixed(0)} niet gerestitueerd, conform de <a href="/voorwaarden" className="underline">algemene voorwaarden</a>.
                  </div>
                )}
                {selectedBooking.status === 'cancelled' && !selectedBooking.cancelled_within_24h && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-[13px] text-amber-700">
                    Geannuleerd — restitutie van €{(selectedBooking.amount_cents / 100).toFixed(0)} wordt door LUXIQUE verwerkt.
                  </div>
                )}

                {/* Cancel button */}
                {selectedBooking.status === 'paid' && new Date(selectedBooking.slot_start) > new Date() && (
                  <>
                    {!cancelMode ? (
                      <button onClick={() => setCancelMode(true)} className="w-full py-3 rounded-xl border border-red-200 text-red-600 font-medium text-[14px] hover:bg-red-50 transition">Annuleren</button>
                    ) : (
                      <div className="space-y-4">
                        {isWithin24h(selectedBooking.slot_start) ? (
                          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <p className="text-[13px] text-red-700 font-medium mb-3">⚠️ Je annuleert binnen 24 uur voor je afspraak. Volgens onze <a href="/voorwaarden" className="underline">algemene voorwaarden</a> is je aanbetaling van €{(selectedBooking.amount_cents / 100).toFixed(0)} in dat geval niet restitueerbaar. Je ging hiermee akkoord bij het plaatsen van je aanbetaling.</p>
                            <label className="flex items-start gap-2 cursor-pointer">
                              <input type="checkbox" checked={cancelAgreed} onChange={(e) => setCancelAgreed(e.target.checked)} className="mt-1" />
                              <span className="text-[13px] text-[#1a1a1a]">Ik begrijp dat mijn aanbetaling niet wordt gerestitueerd.</span>
                            </label>
                          </div>
                        ) : (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <p className="text-[13px] text-green-700">Je annuleert meer dan 24 uur voor je afspraak. Je aanbetaling van €{(selectedBooking.amount_cents / 100).toFixed(0)} wordt gerestitueerd.</p>
                          </div>
                        )}
                        <div className="flex gap-3">
                          <button onClick={() => { setCancelMode(false); setCancelAgreed(false) }} className="flex-1 py-3 rounded-xl border border-[#eee] text-[#888] font-medium text-[14px] hover:bg-[#f5f5f5] transition">Terug</button>
                          <button 
                            onClick={handleCancelBooking} 
                            disabled={isWithin24h(selectedBooking.slot_start) ? !cancelAgreed || cancelling : cancelling}
                            className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium text-[14px] hover:bg-red-600 transition disabled:opacity-40 disabled:cursor-not-allowed">
                            {cancelling ? 'Annuleren...' : 'Bevestig annulering'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                {pendingBookings.length > 0 ? (
                  <div className="space-y-3">
                    {pendingBookings.map((b) => {
                      const isPast = new Date(b.slot_start) < new Date()
                      const isCancelled = b.status === 'cancelled' || b.status === 'expired'
                      return (
                        <button 
                          key={b.id} 
                          onClick={() => setSelectedBooking(b)}
                          className={`w-full text-left bg-[#FBF8F2] rounded-2xl p-5 border border-[#eee] hover:border-[#D4AF37] transition flex items-center justify-between ${isCancelled ? 'opacity-60' : ''}`}>
                          <div className={isCancelled ? 'line-through' : ''}>
                            <span className={`font-medium text-[15px] ${isCancelled ? 'text-red-500' : ''}`}>{b.event_type}</span>
                            <p className="text-[12px] text-[#888] mt-1">{formatDateNL(b.slot_start)} om {formatTimeNL(b.slot_start)} uur</p>
                          </div>
                          <span className={`text-[11px] px-3 py-1 rounded-full font-medium ${
                            isCancelled ? 'bg-red-50 text-red-500' :
                            isPast ? 'bg-[#f5f5f5] text-[#888]' :
                            b.status === 'paid' ? 'bg-green-50 text-green-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                            {isCancelled ? (b.status === 'expired' ? 'Verlopen' : 'Geannuleerd') :
                             isPast ? 'Afgelopen' :
                             b.status === 'paid' ? 'Bevestigd' : 'In afwachting'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="bg-[#FBF8F2] rounded-2xl p-12 border border-[#eee] text-center">
                    <div className="text-4xl mb-4">📅</div>
                    <p className="text-[14px] text-[#888] mb-4">Nog geen boekingen gevonden</p>
                    <a href="/behandelingen" className="inline-block px-8 py-3 rounded-full bg-[#D4AF37] text-white font-semibold text-[14px] hover:bg-[#C5A028] transition">Boek een afspraak</a>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
