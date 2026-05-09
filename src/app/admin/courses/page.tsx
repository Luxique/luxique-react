'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase-client'

type Module = {
  id: string
  course_id: string
  title: string
  description: string | null
  sort_order: number
  lessons: Lesson[]
}

type Lesson = {
  id: string
  module_id: string
  title: string
  slug: string
  description: string | null
  video_url: string | null
  content: string | null
  duration_seconds: number
  sort_order: number
  is_free: boolean
}

type CourseData = {
  id: string
  title: string
  slug: string
  level: string
  price: number | null
  short_description: string | null
  description: string | null
  duration_text: string | null
  is_published: boolean
  thumbnail_url: string | null
  sort_order: number
}

export default function CourseBuilderPage() {
  const { user, role, loading } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<CourseData[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [course, setCourse] = useState<CourseData | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [saving, setSaving] = useState(false)
  const [editingLesson, setEditingLesson] = useState<{ moduleId: string; lesson: Lesson | null } | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!loading && !user) router.push('/login') }, [user, loading])

  const loadCourses = useCallback(() => {
    supabase.from('courses').select('*').order('sort_order').then(({ data }) => setCourses(data || []))
  }, [])

  useEffect(() => { loadCourses() }, [loadCourses])

  const loadCourse = useCallback(async (id: string) => {
    const { data: c } = await supabase.from('courses').select('*').eq('id', id).single()
    if (c) setCourse(c)

    const { data: mods } = await supabase.from('modules').select('*').eq('course_id', id).order('sort_order')
    if (mods) {
      const withLessons = await Promise.all(mods.map(async (m: Module) => {
        const { data: lessons } = await supabase.from('lessons').select('*').eq('module_id', m.id).order('sort_order')
        return { ...m, lessons: lessons || [] }
      }))
      setModules(withLessons)
    }
  }, [])

  useEffect(() => {
    if (selectedId) loadCourse(selectedId)
  }, [selectedId, loadCourse])

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  // ── Course CRUD ──
  const createCourse = async () => {
    setSaving(true)
    const { data } = await supabase.from('courses').insert({
      title: 'Nieuwe Cursus', slug: `nieuwe-cursus-${Date.now()}`, level: 'beginner', sort_order: courses.length + 1,
    }).select().single()
    if (data) { loadCourses(); setSelectedId(data.id) }
    setSaving(false)
  }

  const updateCourse = async (fields: Partial<CourseData>) => {
    if (!course) return
    setSaving(true)
    await supabase.from('courses').update(fields).eq('id', course.id)
    setCourse(prev => prev ? { ...prev, ...fields } : prev)
    loadCourses()
    setSaving(false)
  }

  const deleteCourse = async (id: string) => {
    if (!confirm('Cursus verwijderen? Alle modules en lessen worden ook verwijderd.')) return
    await supabase.from('courses').delete().eq('id', id)
    if (selectedId === id) { setSelectedId(null); setCourse(null); setModules([]) }
    loadCourses()
  }

  // ── Module CRUD ──
  const createModule = async () => {
    if (!course) return
    const { data } = await supabase.from('modules').insert({
      course_id: course.id, title: 'Nieuwe Module', sort_order: modules.length + 1,
    }).select().single()
    if (data) setModules(prev => [...prev, { ...data, lessons: [] }])
  }

  const updateModule = async (id: string, fields: Partial<Module>) => {
    await supabase.from('modules').update(fields).eq('id', id)
    setModules(prev => prev.map(m => m.id === id ? { ...m, ...fields } : m))
  }

  const deleteModule = async (id: string) => {
    await supabase.from('modules').delete().eq('id', id)
    setModules(prev => prev.filter(m => m.id !== id))
  }

  // ── Lesson CRUD ──
  const createLesson = async (moduleId: string) => {
    const mod = modules.find(m => m.id === moduleId)
    if (!mod) return
    const { data } = await supabase.from('lessons').insert({
      module_id: moduleId, title: 'Nieuwe Les', slug: `nieuwe-les-${Date.now()}`, sort_order: mod.lessons.length + 1, is_free: false,
    }).select().single()
    if (data) {
      setModules(prev => prev.map(m => m.id === moduleId ? { ...m, lessons: [...m.lessons, data] } : m))
      setEditingLesson({ moduleId, lesson: data })
    }
  }

  const updateLesson = async (id: string, moduleId: string, fields: Partial<Lesson>) => {
    await supabase.from('lessons').update(fields).eq('id', id)
    setModules(prev => prev.map(m => m.id === moduleId ? {
      ...m, lessons: m.lessons.map(l => l.id === id ? { ...l, ...fields } : l)
    } : m))
    if (editingLesson?.lesson?.id === id) {
      setEditingLesson({ moduleId, lesson: { ...editingLesson.lesson!, ...fields } as Lesson })
    }
  }

  const deleteLesson = async (id: string, moduleId: string) => {
    await supabase.from('lessons').delete().eq('id', id)
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, lessons: m.lessons.filter(l => l.id !== id) } : m))
    if (editingLesson?.lesson?.id === id) setEditingLesson(null)
  }

  if (loading) return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><div className="text-[#888] text-[14px]">Laden...</div></div>
  if (!user) return null
  if (role !== 'admin') return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center flex-col gap-4"><div className="text-[#888] text-[14px]">Geen toegang.</div><a href="/admin" className="text-[13px] text-[#D4AF37]">← Admin</a></div>

  return (
    <div className="min-h-screen bg-[#F5F5F4]">
      {/* Header */}
      <div className="bg-white border-b border-[#eee] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/admin" className="text-[12px] text-[#888] hover:text-[#1a1a1a] px-3 py-1.5 rounded-full border border-[#eee]">← Admin</a>
            <h1 className="font-['Cormorant_Garamond'] text-[24px] text-[#1a1a1a]">Cursus Builder</h1>
          </div>
          <button onClick={createCourse} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0C0A07] text-white text-[13px] font-medium hover:bg-[#333] transition disabled:opacity-50">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Nieuwe Cursus
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-[280px_1fr] gap-6">
          {/* ── Course list ── */}
          <div className="space-y-2">
            {courses.map(c => (
              <div key={c.id} className={`bg-white rounded-xl border p-4 cursor-pointer transition ${selectedId === c.id ? 'border-[#C4A265] shadow-sm' : 'border-[#eee] hover:border-[#ddd]'}`} onClick={() => setSelectedId(c.id)}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[14px] font-medium">{c.title}</p>
                    <p className="text-[11px] text-[#aaa] mt-0.5">{c.level} · {c.is_published ? 'Live' : 'Concept'}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteCourse(c.id) }} className="text-[11px] text-red-300 hover:text-red-500 p-1">✕</button>
                </div>
              </div>
            ))}
            {courses.length === 0 && <p className="text-[13px] text-[#888] p-4">Nog geen cursussen. Maak er een!</p>}
          </div>

          {/* ── Course editor ── */}
          {course ? (
            <div className="space-y-5">
              {/* Course details */}
              <div className="bg-white rounded-2xl border border-[#eee] p-6 space-y-4">
                <h3 className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[#888]">Cursus Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Titel</label>
                    <input value={course.title} onChange={e => updateCourse({ title: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265]" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Slug</label>
                    <input value={course.slug} onChange={e => updateCourse({ slug: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[14px] font-mono focus:outline-none focus:border-[#C4A265]" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Level</label>
                    <select value={course.level} onChange={e => updateCourse({ level: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265]">
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Prijs (€)</label>
                    <input type="number" value={course.price ?? ''} onChange={e => updateCourse({ price: e.target.value ? Number(e.target.value) : null })} placeholder="Leeg = gratis" className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265]" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Korte beschrijving</label>
                    <input value={course.short_description || ''} onChange={e => updateCourse({ short_description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265]" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Beschrijving</label>
                    <textarea rows={3} value={course.description || ''} onChange={e => updateCourse({ description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265] resize-none" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Duur tekst</label>
                    <input value={course.duration_text || ''} onChange={e => updateCourse({ duration_text: e.target.value })} placeholder="bijv. 12 lessen · ~6 uur" className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265]" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Thumbnail URL</label>
                    <input value={course.thumbnail_url || ''} onChange={e => updateCourse({ thumbnail_url: e.target.value })} placeholder="https://..." className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265]" />
                  </div>
                  <div className="col-span-2 flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={course.is_published} onChange={e => updateCourse({ is_published: e.target.checked })} className="w-4 h-4 rounded" />
                      <span className="text-[13px]">Gepubliceerd</span>
                    </label>
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${course.is_published ? 'bg-green-50 text-green-600' : 'bg-[#f5f5f5] text-[#888]'}`}>{course.is_published ? 'Live' : 'Concept'}</span>
                  </div>
                </div>
              </div>

              {/* Modules */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[#888]">Modules & Lessen</h3>
                  <button onClick={createModule} className="text-[12px] px-4 py-2 rounded-full border border-[#ddd] text-[#888] hover:border-[#C4A265] hover:text-[#C4A265] transition">+ Module</button>
                </div>

                {modules.map((mod, mi) => (
                  <div key={mod.id} className="bg-white rounded-2xl border border-[#eee] overflow-hidden">
                    {/* Module header */}
                    <div className="flex items-center gap-3 px-5 py-4 bg-[#fafafa] border-b border-[#eee]">
                      <span className="text-[11px] font-bold text-[#aaa]">{mi + 1}</span>
                      <input value={mod.title} onChange={e => updateModule(mod.id, { title: e.target.value })} className="flex-1 text-[14px] font-medium bg-transparent focus:outline-none" />
                      <button onClick={() => deleteModule(mod.id)} className="text-[11px] text-red-300 hover:text-red-500">Verwijder</button>
                    </div>

                    {/* Lessons */}
                    <div className="divide-y divide-[#f5f5f5]">
                      {mod.lessons.map((lesson, li) => (
                        <div key={lesson.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#fafafa]">
                          <span className="text-[10px] text-[#aaa]">{li + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium truncate">{lesson.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-[#aaa]">{lesson.slug}</span>
                              {lesson.video_url && <span className="text-[10px] text-purple-400">🎬 video</span>}
                              {lesson.is_free && <span className="text-[10px] bg-[#C4A265]/10 text-[#C4A265] px-1.5 py-0.5 rounded-full">gratis</span>}
                            </div>
                          </div>
                          <button onClick={() => setEditingLesson({ moduleId: mod.id, lesson })} className="text-[11px] px-3 py-1 rounded-full border border-[#ddd] text-[#888] hover:border-[#C4A265] hover:text-[#C4A265]">Bewerk</button>
                          <button onClick={() => deleteLesson(lesson.id, mod.id)} className="text-[11px] text-red-300 hover:text-red-500">✕</button>
                        </div>
                      ))}
                      <button onClick={() => createLesson(mod.id)} className="w-full text-left px-5 py-3 text-[12px] text-[#C4A265] hover:bg-[#C4A265]/5 transition">+ Les toevoegen</button>
                    </div>
                  </div>
                ))}

                {modules.length === 0 && (
                  <div className="bg-white rounded-2xl border border-[#eee] p-8 text-center">
                    <p className="text-[14px] text-[#888]">Nog geen modules. Voeg een module toe om te beginnen!</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#eee] p-16 text-center">
              <div className="text-4xl mb-4">📚</div>
              <p className="text-[14px] text-[#888]">Selecteer een cursus of maak een nieuwe</p>
            </div>
          )}
        </div>
      </div>

      {/* Lesson edit modal */}
      {editingLesson && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center" onClick={() => setEditingLesson(null)}>
          <div className="bg-white rounded-2xl p-8 w-[560px] shadow-2xl border border-[#eee] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-['Cormorant_Garamond'] text-[24px] mb-6">Les bewerken</h3>
            {editingLesson.lesson && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Titel</label>
                  <input value={editingLesson.lesson.title} onChange={e => updateLesson(editingLesson.lesson!.id, editingLesson.moduleId, { title: e.target.value, slug: slugify(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265]" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Slug</label>
                  <input value={editingLesson.lesson.slug} onChange={e => updateLesson(editingLesson.lesson!.id, editingLesson.moduleId, { slug: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[14px] font-mono focus:outline-none focus:border-[#C4A265]" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Video URL</label>
                  <input value={editingLesson.lesson.video_url || ''} onChange={e => updateLesson(editingLesson.lesson!.id, editingLesson.moduleId, { video_url: e.target.value || null })} placeholder="https://..." className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265]" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Duur (seconden)</label>
                  <input type="number" value={editingLesson.lesson.duration_seconds} onChange={e => updateLesson(editingLesson.lesson!.id, editingLesson.moduleId, { duration_seconds: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265]" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Beschrijving</label>
                  <textarea rows={3} value={editingLesson.lesson.description || ''} onChange={e => updateLesson(editingLesson.lesson!.id, editingLesson.moduleId, { description: e.target.value || null })} className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265] resize-none" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Content (markdown)</label>
                  <textarea rows={6} value={editingLesson.lesson.content || ''} onChange={e => updateLesson(editingLesson.lesson!.id, editingLesson.moduleId, { content: e.target.value || null })} className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[14px] font-mono text-[12px] focus:outline-none focus:border-[#C4A265] resize-none" />
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editingLesson.lesson.is_free} onChange={e => updateLesson(editingLesson.lesson!.id, editingLesson.moduleId, { is_free: e.target.checked })} className="w-4 h-4 rounded" />
                    <span className="text-[13px]">Gratis preview les</span>
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setEditingLesson(null)} className="flex-1 py-3 rounded-full border border-[#eee] text-[13px] text-[#888]">Sluiten</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
