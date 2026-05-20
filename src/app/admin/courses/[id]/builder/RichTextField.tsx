'use client'

import React, { useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'

interface RichTextFieldProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  minH?: number
}

const TEXT_COLORS = [
  { label: 'Zwart', color: '#1E1A14' },
  { label: 'Goud', color: '#C4A265' },
  { label: 'Grijs', color: '#7A7268' },
]

const HIGHLIGHT_COLORS = [
  { label: 'Cream', color: '#FFF8E7' },
  { label: 'Goud', color: 'rgba(196,162,101,0.2)' },
  { label: 'Soft geel', color: 'rgba(255,235,150,0.35)' },
  { label: 'Soft roze', color: 'rgba(255,180,180,0.25)' },
]

export default function RichTextField({ content, onChange }: RichTextFieldProps) {
  const [showTextColor, setShowTextColor] = useState(false)
  const [showHighlight, setShowHighlight] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  const closeDropdowns = useCallback(() => {
    setShowTextColor(false)
    setShowHighlight(false)
  }, [])

  if (!editor) return null

  return (
    <div className="relative">
      {/* Toolbar — onder het veld */}
      <EditorContent
        editor={editor}
        className="text-[13px] text-[#7A7268] leading-relaxed min-h-[80px] outline-none"
      />
      <div className="flex items-center gap-0.5 border-t border-[rgba(30,26,20,0.08)] pt-2 mt-2 flex-wrap">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded text-[11px] font-bold ${editor.isActive('bold') ? 'bg-[rgba(196,162,101,0.15)] text-[#C4A265]' : 'text-[#7A7268] hover:bg-[rgba(30,26,20,0.05)]'}`}
        >B</button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded text-[11px] italic ${editor.isActive('italic') ? 'bg-[rgba(196,162,101,0.15)] text-[#C4A265]' : 'text-[#7A7268] hover:bg-[rgba(30,26,20,0.05)]'}`}
        >I</button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-2 py-1 rounded text-[11px] line-through ${editor.isActive('strike') ? 'bg-[rgba(196,162,101,0.15)] text-[#C4A265]' : 'text-[#7A7268] hover:bg-[rgba(30,26,20,0.05)]'}`}
        >S</button>
        <div className="w-px h-4 bg-[rgba(30,26,20,0.1)] mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded text-[11px] ${editor.isActive('bulletList') ? 'bg-[rgba(196,162,101,0.15)] text-[#C4A265]' : 'text-[#7A7268] hover:bg-[rgba(30,26,20,0.05)]'}`}
        >• lijst</button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 rounded text-[11px] ${editor.isActive('orderedList') ? 'bg-[rgba(196,162,101,0.15)] text-[#C4A265]' : 'text-[#7A7268] hover:bg-[rgba(30,26,20,0.05)]'}`}
        >1. lijst</button>
        <div className="w-px h-4 bg-[rgba(30,26,20,0.1)] mx-1" />
        {/* Text color */}
        <div className="relative">
          <button
            onClick={() => { setShowHighlight(false); setShowTextColor(!showTextColor) }}
            className={`px-2 py-1 rounded text-[11px] ${showTextColor ? 'bg-[rgba(196,162,101,0.15)] text-[#C4A265]' : 'text-[#7A7268] hover:bg-[rgba(30,26,20,0.05)]'}`}
          >A<span className="text-[8px] ml-0.5">▼</span></button>
          {showTextColor && (
            <div className="absolute bottom-full mb-1 left-0 bg-white border border-[rgba(30,26,20,0.12)] rounded-lg shadow-lg p-1.5 flex gap-1 z-50">
              {TEXT_COLORS.map(c => (
                <button
                  key={c.color}
                  title={c.label}
                  onClick={() => { editor.chain().focus().setColor(c.color).run(); closeDropdowns() }}
                  className="w-5 h-5 rounded-full border border-[rgba(30,26,20,0.15)] hover:scale-110 transition"
                  style={{ backgroundColor: c.color }}
                />
              ))}
              <button
                title="Reset"
                onClick={() => { editor.chain().focus().unsetColor().run(); closeDropdowns() }}
                className="w-5 h-5 rounded-full border border-[rgba(30,26,20,0.15)] bg-white flex items-center justify-center text-[9px] text-[#7A7268] hover:scale-110 transition"
              >✕</button>
            </div>
          )}
        </div>
        {/* Highlight */}
        <div className="relative">
          <button
            onClick={() => { setShowTextColor(false); setShowHighlight(!showHighlight) }}
            className={`px-2 py-1 rounded text-[11px] ${showHighlight || editor.isActive('highlight') ? 'bg-[rgba(196,162,101,0.15)] text-[#C4A265]' : 'text-[#7A7268] hover:bg-[rgba(30,26,20,0.05)]'}`}
          >🖍<span className="text-[8px] ml-0.5">▼</span></button>
          {showHighlight && (
            <div className="absolute bottom-full mb-1 left-0 bg-white border border-[rgba(30,26,20,0.12)] rounded-lg shadow-lg p-1.5 flex gap-1 z-50">
              {HIGHLIGHT_COLORS.map(c => (
                <button
                  key={c.color}
                  title={c.label}
                  onClick={() => { editor.chain().focus().toggleHighlight({ color: c.color }).run(); closeDropdowns() }}
                  className="w-5 h-5 rounded-full border border-[rgba(30,26,20,0.15)] hover:scale-110 transition"
                  style={{ backgroundColor: c.color }}
                />
              ))}
              <button
                title="Reset"
                onClick={() => { editor.chain().focus().unsetHighlight().run(); closeDropdowns() }}
                className="w-5 h-5 rounded-full border border-[rgba(30,26,20,0.15)] bg-white flex items-center justify-center text-[9px] text-[#7A7268] hover:scale-110 transition"
              >✕</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
