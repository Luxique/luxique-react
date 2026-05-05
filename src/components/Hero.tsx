'use client'

import { useEffect, useState, useCallback } from 'react'

const SLIDES = [
  { title: 'Wispy Set', sub: 'Behandeling · Arnhem' },
  { title: 'Classic Set', sub: 'Behandeling · Arnhem' },
  { title: 'Volume Set', sub: 'Behandeling · Arnhem' },
  { title: 'LXQ Academy', sub: 'Opleiding · Online & Arnhem' },
]

const DURATION = 4500

export default function Hero() {
  const [current, setCurrent] = useState(0)
  const [animKey, setAnimKey] = useState(0)

  const goTo = useCallback((index: number) => {
    setCurrent(index)
    setAnimKey(k => k + 1)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => {
        const next = (prev + 1) % SLIDES.length
        setAnimKey(k => k + 1)
        return next
      })
    }, DURATION)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="w-full h-full p-[20px_14px_14px_14px] max-md:p-[16px_10px_10px_10px]">
    <div className="w-full h-full grid grid-cols-1 md:grid-cols-[minmax(390px,420px)_1fr] gap-[14px] max-md:gap-[10px] overflow-hidden max-md:grid-rows-[auto_1fr]">
      {/* LEFT PANEL */}
      <div className="bg-[#FAF8F4] rounded-[22px] pt-10 px-[38px] max-md:px-[22px] max-md:pt-[26px] max-md:pb-7 max-md:shrink-0 max-md:flex-none flex flex-col overflow-hidden relative">
        {/* Gold glow */}
        <div className="absolute -top-[50px] -right-[50px] w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,rgba(196,162,101,0.18)_0%,transparent_70%)] pointer-events-none" />

        <div>
          <div className="inline-flex items-center gap-[7px] bg-[rgba(196,162,101,0.1)] border border-[rgba(196,162,101,0.22)] rounded-full px-[13px] py-[5px] text-[11px] text-[#7A6340] font-medium mb-6">
            <span className="text-[#C4A265] tracking-[1px]">★★★★★</span>
            5.0 · 47 reviews
          </div>

          <h1 className="font-['Cormorant_Garamond'] font-normal leading-[1.04] mb-[14px]">
            <span className="block text-[clamp(30px,2.8vw,46px)] text-[#1E1A14]">We Teach</span>
            <span className="block text-[clamp(32px,3.1vw,50px)] italic text-[#C4A265]">The Art of Lashes.</span>
          </h1>

          <p className="text-[13px] text-[#7A7268] leading-[1.7] mb-[26px] max-w-[290px]">
            Behandelingen in Arnhem. Opleidingen voor de nieuwe lichting lash artists — door Nederland&apos;s #1 lash educator.
          </p>

          <div className="flex gap-[9px] flex-wrap">
            <a href="/courses" className="text-[13px] font-medium px-[22px] py-[11px] rounded-full bg-[#C4A265] text-white hover:bg-[#DFC08A] hover:shadow-[0_6px_20px_rgba(196,162,101,0.28)] hover:-translate-y-[1px] transition-all tracking-[0.02em]">
              Bekijk de academy
            </a>
            <a href="/booking" className="text-[13px] font-medium px-[22px] py-[11px] rounded-full bg-transparent text-[#1E1A14] border-[1.5px] border-[rgba(30,26,20,0.3)] hover:border-[rgba(30,26,20,0.55)] hover:bg-[rgba(30,26,20,0.04)] transition-all tracking-[0.02em]">
              Boek een treatment
            </a>
          </div>
        </div>

        {/* Image card — desktop only */}
        <div className="hidden md:block mt-auto mb-[38px] rounded-2xl overflow-hidden relative w-full">
          <img src="https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/hero-bg.jpg" alt="Chiva" className="w-full h-auto max-h-[240px] min-h-[120px] object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(12,10,7,0.82)_0%,rgba(12,10,7,0.3)_55%,transparent_100%)] pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 p-[18px_20px] z-[2] flex items-end justify-between gap-3">
            <div>
              <div className="text-[9.5px] font-semibold tracking-[0.18em] uppercase text-[#C4A265] mb-1">Persoonlijk Traject</div>
              <div className="font-['Cormorant_Garamond'] text-[17px] italic text-white leading-[1.2]">Van beginner<br />tot lash artist.</div>
            </div>
            <a href="/courses" className="text-[11px] font-medium tracking-[0.06em] text-white bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.25)] backdrop-blur-[8px] rounded-full px-4 py-2 hover:bg-[rgba(255,255,255,0.2)] transition whitespace-nowrap shrink-0">
              Meer info →
            </a>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — Slider */}
      <div className="rounded-[22px] overflow-visible relative bg-[#161310] min-h-[240px]">
        {SLIDES.map((slide, i) => (
          <div key={i} className="absolute inset-0 transition-opacity duration-[850ms] ease-in-out" style={{ opacity: current === i ? 1 : 0 }}>
            <img src="https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/hero-bg.jpg" alt={slide.title} className="w-full h-full object-cover rounded-[22px]" />
            <div className="absolute top-5 right-5 bg-[rgba(12,10,7,0.55)] backdrop-blur-[14px] border border-[rgba(196,162,101,0.18)] rounded-[10px] max-md:rounded-[10px] px-[15px] py-[11px] z-[5] text-right">
              <span className="block font-['Cormorant_Garamond'] text-[15px] italic text-[#DFC08A] mb-[2px]">{slide.title}</span>
              <span className="text-[10px] text-[rgba(255,255,255,0.42)] tracking-[0.1em] uppercase">{slide.sub}</span>
            </div>
          </div>
        ))}

        {/* Brand overlay */}
        <div className="absolute bottom-0 left-0 right-0 font-['Avenir_Next'] font-[200] text-[clamp(60px,14vw,200px)] max-md:text-[18vw] tracking-[0.18em] text-center text-[rgba(196,162,101,0.11)] leading-none pointer-events-none z-[4] whitespace-nowrap select-none uppercase overflow-visible pb-2">
          LUXIQUE
        </div>

        {/* Review badge */}
        <div className="absolute bottom-[68px] max-md:bottom-[60px] left-5 bg-[rgba(12,10,7,0.58)] backdrop-blur-[14px] border border-[rgba(196,162,101,0.18)] rounded-[14px] px-[15px] py-[11px] z-[5] flex items-center gap-[10px]">
          <div className="text-[#C4A265] text-[13px] tracking-[1.5px]">★★★★★</div>
          <div>
            <div className="font-['Cormorant_Garamond'] text-[20px] text-white leading-none">5.0</div>
            <div className="text-[10px] text-[rgba(255,255,255,0.38)] tracking-[0.08em] uppercase mt-[2px]">47 reviews</div>
          </div>
        </div>

        {/* Slider pills */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-[7px] z-[5] whitespace-nowrap">
          {SLIDES.map((slide, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={`relative text-[10.5px] font-medium tracking-[0.07em] uppercase px-[15px] py-[7px] rounded-full border cursor-pointer overflow-hidden bg-[rgba(12,10,7,0.45)] backdrop-blur-[10px] transition-colors ${current === i ? 'text-white border-[#C4A265]' : 'text-[rgba(255,255,255,0.5)] border-[rgba(255,255,255,0.18)]'}`}>
              {current === i && (
                <div key={animKey} className="pill-progress absolute inset-0 bg-[#C4A265] rounded-full origin-left" />
              )}
              <span className="relative z-[1]">{slide.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
    </div>
  )
}
