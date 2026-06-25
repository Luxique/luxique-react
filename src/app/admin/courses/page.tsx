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
  revenue?: number
  has_quiz?: boolean
  has_certificate?: boolean
  what_you_learn?: string[]
}

export default function CoursesOverviewPage() {
  const { user, role, loading, signOut } = useAuth()
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
  const [editingDesc, setEditingDesc] = useState<string | null>(null)
  const [descDraft, setDescDraft] = useState('')
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [academyCardData, setAcademyCardData] = useState({ description: '', whatYouLearn: [] as string[] })
  const [uploadingThumb, setUploadingThumb] = useState(false)

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

          // Count enrollments + get actual payment amounts
          const { data: enrollmentData } = await supabase
            .from('enrollments')
            .select('payment_amount, payment_method')
            .eq('course_id', course.id)

          const enrollmentsCount = enrollmentData?.length || 0
          const courseRevenue = enrollmentData?.reduce((sum, e) => sum + (e.payment_amount || 0), 0) || 0

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
            revenue: courseRevenue,
            duration_minutes: totalMinutes
          }
        })
      )

      setCourses(coursesWithCounts)

      // Calculate stats — echte data uit payment_amount
      const totalStudents = coursesWithCounts.reduce((sum, c) => sum + (c.students_count || 0), 0)
      const totalRevenue = coursesWithCounts.reduce((sum, c) => sum + (c.revenue || 0), 0)

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

  // Thumbnail upload
  const handleThumbnailUpload = async (courseId: string, file: File | undefined) => {
    if (!file) return
    setUploadingThumb(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${courseId}/thumbnail-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('course-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage
        .from('course-images')
        .getPublicUrl(fileName)
      const thumbUrl = `${urlData.publicUrl}?width=800&quality=80&resize=contain`
      const { error: updateError } = await supabase
        .from('courses')
        .update({ thumbnail_url: thumbUrl })
        .eq('id', courseId)
      if (updateError) throw updateError
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, thumbnail_url: thumbUrl } : c))
    } catch (err) {
      alert('Thumbnail upload mislukt: ' + (err instanceof Error ? err.message : 'Onbekend'))
    } finally {
      setUploadingThumb(false)
    }
  }

  // Thumbnail delete
  const handleThumbnailDelete = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ thumbnail_url: null })
        .eq('id', courseId)
      if (error) throw error
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, thumbnail_url: undefined } : c))
    } catch (err) {
      alert('Verwijderen mislukt: ' + (err instanceof Error ? err.message : 'Onbekend'))
    }
  }

  // Description save
  const handleDescSave = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ description: descDraft })
        .eq('id', courseId)
      if (error) throw error
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, description: descDraft } : c))
      setEditingDesc(null)
    } catch (err) {
      alert('Opslaan mislukt: ' + (err instanceof Error ? err.message : 'Onbekend'))
    }
  }

  // Academy card modal
  const openAcademyCardModal = (course: Course) => {
    setEditingCourseId(course.id)
    setAcademyCardData({
      description: course.description || '',
      whatYouLearn: course.what_you_learn || []
    })
  }

  const handleAcademyCardSave = async () => {
    if (!editingCourseId) return
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          description: academyCardData.description,
          what_you_learn: academyCardData.whatYouLearn
        })
        .eq('id', editingCourseId)
      if (error) throw error
      setCourses(prev => prev.map(c => c.id === editingCourseId ? { ...c, description: academyCardData.description, what_you_learn: academyCardData.whatYouLearn } : c))
      setEditingCourseId(null)
    } catch (err) {
      alert('Opslaan mislukt: ' + (err instanceof Error ? err.message : 'Onbekend'))
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
    return <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center pt-[50px]"><div className="text-[#888] text-[14px]">Laden...</div></div>
  }

  if (!user || role !== 'admin') {
    return <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center flex-col gap-4 pt-[50px]"><div className="text-[#888] text-[14px]">Geen toegang.</div><a href="/admin" className="text-[13px] text-[#C4A265]">← Admin</a></div>
  }

  const filteredCourses = getFilteredCourses()

  return (
    <>
      <style jsx global>{`
        html, body {
          font-family: 'Outfit', sans-serif;
          -webkit-font-smoothing: antialiased;
        }
      `}</style>

      <div className="min-h-screen bg-[#F5F5F4] pt-[50px]">
        {/* Admin topbar */}
        <div className="bg-white border-b border-[#eee] px-6 py-4 sticky top-[50px] z-30">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-[10px] bg-[#0C0A07] text-white px-2.5 py-1 rounded-full font-bold tracking-[0.12em] uppercase">LXQ Admin</span>
              <h1 className="font-['Cormorant_Garamond'] text-[24px] text-[#1a1a1a]">Cursussen</h1>
            </div>
            <div className="flex items-center gap-3">
              <a href="/" className="text-[12px] text-[#888] hover:text-[#1a1a1a] px-3 py-1.5 rounded-full border border-[#eee]">← Website</a>
              <button onClick={() => setShowModal(true)} className="text-[12px] text-white px-3 py-1.5 rounded-full bg-[#0C0A07] hover:bg-[#333] transition">+ Nieuwe cursus</button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
          {/* Admin sidebar */}
          <div className="w-[220px] shrink-0">
            <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden sticky top-[120px]">
              <a href="/admin" className="w-full flex items-center gap-3 px-5 py-3.5 text-[13px] border-b border-[#f5f5f5] text-[#666] hover:bg-[#fafafa] transition">📊 Overzicht</a>
              <a href="/admin/customers" className="w-full flex items-center gap-3 px-5 py-3.5 text-[13px] border-b border-[#f5f5f5] text-[#666] hover:bg-[#fafafa] transition">👥 Klanten</a>
              <div className="w-full flex items-center gap-3 px-5 py-3.5 text-[13px] bg-[#0C0A07] text-white border-b border-[#f5f5f5]">📚 Cursussen</div>
              <a href="/admin" className="w-full flex items-center gap-3 px-5 py-3.5 text-[13px] border-b border-[#f5f5f5] text-[#666] hover:bg-[#fafafa] transition">📅 Agenda</a>
              <a href="/admin" className="w-full flex items-center gap-3 px-5 py-3.5 text-[13px] border-b border-[#f5f5f5] text-[#666] hover:bg-[#fafafa] transition">💶 Financiën</a>
              <div onClick={() => setShowModal(true)} className="w-full flex items-center gap-3 px-5 py-4 text-[13px] border-t-2 border-[#C4A265]/20 bg-[#C4A265]/5 text-[#C4A265] font-semibold hover:bg-[#C4A265]/10 transition cursor-pointer">➕ Nieuwe cursus</div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">

          {/* Stats Strip — 3 tegels (voltooiingsrate verwijderd) */}
          <div className="grid grid-cols-3 gap-2.5 mb-6">
            <div className="bg-white border border-[#eee] rounded-[14px] p-4 px-5">
              <div className="font-['Cormorant_Garamond',serif] text-[32px] font-light text-[#1a1a1a] leading-none tracking-[-0.02em] mb-0.5">
                {courses.filter(c => c.status === 'published').length}
              </div>
              <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#888]">
                Live cursussen
              </div>
            </div>
            <div
              className="bg-white border border-[#eee] rounded-[14px] p-4 px-5 cursor-pointer hover:border-[rgba(196,162,101,0.3)] transition"
              onClick={() => router.push('/admin/customers')}
            >
              <div className="font-['Cormorant_Garamond',serif] text-[32px] font-light text-[#1a1a1a] leading-none tracking-[-0.02em] mb-0.5">
                {stats.totalStudents}
              </div>
              <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#888]">
                Studenten →
              </div>
            </div>
            <div className="bg-white border border-[#eee] rounded-[14px] p-4 px-5">
              <div className="font-['Cormorant_Garamond',serif] text-[32px] font-light text-[#1a1a1a] leading-none tracking-[-0.02em] mb-0.5">
                {formatRevenue(stats.totalRevenue)}
              </div>
              <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#888]">
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
                  : 'border-[#eee] text-[#888] hover:border-[rgba(30,26,20,0.18)] hover:text-[#1a1a1a]'
              }`}
            >
              Alle cursussen
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${filter === 'all' ? 'bg-[#C4A265] text-white' : 'bg-[rgba(30,26,20,0.06)] text-[#888]'}`}>{courses.length}</span>
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`text-[11.5px] font-medium px-3.5 py-1 rounded-full border cursor-pointer transition flex items-center gap-1.5 ${
                filter === 'published'
                  ? 'bg-[rgba(76,175,130,0.1)] border-[rgba(76,175,130,0.3)] text-[#2d6b4f]'
                  : 'border-[#eee] text-[#888] hover:border-[rgba(30,26,20,0.18)] hover:text-[#1a1a1a]'
              }`}
            >
              Live
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${filter === 'published' ? 'bg-[#4CAF82] text-white' : 'bg-[rgba(30,26,20,0.06)] text-[#888]'}`}>{courses.filter(c => c.status === 'published').length}</span>
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`text-[11.5px] font-medium px-3.5 py-1 rounded-full border cursor-pointer transition flex items-center gap-1.5 ${
                filter === 'draft'
                  ? 'bg-[rgba(224,160,74,0.1)] border-[rgba(224,160,74,0.3)] text-[#8a5a1e]'
                  : 'border-[#eee] text-[#888] hover:border-[rgba(30,26,20,0.18)] hover:text-[#1a1a1a]'
              }`}
            >
              Concept
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${filter === 'draft' ? 'bg-[#E0A04A] text-white' : 'bg-[rgba(30,26,20,0.06)] text-[#888]'}`}>{courses.filter(c => c.status === 'draft').length}</span>
            </button>
            <button
              onClick={() => setFilter('archived')}
              className={`text-[11.5px] font-medium px-3.5 py-1 rounded-full border cursor-pointer transition flex items-center gap-1.5 ${
                filter === 'archived'
                  ? 'bg-[rgba(122,114,104,0.1)] border-[rgba(122,114,104,0.3)] text-[#5a534a]'
                  : 'border-[#eee] text-[#888] hover:border-[rgba(30,26,20,0.18)] hover:text-[#1a1a1a]'
              }`}
            >
              Gearchiveerd
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${filter === 'archived' ? 'bg-[#7A7268] text-white' : 'bg-[rgba(30,26,20,0.06)] text-[#888]'}`}>{courses.filter(c => c.status === 'archived').length}</span>
            </button>
            <div className="ml-auto relative">
              <svg className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-[#888]" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
              </svg>
              <input
                type="text"
                placeholder="Zoeken..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-[#eee] rounded-full py-1 px-3 pl-8 text-[12px] outline-none w-[200px] focus:border-[rgba(196,162,101,0.4)] focus:w-[240px] transition-all"
              />
            </div>
          </div>

          {/* Course Cards Grid */}
          {loadingCourses ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-[#888] text-[14px]">Laden...</div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-2.5">
              <div className="text-[40px] opacity-40">📚</div>
              <p className="text-[15px] font-normal text-[#888]">
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
                  className={`bg-white border border-[#eee] rounded-[14px] overflow-hidden transition-all cursor-pointer hover:border-[rgba(196,162,101,0.3)] hover:shadow-[0_4px_18px_rgba(30,26,20,0.08)] hover:-translate-y-px ${
                    course.status === 'archived' ? 'bg-[#f0f0f0] opacity-60' : ''
                  }`}
                  onClick={() => router.push(`/admin/courses/${course.id}/builder`)}
                >
                  {/* Thumbnail */}
                  <div
                    className="w-full aspect-video bg-gradient-to-br from-[#1e1a12] to-[#0f0c07] relative overflow-hidden flex items-center justify-center group/thumb"
                    onClick={(e) => e.stopPropagation()}
                  >
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
                    {/* Thumbnail upload/edit/delete overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover/thumb:opacity-100">
                      <label className="cursor-pointer bg-white/90 hover:bg-white text-[#1a1a1a] text-[11px] font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
                        {course.thumbnail_url ? 'Wijzig' : 'Upload'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleThumbnailUpload(course.id, e.target.files?.[0])}
                        />
                      </label>
                      {course.thumbnail_url && (
                        <button
                          onClick={() => handleThumbnailDelete(course.id)}
                          className="bg-white/90 hover:bg-red-50 text-[#888] hover:text-red-500 text-[11px] font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
                          title="Verwijder thumbnail"
                        >
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                        </button>
                      )}
                    </div>
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
                    <p className="font-['Cormorant_Garamond',serif] text-[18px] font-normal text-[#1a1a1a] tracking-[-0.01em] mb-0.5">
                      {course.title}
                    </p>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="text-[11.5px] text-[#888] font-light flex-1">
                        {course.description || 'Geen beschrijving'}
                      </p>
                      <button
                        onClick={(e) => { e.stopPropagation(); openAcademyCardModal(course) }}
                        className="flex-shrink-0 text-[10px] text-[#aaa] hover:text-[#C4A265] transition mt-0.5"
                        title="Bewerk academy card velden"
                      >
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"/></svg>
                      </button>
                    </div>
                    {editingDesc === course.id && (
                      <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                        <textarea
                          value={descDraft}
                          onChange={(e) => setDescDraft(e.target.value)}
                          className="w-full text-[12px] border border-[#C4A265] rounded-lg p-2 outline-none resize-none"
                          rows={3}
                          placeholder="Cursus beschrijving..."
                          autoFocus
                        />
                        <div className="flex gap-1.5 mt-1.5">
                          <button
                            onClick={() => handleDescSave(course.id)}
                            className="text-[11px] font-medium px-3 py-1 rounded-lg bg-[#C4A265] text-white hover:bg-[#DFC08A] transition"
                          >Opslaan</button>
                          <button
                            onClick={() => setEditingDesc(null)}
                            className="text-[11px] font-medium px-3 py-1 rounded-lg border border-[#eee] text-[#888] hover:bg-[#f5f5f5] transition"
                          >Annuleer</button>
                        </div>
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex gap-3.5 mb-3.5">
                      <div className="flex items-center gap-1 text-[11px] text-[#888]">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/>
                        </svg>
                        {course.lessons_count || 0} lessen
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-[#888]">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        {formatDuration(course.duration_minutes || 0)}
                      </div>
                      {course.has_quiz && (
                        <div className="flex items-center gap-1 text-[11px] text-[#888]">
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          Eindtoets
                        </div>
                      )}
                    </div>

                    {/* Earnings Row */}
                    <div className="flex items-center justify-between py-2.5 border-y border-[#eee] mb-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#888]">
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                          <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>
                        </svg>
                        <strong className="text-[14px] font-semibold text-[#1a1a1a]">
                          {course.students_count || 0}
                        </strong>
                        {' '}studenten
                      </div>
                      <div className="text-right">
                        <div className="font-['Cormorant_Garamond',serif] text-[18px] font-light text-[#1a1a1a] leading-none tracking-[-0.01em]">
                          {formatRevenue(course.revenue || 0)}
                        </div>
                        <div className="text-[9.5px] text-[#888] tracking-[0.1em] uppercase">
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
                          className="flex-1 text-[12px] font-medium py-2 px-3 rounded-lg border border-[#eee] bg-[#f5f5f5] text-[#888] hover:text-[#1a1a1a] hover:border-[rgba(30,26,20,0.22)] transition flex items-center justify-center gap-1.5"
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
                        className="flex-0 flex-shrink-0 text-[12px] font-medium py-2 px-2.5 rounded-lg border border-[#eee] bg-transparent text-[#888] hover:bg-[rgba(224,90,78,0.08)] hover:border-[rgba(224,90,78,0.3)] hover:text-[#E05A4E] transition"
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
                <p className="font-['Cormorant_Garamond',serif] text-[17px] font-normal text-[#1a1a1a]">
                  Nieuwe cursus
                </p>
                <p className="text-[11.5px] text-[#888] font-light leading-relaxed">
                  Maak een nieuwe cursus aan en begin met bouwen in de course builder
                </p>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-[rgba(12,10,7,0.45)] backdrop-blur-sm z-[200] flex items-center justify-center"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-[18px] p-7 w-[480px] max-w-[90vw] shadow-[0_24px_64px_rgba(12,10,7,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-['Cormorant_Garamond',serif] text-[22px] font-normal text-[#1a1a1a] mb-1.5">
              Nieuwe cursus aanmaken
            </p>
            <p className="text-[12.5px] text-[#888] font-light mb-5.5 leading-relaxed">
              Vul de basisgegevens in. Alles kun je later verder aanpassen in de course builder.
            </p>

            <div className="flex flex-col gap-3 mb-5">
              <div>
                <label className="text-[10.5px] font-medium text-[#888] tracking-[0.06em] block mb-0.5">
                  Cursusnaam
                </label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  placeholder="bijv. Wispy Lash Mastery"
                  className="w-full bg-white border border-[#eee] rounded-lg py-2 px-3 text-[13px] outline-none focus:border-[rgba(196,162,101,0.45)] focus:shadow-[0_0_0_3px_rgba(196,162,101,0.06)] transition"
                />
              </div>
              <div>
                <label className="text-[10.5px] font-medium text-[#888] tracking-[0.06em] block mb-0.5">
                  Niveau
                </label>
                <select
                  value={newCourse.level}
                  onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                  className="w-full bg-white border border-[#eee] rounded-lg py-2 px-3 text-[13px] outline-none focus:border-[rgba(196,162,101,0.45)] focus:shadow-[0_0_0_3px_rgba(196,162,101,0.06)] transition appearance-none cursor-pointer"
                >
                  <option value="">Kies niveau</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Gevorderd</option>
                </select>
              </div>
              <div>
                <label className="text-[10.5px] font-medium text-[#888] tracking-[0.06em] block mb-0.5">
                  Korte omschrijving
                </label>
                <input
                  type="text"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="bijv. Vervolgmodule — Wispy techniek"
                  className="w-full bg-white border border-[#eee] rounded-lg py-2 px-3 text-[13px] outline-none focus:border-[rgba(196,162,101,0.45)] focus:shadow-[0_0_0_3px_rgba(196,162,101,0.06)] transition"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 text-[13px] font-normal py-2.5 rounded-full border border-[#eee] bg-transparent cursor-pointer text-[#888] hover:text-[#1a1a1a] hover:border-[rgba(30,26,20,0.22)] transition"
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

      {/* Academy Card Edit Modal */}
      {editingCourseId && (
        <div className="fixed inset-0 bg-[rgba(12,10,7,0.45)] backdrop-blur-sm z-[200] flex items-center justify-center" onClick={() => setEditingCourseId(null)}>
          <div className="bg-white rounded-[18px] p-7 w-[480px] max-w-[90vw] shadow-[0_24px_64px_rgba(12,10,7,0.2)]" onClick={(e) => e.stopPropagation()}>
            <p className="font-['Cormorant_Garamond',serif] text-[22px] font-normal text-[#1a1a1a] mb-1.5">
              Academy card bewerken
            </p>
            <p className="text-[12.5px] text-[#888] font-light mb-5.5 leading-relaxed">
              Deze velden verschijnen op de publieke academy cursuskaarten.
            </p>
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="text-[10.5px] font-medium text-[#888] tracking-[0.06em] block mb-0.5">Korte beschrijving</label>
                <textarea
                  value={academyCardData.description}
                  onChange={(e) => setAcademyCardData({ ...academyCardData, description: e.target.value })}
                  rows={2}
                  className="w-full bg-white border border-[#eee] rounded-lg py-2 px-3 text-[13px] outline-none focus:border-[rgba(196,162,101,0.45)] resize-none"
                  placeholder="bijv. Vervolgmodule — Wispy techniek"
                />
              </div>
              <div>
                <label className="text-[10.5px] font-medium text-[#888] tracking-[0.06em] block mb-0.5">Academy card bolletjes (features)</label>
                {academyCardData.whatYouLearn.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1.5">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updated = [...academyCardData.whatYouLearn]
                        updated[i] = e.target.value
                        setAcademyCardData({ ...academyCardData, whatYouLearn: updated })
                      }}
                      className="flex-1 bg-white border border-[#eee] rounded-lg py-2 px-3 text-[13px] outline-none focus:border-[rgba(196,162,101,0.45)]"
                      placeholder="bijv. Online lessen"
                    />
                    <button
                      onClick={() => setAcademyCardData({ ...academyCardData, whatYouLearn: academyCardData.whatYouLearn.filter((_, j) => j !== i) })}
                      className="text-[#aaa] hover:text-red-500 p-1 text-[16px]"
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setAcademyCardData({ ...academyCardData, whatYouLearn: [...academyCardData.whatYouLearn, ''] })}
                  className="text-[12px] text-[#C4A265] hover:text-[#7A6340] transition font-medium"
                >+ Bolletje toevoegen</button>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditingCourseId(null)} className="flex-1 text-[13px] font-normal py-2.5 rounded-full border border-[#eee] bg-transparent cursor-pointer text-[#888] hover:text-[#1a1a1a] hover:border-[rgba(30,26,20,0.22)] transition">Annuleren</button>
              <button onClick={handleAcademyCardSave} className="flex-[2] text-[13px] font-semibold py-2.5 rounded-full bg-[#C4A265] text-white border-none cursor-pointer hover:bg-[#DFC08A] hover:shadow-[0_4px_14px_rgba(196,162,101,0.28)] transition">Opslaan</button>
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
