import React, { useRef } from 'react'
import { supabase } from '@/lib/supabase-client'
import RichTextField from './RichTextField'

/* ── Types ── */
export type BlockType = 'video' | 'text' | 'image' | 'quiz' | 'callout' | 'download' | 'divider'

export interface Block {
  id: string
  type: BlockType
  title?: string
  subtitle?: string
  content?: string | {
    mux_asset_id?: string
    mux_playback_id?: string
    [key: string]: unknown
  }
  url?: string
  caption?: string
  question?: string
  media?: { type: 'image' | 'video' | null; url: string } | null
  option_type?: 'text' | 'image'
  options?: Array<{ id: string; text: string; image_url?: string; correct: boolean }>
  points?: number
  quizType?: 'intermediate' | 'final'
  autoplay?: boolean
  subtitles?: boolean
  fileName?: string
  fileDescription?: string
}

interface BlockProps {
  block: Block
  onUpdate: (id: string, updates: Partial<Block>) => void
}

const colors = {
  gold: '#C4A265',
}

/* ── TextBlock (Rich Text via RichTextField) ── */
export const TextBlock = React.memo(({ block, onUpdate }: BlockProps) => (
  <div className="space-y-2">
    <input
      type="text"
      placeholder="Hoofdtitel..."
      value={block.title || ''}
      onChange={(e) => onUpdate(block.id, { title: e.target.value })}
      className="w-full bg-transparent border-none outline-none font-['Cormorant_Garamond'] text-[22px] font-medium text-[#1E1A14] tracking-[-0.01em]"
    />
    <input
      type="text"
      placeholder="Subtitel of introductie..."
      value={block.subtitle || ''}
      onChange={(e) => onUpdate(block.id, { subtitle: e.target.value })}
      className="w-full bg-transparent border-none outline-none text-[14px] text-[#7A7268] mt-1"
    />
    <RichTextField
      content={typeof block.content === 'string' ? block.content : ''}
      onChange={(html) => onUpdate(block.id, { content: html })}
    />
  </div>
))
TextBlock.displayName = 'TextBlock'

