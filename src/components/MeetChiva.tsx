'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

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

const CHIVA_IMG = 'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/chiva-portrait-v2.png'
const ACTION_IMG = 'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/chiva-action.jpg'

export default function MeetChiva() {
  return (
    <section className="px-[14px] max-[860px]:px-[10px] flex flex-col gap-[14px]">

      {/* ══ ROW 1: Hero portrait panel ══ */}
      <div className="rounded-[22px] bg-[#161310] relative overflow-hidden min-h-[420px] max-[860px]:min-h-[380px] max-[540px]:min-h-[340px] flex min-[860px]:items-end items-center">
        {/* Inner bg with orbs — cream, always fills */}
        <div className="rounded-[22px] overflow-hidden absolute inset-0 bg-[#F5F1EA]">
          <OrbCanvas />
          <div className="absolute inset-0 pointer-events-none opacity-[0.025]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")' }} />
        </div>

        {/* Portrait — desktop: left side with scale, mobile: right-bottom aligned */}
        <div
          className="absolute bottom-0 top-auto z-[3] left-[120px] w-[370px] max-[860px]:left-auto max-[860px]:right-0 max-[860px]:w-[55%] max-[860px]:max-w-[280px]"
          style={{ transformOrigin: 'bottom left' }}
        >
          <img src={CHIVA_IMG} alt="Chiva" className="w-full object-contain object-bottom block" style={{ verticalAlign: 'bottom' }} />
        </div>

        {/* Text overlay — desktop: right of portrait, mobile: top-left */}
        <div className="relative z-[4] min-[860px]:ml-[540px] max-[860px]:pt-6 max-[860px]:px-6 min-[860px]:py-12 min-[860px]:pr-12 flex-1 flex flex-col justify-start min-[860px]:justify-end gap-4 max-[860px]:items-start max-[860px]:text-left">
          <span className="text-[9.5px] font-semibold tracking-[0.24em] uppercase text-[#7A6340] inline-flex items-center gap-2">
            <span className="block w-[24px] h-[1px] bg-[#7A6340] opacity-50" />
            Meet <span className="text-[#C4A265]">Chiva</span>
          </span>
          <h2 className="font-['Cormorant_Garamond'] text-[clamp(32px,3.5vw,54px)] font-normal leading-[1.08] text-[#1E1A14] tracking-[-0.01em]">
            Lash artist.<br />Educator.<br /><em className="italic text-[#C4A265]">Oprichter.</em>
          </h2>
          <p className="text-[13.5px] font-light text-[#7A7268] leading-[1.7] max-w-[360px] max-[860px]:hidden">
            Chiva begon met lashes en wist meteen: dit wil ik doen. Maar op mijn eigen manier. Wat volgde was een studio in Arnhem, een eigen stijl, en velen studenten die ik heb mogen begeleiden tot lash artist.
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
            <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[#7A6340]">The Woman Behind Luxique</span>
            <span className="font-['Cormorant_Garamond'] text-[16px] italic text-[#1E1A14] leading-none">Chiva — Lash Artist &amp; Educator</span>
          </div>
        </div>
      </div>

      {/* ══ ROW 2: [image] [text] [image] ══ */}
      <div className="grid grid-cols-1 min-[860px]:grid-cols-[1fr_1.15fr_1fr] gap-[14px] items-stretch">
        {/* Left flanking image — desktop only */}
        <div className="rounded-[22px] overflow-hidden relative min-h-[320px] max-[860px]:hidden">
          <div className="w-full h-full min-h-[320px] bg-[linear-gradient(145deg,#1e1a12_0%,#2a2318_100%)] flex flex-col items-center justify-center gap-2 text-[rgba(196,162,101,0.2)]">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="0.75">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-[rgba(196,162,101,0.25)] mt-2">Chiva aan het werk</span>
          </div>
          <span className="absolute top-[14px] left-[14px] text-[9.5px] font-medium tracking-[0.12em] uppercase px-[12px] py-[5px] rounded-full bg-[rgba(12,10,7,0.55)] backdrop-blur-[10px] border border-[rgba(196,162,101,0.2)] text-[#C4A265]">Arnhem · Studio</span>
        </div>

        {/* Center text panel */}
        <div className="bg-[#FAF8F4] rounded-[22px] p-[44px_40px] max-[860px]:p-[36px_24px] flex flex-col items-start text-left relative overflow-hidden">
          <div className="absolute -top-[40px] -right-[40px] w-[160px] h-[160px] rounded-full bg-[radial-gradient(circle,rgba(196,162,101,0.18)_0%,transparent_70%)] pointer-events-none" />
          <div className="text-[#C4A265] text-[16px] mb-5 opacity-70 self-center">✦</div>
          <h3 className="font-['Cormorant_Garamond'] text-[clamp(26px,2.6vw,40px)] font-normal leading-[1.15] text-[#1E1A14] tracking-[-0.01em] mb-6 text-center self-center">
            Niet kopiëren.<br /><em className="italic text-[#C4A265]">Creëren.</em>
          </h3>

          <div className="relative w-full max-h-[220px] overflow-hidden mb-1">
            <div className="flex flex-col gap-[14px]">
              <p className="text-[13.5px] font-light text-[#7A7268] leading-[1.8]">
                In een markt waar Russian volume de standaard was, koos ik voor wispy — lichter, natuurlijker, meer &ldquo;me&rdquo;. Mensen snapten het niet altijd in het begin. Maar ik bleef consistent, en nu is wispy één van de meest gevraagde styles.
              </p>
              <p className="text-[13.5px] font-light text-[#7A7268] leading-[1.8]">
                LXQ Academy is onze manier om alles door te geven wat wij hebben geleerd. Niet alleen de techniek, maar het denken als een artist. Mijn aanpak is eenvoudig: begin met het waarom, niet met het hoe.
              </p>
              <p className="text-[13.5px] font-light text-[#7A7268] leading-[1.8]">
                Onze filosofie is dat elke oogvorm anders is en een unieke aanpak verdient. Geen standaard maps, geen kopieën. Wij leren je kijken naar het oog, begrijpen wat nodig is, en een set ontwerpen die écht bij de persoon past.
              </p>
              <p className="text-[13.5px] font-light text-[#7A7268] leading-[1.8]">
                Van beginners tot gevorderden — iedereen is welkom. Wij geloven dat de juiste kennis, gecombineerd met de juiste mindset, het verschil maakt tussen een technician en een artist.
              </p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[100px] bg-[linear-gradient(0deg,#FAF8F4_0%,rgba(250,248,244,0)_100%)] pointer-events-none" />
          </div>

          <Link href="/about" className="font-['Outfit'] text-[13px] font-medium px-[26px] py-[12px] rounded-full bg-[#C4A265] text-white border-none cursor-pointer transition-all duration-[220ms] tracking-[0.02em] mt-4 self-center hover:bg-[#DFC08A] hover:shadow-[0_6px_20px_rgba(196,162,101,0.28)] hover:-translate-y-[1px]">
            Lees mijn verhaal →
          </Link>
        </div>

        {/* Right flanking image — desktop only */}
        <div className="rounded-[22px] overflow-hidden relative min-h-[320px] max-[860px]:hidden">
          <div className="w-full h-full min-h-[320px] bg-[linear-gradient(145deg,#16120c_0%,#201a10_100%)] flex flex-col items-center justify-center gap-2 text-[rgba(196,162,101,0.2)]">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="0.75">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-[rgba(196,162,101,0.25)] mt-2">Lash close-up</span>
          </div>
          <span className="absolute top-[14px] left-[14px] text-[9.5px] font-medium tracking-[0.12em] uppercase px-[12px] py-[5px] rounded-full bg-[rgba(12,10,7,0.55)] backdrop-blur-[10px] border border-[rgba(196,162,101,0.2)] text-[#C4A265]">Lashed by Chiva</span>
        </div>
      </div>

      {/* ══ ROW 3: Dark bottom panel ══ */}
      <div className="rounded-[22px] overflow-hidden relative min-h-[340px] flex items-end">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#1e180e_0%,#120e08_40%,#0C0A07_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(12,10,7,0.92)_0%,rgba(12,10,7,0.55)_45%,rgba(12,10,7,0.1)_100%)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 font-['Avenir_Next'] font-[200] text-[clamp(60px,14vw,180px)] tracking-[0.18em] text-center text-[rgba(196,162,101,0.06)] leading-none pointer-events-none whitespace-nowrap uppercase overflow-hidden select-none pb-0">
          Luxique
        </div>
        <div className="relative z-[3] p-10 max-[860px]:p-8 grid grid-cols-1 min-[860px]:grid-cols-[1fr_auto] items-end gap-8 w-full">
          <div>
            <p className="text-[9.5px] font-semibold tracking-[0.24em] uppercase text-[#C4A265] mb-[10px]">Over ons</p>
            <h3 className="font-['Cormorant_Garamond'] text-[clamp(28px,3.5vw,52px)] font-normal leading-[1.08] text-[#FAF8F4] tracking-[-0.01em] mb-3">
              Van beginners tot gevorderden —<br /><em className="italic text-[#C4A265]">iedereen is welkom.</em>
            </h3>
            <p className="text-[13.5px] font-light text-[rgba(250,248,244,0.45)] leading-[1.7] max-w-[500px]">
              LXQ Academy is onze manier om alles door te geven wat wij hebben geleerd. Niet alleen de techniek, maar het denken als een artist. Chiva heeft velen studenten opgeleid en haar filosofie is simpel: elke oogvorm verdient een unieke aanpak.
            </p>
          </div>
          <Link href="/about" className="font-['Outfit'] text-[13px] font-medium px-[28px] py-[13px] rounded-full bg-transparent text-[#FAF8F4] border-[1.5px] border-[rgba(250,248,244,0.22)] cursor-pointer transition-all duration-[220ms] whitespace-nowrap shrink-0 hover:border-[#C4A265] hover:text-[#C4A265] hover:bg-[rgba(196,162,101,0.06)] w-fit">
            Lees meer →
          </Link>
        </div>
      </div>

    </section>
  )
}
