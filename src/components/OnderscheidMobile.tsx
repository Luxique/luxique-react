'use client'

import { useEffect, useRef } from 'react'

const POINTS = [
  {
    num: '01',
    title: 'Van techniek naar signatuur',
    paras: [
      'Wij leren je niet alleen hoe je een set plaatst — wij leren je een eigen stijl ontwikkelen. Je verlaat de opleiding niet als kopie van iemand anders, maar met een aanpak die herkenbaar van jou is. Dat is wat klanten laat terugkomen.',
      'We helpen je ontdekken wat jóuw handtekening is: welke sets je het beste liggen, welke looks je wilt neerzetten en hoe je die consistent maakt. In een markt vol technici die allemaal hetzelfde leveren, is een herkenbare stijl wat je onvergetelijk maakt — en wat je prijs rechtvaardigt.',
    ],
    take: 'Jouw stijl, jouw merk',
    img: 'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/ond-01-signatuur.webp',
  },
  {
    num: '02',
    title: 'Kennis die verder gaat dan techniek',
    paras: [
      'Wij beginnen bij het waarom. Kleurtheorie, gezichtsproporties, oogvormanalyse — vóórdat je een tweezer aanraakt. Zodat je begrijpt wat je doet, niet alleen hoe. En dat begrip neem je mee naar elke klant die daarna in jouw stoel zit.',
      'Techniek kun je nadoen, maar inzicht maakt het verschil. Snap je waaróm een bepaalde curl bij een bepaald oog past, dan kun je élke klant aan — ook degene die niet in een standaard map past. Je wordt geen uitvoerder, maar iemand die bewust keuzes maakt.',
    ],
    take: 'Kennis die blijft',
    img: 'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/ond-02-kennis.webp',
  },
  {
    num: '03',
    title: 'Coaching door een ervaren lash artist',
    paras: [
      'Chiva volgde een opleiding — en ging daarna verder waar anderen stopten. Ze experimenteerde, stuurde bij en ontwikkelde een eigen stijl waar nu veel vraag naar is. Wat ze je leert, heeft ze zelf bewezen: in een echte salon, met echte klanten, dag na dag.',
      'Dat betekent geen theorie uit een boekje, maar lessen uit de praktijk: wat werkt, wat niet, en waar je in het begin op vastloopt. Je leert van iemand die precies weet hoe het is om te starten — en hoe je doorgroeit naar werk waar mensen voor terugkomen.',
    ],
    take: 'Bewezen in de praktijk',
    img: 'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/ond-03-coaching.webp',
  },
]

/**
 * OnderscheidMobile — mobile-only (<861px) scroll-pinning rebuild.
 * Desktop is untouched (rendered by Onderscheid.tsx above 880px).
 *
 * Technique: Pure CSS sticky positioning.
 * - No GSAP dependency needed — the mockup proves CSS sticky works.
 * - Uses svh units for iOS Safari address-bar reliability.
 * - prefers-reduced-motion: falls back to clean stacked sections.
 *
 * Layer order (front → back):
 *   z5  diff-front   = photo slider + title (sticky, pinned)
 *   z4  veil         = fade gradient at photo bottom boundary
 *   z2  points       = scrolling text (goes UP behind photo + veil)
 *
 * After point 03: pinhold keeps green visible, next section
 * slides over with rounded top + shadow.
 */
