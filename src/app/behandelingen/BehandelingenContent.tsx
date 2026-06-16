'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase-client'
import { LoginGate } from '@/components/LoginGate'
import CalEmbed from '@/components/CalEmbed'

/* ─── Config (single source of truth for pricing) ─── */
const PRICING = {
  newSet: { name: 'Nieuwe Set', price: 130, duration: '± 3 uur', desc: 'Volledig nieuwe set, afgestemd op jouw oogvorm en wensen.' },
  refill: { name: 'Refill', price: 90, duration: '± 2 uur', desc: 'Houd je set vol en mooi. Aanbevolen elke 2 tot 3 weken.' },
}

const HERO_IMG = 'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/cta-behandelingen.webp'

const FAQ = [
  { q: 'Hoe lang duurt een behandeling?', a: 'Een nieuwe set duurt ongeveer 3 uur. Een refill (opvullen) duurt ongeveer 2 uur, afhankelijk van hoeveel lashes er bijgevuld moeten worden.' },
  { q: 'Hoe vaak moet ik komen voor een refill?', a: 'Voor een vol resultaat raad ik aan om elke 2 tot 3 weken langs te komen. Je natuurlijke wimpers vallen uit en groeien aan, dus een regelmatige refill houdt je set er op zijn best uit.' },
  { q: 'Doet het pijn?', a: 'Nee. De behandeling is volledig pijnloos. Je ligt comfortabel met gesloten ogen — veel klanten vinden het zo ontspannend dat ze in slaap vallen.' },
  { q: 'Welke stijl past bij mij?', a: 'Dat bepalen we samen tijdens de consultatie. Op basis van je oogvorm, natuurlijke wimpers en wensen kies ik de styling die jouw blik het mooist versterkt.' },
  { q: 'Zijn alle sets €130?', a: 'Ja. Alle sets worden volledig aangepast aan jouw ogen. Je kunt iedere gewenste stijl en vorm kiezen, maar deze wordt altijd afgestemd op jouw oogvorm, uitstraling en natuurlijke wimpers. Elke set is een customized set en heeft daarom één vaste prijs van €130.' },
]

const SHOWCASE_PHOTOS = [
  'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/het-werk-1.webp',
  'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/het-werk-2.webp',
  'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/het-werk-3.webp',
  'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/het-werk-4.webp',
  'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/het-werk-5.webp',
]

const CLOSING_IMG = 'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/hero-behandelingen.webp'

/* ─── Reveal observer ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const els = root.querySelectorAll('.reveal')
    if (prefersReduced) {
      els.forEach((el) => { (el as HTMLElement).classList.add('revealed') })
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
      el.setAttribute('data-delay', String(i * 90))
      i++
      io.observe(el)
    })
    return () => io.disconnect()
  }, [])
  return ref
}

/* ─── FASE 1: HERO ─── */
function Hero() {
  return (
    <section className="relative min-h-[60vh] md:min-h-[68vh] flex items-end overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(20,16,12,0.7) 0%, rgba(20,16,12,0.55) 35%, rgba(20,16,12,0.75) 100%), url(${HERO_IMG})`,
          backgroundPosition: 'center 28%',
        }}
      />
      <div className="relative z-[2] w-full pb-[5vh] px-[28px] max-w-[1180px] mx-auto">
        <p className="text-[0.74rem] uppercase tracking-[0.24em] text-[#D8B97A] font-medium mb-[18px]">
          Behandelingen · Lashed by Chiva
        </p>
        <h1
          className="font-['Cormorant_Garamond'] font-medium leading-[0.98] tracking-[-0.01em] text-[#FBF8F2] max-w-[14ch]"
          style={{ fontSize: 'clamp(3rem, 7vw, 6rem)' }}
        >
          Niet zomaar lashes — <em className="italic text-[#D8B97A]">jouw</em> lashes
        </h1>
        <p className="text-[rgba(251,248,242,0.85)] max-w-[42ch] mt-[22px] text-[1.12rem] leading-[1.6]">
          Geen standaard set. Elke lash gekozen op jouw oogvorm, je gezicht en hoe jij je wil voelen.
        </p>
        <div className="flex gap-[14px] mt-[32px] flex-wrap">
          <a
            href="#boeken"
            className="inline-flex items-center gap-[9px] px-[30px] py-[15px] rounded-full font-medium text-[0.98rem] no-underline transition-transform hover:-translate-y-[2px]"
            style={{
              background: 'linear-gradient(180deg, #B08D4F, #9a7838)',
              color: '#0e0b09',
              boxShadow: '0 12px 34px -14px rgba(216,185,122,0.7)',
            }}
          >
            Boek je afspraak →
          </a>
          <a
            href="#tarieven"
            className="inline-flex items-center gap-[9px] px-[30px] py-[15px] rounded-full font-medium text-[0.98rem] text-[#FBF8F2] no-underline border border-[rgba(251,248,242,0.4)] backdrop-blur-[6px] transition-colors hover:bg-[rgba(251,248,242,0.16)]"
            style={{ background: 'rgba(251,248,242,0.08)' }}
          >
            Bekijk tarieven
          </a>
        </div>
      </div>
    </section>
  )
}

