'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

/* ── Types ── */
interface Course {
  id: string
  title: string
  description?: string
  slug: string
  level: string
  price: number
  status: 'draft' | 'published' | 'archived'
  thumbnail_url?: string
  intro_video_mux_id?: string
  thumbnail_time?: number
  created_at: string
  lessons_count?: number
  duration_seconds?: number
  duration_minutes?: number
  students_count?: number
  has_quiz?: boolean
  has_certificate?: boolean
}

export default function CoursesOverviewPage() {
  const { user, role, loading } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRevenue: 0
  })
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [newCourse, setNewCourse] = useState({
    title: '',
    level: '',
    description: ''
  })
  const [loadingCourses, setLoadingCourses] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!loading && user && role === 'admin') {
      fetchCourses()
    }
  }, [loading, user, role])

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true)
      // Use the imported supabase client

      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (coursesError) throw coursesError

      // For each course, fetch lessons count and enrollments
      const coursesWithCounts = await Promise.all(
        (coursesData || []).map(async (course) => {
          // Count lessons
          const { count: lessonsCount } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id)

          // Count enrollments
          const { count: enrollmentsCount } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id)

          // Get total duration from lessons
          const { data: lessonsData } = await supabase
            .from('lessons')
            .select('duration_seconds')
            .eq('course_id', course.id)

          const totalMinutes = lessonsData?.reduce((sum, lesson) => sum + Math.round((lesson.duration_seconds || 0) / 60), 0) || 0

          return {
            ...course,
            lessons_count: lessonsCount || 0,
            students_count: enrollmentsCount || 0,
            duration_minutes: totalMinutes
          }
        })
      )

      setCourses(coursesWithCounts)

      // Calculate stats — alleen echte data
      const totalStudents = coursesWithCounts.reduce((sum, c) => sum + (c.students_count || 0), 0)
      const totalRevenue = coursesWithCounts.reduce((sum, c) => sum + Math.round(((c.price || 0) / 100)) * (c.students_count || 0), 0)

      setStats({
        totalStudents,
        totalRevenue
      })
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoadingCourses(false)
    }
  }

  const handleArchiveCourse = async (courseId: string, currentStatus: string) => {
    try {
      // Use the imported supabase client
      const newStatus = currentStatus === 'archived' ? 'draft' : 'archived'

      const { error } = await supabase
        .from('courses')
        .update({ status: newStatus })
        .eq('id', courseId)

      if (error) throw error

      // Refresh courses
      fetchCourses()
    } catch (error) {
      console.error('Error archiving course:', error)
      alert('Er ging iets mis bij het archiveren')
    }
  }

  const handleCreateCourse = async () => {
    if (!newCourse.title.trim()) {
      alert('Vul een cursusnaam in')
      return
    }

    try {
      // Create course via API (server-side admin check)
      const res = await fetch('/api/courses/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newCourse.title,
          description: newCourse.description,
          level: newCourse.level || 'beginner',
          user_id: user?.id
        })
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      const data = result.data

      // Redirect to course builder
      router.push(`/admin/courses/${data.id}/builder`)
    } catch (error) {
      console.error('Error creating course:', error)
      const msg = error instanceof Error ? error.message : 'Onbekende fout'
      alert(`Cursus aanmaken gefaald: ${msg}`)
    }
  }

  const getFilteredCourses = () => {
    let filtered = courses

    if (filter !== 'all') {
      filtered = filtered.filter(c => c.status === filter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      )
    }

    return filtered
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return 'Live'
      case 'draft': return 'Concept'
      case 'archived': return 'Gearchiveerd'
      default: return status
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'published': return 'status-live'
      case 'draft': return 'status-concept'
      case 'archived': return 'status-archived'
      default: return ''
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `~${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `~${hours}u ${mins}m` : `~${hours} uur`
  }

  const formatRevenue = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return <div className="min-h-screen bg-[#F0EDE6] flex items-center justify-center"><div className="text-[#7A7268] text-[14px]">Laden...</div></div>
  }

  if (!user || role !== 'admin') {
    return <div className="min-h-screen bg-[#F0EDE6] flex items-center justify-center flex-col gap-4"><div className="text-[#7A7268] text-[14px]">Geen toegang.</div><a href="/admin" className="text-[13px] text-[#C4A265]">← Admin</a></div>
  }

  const filteredCourses = getFilteredCourses()

  return (
    <>
      <style jsx global>{`
        :root {
          --gold: #C4A265;
          --gold-l: #DFC08A;
          --gold-d: #7A6340;
          --cream: #FAF8F4;
          --cream2: #F0EDE6;
          --cream3: #E8E3DB;
          --dark: #0C0A07;
          --dark2: #161310;
          --text: #1E1A14;
          --muted: #7A7268;
          --green: #4CAF82;
          --red: #E05A4E;
        }
        html, body {
          font-family: 'Outfit', sans-serif;
          -webkit-font-smoothing: antialiased;
        }
      `}</style>

      <div className="min-h-screen bg-[#F0EDE6]">
        {/* Topbar */}
        <div className="h-[50px] bg-[#FAF8F4] border-b border-[rgba(30,26,20,0.09)] flex items-center justify-between px-6 sticky top-[66px] z-40">
          <div className="flex items-center gap-3">
            <span className="font-['AvenirNext','Avenir_Next','Avenir','Century_Gothic',sans-serif] text-[12px] font-extralight tracking-[0.34em] text-[#C4A265] uppercase">
              Luxique
            </span>
            <div className="w-px h-4 bg-[rgba(30,26,20,0.09)]"></div>
            <span className="text-[13px] text-[#7A7268]">Academy beheer</span>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => router.push('/')}
              className="text-[12px] font-medium px-4 py-1.5 rounded-full border border-[rgba(30,26,20,0.09)] text-[#7A7268] hover:text-[#1E1A14] hover:border-[rgba(30,26,20,0.22)] transition flex items-center gap-1.5"
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>
              </svg>
              Naar site
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="text-[12px] font-medium px-4 py-1.5 rounded-full bg-[#C4A265] text-white hover:bg-[#DFC08A] transition flex items-center gap-1.5"
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 4.5v15m7.5-7.5h-15"/>
              </svg>
              Nieuwe cursus
            </button>
          </div>
        </div>

        {/* Page */}
        <div className="max-w-[1100px] mx-auto px-6 py-7">

          {/* Header */}
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="font-['Cormorant_Garamond',serif] text-[28px] font-normal text-[#1E1A14] tracking-[-0.01em] mb-1">
                Cursussen
              </h1>
              <p className="text-[13px] text-[#7A7268] font-light">
                Beheer en bewerk alle LXQ Academy cursussen
              </p>
            </div>
          </div>

          {/* Stats Strip — 3 tegels (voltooiingsrate verwijderd) */}
          <div className="grid grid-cols-3 gap-2.5 mb-6">
            <div className="bg-[#FAF8F4] border border-[rgba(30,26,20,0.09)] rounded-[14px] p-4 px-5">
              <div className="font-['Cormorant_Garamond',serif] text-[32px] font-light text-[#1E1A14] leading-none tracking-[-0.02em] mb-0.5">
                {courses.filter(c => c.status === 'published').length}
              </div>
              <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#7A7268]">
                Live cursussen
              </div>
            </div>
            <div
              className="bg-[#FAF8F4] border border-[rgba(30,26,20,0.09)] rounded-[14px] p-4 px-5 cursor-pointer hover:border-[rgba(196,162,101,0.3)] transition"
              onClick={() => router.push('/admin/customers')}
            >
              <div className="font-['Cormorant_Garamond',serif] text-[32px] font-light text-[#1E1A14] leading-none tracking-[-0.02em] mb-0.5">
                {stats.totalStudents}
              </div>
              <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#7A7268]">
                Studenten →
              </div>
            </div>
            <div className="bg-[#FAF8F4] border border-[rgba(30,26,20,0.09)] rounded-[14px] p-4 px-5">
              <div className="font-['Cormorant_Garamond',serif] text-[32px] font-light text-[#1E1A14] leading-none tracking-[-0.02em] mb-0.5">
                {formatRevenue(stats.totalRevenue)}
              </div>
              <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#7A7268]">
                Totale omzet
              </div>
            </div>
          </div>

          {/* Filters — met telbadges */}
          <div className="flex gap-1.5 mb-8 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`text-[11.5px] font-medium px-3.5 py-1 rounded-full border cursor-pointer transition flex items-center gap-1.5 ${
                filter === 'all'
                  ? 'bg-[rgba(196,162,101,0.1)] border-[rgba(196,162,101,0.3)] text-[#7A6340]'
                  : 'border-[rgba(30,26,20,0.09)] text-[#7A7268] hover:border-[rgba(30,26,20,0.18)] hover:text-[#1E1A14]'
              }`}
            >
              Alle cursussen
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${filter === 'all' ? 'bg-[#C4A265] text-white' : 'bg-[rgba(30,26,20,0.06)] text-[#7A7268]'}`}>{courses.length}</span>
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`text-[11.5px] font-medium px-3.5 py-1 rounded-full border cursor-pointer transition flex items-center gap-1.5 ${
                filter === 'published'
                  ? 'bg-[rgba(76,175,130,0.1)] border-[rgba(76,175,130,0.3)] text-[#2d6b4f]'
                  : 'border-[rgba(30,26,20,0.09)] text-[#7A7268] hover:border-[rgba(30,26,20,0.18)] hover:text-[#1E1A14]'
              }`}
            >
              Live
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${filter === 'published' ? 'bg-[#4CAF82] text-white' : 'bg-[rgba(30,26,20,0.06)] text-[#7A7268]'}`}>{courses.filter(c => c.status === 'published').length}</span>
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`text-[11.5px] font-medium px-3.5 py-1 rounded-full border cursor-pointer transition flex items-center gap-1.5 ${
                filter === 'draft'
                  ? 'bg-[rgba(224,160,74,0.1)] border-[rgba(224,160,74,0.3)] text-[#8a5a1e]'
                  : 'border-[rgba(30,26,20,0.09)] text-[#7A7268] hover:border-[rgba(30,26,20,0.18)] hover:text-[#1E1A14]'
              }`}
            >
              Concept
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${filter === 'draft' ? 'bg-[#E0A04A] text-white' : 'bg-[rgba(30,26,20,0.06)] text-[#7A7268]'}`}>{courses.filter(c => c.status === 'draft').length}</span>
            </button>
            <button
              onClick={() => setFilter('archived')}
              className={`text-[11.5px] font-medium px-3.5 py-1 rounded-full border cursor-pointer transition flex items-center gap-1.5 ${
                filter === 'archived'
                  ? 'bg-[rgba(122,114,104,0.1)] border-[rgba(122,114,104,0.3)] text-[#5a534a]'
                  : 'border-[rgba(30,26,20,0.09)] text-[#7A7268] hover:border-[rgba(30,26,20,0.18)] hover:text-[#1E1A14]'
              }`}
            >
              Gearchiveerd
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${filter === 'archived' ? 'bg-[#7A7268] text-white' : 'bg-[rgba(30,26,20,0.06)] text-[#7A7268]'}`}>{courses.filter(c => c.status === 'archived').length}</span>
            </button>
            <div className="ml-auto relative">
              <svg className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-[#7A7268]" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
              </svg>
              <input
                type="text"
                placeholder="Zoeken..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#FAF8F4] border border-[rgba(30,26,20,0.09)] rounded-full py-1 px-3 pl-8 text-[12px] outline-none w-[200px] focus:border-[rgba(196,162,101,0.4)] focus:w-[240px] transition-all"
              />
            </div>
          </div>

          {/* Course Cards Grid */}
          {loadingCourses ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-[#7A7268] text-[14px]">Laden...</div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-2.5">
              <div className="text-[40px] opacity-40">📚</div>
              <p className="text-[15px] font-normal text-[#7A7268]">
                Geen cursussen gevonden
              </p>
              <p className="text-[12px] text-[rgba(30,26,20,0.35)] max-w-[280px] leading-relaxed">
                {filter === 'all' && !searchQuery
                  ? 'Maak je eerste cursus aan om te beginnen'
                  : 'Probeer een andere filter of zoekterm'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-3">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className={`bg-[#FAF8F4] border border-[rgba(30,26,20,0.09)] rounded-[14px] overflow-hidden transition-all cursor-pointer hover:border-[rgba(196,162,101,0.3)] hover:shadow-[0_4px_18px_rgba(30,26,20,0.08)] hover:-translate-y-px ${
                    course.status === 'archived' ? 'bg-[#E8E3DB] opacity-60' : ''
                  }`}
                  onClick={() => router.push(`/admin/courses/${course.id}/builder`)}
                >
                  {/* Thumbnail */}
                  <div className="w-full aspect-video bg-gradient-to-br from-[#1e1a12] to-[#0f0c07] relative overflow-hidden flex items-center justify-center">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-[rgba(196,162,101,0.2)]">
                        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="0.75">
                          <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/>
                        </svg>
                      </div>
                    )}
                    <span className={`absolute top-2.5 left-2.5 text-[8.5px] font-bold tracking-[0.14em] uppercase px-2.5 py-1 rounded-full ${
                      course.status === 'published'
                        ? 'bg-[#4CAF82] text-white'
                        : course.status === 'archived'
                        ? 'bg-[#7A7268] text-white'
                        : 'bg-[#E0A04A] text-white'
                    }`}>
                      {course.status === 'archived' ? 'GEARCHIVEERD' : course.status === 'published' ? 'LIVE' : 'CONCEPT'}
                    </span>
                    <span className="absolute top-2.5 right-2.5 text-[8.5px] font-semibold tracking-[0.12em] uppercase px-2 py-1 rounded-full bg-[rgba(12,10,7,0.6)] backdrop-blur-md text-[rgba(250,248,244,0.6)] border border-[rgba(255,255,255,0.08)]">
                      {course.level}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-4">
                    <p className="font-['Cormorant_Garamond',serif] text-[18px] font-normal text-[#1E1A14] tracking-[-0.01em] mb-0.5">
                      {course.title}
                    </p>
                    <p className="text-[11.5px] text-[#7A7268] font-light mb-3">
                      {course.description || 'Geen beschrijving'}
                    </p>

                    {/* Meta */}
                    <div className="flex gap-3.5 mb-3.5">
                      <div className="flex items-center gap-1 text-[11px] text-[#7A7268]">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/>
                        </svg>
                        {course.lessons_count || 0} lessen
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-[#7A7268]">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        {formatDuration(course.duration_minutes || 0)}
                      </div>
                      {course.has_quiz && (
                        <div className="flex items-center gap-1 text-[11px] text-[#7A7268]">
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          Eindtoets
                        </div>
                      )}
                    </div>

                    {/* Earnings Row */}
                    <div className="flex items-center justify-between py-2.5 border-y border-[rgba(30,26,20,0.09)] mb-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#7A7268]">
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                          <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>
                        </svg>
                        <strong className="text-[14px] font-semibold text-[#1E1A14]">
                          {course.students_count || 0}
                        </strong>
                        {' '}studenten
                      </div>
                      <div className="text-right">
                        <div className="font-['Cormorant_Garamond',serif] text-[18px] font-light text-[#1E1A14] leading-none tracking-[-0.01em]">
                          {formatRevenue((course.price || 0) * (course.students_count || 0))}
                        </div>
                        <div className="text-[9.5px] text-[#7A7268] tracking-[0.1em] uppercase">
                          Omzet
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div
                      className="flex gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => router.push(`/admin/courses/${course.id}/builder`)}
                        className="flex-1 text-[12px] font-medium py-2 px-3 rounded-lg border-none bg-[#C4A265] text-white hover:bg-[#DFC08A] transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={course.status === 'archived'}
                      >
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"/>
                        </svg>
                        {course.status === 'archived' ? 'Gearchiveerd' : 'Bewerken'}
                      </button>
                      {course.status === 'archived' ? (
                        <button
                          onClick={() => handleArchiveCourse(course.id, course.status)}
                          className="flex-1 text-[12px] font-medium py-2 px-3 rounded-lg border border-[rgba(76,175,130,0.3)] bg-[rgba(76,175,130,0.08)] text-[#2d6b4f] hover:bg-[rgba(76,175,130,0.15)] transition flex items-center justify-center gap-1.5"
                        >
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          Dearchiveren
                        </button>
                      ) : (
                        <button
                          onClick={() => router.push(`/courses/${course.slug}`)}
                          className="flex-1 text-[12px] font-medium py-2 px-3 rounded-lg border border-[rgba(30,26,20,0.09)] bg-[#F0EDE6] text-[#7A7268] hover:text-[#1E1A14] hover:border-[rgba(30,26,20,0.22)] transition flex items-center justify-center gap-1.5"
                        >
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          </svg>
                          Preview
                        </button>
                      )}
                      <button
                        onClick={() => handleArchiveCourse(course.id, course.status)}
                        className="flex-0 flex-shrink-0 text-[12px] font-medium py-2 px-2.5 rounded-lg border border-[rgba(30,26,20,0.09)] bg-transparent text-[#7A7268] hover:bg-[rgba(224,90,78,0.08)] hover:border-[rgba(224,90,78,0.3)] hover:text-[#E05A4E] transition"
                        title={course.status === 'archived' ? 'De-archiveren' : 'Archiveren'}
                      >
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-.375c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v.375c0 .621.504 1.125 1.125 1.125z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* New Course Card */}
              <div
                onClick={() => setShowModal(true)}
                className="bg-transparent border-1.5 border-dashed border-[rgba(196,162,101,0.25)] rounded-[14px] flex flex-col items-center justify-center gap-2.5 px-6 py-10 cursor-pointer hover:border-[rgba(196,162,101,0.5)] hover:bg-[rgba(196,162,101,0.03)] transition text-center min-h-[280px]"
              >
                <div className="w-12 h-12 rounded-xl bg-[rgba(196,162,101,0.1)] border border-[rgba(196,162,101,0.2)] flex items-center justify-center text-[#C4A265] mb-1">
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 4.5v15m7.5-7.5h-15"/>
                  </svg>
                </div>
                <p className="font-['Cormorant_Garamond',serif] text-[17px] font-normal text-[#1E1A14]">
                  Nieuwe cursus
                </p>
                <p className="text-[11.5px] text-[#7A7268] font-light leading-relaxed">
                  Maak een nieuwe cursus aan en begin met bouwen in de course builder
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-[rgba(12,10,7,0.45)] backdrop-blur-sm z-[200] flex items-center justify-center"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[#FAF8F4] rounded-[18px] p-7 w-[480px] max-w-[90vw] shadow-[0_24px_64px_rgba(12,10,7,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-['Cormorant_Garamond',serif] text-[22px] font-normal text-[#1E1A14] mb-1.5">
              Nieuwe cursus aanmaken
            </p>
            <p className="text-[12.5px] text-[#7A7268] font-light mb-5.5 leading-relaxed">
              Vul de basisgegevens in. Alles kun je later verder aanpassen in de course builder.
            </p>

            <div className="flex flex-col gap-3 mb-5">
              <div>
                <label className="text-[10.5px] font-medium text-[#7A7268] tracking-[0.06em] block mb-0.5">
                  Cursusnaam
                </label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  placeholder="bijv. Wispy Lash Mastery"
                  className="w-full bg-white border border-[rgba(30,26,20,0.09)] rounded-lg py-2 px-3 text-[13px] outline-none focus:border-[rgba(196,162,101,0.45)] focus:shadow-[0_0_0_3px_rgba(196,162,101,0.06)] transition"
                />
              </div>
              <div>
                <label className="text-[10.5px] font-medium text-[#7A7268] tracking-[0.06em] block mb-0.5">
                  Niveau
                </label>
                <select
                  value={newCourse.level}
                  onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                  className="w-full bg-white border border-[rgba(30,26,20,0.09)] rounded-lg py-2 px-3 text-[13px] outline-none focus:border-[rgba(196,162,101,0.45)] focus:shadow-[0_0_0_3px_rgba(196,162,101,0.06)] transition appearance-none cursor-pointer"
                >
                  <option value="">Kies niveau</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Gevorderd</option>
                </select>
              </div>
              <div>
                <label className="text-[10.5px] font-medium text-[#7A7268] tracking-[0.06em] block mb-0.5">
                  Korte omschrijving
                </label>
                <input
                  type="text"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="bijv. Vervolgmodule — Wispy techniek"
                  className="w-full bg-white border border-[rgba(30,26,20,0.09)] rounded-lg py-2 px-3 text-[13px] outline-none focus:border-[rgba(196,162,101,0.45)] focus:shadow-[0_0_0_3px_rgba(196,162,101,0.06)] transition"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 text-[13px] font-normal py-2.5 rounded-full border border-[rgba(30,26,20,0.09)] bg-transparent cursor-pointer text-[#7A7268] hover:text-[#1E1A14] hover:border-[rgba(30,26,20,0.22)] transition"
              >
                Annuleren
              </button>
              <button
                onClick={handleCreateCourse}
                className="flex-[2] text-[13px] font-semibold py-2.5 rounded-full bg-[#C4A265] text-white border-none cursor-pointer hover:bg-[#DFC08A] hover:shadow-[0_4px_14px_rgba(196,162,101,0.28)] transition"
              >
                Aanmaken & bouwen →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status badge styles */}
      <style jsx>{`
        .status-live {
          background: #4CAF82;
          color: white;
        }
        .status-concept {
          background: #E0A04A;
          color: white;
        }
        .status-archived {
          background: #7A7268;
          color: white;
        }
      `}</style>
    </>
  )
}
