'use client'

import { useEffect, useState, useCallback } from 'react'
import './hero-v2.css'

const IMG_ORIG = 'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/hero-bg.webp'
const IMG_1 = 'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/header1.webp'
const IMG_2 = 'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/header2.webp'
const IMG_3 = 'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/header4.webp'

const SLIDES = [
  { img: IMG_ORIG, title: 'Wispy Set', sub: 'Behandeling · Arnhem', review: { name: 'Sarah M.', text: 'Na de cursus had ik direct mijn eerste klanten.' } },
  { img: IMG_2, title: 'Classic Set', sub: 'Behandeling · Arnhem', review: { name: 'Jessica K.', text: 'Chiva weet precies wat bij jouw ogen past.' } },
  { img: IMG_3, title: 'Volume Set', sub: 'Behandeling · Arnhem', review: { name: 'Ayesha B.', text: 'De coaching was op een ander niveau.' } },
  { img: IMG_1, title: 'LXQ Academy', sub: 'Opleiding · Online & Arnhem', review: { name: 'Nina R.', text: 'Eindelijk een opleiding die écht de diepte ingaat.' } },
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
    <>
      {/* ═══════════════════════════════════════════
          DESKTOP HERO (≥768px) — Full-bleed light variant
          ═══════════════════════════════════════════ */}
      <div className="hidden md:block w-full px-[14px] pb-[14px] pt-[8px]">
        <section className="hero-v2">
          {/* Background image (slides) */}
          {SLIDES.map((slide, i) => (
            <img
              key={i}
              src={SLIDES[i].img || IMG_ORIG}
              alt={slide.title}
              className="hero-v2-bg"
              style={{ opacity: current === i ? 1 : 0 }}
            />
          ))}

          {/* Light veil overlay */}
          <div className="hero-v2-veil" />

          {/* Watermark */}
          <div className="hero-v2-watermark">LUXIQUE</div>

          {/* Top-right behandeling tag — light style */}
          <div className="hero-v2-tag">
            <div className="hero-v2-tag-title">{SLIDES[current].title}</div>
            <div className="hero-v2-tag-sub">{SLIDES[current].sub.toUpperCase()}</div>
          </div>

          {/* Centered light frosted glass box */}
          <div className="hero-v2-glass" key={`glass-${animKey}`}>
            <div className="hero-v2-reviews">
              <span className="hero-v2-stars">★★★★★</span>
              <span className="hero-v2-reviews-text">5.0 · 47 reviews</span>
            </div>
            <h1 className="hero-v2-h1">
              We Teach
              <em>The Art of Lashes.</em>
            </h1>
            <p className="hero-v2-p">
              Behandelingen in Arnhem. Opleidingen voor de nieuwe lichting lash artists — door Nederland&apos;s #1 lash educator.
            </p>
            <div className="hero-v2-cta">
              <a href="/courses" className="hero-v2-cta-primary">Bekijk de academy</a>
              <a href="/behandelingen" className="hero-v2-cta-ghost">Boek een treatment</a>
            </div>
          </div>

          {/* Per-slide review badge — bottom-left */}
          <div className="hero-v2-review" style={{ opacity: 1 }}>
            <div className="hero-v2-review-avatar">{review.name[0]}</div>
            <div>
              <div className="hero-v2-review-name">{review.name}</div>
              <div className="hero-v2-review-text">&ldquo;{review.text}&rdquo;</div>
            </div>
          </div>

          {/* Slider dots */}
          <div className="hero-v2-dots">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`hero-v2-dot ${current === i ? 'on' : ''}`}
              />
            ))}
          </div>
        </section>
      </div>

      {/* ═══════════════════════════════════════════
          MOBILE HERO (<768px) — Original layout, pixel-identical
          ═══════════════════════════════════════════ */}
      <div className="md:hidden w-full h-full pt-[72px] px-[10px] pb-[10px]">
        <div className="w-full h-full grid grid-cols-1 gap-[10px] overflow-hidden grid-rows-[auto_1fr]">
          {/* LEFT/TOP PANEL */}
          <div className="bg-[#FFFFFF] rounded-[22px] pt-[26px] px-[22px] pb-7 shrink-0 flex-none flex flex-col overflow-hidden relative">
            <div className="absolute -top-[50px] -right-[50px] w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,rgba(196,162,101,0.14)_0%,transparent_70%)] pointer-events-none" />

            <div>
              <div className="inline-flex items-center gap-[7px] bg-[rgba(12,10,7,0.88)] border border-[rgba(176,141,79,0.5)] rounded-full px-[13px] py-[5px] text-[11px] text-[#E0C078] font-medium mb-6">
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
                <a href="/courses" className="text-[14px] font-medium px-[22px] py-[11px] rounded-full bg-[#C4A265] text-white hover:bg-[#DFC08A] hover:shadow-[0_6px_20px_rgba(196,162,101,0.28)] hover:-translate-y-[1px] transition-all tracking-[0.02em]">
                  Bekijk de academy
                </a>
                <a href="/behandelingen" className="text-[14px] font-medium px-[22px] py-[11px] rounded-full bg-transparent text-[#1A1815] border-[1.5px] border-[rgba(26,24,21,0.2)] hover:border-[rgba(26,24,21,0.45)] hover:bg-[rgba(196,162,101,0.06)] transition-all tracking-[0.02em]">
                  Boek een treatment
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT/BOTTOM PANEL — Slider */}
          <div className="rounded-[22px] overflow-visible relative bg-[#161310] min-h-[240px]">
            {SLIDES.map((slide, i) => (
              <div key={i} className="absolute inset-0 transition-opacity duration-[850ms] ease-in-out" style={{ opacity: current === i ? 1 : 0 }}>
                <img src={slide.img || IMG_ORIG} alt={slide.title} className="w-full h-full object-cover rounded-[22px]" />
                <div className="absolute top-5 right-5 bg-[rgba(12,10,7,0.55)] backdrop-blur-[14px] border border-[rgba(196,162,101,0.18)] rounded-[10px] px-[15px] py-[11px] z-[5] text-right">
                  <span className="block font-['Cormorant_Garamond'] text-[17px] italic text-[#DFC08A] mb-[2px]">{slide.title}</span>
                  <span className="text-[10px] text-[rgba(255,255,255,0.42)] tracking-[0.1em] uppercase">{slide.sub}</span>
                </div>
              </div>
            ))}

            {/* Brand overlay */}
            <div className="absolute bottom-0 left-0 right-0 font-['Avenir_Next'] font-[200] text-[18vw] tracking-[0.18em] text-center text-[rgba(196,162,101,0.11)] leading-none pointer-events-none z-[4] whitespace-nowrap select-none uppercase overflow-visible pb-2">
              LUXIQUE
            </div>

            {/* Review badge */}
            <div className="absolute bottom-[48px] left-5 max-w-[260px] bg-[rgba(12,10,7,0.58)] backdrop-blur-[14px] border border-[rgba(196,162,101,0.18)] rounded-[14px] px-[14px] py-[10px] z-[5] flex items-center gap-[10px] transition-opacity duration-[850ms]"
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
            <div className="absolute bottom-5 left-0 right-0 z-[5] flex gap-[5px] px-4 justify-center">
              {SLIDES.map((slide, i) => (
                <button key={i} onClick={() => goTo(i)}
                  className={`relative overflow-hidden cursor-pointer transition-colors
                    w-auto flex-1 max-w-[60px] h-[3px] rounded-full bg-[rgba(12,10,7,0.45)] backdrop-blur-[10px] border-none`}>
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
    </>
  )
}
