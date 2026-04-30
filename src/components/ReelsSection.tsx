'use client'

import { useEffect, useRef } from 'react'

export default function ReelsSection() {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let animId: number
    const speed = 0.4 // pixels per frame — slow & smooth
    const scroll = () => {
      el.scrollLeft += speed
      // Reset when we've scrolled past the first set of cards (duplicated for infinite loop)
      if (el.scrollLeft >= el.scrollWidth / 2) {
        el.scrollLeft = 0
      }
      animId = requestAnimationFrame(scroll)
    }
    // Only auto-scroll on desktop
    if (window.innerWidth >= 768) {
      animId = requestAnimationFrame(scroll)
    }
    return () => cancelAnimationFrame(animId)
  }, [])

  const reels = [
    { title: 'Wispy Set Timelapse', views: '12.4K', duration: '0:32' },
    { title: 'Eye Mapping Tutorial', views: '8.9K', duration: '0:45' },
    { title: 'Before & After', views: '15.2K', duration: '0:18' },
    { title: 'Lash Curl Guide', views: '6.7K', duration: '0:28' },
    { title: 'Volume Fan Making', views: '10.1K', duration: '0:55' },
    { title: 'Bottom Lash Technique', views: '4.3K', duration: '0:22' },
    { title: 'Client Consultation', views: '7.8K', duration: '1:02' },
    { title: 'Wispy Mapping', views: '9.5K', duration: '0:38' },
  ]

  const Card = ({ r }: { r: typeof reels[0] }) => (
    <div className="flex-shrink-0 w-[200px] md:w-[220px] group cursor-pointer">
      <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-[#2a241e] border border-white/[0.06] hover:border-[var(--rose)]/30 transition-all duration-500">
        {/* Placeholder gradient — replace with video thumbnails */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-[#1e1a15] to-[#2a241e]" />
        
        {/* Play button center */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-[var(--rose)]/30 group-hover:scale-110 transition-all duration-300">
            <span className="text-white text-lg ml-0.5">▶</span>
          </div>
        </div>

        {/* Duration badge */}
        <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] text-white/80 font-medium">
          {r.duration}
        </div>

        {/* Bottom overlay with info */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <p className="text-[12px] text-white font-semibold leading-tight mb-1.5">{r.title}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-white/50">▶</span>
            <span className="text-[10px] text-white/50 font-medium">{r.views} views</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <section className="py-20 bg-[var(--dark)] relative overflow-hidden">
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--dark)] via-[#1e1a15] to-[var(--dark)]" />

      <div className="relative z-10">
        {/* Header */}
        <div className="max-w-[900px] mx-auto px-6 mb-10">
          <div className="flex items-end justify-between">
            <div>
              <div className="section-tag" style={{ color: 'var(--rose-light)' }}>Social</div>
              <h2 className="font-['Cormorant_Garamond'] text-[clamp(32px,4vw,48px)] font-light leading-[1.15] text-white">
                Reels & <em>TikTok</em>
              </h2>
            </div>
            <a href="https://instagram.com/lashedbychiva" target="_blank" className="hidden md:flex items-center gap-2 text-[13px] text-[var(--rose)] font-semibold hover:text-[var(--rose-light)] transition">
              @lashedbychiva →
            </a>
          </div>
        </div>

        {/* Scrolling reels — duplicated for infinite loop */}
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto md:overflow-hidden px-6 md:px-0 pb-4 md:pb-0 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {/* First set */}
          {reels.map((r, i) => <Card key={`a-${i}`} r={r} />)}
          {/* Duplicate for seamless loop on desktop */}
          {reels.map((r, i) => <Card key={`b-${i}`} r={r} />)}
        </div>

        {/* Mobile: show follow link */}
        <div className="md:hidden text-center mt-6">
          <a href="https://instagram.com/lashedbychiva" target="_blank" className="text-[13px] text-[var(--rose)] font-semibold">
            Volg @lashedbychiva →
          </a>
        </div>
      </div>
    </section>
  )
}
