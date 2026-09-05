'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useCallback, useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase-client'

type Course = { id: string; title: string; slug: string; short_description: string; thumbnail_url?: string }
type Booking = { id: string; treatment_name: string; appointment_date: string; status: string; notes: string }
type PendingBooking = {
  id: string; cal_booking_uid: string; event_type: string; slot_start: string;
  amount_cents: number; status: string; customer_name: string | null; customer_email: string | null;
  cancelled_within_24h?: boolean
  source: 'online' | 'manual'
  salon_deposit_status?: 'paid' | 'not_recorded'
  salon_deposit_cents?: number | null
  sync_status?: string
}

type MyTraject = {
  id: string
  cursus_naam: string
  startdatum: string
  starttijd: string
  blok_dagen: string[]
  aanbetaling_status: string
  restbedrag_status: string
  aanbetaling_cents: number
  restbedrag_cents: number
  cal_sync_status: string
}

type RescheduleSlot = { start: string; time: string }
type LessonRow = { id: string; title: string; slug: string; sort_order: number; lesson_type: string; course_id: string }
type ProgressRow = { lesson_id: string; completed: boolean }

type ExamCert = {
  hasExam: boolean
  examPassed: boolean
  certDownloadable: boolean
}
type CourseProgress = {
  course: Course
  totalLessons: number
  completedLessons: number
  pct: number
  nextLesson: LessonRow | null
  nextLessonNumber: number
  isDone: boolean
  examPassed: boolean
  hasExam: boolean
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
  const locale = useLocale() as string
  const lpath = (p: string) => `/${locale}${p}`
  const [courses, setCourses] = useState<Course[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([])
  const [myTrajecten, setMyTrajecten] = useState<MyTraject[]>([])
  const [selectedBooking, setSelectedBooking] = useState<PendingBooking | null>(null)
  const [cancelMode, setCancelMode] = useState(false)
  const [cancelAgreed, setCancelAgreed] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [rescheduleMode, setRescheduleMode] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [rescheduling, setRescheduling] = useState(false)
  const [rescheduleError, setRescheduleError] = useState('')
  const [rescheduleSlots, setRescheduleSlots] = useState<RescheduleSlot[]>([])
  const [rescheduleSlotsLoading, setRescheduleSlotsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'academy' | 'boekingen'>('overview')
  const [profileFirstName, setProfileFirstName] = useState<string>('')
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([])
  const [totalCompletedLessons, setTotalCompletedLessons] = useState(0)
  const [progressLoading, setProgressLoading] = useState(true)
  const [downloadingCert, setDownloadingCert] = useState<string | null>(null)
  const [certError, setCertError] = useState<string | null>(null)
  const revealRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('first_name').eq('id', user.id).single()
      .then(({ data }) => setProfileFirstName(data?.first_name || ''))
  }, [user])

  const handleDownloadCertificate = async (courseId: string, courseTitle: string) => {
    if (!user) return
    setDownloadingCert(courseId)
    setCertError(null)
    try {
      const res = await fetch('/api/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, courseId }),
      })
      if (!res.ok) {
        console.error('Certificate API failed:', await res.text())
        setCertError('Certificaat genereren mislukt. Probeer het opnieuw.')
        return
      }
      const { generateCertificatePDF, generateCertificateId, formatCertDate } = await import('@/lib/certificate-client')
      const data = await res.json()
      const certId = generateCertificateId(user.id, courseId)
      const dateStr = formatCertDate(data.completedAt)
      await generateCertificatePDF({
        recipientName: data.recipientName,
        courseName: data.courseTitle,
        dateStr,
        certificateId: certId,
      })
    } catch (err) {
      console.error('Certificate download error:', err)
      setCertError('Netwerkfout — probeer opnieuw.')
    }
    setDownloadingCert(null)
  }

  useEffect(() => {
    if (!loading && !user) router.push('/login?redirect=/dashboard')
  }, [user, loading, router])

  // Read tab from URL param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tabParam = params.get('tab')
    if (tabParam === 'overview' || tabParam === 'academy' || tabParam === 'boekingen') {
      setActiveTab(tabParam)
    }
  }, [])

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
        const examLesson = allLessons.find(l => l.course_id === course.id && l.lesson_type === 'exam')
        const completedCount = cLessons.filter(l => progressMap.get(l.id)).length
        const pct = cLessons.length > 0 ? Math.round((completedCount / cLessons.length) * 100) : 0
        // Find next uncompleted lesson (first incomplete, by sort order)
        const next = cLessons.find(l => !progressMap.get(l.id)) || null
        const nextNum = next ? cLessons.indexOf(next) + 1 : cLessons.length
        const examPassed = examLesson ? !!progressMap.get(examLesson.id) : false
        return {
          course, totalLessons: cLessons.length, completedLessons: completedCount,
          pct, nextLesson: next, nextLessonNumber: nextNum, isDone: pct === 100,
          examPassed, hasExam: !!examLesson
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

  // Fetch the existing online bookings and isolated manual bookings, then normalize for display.
  const loadAccountBookings = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.auth.getSession()
      if (!data.session?.access_token) {
        console.warn('[dashboard] No session token for my-bookings fetch')
        return
      }
      const headers = { Authorization: `Bearer ${data.session.access_token}` }
      try {
        const [onlineResponse, manualResponse] = await Promise.all([
          fetch('/api/boeking/my-bookings', { headers }),
          fetch('/api/boeking/manual/my-bookings', { headers }),
        ])
        if (!onlineResponse.ok) console.error('[dashboard] my-bookings API error:', onlineResponse.status)
        if (!manualResponse.ok) console.error('[dashboard] manual my-bookings API error:', manualResponse.status)
        const [onlinePayload, manualPayload] = await Promise.all([
          onlineResponse.ok ? onlineResponse.json() : Promise.resolve({ bookings: [] }),
          manualResponse.ok ? manualResponse.json() : Promise.resolve({ bookings: [] }),
        ])
        const online = (onlinePayload?.bookings || []).map((booking: Omit<PendingBooking, 'source'>) => ({ ...booking, source: 'online' as const }))
        setPendingBookings([...online, ...(manualPayload?.bookings || [])])
      } catch (err) {
        console.error('[dashboard] bookings fetch failed:', err)
      }
  }, [user])

  useEffect(() => {
    loadAccountBookings()
  }, [loadAccountBookings])

  useEffect(() => {
    if (activeTab === 'boekingen') loadAccountBookings()
  }, [activeTab, loadAccountBookings])

  useEffect(() => {
    const refresh = () => loadAccountBookings()
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [loadAccountBookings])

  // Fetch my trajecten (traject_boekingen)
  useEffect(() => {
    if (!user) return
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.access_token) return
      fetch('/api/traject/my-trajecten', { headers: { Authorization: `Bearer ${data.session.access_token}` } })
        .then(res => {
          if (!res.ok) return []
          return res.json()
        })
        .then(data => setMyTrajecten(data?.trajecten || []))
        .catch(err => console.error('[dashboard] my-trajecten fetch failed:', err))
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

  // Fetch the selected treatment's real Cal.com availability.
  useEffect(() => {
    if (!rescheduleDate || !selectedBooking || !rescheduleMode) {
      setRescheduleSlots([])
      return
    }

    let cancelled = false
    const fetchAvailability = async () => {
      setRescheduleSlotsLoading(true)
      setRescheduleSlots([])
      setRescheduleTime('')
      setRescheduleError('')
      const { data } = await supabase.auth.getSession()
      if (!data.session?.access_token) {
        if (!cancelled) setRescheduleError('Je sessie is verlopen. Log opnieuw in.')
        if (!cancelled) setRescheduleSlotsLoading(false)
        return
      }

      try {
        const params = new URLSearchParams({ bookingId: selectedBooking.id, date: rescheduleDate })
        const availabilityPath = selectedBooking.source === 'manual'
          ? '/api/boeking/manual/reschedule-availability'
          : '/api/boeking/reschedule-availability'
        const response = await fetch(`${availabilityPath}?${params}`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
          cache: 'no-store',
        })
        const payload = await response.json().catch(() => null)
        if (!response.ok) throw new Error(payload?.error || 'Beschikbaarheid laden mislukt.')
        if (!cancelled) setRescheduleSlots(Array.isArray(payload?.slots) ? payload.slots : [])
      } catch (error) {
        if (!cancelled) setRescheduleError(error instanceof Error ? error.message : 'Beschikbaarheid laden mislukt.')
      } finally {
        if (!cancelled) setRescheduleSlotsLoading(false)
      }
    }
    fetchAvailability()
    return () => { cancelled = true }
  }, [rescheduleDate, rescheduleMode, selectedBooking])

  const handleCancelBooking = async () => {
    if (!selectedBooking || !user) return
    if (isWithin24h(selectedBooking.slot_start) && !cancelAgreed) return
    setCancelling(true)
    setCancelError('')
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.access_token) {
        setCancelError('Je sessie is verlopen. Log opnieuw in en probeer het nogmaals.')
        return
      }
      const cancelPath = selectedBooking.source === 'manual' ? '/api/boeking/manual/cancel' : '/api/boeking/cancel'
      const res = await fetch(cancelPath, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionData.session.access_token}` },
        body: JSON.stringify({ bookingId: selectedBooking.id }),
      })
      const result = await res.json()
      if (result.success) {
        setPendingBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, status: 'cancelled' } : b))
        setSelectedBooking(null); setCancelMode(false); setCancelAgreed(false); setCancelError('')
      } else {
        if (result.pending) {
          setPendingBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, status: 'cancellation_pending' } : b))
          setSelectedBooking(prev => prev ? { ...prev, status: 'cancellation_pending' } : prev)
        }
        setCancelError(result.error || 'Annuleren is niet gelukt. Probeer het nogmaals.')
      }
    } catch (err) {
      console.error('Cancel failed:', err)
      setCancelError('Annuleren is niet gelukt. Controleer je verbinding en probeer het opnieuw.')
    } finally {
      setCancelling(false)
    }
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

      // Get session from Supabase directly (same pattern as my-bookings fetch)
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.access_token) {
        setRescheduleError('Sessie verlopen. Log opnieuw in.')
        setRescheduling(false)
        return
      }

      const reschedulePath = selectedBooking.source === 'manual' ? '/api/boeking/manual/reschedule' : '/api/boeking/reschedule'
      const res = await fetch(reschedulePath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionData.session.access_token}` },
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

  // Check if date is weekend (Saturday=6, Sunday=0)
  const isWeekend = (dateStr: string): boolean => {
    const d = new Date(dateStr)
    const day = d.getDay()
    return day === 0 || day === 6
  }

  // Handle date change with weekend validation
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    if (newDate && isWeekend(newDate)) {
      setRescheduleError('Chiva werkt niet in het weekend. Kies een werkdag.')
      setRescheduleDate('')
      return
    }
    setRescheduleError('')
    setRescheduleDate(newDate)
  }

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

  // Best course to resume (highest pct but not 100%, or first with next lesson)
  const resumeCourse = courseProgress.length > 0
    ? courseProgress.filter(c => !c.isDone && c.nextLesson).sort((a, b) => b.pct - a.pct)[0] || courseProgress[0]
    : null

  // Active courses count
  const activeCourses = courseProgress.filter(c => !c.isDone).length

  // Next upcoming booking
  const upcomingBookings = pendingBookings
    .filter(b => (b.status === 'paid' || b.status === 'confirmed') && new Date(b.slot_start) > new Date())
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
                  {resumeCourse.nextLesson ? (
                    <a href={lpath(`/academy/${resumeCourse.course.slug}/${resumeCourse.nextLesson.id}`)} style={{
                      display:'inline-flex', alignItems:'center', gap:10, marginTop:20,
                      background:'#B08D4F', color:'#1C1814', textDecoration:'none',
                      fontWeight:500, fontSize:'.95rem', padding:'13px 26px', borderRadius:100,
                      transition:'transform .25s, box-shadow .25s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 14px 30px -12px rgba(176,141,79,.4)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}>
                      Verder met les {resumeCourse.nextLessonNumber} →
                    </a>
                  ) : (
                    <a href={lpath(`/academy/${resumeCourse.course.slug}`)} style={{
                      display:'inline-flex', alignItems:'center', gap:10, marginTop:20,
                      background:'#B08D4F', color:'#1C1814', textDecoration:'none',
                      fontWeight:500, fontSize:'.95rem', padding:'13px 26px', borderRadius:100,
                      transition:'transform .25s, box-shadow .25s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 14px 30px -12px rgba(176,141,79,.4)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}>
                      Cursus bekijken →
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
                <a href={lpath('/courses')} style={{ display:'inline-block', background:'#B08D4F', color:'#1C1814', textDecoration:'none', fontWeight:500, fontSize:'.9rem', padding:'12px 28px', borderRadius:100 }}>
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
                  <a href={lpath('/courses')} style={{ textDecoration:'none', color:'#46403A', fontSize:'.88rem', borderBottom:'1px solid rgba(28,24,20,.13)', paddingBottom:2 }}>Alle cursussen bekijken</a>
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
                        <div style={{ marginTop:'auto', paddingTop:20, display:'flex', gap:10, flexWrap:'wrap' }}>
                          {cp.examPassed ? (
                            <>
                            <button
                              onClick={() => handleDownloadCertificate(cp.course.id, cp.course.title)}
                              disabled={downloadingCert === cp.course.id}
                              style={{
                                display:'inline-flex', alignItems:'center', gap:8, textDecoration:'none',
                                color:'#FBF8F2', fontWeight:500, fontSize:'.88rem',
                                background:'linear-gradient(180deg,#E4C98A,#C4A265)',
                                border:'none', borderRadius:100, padding:'10px 22px', cursor:'pointer',
                                transition:'opacity .25s', opacity: downloadingCert === cp.course.id ? 0.6 : 1,
                              }}
                            >
                              {downloadingCert === cp.course.id ? 'PDF genereren...' : '⬇ Download certificaat'}
                            </button>
                            {certError && downloadingCert === null && (
                              <div style={{ fontSize:'.78rem', color:'#ef4444', marginTop:6, width:'100%' }}>{certError}</div>
                            )}
                            <a href={lpath(`/academy/${cp.course.slug}`)} style={{
                              display:'inline-flex', alignItems:'center', gap:8, textDecoration:'none',
                              color:'#46403A', fontWeight:500, fontSize:'.88rem',
                              border:'1px solid rgba(28,24,20,.25)', borderRadius:100, padding:'10px 22px',
                              transition:'border-color .25s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1C1814' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(28,24,20,.25)' }}>
                              Cursus bekijken →
                            </a>
                            </>
                          ) : cp.isDone && cp.hasExam ? (
                            <a href={lpath(`/academy/${cp.course.slug}`)} style={{
                              display:'inline-flex', alignItems:'center', gap:8, textDecoration:'none',
                              color:'#B08D4F', fontWeight:500, fontSize:'.88rem',
                              border: '1px solid #B08D4F', borderRadius:100, padding:'10px 22px',
                              transition:'background .25s, color .25s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#B08D4F'; e.currentTarget.style.color = '#FBF8F2' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#B08D4F' }}>
                              Eindtoets maken →
                            </a>
                          ) : (
                            <a href={lpath(`/academy/${cp.course.slug}`)} style={{
                              display:'inline-flex', alignItems:'center', gap:8, textDecoration:'none',
                              color: cp.isDone ? '#B08D4F' : '#1C1814', fontWeight:500, fontSize:'.88rem',
                              border: `1px solid ${cp.isDone ? '#B08D4F' : '#1C1814'}`, borderRadius:100, padding:'10px 22px',
                              transition:'background .25s, color .25s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = cp.isDone ? '#B08D4F' : '#1C1814'; e.currentTarget.style.color = '#FBF8F2' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = cp.isDone ? '#B08D4F' : '#1C1814' }}>
                              {cp.isDone ? 'Cursus herbekijken →' : 'Verder leren →'}
                            </a>
                          )}
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
                    const isCancellationPending = b.status === 'cancellation_pending'
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
                          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                            <h5 className="font-['Cormorant_Garamond']" style={{ fontWeight:600, fontSize:'1.25rem', lineHeight:1.1, color:'#1C1814', textDecoration: isCancelled ? 'line-through' : 'none' }}>{b.event_type}</h5>
                            {b.source === 'manual' && <span style={{fontSize:'.62rem',padding:'3px 8px',borderRadius:100,background:'rgba(176,141,79,.12)',color:'#8a6b34',border:'1px solid rgba(176,141,79,.28)'}}>Handmatig</span>}
                          </div>
                          <p style={{ fontSize:'.82rem', color:'#888', marginTop:3 }}>{formatTimeNL(b.slot_start)} uur · Lashed by Chiva, Arnhem</p>
                        </div>
                        {/* Pay */}
                        <div style={{ textAlign:'right' }}>
                          <div className="font-['Cormorant_Garamond']" style={{ fontSize:'1.3rem', fontWeight:600, color:'#1C1814' }}>{b.source === 'manual' ? 'Handmatig' : `€${(b.amount_cents/100).toFixed(0)}`}</div>
                          <span style={{
                            display:'inline-block', marginTop:6, fontSize:'.68rem', letterSpacing:'.05em',
                            padding:'4px 11px', borderRadius:100, fontWeight:500,
                            ...(isCancelled ? { background:'rgba(28,24,20,.07)', color:'#888', border:'1px solid rgba(28,24,20,.13)' }
                              : isPast ? { background:'rgba(28,24,20,.07)', color:'#888', border:'1px solid rgba(28,24,20,.13)' }
                              : { background:'rgba(176,141,79,.14)', color:'#B08D4F', border:'1px solid rgba(176,141,79,.3)' })
                          }}>
                            {isCancellationPending ? 'Annulering in behandeling' : isCancelled ? (b.status === 'expired' ? 'Verlopen' : 'Geannuleerd') : isPast ? 'Voltooid' : b.source === 'manual' ? 'Bevestigd' : 'Aanbetaling voldaan'}
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
            {/* === TRAJECTEN (fysieke opleidingsdagen) === */}
            <h2 className="font-['Cormorant_Garamond']" style={{ fontWeight:500, fontSize:'clamp(1.6rem,3vw,2rem)', color:'#1C1814', marginBottom:8 }}>Mijn Trajecten</h2>
            <p style={{ fontSize:'.85rem', color:'#888', marginBottom:20 }}>Jouw geboekte opleidingen en trainingen bij Chiva</p>

            {myTrajecten.length > 0 ? (
              <div className="space-y-3 mb-12">
                {myTrajecten.map(tr => {
                  const blok = tr.blok_dagen || []
                  const isMultiDay = blok.length > 1
                  const firstDay = blok[0] ? new Date(blok[0] + 'T00:00:00') : null
                  const lastDay = blok[blok.length - 1] ? new Date(blok[blok.length - 1] + 'T00:00:00') : null
                  const isPast = firstDay ? firstDay < new Date(Date.now() - 86400000) : false

                  // Format date range
                  let dateLabel = ''
                  if (isMultiDay && firstDay && lastDay) {
                    const opts: Intl.DateTimeFormatOptions = { weekday:'short', day:'numeric', month:'short' }
                    const startStr = firstDay.toLocaleDateString('nl-NL', opts)
                    const endOpts: Intl.DateTimeFormatOptions = firstDay.getMonth() === lastDay.getMonth()
                      ? { day:'numeric', month:'short' }
                      : { weekday:'short', day:'numeric', month:'short' }
                    const endStr = lastDay.toLocaleDateString('nl-NL', endOpts)
                    dateLabel = `${startStr} t/m ${endStr}`
                  } else if (firstDay) {
                    dateLabel = firstDay.toLocaleDateString('nl-NL', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
                  }

                  return (
                    <div key={tr.id} style={{
                      display:'flex', alignItems:'center', gap:20,
                      background:'#FBF8F2', borderRadius:16, padding:20,
                      border:'1px solid rgba(28,24,20,.13)',
                      opacity: isPast ? 0.65 : 1,
                    }}>
                      {/* Date chip */}
                      <div style={{
                        textAlign:'center', border:'1px solid rgba(28,24,20,.13)',
                        borderRadius:13, padding:'10px 0', background:'#F3EFE7',
                        minWidth:64, flexShrink:0,
                      }}>
                        <div className="font-['Cormorant_Garamond']" style={{ fontSize:'1.6rem', fontWeight:600, lineHeight:1, color:'#1C1814' }}>
                          {firstDay?.getDate() || '?'}
                        </div>
                        <div style={{ fontSize:'.64rem', textTransform:'uppercase', letterSpacing:'.14em', color:'#888', marginTop:3 }}>
                          {firstDay?.toLocaleDateString('nl-NL',{month:'short'})}
                        </div>
                      </div>

                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <h3 style={{ fontWeight:600, fontSize:'1.1rem', color:'#1C1814', marginBottom:4 }}>
                          {tr.cursus_naam}
                        </h3>
                        <p style={{ fontSize:'.82rem', color:'#888', marginTop:2 }}>
                          {dateLabel}{tr.starttijd ? ` · ${tr.starttijd} uur` : ''} · Lashed by Chiva, Arnhem
                        </p>
                        {/* Payment status badges */}
                        <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
                          <span style={{
                            display:'inline-block', fontSize:'.68rem', letterSpacing:'.05em',
                            padding:'4px 11px', borderRadius:100, fontWeight:500,
                            background: tr.aanbetaling_status === 'betaald' ? 'rgba(176,141,79,.14)' : 'rgba(229,85,85,.08)',
                            color: tr.aanbetaling_status === 'betaald' ? '#B08D4F' : '#c44',
                            border: `1px solid ${tr.aanbetaling_status === 'betaald' ? 'rgba(176,141,79,.3)' : 'rgba(229,85,85,.2)'}`,
                          }}>
                            {tr.aanbetaling_status === 'betaald' ? '✓ Aanbetaling voldaan' : '⚠ Aanbetaling open'}
                          </span>
                          {tr.restbedrag_status === 'open' && (
                            <span style={{
                              display:'inline-block', fontSize:'.68rem', letterSpacing:'.05em',
                              padding:'4px 11px', borderRadius:100, fontWeight:500,
                              background:'rgba(28,24,20,.07)', color:'#888',
                              border:'1px solid rgba(28,24,20,.13)',
                            }}>
                              Restbedrag te betalen bij Chiva
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div className="font-['Cormorant_Garamond']" style={{ fontSize:'1.2rem', fontWeight:600, color:'#1C1814' }}>
                          €{((tr.aanbetaling_cents + tr.restbedrag_cents) / 100).toFixed(0)}
                        </div>
                        <div style={{ fontSize:'.68rem', color:'#aaa', marginTop:2 }}>
                          {isPast ? 'Voltooid' : 'Aanbetaling'} €{(tr.aanbetaling_cents / 100).toFixed(0)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ background:'#FBF8F2', borderRadius:20, padding:'36px 32px', border:'1px solid rgba(28,24,20,.13)', textAlign:'center', marginBottom:48 }}>
                <div style={{ fontSize:32, marginBottom:12 }}>📚</div>
                <p style={{ fontSize:'1rem', color:'#1C1814', fontWeight:500, marginBottom:4 }}>Nog geen trajecten geboekt</p>
                <p style={{ fontSize:'.88rem', color:'#888', marginBottom:20 }}>Ontdek de opleidingen en start jouw lash-carrière.</p>
                <a href={lpath('/persoonlijk-traject')} style={{ display:'inline-block', padding:'12px 28px', borderRadius:100, background:'#B08D4F', color:'#1C1814', fontWeight:500, fontSize:'.9rem', textDecoration:'none' }}>
                  Bekijk trajecten
                </a>
              </div>
            )}

            {/* === CURSUSSEN (online enrollments) === */}
            <h2 className="font-['Cormorant_Garamond']" style={{ fontWeight:500, fontSize:'clamp(1.6rem,3vw,2rem)', color:'#1C1814', marginBottom:24, marginTop: myTrajecten.length > 0 ? 16 : 0 }}>Mijn Cursussen</h2>
            {courseProgress.length > 0 ? (
              <div className="space-y-3">
                {courseProgress.map(cp => (
                  <a key={cp.course.id} href={lpath(`/academy/${cp.course.slug}`)} style={{ display:'flex', alignItems:'center', gap:20, background:'#FBF8F2', borderRadius:16, padding:20, border:'1px solid rgba(28,24,20,.13)', textDecoration:'none', transition:'border-color .2s' }}
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
                <a href={lpath('/courses')} style={{ display:'inline-block', padding:'12px 32px', borderRadius:100, background:'#B08D4F', color:'#1C1814', fontWeight:500, fontSize:'.9rem', textDecoration:'none' }}>Bekijk cursussen</a>
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
                  <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}><h3 className="font-['Cormorant_Garamond']" style={{ fontWeight:500, fontSize:'1.6rem', color:'#1C1814' }}>{selectedBooking.event_type}</h3>{selectedBooking.source === 'manual' && <span style={{fontSize:'.68rem',padding:'4px 10px',borderRadius:100,background:'rgba(176,141,79,.12)',color:'#8a6b34',border:'1px solid rgba(176,141,79,.28)'}}>Handmatig ingepland</span>}</div>
                  <button onClick={() => { setSelectedBooking(null); setCancelMode(false); setCancelAgreed(false); setCancelError('') }} disabled={cancelling} aria-label="Boeking sluiten" style={{ color:'#888', fontSize:20, background:'none', border:'none', cursor:cancelling?'not-allowed':'pointer', opacity:cancelling?.4:1 }}>✕</button>
                </div>
                <div className="space-y-2 text-[14px] mb-5">
                  <div style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid rgba(28,24,20,.07)', paddingBottom:8 }}><span style={{color:'#888'}}>Datum</span><span style={{fontWeight:500,color:'#1C1814'}}>{formatDateNL(selectedBooking.slot_start)}</span></div>
                  <div style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid rgba(28,24,20,.07)', paddingBottom:8 }}><span style={{color:'#888'}}>Tijd</span><span style={{fontWeight:500,color:'#1C1814'}}>{formatTimeNL(selectedBooking.slot_start)} uur</span></div>
                  <div style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid rgba(28,24,20,.07)', paddingBottom:8 }}><span style={{color:'#888'}}>Locatie</span><span style={{fontWeight:500,color:'#1C1814'}}>De Overmaat 26, Arnhem</span></div>
                  <div style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid rgba(28,24,20,.07)', paddingBottom:8 }}><span style={{color:'#888'}}>Aanbetaling</span><span style={{fontWeight:500,color:'#1C1814'}}>{selectedBooking.source === 'manual' ? selectedBooking.salon_deposit_status === 'paid' ? `In salon betaald · €${((selectedBooking.salon_deposit_cents || 0)/100).toFixed(0)}` : 'Niet geregistreerd' : `€${(selectedBooking.amount_cents/100).toFixed(0)}`}</span></div>
                  <div style={{ display:'flex', justifyContent:'space-between', paddingBottom:8 }}><span style={{color:'#888'}}>Status</span><span style={{fontWeight:500,textTransform:'capitalize',color:selectedBooking.status==='paid'?'#B08D4F':selectedBooking.status==='cancelled'?'#e55':'#B08D4F'}}>{selectedBooking.status}</span></div>
                </div>

                {selectedBooking.status === 'cancelled' && selectedBooking.cancelled_within_24h && (
                  <div style={{ background:'rgba(229,85,85,.08)', border:'1px solid rgba(229,85,85,.2)', borderRadius:12, padding:16, marginBottom:16, fontSize:'.85rem', color:'#c44' }}>
                    {selectedBooking.source === 'manual' ? 'Geannuleerd binnen 24 uur — een eventueel in de salon betaalde aanbetaling is niet restitueerbaar.' : <>Geannuleerd binnen 24 uur — aanbetaling niet gerestitueerd, conform de <a href="/voorwaarden" style={{textDecoration:'underline'}}>algemene voorwaarden</a>.</>}
                  </div>
                )}
                {selectedBooking.status === 'cancelled' && !selectedBooking.cancelled_within_24h && (
                  <div style={{ background:'rgba(176,141,79,.08)', border:'1px solid rgba(176,141,79,.2)', borderRadius:12, padding:16, marginBottom:16, fontSize:'.85rem', color:'#B08D4F' }}>
                    {selectedBooking.source === 'manual' ? 'Geannuleerd — er is via de website geen betaling of terugbetaling verwerkt.' : 'Geannuleerd — restitutie wordt door LUXIQUE verwerkt.'}
                  </div>
                )}
                {selectedBooking.status === 'cancellation_pending' && (
                  <div style={{ background:'rgba(176,141,79,.08)', border:'1px solid rgba(176,141,79,.2)', borderRadius:12, padding:16, marginBottom:16, fontSize:'.85rem', color:'#8a6b34' }}>
                    Annulering in behandeling — Cal.com heeft de annulering nog niet bevestigd. LUXIQUE probeert dit automatisch opnieuw.
                  </div>
                )}

                {(selectedBooking.status === 'paid' || selectedBooking.status === 'confirmed') && new Date(selectedBooking.slot_start) > new Date() && (
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
                          <button onClick={() => { setCancelMode(true); setCancelError('') }} style={{ flex:1, padding:'12px', borderRadius:12, border:'1px solid rgba(229,85,85,.3)', color:'#c44', fontWeight:500, fontSize:'.9rem', background:'transparent', cursor:'pointer' }}>Annuleren</button>
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
                            onChange={handleDateChange}
                            style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid rgba(28,24,20,.13)', fontSize:'.9rem', background:'#F3EFE7', color:'#1C1814', outline:'none' }}
                          />
                        </div>

                        {/* Time picker */}
                        <div>
                          <label style={{ display:'block', fontSize:'.82rem', color:'#888', marginBottom:6, fontWeight:500 }}>Tijd</label>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                            {rescheduleSlots.map(slot => {
                              return (
                                <button
                                  key={slot.start}
                                  onClick={() => setRescheduleTime(slot.time)}
                                  style={{
                                    padding:'10px', borderRadius:10, fontSize:'.88rem', fontWeight:500,
                                    cursor: 'pointer',
                                    border: rescheduleTime === slot.time ? '1px solid #B08D4F' : '1px solid rgba(28,24,20,.13)',
                                    background: rescheduleTime === slot.time ? 'rgba(176,141,79,.12)' : 'transparent',
                                    color: rescheduleTime === slot.time ? '#B08D4F' : '#1C1814',
                                    transition: 'all .2s',
                                  }}
                                >
                                  {slot.time}
                                </button>
                              )
                            })}
                          </div>
                          {rescheduleSlotsLoading && <p style={{fontSize:'.82rem',color:'#888',marginTop:8}}>Beschikbaarheid laden…</p>}
                          {!rescheduleSlotsLoading && rescheduleDate && rescheduleSlots.length === 0 && !rescheduleError && (
                            <p style={{fontSize:'.82rem',color:'#888',marginTop:8}}>Geen beschikbare tijden op deze datum.</p>
                          )}
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
                            <p style={{ fontSize:'.85rem', color:'#c44', fontWeight:500, marginBottom:12 }}>⚠️ {selectedBooking.source === 'manual' ? (selectedBooking.salon_deposit_status === 'paid' ? `Je annuleert binnen 24 uur. De in de salon betaalde aanbetaling van €${((selectedBooking.salon_deposit_cents || 0)/100).toFixed(0)} is niet restitueerbaar.` : 'Je annuleert binnen 24 uur. Een eventueel in de salon betaalde aanbetaling is niet restitueerbaar.') : `Je annuleert binnen 24 uur. Aanbetaling van €${(selectedBooking.amount_cents/100).toFixed(0)} niet restitueerbaar.`}</p>
                            <label style={{ display:'flex', alignItems:'flex-start', gap:8, cursor:'pointer' }}>
                              <input type="checkbox" checked={cancelAgreed} onChange={(e) => setCancelAgreed(e.target.checked)} style={{marginTop:4}} />
                              <span style={{ fontSize:'.85rem', color:'#1C1814' }}>Ik begrijp dat mijn aanbetaling niet wordt gerestitueerd.</span>
                            </label>
                          </div>
                        ) : (
                          <div style={{ background:'rgba(34,139,34,.08)', border:'1px solid rgba(34,139,34,.2)', borderRadius:12, padding:16 }}>
                            <p style={{ fontSize:'.85rem', color:'#2a8c2a' }}>{selectedBooking.source === 'manual' ? 'Je annuleert meer dan 24 uur voor je afspraak. Er wordt geen online betaling of terugbetaling verwerkt.' : 'Je annuleert meer dan 24 uur voor je afspraak. Aanbetaling wordt gerestitueerd.'}</p>
                          </div>
                        )}
                        {cancelError && (
                          <div role="alert" style={{ background:'rgba(229,85,85,.08)', border:'1px solid rgba(229,85,85,.2)', borderRadius:12, padding:14, fontSize:'.83rem', color:'#c44' }}>
                            {cancelError}
                          </div>
                        )}
                        <div style={{ display:'flex', gap:12 }}>
                          <button onClick={() => { setCancelMode(false); setCancelAgreed(false); setCancelError('') }} disabled={cancelling} style={{ flex:1, padding:'12px', borderRadius:12, border:'1px solid rgba(28,24,20,.13)', color:'#888', fontWeight:500, fontSize:'.9rem', background:'transparent', cursor:cancelling?'not-allowed':'pointer', opacity:cancelling?.4:1 }}>Terug</button>
                          <button onClick={handleCancelBooking} disabled={isWithin24h(selectedBooking.slot_start) ? !cancelAgreed || cancelling : cancelling}
                            aria-busy={cancelling}
                            style={{ flex:1, minHeight:43, padding:'12px', borderRadius:12, background:'#e55', color:'#fff', fontWeight:500, fontSize:'.9rem', border:'none', cursor:(isWithin24h(selectedBooking.slot_start) ? !cancelAgreed || cancelling : cancelling)?'not-allowed':'pointer', opacity: (isWithin24h(selectedBooking.slot_start) ? !cancelAgreed || cancelling : cancelling) ? .55 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                            {cancelling && <span className="animate-spin" aria-hidden="true" style={{ width:15, height:15, border:'2px solid rgba(255,255,255,.45)', borderTopColor:'#fff', borderRadius:'50%', flexShrink:0 }} />}
                            {cancelling ? 'Bezig met annuleren...' : 'Bevestig annulering'}
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
                      const isCancellationPending = b.status === 'cancellation_pending'
                      return (
                        <button key={b.id} onClick={() => setSelectedBooking(b)}
                          style={{ width:'100%', textAlign:'left', background:'#FBF8F2', borderRadius:16, padding:20, border:'1px solid rgba(28,24,20,.13)', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', opacity:isCancelled?.6:1, transition:'border-color .2s' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor='#B08D4F'}
                          onMouseLeave={e => e.currentTarget.style.borderColor='rgba(28,24,20,.13)'}>
                          <div>
                            <span style={{ fontWeight:500, fontSize:'.95rem', color:'#1C1814', textDecoration:isCancelled?'line-through':'none' }}>{b.event_type}</span>{b.source === 'manual' && <span style={{marginLeft:8,fontSize:'.62rem',padding:'3px 8px',borderRadius:100,background:'rgba(176,141,79,.12)',color:'#8a6b34'}}>Handmatig</span>}
                            <p style={{ fontSize:'.8rem', color:'#888', marginTop:4 }}>{formatDateNL(b.slot_start)} om {formatTimeNL(b.slot_start)} uur</p>
                          </div>
                          <span style={{ fontSize:'.7rem', padding:'4px 11px', borderRadius:100, fontWeight:500,
                            ...(isCancelled ? { background:'rgba(229,85,85,.08)', color:'#c44' }
                              : isPast ? { background:'rgba(28,24,20,.07)', color:'#888' }
                              : { background:'rgba(176,141,79,.14)', color:'#B08D4F' })
                          }}>
                            {isCancellationPending ? 'Annulering in behandeling' : isCancelled ? (b.status === 'expired' ? 'Verlopen' : 'Geannuleerd') : isPast ? 'Afgelopen' : 'Bevestigd'}
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
