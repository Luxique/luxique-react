'use client'

import { useEffect, useRef } from 'react'

export default function EyeShapes() {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let anim: number
    let speed = 0.5
    const scroll = () => {
      el.scrollLeft += speed
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth) {
        speed = -0.5
      } else if (el.scrollLeft <= 0) {
        speed = 0.5
      }
      anim = requestAnimationFrame(scroll)
    }
    anim = requestAnimationFrame(scroll)
    return () => cancelAnimationFrame(anim)
  }, [])

  const shapes = [
    { name: 'Almond', emoji: '👁️', desc: 'Bijna elke style werkt' },
    { name: 'Round', emoji: '🔵', desc: 'Verlenging + lift' },
    { name: 'Hooded', emoji: '🌙', desc: 'Strategische curl' },
    { name: 'Monolid', emoji: '🪬', desc: 'Volume voor diepte' },
    { name: 'Downturned', emoji: '↘️', desc: 'Lift met juiste curl' },
    { name: 'Upturned', emoji: '↗️', desc: 'Natuurlijke lift' },
    { name: 'Deep Set', emoji: '🕳️', desc: 'Lange curls' },
    { name: 'Close Set', emoji: '⬅️', desc: 'Focus outer corners' },
  ]

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="section-tag text-center">Kennis</div>
        <h2 className="section-title text-center mb-4">
          Oogvormen zeggen <em>alles</em>
        </h2>
        <p className="text-center text-[14px] text-[var(--text2)] max-w-[500px] mx-auto mb-12">
          Elke oogvorm vraagt een andere aanpak. Dit is wat de meeste cursussen overslaan.
        </p>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {shapes.map((s, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[160px] bg-[var(--bg2)] rounded-2xl p-5 text-center border border-[var(--border)] hover:border-[#D4AF37]/30 transition"
            >
              <div className="text-3xl mb-3">{s.emoji}</div>
              <h4 className="font-['Cormorant_Garamond'] text-[16px] font-normal mb-2">{s.name}</h4>
              <p className="text-[11px] text-[var(--text3)] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  )
}
