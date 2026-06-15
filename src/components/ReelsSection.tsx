'use client'

import { useEffect, useRef, useCallback } from 'react'

type ContentItem = {
  type: 'reel' | 'image'
  title: string
  views: string
  duration?: string
  videoUrl?: string
  posterUrl?: string
  imageUrl?: string
  isViral?: boolean
  viralStats?: string
}

const CDN_VID = 'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/videos/reels'
const CDN_IMG = 'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images'

const contentItems: ContentItem[] = [
  { type: 'reel', title: 'Wispy Set Timelapse', views: '12.4K', duration: '0:12', videoUrl: `${CDN_VID}/lash-reel-1.mp4`, posterUrl: `${CDN_IMG}/reel-poster-1.webp` },
  { type: 'image', title: 'Wispy Volume Set', views: '8.1K', imageUrl: `${CDN_IMG}/reel-photo-1.webp` },
  { type: 'reel', title: 'Eye Mapping Tutorial', views: '8.9K', duration: '0:02', videoUrl: `${CDN_VID}/lash-reel-3.mp4`, posterUrl: `${CDN_IMG}/reel-poster-3.webp` },
  { type: 'reel', title: 'Before & After', views: '15.2K', duration: '0:11', videoUrl: `${CDN_VID}/lash-reel-4.mp4`, posterUrl: `${CDN_IMG}/reel-poster-4.webp` },
  { type: 'image', title: 'Classic Lash Result', views: '6.3K', imageUrl: `${CDN_IMG}/reel-photo-2.webp` },
  { type: 'reel', title: 'Lash Curl Guide', views: '6.7K', duration: '0:08', videoUrl: `${CDN_VID}/lash-reel-2.mp4`, posterUrl: `${CDN_IMG}/reel-poster-2.webp` },
  { type: 'image', title: 'Close Up — Spikes', views: '5.7K', imageUrl: `${CDN_IMG}/reel-photo-3.webp` },
  { type: 'reel', title: 'Volume Fan Making', views: '10.1K', duration: '0:11', videoUrl: `${CDN_VID}/lash-reel-5.mp4`, posterUrl: `${CDN_IMG}/reel-poster-5.webp` },
  { type: 'image', title: 'Wet Set Look', views: '4.9K', imageUrl: `${CDN_IMG}/reel-photo-4.webp` },
  { type: 'reel', title: 'Russian Volume', views: '1M', duration: '0:22', videoUrl: `${CDN_VID}/viral-russian-volume.mp4`, isViral: true, viralStats: '59.4K likes · 1M weergaven' },
]

function ContentCard({ item }: { item: ContentItem }) {
  const isReel = item.type === 'reel'
  const hasVideo = Boolean(item.videoUrl)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Autoplay video immediately
  useEffect(() => {
    if (!hasVideo || !videoRef.current) return
    const video = videoRef.current
    video.play().catch(() => {})
  }, [hasVideo])

  return (
    <div className="flex-shrink-0 w-[260px] md:w-[280px] group cursor-pointer">
      <div className="relative aspect-[9/16] rounded-2xl overflow-hidden border border-white/[0.06] hover:border-[var(--rose)]/30 transition-all duration-300">
        {hasVideo && item.videoUrl ? (
          <video
            ref={videoRef}
            src={item.videoUrl}
            poster={item.posterUrl}
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        ) : item.imageUrl ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${item.imageUrl})` }} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1610] via-[#221e18] to-[#2a2520]" />
        )}

        {/* Play/camera icon — hidden when video or image is showing */}
        {!(hasVideo || item.imageUrl) && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-[var(--rose)]/30 group-hover:scale-110 transition-all duration-300">
              <span className="text-white text-xl">{isReel ? '▶' : '📷'}</span>
            </div>
          </div>
        )}

        {/* Duration badge */}
        {isReel && item.duration && (
          <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] text-white/80 font-medium">{item.duration}</div>
        )}

        {/* Reel/Photo badge */}
        <div className="absolute top-3 left-3 z-10 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md text-[9px] text-white/60 font-medium uppercase tracking-wider">{isReel ? 'Reel' : 'Photo'}</div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <p className="text-[13px] text-white font-semibold leading-tight mb-1">{item.title}</p>
          {item.isViral && item.viralStats ? (
            <span className="text-[10px] font-medium" style={{ color: '#E0C078' }}>🔥 {item.viralStats}</span>
          ) : (
            <span className="text-[10px] text-white/50 font-medium">{item.views} views</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ReelsSection() {
  const trackRef = useRef<HTMLDivElement>(null)

  // Infinite scroll animation
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    let offset = 0
    let animId: number
    const speed = 1.1

    const animate = () => {
      offset += speed
      const setWidth = track.scrollWidth / 3
      if (offset >= setWidth) {
        offset -= setWidth
      }
      track.style.transform = `translateX(${-offset}px)`
      animId = requestAnimationFrame(animate)
    }

    animId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animId)
  }, [])

  const renderCard = useCallback((item: ContentItem, _i: number, prefix: string) => {
    return <ContentCard key={`${prefix}-${_i}`} item={item} />
  }, [])

  return (
    <section className="py-20 bg-[var(--dark)] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--dark)] via-[#1e1a15] to-[var(--dark)]" />
      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-center mb-12">
          <a href="https://instagram.com/lashedbychiva" target="_blank" className="inline-flex items-center gap-3 group">
            <span className="text-[17px] text-white font-medium group-hover:text-[var(--rose)] transition">
              Volg @lashedbychiva
            </span>
            <svg className="w-5 h-5 text-white fill-current group-hover:text-[var(--rose)] transition" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>
        </div>

        {/* Infinite scrolling track */}
        <div className="overflow-hidden">
          <div ref={trackRef} className="flex gap-5 will-change-transform">
            {contentItems.map((item, i) => renderCard(item, i, 'a'))}
            {contentItems.map((item, i) => renderCard(item, i, 'b'))}
            {contentItems.map((item, i) => renderCard(item, i, 'c'))}
          </div>
        </div>
      </div>
    </section>
  )
}
