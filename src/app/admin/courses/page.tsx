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
  content: string
  sort_order: number
}

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

function uid() { return crypto.randomUUID() }

/* ── Single block card ── */
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
  const color = block.type === 'video' ? '#8B5CF6' : block.type === 'image' ? '#3B82F6' : '#10B981'

  return (
    <div draggable {...dragHandlers} className="bg-white rounded-2xl border border-[#eee] overflow-hidden transition-shadow hover:shadow-sm group">
      {/* Header bar */}
      <div className="flex items-center gap-3 px-5 py-3 bg-[#fafafa] border-b border-[#f0f0f0]">
        <span className="text-[16px]">{icon}</span>
        <input value={block.title} onChange={e => onUpdate(block.id, { title: e.target.value })} placeholder="Titel..." className="flex-1 text-[14px] font-medium bg-transparent focus:outline-none placeholder:text-[#ccc]" />
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={onMoveUp} disabled={isFirst} className="p-1.5 text-[#aaa] hover:text-[#333] disabled:opacity-30 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M18 15l-6-6-6 6" /></svg>
          </button>
          <button onClick={onMoveDown} disabled={isLast} className="p-1.5 text-[#aaa] hover:text-[#333] disabled:opacity-30 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M6 9l6 6 6-6" /></svg>
          </button>
          <button onClick={() => onDelete(block.id)} className="p-1.5 text-red-300 hover:text-red-500 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="w-2 h-7 rounded-full" style={{ backgroundColor: color, opacity: 0.4 }} />
        <span className="text-[14px] cursor-grab active:cursor-grabbing text-[#ccc]">⠿</span>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        <input value={block.subtitle} onChange={e => onUpdate(block.id, { subtitle: e.target.value })} placeholder="Ondertitel (optioneel)..." className="w-full text-[13px] text-[#888] bg-transparent focus:outline-none placeholder:text-[#ddd] border-b border-[#f0f0f0] pb-3" />

        {block.type === 'video' && (
          <div className="space-y-3">
            <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#aaa] block">Video URL</label>
            <input value={block.content} onChange={e => onUpdate(block.id, { content: e.target.value })} placeholder="https://..." className="w-full px-4 py-3 rounded-xl border border-[#eee] text-[13px] font-mono focus:outline-none focus:border-[#8B5CF6] transition" />
            {block.content && (
              <video src={block.content} className="w-full max-h-[240px] rounded-xl bg-[#f5f5f5] object-contain" controls muted playsInline />
            )}
          </div>
        )}

        {block.type === 'image' && (
          <div className="space-y-3">
            <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#aaa] block">Afbeelding URL</label>
            <input value={block.content} onChange={e => onUpdate(block.id, { content: e.target.value })} placeholder="https://..." className="w-full px-4 py-3 rounded-xl border border-[#eee] text-[13px] font-mono focus:outline-none focus:border-[#3B82F6] transition" />
            {block.content && (
              <img src={block.content} alt="" className="w-full max-h-[240px] rounded-xl bg-[#f5f5f5] object-contain" />
            )}
          </div>
        )}

        {block.type === 'text' && (
          <div className="space-y-3">
            <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#aaa] block">Paragraaf</label>
            <textarea rows={5} value={block.content} onChange={e => onUpdate(block.id, { content: e.target.value })} placeholder="Schrijf hier je tekst..." className="w-full px-4 py-3 rounded-xl border border-[#eee] text-[14px] leading-relaxed focus:outline-none focus:border-[#10B981] resize-none transition" />
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
  const [blocks, setBlocks] = useState<Block[]>([])
  const [showCourseSettings, setShowCourseSettings] = useState(false)
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
    if (c) {
      setCourse(c)
      // Load blocks from description field (JSON)
      try {
        const parsed = JSON.parse(c.description || '[]')
        if (Array.isArray(parsed)) setBlocks(parsed)
        else setBlocks([])
      } catch { setBlocks([]) }
    }
  }, [])
  useEffect(() => { if (selectedId) loadCourse(selectedId) }, [selectedId, loadCourse])

  const saveBlocks = async (newBlocks: Block[]) => {
    if (!course) return
    await supabase.from('courses').update({ description: JSON.stringify(newBlocks) }).eq('id', course.id)
  }

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  // ── Course CRUD ──
  const createCourse = async () => {
    setSaving(true)
    const { data } = await supabase.from('courses').insert({
      title: 'Nieuwe Cursus', slug: `nieuwe-cursus-${Date.now()}`, level: 'beginner', sort_order: courses.length + 1, description: '[]',
    }).select().single()
    if (data) { loadCourses(); setSelectedId(data.id) }
    setSaving(false)
  }

  const updateCourse = async (fields: Partial<CourseData>) => {
    if (!course) return
    await supabase.from('courses').update(fields).eq('id', course.id)
    setCourse(prev => prev ? { ...prev, ...fields } : prev)
    loadCourses()
  }

  const deleteCourse = async (id: string) => {
    if (!confirm('Cursus verwijderen?')) return
    await supabase.from('courses').delete().eq('id', id)
    if (selectedId === id) { setSelectedId(null); setCourse(null); setBlocks([]) }
    loadCourses()
  }

  // ── Block CRUD ──
  const addBlock = (type: 'video' | 'image' | 'text') => {
    const newBlock: Block = { id: uid(), type, title: '', subtitle: '', content: '', sort_order: blocks.length }
    const newBlocks = [...blocks, newBlock]
    setBlocks(newBlocks)
    saveBlocks(newBlocks)
  }

  const updateBlock = (id: string, fields: Partial<Block>) => {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, ...fields } : b)
    setBlocks(newBlocks)
    saveBlocks(newBlocks)
  }

  const deleteBlock = (id: string) => {
    const newBlocks = blocks.filter(b => b.id !== id).map((b, i) => ({ ...b, sort_order: i }))
    setBlocks(newBlocks)
    saveBlocks(newBlocks)
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
    saveBlocks(reordered)
  }

  const getDragHandlers = (blockId: string) => ({
    onDragStart: (e: React.DragEvent) => { dragItem.current = blockId; e.dataTransfer.effectAllowed = 'move' },
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); dragOverItem.current = blockId },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      if (dragItem.current && dragOverItem.current && dragItem.current !== dragOverItem.current) {
        moveBlock(dragItem.current, dragOverItem.current)
      }
      dragItem.current = null; dragOverItem.current = null
    },
    onDragEnd: () => { dragItem.current = null; dragOverItem.current = null },
  })

  if (loading) return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><div className="text-[#888] text-[14px]">Laden...</div></div>
  if (!user) return null
  if (role !== 'admin') return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center flex-col gap-4"><div className="text-[#888] text-[14px]">Geen toegang.</div><a href="/admin" className="text-[13px] text-[#D4AF37]">← Admin</a></div>

  return (
    <div className="min-h-screen bg-[#F5F5F4]">
      {/* Header */}
      <div className="bg-white border-b border-[#eee] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/admin" className="text-[12px] text-[#888] hover:text-[#1a1a1a] px-3 py-1.5 rounded-full border border-[#eee] transition">← Admin</a>
            <h1 className="font-['Cormorant_Garamond'] text-[26px] text-[#1a1a1a]">
              {course ? course.title : 'Cursus Builder'}
            </h1>
            {course && (
              <span className={`text-[10px] px-3 py-1 rounded-full font-medium ${course.is_published ? 'bg-green-50 text-green-600' : 'bg-[#f5f5f5] text-[#888]'}`}>
                {course.is_published ? 'Live' : 'Concept'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {course && (
              <button onClick={() => setShowCourseSettings(!showCourseSettings)} className="text-[12px] px-4 py-2 rounded-full border border-[#ddd] text-[#888] hover:border-[#C4A265] hover:text-[#C4A265] transition">
                ⚙️ Instellingen
              </button>
            )}
            <button onClick={createCourse} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0C0A07] text-white text-[13px] font-medium hover:bg-[#333] transition disabled:opacity-50">
              + Nieuwe Cursus
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Course selector if none selected */}
        {!course && (
          <div className="grid grid-cols-3 gap-4">
            {courses.map(c => (
              <div key={c.id} className="bg-white rounded-2xl border border-[#eee] p-6 cursor-pointer hover:border-[#C4A265] hover:shadow-sm transition group" onClick={() => setSelectedId(c.id)}>
                <p className="text-[16px] font-medium mb-1">{c.title}</p>
                <p className="text-[12px] text-[#aaa]">{c.level} · {c.is_published ? 'Live' : 'Concept'}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[12px] text-[#C4A265] group-hover:underline">Openen →</span>
                  <button onClick={e => { e.stopPropagation(); deleteCourse(c.id) }} className="text-[10px] text-red-300 hover:text-red-500">Verwijder</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Course settings panel */}
        {course && showCourseSettings && (
          <div className="bg-white rounded-2xl border border-[#eee] p-6 mb-6 space-y-4">
            <h3 className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[#888]">Cursus Instellingen</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#aaa] mb-1.5 block">Titel</label>
                <input value={course.title} onChange={e => updateCourse({ title: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-[#eee] text-[14px] focus:outline-none focus:border-[#C4A265]" />
              </div>
              <div>
                <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#aaa] mb-1.5 block">Slug</label>
                <input value={course.slug} onChange={e => updateCourse({ slug: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-[#eee] text-[14px] font-mono focus:outline-none focus:border-[#C4A265]" />
              </div>
              <div>
                <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#aaa] mb-1.5 block">Level</label>
                <select value={course.level} onChange={e => updateCourse({ level: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-[#eee] text-[14px] focus:outline-none focus:border-[#C4A265]">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#aaa] mb-1.5 block">Prijs (€)</label>
                <input type="number" value={course.price ?? ''} onChange={e => updateCourse({ price: e.target.value ? Number(e.target.value) : null })} className="w-full px-4 py-3 rounded-xl border border-[#eee] text-[14px] focus:outline-none focus:border-[#C4A265]" />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#aaa] mb-1.5 block">Korte beschrijving</label>
                <input value={course.short_description || ''} onChange={e => updateCourse({ short_description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-[#eee] text-[14px] focus:outline-none focus:border-[#C4A265]" />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#aaa] mb-1.5 block">Thumbnail URL</label>
                <input value={course.thumbnail_url || ''} onChange={e => updateCourse({ thumbnail_url: e.target.value })} placeholder="https://..." className="w-full px-4 py-3 rounded-xl border border-[#eee] text-[14px] focus:outline-none focus:border-[#C4A265]" />
              </div>
              <div className="col-span-2 flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={course.is_published} onChange={e => updateCourse({ is_published: e.target.checked })} className="w-4 h-4 rounded" />
                  <span className="text-[13px]">Gepubliceerd</span>
                </label>
                <button onClick={() => { setSelectedId(null); setCourse(null); setBlocks([]) }} className="text-[12px] text-[#888] hover:text-[#1a1a1a] ml-auto">← Terug naar overzicht</button>
              </div>
            </div>
          </div>
        )}

        {/* Block editor */}
        {course && (
          <div className="space-y-4">
            {/* Add block buttons */}
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#aaa]">Blokken ({blocks.length})</p>
              <div className="flex gap-2">
                <button onClick={() => addBlock('video')} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#8B5CF6]/20 text-[#8B5CF6] text-[12px] font-medium hover:bg-[#8B5CF6]/5 transition">🎬 Video</button>
                <button onClick={() => addBlock('image')} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#3B82F6]/20 text-[#3B82F6] text-[12px] font-medium hover:bg-[#3B82F6]/5 transition">🖼️ Afbeelding</button>
                <button onClick={() => addBlock('text')} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#10B981]/20 text-[#10B981] text-[12px] font-medium hover:bg-[#10B981]/5 transition">📝 Tekst</button>
              </div>
            </div>

            {/* Rendered blocks */}
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

            {/* Empty state / Add prompt */}
            <div className="border-2 border-dashed border-[#e0e0e0] rounded-2xl py-12 flex flex-col items-center gap-4 hover:border-[#C4A265]/30 transition">
              <div className="w-14 h-14 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#ccc" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              </div>
              <p className="text-[14px] text-[#aaa]">Voeg blokken toe om je cursus op te bouwen</p>
              <div className="flex gap-3">
                <button onClick={() => addBlock('video')} className="px-5 py-2.5 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] text-[13px] font-medium hover:bg-[#8B5CF6]/20 transition">🎬 Video</button>
                <button onClick={() => addBlock('image')} className="px-5 py-2.5 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] text-[13px] font-medium hover:bg-[#3B82F6]/20 transition">🖼️ Foto</button>
                <button onClick={() => addBlock('text')} className="px-5 py-2.5 rounded-full bg-[#10B981]/10 text-[#10B981] text-[13px] font-medium hover:bg-[#10B981]/20 transition">📝 Tekst</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
