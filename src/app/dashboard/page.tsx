'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase-client'

type Course = { id: string; title: string; slug: string; short_description: string; thumbnail_url?: string }
type Booking = { id: string; treatment_name: string; appointment_date: string; status: string; notes: string }
type PendingBooking = {
  id: string; cal_booking_uid: string; event_type: string; slot_start: string;
  amount_cents: number; status: string; customer_name: string | null; customer_email: string | null;
  cancelled_within_24h?: boolean
}

// Available time slots for rescheduling (LUXIQUE schedule — will be updated)
const RESCHEDULE_SLOTS = ['09:00', '12:00']
type LessonRow = { id: string; title: string; slug: string; sort_order: number; lesson_type: string; course_id: string }
type ProgressRow = { lesson_id: string; completed: boolean }
type CourseProgress = {
  course: Course
  totalLessons: number
  completedLessons: number
  pct: number
  nextLesson: LessonRow | null
  nextLessonNumber: number
  isDone: boolean
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
  const { user, enrollments, loading, session } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<PendingBooking | null>(null)
  const [cancelMode, setCancelMode] = useState(false)
  const [cancelAgreed, setCancelAgreed] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [rescheduleMode, setRescheduleMode] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [rescheduling, setRescheduling] = useState(false)
  const [rescheduleError, setRescheduleError] = useState('')
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'academy' | 'boekingen'>('overview')
  const [profileFirstName, setProfileFirstName] = useState<string>('')
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([])
  const [totalCompletedLessons, setTotalCompletedLessons] = useState(0)
  const [progressLoading, setProgressLoading] = useState(true)
  const revealRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('first_name').eq('id', user.id).single()
      .then(({ data }) => setProfileFirstName(data?.first_name || ''))
  }, [user])

  useEffect(() => {
    if (!loading && !user) router.push('/login?redirect=/dashboard')
  }, [user, loading, router])

  // Fetch enrolled courses
  useEffect(() => {
    if (enrollments.length === 0) { setCourses([]); setProgressLoading(false); return }
    supabase.from('courses').select('id, title, slug, short_description, thumbnail_url')
      .in('id', enrollments.map(e => e.course_id))
      .then(({ data }) => setCourses(data || []))
  }, [enrollments])

  // Fetch ALL lessons + progress for enrolled courses
  useEffect(() => {
    if (enrollments.length === 0 || courses.length === 0) { setProgressLoading(false); return }
    let cancelled = false
    const run = async () => {
      setProgressLoading(true)
      const courseIds = courses.map(c => c.id)

      // Fetch all lessons for these courses
      const { data: allLessons } = await supabase.from('lessons')
        .select('id, title, slug, sort_order, lesson_type, course_id')
        .in('course_id', courseIds).order('sort_order')

      if (!allLessons || cancelled) return

      // Fetch progress for all these lessons
      const { data: allProgress } = await supabase.from('lesson_progress')
        .select('lesson_id, completed')
        .eq('user_id', user!.id)
        .in('lesson_id', allLessons.map(l => l.id))

      const progressMap = new Map<string, boolean>()
      ;(allProgress || []).forEach((p: ProgressRow) => progressMap.set(p.lesson_id, p.completed))

      // Compute per-course progress
      const cp: CourseProgress[] = courses.map(course => {
        const cLessons = allLessons.filter(l => l.course_id === course.id && (l.lesson_type || 'content') !== 'exam')
        const completedCount = cLessons.filter(l => progressMap.get(l.id)).length
        const pct = cLessons.length > 0 ? Math.round((completedCount / cLessons.length) * 100) : 0
        // Find next uncompleted lesson (first incomplete, by sort order)
        const next = cLessons.find(l => !progressMap.get(l.id)) || null
        const nextNum = next ? cLessons.indexOf(next) + 1 : cLessons.length
        return {
          course, totalLessons: cLessons.length, completedLessons: completedCount,
          pct, nextLesson: next, nextLessonNumber: nextNum, isDone: pct === 100
        }
      })

      if (!cancelled) {
        setCourseProgress(cp)
        setTotalCompletedLessons(allLessons.filter(l => (l.lesson_type || 'content') !== 'exam' && progressMap.get(l.id)).length)
        setProgressLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [courses, user])

  // Fetch bookings
  useEffect(() => {
    if (!user) return
    supabase.from('bookings').select('id, treatment_name, appointment_date, status, notes')
      .eq('user_id', user.id).order('appointment_date', { ascending: false })
      .then(({ data }) => setBookings(data || []))
  }, [user])

  // Fetch pending_bookings (Cal.com)
  useEffect(() => {
    if (!user) return
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.access_token) return
      fetch('/api/boeking/my-bookings', { headers: { Authorization: `Bearer ${data.session.access_token}` } })
        .then(res => res.json()).then(data => setPendingBookings(data.bookings || [])).catch(() => {})
    })
  }, [user])

  // Reveal on scroll
  useEffect(() => {
    if (typeof window === 'undefined') return
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target) } })
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
    revealRef.current = obs
    setTimeout(() => { document.querySelectorAll('.dash-reveal').forEach(el => obs.observe(el)) }, 100)
    return () => obs.disconnect()
  })

  const handleCancelBooking = async () => {
    if (!selectedBooking || !user) return
    if (isWithin24h(selectedBooking.slot_start) && !cancelAgreed) return
    setCancelling(true)
    try {
      const { data } = await supabase.auth.getSession()
      const res = await fetch('/api/boeking/cancel', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token}` },
        body: JSON.stringify({ bookingId: selectedBooking.id, within24h: isWithin24h(selectedBooking.slot_start) }),
      })
      const result = await res.json()
      if (result.success) {
        setPendingBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, status: 'cancelled' } : b))
        setSelectedBooking(null); setCancelMode(false); setCancelAgreed(false)
      }
    } catch (err) { console.error('Cancel failed:', err) }
    setCancelling(false)
  }

  const handleRescheduleBooking = async () => {
    if (!selectedBooking || !rescheduleDate || !rescheduleTime || !user) return
    setRescheduling(true)
    setRescheduleError('')
    try {
      // Build ISO timestamp from date + time, Amsterdam timezone
      const dateStr = `${rescheduleDate}T${rescheduleTime}:00`
      const dt = new Date(dateStr)
      // Adjust for Amsterdam timezone offset (the server expects UTC)
      const isoStart = dt.toISOString()

      // Use session from useAuth (not getSession)
      const res = await fetch('/api/boeking/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ bookingId: selectedBooking.id, newStart: isoStart }),
      })
      const result = await res.json()
      if (result.success) {
        // Update local state with new slot_start
        setPendingBookings(prev => prev.map(b =>
          b.id === selectedBooking.id
            ? { ...b, slot_start: isoStart }
            : b
        ))
        setSelectedBooking(null)
        setRescheduleMode(false)
        setRescheduleDate('')
        setRescheduleTime('')
      } else {
        setRescheduleError(result.error || 'Er ging iets mis. Probeer het opnieuw.')
      }
    } catch (err) {
      console.error('Reschedule failed:', err)
      setRescheduleError('Er ging iets mis. Probeer het opnieuw.')
    }
    setRescheduling(false)
  }

  // Min date for reschedule = tomorrow (can't book today or past)
  const minRescheduleDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  // Max date = 60 days from now
  const maxRescheduleDate = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#F3EFE7] flex items-center justify-center" style={{ paddingTop: 'var(--content-pad-top)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#B08D4F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-[#888] text-[14px]">Laden...</div>
        </div>
      </div>
    )
  }

  const firstName = profileFirstName || user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || ''

  // Fetch booked slots for reschedule availability check
  useEffect(() => {
    if (!rescheduleDate) {
      setBookedSlots([])
      return
    }

    const fetchBookedSlots = async () => {
      const dateStart = `${rescheduleDate}T00:00:00.000Z`
      const dateEnd = `${rescheduleDate}T23:59:59.999Z`

      const { data } = await supabase
        .from('pending_bookings')
        .select('slot_start')
        .in('status', ['paid', 'pending'])
        .gte('slot_start', dateStart)
        .lt('slot_start', dateEnd)

      const slots = data?.map(b => {
        const h = new Date(b.slot_start).getHours()
        return `${h.toString().padStart(2, '0')}:00`
      }) || []

      setBookedSlots(slots)
    }

    fetchBookedSlots()
  }, [rescheduleDate])

  // Best course to resume (highest pct but not 100%, or first with next lesson)
  const resumeCourse = courseProgress.length > 0
    ? courseProgress.filter(c => !c.isDone && c.nextLesson).sort((a, b) => b.pct - a.pct)[0] || courseProgress[0]
    : null

  // Active courses count
  const activeCourses = courseProgress.filter(c => !c.isDone).length

  // Next upcoming booking
  const upcomingBookings = pendingBookings
    .filter(b => b.status === 'paid' && new Date(b.slot_start) > new Date())
    .sort((a, b) => new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime())
  const nextBookingDate = upcomingBookings.length > 0
    ? new Date(upcomingBookings[0].slot_start).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    : '—'

  // All pending bookings sorted (upcoming first, then past)
  const sortedBookings = [...pendingBookings].sort((a, b) => {
    const aPast = new Date(a.slot_start) < new Date()
    const bPast = new Date(b.slot_start) < new Date()
    if (aPast !== bPast) return aPast ? 1 : -1
    return new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime()
  })

  // Ring math
  const ringRadius = 56
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = resumeCourse ? ringCircumference - (resumeCourse.pct / 100) * ringCircumference : ringCircumference

  const tabs = [
    { key: 'overview' as const, label: 'Overzicht' },
    { key: 'academy' as const, label: 'Academy' },
    { key: 'boekingen' as const, label: 'Boekingen' },
  ]

  return (
    <>
    <style>{`
      .dash-reveal { opacity:0; transform:translateY(20px); transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1) }
      .dash-reveal.in { opacity:1; transform:none }
      @media(prefers-reduced-motion:reduce){ .dash-reveal{opacity:1;transform:none;transition:none} }
    `}</style>
    <div className="min-h-screen" style={{ background: '#F3EFE7', paddingTop: 'var(--content-pad-top)' }}>
      <div className="max-w-[1180px] mx-auto px-6 py-10">

        {/* HEADER */}
        <div className="dash-reveal mb-2">
          <p style={{ fontSize:'.74rem',textTransform:'uppercase',letterSpacing:'.22em',color:'#B08D4F',fontWeight:500,marginBottom:12 }}>Mijn omgeving</p>
          <h1 className="font-['Cormorant_Garamond']" style={{ fontWeight:500, fontSize:'clamp(2.2rem,5vw,3.4rem)', lineHeight:1.05, color:'#1C1814' }}>
            Welkom terug{firstName ? <>, <em style={{ fontStyle:'italic', color:'#B08D4F' }}>{firstName}</em></> : ''}
          </h1>
          <p style={{ color:'#46403A', marginTop:8, fontSize:'1rem' }}>Alles op één plek — je cursussen, je voortgang en je afspraken.</p>
        </div>

        {/* TABS */}
        <div className="dash-reveal flex gap-1 mt-8 mb-8 bg-[#FBF8F2] rounded-full p-1 border border-[rgba(28,24,20,.07)] w-fit">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-5 py-2 rounded-full text-[13px] font-medium transition ${activeTab === t.key ? 'bg-[#B08D4F] text-white' : 'text:#46403A; text-[#888] hover:text-[#1C1814]'}`}
              style={activeTab === t.key ? {} : { color: '#888' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ==================== OVERVIEW TAB ==================== */}
        {activeTab === 'overview' && (
          <div className="space-y-10">

            {/* B) RESUME CARD — LIGHT */}
            {progressLoading ? (
              <div className="dash-reveal" style={{ background:'#FBF8F2', borderRadius:20, padding:'36px 32px', border:'1px solid rgba(28,24,20,.13)' }}>
                <div className="animate-pulse" style={{ height:120, background:'rgba(28,24,20,.04)', borderRadius:12 }} />
              </div>
            ) : resumeCourse ? (
              <div className="dash-reveal" style={{
                background:'#FBF8F2', borderRadius:20, padding:'36px 40px', border:'1px solid rgba(176,141,79,.3)',
                boxShadow:'0 24px 60px -32px rgba(28,24,20,.18)', display:'grid', gridTemplateColumns:'1fr auto', gap:40, alignItems:'center',
              }}>
                <div>
                  <p style={{ fontSize:'.74rem', textTransform:'uppercase', letterSpacing:'.22em', color:'#B08D4F', fontWeight:500, marginBottom:10 }}>Verder waar je gebleven was</p>
                  <h2 className="font-['Cormorant_Garamond']" style={{ fontWeight:500, fontSize:'clamp(1.6rem,3vw,2.1rem)', lineHeight:1.1, color:'#1C1814', marginBottom:4 }}>
                    {resumeCourse.course.title}
                  </h2>
                  {resumeCourse.nextLesson ? (
                    <p style={{ color:'#46403A', fontSize:'.95rem' }}>
                      Les {resumeCourse.nextLessonNumber} van {resumeCourse.totalLessons} — {resumeCourse.nextLesson.title}
                    </p>
                  ) : (
                    <p style={{ color:'#46403A', fontSize:'.95rem' }}>Alle lessen voltooid 🎉</p>
                  )}
                  {resumeCourse.nextLesson && (
                    <a href={`/academy/${resumeCourse.course.slug}/${resumeCourse.nextLesson.id}`} style={{
                      display:'inline-flex', alignItems:'center', gap:10, marginTop:20,
                      background:'#B08D4F', color:'#1C1814', textDecoration:'none',
                      fontWeight:500, fontSize:'.95rem', padding:'13px 26px', borderRadius:100,
                      transition:'transform .25s, box-shadow .25s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 14px 30px -12px rgba(176,141,79,.4)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}>
                      Verder met les {resumeCourse.nextLessonNumber} →
                    </a>
                  )}
                </div>
                {/* Progress ring — light version */}
                <div style={{ position:'relative', width:128, height:128, flexShrink:0 }}>
                  <svg width="128" height="128" viewBox="0 0 128 128" style={{ transform:'rotate(-90deg)' }}>
                    <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(28,24,20,.09)" strokeWidth="9" />
                    <circle cx="64" cy="64" r="56" fill="none" stroke="#B08D4F" strokeWidth="9" strokeLinecap="round"
                      strokeDasharray={ringCircumference} strokeDashoffset={ringOffset}
                      style={{ transition:'stroke-dashoffset 1s ease-out' }} />
                  </svg>
                  <div style={{ position:'absolute', inset:0, display:'grid', placeItems:'center', textAlign:'center' }}>
                    <div>
                      <b className="font-['Cormorant_Garamond']" style={{ fontSize:'2.2rem', fontWeight:600, lineHeight:1, color:'#1C1814' }}>{resumeCourse.pct}%</b>
                      <span style={{ display:'block', fontSize:'.66rem', letterSpacing:'.16em', textTransform:'uppercase', color:'#888', marginTop:3 }}>voltooid</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="dash-reveal" style={{
                background:'#FBF8F2', borderRadius:20, padding:'40px 32px', border:'1px solid rgba(28,24,20,.13)', textAlign:'center',
              }}>
                <div style={{ fontSize:32, marginBottom:12 }}>✦</div>
                <p style={{ fontSize:'1.05rem', color:'#1C1814', fontWeight:500, marginBottom:4 }}>Nog geen cursus</p>
                <p style={{ fontSize:'.9rem', color:'#888', marginBottom:20 }}>Ontdek de Academy en start vandaag nog.</p>
                <a href="/courses" style={{ display:'inline-block', background:'#B08D4F', color:'#1C1814', textDecoration:'none', fontWeight:500, fontSize:'.9rem', padding:'12px 28px', borderRadius:100 }}>
                  Ontdek de Academy →
                </a>
              </div>
            )}

            {/* C) AT-A-GLANCE STATS */}
            <div className="dash-reveal" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18 }}>
              {[
                { n: String(activeCourses), l: <>Actieve <b style={{color:'#1C1814',fontWeight:500}}>cursussen</b></> },
                { n: String(totalCompletedLessons), l: <>Voltooide <b style={{color:'#1C1814',fontWeight:500}}>lessen</b></> },
                { n: nextBookingDate, l: <>Volgende <b style={{color:'#1C1814',fontWeight:500}}>afspraak</b></> },
              ].map((s, i) => (
                <div key={i} style={{
                  background:'#FBF8F2', border:'1px solid rgba(28,24,20,.13)', borderRadius:16, padding:'22px 24px',
                }}>
                  <div className="font-['Cormorant_Garamond']" style={{ fontSize:'clamp(1.6rem,3vw,2.2rem)', fontWeight:600, lineHeight:1, color:'#B08D4F' }}>{s.n}</div>
                  <div style={{ fontSize:'.82rem', color:'#46403A', marginTop:7 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* D) MIJN CURSUSSEN */}
            {courseProgress.length > 0 && (
              <div>
                <div className="dash-reveal" style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:24, gap:18, flexWrap:'wrap' }}>
                  <h3 className="font-['Cormorant_Garamond']" style={{ fontWeight:500, fontSize:'clamp(1.6rem,3vw,2rem)', color:'#1C1814' }}>Mijn cursussen</h3>
                  <a href="/courses" style={{ textDecoration:'none', color:'#46403A', fontSize:'.88rem', borderBottom:'1px solid rgba(28,24,20,.13)', paddingBottom:2 }}>Alle cursussen bekijken</a>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:22 }}>
                  {courseProgress.map(cp => (
                    <div key={cp.course.id} className="dash-reveal" style={{
                      background:'#FBF8F2', border:'1px solid rgba(28,24,20,.13)', borderRadius:20, overflow:'hidden', display:'flex', flexDirection:'column',
                      transition:'transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s',
                    }}>
                      {/* Thumb */}
                      <div style={{
                        height:130, position:'relative',
                        background: cp.isDone ? 'linear-gradient(150deg,#43381f,#1d160a)' : 'linear-gradient(150deg,#3a322a,#181310)',
                        display:'flex', alignItems:'flex-end', padding:'16px 20px',
                      }}>
                        {cp.course.thumbnail_url && (
                          <img src={cp.course.thumbnail_url} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:.5 }} />
                        )}
                        <span style={{
                          position:'relative', zIndex:1, fontSize:'.7rem', letterSpacing:'.16em', textTransform:'uppercase',
                          color:'#F6F1E7', background:'rgba(28,24,20,.4)', border:'1px solid rgba(246,241,231,.25)',
                          padding:'5px 12px', borderRadius:100, backdropFilter:'blur(4px)',
                        }}>
                          {cp.isDone ? 'Afgerond' : 'Bezig'}
                        </span>
                      </div>
                      {/* Body */}
                      <div style={{ padding:'22px 24px 26px', display:'flex', flexDirection:'column', flex:1 }}>
                        <h4 className="font-['Cormorant_Garamond']" style={{ fontWeight:600, fontSize:'1.4rem', lineHeight:1.1, color:'#1C1814' }}>{cp.course.title}</h4>
                        <p style={{ fontSize:'.84rem', color:'#888', marginTop:5 }}>{cp.totalLessons} lessen</p>
                        {/* Progress bar */}
                        <div style={{ height:7, borderRadius:100, background:'rgba(28,24,20,.09)', marginTop:20, overflow:'hidden' }}>
                          <div style={{ height:'100%', borderRadius:100, background:'linear-gradient(90deg,#C9A86A,#D8B97A)', width:`${cp.pct}%`, transition:'width 1s ease-out' }} />
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.78rem', color:'#888', marginTop:9 }}>
                          <span>{cp.isDone ? <b style={{color:'#1C1814',fontWeight:500}}>Alle lessen voltooid</b> : <><b style={{color:'#1C1814',fontWeight:500}}>{cp.completedLessons}</b> van {cp.totalLessons} lessen</>}</span>
                          <span>{cp.pct}%</span>
                        </div>
                        {/* CTA */}
                        <div style={{ marginTop:'auto', paddingTop:20 }}>
                          <a href={`/academy/${cp.course.slug}`} style={{
                            display:'inline-flex', alignItems:'center', gap:8, textDecoration:'none',
                            color: cp.isDone ? '#B08D4F' : '#1C1814', fontWeight:500, fontSize:'.88rem',
                            border: `1px solid ${cp.isDone ? '#B08D4F' : '#1C1814'}`, borderRadius:100, padding:'10px 22px',
                            transition:'background .25s, color .25s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = cp.isDone ? '#B08D4F' : '#1C1814'; e.currentTarget.style.color = '#FBF8F2' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = cp.isDone ? '#B08D4F' : '#1C1814' }}>
                            {cp.isDone ? 'Certificaat bekijken →' : 'Verder leren →'}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* E) MIJN AFSPRAKEN */}
            {sortedBookings.length > 0 && (
              <div>
                <div className="dash-reveal" style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:24, gap:18, flexWrap:'wrap' }}>
                  <h3 className="font-['Cormorant_Garamond']" style={{ fontWeight:500, fontSize:'clamp(1.6rem,3vw,2rem)', color:'#1C1814' }}>Mijn afspraken</h3>
                  <a href="/behandelingen" style={{ textDecoration:'none', color:'#46403A', fontSize:'.88rem', borderBottom:'1px solid rgba(28,24,20,.13)', paddingBottom:2 }}>Afspraak plannen</a>
                </div>
                <div className="dash-reveal" style={{ background:'#FBF8F2', border:'1px solid rgba(28,24,20,.13)', borderRadius:20, overflow:'hidden' }}>
                  {sortedBookings.map((b) => {
                    const isPast = new Date(b.slot_start) < new Date()
                    const isCancelled = b.status === 'cancelled' || b.status === 'expired'
                    const dt = new Date(b.slot_start)
                    return (
                      <button key={b.id} onClick={() => { setSelectedBooking(b); setActiveTab('boekingen') }}
                        style={{
                          display:'grid', gridTemplateColumns:'72px 1fr auto', gap:18, alignItems:'center', width:'100%', textAlign:'left',
                          padding:'20px 26px', borderBottom:'1px solid rgba(28,24,20,.07)', background:'transparent', border:'none',
                          borderBottomWidth: sortedBookings[sortedBookings.length-1].id === b.id ? 0 : 1,
                          cursor:'pointer', opacity: isCancelled ? .55 : 1, transition:'background .2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(28,24,20,.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        {/* Date chip */}
                        <div style={{ textAlign:'center', border:'1px solid rgba(28,24,20,.13)', borderRadius:13, padding:'8px 0', background:'#F3EFE7' }}>
                          <div className="font-['Cormorant_Garamond']" style={{ fontSize:'1.6rem', fontWeight:600, lineHeight:1, color:'#1C1814' }}>{dt.getDate()}</div>
                          <div style={{ fontSize:'.64rem', textTransform:'uppercase', letterSpacing:'.14em', color:'#888', marginTop:3 }}>{dt.toLocaleDateString('nl-NL',{month:'short'})}</div>
                        </div>
                        {/* Info */}
                        <div>
                          <h5 className="font-['Cormorant_Garamond']" style={{ fontWeight:600, fontSize:'1.25rem', lineHeight:1.1, color:'#1C1814', textDecoration: isCancelled ? 'line-through' : 'none' }}>{b.event_type}</h5>
                          <p style={{ fontSize:'.82rem', color:'#888', marginTop:3 }}>{formatTimeNL(b.slot_start)} uur · Lashed by Chiva, Arnhem</p>
                        </div>
                        {/* Pay */}
                        <div style={{ textAlign:'right' }}>
                          <div className="font-['Cormorant_Garamond']" style={{ fontSize:'1.3rem', fontWeight:600, color:'#1C1814' }}>€{(b.amount_cents/100).toFixed(0)}</div>
                          <span style={{
                            display:'inline-block', marginTop:6, fontSize:'.68rem', letterSpacing:'.05em',
                            padding:'4px 11px', borderRadius:100, fontWeight:500,
                            ...(isCancelled ? { background:'rgba(28,24,20,.07)', color:'#888', border:'1px solid rgba(28,24,20,.13)' }
                              : isPast ? { background:'rgba(28,24,20,.07)', color:'#888', border:'1px solid rgba(28,24,20,.13)' }
                              : { background:'rgba(176,141,79,.14)', color:'#B08D4F', border:'1px solid rgba(176,141,79,.3)' })
                          }}>
                            {isCancelled ? (b.status === 'expired' ? 'Verlopen' : 'Geannuleerd') : isPast ? 'Voltooid' : 'Aanbetaling voldaan'}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ==================== ACADEMY TAB ==================== */}
        {activeTab === 'academy' && (
          <div>
            <h2 className="font-['Cormorant_Garamond']" style={{ fontWeight:500, fontSize:'clamp(1.6rem,3vw,2rem)', color:'#1C1814', marginBottom:24 }}>Mijn Cursussen</h2>
            {courseProgress.length > 0 ? (
              <div className="space-y-3">
                {courseProgress.map(cp => (
                  <a key={cp.course.id} href={`/academy/${cp.course.slug}`} style={{ display:'flex', alignItems:'center', gap:20, background:'#FBF8F2', borderRadius:16, padding:20, border:'1px solid rgba(28,24,20,.13)', textDecoration:'none', transition:'border-color .2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor='#B08D4F'}
                    onMouseLeave={e => e.currentTarget.style.borderColor='rgba(28,24,20,.13)'}>
                    <div style={{ width:64, height:64, borderRadius:14, background:'#f5f5f5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, flexShrink:0 }}>🎬</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <h3 style={{ fontWeight:600, fontSize:'1.1rem', color:'#1C1814', marginBottom:4 }}>{cp.course.title}</h3>
                      <div style={{ height:6, borderRadius:100, background:'rgba(28,24,20,.09)', overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:100, background:'#B08D4F', width:`${cp.pct}%` }} />
                      </div>
                      <p style={{ fontSize:'.8rem', color:'#888', marginTop:5 }}>{cp.completedLessons} van {cp.totalLessons} lessen · {cp.pct}%</p>
                    </div>
                    <span style={{ fontSize:'.9rem', color:'#B08D4F', fontWeight:500, flexShrink:0 }}>Verder →</span>
                  </a>
                ))}
              </div>
            ) : (
              <div style={{ background:'#FBF8F2', borderRadius:20, padding:'48px 32px', border:'1px solid rgba(28,24,20,.13)', textAlign:'center' }}>
                <div style={{ fontSize:36, marginBottom:16 }}>✦</div>
                <p style={{ fontSize:'1rem', color:'#888', marginBottom:20 }}>Je bent nog niet ingeschreven voor een cursus</p>
                <a href="/courses" style={{ display:'inline-block', padding:'12px 32px', borderRadius:100, background:'#B08D4F', color:'#1C1814', fontWeight:500, fontSize:'.9rem', textDecoration:'none' }}>Bekijk cursussen</a>
              </div>
            )}
          </div>
        )}

        {/* ==================== BOEKINGEN TAB ==================== */}
        {activeTab === 'boekingen' && (
          <div>
            <h2 className="font-['Cormorant_Garamond']" style={{ fontWeight:500, fontSize:'clamp(1.6rem,3vw,2rem)', color:'#1C1814', marginBottom:24 }}>Mijn Boekingen</h2>

            {selectedBooking ? (
              <div style={{ background:'#FBF8F2', borderRadius:20, padding:24, border:'1px solid rgba(28,24,20,.13)', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                  <h3 className="font-['Cormorant_Garamond']" style={{ fontWeight:500, fontSize:'1.6rem', color:'#1C1814' }}>{selectedBooking.event_type}</h3>
                  <button onClick={() => { setSelectedBooking(null); setCancelMode(false); setCancelAgreed(false) }} style={{ color:'#888', fontSize:20, background:'none', border:'none', cursor:'pointer' }}>✕</button>
                </div>
                <div className="space-y-2 text-[14px] mb-5">
                  <div style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid rgba(28,24,20,.07)', paddingBottom:8 }}><span style={{color:'#888'}}>Datum</span><span style={{fontWeight:500,color:'#1C1814'}}>{formatDateNL(selectedBooking.slot_start)}</span></div>
                  <div style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid rgba(28,24,20,.07)', paddingBottom:8 }}><span style={{color:'#888'}}>Tijd</span><span style={{fontWeight:500,color:'#1C1814'}}>{formatTimeNL(selectedBooking.slot_start)} uur</span></div>
                  <div style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid rgba(28,24,20,.07)', paddingBottom:8 }}><span style={{color:'#888'}}>Locatie</span><span style={{fontWeight:500,color:'#1C1814'}}>Venlosingel 166, Arnhem</span></div>
                  <div style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid rgba(28,24,20,.07)', paddingBottom:8 }}><span style={{color:'#888'}}>Aanbetaling</span><span style={{fontWeight:500,color:'#1C1814'}}>€{(selectedBooking.amount_cents/100).toFixed(0)}</span></div>
                  <div style={{ display:'flex', justifyContent:'space-between', paddingBottom:8 }}><span style={{color:'#888'}}>Status</span><span style={{fontWeight:500,textTransform:'capitalize',color:selectedBooking.status==='paid'?'#B08D4F':selectedBooking.status==='cancelled'?'#e55':'#B08D4F'}}>{selectedBooking.status}</span></div>
                </div>

                {selectedBooking.status === 'cancelled' && selectedBooking.cancelled_within_24h && (
                  <div style={{ background:'rgba(229,85,85,.08)', border:'1px solid rgba(229,85,85,.2)', borderRadius:12, padding:16, marginBottom:16, fontSize:'.85rem', color:'#c44' }}>
                    Geannuleerd binnen 24 uur — aanbetaling niet gerestitueerd, conform de <a href="/voorwaarden" style={{textDecoration:'underline'}}>algemene voorwaarden</a>.
                  </div>
                )}
                {selectedBooking.status === 'cancelled' && !selectedBooking.cancelled_within_24h && (
                  <div style={{ background:'rgba(176,141,79,.08)', border:'1px solid rgba(176,141,79,.2)', borderRadius:12, padding:16, marginBottom:16, fontSize:'.85rem', color:'#B08D4F' }}>
                    Geannuleerd — restitutie wordt door LUXIQUE verwerkt.
                  </div>
                )}

                {selectedBooking.status === 'paid' && new Date(selectedBooking.slot_start) > new Date() && (
                  <>
                    {!cancelMode && !rescheduleMode ? (
                      <>
                        {isWithin24h(selectedBooking.slot_start) && (
                          <p style={{ fontSize:'.8rem', color:'#888', textAlign:'center', marginBottom:10 }}>
                            Verplaatsen kan tot 24 uur voor je afspraak.
                          </p>
                        )}
                        <div style={{ display:'flex', gap:12 }}>
                          {/* Show reschedule only if >24h before appointment */}
                          {!isWithin24h(selectedBooking.slot_start) && (
                            <button onClick={() => setRescheduleMode(true)} style={{ flex:1, padding:'12px', borderRadius:12, border:'1px solid rgba(176,141,79,.3)', color:'#B08D4F', fontWeight:500, fontSize:'.9rem', background:'transparent', cursor:'pointer' }}>Verplaatsen</button>
                          )}
                          <button onClick={() => setCancelMode(true)} style={{ flex:1, padding:'12px', borderRadius:12, border:'1px solid rgba(229,85,85,.3)', color:'#c44', fontWeight:500, fontSize:'.9rem', background:'transparent', cursor:'pointer' }}>Annuleren</button>
                        </div>
                      </>
                    ) : rescheduleMode ? (
                      <div className="space-y-4">
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <h4 style={{ fontWeight:500, fontSize:'1rem', color:'#1C1814' }}>Kies een nieuwe datum &amp; tijd</h4>
                          <button onClick={() => { setRescheduleMode(false); setRescheduleDate(''); setRescheduleTime(''); setRescheduleError('') }} style={{ color:'#888', fontSize:18, background:'none', border:'none', cursor:'pointer' }}>✕</button>
                        </div>

                        {/* Info: <24u notice */}
                        <div style={{ background:'rgba(176,141,79,.08)', border:'1px solid rgba(176,141,79,.2)', borderRadius:12, padding:14, fontSize:'.83rem', color:'#B08D4F' }}>
                          Huidige afspraak: {formatDateNL(selectedBooking.slot_start)} om {formatTimeNL(selectedBooking.slot_start)} uur
                        </div>

                        {/* Date picker */}
                        <div>
                          <label style={{ display:'block', fontSize:'.82rem', color:'#888', marginBottom:6, fontWeight:500 }}>Datum</label>
                          <input
                            type="date"
                            value={rescheduleDate}
                            min={minRescheduleDate}
                            max={maxRescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid rgba(28,24,20,.13)', fontSize:'.9rem', background:'#F3EFE7', color:'#1C1814', outline:'none' }}
                          />
                        </div>

                        {/* Time picker */}
                        <div>
                          <label style={{ display:'block', fontSize:'.82rem', color:'#888', marginBottom:6, fontWeight:500 }}>Tijd</label>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                            {RESCHEDULE_SLOTS.map(slot => {
                              const isBooked = bookedSlots.includes(slot)
                              return (
                                <button
                                  key={slot}
                                  onClick={() => !isBooked && setRescheduleTime(slot)}
                                  disabled={isBooked}
                                  style={{
                                    padding:'10px', borderRadius:10, fontSize:'.88rem', fontWeight:500,
                                    cursor: isBooked ? 'not-allowed' : 'pointer',
                                    border: rescheduleTime === slot ? '1px solid #B08D4F' : '1px solid rgba(28,24,20,.13)',
                                    background: isBooked ? 'rgba(28,24,20,.05)' : (rescheduleTime === slot ? 'rgba(176,141,79,.12)' : 'transparent'),
                                    color: isBooked ? '#aaa' : (rescheduleTime === slot ? '#B08D4F' : '#1C1814'),
                                    opacity: isBooked ? .5 : 1,
                                    transition: 'all .2s',
                                  }}
                                >
                                  {slot}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {rescheduleError && (
                          <div style={{ background:'rgba(229,85,85,.08)', border:'1px solid rgba(229,85,85,.2)', borderRadius:12, padding:14, fontSize:'.83rem', color:'#c44' }}>
                            {rescheduleError}
                          </div>
                        )}

                        <div style={{ display:'flex', gap:12 }}>
                          <button onClick={() => { setRescheduleMode(false); setRescheduleDate(''); setRescheduleTime(''); setRescheduleError('') }} style={{ flex:1, padding:'12px', borderRadius:12, border:'1px solid rgba(28,24,20,.13)', color:'#888', fontWeight:500, fontSize:'.9rem', background:'transparent', cursor:'pointer' }}>Terug</button>
                          <button
                            onClick={handleRescheduleBooking}
                            disabled={!rescheduleDate || !rescheduleTime || rescheduling}
                            style={{
                              flex:1, padding:'12px', borderRadius:12, background:'#B08D4F', color:'#1C1814',
                              fontWeight:500, fontSize:'.9rem', border:'none', cursor:'pointer',
                              opacity: (!rescheduleDate || !rescheduleTime || rescheduling) ? .4 : 1,
                            }}
                          >
                            {rescheduling ? 'Verplaatsen...' : 'Bevestig nieuwe datum'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {isWithin24h(selectedBooking.slot_start) ? (
                          <div style={{ background:'rgba(229,85,85,.08)', border:'1px solid rgba(229,85,85,.2)', borderRadius:12, padding:16 }}>
                            <p style={{ fontSize:'.85rem', color:'#c44', fontWeight:500, marginBottom:12 }}>⚠️ Je annuleert binnen 24 uur. Aanbetaling van €{(selectedBooking.amount_cents/100).toFixed(0)} niet restitueerbaar.</p>
                            <label style={{ display:'flex', alignItems:'flex-start', gap:8, cursor:'pointer' }}>
                              <input type="checkbox" checked={cancelAgreed} onChange={(e) => setCancelAgreed(e.target.checked)} style={{marginTop:4}} />
                              <span style={{ fontSize:'.85rem', color:'#1C1814' }}>Ik begrijp dat mijn aanbetaling niet wordt gerestitueerd.</span>
                            </label>
                          </div>
                        ) : (
                          <div style={{ background:'rgba(34,139,34,.08)', border:'1px solid rgba(34,139,34,.2)', borderRadius:12, padding:16 }}>
                            <p style={{ fontSize:'.85rem', color:'#2a8c2a' }}>Je annuleert meer dan 24 uur voor je afspraak. Aanbetaling wordt gerestitueerd.</p>
                          </div>
                        )}
                        <div style={{ display:'flex', gap:12 }}>
                          <button onClick={() => { setCancelMode(false); setCancelAgreed(false) }} style={{ flex:1, padding:'12px', borderRadius:12, border:'1px solid rgba(28,24,20,.13)', color:'#888', fontWeight:500, fontSize:'.9rem', background:'transparent', cursor:'pointer' }}>Terug</button>
                          <button onClick={handleCancelBooking} disabled={isWithin24h(selectedBooking.slot_start) ? !cancelAgreed || cancelling : cancelling}
                            style={{ flex:1, padding:'12px', borderRadius:12, background:'#e55', color:'#fff', fontWeight:500, fontSize:'.9rem', border:'none', cursor:'pointer', opacity: (isWithin24h(selectedBooking.slot_start) ? !cancelAgreed || cancelling : cancelling) ? .4 : 1 }}>
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
                {sortedBookings.length > 0 ? (
                  <div className="space-y-3">
                    {sortedBookings.map(b => {
                      const isPast = new Date(b.slot_start) < new Date()
                      const isCancelled = b.status === 'cancelled' || b.status === 'expired'
                      return (
                        <button key={b.id} onClick={() => setSelectedBooking(b)}
                          style={{ width:'100%', textAlign:'left', background:'#FBF8F2', borderRadius:16, padding:20, border:'1px solid rgba(28,24,20,.13)', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', opacity:isCancelled?.6:1, transition:'border-color .2s' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor='#B08D4F'}
                          onMouseLeave={e => e.currentTarget.style.borderColor='rgba(28,24,20,.13)'}>
                          <div>
                            <span style={{ fontWeight:500, fontSize:'.95rem', color:'#1C1814', textDecoration:isCancelled?'line-through':'none' }}>{b.event_type}</span>
                            <p style={{ fontSize:'.8rem', color:'#888', marginTop:4 }}>{formatDateNL(b.slot_start)} om {formatTimeNL(b.slot_start)} uur</p>
                          </div>
                          <span style={{ fontSize:'.7rem', padding:'4px 11px', borderRadius:100, fontWeight:500,
                            ...(isCancelled ? { background:'rgba(229,85,85,.08)', color:'#c44' }
                              : isPast ? { background:'rgba(28,24,20,.07)', color:'#888' }
                              : { background:'rgba(176,141,79,.14)', color:'#B08D4F' })
                          }}>
                            {isCancelled ? (b.status === 'expired' ? 'Verlopen' : 'Geannuleerd') : isPast ? 'Afgelopen' : 'Bevestigd'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ background:'#FBF8F2', borderRadius:20, padding:'48px 32px', border:'1px solid rgba(28,24,20,.13)', textAlign:'center' }}>
                    <div style={{ fontSize:36, marginBottom:16 }}>📅</div>
                    <p style={{ fontSize:'1rem', color:'#888', marginBottom:20 }}>Nog geen boekingen</p>
                    <a href="/behandelingen" style={{ display:'inline-block', padding:'12px 32px', borderRadius:100, background:'#B08D4F', color:'#1C1814', fontWeight:500, fontSize:'.9rem', textDecoration:'none' }}>Boek een afspraak</a>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  )
}
