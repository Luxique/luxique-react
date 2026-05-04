'use client'

import { useState } from 'react'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Floating chat button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#D4AF37] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
        aria-label="Chat"
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 110-18 9 9 0 010 18z" />
          </svg>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[340px] max-h-[480px] bg-white rounded-2xl shadow-2xl border border-[#eee] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-[#D4AF37] px-5 py-4">
            <h3 className="text-white font-semibold text-[14px]">LXQ Assistant</h3>
            <p className="text-white/70 text-[11px]">Stel je vraag over onze cursussen</p>
          </div>
          {/* Body */}
          <div className="flex-1 p-5 overflow-y-auto">
            <div className="bg-[#f9f8f6] rounded-xl p-4 text-[13px] text-[#666] leading-relaxed">
              👋 Hey! Hoe kunnen wij je helpen? Vraag alles over onze cursussen, behandelingen, of planning.
            </div>
          </div>
          {/* Input */}
          <div className="border-t border-[#eee] p-4">
            <input
              type="text"
              placeholder="Typ je bericht..."
              className="w-full px-4 py-2.5 rounded-full border border-[#ddd] text-[13px] focus:outline-none focus:border-[#D4AF37] transition"
            />
          </div>
        </div>
      )}
    </>
  )
}