/* ── ImageBlock ── */
export const ImageBlock = React.memo(({ block, onUpdate }: BlockProps) => {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fileName = `${block.id}-${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage
      .from('course-images')
      .upload(fileName, file, { upsert: true })
    if (error) { console.error('Image upload error:', error); return }
    const { data: { publicUrl } } = supabase.storage
      .from('course-images')
      .getPublicUrl(data.path)
    onUpdate(block.id, { url: publicUrl })
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleUpload}
      />
      <div
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileRef.current?.click() }}
        className="w-full aspect-video bg-[#F0EDE6] rounded-lg flex flex-col items-center justify-center gap-2 p-4 border-1.5 border-dashed border-[rgba(30,26,20,0.12)] cursor-pointer hover:border-[rgba(196,162,101,0.3)] hover:bg-[rgba(196,162,101,0.03)] transition"
        style={{ borderRadius: 8, overflow: 'hidden' }}
      >
        {block.url ? (
          <img src={block.url} alt={block.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
        ) : (
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={colors.gold} strokeWidth="1" style={{ opacity: 0.35 }}>
            <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
          </svg>
        )}
      </div>
      <input
        type="text"
        placeholder="Bijschrift (optioneel)"
        value={block.caption || ''}
        onChange={(e) => onUpdate(block.id, { caption: e.target.value })}
        className="w-full bg-transparent border-none outline-none text-[11.5px] text-[#7A7268] italic text-center mt-1"
      />
    </div>
  )
})
ImageBlock.displayName = 'ImageBlock'

/* ── QuizBlock ── */
export const QuizBlock = React.memo(({ block, onUpdate }: BlockProps) => {
  const optionType = block.option_type || 'text'

  const addOption = () => {
    const opts = [...(block.options || [])]
    opts.push({ id: crypto.randomUUID(), text: '', image_url: '', correct: false })
    onUpdate(block.id, { options: opts })
  }

  const removeOption = (idx: number) => {
    const opts = (block.options || []).filter((_, j) => j !== idx)
    onUpdate(block.id, { options: opts })
  }

  const updateOption = (idx: number, patch: Record<string, unknown>) => {
    const opts = (block.options || []).map((o, j) => j === idx ? { ...o, ...patch } : o)
    onUpdate(block.id, { options: opts })
  }

  const toggleCorrect = (idx: number) => {
    const opts = (block.options || []).map((o, j) => j === idx ? { ...o, correct: !o.correct } : o)
    onUpdate(block.id, { options: opts })
  }

  const handleImageUpload = async (idx: number, file: File) => {
    const path = `quiz-options/${crypto.randomUUID()}-${file.name}`
    const { error: uploadErr } = await supabase.storage.from('course-media').upload(path, file)
    if (uploadErr) { console.error('Upload failed:', uploadErr); return }
    const { data: { publicUrl } } = supabase.storage.from('course-media').getPublicUrl(path)
    updateOption(idx, { image_url: publicUrl })
  }

  const handleMediaHeaderUpload = async (file: File) => {
    const path = `quiz-media/${crypto.randomUUID()}-${file.name}`
    const { error: uploadErr } = await supabase.storage.from('course-media').upload(path, file)
    if (uploadErr) { console.error('Upload failed:', uploadErr); return }
    const { data: { publicUrl } } = supabase.storage.from('course-media').getPublicUrl(path)
    onUpdate(block.id, { media: { type: 'image', url: publicUrl } })
  }

  return (
    <div className="bg-white rounded-xl border border-[rgba(30,26,20,0.06)] overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[rgba(30,26,20,0.02)] border-b border-[rgba(30,26,20,0.06)]">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[#7A7268]">Vraag</span>
          {/* Media toggle */}
          <label className="flex items-center gap-1 cursor-pointer text-[10px] text-[#7A7268]">
            <input
              type="checkbox"
              checked={block.media?.type != null}
              onChange={(e) => {
                if (e.target.checked) {
                  onUpdate(block.id, { media: { type: 'image', url: '' } })
                } else {
                  onUpdate(block.id, { media: null })
                }
              }}
              className="accent-[#C4A265]"
            />
            Media
          </label>
          {block.media?.type != null && (
            <select
              value={block.media?.type || 'image'}
              onChange={(e) => onUpdate(block.id, { media: { type: e.target.value as 'image' | 'video', url: block.media?.url || '' } })}
              className="text-[10px] border border-[rgba(30,26,20,0.09)] rounded px-1 py-0.5"
            >
              <option value="image">Foto</option>
              <option value="video">Video</option>
            </select>
          )}
        </div>
        {/* Option type */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[#7A7268]">Antwoorden:</span>
          <label className="flex items-center gap-0.5 cursor-pointer text-[10px]">
            <input type="radio" name={`opt-type-${block.id}`} checked={optionType === 'text'} onChange={() => onUpdate(block.id, { option_type: 'text' })} className="accent-[#C4A265]" />
            Tekst
          </label>
          <label className="flex items-center gap-0.5 cursor-pointer text-[10px]">
            <input type="radio" name={`opt-type-${block.id}`} checked={optionType === 'image'} onChange={() => onUpdate(block.id, { option_type: 'image' })} className="accent-[#C4A265]" />
            Foto
          </label>
        </div>
      </div>

      {/* Question content area */}
      <div className="p-4 space-y-3">
        {/* Media header */}
        {block.media?.type != null && (
          <div className="border border-dashed border-[rgba(30,26,20,0.12)] rounded-lg p-3 text-center">
            {block.media.url ? (
              <div className="relative inline-block">
                <img src={block.media.url} alt="Media" className="max-h-32 mx-auto rounded" />
                <button onClick={() => onUpdate(block.id, { media: { type: block.media?.type || 'image', url: '' } })} className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full text-[10px] flex items-center justify-center">✕</button>
              </div>
            ) : (
              <label className="cursor-pointer text-[11px] text-[#7A7268]">
                📷 Klik om {block.media.type === 'video' ? 'video' : 'foto'} te uploaden
                <input type="file" accept={block.media.type === 'video' ? 'video/*' : 'image/*'} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleMediaHeaderUpload(f) }} />
              </label>
            )}
          </div>
        )}

        {/* Question text */}
        <div className="font-['Cormorant_Garamond'] text-[18px] text-[#1E1A14]">
          <RichTextField
            content={block.question || ''}
            onChange={(html) => onUpdate(block.id, { question: html })}
            variant="inline"
            placeholder="Typ je vraag..."
          />
        </div>

        {/* Answer options */}
        {optionType === 'image' ? (
          <div className="grid grid-cols-2 gap-2">
            {(block.options || []).map((opt, i) => (
              <div key={opt.id || i} className="group relative">
                <div
                  className={`rounded-xl border-2 overflow-hidden transition cursor-pointer ${opt.correct ? 'border-[rgba(80,190,120,0.5)] bg-[rgba(80,190,120,0.04)]' : 'border-[rgba(30,26,20,0.08)] hover:border-[rgba(196,162,101,0.3)]'}`}
                  onClick={() => toggleCorrect(i)}
                >
                  <div className="aspect-square flex items-center justify-center bg-[rgba(30,26,20,0.03)] min-h-[80px]">
                    {opt.image_url ? (
                      <img src={opt.image_url} alt={opt.text} className="w-full h-full object-cover" />
                    ) : (
                      <label className="cursor-pointer text-[10px] text-[#7A7268] p-4" onClick={(e) => e.stopPropagation()}>
                        📷 Upload
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(i, f) }} />
                      </label>
                    )}
                  </div>
                  <div className="px-2 py-1.5 text-center text-[11px] text-[#7A7268]">
                    {String.fromCharCode(65 + i)}
                    {opt.correct && <span className="ml-1 text-[rgba(80,190,120,0.8)]">✓</span>}
                  </div>
                </div>
                <button onClick={() => removeOption(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full shadow text-[10px] text-[rgba(30,26,20,0.3)] hover:text-[rgba(220,80,80,0.7)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition">✕</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {(block.options || []).map((opt, i) => (
              <div key={opt.id || i} className="group relative">
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition cursor-pointer ${opt.correct ? 'border-[rgba(80,190,120,0.5)] bg-[rgba(80,190,120,0.04)]' : 'border-[rgba(30,26,20,0.06)] hover:border-[rgba(196,162,101,0.25)] hover:bg-[rgba(196,162,101,0.02)]'}`}
                  onClick={() => toggleCorrect(i)}
                >
                  <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[11px] font-medium flex-shrink-0 transition ${opt.correct ? 'bg-[rgba(80,190,120,0.15)] border-[rgba(80,190,120,0.4)] text-[rgba(80,190,120,0.9)]' : 'bg-white border-[rgba(30,26,20,0.1)] text-[#7A7268]'}`}>
                    {opt.correct ? '✓' : String.fromCharCode(65 + i)}
                  </span>
                  <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                    <RichTextField
                      content={opt.text || ''}
                      onChange={(html) => updateOption(i, { text: html })}
                      variant="inline"
                      className="text-[13px] text-[#1E1A14]"
                      placeholder={`Optie ${String.fromCharCode(65 + i)}`}
                    />
                  </div>
                </div>
                <button onClick={() => removeOption(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full shadow text-[10px] text-[rgba(30,26,20,0.3)] hover:text-[rgba(220,80,80,0.7)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition">✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Add option */}
        <button
          onClick={addOption}
          className="w-full py-2 rounded-xl border-2 border-dashed border-[rgba(30,26,20,0.08)] text-[11px] text-[#7A7268] hover:border-[rgba(196,162,101,0.3)] hover:text-[#C4A265] transition cursor-pointer"
        >
          + Optie toevoegen
        </button>
      </div>
    </div>
  )
})
QuizBlock.displayName = 'QuizBlock'

/* ── CalloutBlock ── */
export const CalloutBlock = React.memo(({ block, onUpdate }: BlockProps) => (
  <div className="flex gap-3 items-start bg-[rgba(196,162,101,0.07)] border-l-3 border-[rgba(196,162,101,0.35)] rounded-r-lg p-3">
    <span className="text-[17px] flex-shrink-0 mt-0.5">💡</span>
    <div className="flex-1">
      <RichTextField
        content={typeof block.content === 'string' ? block.content : ''}
        onChange={(html) => onUpdate(block.id, { content: html })}
        variant="inline"
      />
    </div>
  </div>
))
CalloutBlock.displayName = 'CalloutBlock'

/* ── DownloadBlock ── */
export const DownloadBlock = React.memo(({ block, onUpdate }: BlockProps) => {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fileName = `${block.id}-${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage
      .from('course-downloads')
      .upload(fileName, file)
    if (!error && data) {
      const { data: { publicUrl } } = supabase.storage.from('course-downloads').getPublicUrl(data.path)
      onUpdate(block.id, { url: publicUrl, fileName: file.name })
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx,.zip,.png,.jpg"
        style={{ display: 'none' }}
        onChange={handleUpload}
      />
      <div
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileRef.current?.click() }}
        className="w-full bg-[#F0EDE6] border-1.5 border-dashed border-[rgba(30,26,20,0.12)] rounded-lg p-5 flex flex-col items-center gap-2 cursor-pointer hover:bg-[rgba(196,162,101,0.04)] hover:border-[rgba(196,162,101,0.3)] transition text-center"
      >
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={colors.gold} strokeWidth="1" style={{ opacity: 0.5 }}>
          <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        <span className="text-[10.5px] text-[#7A7268] tracking-[0.1em] uppercase">Bestand uploaden</span>
        <span className="text-[10.5px] text-[rgba(30,26,20,0.3)] font-light">PDF of afbeelding · max 50MB</span>
      </div>
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Bestandsnaam voor studenten, bijv. Werkblad les 1"
          value={block.fileName || ''}
          onChange={(e) => onUpdate(block.id, { fileName: e.target.value })}
          className="w-full bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-[7px_10px] text-[12px] outline-none"
        />
        <input
          type="text"
          placeholder="Korte beschrijving (optioneel)"
          value={block.fileDescription || ''}
          onChange={(e) => onUpdate(block.id, { fileDescription: e.target.value })}
          className="w-full bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-[7px_10px] text-[12px] outline-none"
        />
      </div>
    </div>
  )
})
DownloadBlock.displayName = 'DownloadBlock'
