'use client'

import { useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

const EYE_SHAPES = [
  { num: '01', icon: '👁️', name: 'Almond', tip: 'Bijna elke style werkt' },
  { num: '02', icon: '🔵', name: 'Round', tip: 'Verlenging + lift' },
  { num: '03', icon: '🌙', name: 'Hooded', tip: 'Strategische curl' },
  { num: '04', icon: '🖐️', name: 'Monolid', tip: 'Volume voor diepte' },
  { num: '05', icon: '↗️', name: 'Upturned', tip: 'Natuurlijke lift' },
  { num: '06', icon: '↘️', name: 'Downturned', tip: 'Lift met juiste curl' },
  { num: '07', icon: '◼️', name: 'Deep Set', tip: 'Lange curls' },
  { num: '08', icon: '🔗', name: 'Close Set', tip: 'Focus outer corners' },
  { num: '09', icon: '↔️', name: 'Wide Set', tip: 'Inner corner focus' },
  { num: '10', icon: '💧', name: 'Protruding', tip: 'Gedempt volume' },
]

const CARD_COLORS = [
  '#2C3B35', '#3B2E24', '#1E2D3A', '#3A2C1E', '#2A3328',
  '#35282A', '#1F2E2A', '#302818', '#2B2535', '#1E3030',
]

function EyeCard({ shape, index }: { shape: typeof EYE_SHAPES[number]; index: number }) {
  return (
    <div
      className="eye-card group"
      style={{ background: CARD_COLORS[index % CARD_COLORS.length] }}
    >
      <div className="card-accent" />
      <div className="card-top">
        <span className="card-num">{shape.num}</span>
        <span className="card-arrow">
          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </div>
      <div className="card-icon">{shape.icon}</div>
      <div className="card-bottom">
        <p className="card-name">{shape.name}</p>
        <p className="card-tip">{shape.tip}</p>
      </div>
    </div>
  )
}

export default function EyeShapes() {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragOffset = useRef(0)

  const handleMouseDown = useCallback(() => {
    isDragging.current = true
    dragOffset.current = 0
    if (trackRef.current) trackRef.current.style.animationPlayState = 'paused'
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !trackRef.current) return
      dragOffset.current += e.movementX
      trackRef.current.style.transform = `translateX(${dragOffset.current}px)`
    }
    const handleMouseUp = () => {
      if (!isDragging.current) return
      isDragging.current = false
      setTimeout(() => {
        if (trackRef.current) {
          trackRef.current.style.transform = ''
          trackRef.current.style.animationPlayState = 'running'
        }
      }, 700)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handleTouchStart = useCallback(() => {
    if (trackRef.current) trackRef.current.style.animationPlayState = 'paused'
  }, [])

  const handleTouchEnd = useCallback(() => {
    setTimeout(() => {
      if (trackRef.current) trackRef.current.style.animationPlayState = 'running'
    }, 900)
  }, [])

  return (
    <section className="px-[14px] max-[720px]:px-[10px] flex flex-col gap-[14px]">

      {/* ══ PANEL 1: Header ══ */}
      <div className="oog-header bg-[#FAF8F4] rounded-[22px] p-[52px_56px_48px] max-[720px]:p-[36px_24px_32px] grid grid-cols-1 min-[720px]:grid-cols-2 gap-[40px] max-[720px]:gap-[20px] relative overflow-hidden">
        <div className="absolute -top-[50px] -right-[50px] w-[240px] h-[240px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(196,162,101,0.15) 0%, transparent 70%)' }} />
        <div>
          <span className="block text-[9.5px] font-semibold tracking-[0.26em] uppercase text-[#C4A265] mb-[18px]">Kennis</span>
          <h2 className="font-['Outfit'] font-medium text-[clamp(38px,5.5vw,72px)] leading-[1] text-[#1A1815] tracking-[-0.02em]">
            Oogvormen<br />zeggen <span className="font-['Cormorant_Garamond'] italic font-normal text-[#C4A265]">alles.</span>
          </h2>
        </div>
        <div className="pb-1">
          <p className="text-[14px] font-light text-[#7A7268] leading-[1.78] max-w-[360px] mb-[28px] max-[720px]:max-w-full">
            Elke oogvorm vraagt een andere aanpak. Dit is wat de meeste cursussen overslaan — en wat wij je juist leren als eerste.
          </p>
          <div className="inline-flex items-center gap-[10px] text-[9.5px] font-semibold tracking-[0.22em] uppercase text-[#7A6340]">
            Scroll door alle oogvormen
            <svg className="scroll-hint-arrow" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>
        </div>
      </div>

      {/* ══ PANEL 2: Scrolling cards — full bleed ══ */}
      <div className="oog-scroller-outer mx-[-14px] max-[720px]:mx-[-10px]">
        <div
          ref={scrollerRef}
          className="oog-scroller-wrap overflow-hidden relative cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Edge fades */}
          <div className="absolute top-0 bottom-0 left-0 w-[100px] z-[4] pointer-events-none" style={{ background: 'linear-gradient(to right, #0C0A07, rgba(12,10,7,0))' }} />
          <div className="absolute top-0 bottom-0 right-0 w-[100px] z-[4] pointer-events-none" style={{ background: 'linear-gradient(to left, #0C0A07, rgba(12,10,7,0))' }} />

          <div ref={trackRef} className="oog-track flex gap-[14px] w-max py-4">
            {EYE_SHAPES.map((shape, i) => (
              <EyeCard key={shape.num} shape={shape} index={i} />
            ))}
            {EYE_SHAPES.map((shape, i) => (
              <EyeCard key={`dup-${shape.num}`} shape={shape} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* ══ PANEL 3: Stats ══ */}
      <div className="bg-[#FAF8F4] rounded-[22px] p-[36px_56px] max-[720px]:p-[28px_24px] flex flex-col min-[720px]:flex-row items-start min-[720px]:items-center justify-between gap-[20px] relative overflow-hidden">
        <div className="absolute -bottom-[40px] -left-[40px] w-[200px] h-[200px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(196,162,101,0.15) 0%, transparent 70%)' }} />
        <div className="flex gap-[52px] max-[720px]:gap-[28px] relative z-[1]">
          <div className="flex flex-col gap-[3px]">
            <span className="font-['Cormorant_Garamond'] text-[38px] font-light text-[#1E1A14] leading-none tracking-[-0.02em]">10</span>
            <span className="text-[9.5px] font-semibold tracking-[0.2em] uppercase text-[#7A7268]">Oogvormen</span>
          </div>
          <div className="flex flex-col gap-[3px]">
            <span className="font-['Cormorant_Garamond'] text-[38px] font-light text-[#1E1A14] leading-none tracking-[-0.02em]">∞</span>
            <span className="text-[9.5px] font-semibold tracking-[0.2em] uppercase text-[#7A7268]">Combinaties</span>
          </div>
          <div className="flex flex-col gap-[3px]">
            <span className="font-['Cormorant_Garamond'] text-[38px] font-light text-[#1E1A14] leading-none tracking-[-0.02em]">1</span>
            <span className="text-[9.5px] font-semibold tracking-[0.2em] uppercase text-[#7A7268]">Uniek ontwerp</span>
          </div>
        </div>
        <Link
          href="/courses"
          className="font-['Outfit'] text-[13px] font-medium px-[26px] py-[12px] rounded-full bg-[#C4A265] text-white border-none cursor-pointer transition-all duration-[220ms] tracking-[0.02em] whitespace-nowrap relative z-[1] hover:bg-[#DFC08A] hover:shadow-[0_6px_20px_rgba(196,162,101,0.3)] hover:-translate-y-[1px] max-[720px]:w-full max-[720px]:text-center"
        >
          Bekijk de academy →
        </Link>
      </div>

    </section>
  )
}
