import React, { useRef } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

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
  options?: Array<{ id: string; text: string; correct: boolean }>
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

/* ── TextBlock (Tiptap Rich Text) ── */
export const TextBlock = React.memo(({ block, onUpdate }: BlockProps) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: typeof block.content === 'string' ? block.content : '',
    onUpdate: ({ editor }) => {
      onUpdate(block.id, { content: editor.getHTML() })
    },
  })

  return (
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
      {/* Toolbar */}
      <div className="flex gap-1 border-b border-[rgba(30,26,20,0.08)] pb-2 mb-2">
        <button onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded text-[11px] font-bold ${editor?.isActive('bold') ? 'bg-[rgba(196,162,101,0.15)] text-[#C4A265]' : 'text-[#7A7268] hover:bg-[rgba(30,26,20,0.05)]'}`}>
          B
        </button>
        <button onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded text-[11px] italic ${editor?.isActive('italic') ? 'bg-[rgba(196,162,101,0.15)] text-[#C4A265]' : 'text-[#7A7268] hover:bg-[rgba(30,26,20,0.05)]'}`}>
          I
        </button>
        <button onClick={() => editor?.chain().focus().toggleStrike().run()}
          className={`px-2 py-1 rounded text-[11px] line-through ${editor?.isActive('strike') ? 'bg-[rgba(196,162,101,0.15)] text-[#C4A265]' : 'text-[#7A7268] hover:bg-[rgba(30,26,20,0.05)]'}`}>
          S
        </button>
        <div className="w-px h-4 bg-[rgba(30,26,20,0.1)] mx-1 self-center" />
        <button onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded text-[11px] ${editor?.isActive('bulletList') ? 'bg-[rgba(196,162,101,0.15)] text-[#C4A265]' : 'text-[#7A7268] hover:bg-[rgba(30,26,20,0.05)]'}`}>
          • lijst
        </button>
        <button onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 rounded text-[11px] ${editor?.isActive('orderedList') ? 'bg-[rgba(196,162,101,0.15)] text-[#C4A265]' : 'text-[#7A7268] hover:bg-[rgba(30,26,20,0.05)]'}`}>
          1. lijst
        </button>
      </div>
      <EditorContent
        editor={editor}
        className="text-[13px] text-[#7A7268] leading-relaxed min-h-[80px] outline-none"
      />
    </div>
  )
})
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
export const QuizBlock = React.memo(({ block, onUpdate }: BlockProps) => (
  <div className="space-y-3">
    <input
      type="text"
      placeholder="Wat is de vraag?"
      value={block.question || ''}
      onChange={(e) => onUpdate(block.id, { question: e.target.value })}
      className="w-full bg-white border border-[rgba(30,26,20,0.09)] rounded-[8px] p-[9px_12px] text-[13px] outline-none focus:border-[rgba(80,190,120,0.4)]"
    />
    <div className="space-y-2">
      {(block.options || []).map((opt, i) => (
        <div key={opt.id || i} className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full border flex items-center justify-center text-[9.5px] font-medium cursor-pointer transition ${opt.correct ? 'bg-[rgba(80,190,120,0.08)] border-[rgba(80,190,120,0.22)] text-[rgba(80,190,120,0.9)]' : 'bg-[#F0EDE6] border-[rgba(30,26,20,0.09)] text-[#7A7268]'}`}
            onClick={() => onUpdate(block.id, { options: (block.options || []).map((o, j) => ({ ...o, correct: j === i })) })}
          >
            {String.fromCharCode(65 + i)}
          </div>
          <input
            type="text"
            placeholder={`Antwoord ${String.fromCharCode(65 + i)}`}
            value={opt.text || ''}
            onChange={(e) => onUpdate(block.id, { options: (block.options || []).map((o, j) => j === i ? { ...o, text: e.target.value } : o) })}
            className="flex-1 bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-[7px_10px] text-[12.5px] outline-none"
          />
        </div>
      ))}
    </div>
    <button className="text-[11px] text-[rgba(80,190,120,0.6)] hover:text-[rgba(80,190,120,0.9)] transition p-1">
      + Optie toevoegen
    </button>
    <div className="flex gap-2 pt-2 border-t border-[rgba(30,26,20,0.09)] flex-wrap">
      <select className="bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-1 px-2 text-[11px] text-[#7A7268] outline-none cursor-pointer">
        <option>Tussentijds</option>
        <option>Eindtoets</option>
      </select>
      <input
        type="number"
        placeholder="Punten"
        className="bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-1 px-2 text-[11px] text-[#1E1A14] outline-none w-16"
      />
      <span className="text-[9px] font-bold tracking-[0.14em] uppercase px-2 py-1 rounded-full bg-[rgba(80,190,120,0.08)] text-[rgba(80,190,120,0.9)] border border-[rgba(80,190,120,0.22)]">
        Quiz
      </span>
    </div>
  </div>
))
QuizBlock.displayName = 'QuizBlock'

/* ── CalloutBlock ── */
export const CalloutBlock = React.memo(({ block, onUpdate }: BlockProps) => (
  <div className="flex gap-3 items-start bg-[rgba(196,162,101,0.07)] border-l-3 border-[rgba(196,162,101,0.35)] rounded-r-lg p-3">
    <span className="text-[17px] flex-shrink-0 mt-0.5">💡</span>
    <textarea
      rows={2}
      placeholder="Tip of opmerking..."
      value={typeof block.content === 'string' ? block.content : ''}
      onChange={(e) => onUpdate(block.id, { content: e.target.value })}
      className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#1E1A14] leading-relaxed resize-none min-h-[45px]"
    />
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
