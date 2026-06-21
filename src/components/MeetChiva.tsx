'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
function OrbCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const orbs = [
      { x: 0.18, y: 0.3, r: 0.38, color: 'rgba(196,162,101,0.13)', vx: 0.00018, vy: 0.00012, ox: 0, oy: 0, amp: 0.06, freq: 0.0007 },
      { x: 0.72, y: 0.6, r: 0.32, color: 'rgba(196,162,101,0.09)', vx: -0.00014, vy: 0.00016, ox: 0, oy: 0, amp: 0.05, freq: 0.0009 },
      { x: 0.5, y: 0.15, r: 0.28, color: 'rgba(222,195,150,0.11)', vx: 0.00010, vy: -0.00008, ox: 0, oy: 0, amp: 0.04, freq: 0.0011 },
      { x: 0.85, y: 0.2, r: 0.22, color: 'rgba(196,162,101,0.07)', vx: -0.00016, vy: 0.00010, ox: 0, oy: 0, amp: 0.07, freq: 0.0006 },
      { x: 0.3, y: 0.8, r: 0.25, color: 'rgba(245,240,228,0.6)', vx: 0.00012, vy: -0.00014, ox: 0, oy: 0, amp: 0.05, freq: 0.0008 },
      { x: 0.65, y: 0.35, r: 0.18, color: 'rgba(196,162,101,0.06)', vx: -0.00010, vy: -0.00012, ox: 0, oy: 0, amp: 0.06, freq: 0.001 },
    ]

    let t = 0
    let rafId: number

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    const draw = () => {
      const W = canvas.width
      const H = canvas.height
      ctx.fillStyle = '#F5F1EA'
      ctx.fillRect(0, 0, W, H)

      orbs.forEach(o => {
        const px = (o.x + Math.sin(t * o.freq + o.ox) * o.amp) * W
        const py = (o.y + Math.cos(t * o.freq * 1.3 + o.oy) * o.amp) * H
        const radius = o.r * Math.min(W, H)

        const grad = ctx.createRadialGradient(px, py, 0, px, py, radius)
        grad.addColorStop(0, o.color)
        grad.addColorStop(0.5, o.color.replace(/[\d.]+\)$/, m => (parseFloat(m) * 0.4).toFixed(3) + ')'))
        grad.addColorStop(1, 'rgba(245,241,234,0)')

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(px, py, radius, 0, Math.PI * 2)
        ctx.fill()
      })

      t++
      rafId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block will-change-transform" />
}

const CHIVA_IMG = 'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/render/image/public/images/chiva-portrait-v2.webp?width=900&quality=75'
const ACTION_IMG = 'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/render/image/public/images/chiva-action.webp?width=900&quality=75'

export default function MeetChiva() {
  const t = useTranslations('MeetChiva')
  return (
    <section className="px-[14px] max-[860px]:px-[10px] flex flex-col gap-[14px]">

      {/* ══ ROW 1: Hero portrait panel ══ */}
      <div className="rounded-[22px] bg-[#161310] relative overflow-visible min-h-[420px] max-[860px]:min-h-[380px] max-[540px]:min-h-[340px] flex min-[860px]:items-end items-center max-[860px]:mx-[6px] max-[860px]:box-shadow-[0_20px_60px_-15px_rgba(0,0,0,0.28)]">
        {/* Inner bg with orbs — cream, always fills */}
        <div className="rounded-[22px] overflow-hidden absolute inset-0 bg-[#F5F1EA]">
          <OrbCanvas />
          <div className="absolute inset-0 pointer-events-none opacity-[0.025]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")' }} />
        </div>

        {/* Portrait — desktop: left side with scale, mobile: right-bottom aligned; head sticks out above card */}
        <div
          className="absolute bottom-0 top-auto z-[3] left-[120px] w-[370px] max-[860px]:left-auto max-[860px]:right-0 max-[860px]:w-[55%] max-[860px]:max-w-[280px]"
          style={{ transformOrigin: 'bottom left' }}
        >
          {/* Transparent panel behind portrait (was gold gradient) */}
          <div className="absolute inset-0 rounded-[14px]" />
          <img
            src={CHIVA_IMG}
            alt="Chiva"
            className="relative w-full object-contain object-bottom block -mt-[18%] max-[860px]:-mt-[10%]"
            style={{ verticalAlign: 'bottom', zIndex: 5 }}
          />
        </div>

        {/* Text overlay — desktop: right of portrait, mobile: top-left */}
        <div className="relative z-[4] min-[860px]:ml-[540px] max-[860px]:pt-6 max-[860px]:px-6 min-[860px]:py-12 min-[860px]:pr-12 flex-1 flex flex-col justify-start min-[860px]:justify-end gap-4 max-[860px]:items-start max-[860px]:text-left">
          <span className="text-[9.5px] font-semibold tracking-[0.24em] uppercase text-[#7A6340] inline-flex items-center gap-2">
            <span className="block w-[24px] h-[1px] bg-[#7A6340] opacity-50" />
            {t('meet')} <span className="text-[#C4A265]">{t('name')}</span>
          </span>
          <h2 className="font-['Outfit'] font-medium text-[clamp(42px,5.2vw,66px)] leading-[1.08] text-[#1A1815] tracking-[-0.02em]">
            {t('roleLine1')}<br />{t('roleLine2')}<br /><span className="font-['Cormorant_Garamond'] italic font-normal text-[#C4A265]">{t('roleLine3')}</span>
          </h2>
          <p className="text-[17px] font-light text-[#7A7268] leading-[1.7] max-w-[360px] max-[860px]:hidden">
            {t('intro')}
          </p>
        </div>

        {/* Right-side action photo — desktop only */}
        <div className="absolute top-0 right-0 bottom-0 w-[50%] z-[2] max-[860px]:hidden overflow-hidden rounded-r-[22px]">
          <img src={ACTION_IMG} alt="Chiva in action" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #F5F1EA 0%, #F5F1EA 20%, rgba(245,241,234,0.95) 30%, rgba(245,241,234,0.5) 50%, rgba(245,241,234,0) 70%)' }} />
        </div>

        {/* Name tag badge — desktop only */}
        <div className="absolute bottom-0 left-0 right-0 z-[4] px-12 pb-7 max-[860px]:hidden flex items-end justify-end">
          <div className="bg-[rgba(250,248,244,0.75)] backdrop-blur-[16px] border border-[rgba(196,162,101,0.25)] rounded-[12px] px-[18px] py-[10px] flex flex-col gap-[2px]">
            <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[#7A6340]">{t('caption')}</span>
            <span className="font-['Cormorant_Garamond'] text-[16px] italic text-[#1E1A14] leading-none">{t('captionSub')}</span>
          </div>
        </div>
      </div>

    </section>
  )
}