/* ─── FASE 2: TARIEVEN ─── */
function Tarieven() {
  return (
    <section id="tarieven" className="py-[clamp(60px,8vw,100px)] px-[28px]" style={{ scrollMarginTop: '80px' }}>
      <div className="max-w-[760px] mx-auto">
        <div className="text-center mb-[40px] reveal">
          <span className="block text-[0.74rem] uppercase tracking-[0.24em] text-[#B08D4F] font-medium mb-[12px]">Tarieven</span>
          <h2
            className="font-['Cormorant_Garamond'] font-medium"
            style={{ fontSize: 'clamp(2.1rem, 4vw, 3rem)' }}
          >
            Een investering in <em className="italic text-[#B08D4F]">jezelf</em>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
          {/* New Set */}
          <a
            href="#boeken"
            className="reveal block no-underline text-[#1C1814] bg-[#FBF8F2] border border-[rgba(28,24,20,0.13)] rounded-[18px] px-[28px] py-[26px] transition-all hover:-translate-y-[3px] hover:shadow-[0_22px_50px_-28px_rgba(28,24,20,0.4)] hover:border-[rgba(176,141,79,0.4)]"
          >
            <div className="flex justify-between items-baseline mb-[8px]">
              <span className="font-['Cormorant_Garamond'] font-semibold text-[1.5rem]">{PRICING.newSet.name}</span>
              <span className="text-[0.78rem] text-[#46403A] tracking-[0.04em]">{PRICING.newSet.duration}</span>
            </div>
            <div className="font-['Cormorant_Garamond'] font-semibold text-[2.8rem] leading-[1] text-[#B08D4F] mb-[10px]">
              <sup className="text-[1.1rem] align-super opacity-80">€</sup>{PRICING.newSet.price}
            </div>
            <p className="text-[0.9rem] text-[#46403A] leading-[1.5] mb-[16px]">{PRICING.newSet.desc}</p>
            <span className="text-[0.88rem] font-medium border-b border-[#B08D4F] pb-[2px]">Reserveer →</span>
          </a>
          {/* Refill */}
          <a
            href="#boeken"
            className="reveal block no-underline text-[#1C1814] bg-[#FBF8F2] border border-[rgba(28,24,20,0.13)] rounded-[18px] px-[28px] py-[26px] transition-all hover:-translate-y-[3px] hover:shadow-[0_22px_50px_-28px_rgba(28,24,20,0.4)] hover:border-[rgba(176,141,79,0.4)]"
          >
            <div className="flex justify-between items-baseline mb-[8px]">
              <span className="font-['Cormorant_Garamond'] font-semibold text-[1.5rem]">{PRICING.refill.name}</span>
              <span className="text-[0.78rem] text-[#46403A] tracking-[0.04em]">{PRICING.refill.duration}</span>
            </div>
            <div className="font-['Cormorant_Garamond'] font-semibold text-[2.8rem] leading-[1] text-[#B08D4F] mb-[10px]">
              <sup className="text-[1.1rem] align-super opacity-80">€</sup>{PRICING.refill.price}
            </div>
            <p className="text-[0.9rem] text-[#46403A] leading-[1.5] mb-[16px]">{PRICING.refill.desc}</p>
            <span className="text-[0.88rem] font-medium border-b border-[#B08D4F] pb-[2px]">Reserveer →</span>
          </a>
        </div>
        <p className="reveal text-center mt-[28px] text-[0.9rem] text-[#46403A]">
          Elke set begint met een persoonlijk gesprek — we kijken samen naar wat bij jou past.
        </p>
      </div>
    </section>
  )
}

