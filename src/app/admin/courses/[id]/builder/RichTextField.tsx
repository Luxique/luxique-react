'use client'

import React, { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'

interface RichTextFieldProps {
  content: string
  onChange: (html: string) => void
  /** 'inline' = B/I/S/kleur/mark (no lists). 'block' = alles inclusief lists. Default: 'block' */
  variant?: 'inline' | 'block'
  placeholder?: string
  className?: string
}

const BRAND_PRESETS = [
  { label: 'Zwart', color: '#1E1A14' },
  { label: 'Goud', color: '#C4A265' },
  { label: 'Grijs', color: '#7A7268' },
  { label: 'Rood', color: '#E05A4E' },
  { label: 'Groen', color: '#4CAF82' },
  { label: 'Blauw', color: '#3B82F6' },
]

const HIGHLIGHT_PRESETS = [
  { label: 'Cream', color: '#FFF8E7' },
  { label: 'Goud', color: 'rgba(196,162,101,0.2)' },
  { label: 'Soft geel', color: 'rgba(255,235,150,0.35)' },
  { label: 'Soft roze', color: 'rgba(255,180,180,0.25)' },
  { label: 'Soft groen', color: 'rgba(180,255,180,0.25)' },
]

export default function RichTextField({ content, onChange, variant = 'block', placeholder, className = '' }: RichTextFieldProps) {
  const [showTextColor, setShowTextColor] = useState(false)
  const [showHighlight, setShowHighlight] = useState(false)
  const [hexInput, setHexInput] = useState('#C4A265')
  const [hexHighlight, setHexHighlight] = useState('#FFF8E7')
  const isBlock = variant === 'block'

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: isBlock ? {} : false,
        orderedList: isBlock ? {} : false,
        listItem: isBlock ? {} : false,
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Sync external content changes
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '', { emitUpdate: false })
    }
  }, [content, editor])

  if (!editor) return null

  const applyHexColor = () => {
    let hex = hexInput.trim()
    if (!hex.startsWith('#')) hex = '#' + hex
    if (/^#[0-9A-Fa-f]{6}$/.test(hex) || /^#[0-9A-Fa-f]{3}$/.test(hex)) {
      editor.chain().focus().setColor(hex).run()
      setShowTextColor(false)
    }
  }

  const applyHexHighlight = () => {
    let hex = hexHighlight.trim()
    if (!hex.startsWith('#')) hex = '#' + hex
    if (/^#[0-9A-Fa-f]{6}$/.test(hex) || /^#[0-9A-Fa-f]{3}$/.test(hex)) {
      editor.chain().focus().toggleHighlight({ color: hex }).run()
      setShowHighlight(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      {placeholder && !editor.getText() && (
        <div className="absolute top-0 left-0 text-[#bbb] text-[13px] pointer-events-none">{placeholder}</div>
      )}
      <EditorContent
        editor={editor}
        className={`text-[13px] text-[#7A7268] leading-relaxed outline-none ${isBlock ? 'min-h-[80px]' : 'min-h-[32px]'}`}
      />
      {/* Toolbar — onder het veld */}
      <div className="flex items-center gap-0.5 border-t border-[rgba(30,26,20,0.08)] pt-1.5 mt-1.5 flex-wrap">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${editor.isActive('bold') ? 'bg-[rgba(196,162,101,0.15)] text-[#C4A265]' : 'text-[#7A7268] hover:bg-[rgba(30,26,20,0.05)]'}`}
        >B</button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-1.5 py-0.5 rounded text-[10px] italic ${editor.isActive('italic') ? 'bg-[rgba(196,162,101,0.15)] text-[#C4A265]' : 'text-[#7A7268] hover:bg-[rgba(30,26,20,0.05)]'}`}
        >I</button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-1.5 py-0.5 rounded text-[10px] line-through ${editor.isActive('strike') ? 'bg-[rgba(196,162,101,0.15)] text-[#C4A265]' : 'text-[#7A7268] hover:bg-[rgba(30,26,20,0.05)]'}`}
        >S</button>
        {isBlock && (
          <>
            <div className="w-px h-3 bg-[rgba(30,26,20,0.1)] mx-0.5" />
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`px-1.5 py-0.5 rounded text-[10px] ${editor.isActive('bulletList') ? 'bg-[rgba(196,162,101,0.15)] text-[#C4A265]' : 'text-[#7A7268] hover:bg-[rgba(30,26,20,0.05)]'}`}
            >• lijst</button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`px-1.5 py-0.5 rounded text-[10px] ${editor.isActive('orderedList') ? 'bg-[rgba(196,162,101,0.15)] text-[#C4A265]' : 'text-[#7A7268] hover:bg-[rgba(30,26,20,0.05)]'}`}
            >1. lijst</button>
          </>
        )}
        <div className="w-px h-3 bg-[rgba(30,26,20,0.1)] mx-0.5" />
        {/* Text color — full picker */}
        <div className="relative">
          <button
            onClick={() => { setShowHighlight(false); setShowTextColor(!showTextColor) }}
            className={`px-1.5 py-0.5 rounded text-[10px] ${showTextColor ? 'bg-[rgba(196,162,101,0.15)] text-[#C4A265]' : 'text-[#7A7268] hover:bg-[rgba(30,26,20,0.05)]'}`}
          >A▼</button>
          {showTextColor && (
            <div className="absolute bottom-full mb-1 left-0 bg-white border border-[rgba(30,26,20,0.12)] rounded-lg shadow-lg p-2 z-50 w-[180px]">
              {/* Brand presets */}
              <div className="text-[9px] font-semibold text-[#aaa] uppercase tracking-wide mb-1">Merkkleuren</div>
              <div className="flex gap-1 mb-2">
                {BRAND_PRESETS.map(c => (
                  <button key={c.color} title={c.label}
                    onClick={() => { editor.chain().focus().setColor(c.color).run(); setShowTextColor(false) }}
                    className="w-5 h-5 rounded-full border border-[rgba(30,26,20,0.15)] hover:scale-110 transition"
                    style={{ backgroundColor: c.color }}
                  />
                ))}
              </div>
              {/* Full color picker */}
              <div className="text-[9px] font-semibold text-[#aaa] uppercase tracking-wide mb-1">Alle kleuren</div>
              <input
                type="color"
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value)}
                className="w-full h-8 rounded cursor-pointer mb-2"
              />
              {/* Hex input */}
              <div className="flex gap-1">
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => setHexInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyHexColor()}
                  placeholder="#C4A265"
                  className="flex-1 px-2 py-1 text-[11px] border border-[#eee] rounded font-mono outline-none focus:border-[#C4A265]"
                />
                <button
                  onClick={applyHexColor}
                  className="px-2 py-1 text-[10px] bg-[#0C0A07] text-white rounded hover:bg-[#333] transition"
                >OK</button>
              </div>
              <button
                onClick={() => { editor.chain().focus().unsetColor().run(); setShowTextColor(false) }}
                className="w-full mt-1.5 text-[10px] text-[#aaa] hover:text-[#E05A4E] transition"
              >✕ Reset kleur</button>
            </div>
          )}
        </div>
        {/* Highlight — full picker */}
        <div className="relative">
          <button
            onClick={() => { setShowTextColor(false); setShowHighlight(!showHighlight) }}
            className={`px-1.5 py-0.5 rounded text-[10px] ${showHighlight || editor.isActive('highlight') ? 'bg-[rgba(196,162,101,0.15)] text-[#C4A265]' : 'text-[#7A7268] hover:bg-[rgba(30,26,20,0.05)]'}`}
          >🖍▼</button>
          {showHighlight && (
            <div className="absolute bottom-full mb-1 left-0 bg-white border border-[rgba(30,26,20,0.12)] rounded-lg shadow-lg p-2 z-50 w-[180px]">
              <div className="text-[9px] font-semibold text-[#aaa] uppercase tracking-wide mb-1">Highlights</div>
              <div className="flex gap-1 mb-2">
                {HIGHLIGHT_PRESETS.map(c => (
                  <button key={c.color} title={c.label}
                    onClick={() => { editor.chain().focus().toggleHighlight({ color: c.color }).run(); setShowHighlight(false) }}
                    className="w-5 h-5 rounded-full border border-[rgba(30,26,20,0.15)] hover:scale-110 transition"
                    style={{ backgroundColor: c.color }}
                  />
                ))}
              </div>
              <div className="text-[9px] font-semibold text-[#aaa] uppercase tracking-wide mb-1">Custom highlight</div>
              <input
                type="color"
                value={hexHighlight}
                onChange={(e) => setHexHighlight(e.target.value)}
                className="w-full h-8 rounded cursor-pointer mb-2"
              />
              <div className="flex gap-1">
                <input
                  type="text"
                  value={hexHighlight}
                  onChange={(e) => setHexHighlight(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyHexHighlight()}
                  placeholder="#FFF8E7"
                  className="flex-1 px-2 py-1 text-[11px] border border-[#eee] rounded font-mono outline-none focus:border-[#C4A265]"
                />
                <button
                  onClick={applyHexHighlight}
                  className="px-2 py-1 text-[10px] bg-[#0C0A07] text-white rounded hover:bg-[#333] transition"
                >OK</button>
              </div>
              <button
                onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowHighlight(false) }}
                className="w-full mt-1.5 text-[10px] text-[#aaa] hover:text-[#E05A4E] transition"
              >✕ Reset highlight</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
