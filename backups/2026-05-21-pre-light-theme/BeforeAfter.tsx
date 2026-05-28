'use client'

import { useRef, useEffect, useCallback } from 'react'

const CDN = 'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images'

const BA_CARDS = [
  { name: 'Wispy Set', afterImg: `${CDN}/ba-wispy-after.webp`, beforeImg: `${CDN}/ba-wispy-before.webp` },
  { name: 'Medusa Set', afterImg: `${CDN}/ba-medusa-after.webp`, beforeImg: `${CDN}/ba-medusa-before.webp` },
  { name: 'Volume Set', afterImg: `${CDN}/ba-volume-after.webp`, beforeImg: `${CDN}/ba-volume-before.webp` },
]

export default function BeforeAfter() {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const imageRefs = useRef<(HTMLDivElement | null)[]>([])
  const resetTimers = useRef<Map<HTMLDivElement, ReturnType<typeof setTimeout>>>(new Map())

  // Stagger fade-in on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
          observer.unobserve(e.target)
        }
      })
    }, { threshold: 0.12 })

    cardRefs.current.forEach(ref => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])

  const isMobile = useCallback(() => {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  }, [])

  const resetImage = useCallback((img: HTMLDivElement) => {
    img.classList.remove('show-before', 'show-after')
  }, [])

  const resetAllExcept = useCallback((except: HTMLDivElement) => {
    imageRefs.current.forEach(img => {
      if (img && img !== except) {
        const t = resetTimers.current.get(img)
        if (t) clearTimeout(t)
        resetImage(img)
      }
    })
  }, [resetImage])

  const scheduleReset = useCallback((img: HTMLDivElement) => {
    const t = resetTimers.current.get(img)
    if (t) clearTimeout(t)
    const newT = setTimeout(() => resetImage(img), 6000)
    resetTimers.current.set(img, newT)
  }, [resetImage])

  const reveal = useCallback((img: HTMLDivElement, side: 'before' | 'after') => {
    resetAllExcept(img)
    img.classList.toggle('show-before', side === 'before')
    img.classList.toggle('show-after', side === 'after')
    scheduleReset(img)
  }, [resetAllExcept, scheduleReset])

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = resetTimers.current
    return () => {
      timers.forEach(t => clearTimeout(t))
    }
  }, [])

  // Click outside resets all (mobile)
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (!isMobile()) return
      const clickedInside = imageRefs.current.some(img => img && img.contains(e.target as Node))
      if (!clickedInside) {
        imageRefs.current.forEach(img => {
          if (img) {
            const t = resetTimers.current.get(img)
            if (t) clearTimeout(t)
            resetImage(img)
          }
        })
      }
    }
    document.addEventListener('click', handleDocClick)
    return () => document.removeEventListener('click', handleDocClick)
  }, [isMobile, resetImage])

  const handleMouseMove = useCallback((index: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile()) return
    const img = imageRefs.current[index]
    if (!img) return
    const rect = img.getBoundingClientRect()
    const side = (e.clientX - rect.left) < rect.width / 2 ? 'before' : 'after'
    reveal(img, side)
  }, [isMobile, reveal])

  const handleMouseLeave = useCallback((index: number) => {
    if (isMobile()) return
    const img = imageRefs.current[index]
    if (!img) return
    const t = resetTimers.current.get(img)
    if (t) clearTimeout(t)
    resetImage(img)
  }, [isMobile, resetImage])

  const handleClick = useCallback((index: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMobile()) return
    const img = imageRefs.current[index]
    if (!img) return
    const rect = img.getBoundingClientRect()
    const side: 'before' | 'after' = (e.clientX - rect.left) < rect.width / 2 ? 'before' : 'after'

    const alreadyShowing =
      (side === 'before' && img.classList.contains('show-before')) ||
      (side === 'after' && img.classList.contains('show-after'))

    if (alreadyShowing) {
      const t = resetTimers.current.get(img)
      if (t) clearTimeout(t)
      resetImage(img)
    } else {
      reveal(img, side)
    }
  }, [isMobile, reveal, resetImage])

  return (
    <div className="ba-wrap bg-[#FAF8F4] rounded-[22px] overflow-hidden relative">

      {/* Header */}
      <div className="ba-header p-[52px_56px_0] max-[860px]:p-[36px_24px_0] grid grid-cols-1 min-[860px]:grid-cols-2 gap-[40px] max-[860px]:gap-4 items-end relative">
        <div className="absolute -top-[40px] -right-[40px] w-[220px] h-[220px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(196,162,101,0.14) 0%, transparent 70%)' }} />
        <div>
          <span className="block text-[9.5px] font-semibold tracking-[0.26em] uppercase text-[#C4A265] mb-4">Resultaten</span>
          <h2 className="font-['Cormorant_Garamond'] text-[clamp(40px,5.5vw,72px)] font-normal leading-[1] text-[#1E1A14] tracking-[-0.02em]">
            Before &amp; <em className="italic text-[#C4A265]">After</em>
          </h2>
        </div>
        <div />
      </div>

      {/* Cards grid */}
      <div className="grid min-[860px]:grid-cols-3 max-[860px]:grid-cols-1 gap-[14px] p-[14px] max-[860px]:p-[14px_10px_0]">
        {BA_CARDS.map((card, i) => (
          <div
            key={card.name}
            ref={el => { cardRefs.current[i] = el }}
            className="ba-card rounded-[18px] overflow-hidden flex flex-col cursor-default"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div
              ref={el => { imageRefs.current[i] = el }}
              className="ba-image relative overflow-hidden bg-[#F0EDE6] cursor-pointer min-[769px]:aspect-[4/3] max-[768px]:aspect-[3/4]"
              onMouseMove={(e) => handleMouseMove(i, e)}
              onMouseLeave={() => handleMouseLeave(i)}
              onClick={(e) => handleClick(i, e)}
            >
              {/* After layer */}
              <div className="ba-after-layer absolute inset-0 bg-[linear-gradient(145deg,#1e1a12,#141009)]" style={card.afterImg.startsWith('http') ? { backgroundImage: `url(${card.afterImg})`, backgroundSize: 'cover', backgroundPosition: 'center top' } : undefined}>
                {!card.afterImg.startsWith('http') && (
                <div className="w-full h-full flex flex-col items-center justify-center gap-[10px] text-[rgba(196,162,101,0.25)] text-[10px] tracking-[0.14em] uppercase">
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="0.75" className="text-[rgba(196,162,101,0.25)]">
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  After foto
                </div>
                )}
              </div>

              {/* Before layer */}
              <div className="ba-before-layer absolute inset-0 bg-[#F0EDE6]" style={card.beforeImg.startsWith('http') ? { backgroundImage: `url(${card.beforeImg})`, backgroundSize: 'cover', backgroundPosition: 'center top' } : undefined}>
                {!card.beforeImg.startsWith('http') && (
                <div className="w-full h-full flex flex-col items-center justify-center gap-[10px] text-[rgba(30,26,20,0.2)] text-[10px] tracking-[0.14em] uppercase">
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="0.75" className="text-[rgba(30,26,20,0.2)]">
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  Before foto
                </div>
                )}
              </div>

              {/* Slider line */}
              <div className="ba-slider-line absolute top-0 bottom-0 left-1/2 w-[2px] -translate-x-1/2 opacity-45 z-[4] pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent 0%, #C4A265 20%, #C4A265 80%, transparent 100%)' }} />

              {/* Labels */}
              <span className="absolute top-[14px] left-[14px] text-[9px] font-semibold tracking-[0.22em] uppercase text-[#7A7268] bg-[rgba(250,248,244,0.82)] backdrop-blur-[8px] border border-[rgba(30,26,20,0.08)] px-[11px] py-[4px] rounded-full z-[3]">Before</span>
              <span className="absolute top-[14px] right-[14px] text-[9px] font-semibold tracking-[0.22em] uppercase text-[#C4A265] bg-[rgba(12,10,7,0.72)] backdrop-blur-[8px] border border-[rgba(196,162,101,0.2)] px-[11px] py-[4px] rounded-full z-[3]">After</span>

              {/* Type pill */}
              <div className="ba-type-pill absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-medium tracking-[0.1em] text-[#1E1A14] bg-[rgba(250,248,244,0.88)] backdrop-blur-[12px] border border-[rgba(30,26,20,0.1)] px-[14px] py-[6px] rounded-full inline-flex items-center justify-center gap-[6px] whitespace-nowrap z-[6] shadow-[0_4px_16px_rgba(12,10,7,0.08)] transition-all duration-300">
                <span className="block w-[6px] h-[6px] rounded-full bg-[#C4A265] opacity-70 shrink-0" />
                {card.name}
              </div>

              {/* Bottom fade */}
              <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-[linear-gradient(0deg,rgba(12,10,7,0.72),transparent)] pointer-events-none" />
            </div>

            {/* Bottom padding inside card */}
            <div className="h-0" />
          </div>
        ))}
      </div>

      {/* Bottom padding */}
      <div className="h-[14px]" />
    </div>
  )
}
