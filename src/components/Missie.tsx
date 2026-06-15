'use client'

import { useRef, useEffect } from 'react'

/* ── Marquee row data ── */
const MARQUEE_ROWS = [
  { words: ['LUXIQUE', 'Academy'], dir: -1, speed: 0.6 },
  { words: ['STANDAARD', 'verhogen'], dir: 1, speed: 0.4 },
  { words: ['MISSIE', 'Artist'], dir: -1, speed: 0.8 },
  { words: ['LUXIQUE', 'Academy'], dir: 1, speed: 0.5 },
  { words: ['STANDAARD', 'verhogen'], dir: -1, speed: 0.7 },
  { words: ['MISSIE', 'Artist'], dir: 1, speed: 0.6 },
  { words: ['LUXIQUE', 'Academy'], dir: -1, speed: 0.45 },
  { words: ['STANDAARD', 'verhogen'], dir: 1, speed: 0.65 },
  { words: ['MISSIE', 'Artist'], dir: -1, speed: 0.55 },
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
          <img src="https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/missie-image.webp" alt="Missie — Lash werk" className="w-full h-full object-cover" />

          {/* Dark gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-[55%] bg-[linear-gradient(0deg,rgba(12,10,7,0.82),transparent)] flex flex-col justify-end p-6 pb-7">
            <span className="block text-[9px] font-semibold tracking-[0.24em] uppercase text-[#C4A265] mb-2">Missie</span>
            <h2 className="font-['Cormorant_Garamond'] text-[clamp(22px,3.5vw,36px)] font-normal text-[#FAF8F4] leading-[1.1] tracking-[-0.01em]">
              Wij willen de standaard<br /><span className="font-['Cormorant_Garamond'] italic font-normal text-[#C4A265]">veranderen.</span>
            </h2>
          </div>
        </div>
      </div>

      {/* ══ LOOSE TEXT ══ */}
      <div className="p-[52px_56px] max-[860px]:p-[40px_20px] grid grid-cols-1 min-[860px]:grid-cols-[1fr_1.1fr] gap-[60px] max-[860px]:gap-7 items-start">
        <div className="font-['Cormorant_Garamond'] text-[clamp(27px,2.8vw,38px)] font-normal leading-[1.15] text-[#1E1A14] tracking-[-0.01em] min-[860px]:sticky min-[860px]:top-[40px]">
          De lash industrie<br />verdient een hogere<br /><span className="font-['Cormorant_Garamond'] italic font-normal text-[#C4A265]">standaard.</span>
        </div>

        <div className="flex flex-col gap-[18px]">
          <p className="text-[17px] font-light text-[#7A7268] leading-[1.8]">
            Lash extensions zijn al jaren één van de snelst groeiende beauty behandelingen in Nederland. Maar het opleidingsniveau staat stil. Terwijl de markt groeit, blijft de kwaliteit hangen op hetzelfde niveau als tien jaar geleden. Geen innovatie, geen vooruitgang. De meeste cursussen leren je repetitief werk uitvoeren — hetzelfde patroon, dezelfde map, keer op keer. Je leert techniek, maar je leert niet begrijpen. Doorgaans leer je wel fans plaatsen, maar niet of die ene fan bij dat specifieke oog past.
          </p>

          <p className="text-[17px] font-light text-[#7A7268] leading-[1.8]">
            Het resultaat? Een markt vol technici die prima resultaten leveren. Maar zelden iemand die écht het verschil maakt zowel voor de klant in de stoel als voor het vak zelf.
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
          <span className="block text-[9.5px] font-semibold tracking-[0.26em] uppercase text-[rgba(196,162,101,0.5)] mb-[14px]">Wat ons onderscheidt</span>
          <h3 className="font-['Cormorant_Garamond'] text-[clamp(27px,2.8vw,38px)] font-normal text-[rgba(250,248,244,0.88)] leading-[1.15] tracking-[-0.01em] max-w-[520px]">
            Wat <span className="font-['Cormorant_Garamond'] italic font-normal text-[#C4A265]">LXQ</span> anders doet dan<br />andere opleidingen.
          </h3>
        </div>

        <div className="missie-pillars-grid grid min-[860px]:grid-cols-3 max-[860px]:grid-cols-1 gap-px bg-[rgba(250,248,244,0.05)] rounded-[14px] overflow-hidden relative z-[1]">

          <div className="missie-pillar bg-[#1C2318] p-[32px_28px_28px] flex flex-col gap-4 transition-[background] duration-[280ms] relative group hover:bg-[#232C1E]">
            <div className="absolute top-0 left-7 right-7 h-px bg-[linear-gradient(90deg,#C4A265,transparent)] opacity-0 transition-opacity duration-[280ms] group-hover:opacity-[0.35]" />
            <div className="text-[#C4A265] opacity-75 mb-1">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
              </svg>
            </div>
            <h4 className="font-['Cormorant_Garamond'] text-[21px] font-normal text-[rgba(250,248,244,0.88)] leading-[1.2] tracking-[-0.01em]">Van techniek naar signatuur</h4>
            <p className="text-[12.5px] font-light text-[rgba(250,248,244,0.38)] leading-[1.8] flex-1">Wij leren je niet alleen hoe je een set plaatst — wij leren je een eigen stijl ontwikkelen. Je verlaat de opleiding niet als kopie van iemand anders, maar met een aanpak die herkenbaar van jou is. Dat is wat klanten laat terugkomen.</p>
            <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[rgba(196,162,101,0.4)] mt-1">Jouw stijl, jouw merk</span>
          </div>

          <div className="missie-pillar bg-[#1C2318] p-[32px_28px_28px] flex flex-col gap-4 transition-[background] duration-[280ms] relative group hover:bg-[#232C1E]">
            <div className="absolute top-0 left-7 right-7 h-px bg-[linear-gradient(90deg,#C4A265,transparent)] opacity-0 transition-opacity duration-[280ms] group-hover:opacity-[0.35]" />
            <div className="text-[#C4A265] opacity-75 mb-1">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
              </svg>
            </div>
            <h4 className="font-['Cormorant_Garamond'] text-[21px] font-normal text-[rgba(250,248,244,0.88)] leading-[1.2] tracking-[-0.01em]">Kennis die verder gaat dan techniek</h4>
            <p className="text-[12.5px] font-light text-[rgba(250,248,244,0.38)] leading-[1.8] flex-1">Wij beginnen bij het waarom. Kleurtheorie, gezichtsproporties, oogvorm analyse — vóórdat je een tweezer aanraakt. Zodat je begrijpt wat je doet, niet alleen hoe. En dat begrip neem je mee naar elke klant die daarna in jouw stoel zit.</p>
            <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[rgba(196,162,101,0.4)] mt-1">Kennis die blijft</span>
          </div>

          <div className="missie-pillar bg-[#1C2318] p-[32px_28px_28px] flex flex-col gap-4 transition-[background] duration-[280ms] relative group hover:bg-[#232C1E]">
            <div className="absolute top-0 left-7 right-7 h-px bg-[linear-gradient(90deg,#C4A265,transparent)] opacity-0 transition-opacity duration-[280ms] group-hover:opacity-[0.35]" />
            <div className="text-[#C4A265] opacity-75 mb-1">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h4 className="font-['Cormorant_Garamond'] text-[21px] font-normal text-[rgba(250,248,244,0.88)] leading-[1.2] tracking-[-0.01em]">Coaching door een <span className="text-[#C4A265] italic" style={{ textShadow: '0 0 20px rgba(196,162,101,0.6), 0 0 40px rgba(196,162,101,0.3)' }}>self-taught</span> lash artist</h4>
            <p className="text-[12.5px] font-light text-[rgba(250,248,244,0.38)] leading-[1.8] flex-1">Chiva heeft geen opleiding gevolgd. Ze bouwde haar kennis op door vallen en opstaan — door te experimenteren, bij te sturen en door te zetten toen anderen twijfelden. Wat ze je leert, heeft ze zelf bewezen. In een echte salon, met echte klanten, dag na dag.</p>
            <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[rgba(196,162,101,0.4)] mt-1">Praktijkervaring, geen theorie</span>
          </div>

        </div>
      </div>

    </div>
  )
}
