'use client'

import { useState } from 'react'

export default function BookingSection() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <section id="boeken" className="py-24 bg-white">
      <div className="max-w-[800px] mx-auto px-6">
        <div className="section-tag text-center w-full flex justify-center">Agenda</div>
        <h2 className="section-title text-center mb-4">
          Plan jouw<br /><em>afspraak</em>
        </h2>
        <p className="text-center text-[14px] text-[var(--text2)] mb-12">
          Kies je behandeling en plan direct in.
        </p>

        {!selected ? (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Nieuwe Set */}
            <div className="booking-card" onClick={() => setSelected('nieuwe-set')}>
              <div className="w-14 h-14 rounded-full bg-[var(--rose-pale)] flex items-center justify-center text-2xl mx-auto mb-4">👁</div>
              <h3 className="font-['Cormorant_Garamond'] text-[20px] font-normal mb-2">Nieuwe Set</h3>
              <p className="text-[12px] text-[var(--text2)] leading-relaxed mb-3">
                Volledig op maat. Inclusief uitgebreid consult en lash mapping.
              </p>
              <div className="text-[11px] text-[var(--text3)]">180 minuten</div>
            </div>

            {/* Opvullen */}
            <div className="booking-card" onClick={() => setSelected('opvullen')}>
              <div className="w-14 h-14 rounded-full bg-[var(--rose-pale)] flex items-center justify-center text-2xl mx-auto mb-4">🔄</div>
              <h3 className="font-['Cormorant_Garamond'] text-[20px] font-normal mb-2">Opvullen</h3>
              <p className="text-[12px] text-[var(--text2)] leading-relaxed mb-3">
                Jouw persoonlijke lash map staat opgeslagen. We recreëren je set.
              </p>
              <div className="text-[11px] text-[var(--text3)]">120 minuten</div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-['Cormorant_Garamond'] text-[18px]">
                {selected === 'nieuwe-set' ? 'Nieuwe Set — 180 min' : 'Opvullen — 120 min'}
              </span>
              <button onClick={() => setSelected(null)} className="text-[12px] text-[var(--text2)] border border-[var(--border)] rounded-xl px-4 py-2 hover:border-[var(--rose)] transition">
                ← Andere behandeling
              </button>
            </div>
            <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl p-2 min-h-[600px]">
              <div id="cal-inline-booking" className="w-full min-h-[600px] flex items-center justify-center text-[var(--text3)]">
                {/* Cal.com inline embed will be loaded here */}
                <div className="text-center">
                  <div className="text-3xl mb-3">📅</div>
                  <p className="text-[13px]">Cal.com kalender wordt hier geladen</p>
                  <p className="text-[11px] mt-1">Integratie wordt actief na Cal.com event type setup</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
