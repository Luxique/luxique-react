'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

/* ─── Reveal observer (same as behandelingen) ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const els = root.querySelectorAll('.reveal')
    if (prefersReduced) {
      els.forEach((el) => { (el as HTMLElement).style.opacity = '1'; (el as HTMLElement).style.transform = 'none' })
      return
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const delay = Number(e.target.getAttribute('data-delay') || 0)
          setTimeout(() => e.target.classList.add('revealed'), delay)
          io.unobserve(e.target)
        }
      })
    }, { threshold: 0.12 })
    let i = 0
    els.forEach((el) => {
      (el as HTMLElement).style.opacity = '0'
      ;(el as HTMLElement).style.transform = 'translateY(28px)'
      ;(el as HTMLElement).style.transition = 'opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1)'
      el.setAttribute('data-delay', String(i * 90))
      i++
      io.observe(el)
    })
    return () => io.disconnect()
  }, [])
  return ref
}

function BedanktContent() {
  const params = useSearchParams()
  const name = params.get('name')
  const wrapperRef = useReveal()

  return (
    <div ref={wrapperRef} className="bg-[#F3EEE6] pt-[90px] max-md:pt-[82px] px-[14px] max-[860px]:px-[10px] pb-[60px]">
      <div className="max-w-[720px] mx-auto flex flex-col gap-[14px]">

        {/* ─── Hero ─── */}
        <section className="reveal bg-white rounded-[28px] text-center px-[28px] py-[80px] md:py-[100px]">
          <span className="block text-[11px] tracking-[0.26em] uppercase text-[#8A8378] font-medium mb-[14px]">— Bevestigd —</span>
          <h1 className="font-['Outfit'] font-medium tracking-[-0.02em] leading-[1.02] text-[clamp(40px,6.5vw,80px)] text-[#1A1815] mb-[20px]">
            {name ? (
              <>Bedankt, <span className="font-['Cormorant_Garamond'] italic font-normal">{name}</span>!</>
            ) : (
              <>Tot <span className="font-['Cormorant_Garamond'] italic font-normal">snel</span>!</>
            )}
          </h1>
          <p className="text-[#5C564C] text-[17px] max-w-[520px] mx-auto leading-[1.6]">
            Je afspraak staat genoteerd. Je ontvangt een bevestiging per e-mail.
          </p>
        </section>

        {/* ─── Practical info ─── */}
        <section className="reveal bg-[#1A1815] rounded-[28px] px-[28px] py-[60px] md:px-[50px] md:py-[70px]">
          <div className="max-w-[560px] mx-auto text-center">
            <span className="block text-[11px] tracking-[0.26em] uppercase text-[#C4A265] font-medium mb-[20px]">— Goed om te weten —</span>

            <div className="flex flex-col gap-[24px] text-left">
              <div className="flex gap-[16px] items-start">
                <span className="text-[#C4A265] text-[18px] mt-[2px]">📍</span>
                <div>
                  <h3 className="font-['Outfit'] font-medium text-[15px] text-[#FAF8F4] mb-[4px]">Locatie</h3>
                  <p className="text-[rgba(250,248,244,0.6)] text-[14px] leading-[1.6]">Arnhem — het exacte adres volgt in je bevestigingsmail.</p>
                </div>
              </div>

              <div className="flex gap-[16px] items-start">
                <span className="text-[#C4A265] text-[18px] mt-[2px]">✉️</span>
                <div>
                  <h3 className="font-['Outfit'] font-medium text-[15px] text-[#FAF8F4] mb-[4px]">Vragen?</h3>
                  <p className="text-[rgba(250,248,244,0.6)] text-[14px] leading-[1.6]">Mail naar <a href="mailto:info@luxique.nl" className="text-[#C4A265] hover:underline">info@luxique.nl</a></p>
                </div>
              </div>

              <div className="flex gap-[16px] items-start">
                <span className="text-[#C4A265] text-[18px] mt-[2px]">💡</span>
                <div>
                  <h3 className="font-['Outfit'] font-medium text-[15px] text-[#FAF8F4] mb-[4px]">Nazorg-tip</h3>
                  <p className="text-[rgba(250,248,244,0.6)] text-[14px] leading-[1.6]">Eerste 24 uur na je behandeling niet nat maken, voorzichtig reinigen, niet wrijven.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="reveal bg-[#F7F2EA] rounded-[28px] px-[28px] py-[50px] md:py-[60px] text-center">
          <div className="flex gap-[12px] justify-center flex-wrap px-[20px]">
            <a href="/" className="bg-[#1A1815] text-[#FAF8F4] px-[26px] py-[12px] rounded-full text-[13px] font-medium tracking-[0.02em] no-underline inline-flex items-center gap-[8px] hover:bg-[#A8884A] hover:-translate-y-[2px] transition-all">
              Terug naar home →
            </a>
            <a href="/cursus" className="bg-transparent text-[#1A1815] px-[26px] py-[12px] rounded-full border border-[rgba(26,24,21,0.14)] text-[13px] no-underline inline-flex items-center gap-[8px] hover:border-[#1A1815] hover:bg-[#F7F2EA] transition-all">
              Bekijk de Academy ↓
            </a>
          </div>
        </section>

      </div>
    </div>
  )
}

export default function BedanktPage() {
  return (
    <Suspense fallback={
      <div className="bg-[#F3EEE6] pt-[90px] max-md:pt-[82px] px-[14px] flex items-center justify-center min-h-[60vh]">
        <p className="text-[#8A8378] text-[15px]">Laden…</p>
      </div>
    }>
      <BedanktContent />
    </Suspense>
  )
}
