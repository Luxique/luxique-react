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
  const hasMedia = block.media?.type != null

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
    const { error: uploadErr } = await supabase.storage.from('course-images').upload(path, file)
    if (uploadErr) { console.error('Upload failed:', uploadErr); return }
    const { data: { publicUrl } } = supabase.storage.from('course-images').getPublicUrl(path)
    updateOption(idx, { image_url: publicUrl })
  }

  const handleMediaHeaderUpload = async (file: File) => {
    const path = `quiz-media/${crypto.randomUUID()}-${file.name}`
    const { error: uploadErr } = await supabase.storage.from('course-images').upload(path, file)
    if (uploadErr) { console.error('Upload failed:', uploadErr); return }
    const { data: { publicUrl } } = supabase.storage.from('course-images').getPublicUrl(path)
    onUpdate(block.id, { media: { type: 'image', url: publicUrl } })
  }

  const checkSVG = <svg viewBox="0 0 100 100" width="14" height="14"><path d="M96.975 24.985 36.627 85.332c-.702.7-1.839.7-2.542 0L3.025 54.27c-.7-.703-.7-1.84 0-2.542l7.775-7.775c.703-.7 1.84-.7 2.542 0L35.358 65.97l51.3-51.3c.703-.7 1.84-.7 2.542 0l7.775 7.774c.7.703.7 1.84 0 2.542z" fill="#fff"/></svg>

  return (
    <div style={{ border: '1px solid rgba(12,10,7,0.10)', borderRadius: 16, overflow: 'hidden' }}>
      {/* Header — mockup b-block-head */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#F2EEE6', borderBottom: '1px solid rgba(12,10,7,0.10)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9E7E45', fontWeight: 600 }}>
          ◆ Vraag
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {/* Media toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#8C8579', cursor: 'pointer' }}>
            <span style={{ width: 30, height: 17, borderRadius: 10, background: hasMedia ? '#5E8463' : '#d8d2c6', position: 'relative', display: 'inline-block', transition: 'background .2s' }}
              onClick={() => {
                if (hasMedia) { onUpdate(block.id, { media: null }) }
                else { onUpdate(block.id, { media: { type: 'image', url: '' } }) }
              }}>
              <span style={{ position: 'absolute', width: 13, height: 13, borderRadius: '50%', background: '#fff', top: 2, left: hasMedia ? 15 : 2, transition: 'left .2s' }} />
            </span>
            Media
          </label>
          {/* Tekst/Foto segment */}
          <div style={{ display: 'inline-flex', border: '1px solid rgba(12,10,7,0.10)', borderRadius: 8, overflow: 'hidden' }}>
            <span onClick={() => onUpdate(block.id, { option_type: 'text' })} style={{ padding: '5px 14px', fontSize: 12, color: optionType === 'text' ? '#fff' : '#8C8579', background: optionType === 'text' ? '#C4A265' : 'transparent', cursor: 'pointer', transition: 'all .2s' }}>Tekst</span>
            <span onClick={() => onUpdate(block.id, { option_type: 'image' })} style={{ padding: '5px 14px', fontSize: 12, color: optionType === 'image' ? '#fff' : '#8C8579', background: optionType === 'image' ? '#C4A265' : 'transparent', cursor: 'pointer', transition: 'all .2s' }}>Foto</span>
          </div>
        </div>
      </div>

      {/* Body — mockup b-body */}
      <div style={{ padding: '22px 20px' }}>
        {/* Media header */}
        {hasMedia && (
          <div style={{ border: '1.5px dashed rgba(12,10,7,0.12)', borderRadius: 14, padding: 16, textAlign: 'center', marginBottom: 16 }}>
            {block.media?.url ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={block.media.url} alt="Media" style={{ maxHeight: 160, borderRadius: 8 }} />
                <button onClick={() => onUpdate(block.id, { media: { type: block.media?.type || 'image', url: '' } })} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: '50%', border: 'none', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            ) : (
              <label style={{ cursor: 'pointer', fontSize: 12, color: '#8C8579' }}>
                📷 Klik om {block.media?.type === 'video' ? 'video' : 'foto'} te uploaden
                <input type="file" accept={block.media?.type === 'video' ? 'video/*' : 'image/*'} style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleMediaHeaderUpload(f) }} />
              </label>
            )}
          </div>
        )}

        {/* Question input — Cormorant 22px, bottom border */}
        <input
          value={block.question || ''}
          onChange={(e) => onUpdate(block.id, { question: e.target.value })}
          placeholder="Typ je vraag..."
          style={{ width: '100%', border: 'none', borderBottom: '2px solid rgba(12,10,7,0.10)', background: 'transparent', fontFamily: '"Cormorant Garamond", serif', fontSize: 22, color: '#2C2A25', padding: '6px 2px 12px', marginBottom: 8, outline: 'none', display: 'block' }}
          onFocus={(e) => { e.currentTarget.style.borderBottomColor = '#C4A265' }}
          onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(12,10,7,0.10)' }}
        />
        <p style={{ fontSize: 12, color: '#8C8579', margin: '4px 2px 20px', fontStyle: 'italic' }}>Vink de bolletjes aan bij de juiste antwoord(en). Meerdere mag.</p>

        {/* Options */}
        {optionType === 'image' ? (
          /* Photo grid — mockup b-photo-grid */
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {(block.options || []).map((opt, i) => (
                <div key={opt.id || i} style={{ border: `1.5px solid ${opt.correct ? '#5E8463' : 'rgba(12,10,7,0.10)'}`, borderRadius: 14, overflow: 'hidden', background: '#fff', position: 'relative' }}>
                  <div style={{ aspectRatio: '1', background: opt.image_url ? 'transparent' : '#ede7db', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb4a6', fontSize: 24 }}>
                    {opt.image_url ? (
                      <img src={opt.image_url} alt={opt.text} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <label style={{ cursor: 'pointer', padding: 16 }} onClick={(e) => e.stopPropagation()}>
                        ⛶ Upload
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(i, f) }} />
                      </label>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderTop: '1px solid rgba(12,10,7,0.10)' }}>
                    <span
                      onClick={() => toggleCorrect(i)}
                      style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${opt.correct ? '#5E8463' : '#d8d2c6'}`, background: opt.correct ? '#5E8463' : '#F2EEE6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s', flexShrink: 0 }}
                      title={opt.correct ? 'Juist antwoord (klik om uit te vinken)' : 'Klik = juist antwoord'}
                    >
                      <span style={{ opacity: opt.correct ? 1 : 0 }}>{checkSVG}</span>
                    </span>
                    <span style={{ fontSize: 13, color: '#8C8579' }}>Foto {String.fromCharCode(65 + i)}</span>
                  </div>
                  <button onClick={() => removeOption(i)} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 22, height: 22, fontSize: 12, color: '#c9b8b6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ))}
            </div>
            <button onClick={addOption} style={{ width: '100%', border: '1.5px dashed #C4A265', background: 'transparent', color: '#9E7E45', borderRadius: 12, padding: 13, fontFamily: 'Outfit', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', cursor: 'pointer', marginTop: 12 }}>+ Foto-optie toevoegen</button>
          </>
        ) : (
          /* Text options — mockup b-opt */
          <>
            {(block.options || []).map((opt, i) => (
              <div key={opt.id || i} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                border: `1.5px solid ${opt.correct ? '#5E8463' : 'rgba(12,10,7,0.10)'}`,
                borderRadius: 12, marginBottom: 12, background: opt.correct ? 'rgba(94,132,99,0.06)' : '#fff',
                transition: 'border-color .2s, background .2s'
              }}>
                {/* Letter */}
                <span style={{ flex: '0 0 22px', fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: 16, color: '#8C8579', textAlign: 'center' }}>{String.fromCharCode(65 + i)}</span>
                {/* Input */}
                <input
                  value={opt.text || ''}
                  onChange={(e) => updateOption(i, { text: e.target.value })}
                  placeholder={`Optie ${String.fromCharCode(65 + i)}`}
                  style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 15, color: '#2C2A25', outline: 'none' }}
                />
                {/* Correct check */}
                <span
                  onClick={() => toggleCorrect(i)}
                  style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${opt.correct ? '#5E8463' : '#d8d2c6'}`, background: opt.correct ? '#5E8463' : '#F2EEE6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s', flexShrink: 0 }}
                  title={opt.correct ? 'Juist antwoord (klik om uit te vinken)' : 'Klik = juist antwoord'}
                >
                  <span style={{ opacity: opt.correct ? 1 : 0 }}>{checkSVG}</span>
                </span>
                {/* Delete */}
                <span onClick={() => removeOption(i)} style={{ color: '#c9b8b6', cursor: 'pointer', fontSize: 15, padding: '2px 6px' }}>✕</span>
              </div>
            ))}
            <button onClick={addOption} style={{ width: '100%', border: '1.5px dashed #C4A265', background: 'transparent', color: '#9E7E45', borderRadius: 12, padding: 13, fontFamily: 'Outfit', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', cursor: 'pointer' }}>+ Optie toevoegen</button>
          </>
        )}
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
