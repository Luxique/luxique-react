'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'

export default function OnderscheidMobile() {
  const t = useTranslations('Onderscheid')

  const POINTS = [
    { num: t('item1Num'), title: t('item1Title'), para1: t('item1Para1'), para2: t('item1Para2'), take: t('item1Label'), img: 'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/render/image/public/images/ond-01-signatuur.webp?width=800&quality=75' },
    { num: t('item2Num'), title: t('item2Title'), para1: t('item2Para1'), para2: t('item2Para2'), take: t('item2Label'), img: 'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/render/image/public/images/ond-02-kennis.webp?width=800&quality=75' },
    { num: t('item3Num'), title: t('item3Title'), para1: t('item3Para1'), para2: t('item3Para2'), take: t('item3Label'), img: 'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/render/image/public/images/ond-03-coaching.webp?width=800&quality=75' },
  ]

  const phRefs = useRef<(HTMLDivElement | null)[]>([])
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([])
  const pointRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    let cur = -1
    let raf = false

    const setActive = (i: number) => {
      if (i === cur || i < 0 || i > 2) return
      cur = i
      phRefs.current.forEach((p, k) => p?.classList.toggle('active', k === i))
      dotRefs.current.forEach((d, k) => d?.classList.toggle('on', k === i))
    }

    const update = () => {
      const mid = window.innerHeight * 0.5
      let n = 0
      let best = Infinity
      pointRefs.current.forEach((p, i) => {
        if (!p) return
        const r = p.getBoundingClientRect()
        const c = r.top + r.height / 2
        const d = Math.abs(c - mid)
        if (d < best) { best = d; n = i }
      })
      setActive(n)
      raf = false
    }

    const onScroll = () => {
      if (!raf) {
        raf = true
        requestAnimationFrame(update)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    update()

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <style>{`
        .ond-mobile { display: none; }
        @media (max-width: 860px) {
          .ond-mobile { display: block; }

          /* Make the real next section (oogvormen) overlap the green */
          .ond-mob-overlay-target {
            position: relative !important;
            z-index: 20 !important;
            background: #FFFFFF !important;
            border-radius: 30px 30px 0 0;
            box-shadow: 0 -30px 60px -8px rgba(0,0,0,.6);
            margin-top: -25svh !important;
            overflow: visible;
          }
        }

        /* GREEN section — full-bleed */
        .ond-mob-diff {
          position: relative;
          background: linear-gradient(180deg, #2a3128, #1c211a 55%, #141811);
          z-index: 1;
        }

        /* FRONT: ONLY photo pinned (z5) — opaque green block hides scrolling text behind it */
        .ond-mob-photo-pin {
          position: sticky;
          top: env(safe-area-inset-top);
          z-index: 5;
          /* Opaque green bg covers navbar zone → photo → slightly past photo bottom.
             This ensures scrolling text NEVER shows above/beside the photo. */
          background: #2a3128;
          padding-top: 74px; /* navbar space */
          padding-bottom: 20px;
          pointer-events: none;
          margin-bottom: calc(-74px - 37svh - 20px); /* collapse so text flows up behind */
        }
        .ond-mob-photo {
          position: relative;
          margin: 0 18px;
          border-radius: 20px;
          overflow: hidden;
          height: 37svh;
          box-shadow: 0 24px 50px -24px rgba(0,0,0,.6);
        }
        .ond-mob-ph {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity .55s ease;
        }
        .ond-mob-ph.active { opacity: 1; }
        .ond-mob-ph img {
          width: 100%; height: 100%;
          object-fit: cover; display: block;
        }
        .ond-mob-badge {
          position: absolute;
          left: 16px; bottom: 16px;
          background: #C9A86A;
          color: #141811;
          font-size: .68rem;
          font-weight: 600;
          letter-spacing: .16em;
          text-transform: uppercase;
          padding: .5em 1.05em;
          border-radius: 999px;
        }
        .ond-mob-dots {
          position: absolute;
          right: 14px; bottom: 18px;
          display: flex; gap: 7px;
        }
        .ond-mob-dots i {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: rgba(246,241,231,.4);
          transition: all .3s;
          display: block;
        }
        .ond-mob-dots i.on {
          background: #D8B97A;
          width: 20px;
          border-radius: 4px;
        }

        /* Veil: soft fade at photo bottom boundary (z4) */
        .ond-mob-veil {
          position: sticky;
          top: calc(74px + 37svh - 10px);
          z-index: 4;
          height: 100px;
          margin-bottom: -100px;
          pointer-events: none;
          /* Solid green1 at top (matches section bg) → fades to transparent.
             Text scrolling UP behind this dissolves into the background. */
          background: linear-gradient(to bottom,
            #2a3128 0%, rgba(42,49,40,0.85) 30%, rgba(42,49,40,0) 100%);
        }

        /* BACK: ALL text scrolls (z2) */
        .ond-mob-content {
          position: relative;
          z-index: 2;
          padding: 0 24px;
          /* Add bottom padding so last point's trailing text doesn't peek
             below the overlap transition */
          padding-bottom: 10svh;
        }
        .ond-mob-head {
          padding-top: calc(74px + 37svh + 60px);
          padding-bottom: 40px;
          text-align: center;
        }
        .ond-mob-eyebrow {
          display: inline-block;
          font-size: .74rem;
          text-transform: uppercase;
          letter-spacing: .2em;
          color: #D8B97A;
          border: 1px solid rgba(216,185,122,.4);
          padding: 8px 18px;
          border-radius: 100px;
          margin-bottom: 20px;
        }
        .ond-mob-head h2 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          font-size: 2.5rem;
          line-height: 1.02;
          color: #D8B97A;
          margin: 0 0 6px;
        }
        .ond-mob-head .lead {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 1.25rem;
          color: rgba(246,241,231,.72);
        }
        .ond-mob-point {
          min-height: 74svh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 24px 0;
        }
        .ond-mob-point .num {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          font-size: 1.5rem;
          color: #D8B97A;
          margin-bottom: 10px;
        }
        .ond-mob-point h3 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          font-size: 2rem;
          line-height: 1.06;
          color: #F6F1E7;
          margin-bottom: 16px;
        }
        .ond-mob-point p {
          color: rgba(246,241,231,.72);
          font-size: 1.08rem;
          line-height: 1.62;
          margin-bottom: 1rem;
        }
        .ond-mob-take {
          display: inline-flex;
          align-items: center;
          gap: .55rem;
          margin-top: .2rem;
        }
        .ond-mob-take .dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #B08D4F;
          box-shadow: 0 0 0 3px rgba(176,141,79,.16);
        }
        .ond-mob-take span {
          font-weight: 600;
          font-size: .76rem;
          letter-spacing: .13em;
          text-transform: uppercase;
          color: #B08D4F;
        }

        /* PINHOLD: keeps green pinned after point 03 */
        .ond-mob-pinhold { height: 10svh; }

        /* REDUCED MOTION FALLBACK */
        @media (prefers-reduced-motion: reduce) {
          .ond-mob-photo-pin {
            position: relative;
            padding-top: 90px;
            margin-bottom: 0;
            background: #2a3128;
          }
          .ond-mob-veil { display: none; }
          .ond-mob-pinhold { display: none; }
          .ond-mob-overlay-target {
            margin-top: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .ond-mob-head { padding-top: 20px; }
          .ond-mob-point { min-height: auto; padding: 32px 0; }
        }
      `}</style>

      <div className="ond-mobile">
        <section className="ond-mob-diff">
          {/* FRONT: ONLY photo pinned (z5) — opaque green hides text behind it */}
          <div className="ond-mob-photo-pin">
            <div className="ond-mob-photo">
              {POINTS.map((p, i) => (
                <div
                  key={i}
                  ref={(el) => { phRefs.current[i] = el }}
                  className={`ond-mob-ph${i === 0 ? ' active' : ''}`}
                >
                  <img src={p.img} alt={p.title} />
                </div>
              ))}
              <span className="ond-mob-badge">{t('eyebrow')}</span>
              <div className="ond-mob-dots">
                <i ref={(el) => { dotRefs.current[0] = el }} className="on" />
                <i ref={(el) => { dotRefs.current[1] = el }} />
                <i ref={(el) => { dotRefs.current[2] = el }} />
              </div>
            </div>
          </div>

          {/* VEIL: soft fade at photo bottom (z4) */}
          <div className="ond-mob-veil" />

          {/* BACK: ALL text scrolls naturally (z2) */}
          <div className="ond-mob-content">
            <div className="ond-mob-head">
              <span className="ond-mob-eyebrow">{t('kicker')}</span>
              <h2>{t('title')}</h2>
              <div className="lead">{t('subtitle')}</div>
            </div>

            {POINTS.map((p, i) => (
              <div
                key={i}
                ref={(el) => { pointRefs.current[i] = el }}
                className="ond-mob-point"
              >
                <div className="num">{p.num}</div>
                <h3>{p.title}</h3>
                <p>{p.para1}</p>
                <p>{p.para2}</p>
                <div className="ond-mob-take">
                  <span className="dot" />
                  <span>{p.take}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Lock-on-03 hold */}
          <div className="ond-mob-pinhold" />
        </section>

        {/* No fake section — the real oogvormen section follows in page.tsx
            and gets .ond-mob-overlay-target via CSS to slide over the green */}
      </div>
    </>
  )
}