export default function OnderscheidMobile() {
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
        /* ===== MOBILE ONLY: show below 861px ===== */
        .ond-mobile { display: none; }
        @media (max-width: 860px) {
          .ond-mobile { display: block; }
          .ond-desktop-hide { display: none !important; }
        }

        /* ===== STAGE ===== */
        .ond-mob-stage { position: relative; }

        /* GREEN section — full-bleed, extends behind navbar */
        .ond-mob-diff {
          position: relative;
          background: linear-gradient(180deg, #2a3128, #1c211a 55%, #141811);
          z-index: 1;
        }

        /* BACK layer: scrolling text (z2) */
        .ond-mob-points {
          position: relative;
          z-index: 2;
          padding: 0 24px;
          /* push first point below the pinned photo+title block */
          padding-top: calc(74px + 42svh + 150px);
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

        /* FRONT layer: photo + title, pinned (z5) */
        .ond-mob-front {
          position: sticky;
          top: 0;
          z-index: 5;
          height: 100svh;
          padding-top: 74px;
          pointer-events: none;
          margin-bottom: -100svh;
        }
        .ond-mob-photo {
          position: relative;
          margin: 0 18px;
          border-radius: 20px;
          overflow: hidden;
          height: 42svh;
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
        .ond-mob-head { padding: 22px 24px 0; }
        .ond-mob-eyebrow {
          display: inline-block;
          font-size: .74rem;
          text-transform: uppercase;
          letter-spacing: .2em;
          color: #D8B97A;
          border: 1px solid rgba(216,185,122,.4);
          padding: 8px 18px;
          border-radius: 100px;
        }
        .ond-mob-head h2 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          font-size: 2.5rem;
          line-height: 1.02;
          color: #D8B97A;
          margin: 16px 0 6px;
        }
        .ond-mob-head .lead {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 1.25rem;
          color: rgba(246,241,231,.72);
        }

        /* MIDDLE layer: veil — fixed on boundary under photo (z4) */
        .ond-mob-veil {
          position: sticky;
          top: calc(74px + 42svh - 30px);
          z-index: 4;
          height: 150px;
          margin-bottom: -150px;
          pointer-events: none;
          background: linear-gradient(to bottom,
            #2a3128 0%, #2a3128 42%, rgba(42,49,40,0) 100%);
        }

        /* PINHOLD: keeps green pinned after point 03 */
        .ond-mob-pinhold { height: 30svh; }

        /* NEXT section: slides over the pinned green */
        .ond-mob-next {
          position: relative;
          z-index: 10;
          background: #F3EFE7;
          border-radius: 30px 30px 0 0;
          box-shadow: 0 -30px 60px -8px rgba(0,0,0,.6);
          padding: 60px 24px 90px;
          min-height: 60svh;
          margin-top: -22svh;
        }
        .ond-mob-next-eyebrow {
          font-size: .74rem;
          text-transform: uppercase;
          letter-spacing: .2em;
          color: #B08D4F;
        }
        .ond-mob-next h2 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          font-size: 2.3rem;
          line-height: 1.05;
          margin: 14px 0 14px;
          color: #1C1814;
        }
        .ond-mob-next p {
          color: #46403A;
          max-width: 40ch;
        }

        /* ===== REDUCED MOTION FALLBACK ===== */
        @media (prefers-reduced-motion: reduce) {
          .ond-mob-front {
            position: relative;
            height: auto;
            padding-top: 90px;
            margin-bottom: 0;
          }
          .ond-mob-veil { display: none; }
          .ond-mob-pinhold { display: none; }
          .ond-mob-next {
            margin-top: 0;
            border-radius: 0;
            box-shadow: none;
          }
          .ond-mob-points { padding-top: 20px; }
          .ond-mob-point { min-height: auto; padding: 32px 0; }
        }
      `}</style>

      {/* This wrapper hides on desktop, shows on mobile */}
      <div className="ond-mobile">
        <div className="ond-mob-stage">
          <section className="ond-mob-diff">
            {/* FRONT: pinned photo + title (z5) */}
            <div className="ond-mob-front">
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
                <span className="ond-mob-badge">✦ LXQ Academy</span>
                <div className="ond-mob-dots">
                  <i ref={(el) => { dotRefs.current[0] = el }} className="on" />
                  <i ref={(el) => { dotRefs.current[1] = el }} />
                  <i ref={(el) => { dotRefs.current[2] = el }} />
                </div>
              </div>
              <div className="ond-mob-head">
                <span className="ond-mob-eyebrow">Het verschil</span>
                <h2>Wat ons onderscheidt</h2>
                <div className="lead">Wat LXQ anders doet dan andere opleidingen.</div>
              </div>
            </div>

            {/* MIDDLE: veil on the boundary (z4) */}
            <div className="ond-mob-veil" />

            {/* BACK: scrolling text behind photo + veil (z2) */}
            <div className="ond-mob-points">
              {POINTS.map((p, i) => (
                <div
                  key={i}
                  ref={(el) => { pointRefs.current[i] = el }}
                  className="ond-mob-point"
                >
                  <div className="num">{p.num}</div>
                  <h3>{p.title}</h3>
                  {p.paras.map((para, j) => (
                    <p key={j} dangerouslySetInnerHTML={{ __html: para }} />
                  ))}
                  <div className="ond-mob-take">
                    <span className="dot" />
                    <span>{p.take}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Lock-on-03 hold: green stays pinned */}
            <div className="ond-mob-pinhold" />
          </section>

          {/* NEXT slides OVER the pinned green */}
          <section className="ond-mob-next">
            <span className="ond-mob-next-eyebrow">Lash artistry</span>
            <h2>Klaar om je eigen weg te vinden?</h2>
            <p>Ontdek de opleiding die past bij jouw ambitie — en word de artist die je wilt zijn.</p>
          </section>
        </div>
      </div>
    </>
  )
}
