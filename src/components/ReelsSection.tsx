'use client'

import { useEffect, useRef } from 'react'

// Content items — Chiva can swap these easily by editing this array
// type: 'reel' = video card, 'image' = photo card
// For reels: add embedUrl for Instagram/TikTok embed
const contentItems = [
  { type: 'reel' as const, title: 'Wispy Set Timelapse', views: '12.4K', duration: '0:32', thumbnail: null, embedUrl: '' },
  { type: 'image' as const, title: 'Wispy Volume Set', views: '8.1K', thumbnail: null },
  { type: 'reel' as const, title: 'Eye Mapping Tutorial', views: '8.9K', duration: '0:45', thumbnail: null, embedUrl: '' },
  { type: 'image' as const, title: 'Classic Lash Result', views: '6.3K', thumbnail: null },
  { type: 'reel' as const, title: 'Before & After', views: '15.2K', duration: '0:18', thumbnail: null, embedUrl: '' },
  { type: 'image' as const, title: 'Close Up — Spikes', views: '5.7K', thumbnail: null },
  { type: 'reel' as const, title: 'Lash Curl Guide', views: '6.7K', duration: '0:28', thumbnail: null, embedUrl: '' },
  { type: 'reel' as const, title: 'Volume Fan Making', views: '10.1K', duration: '0:55', thumbnail: null, embedUrl: '' },
  { type: 'image' as const, title: 'Wet Set Look', views: '4.9K', thumbnail: null },
  { type: 'reel' as const, title: 'Bottom Lash Technique', views: '4.3K', duration: '0:22', thumbnail: null, embedUrl: '' },
]

function ContentCard({ item }: { item: typeof contentItems[0] }) {
  const isReel = item.type === 'reel'

  return (
    <div className="flex-shrink-0 w-[180px] md:w-[200px] group cursor-pointer">
      <div className="relative aspect-[9/16] rounded-2xl overflow-hidden border border-white/[0.06] hover:border-[var(--rose)]/30 transition-all duration-300">
        {/* Background gradient placeholder — replace with real thumbnails */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1610] via-[#221e18] to-[#2a2520]" />
        
        {isReel ? (
          /* Play button center for reels */
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-[var(--rose)]/30 group-hover:scale-110 transition-all duration-300">
              <span className="text-white text-base ml-0.5">▶</span>
            </div>
          </div>
        ) : (
          /* Image icon for photo cards */
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-[var(--rose)]/30 group-hover:scale-110 transition-all duration-300">
              <span className="text-white text-base">📷</span>
            </div>
          </div>
        )}

        {/* Duration badge (reels only) */}
        {isReel && item.duration && (
          <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] text-white/80 font-medium">
            {item.duration}
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-3 left-3 z-10 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md text-[9px] text-white/60 font-medium uppercase tracking-wider">
          {isReel ? 'Reel' : 'Photo'}
        </div>

        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-3.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <p className="text-[11px] text-white font-semibold leading-tight mb-1">{item.title}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-white/50">▶</span>
            <span className="text-[10px] text-white/50 font-medium">{item.views} views</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ReelsSection() {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let animId: number
    const speed = 0.35 // px per frame — smooth & slow

    // Duplicate content for seamless loop (already done in JSX via double render)
    const scroll = () => {
      el.scrollLeft += speed
      // When we've scrolled past the first set, reset seamlessly
      if (el.scrollLeft >= el.scrollWidth / 2) {
        el.scrollLeft -= el.scrollWidth / 2
      }
      animId = requestAnimationFrame(scroll)
    }

    // Only auto-scroll on desktop
    if (window.innerWidth >= 768) {
      animId = requestAnimationFrame(scroll)
    }

    // Pause on hover
    const pause = () => cancelAnimationFrame(animId)
    const resume = () => { animId = requestAnimationFrame(scroll) }
    el.addEventListener('mouseenter', pause)
    el.addEventListener('mouseleave', resume)

    return () => {
      cancelAnimationFrame(animId)
      el.removeEventListener('mouseenter', pause)
      el.removeEventListener('mouseleave', resume)
    }
  }, [])

  // Instagram logo SVG
  const IgLogo = () => (
    <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  )

  return (
    <section className="py-20 bg-[var(--dark)] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--dark)] via-[#1e1a15] to-[var(--dark)]" />

      <div className="relative z-10">
        {/* Header — just follow link with IG logo */}
        <div className="max-w-[900px] mx-auto px-6 mb-10">
          <a href="https://instagram.com/lashedbychiva" target="_blank" className="inline-flex items-center gap-2.5 group">
            <IgLogo />
            <span className="text-[15px] text-white font-medium group-hover:text-[var(--rose)] transition">
              Volg @lashedbychiva
            </span>
            <span className="text-[var(--rose)] group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </div>

        {/* Infinite scrolling content */}
        <div 
          ref={scrollRef} 
          className="flex gap-4 md:overflow-hidden px-6 md:px-0 scrollbar-hide" 
          style={{ scrollbarWidth: 'none' }}
        >
          {/* First set */}
          {contentItems.map((item, i) => <ContentCard key={`a-${i}`} item={item} />)}
          {/* Duplicate for seamless infinite loop */}
          {contentItems.map((item, i) => <ContentCard key={`b-${i}`} item={item} />)}
        </div>
      </div>
    </section>
  )
}
