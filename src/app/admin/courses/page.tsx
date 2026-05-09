'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase-client'

/* ── Types ── */
type Block = {
  id: string
  type: 'video' | 'image' | 'text'
  title: string
  subtitle: string
  content: string // video_url, image_url, or paragraph text
  sort_order: number
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
  blocks?: Block[]
}

type Module = {
  id: string
  course_id: string
  title: string
  description: string | null
  sort_order: number
  lessons: Lesson[]
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

function uid() { return crypto.randomUUID() }

/* ── Block component with drag ── */
function BlockCard({ block, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast, dragHandlers }: {
  block: Block
  onUpdate: (id: string, fields: Partial<Block>) => void
  onDelete: (id: string) => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
  dragHandlers: { onDragStart: (e: React.DragEvent) => void; onDragOver: (e: React.DragEvent) => void; onDrop: (e: React.DragEvent) => void; onDragEnd: () => void }
}) {
  const icon = block.type === 'video' ? '🎬' : block.type === 'image' ? '🖼️' : '📝'
  const accentColor = block.type === 'video' ? '#8B5CF6' : block.type === 'image' ? '#3B82F6' : '#10B981'

  return (
    <div
      draggable
      {...dragHandlers}
      className="bg-white rounded-xl border border-[#eee] overflow-hidden transition-shadow hover:shadow-sm group"
    >
      {/* Block header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#fafafa] border-b border-[#f0f0f0]">
        <span className="text-[14px]">{icon}</span>
        <div className="flex-1">
          <input
            value={block.title}
            onChange={e => onUpdate(block.id, { title: e.target.value })}
            placeholder="Titel..."
            className="text-[13px] font-medium bg-transparent w-full focus:outline-none placeholder:text-[#ccc]"
          />
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={onMoveUp} disabled={isFirst} className="p-1 text-[#aaa] hover:text-[#333] disabled:opacity-30">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M18 15l-6-6-6 6" /></svg>
          </button>
          <button onClick={onMoveDown} disabled={isLast} className="p-1 text-[#aaa] hover:text-[#333] disabled:opacity-30">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M6 9l6 6 6-6" /></svg>
          </button>
          <button onClick={() => onDelete(block.id)} className="p-1 text-red-300 hover:text-red-500">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.5 }} />
        <span className="text-[10px] cursor-grab active:cursor-grabbing text-[#ccc] px-1">⠿</span>
      </div>

      {/* Block body */}
      <div className="p-4 space-y-3">
        <input
          value={block.subtitle}
          onChange={e => onUpdate(block.id, { subtitle: e.target.value })}
          placeholder="Ondertitel (optioneel)..."
          className="w-full text-[12px] text-[#888] bg-transparent focus:outline-none placeholder:text-[#ddd] border-b border-[#f0f0f0] pb-2"
        />

        {block.type === 'video' && (
          <div>
            <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#aaa] mb-1.5 block">Video URL</label>
            <input
              value={block.content}
              onChange={e => onUpdate(block.id, { content: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2.5 rounded-lg border border-[#eee] text-[13px] font-mono focus:outline-none focus:border-[#8B5CF6]"
            />
            {block.content && (
              <video src={block.content} className="mt-3 w-full max-h-[200px] rounded-lg bg-[#f5f5f5] object-contain" controls muted playsInline />
            )}
          </div>
        )}

        {block.type === 'image' && (
          <div>
            <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#aaa] mb-1.5 block">Afbeelding URL</label>
            <input
              value={block.content}
              onChange={e => onUpdate(block.id, { content: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2.5 rounded-lg border border-[#eee] text-[13px] font-mono focus:outline-none focus:border-[#3B82F6]"
            />
            {block.content && (
              <img src={block.content} alt="" className="mt-3 w-full max-h-[200px] rounded-lg bg-[#f5f5f5] object-contain" />
            )}
          </div>
        )}

        {block.type === 'text' && (
          <div>
            <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#aaa] mb-1.5 block">Tekst</label>
            <textarea
              rows={4}
              value={block.content}
              onChange={e => onUpdate(block.id, { content: e.target.value })}
              placeholder="Schrijf hier je tekst..."
              className="w-full px-3 py-2.5 rounded-lg border border-[#eee] text-[13px] focus:outline-none focus:border-[#10B981] resize-none"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default function CourseBuilderPage() {
  const { user, role, loading } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<CourseData[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [course, setCourse] = useState<CourseData | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [saving, setSaving] = useState(false)
  const dragItem = useRef<string | null>(null)
  const dragOverItem = useRef<string | null>(null)

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
  useEffect(() => { if (selectedId) loadCourse(selectedId) }, [selectedId, loadCourse])

  // Load blocks for active lesson
  const loadBlocks = useCallback(async (lessonId: string) => {
    // Blocks stored in lesson's content field as JSON
    const { data } = await supabase.from('lessons').select('content').eq('id', lessonId).single()
    if (data?.content) {
      try { setBlocks(JSON.parse(data.content)) } catch { setBlocks([]) }
    } else {
      setBlocks([])
    }
  }, [])
  useEffect(() => { if (activeLessonId) loadBlocks(activeLessonId) }, [activeLessonId, loadBlocks])

  const saveBlocks = async (lessonId: string, newBlocks: Block[]) => {
    await supabase.from('lessons').update({ content: JSON.stringify(newBlocks) }).eq('id', lessonId)
  }

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
    if (selectedId === id) { setSelectedId(null); setCourse(null); setModules([]); setActiveLessonId(null); setBlocks([]) }
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
      module_id: moduleId, title: 'Nieuwe Les', slug: `nieuwe-les-${Date.now()}`, sort_order: mod.lessons.length + 1, is_free: false, content: '[]',
    }).select().single()
    if (data) {
      setModules(prev => prev.map(m => m.id === moduleId ? { ...m, lessons: [...m.lessons, data] } : m))
    }
  }

  const updateLesson = async (id: string, moduleId: string, fields: Partial<Lesson>) => {
    await supabase.from('lessons').update(fields).eq('id', id)
    setModules(prev => prev.map(m => m.id === moduleId ? {
      ...m, lessons: m.lessons.map(l => l.id === id ? { ...l, ...fields } : l)
    } : m))
  }

  const deleteLesson = async (id: string, moduleId: string) => {
    await supabase.from('lessons').delete().eq('id', id)
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, lessons: m.lessons.filter(l => l.id !== id) } : m))
    if (activeLessonId === id) { setActiveLessonId(null); setBlocks([]) }
  }

  // ── Block CRUD ──
  const addBlock = (type: 'video' | 'image' | 'text') => {
    const newBlock: Block = { id: uid(), type, title: '', subtitle: '', content: '', sort_order: blocks.length }
    const newBlocks = [...blocks, newBlock]
    setBlocks(newBlocks)
    if (activeLessonId) saveBlocks(activeLessonId, newBlocks)
  }

  const updateBlock = (id: string, fields: Partial<Block>) => {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, ...fields } : b)
    setBlocks(newBlocks)
    if (activeLessonId) saveBlocks(activeLessonId, newBlocks)
  }

  const deleteBlock = (id: string) => {
    const newBlocks = blocks.filter(b => b.id !== id).map((b, i) => ({ ...b, sort_order: i }))
    setBlocks(newBlocks)
    if (activeLessonId) saveBlocks(activeLessonId, newBlocks)
  }

  const moveBlock = (fromId: string, toId: string) => {
    const fromIdx = blocks.findIndex(b => b.id === fromId)
    const toIdx = blocks.findIndex(b => b.id === toId)
    if (fromIdx === -1 || toIdx === -1) return
    const newBlocks = [...blocks]
    const [moved] = newBlocks.splice(fromIdx, 1)
    newBlocks.splice(toIdx, 0, moved)
    const reordered = newBlocks.map((b, i) => ({ ...b, sort_order: i }))
    setBlocks(reordered)
    if (activeLessonId) saveBlocks(activeLessonId, reordered)
  }

  // ── Drag handlers ──
  const getDragHandlers = (blockId: string) => ({
    onDragStart: (e: React.DragEvent) => { dragItem.current = blockId; e.dataTransfer.effectAllowed = 'move' },
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); dragOverItem.current = blockId },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      if (dragItem.current && dragOverItem.current && dragItem.current !== dragOverItem.current) {
        moveBlock(dragItem.current, dragOverItem.current)
      }
      dragItem.current = null
      dragOverItem.current = null
    },
    onDragEnd: () => { dragItem.current = null; dragOverItem.current = null },
  })

  const activeLesson = modules.flatMap(m => m.lessons).find(l => l.id === activeLessonId)

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
            + Nieuwe Cursus
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-[260px_1fr] gap-6">

          {/* ── Left: Course list + lesson tree ── */}
          <div className="space-y-4">
            {/* Course selector */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#aaa] px-1">Cursussen</p>
              {courses.map(c => (
                <div key={c.id} className={`rounded-xl border p-3 cursor-pointer transition ${selectedId === c.id ? 'border-[#C4A265] bg-white shadow-sm' : 'border-[#eee] bg-white hover:border-[#ddd]'}`} onClick={() => { setSelectedId(c.id); setActiveLessonId(null); setBlocks([]) }}>
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium">{c.title}</p>
                    <button onClick={e => { e.stopPropagation(); deleteCourse(c.id) }} className="text-[10px] text-red-300 hover:text-red-500">✕</button>
                  </div>
                  <p className="text-[10px] text-[#aaa] mt-0.5">{c.level} · {c.is_published ? 'Live' : 'Concept'}</p>
                </div>
              ))}
            </div>

            {/* Module/Lesson tree */}
            {course && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#aaa]">Modules & Lessen</p>
                  <button onClick={createModule} className="text-[10px] text-[#C4A265] hover:underline">+ Module</button>
                </div>

                {modules.map((mod, mi) => (
                  <div key={mod.id} className="bg-white rounded-xl border border-[#eee] overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-[#fafafa] border-b border-[#f0f0f0]">
                      <span className="text-[10px] font-bold text-[#ccc]">{mi + 1}</span>
                      <input value={mod.title} onChange={e => updateModule(mod.id, { title: e.target.value })} className="flex-1 text-[12px] font-medium bg-transparent focus:outline-none" />
                      <button onClick={() => deleteModule(mod.id)} className="text-[10px] text-red-300 hover:text-red-500">✕</button>
                    </div>
                    <div className="py-1">
                      {mod.lessons.map((lesson, li) => (
                        <div key={lesson.id}
                          className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition ${activeLessonId === lesson.id ? 'bg-[#C4A265]/8 text-[#C4A265]' : 'hover:bg-[#fafafa]'}`}
                          onClick={() => setActiveLessonId(lesson.id)}
                        >
                          <span className="text-[9px] text-[#ccc]">{li + 1}</span>
                          <input value={lesson.title} onChange={e => updateLesson(lesson.id, mod.id, { title: e.target.value, slug: slugify(e.target.value) })} onClick={e => e.stopPropagation()} className="flex-1 text-[11px] bg-transparent focus:outline-none" />
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <label className="flex items-center cursor-pointer">
                              <input type="checkbox" checked={lesson.is_free} onChange={e => updateLesson(lesson.id, mod.id, { is_free: e.target.checked })} className="w-3 h-3 rounded" title="Gratis preview" />
                              <span className="text-[8px] text-[#C4A265] ml-0.5">gratis</span>
                            </label>
                            <button onClick={() => deleteLesson(lesson.id, mod.id)} className="text-[9px] text-red-300 hover:text-red-500">✕</button>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => createLesson(mod.id)} className="w-full text-left px-3 py-2 text-[10px] text-[#C4A265] hover:bg-[#C4A265]/5">+ Les</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Editor ── */}
          <div>
            {activeLessonId && activeLesson ? (
              <div className="space-y-4">
                {/* Lesson header */}
                <div className="bg-white rounded-2xl border border-[#eee] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-['Cormorant_Garamond'] text-[22px]">{activeLesson.title || 'Naamloze les'}</h3>
                    <span className="text-[10px] bg-[#f5f5f5] text-[#888] px-2.5 py-1 rounded-full">{activeLesson.is_free ? 'Gratis preview' : 'Betaald'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#aaa] mb-1 block">Les titel</label>
                      <input value={activeLesson.title} onChange={e => updateLesson(activeLesson.id, activeLesson.module_id, { title: e.target.value, slug: slugify(e.target.value) })} className="w-full px-3 py-2.5 rounded-lg border border-[#eee] text-[13px] focus:outline-none focus:border-[#C4A265]" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#aaa] mb-1 block">Duur (sec)</label>
                      <input type="number" value={activeLesson.duration_seconds} onChange={e => updateLesson(activeLesson.id, activeLesson.module_id, { duration_seconds: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-lg border border-[#eee] text-[13px] focus:outline-none focus:border-[#C4A265]" />
                    </div>
                  </div>
                </div>

                {/* Block builder */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#aaa]">Blokken ({blocks.length})</p>
                    <div className="flex gap-2">
                      <button onClick={() => addBlock('video')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#8B5CF6]/20 text-[#8B5CF6] text-[11px] font-medium hover:bg-[#8B5CF6]/5 transition">
                        🎬 Video
                      </button>
                      <button onClick={() => addBlock('image')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#3B82F6]/20 text-[#3B82F6] text-[11px] font-medium hover:bg-[#3B82F6]/5 transition">
                        🖼️ Afbeelding
                      </button>
                      <button onClick={() => addBlock('text')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#10B981]/20 text-[#10B981] text-[11px] font-medium hover:bg-[#10B981]/5 transition">
                        📝 Tekst
                      </button>
                    </div>
                  </div>

                  {/* Blocks */}
                  {blocks.map((block, i) => (
                    <BlockCard
                      key={block.id}
                      block={block}
                      onUpdate={updateBlock}
                      onDelete={deleteBlock}
                      onMoveUp={() => { if (i > 0) moveBlock(block.id, blocks[i - 1].id) }}
                      onMoveDown={() => { if (i < blocks.length - 1) moveBlock(block.id, blocks[i + 1].id) }}
                      isFirst={i === 0}
                      isLast={i === blocks.length - 1}
                      dragHandlers={getDragHandlers(block.id)}
                    />
                  ))}

                  {/* Add block prompt */}
                  <div className="border-2 border-dashed border-[#eee] rounded-xl py-8 flex flex-col items-center gap-3 hover:border-[#C4A265]/30 transition">
                    <div className="w-10 h-10 rounded-full bg-[#f5f5f5] flex items-center justify-center text-[#ccc]">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    </div>
                    <p className="text-[12px] text-[#aaa]">Voeg blokken toe om je les op te bouwen</p>
                    <div className="flex gap-2">
                      <button onClick={() => addBlock('video')} className="px-4 py-2 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] text-[12px] font-medium hover:bg-[#8B5CF6]/20 transition">🎬 Video</button>
                      <button onClick={() => addBlock('image')} className="px-4 py-2 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] text-[12px] font-medium hover:bg-[#3B82F6]/20 transition">🖼️ Foto</button>
                      <button onClick={() => addBlock('text')} className="px-4 py-2 rounded-full bg-[#10B981]/10 text-[#10B981] text-[12px] font-medium hover:bg-[#10B981]/20 transition">📝 Tekst</button>
                    </div>
                  </div>
                </div>
              </div>
            ) : course ? (
              <div className="space-y-5">
                {/* Course details */}
                <div className="bg-white rounded-2xl border border-[#eee] p-6 space-y-4">
                  <h3 className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[#888]">Cursus Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#aaa] mb-1.5 block">Titel</label>
                      <input value={course.title} onChange={e => updateCourse({ title: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-[#eee] text-[13px] focus:outline-none focus:border-[#C4A265]" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#aaa] mb-1.5 block">Slug</label>
                      <input value={course.slug} onChange={e => updateCourse({ slug: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-[#eee] text-[13px] font-mono focus:outline-none focus:border-[#C4A265]" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#aaa] mb-1.5 block">Level</label>
                      <select value={course.level} onChange={e => updateCourse({ level: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-[#eee] text-[13px] focus:outline-none focus:border-[#C4A265]">
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#aaa] mb-1.5 block">Prijs (€)</label>
                      <input type="number" value={course.price ?? ''} onChange={e => updateCourse({ price: e.target.value ? Number(e.target.value) : null })} className="w-full px-3 py-2.5 rounded-lg border border-[#eee] text-[13px] focus:outline-none focus:border-[#C4A265]" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#aaa] mb-1.5 block">Korte beschrijving</label>
                      <input value={course.short_description || ''} onChange={e => updateCourse({ short_description: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-[#eee] text-[13px] focus:outline-none focus:border-[#C4A265]" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#aaa] mb-1.5 block">Thumbnail URL</label>
                      <input value={course.thumbnail_url || ''} onChange={e => updateCourse({ thumbnail_url: e.target.value })} placeholder="https://..." className="w-full px-3 py-2.5 rounded-lg border border-[#eee] text-[13px] focus:outline-none focus:border-[#C4A265]" />
                    </div>
                    <div className="col-span-2 flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={course.is_published} onChange={e => updateCourse({ is_published: e.target.checked })} className="w-4 h-4 rounded" />
                        <span className="text-[13px]">Gepubliceerd</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-[#eee] p-8 text-center">
                  <p className="text-[14px] text-[#888]">Selecteer een les in het linkermenu om blokken te bewerken</p>
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
      </div>
    </div>
  )
}
