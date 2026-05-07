'use client'

import { useRef, useEffect } from 'react'

/* ── Marquee row data ── */
const MARQUEE_ROWS = [
  { words: ['LUXIQUE', 'Academy'], dir: -1, speed: 0.6 },
  { words: ['MISSIE', 'standaard'], dir: 1, speed: 0.4 },
  { words: ['VERANDEREN', 'Artist'], dir: -1, speed: 0.8 },
  { words: ['LUXIQUE', 'Academy'], dir: 1, speed: 0.5 },
  { words: ['MISSIE', 'standaard'], dir: -1, speed: 0.7 },
  { words: ['VERANDEREN', 'Artist'], dir: 1, speed: 0.6 },
  { words: ['LUXIQUE', 'Academy'], dir: -1, speed: 0.45 },
  { words: ['MISSIE', 'standaard'], dir: 1, speed: 0.65 },
  { words: ['VERANDEREN', 'Artist'], dir: -1, speed: 0.55 },
]

export default function Missie() {
  const heroRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return

    const onScroll = () => {
      if (!heroRef.current) return
      const scrolled = -heroRef.current.getBoundingClientRect().top
      const progress = scrolled * 0.35
      MARQUEE_ROWS.forEach((r, i) => {
        const el = rowRefs.current[i]
        if (el) {
          el.style.transform = `translateX(${r.dir * progress * r.speed}px)`
        }
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="missie-wrap bg-[#FAF8F4] rounded-[22px] overflow-hidden relative">

      {/* ══ HERO: marquee bg + floating image ══ */}
      <div ref={heroRef} className="hero relative pt-12 pb-0 min-[860px]:min-h-[480px] max-[860px]:min-h-[600px] max-[430px]:min-h-[540px] max-[860px]:pt-16 max-[860px]:pb-14 max-[430px]:pt-[52px] max-[430px]:pb-12 flex flex-col items-center overflow-hidden">

        {/* Marquee background text */}
        <div className="absolute inset-0 flex flex-col justify-center gap-0 overflow-hidden pointer-events-none select-none">
          {MARQUEE_ROWS.map((row, i) => (
            <div
              key={i}
              ref={el => { rowRefs.current[i] = el }}
              className="marquee-row flex whitespace-nowrap will-change-transform"
            >
              {Array.from({ length: 4 }).map((_, j) => (
                <span key={j} className={`marquee-word font-['Avenir_Next'] text-[clamp(72px,12vw,140px)] max-[860px]:text-[clamp(50px,13vw,78px)] max-[430px]:text-[clamp(42px,12vw,58px)] leading-[0.88] uppercase py-0 px-6 whitespace-nowrap tracking-[0.06em] ${j % 2 === 0 ? 'font-[100] text-[rgba(196,162,101,0.28)]' : 'font-[700] italic text-[rgba(196,162,101,0.2)]'}`}>
                  {row.words[j % 2]}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* Floating image card */}
        <div className="relative z-[2] w-[min(420px,88%)] max-[860px]:w-[min(290px,74%)] max-[430px]:w-[70%] rounded-[20px] overflow-hidden shadow-[0_32px_80px_rgba(12,10,7,0.22),0_0_0_1px_rgba(196,162,101,0.1)] mt-6 max-[860px]:my-0 max-[860px]:mx-auto aspect-[4/3] max-[860px]:aspect-[3/4] bg-[linear-gradient(145deg,#1e1a12,#141009)]">
          {/* Placeholder — replace with real image */}
          <div className="w-full h-full flex flex-col items-center justify-center gap-[10px] text-[rgba(196,162,101,0.2)] text-[10px] tracking-[0.14em] uppercase">
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="0.75">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Foto — lash werk / studio sfeer
          </div>

          {/* Dark gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-[55%] bg-[linear-gradient(0deg,rgba(12,10,7,0.82),transparent)] flex flex-col justify-end p-6 pb-7">
            <span className="block text-[9px] font-semibold tracking-[0.24em] uppercase text-[#C4A265] mb-2">Missie</span>
            <h2 className="font-['Cormorant_Garamond'] text-[clamp(22px,3.5vw,36px)] font-normal text-[#FAF8F4] leading-[1.1] tracking-[-0.01em]">
              Wij willen de standaard<br /><em className="italic text-[#C4A265]">veranderen.</em>
            </h2>
          </div>
        </div>
      </div>

      {/* ══ LOOSE TEXT ══ */}
      <div className="p-[52px_56px] max-[860px]:p-[40px_20px] grid grid-cols-1 min-[860px]:grid-cols-[1fr_1.1fr] gap-[60px] max-[860px]:gap-7 items-start">
        <div className="font-['Cormorant_Garamond'] text-[clamp(24px,2.8vw,38px)] font-normal leading-[1.15] text-[#1E1A14] tracking-[-0.01em] min-[860px]:sticky min-[860px]:top-[40px]">
          Dat is niet wat<br />lash extensions zijn.<br /><em className="italic text-[#C4A265]">En dat willen<br />wij veranderen.</em>
        </div>

        <div className="flex flex-col gap-[18px]">
          <p className="text-[14px] font-light text-[#7A7268] leading-[1.85]">
            Vraag een willekeurig iemand op straat wat lash extensions zijn. Ze zeggen: <em className="font-['Cormorant_Garamond'] italic text-[15px] text-[#1E1A14]">&ldquo;Die grote zwarte dingen op je wimpers.&rdquo;</em>
          </p>
          <p className="text-[14px] font-light text-[#7A7268] leading-[1.85]">
            In Nederland is Russian volume de norm. Zwaar, donker, vol. Chiva koos daar bewust niet voor. Toen zij begon, deed zij direct wispy — naturel, passend bij het oog van de klant. Mensen begrepen het niet altijd in het begin. Maar zij bleef gaan.
          </p>

          <div className="border-l-2 border-[#C4A265] py-[2px] pl-5">
            <p className="font-['Cormorant_Garamond'] text-[18px] italic font-light text-[#1E1A14] leading-[1.55]">
              &ldquo;It&apos;s good to be different. Start off different. Just be you — and people will love you eventually.&rdquo;
            </p>
            <span className="block text-[9.5px] font-semibold tracking-[0.18em] uppercase text-[#7A6340] mt-2">— Chiva</span>
          </div>

          <p className="text-[14px] font-light text-[#7A7268] leading-[1.85]">
            LXQ Academy bestaat omdat er een verschil is tussen een lash tech en een lash artist — en dat verschil er écht toe doet. Niet alleen voor de klant die in jouw stoel zit, maar voor het niveau van het hele vak.
          </p>
        </div>
      </div>

      {/* ══ PILLAR PANEL ══ */}
      <div className="missie-pillars bg-[#1C2318] rounded-[22px] p-[48px] mx-[14px] mb-[14px] max-[860px]:p-[36px_20px_32px] max-[860px]:mx-[10px] max-[860px]:mb-[10px] relative overflow-hidden">
        {/* Grain overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-50" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.05\'/%3E%3C/svg%3E")' }} />
        {/* Gold glow */}
        <div className="absolute -top-[50px] left-1/2 -translate-x-1/2 w-[320px] h-[200px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(196,162,101,0.07) 0%, transparent 70%)' }} />

        <div className="mb-10 relative z-[1]">
          <span className="block text-[9.5px] font-semibold tracking-[0.26em] uppercase text-[rgba(196,162,101,0.5)] mb-[14px]">Hoe wij dat doen</span>
          <h3 className="font-['Cormorant_Garamond'] text-[clamp(24px,2.8vw,38px)] font-normal text-[rgba(250,248,244,0.88)] leading-[1.15] tracking-[-0.01em] max-w-[520px]">
            Drie dingen die het verschil maken<br />tussen een technician en een <em className="italic text-[#C4A265]">artist.</em>
          </h3>
        </div>

        <div className="missie-pillars-grid grid min-[860px]:grid-cols-3 max-[860px]:grid-cols-1 gap-px bg-[rgba(250,248,244,0.05)] rounded-[14px] overflow-hidden relative z-[1]">

          <div className="missie-pillar bg-[#1C2318] p-[32px_28px_28px] flex flex-col gap-4 transition-[background] duration-[280ms] relative group hover:bg-[#232C1E]">
            <div className="absolute top-0 left-7 right-7 h-px bg-[linear-gradient(90deg,#C4A265,transparent)] opacity-0 transition-opacity duration-[280ms] group-hover:opacity-[0.35]" />
            <div className="text-[#C4A265] opacity-75 mb-1">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h4 className="font-['Cormorant_Garamond'] text-[21px] font-normal text-[rgba(250,248,244,0.88)] leading-[1.2] tracking-[-0.01em]">Kijken naar het oog</h4>
            <p className="text-[12.5px] font-light text-[rgba(250,248,244,0.38)] leading-[1.8] flex-1">Niet naar de wimper. Elke oogvorm vraagt een andere aanpak — de curl, de lengte, de plaatsing. Wij leren je analyseren vóórdat je een fan pakt.</p>
            <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[rgba(196,162,101,0.4)] mt-1">Oogvorm analyse</span>
          </div>

          <div className="missie-pillar bg-[#1C2318] p-[32px_28px_28px] flex flex-col gap-4 transition-[background] duration-[280ms] relative group hover:bg-[#232C1E]">
            <div className="absolute top-0 left-7 right-7 h-px bg-[linear-gradient(90deg,#C4A265,transparent)] opacity-0 transition-opacity duration-[280ms] group-hover:opacity-[0.35]" />
            <div className="text-[#C4A265] opacity-75 mb-1">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
              </svg>
            </div>
            <h4 className="font-['Cormorant_Garamond'] text-[21px] font-normal text-[rgba(250,248,244,0.88)] leading-[1.2] tracking-[-0.01em]">Ontwerpen, niet kopiëren</h4>
            <p className="text-[12.5px] font-light text-[rgba(250,248,244,0.38)] leading-[1.8] flex-1">Geen standaard maps, geen templates. Wij leren je een set bedenken die écht bij de persoon past — uniek ontwerp, elke keer weer.</p>
            <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[rgba(196,162,101,0.4)] mt-1">Creatief ontwerp</span>
          </div>

          <div className="missie-pillar bg-[#1C2318] p-[32px_28px_28px] flex flex-col gap-4 transition-[background] duration-[280ms] relative group hover:bg-[#232C1E]">
            <div className="absolute top-0 left-7 right-7 h-px bg-[linear-gradient(90deg,#C4A265,transparent)] opacity-0 transition-opacity duration-[280ms] group-hover:opacity-[0.35]" />
            <div className="text-[#C4A265] opacity-75 mb-1">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
              </svg>
            </div>
            <h4 className="font-['Cormorant_Garamond'] text-[21px] font-normal text-[rgba(250,248,244,0.88)] leading-[1.2] tracking-[-0.01em]">Het waarom begrijpen</h4>
            <p className="text-[12.5px] font-light text-[rgba(250,248,244,0.38)] leading-[1.8] flex-1">Kennis over elke curl die bestaat, wanneer je welke gebruikt, en waarom dat werkt. Begin met het waarom — niet met het hoe.</p>
            <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[rgba(196,162,101,0.4)] mt-1">Vakkennis &amp; mindset</span>
          </div>

        </div>
      </div>

    </div>
  )
}
