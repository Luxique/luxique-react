'use client'

import { useEffect, useRef } from 'react'

/* ─── Config ─── */
const CAL_URL = 'https://cal.com/luxique'
const STUDIO_BG = '/images/hero-bg.jpg'

const STEPS = [
  { num: '01', title: 'De Consultatie', body: 'We bespreken jouw wensen en wat je van je lashes verwacht.', chip: '10 min · Gratis' },
  { num: '02', title: 'De Styling', body: 'Op basis van je oogvorm en wensen bepalen we de perfecte styling.', chip: 'Uniek ontwerp' },
  { num: '03', title: 'Het Werk', body: 'Elke lash met precisie geplaatst — comfortabel en pijnloos.', chip: '± 2 uur · Nieuwe set' },
  { num: '04', title: 'Nazorg', body: 'Persoonlijk advies zodat je set lang mooi en je wimpers gezond blijven.', chip: '2–3 wk · Refill' },
]

const FAQ = [
  { q: 'Hoe lang duurt een behandeling?', a: 'Een nieuwe set duurt ongeveer 2 uur. Een refill is sneller — reken op ongeveer een uur, afhankelijk van hoeveel lashes er bijgevuld moeten worden.' },
  { q: 'Hoe vaak moet ik komen voor een refill?', a: 'Voor een vol resultaat raad ik aan om elke 2 tot 3 weken langs te komen. Je natuurlijke wimpers vallen uit en groeien aan, dus een regelmatige refill houdt je set er op zijn best uit.' },
  { q: 'Doet het pijn?', a: 'Nee. De behandeling is volledig pijnloos. Je ligt comfortabel met gesloten ogen — veel klanten vinden het zo ontspannend dat ze in slaap vallen.' },
  { q: 'Hoe verzorg ik mijn lashes thuis?', a: 'Je krijgt na de behandeling persoonlijk nazorgadvies. Kort gezegd: de eerste 24 uur niet nat maken, voorzichtig reinigen, en niet wrijven. Ik leg je alles uit tijdens je afspraak.' },
  { q: 'Welke stijl past bij mij?', a: 'Dat bepalen we samen tijdens de consultatie. Op basis van je oogvorm, natuurlijke wimpers en wensen kies ik de styling die jouw blik het mooist versterkt.' },
  { q: 'Wanneer moet ik mijn wimpers laten opvullen?', a: 'Ik vul wimpers op tot 3 weken na je afspraak. De prijs voor een opvulbehandeling is altijd €90, ongeacht of je binnen 1 week, 2 weken of 3 weken terugkomt. Na 3 weken wordt er een nieuwe set geplaatst.' },
  { q: 'Zijn alle sets €130?', a: 'Ja. Alle sets worden volledig aangepast aan jouw ogen. Je kunt iedere gewenste stijl en vorm kiezen, maar deze wordt altijd afgestemd op jouw oogvorm, uitstraling en natuurlijke wimpers. Elke set is een customized set en heeft daarom één vaste prijs van €130. Voor iedere nieuwe set reserveer ik 3 uur in mijn agenda, zodat er voldoende tijd is om jouw set perfect te creëren.' },
]

const MARQUEE_PHOTOS = [
  '/images/chiva-portrait.jpg',
  '/images/hero-bg.jpg',
  '/images/chiva-portrait.jpg',
  '/images/hero-bg.jpg',
  '/images/chiva-portrait.jpg',
  '/images/hero-bg.jpg',
  '/images/chiva-portrait.jpg',
  '/images/hero-bg.jpg',
]

/* ─── Reveal observer ─── */
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

/* ─── Components ─── */
function Hero() {
  return (
    <section className="bg-white rounded-[28px] text-center px-[28px] py-[80px] md:py-[100px]">
      <span className="block text-[11px] tracking-[0.26em] uppercase text-[#8A8378] font-medium mb-[14px]">— Behandelingen —</span>
      <h1 className="font-['Outfit'] font-medium tracking-[-0.02em] leading-[1.02] text-[clamp(40px,6.5vw,80px)] text-[#1A1815] mb-[20px] max-w-[800px] mx-auto">
        Lashes afgestemd<br />op <span className="font-['Cormorant_Garamond'] italic font-normal">jouw blik</span>
      </h1>
      <p className="text-[#5C564C] text-[17px] max-w-[520px] mx-auto mb-[32px] leading-[1.6]">
        Geen standaard set, maar lashes die passen bij jouw oogvorm, levensstijl en wensen.
      </p>
      <div className="flex gap-[12px] justify-center flex-wrap px-[20px]">
        <a href="#boek" className="bg-[#1A1815] text-[#FAF8F4] px-[26px] py-[12px] rounded-full text-[13px] font-medium tracking-[0.02em] no-underline inline-flex items-center gap-[8px] hover:bg-[#A8884A] hover:-translate-y-[2px] transition-all">
          Boek je afspraak →
        </a>
        <a href="#werkwijze" className="bg-transparent text-[#1A1815] px-[26px] py-[12px] rounded-full border border-[rgba(26,24,21,0.14)] text-[13px] no-underline inline-flex items-center gap-[8px] hover:border-[#1A1815] hover:bg-[#F7F2EA] transition-all">
          Zo werkt het ↓
        </a>
      </div>
    </section>
  )
}

