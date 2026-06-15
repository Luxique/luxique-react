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
  const missionRef = useRef<HTMLElement>(null)
  const statementRef = useRef<HTMLHeadingElement>(null)
  const eyebrowRef = useRef<HTMLSpanElement>(null)
  const ruleRef = useRef<HTMLDivElement>(null)
  const bodyWrapRef = useRef<HTMLDivElement>(null)

  // Marquee scroll
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

  // Scroll-fill + reveal for mission statement
  useEffect(() => {
    const statement = statementRef.current
    const mission = missionRef.current
    const eyebrow = eyebrowRef.current
    const rule = ruleRef.current
    const bodyWrap = bodyWrapRef.current
    if (!statement || !mission) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const words = Array.from(statement.querySelectorAll('.miss-w'))

    // Reveal on intersect
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          eyebrow?.classList.add('in')
          rule?.classList.add('in')
          bodyWrap?.classList.add('in')
        }
      })
    }, { threshold: 0.2 })
    io.observe(mission)

    // Scroll-fill
    if (reduce) {
      words.forEach((w) => w.classList.add('on'))
      return
    }

    let ticking = false
    const fill = () => {
      const r = statement.getBoundingClientRect()
      const vh = window.innerHeight
      const start = vh * 0.85, end = vh * 0.40
      let p = (start - r.top) / (start - end)
      p = Math.max(0, Math.min(1, p))
      const n = Math.round(p * words.length)
      words.forEach((w, i) => w.classList.toggle('on', i < n))
      ticking = false
    }
    const onScrollFill = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(fill)
      }
    }
    window.addEventListener('scroll', onScrollFill, { passive: true })
    window.addEventListener('resize', onScrollFill, { passive: true })
    fill()

    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScrollFill)
      window.removeEventListener('resize', onScrollFill)
    }
  }, [])

  return (
    <div className="missie-wrap bg-[#FAF8F4] rounded-[22px] overflow-hidden relative">

      {/* Top fade — blends from previous section's bg (#F3EFE7) into this section */}
      <div className="absolute top-0 left-0 right-0 h-[80px] z-[10] pointer-events-none" style={{ background: 'linear-gradient(180deg, #F3EFE7 0%, rgba(250,248,244,0) 100%)' }} />

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
        <div className="relative z-[2] w-[min(420px,88%)] max-[860px]:w-[min(290px,74%)] max-[430px]:w-[70%] rounded-[20px] overflow-hidden shadow-[0_32px_80px_rgba(12,10,7,0.22),0_0_0_1px_rgba(196,162,101,0.1)] mt-6 max-[860px]:my-0 max-[860px]:mx-auto aspect-[831/1155] bg-[linear-gradient(145deg,#1e1a12,#141009)]">
          <img src="https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/missie-statement.jpg" alt="Educating future Artists" className="w-full h-full object-cover" />

          {/* Dark gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-[55%] bg-[linear-gradient(0deg,rgba(12,10,7,0.82),transparent)] flex flex-col justify-end p-6 pb-7">
            <span className="block text-[9px] font-semibold tracking-[0.24em] uppercase text-[#C4A265] mb-2">Missie</span>
            <h2 className="font-['Cormorant_Garamond'] text-[clamp(22px,3.5vw,36px)] font-normal text-[#FAF8F4] leading-[1.1] tracking-[-0.01em]">
              Educating future<br /><span className="font-['Cormorant_Garamond'] italic font-normal text-[#C4A265]">Artists.</span>
            </h2>
          </div>
        </div>
      </div>

      {/* ══ MISSION STATEMENT — scroll-fill kop + body ══ */}
      <section ref={missionRef} className="missie-statement-section" style={{
        padding: 'clamp(72px,11vw,140px) clamp(24px,5vw,56px)',
      }}>
        <style>{`
          .missie-statement-section { position: relative; }
          .miss-grid {
            max-width: 1160px; margin-inline: auto;
            display: grid; grid-template-columns: 1.05fr 1fr;
            gap: clamp(40px, 5.5vw, 88px); align-items: start;
          }
          .miss-eyebrow {
            display: inline-block; font-weight: 600;
            font-size: .78rem; letter-spacing: .22em; text-transform: uppercase;
            color: #1C1814; border: 1px solid rgba(28,24,20,.14);
            border-radius: 999px; padding: .5em 1.25em; margin-bottom: 1.6rem;
            background: transparent;
            opacity: 0; transform: translateY(16px);
            transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1);
          }
          .miss-eyebrow.in { opacity: 1; transform: none; }
          .miss-statement {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-weight: 600; letter-spacing: -.01em;
            font-size: clamp(2.4rem, 4.7vw, 4.3rem); line-height: 1.07;
            color: #1C1814; margin: 0;
          }
          .miss-w { color: #CBC3B4; transition: color .4s ease; }
          .miss-w.on { color: #1C1814; }
          .miss-w.it { font-style: italic; font-weight: 500; }
          .miss-w.it.on { color: #B08D4F; }
          .miss-rule {
            width: 54px; height: 2px; background: #B08D4F;
            margin-top: clamp(24px, 3vw, 36px);
            opacity: 0; transition: opacity .8s ease .2s;
          }
          .miss-rule.in { opacity: .8; }
          .miss-col-body { margin-top: 3.3rem; }
          .miss-body-wrap {
            max-width: 520px;
            opacity: 0; transform: translateY(22px);
            transition: opacity .8s cubic-bezier(.16,1,.3,1) .15s, transform .8s cubic-bezier(.16,1,.3,1) .15s;
          }
          .miss-body-wrap.in { opacity: 1; transform: none; }
          @media (max-width: 860px) {
            .miss-grid { grid-template-columns: 1fr; gap: clamp(24px,5vw,40px); }
            .miss-col-body { margin-top: 0; }
            .miss-statement { font-size: clamp(2.2rem, 9vw, 3.4rem); }
            .miss-body-wrap { max-width: none; }
          }
          @media (prefers-reduced-motion: reduce) {
            .miss-w { color: #1C1814 !important; transition: none; }
            .miss-eyebrow, .miss-rule, .miss-body-wrap { opacity: 1 !important; transform: none !important; transition: none; }
          }
        `}</style>
        <div className="miss-grid">
          <div className="miss-col-head">
            <span ref={eyebrowRef} className="miss-eyebrow">De missie</span>
            <h2 ref={statementRef} className="miss-statement">
              <span className="miss-w">De</span>{' '}
              <span className="miss-w">lash-industrie</span>{' '}
              <span className="miss-w">verdient</span>{' '}
              <span className="miss-w">een</span>{' '}
              <span className="miss-w it">hogere</span>{' '}
              <span className="miss-w it">standaard.</span>
            </h2>
            <div ref={ruleRef} className="miss-rule" />
          </div>
          <div className="miss-col-body">
            <div ref={bodyWrapRef} className="miss-body-wrap">
              <p className="text-[18px] font-normal text-[#1E1A14] leading-[1.8] mb-[18px]">
                Lash extensions groeien al jaren hard — maar het <span className="text-[#B08D4F] font-medium">opleidingsniveau staat stil</span>.
              </p>
              <p className="text-[17px] font-light text-[#7A7268] leading-[1.8] mb-[18px]">
                De meeste cursussen leren je repetitief werk: hetzelfde patroon, dezelfde map, keer op keer. <em className="italic text-[#B08D4F] not-italic font-medium">Je leert techniek, maar je leert niet begrijpen.</em>
              </p>
              <p className="text-[17px] font-light text-[#7A7268] leading-[1.8]">
                Het resultaat? Een markt vol technici, maar zelden iemand die <em className="italic text-[#B08D4F] not-italic font-medium">écht het verschil maakt</em> — voor de klant én voor het vak.
              </p>
            </div>
          </div>
        </div>
      </section>

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
