'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'

export default function Onderscheid() {
  const t = useTranslations('Onderscheid')

  const POINTS = [
    { num: t('item1Num'), title: t('item1Title'), para1: t('item1Para1'), para2: t('item1Para2'), take: t('item1Label') },
    { num: t('item2Num'), title: t('item2Title'), para1: t('item2Para1'), para2: t('item2Para2'), take: t('item2Label') },
    { num: t('item3Num'), title: t('item3Title'), para1: t('item3Para1'), para2: t('item3Para2'), take: t('item3Label') },
  ]
  const secRef = useRef<HTMLElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([])
  const entryRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const sec = secRef.current
    if (!sec) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Reveal
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            sec.classList.add('revealed')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.1 }
    )
    io.observe(sec)

    if (reduce) {
      entryRefs.current.forEach((e) => e?.classList.add('active'))
      return
    }

    // Scrollytelling
    let current = -1
    let raf = false

    const setActive = (i: number) => {
      if (i === current) return
      current = i
      slideRefs.current.forEach((s, k) => s?.classList.toggle('on', k === i))
      dotRefs.current.forEach((d, k) => d?.classList.toggle('on', k === i))
      entryRefs.current.forEach((e, k) => e?.classList.toggle('active', k === i))
    }

    const update = () => {
      const ty = window.innerHeight * 0.42
      let idx = 0
      entryRefs.current.forEach((e, i) => {
        if (e && e.getBoundingClientRect().top <= ty) idx = i
      })
      setActive(idx)
      raf = false
    }

    const onScroll = () => {
      if (!raf) {
        raf = true
        requestAnimationFrame(update)
      }
    }

    // Mobile: all visible, no spotlight
    const mobileQuery = window.matchMedia('(max-width: 880px)')
    if (mobileQuery.matches) {
      entryRefs.current.forEach((e) => e?.classList.add('active'))
      slideRefs.current.forEach((s) => s?.classList.remove('on'))
      slideRefs.current[0]?.classList.add('on')
    } else {
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onScroll, { passive: true })
      update()
    }

    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <section ref={secRef} className="ond-section">
      <style>{`
        .ond-section {
          max-width: 1200px;
          margin-inline: auto;
          padding: clamp(20px, 4vw, 40px) clamp(24px, 5vw, 56px);
          background: linear-gradient(165deg, #1f3328 0%, #162820 50%, #0f1c16 100%);
          border-radius: 26px;
        }
        .ond-grid {
          display: grid;
          grid-template-columns: 0.82fr 1.18fr;
          gap: clamp(40px, 5vw, 80px);
          align-items: start;
        }
        .ond-media {
          position: sticky;
          top: 14vh;
        }
        .ond-photo {
          position: relative;
          border-radius: 26px;
          overflow: hidden;
          aspect-ratio: 4/5;
          box-shadow: 0 40px 80px -38px rgba(28,24,20,.5), 0 0 0 1px rgba(176,141,79,.20);
        }
        .ond-slide {
          position: absolute; inset: 0;
          opacity: 0;
          transition: opacity .6s ease;
        }
        .ond-slide.on { opacity: 1; }
        .ond-slide img {
          width: 100%; height: 100%;
          object-fit: cover; display: block;
        }
        .ond-slide .ond-ph {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          text-align: center;
          font-family: 'Jost', system-ui, sans-serif;
          font-size: .72rem;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: rgba(255,255,255,.75);
          padding: 20px;
        }
        .ond-cap {
          position: absolute;
          left: 16px; bottom: 16px; z-index: 3;
          font-family: 'Jost', system-ui, sans-serif;
          font-weight: 600;
          font-size: .68rem;
          letter-spacing: .16em;
          text-transform: uppercase;
          color: #1A1611;
          background: #C9A86A;
          padding: .5em 1.05em;
          border-radius: 999px;
          box-shadow: 0 8px 20px -8px rgba(176,141,79,.4);
        }
        .ond-dots {
          position: absolute;
          right: 14px; bottom: 16px; z-index: 3;
          display: flex; gap: 6px;
        }
        .ond-dots i {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,.45);
          transition: all .3s;
          display: block;
        }
        .ond-dots i.on {
          background: #D8B97A;
          width: 18px;
          border-radius: 999px;
        }
        .ond-eyebrow {
          display: inline-block;
          font-weight: 600;
          font-size: .78rem;
          letter-spacing: .22em;
          text-transform: uppercase;
          color: #D8B97A;
          border: 1px solid rgba(176,141,79,.5);
          border-radius: 999px;
          padding: .5em 1.25em;
          margin-bottom: 1.4rem;
          background: transparent;
        }
        .ond-h2 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 600;
          letter-spacing: -.01em;
          font-size: clamp(2.4rem, 4.6vw, 3.7rem);
          line-height: 1.04;
          color: #D8B97A;
          margin: 0;
        }
        .ond-sub {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic;
          font-weight: 500;
          color: rgba(246,241,231,.65);
          font-size: clamp(1.3rem, 2.2vw, 1.7rem);
          margin-top: .6rem;
          margin-bottom: clamp(32px, 4vw, 52px);
        }
        .ond-entry {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: clamp(20px, 2.4vw, 34px);
          padding: clamp(30px, 3.6vw, 48px) 0 clamp(38px, 4.4vw, 60px);
          border-top: 1px solid rgba(176,141,79,.15);
          opacity: .26;
          transform: translateY(10px);
          transition: opacity .6s cubic-bezier(.16,1,.3,1), transform .6s cubic-bezier(.16,1,.3,1);
        }
        .ond-entry:first-of-type { border-top: none; }
        .ond-entry.active {
          opacity: 1;
          transform: translateY(0);
        }
        .ond-num {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic;
          font-weight: 500;
          font-size: clamp(2.6rem, 3.4vw, 3.4rem);
          line-height: .9;
          color: #B08D4F;
          transition: color .4s ease;
        }
        .ond-entry.active .ond-num { color: #D8B97A; }
        .ond-entry h3 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 600;
          font-size: clamp(1.5rem, 2.1vw, 1.85rem);
          line-height: 1.18;
          margin-bottom: .6rem;
          color: #F6F1E7;
        }
        .ond-entry p {
          color: rgba(246,241,231,.78);
          font-size: 1.1rem;
          line-height: 1.62;
          margin-bottom: 1rem;
        }
        .ond-take {
          display: inline-flex;
          align-items: center;
          gap: .55rem;
          margin-top: .2rem;
        }
        .ond-take .dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #B08D4F;
          box-shadow: 0 0 0 3px rgba(176,141,79,.16);
        }
        .ond-take span {
          font-weight: 600;
          font-size: .76rem;
          letter-spacing: .13em;
          text-transform: uppercase;
          color: #B08D4F;
        }
        .ond-r {
          opacity: 0;
          transform: translateY(22px);
          transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1);
        }
        .ond-section.revealed .ond-r { opacity: 1; transform: translateY(0); }
        .ond-section.revealed .ond-rm { transition-delay: .02s; }
        .ond-section.revealed .ond-rh { transition-delay: .06s; }

        @media (max-width: 880px) {
          .ond-grid { grid-template-columns: 1fr; gap: clamp(24px, 5vw, 36px); }
          .ond-media { position: static; }
          .ond-photo { aspect-ratio: 16/11; max-height: 340px; }
          .ond-entry { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ond-r { transition: none; }
          .ond-slide { transition: none; }
          .ond-entry { opacity: 1; transform: none; transition: none; }
        }
      `}</style>

      <div className="ond-grid">

        <div className="ond-media ond-r ond-rm">
          <div className="ond-photo">
            <div ref={(el) => { slideRefs.current[0] = el }} className="ond-slide on">
              <img src="https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/render/image/public/images/ond-01-signatuur.webp?width=1000&quality=75&resize=contain" alt="Eigen stijl / signature set" />
            </div>
            <div ref={(el) => { slideRefs.current[1] = el }} className="ond-slide">
              <img src="https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/render/image/public/images/ond-02-kennis.webp?width=1000&quality=75&resize=contain" alt="Kennis / oogvormanalyse" />
            </div>
            <div ref={(el) => { slideRefs.current[2] = el }} className="ond-slide">
              <img src="https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/render/image/public/images/ond-03-coaching.webp?width=1000&quality=75&resize=contain" alt="Chiva in de salon" />
            </div>
            <span className="ond-cap">{t('eyebrow')}</span>
            <div className="ond-dots">
              <i ref={(el) => { dotRefs.current[0] = el }} className="on" />
              <i ref={(el) => { dotRefs.current[1] = el }} />
              <i ref={(el) => { dotRefs.current[2] = el }} />
            </div>
          </div>
        </div>

        <div className="ond-content">
          <span className="ond-eyebrow ond-r ond-rh">{t('kicker')}</span>
          <h2 className="ond-h2 ond-r ond-rh">{t('title')}</h2>
          <p className="ond-sub ond-r ond-rh">{t('subtitle')}</p>

          {POINTS.map((p, i) => (
            <div
              key={p.num}
              ref={(el) => { entryRefs.current[i] = el }}
              className={`ond-entry${i === 0 ? ' active' : ''}`}
            >
              <div className="ond-num">{p.num}</div>
              <div>
                <h3>{p.title}</h3>
                <p>{p.para1}</p>
                <p>{p.para2}</p>
                <div className="ond-take">
                  <span className="dot" />
                  <span>{p.take}</span>
                </div>
              </div>
            </div>
          ))}

        </div>
      </div>
    </section>
  )
}