/* ─── FASE 3: FAQ ─── */
function FAQSection() {
  return (
    <section className="py-[clamp(70px,9vw,120px)] px-[28px]">
      <div className="max-w-[760px] mx-auto">
        <div className="text-center mb-[46px] reveal">
          <span className="block text-[0.74rem] uppercase tracking-[0.24em] text-[#B08D4F] font-medium mb-[14px]">Veelgestelde vragen</span>
          <h2
            className="font-['Cormorant_Garamond'] font-medium"
            style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)' }}
          >
            Goed om <em className="italic text-[#B08D4F]">te weten</em>
          </h2>
        </div>
        <div className="reveal border-t border-[rgba(28,24,20,0.13)]">
          {FAQ.map((item, i) => (
            <details key={i} className="group border-b border-[rgba(28,24,20,0.13)]">
              <summary className="px-[4px] py-[24px] cursor-pointer flex justify-between items-center select-none list-none gap-[20px]">
                <span className="text-[#1C1814] text-[1.08rem]">{item.q}</span>
                <span className="text-[#B08D4F] text-[1.4rem] flex-shrink-0 transition-transform group-open:rotate-45 leading-none">+</span>
              </summary>
              <p className="px-[4px] pb-[24px] text-[#46403A] text-[0.98rem] leading-[1.6]">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── FASE 4: CLOSING CTA ─── */
function ClosingCTA() {
  return (
    <section className="relative py-[clamp(50px,7vw,80px)] text-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover"
        style={{ backgroundImage: `linear-gradient(rgba(20,16,12,0.6), rgba(20,16,12,0.72)), url(${CLOSING_IMG})`, backgroundPosition: 'center 20%' }}
      />
      <div className="relative z-[2] max-w-[1180px] mx-auto px-[28px]">
        <span className="block text-[0.74rem] uppercase tracking-[0.24em] text-[#D8B97A] font-medium mb-[18px]">
          Ready om jezelf te trakteren?
        </span>
        <h2
          className="font-['Cormorant_Garamond'] font-medium text-[#FBF8F2] leading-[1.02]"
          style={{ fontSize: 'clamp(2.6rem, 5vw, 4.2rem)' }}
        >
          Reserveer jouw <em className="italic text-[#D8B97A]">afspraak</em>
        </h2>
        <a
          href="#boeken"
          className="inline-flex items-center gap-[9px] mt-[20px] px-[30px] py-[15px] rounded-full font-medium text-[0.98rem] no-underline transition-transform hover:-translate-y-[2px]"
          style={{
            background: 'linear-gradient(180deg, #B08D4F, #9a7838)',
            color: '#0e0b09',
            boxShadow: '0 12px 34px -14px rgba(216,185,122,0.7)',
          }}
        >
          Naar de agenda →
        </a>
      </div>
    </section>
  )
}

/* ─── FASE 5: WIDGET + SHOWCASE ─── */
function BookSection() {
  const { user } = useAuth()
  const [profileName, setProfileName] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('profiles')
      .select('first_name, full_name')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfileName(data.first_name || data.full_name || null)
      })
  }, [user?.id])

  const userEmail = user?.email || ''
  const attendeeName = profileName || ''

  return (
    <section id="boeken" className="relative py-[clamp(80px,12vw,140px)] overflow-hidden" style={{ scrollMarginTop: '80px' }}>
      {/* Showcase strip — behind widget */}
      <div
        className="absolute top-1/2 left-0 w-full flex gap-[26px] z-[1] pointer-events-none md:opacity-90 opacity-85 hidden md:flex"
        style={{ transform: 'translateY(-50%)', animation: 'drift 40s linear infinite' }}
        aria-hidden="true"
      >
        {[...SHOWCASE_PHOTOS, ...SHOWCASE_PHOTOS].map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className="w-[300px] h-[380px] object-cover rounded-[18px] flex-shrink-0"
            style={{ boxShadow: '0 30px 60px -30px rgba(28,24,20,0.5)' }}
          />
        ))}
      </div>

      {/* Mobile showcase — below widget */}
      <div
        className="md:hidden absolute bottom-[-30px] left-0 w-full flex gap-[26px] z-[1] pointer-events-none opacity-85"
        style={{ animation: 'drift-mobile 40s linear infinite' }}
        aria-hidden="true"
      >
        {[...SHOWCASE_PHOTOS, ...SHOWCASE_PHOTOS].map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className="w-[170px] h-[220px] object-cover rounded-[18px] flex-shrink-0"
          />
        ))}
      </div>

      <style>{`
        @keyframes drift {
          from { transform: translateX(0) translateY(-50%); }
          to { transform: translateX(-1304px) translateY(-50%); }
        }
        @keyframes drift-mobile {
          from { transform: translateX(0); }
          to { transform: translateX(-784px); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="drift"], [style*="drift-mobile"] { animation: none !important; }
        }
      `}</style>

      <div className="relative z-[2] max-w-[1180px] mx-auto px-[28px]">
        <div className="text-center max-w-[60ch] mx-auto mb-[56px] reveal">
          <p className="text-[0.74rem] uppercase tracking-[0.24em] text-[#B08D4F] font-medium mb-[16px]">Plan je moment</p>
          <h2
            className="font-['Cormorant_Garamond'] font-medium leading-[1.05]"
            style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.6rem)' }}
          >
            Reserveer je <em className="italic text-[#B08D4F]">afspraak</em>
          </h2>
        </div>

        {/* Widget with glow container */}
        <div className="relative z-[3] w-full max-w-[680px] mx-auto px-[8px] reveal" style={{ paddingBottom: '120px' }}>
          <LoginGate
            returnUrl="/behandelingen#boeken"
            title="Log in om te boeken"
            subtitle="Zodat we je afspraak aan je account koppelen en je boekingen altijd terugvindt in je dashboard."
          >
            <div
              style={{
                background: '#FBF8F2',
                border: '1px solid rgba(176,141,79,0.35)',
                borderRadius: '22px',
                boxShadow: '0 0 0 1px rgba(216,185,122,0.12), 0 30px 80px -30px rgba(28,24,20,0.4), 0 0 60px -10px rgba(216,185,122,0.4)',
                overflow: 'hidden',
              }}
            >
              <CalEmbed
                calLink="luxique"
                name={attendeeName}
                email={userEmail}
                theme="light"
                layout="month_view"
              />
            </div>
          </LoginGate>
        </div>
      </div>
    </section>
  )
}

/* ─── Reveal CSS ─── */
const revealStyles = `
  .reveal {
    opacity: 0;
    transform: translateY(26px);
    transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1);
  }
  .reveal.revealed {
    opacity: 1;
    transform: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .reveal { opacity: 1 !important; transform: none !important; }
  }
`

/* ─── Main ─── */
export default function BehandelingenContent() {
  const rootRef = useReveal()
  return (
    <>
      <style>{revealStyles}</style>
      <div ref={rootRef}>
        <Hero />
        <Tarieven />
        <BookSection />
        <FAQSection />
        <ClosingCTA />
      </div>
    </>
  )
}
