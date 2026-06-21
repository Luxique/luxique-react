'use client'

import { useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'

/* ── Marquee row data — decorative, stays hardcoded ── */
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

/** Split text into per-word spans for scroll-fill effect */
function WordSpans({ text, italic = false }: { text: string; italic?: boolean }) {
  return (
    <>
      {text.split(' ').filter(Boolean).map((word, i) => (
        <span key={i} className={`miss-w${italic ? ' it' : ''}`}>{word} </span>
      ))}
    </>
  )
}

export default function Missie() {
  const t = useTranslations('Missie')
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
          <img src="https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/render/image/public/images/missie-statement.webp?width=1200&quality=75&resize=contain" alt={t('titleLine1')} className="w-full h-full object-cover" />

          {/* Dark gold gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-[linear-gradient(0deg,rgba(48,36,14,0.88),rgba(48,36,14,0.4)_40%,transparent)] flex flex-col justify-end p-6 pb-7">
            <h2 className="font-['Cormorant_Garamond'] text-[clamp(22px,3.5vw,36px)] font-normal text-[#FAF8F4] leading-[1.1] tracking-[-0.01em]">
              {t('titleLine1')}<br /><span className="font-['Cormorant_Garamond'] italic font-normal text-[#C4A265]">{t('titleLine2')}</span>
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
            <span ref={eyebrowRef} className="miss-eyebrow">{t('eyebrow')}</span>
            <h2 ref={statementRef} className="miss-statement">
              <WordSpans text={t('headingPre')} />
              <WordSpans text={t('headingEm')} italic />
              <WordSpans text={t('headingPost')} />
            </h2>
            <div ref={ruleRef} className="miss-rule" />
          </div>
          <div className="miss-col-body">
            <div ref={bodyWrapRef} className="miss-body-wrap">
              <p className="text-[18px] font-normal text-[#1E1A14] leading-[1.8] mb-[18px]">
                {t('paragraph1Pre')}<span className="text-[#B08D4F] font-medium">{t('paragraph1Em')}</span>{t('paragraph1Post')}
              </p>
              <p className="text-[17px] font-light text-[#7A7268] leading-[1.8] mb-[18px]">
                {t('paragraph2Pre')}<em className="italic text-[#B08D4F] not-italic font-medium">{t('paragraph2Em')}</em>{t('paragraph2Post')}
              </p>
              <p className="text-[17px] font-light text-[#7A7268] leading-[1.8]">
                {t('paragraph3Pre')}<em className="italic text-[#B08D4F] not-italic font-medium">{t('paragraph3Em')}</em>{t('paragraph3Post')}
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