function Werkwijze() {
  return (
    <section id="werkwijze" className="relative rounded-[28px] overflow-hidden min-h-[480px] flex items-center justify-center py-[60px] px-[20px]"
      style={{ scrollMarginTop: '90px' }}>
      {/* Background image + overlay */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${STUDIO_BG})` }} />
      <div className="absolute inset-0 bg-[rgba(10,8,5,0.78)]" />

      <div className="relative z-10 w-full max-w-[1080px] mx-auto">
        <div className="text-center mb-[36px]">
          <span className="block text-[11px] tracking-[0.26em] uppercase text-[rgba(250,248,244,0.5)] font-medium mb-[10px]">— Zo werkt het —</span>
          <h2 className="font-['Outfit'] font-medium text-[clamp(28px,3.5vw,44px)] tracking-[-0.02em] text-[#FAF8F4]">
            Vier stappen naar jouw <span className="font-['Cormorant_Garamond'] italic">perfecte set</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 min-[560px]:grid-cols-2 min-[980px]:grid-cols-4 gap-[14px]">
          {STEPS.map((s) => (
            <div key={s.num} className="reveal bg-[rgba(250,248,244,0.08)] backdrop-blur-[18px] border border-[rgba(250,248,244,0.12)] rounded-[18px] px-[24px] py-[28px]">
              <div className="text-[#C4A265] font-['Cormorant_Garamond'] italic text-[28px] font-medium leading-none mb-[10px]">{s.num}</div>
              <h3 className="font-['Outfit'] font-medium text-[16px] text-[#FAF8F4] mb-[8px]">{s.title}</h3>
              <p className="text-[rgba(250,248,244,0.65)] text-[14px] leading-[1.6] mb-[14px]">{s.body}</p>
              <span className="inline-block text-[11px] tracking-[0.08em] uppercase text-[#C4A265] bg-[rgba(196,162,101,0.12)] px-[12px] py-[5px] rounded-full">{s.chip}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Tarieven() {
  return (
    <section className="bg-[#F7F2EA] rounded-[28px] px-[28px] py-[70px] md:px-[60px] md:py-[90px]">
      <div className="text-center mb-[40px]">
        <span className="block text-[11px] tracking-[0.26em] uppercase text-[#8A8378] font-medium mb-[14px]">— Tarieven —</span>
        <h2 className="font-['Outfit'] font-medium text-[clamp(30px,4vw,48px)] tracking-[-0.02em] text-[#1A1815]">
          Heldere <span className="font-['Cormorant_Garamond'] italic font-normal">prijzen</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 min-[560px]:grid-cols-2 gap-[14px] max-w-[880px] mx-auto">
        {[
          { label: 'Nieuwe Set', title: 'Volledige set naar keuze', price: '130', dur: '± 3 uur', desc: 'Een volledig nieuwe set, afgestemd op jouw oogvorm en wensen. Kies uit verschillende stijlen.', dark: true },
          { label: 'Refill', title: 'Opvullen bestaande set', price: '90', dur: '± 2 uur', desc: 'Houd je set vol en mooi. Aanbevolen elke 2 tot 3 weken voor het beste resultaat.', dark: false },
        ].map((c) => (
          <div key={c.label} className={`${c.dark ? 'bg-[#1A1815] text-[#FAF8F4]' : 'bg-[#F7F2EA] hover:bg-[#FDFCFA] text-[#1A1815]'} rounded-[22px] px-[32px] py-[40px] text-center transition-all hover:-translate-y-[4px] hover:shadow-[0_20px_50px_rgba(26,24,21,0.06)]`}>
            <span className={`block text-[11px] tracking-[0.26em] uppercase font-medium mb-[16px] ${c.dark ? 'text-[#C4A265]' : 'text-[#8A8378]'}`}>{c.label}</span>
            <div className={`font-['Cormorant_Garamond'] italic text-[56px] leading-none mb-[4px] font-medium ${c.dark ? 'text-[#FAF8F4]' : 'text-[#1A1815]'}`}>
              <span className="text-[28px] align-super text-[#C4A265]">€</span>{c.price}
            </div>
            <div className={`text-[13px] mb-[20px] ${c.dark ? 'text-[rgba(250,248,244,0.5)]' : 'text-[#8A8378]'}`}>{c.dur}</div>
            <p className={`text-[14px] leading-[1.7] mb-[24px] ${c.dark ? 'text-[rgba(250,248,244,0.7)]' : 'text-[#5C564C]'}`}>{c.desc}</p>
            <a href="#boek" className={`block w-full py-[12px] rounded-full text-[13px] font-medium tracking-[0.02em] text-center no-underline transition-all ${c.dark ? 'bg-[#C4A265] text-[#1A1815] hover:bg-[#d4b275]' : 'bg-transparent text-[#1A1815] border border-[rgba(26,24,21,0.14)] hover:border-[#1A1815] hover:bg-[#F7F2EA]'}`}>
              Boek {c.label.toLowerCase()}
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}

function FAQSection() {
  return (
    <section className="bg-[#F7F2EA] rounded-[28px] px-[28px] py-[70px] md:px-[60px] md:py-[90px]">
      <div className="text-center mb-[40px]">
        <span className="block text-[11px] tracking-[0.26em] uppercase text-[#8A8378] font-medium mb-[14px]">— Veelgestelde Vragen —</span>
        <h2 className="font-['Outfit'] font-medium text-[clamp(30px,4vw,48px)] tracking-[-0.02em] text-[#1A1815]">
          Goed om <span className="font-['Cormorant_Garamond'] italic font-normal">te weten</span>
        </h2>
      </div>
      <div className="max-w-[760px] mx-auto flex flex-col gap-[10px]">
        {FAQ.map((item, i) => (
          <details key={i} className="group bg-[#FDFCFA] border border-[rgba(26,24,21,0.08)] rounded-[14px] overflow-hidden hover:border-[rgba(26,24,21,0.14)] transition-colors">
            <summary className="px-[24px] py-[20px] cursor-pointer flex justify-between items-center select-none list-none">
              <span className="text-[#1A1815] text-[15px] font-medium">{item.q}</span>
              <span className="text-[#1A1815] text-[20px] font-light transition-transform group-open:rotate-45 shrink-0 ml-[16px]">+</span>
            </summary>
            <p className="px-[24px] pb-[20px] text-[#5C564C] text-[14px] leading-[1.7]">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function Marquee() {
  return (
    <section className="overflow-hidden rounded-[28px] bg-[#1A1815] py-[20px]">
      <div className="text-center mb-[20px]">
        <span className="text-[11px] tracking-[0.26em] uppercase text-[rgba(250,248,244,0.5)] font-medium">— Het werk · @lashedbychiva —</span>
      </div>
      <div
        className="flex hover:[animation-play-state:paused]"
        style={{
          animation: 'marquee 40s linear infinite',
          width: 'max-content',
        }}
      >
        {[...MARQUEE_PHOTOS, ...MARQUEE_PHOTOS].map((src, i) => (
          <div
            key={i}
            className="shrink-0 w-[260px] h-[347px] mx-[7px] rounded-[18px] bg-cover bg-center"
            style={{ aspectRatio: '3/4', backgroundImage: `url(${src})` }}
          />
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}

function Boeken() {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'cal:height' && e.data.value && iframeRef.current) {
        iframeRef.current.style.height = e.data.value + 'px'
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  return (
    <section id="boek" className="bg-white rounded-[28px] px-[28px] py-[60px] md:px-[60px] md:py-[80px]" style={{ scrollMarginTop: '90px' }}>
      <div className="max-w-[880px] mx-auto text-center">
        <span className="block text-[11px] tracking-[0.26em] uppercase text-[#8A8378] font-medium mb-[14px] reveal">— Plan je afspraak —</span>
        <h2 className="font-['Outfit'] font-medium text-[clamp(32px,4.5vw,56px)] tracking-[-0.02em] text-[#1A1815] mb-[16px] reveal">
          Boek jouw <span className="font-['Cormorant_Garamond'] italic">moment</span>
        </h2>
        <p className="text-[#5C564C] text-[16px] max-w-[480px] mx-auto mb-[36px] leading-[1.6] reveal">
          Kies een datum en tijd die jou uitkomt. Ik kijk ernaar uit je te ontmoeten.
        </p>
        <div className="w-full reveal">
          <iframe
            ref={iframeRef}
            src={`${CAL_URL}?embed=&theme=light&layout=month_view`}
            title="Boek een afspraak"
            className="w-full border-0 rounded-[18px] bg-transparent"
            style={{ minHeight: '600px' }}
            loading="lazy"
            allow="clipboard-write"
          />
        </div>
      </div>
    </section>
  )
}

/* ─── Main ─── */
export default function BehandelingenContent() {
  const rootRef = useReveal()
  return (
    <div ref={rootRef} className="flex flex-col gap-[14px]">
      <Hero />
      <Werkwijze />
      <Tarieven />
      <FAQSection />
      <Marquee />
      <Boeken />
    </div>
  )
}
