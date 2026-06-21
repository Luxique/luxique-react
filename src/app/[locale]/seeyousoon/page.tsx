'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

/* ─── Gold / dark tokens ─── */
const GOLD = '#C4A265'
const DARK_BG = '#0c100d'
const CARD_BG = '#141a16'

/* ─── Animated checkmark seal ─── */
function CheckSeal() {
  return (
    <svg
      width="88"
      height="88"
      viewBox="0 0 88 88"
      fill="none"
      className="mx-auto seal-anim"
    >
      {/* outer ring */}
      <circle
        cx="44"
        cy="44"
        r="42"
        stroke={GOLD}
        strokeWidth="1.5"
        className="seal-ring"
      />
      {/* inner fill */}
      <circle cx="44" cy="44" r="38" fill="rgba(196,162,101,0.08)" />
      {/* checkmark */}
      <path
        d="M28 44 L39 55 L60 33"
        stroke={GOLD}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="seal-check"
      />
    </svg>
  )
}

/* ─── Icon box ─── */
function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="shrink-0 w-[40px] h-[40px] rounded-[10px] border border-[rgba(196,162,101,0.35)] flex items-center justify-center text-[18px]"
    >
      {children}
    </span>
  )
}

/* ─── Reveal observer with stagger ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const els = root.querySelectorAll('.reveal')
    if (prefersReduced) {
      els.forEach((el) => {
        ;(el as HTMLElement).style.opacity = '1'
        ;(el as HTMLElement).style.transform = 'none'
      })
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const delay = Number(e.target.getAttribute('data-delay') || 0)
            setTimeout(() => e.target.classList.add('revealed'), delay)
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12 }
    )
    let i = 0
    els.forEach((el) => {
      const html = el as HTMLElement
      html.style.opacity = '0'
      html.style.transform = 'translateY(28px)'
      html.style.transition =
        'opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1)'
      el.setAttribute('data-delay', String(i * 150))
      i++
      io.observe(el)
    })
    return () => io.disconnect()
  }, [])
  return ref
}

/* ─── Main content (needs useSearchParams) ─── */
function SeeYouSoonContent() {
  const params = useSearchParams()
  const name = params.get('name')
  const wrapperRef = useReveal()

  return (
    <>
      {/* scoped styles for seal animation */}
      <style>{`
        .seal-ring {
          stroke-dasharray: 264;
          stroke-dashoffset: 264;
          animation: drawRing .7s ease forwards .25s;
        }
        .seal-check {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: drawCheck .5s ease forwards .5s;
        }
        @keyframes drawRing {
          to { stroke-dashoffset: 0; }
        }
        @keyframes drawCheck {
          to { stroke-dashoffset: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .seal-ring, .seal-check {
            stroke-dashoffset: 0 !important;
            animation: none !important;
          }
        }
      `}</style>

      <div
        ref={wrapperRef}
        style={{
          background: DARK_BG,
          backgroundImage:
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(196,162,101,0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 15% 30%, rgba(74,120,80,0.10) 0%, transparent 70%)',
        }}
        className="pt-[90px] max-md:pt-[82px] px-[14px] pb-[80px] min-h-screen"
      >
        <div className="max-w-[640px] mx-auto flex flex-col gap-[32px] pt-[40px] md:pt-[60px]">
          {/* ─── Check seal ─── */}
          <div className="reveal text-center">
            <CheckSeal />
          </div>

          {/* ─── Heading ─── */}
          <div className="reveal text-center">
            <span className="block text-[11px] tracking-[0.26em] uppercase font-medium mb-[14px]" style={{ color: 'rgba(196,162,101,0.7)' }}>
              — Bevestigd —
            </span>
            <h1
              className="font-['Cormorant_Garamond'] font-medium tracking-[-0.02em] leading-[1.05] text-[clamp(40px,7vw,72px)]"
              style={{ color: '#FAF8F4' }}
            >
              {name ? (
                <>
                  Tot snel,{' '}
                  <span className="italic" style={{ color: GOLD }}>
                    {name}
                  </span>
                  !
                </>
              ) : (
                <>
                  Tot{' '}
                  <span className="italic" style={{ color: GOLD }}>
                    snel
                  </span>
                  !
                </>
              )}
            </h1>
            <p
              className="mt-[18px] text-[17px] leading-[1.65] max-w-[460px] mx-auto"
              style={{ color: 'rgba(250,248,244,0.55)' }}
            >
              Je afspraak staat genoteerd. Je ontvangt zo een bevestiging per
              e-mail met alle details.
            </p>
          </div>

          {/* ─── Info card ─── */}
          <div
            className="reveal rounded-[24px] px-[28px] py-[32px] md:px-[40px] md:py-[40px]"
            style={{ background: CARD_BG }}
          >
            <div className="flex flex-col gap-[24px]">
              {/* Row 1 — Location */}
              <div className="flex gap-[16px] items-start">
                <IconBox>📍</IconBox>
                <div>
                  <h3
                    className="font-['Jost'] font-medium text-[14px] tracking-[0.02em] mb-[4px]"
                    style={{ color: GOLD }}
                  >
                    Locatie
                  </h3>
                  <p
                    className="text-[14px] leading-[1.6] font-['Jost']"
                    style={{ color: 'rgba(250,248,244,0.7)' }}
                  >
                    Venlosingel 166, 6845 JD Arnhem.
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="h-[1px]" style={{ background: 'rgba(250,248,244,0.08)' }} />

              {/* Row 2 — Email */}
              <div className="flex gap-[16px] items-start">
                <IconBox>✉️</IconBox>
                <div>
                  <h3
                    className="font-['Jost'] font-medium text-[14px] tracking-[0.02em] mb-[4px]"
                    style={{ color: GOLD }}
                  >
                    Een vraag vooraf?
                  </h3>
                  <p
                    className="text-[14px] leading-[1.6] font-['Jost']"
                    style={{ color: 'rgba(250,248,244,0.7)' }}
                  >
                    Mail gerust naar{' '}
                    <a
                      href="mailto:info@luxique.nl"
                      className="hover:underline"
                      style={{ color: GOLD }}
                    >
                      info@luxique.nl
                    </a>{' '}
                    — we reageren binnen 2 werkdagen.
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="h-[1px]" style={{ background: 'rgba(250,248,244,0.08)' }} />

              {/* Row 3 — Tip */}
              <div className="flex gap-[16px] items-start">
                <IconBox>💡</IconBox>
                <div>
                  <h3
                    className="font-['Jost'] font-medium text-[14px] tracking-[0.02em] mb-[4px]"
                    style={{ color: GOLD }}
                  >
                    Alvast goed om te weten
                  </h3>
                  <p
                    className="text-[14px] leading-[1.6] font-['Jost']"
                    style={{ color: 'rgba(250,248,244,0.7)' }}
                  >
                    Kom met schone wimpers (geen mascara) en neem de tijd —
                    reken op een paar uur ontspanning.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── CTA buttons ─── */}
          <div className="reveal flex gap-[14px] justify-center flex-wrap">
            <a
              href="/"
              className="inline-flex items-center gap-[8px] px-[28px] py-[13px] rounded-full text-[13px] font-medium tracking-[0.02em] no-underline transition-all hover:-translate-y-[2px] font-['Jost']"
              style={{
                background: GOLD,
                color: '#0c100d',
              }}
            >
              Terug naar home →
            </a>
            <a
              href="/cursus"
              className="inline-flex items-center gap-[8px] px-[28px] py-[13px] rounded-full text-[13px] font-medium tracking-[0.02em] no-underline transition-all hover:-translate-y-[2px] font-['Jost']"
              style={{
                background: 'transparent',
                color: 'rgba(250,248,244,0.8)',
                border: '1px solid rgba(250,248,244,0.18)',
              }}
            >
              Bekijk de Academy ↓
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

/* ─── Page shell with Suspense ─── */
export default function SeeYouSoonPage() {
  return (
    <Suspense
      fallback={
        <div
          className="pt-[90px] max-md:pt-[82px] flex items-center justify-center min-h-screen"
          style={{ background: DARK_BG }}
        >
          <p className="text-[15px] font-['Jost']" style={{ color: 'rgba(250,248,244,0.4)' }}>
            Laden…
          </p>
        </div>
      }
    >
      <SeeYouSoonContent />
    </Suspense>
  )
}
