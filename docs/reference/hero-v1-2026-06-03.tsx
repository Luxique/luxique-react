// Hero v1 — live per 3 juni 2026, bewaard als referentie.
// Mobiele weergave blijft in gebruik. Desktop wordt vervangen door full-bleed variant.
// Snapshotted before hero-v2 desktop full-bleed implementation.

'use client'

import { useEffect, useState, useCallback } from 'react'

const IMG = 'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/hero-bg.webp'

const SLIDES = [
  { title: 'Wispy Set', sub: 'Behandeling · Arnhem', review: { name: 'Sarah M.', text: 'Na de cursus had ik direct mijn eerste klanten.' } },
  { title: 'Classic Set', sub: 'Behandeling · Arnhem', review: { name: 'Jessica K.', text: 'Chiva weet precies wat bij jouw ogen past.' } },
  { title: 'Volume Set', sub: 'Behandeling · Arnhem', review: { name: 'Ayesha B.', text: 'De coaching was op een ander niveau.' } },
  { title: 'LXQ Academy', sub: 'Opleiding · Online & Arnhem', review: { name: 'Nina R.', text: 'Eindelijk een opleiding die écht de diepte ingaat.' } },
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

  const review = SLIDES[current].review

  return (
    <div className="w-full h-full pt-[80px] max-md:pt-[72px] px-[14px] pb-[14px] max-md:px-[10px] max-md:pb-[10px]">
    <div className="w-full h-full grid grid-cols-1 md:grid-cols-[minmax(390px,420px)_1fr] gap-[14px] max-md:gap-[10px] overflow-hidden max-md:grid-rows-[auto_1fr]">
      {/* LEFT PANEL */}
      <div className="bg-[#FFFFFF] rounded-[22px] pt-10 px-[38px] max-md:px-[22px] max-md:pt-[26px] max-md:pb-7 max-md:shrink-0 max-md:flex-none flex flex-col overflow-hidden relative">
        <div className="absolute -top-[50px] -right-[50px] w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,rgba(196,162,101,0.14)_0%,transparent_70%)] pointer-events-none" />

        <div>
          <div className="inline-flex items-center gap-[7px] bg-[rgba(196,162,101,0.1)] border border-[rgba(196,162,101,0.22)] rounded-full px-[13px] py-[5px] text-[11px] text-[#7A6340] font-medium mb-6">
            <span className="text-[#C4A265] tracking-[1px]">★★★★★</span>
            5.0 · 47 reviews
          </div>

          <h1 className="font-['Outfit'] font-medium leading-[1.02] mb-[24px] max-w-[900px]">
            <span className="block text-[clamp(44px,6.5vw,88px)] text-[#1A1815] tracking-[-0.02em]">We Teach</span>
            <span className="block text-[clamp(44px,6.5vw,88px)] font-['Cormorant_Garamond'] italic font-normal text-[#C4A265]">The Art of Lashes.</span>
          </h1>

          <p className="text-[18px] text-[#7A7268] leading-[1.6] mb-[36px] max-w-[560px]">
            Behandelingen in Arnhem. Opleidingen voor de nieuwe lichting lash artists — door Nederland&apos;s #1 lash educator.
          </p>

          <div className="flex gap-[9px] flex-wrap">
            <a href="/courses" className="text-[13px] font-medium px-[22px] py-[11px] rounded-full bg-[#C4A265] text-white hover:bg-[#DFC08A] hover:shadow-[0_6px_20px_rgba(196,162,101,0.28)] hover:-translate-y-[1px] transition-all tracking-[0.02em]">
              Bekijk de academy
            </a>
            <a href="/behandelingen" className="text-[13px] font-medium px-[22px] py-[11px] rounded-full bg-transparent text-[#1A1815] border-[1.5px] border-[rgba(26,24,21,0.2)] hover:border-[rgba(26,24,21,0.45)] hover:bg-[rgba(196,162,101,0.06)] transition-all tracking-[0.02em]">
              Boek een treatment
            </a>
          </div>
        </div>

        {/* Image card — desktop only */}
        <div className="hidden md:block mt-auto mb-[38px] rounded-2xl overflow-hidden relative w-full">
          <img src={IMG} alt="Chiva" className="w-full h-auto max-h-[240px] min-h-[120px] object-cover" />
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

      {/* RIGHT PANEL — Slider (stays dark) */}
      <div className="rounded-[22px] overflow-visible relative bg-[#161310] min-h-[240px]">
        {SLIDES.map((slide, i) => (
          <div key={i} className="absolute inset-0 transition-opacity duration-[850ms] ease-in-out" style={{ opacity: current === i ? 1 : 0 }}>
            <img src={IMG} alt={slide.title} className="w-full h-full object-cover rounded-[22px]" />
            <div className="absolute top-5 right-5 bg-[rgba(12,10,7,0.55)] backdrop-blur-[14px] border border-[rgba(196,162,101,0.18)] rounded-[10px] px-[15px] py-[11px] z-[5] text-right">
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
        <div className="absolute bottom-[68px] max-md:bottom-[48px] left-5 max-w-[260px] bg-[rgba(12,10,7,0.58)] backdrop-blur-[14px] border border-[rgba(196,162,101,0.18)] rounded-[14px] px-[14px] py-[10px] z-[5] flex items-center gap-[10px] transition-opacity duration-[850ms]"
          style={{ opacity: current === current ? 1 : 0 }}>
          <div className="w-8 h-8 rounded-full bg-[rgba(196,162,101,0.3)] flex items-center justify-center text-[12px] text-[#DFC08A] font-semibold shrink-0 border-[1.5px] border-[rgba(196,162,101,0.4)]">
            {review.name[0]}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-[#DFC08A] mb-[2px]">{review.name}</div>
            <div className="text-[11px] text-[rgba(255,255,255,0.7)] leading-[1.4] italic truncate">&ldquo;{review.text}&rdquo;</div>
          </div>
        </div>

        {/* Slider pills */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[5] flex gap-[7px] max-md:gap-[5px] max-md:left-0 max-md:right-0 max-md:translate-x-0 max-md:px-4 max-md:justify-center">
          {SLIDES.map((slide, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={`relative overflow-hidden cursor-pointer transition-colors
                w-[32px] h-[4px] rounded-full bg-[rgba(12,10,7,0.45)] backdrop-blur-[10px]
                max-md:w-auto max-md:flex-1 max-md:max-w-[60px] max-md:h-[3px] max-md:rounded-full
                ${current === i ? 'border-none' : 'border-none'}`}>
              <span className="hidden">{slide.title}</span>
              {current === i && (
                <div key={animKey} className="pill-progress absolute inset-0 bg-[#C4A265] rounded-full origin-left" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
    </div>
  )
}
