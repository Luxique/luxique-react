'use client'

import { useEffect, useRef } from 'react'

export default function AcademyHomeSection() {
  const secRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const sec = secRef.current
    if (!sec) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      sec.classList.add('revealed')
      return
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          sec.classList.add('revealed')
          io.unobserve(e.target)
        }
      })
    }, { threshold: 0.15 })
    io.observe(sec)
    return () => io.disconnect()
  }, [])

  return (
    <section ref={secRef} className="acad-section">
      <style>{`
        .acad-section {
          max-width: 1200px;
          margin-inline: auto;
          padding: clamp(72px, 10vw, 128px) clamp(24px, 5vw, 56px);
        }
        .acad-head {
          text-align: center;
          max-width: 720px;
          margin: 0 auto clamp(40px, 5vw, 64px);
        }
        .acad-eyebrow {
          display: inline-block;
          font-family: 'Jost', system-ui, sans-serif;
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
        .acad-head h2 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 600;
          letter-spacing: -.01em;
          font-size: clamp(2.3rem, 4.8vw, 3.8rem);
          line-height: 1.04;
          color: #F6F1E7;
          margin: 0;
        }
        .acad-head p {
          color: rgba(246,241,231,.72);
          font-size: clamp(1.05rem, 1.5vw, 1.2rem);
          margin-top: .9rem;
        }
        .acad-pillars {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(22px, 2.6vw, 34px);
          align-items: stretch;
        }
        .acad-card {
          position: relative;
          display: flex;
          flex-direction: column;
          border-radius: 22px;
          padding: clamp(30px, 3vw, 46px) clamp(26px, 2.6vw, 40px) clamp(28px, 2.8vw, 40px);
          transition: transform .38s cubic-bezier(.16,1,.3,1), box-shadow .38s;
        }
        .acad-card:hover { transform: translateY(-6px); }

        /* DARK kaart */
        .acad-card.dark {
          color: #F6F1E7;
          background:
            radial-gradient(120% 70% at 50% 0%, rgba(224,192,120,.14), transparent 55%),
            linear-gradient(165deg, #2c2722, #15110e);
          border: 1px solid rgba(176,141,79,.42);
          box-shadow: 0 0 46px -16px rgba(224,192,120,.16),
            0 40px 80px -42px rgba(0,0,0,.7),
            inset 0 0 80px -18px rgba(224,192,120,.16),
            inset 0 1px 0 rgba(255,255,255,.05);
        }
        /* GOLD kaart */
        .acad-card.gold {
          color: #1C1814;
          background: linear-gradient(158deg, #E6D2A0 0%, #CDAE73 46%, #B68E50 100%);
          border: 1px solid rgba(255,255,255,.4);
          box-shadow: 0 48px 96px -34px rgba(0,0,0,.72),
            0 0 70px -18px rgba(0,0,0,.45),
            inset 0 1px 0 rgba(255,255,255,.55),
            inset 0 -34px 60px -24px rgba(60,42,16,.4);
        }
        .acad-badge {
          position: absolute; top: 18px; right: 18px;
          font-family: 'Jost', system-ui, sans-serif;
          font-weight: 600;
          font-size: .66rem;
          letter-spacing: .14em;
          text-transform: uppercase;
          padding: .5em 1em;
          border-radius: 999px;
          background: #1C1814;
          color: #D8B97A;
          box-shadow: 0 8px 20px -8px rgba(0,0,0,.5);
        }
        .acad-ico-badge {
          width: 54px; height: 54px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 1.4rem;
        }
        .acad-card.dark .acad-ico-badge {
          background: radial-gradient(circle at 50% 30%, rgba(224,192,120,.24), rgba(224,192,120,.05));
          border: 1px solid rgba(176,141,79,.5);
          color: #D8B97A;
          box-shadow: 0 8px 22px -8px rgba(224,192,120,.45);
        }
        .acad-card.gold .acad-ico-badge {
          background: linear-gradient(165deg, #2a2722, #15110e);
          border: 1px solid rgba(28,24,20,.4);
          color: #D8B97A;
          box-shadow: 0 10px 24px -8px rgba(0,0,0,.5);
        }
        .acad-ico { width: 26px; height: 26px; }
        .acad-card h3 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 600;
          font-size: clamp(1.7rem, 2.4vw, 2.15rem);
          line-height: 1.1;
          margin-bottom: .55rem;
        }
        .acad-card.dark h3 { color: #F6F1E7; }
        .acad-card.gold h3 { color: #1C1814; }
        .acad-desc {
          font-size: 1.05rem;
          line-height: 1.55;
          margin-bottom: 1.5rem;
        }
        .acad-card.dark .acad-desc { color: rgba(246,241,231,.72); }
        .acad-card.gold .acad-desc { color: #3a3026; }
        .acad-checks {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: .7rem;
          margin-bottom: 1.9rem;
        }
        .acad-checks li {
          display: flex;
          align-items: flex-start;
          gap: .7rem;
          font-size: 1.02rem;
        }
        .acad-card.dark .acad-checks li { color: #F6F1E7; }
        .acad-card.gold .acad-checks li { color: #1C1814; }
        .acad-ck {
          flex: 0 0 auto;
          width: 20px; height: 20px;
          border-radius: 50%;
          margin-top: 1px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: .7rem;
        }
        .acad-card.dark .acad-ck {
          background: rgba(224,192,120,.14);
          border: 1px solid rgba(176,141,79,.5);
          color: #D8B97A;
        }
        .acad-card.gold .acad-ck {
          background: #1C1814;
          border: 1px solid #1C1814;
          color: #D8B97A;
        }
        .acad-cta {
          margin-top: auto;
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: .55rem;
          font-family: 'Jost', system-ui, sans-serif;
          font-weight: 500;
          font-size: .98rem;
          border-radius: 999px;
          padding: .85em 1.7em;
          text-decoration: none;
          transition: transform .15s, background .2s;
        }
        .acad-cta .arr { transition: transform .2s; }
        .acad-cta:hover .arr { transform: translateX(4px); }
        .acad-cta:hover { transform: translateY(-1px); }
        .acad-card.gold .acad-cta {
          background: #FBF8F2;
          color: #1C1814;
          box-shadow: 0 14px 30px -12px rgba(0,0,0,.45);
        }
        .acad-card.gold .acad-cta:hover { background: #fff; }
        .acad-card.dark .acad-cta {
          background: transparent;
          color: #D8B97A;
          border: 1px solid rgba(176,141,79,.6);
        }
        .acad-card.dark .acad-cta:hover { background: rgba(224,192,120,.10); }

        /* Over-ons outline box */
        .acad-bar {
          margin-top: clamp(22px, 2.6vw, 34px);
          position: relative;
          background: transparent;
          border: 1.5px solid rgba(216,196,154,.5);
          border-radius: 22px;
          padding: clamp(30px, 3.4vw, 52px) clamp(28px, 3vw, 52px);
          display: grid;
          grid-template-columns: 1fr auto;
          gap: clamp(24px, 4vw, 56px);
          align-items: center;
        }
        .acad-bar .lbl {
          font-family: 'Jost', system-ui, sans-serif;
          font-weight: 600;
          font-size: .74rem;
          letter-spacing: .2em;
          text-transform: uppercase;
          color: #D8B97A;
          margin-bottom: .7rem;
        }
        .acad-bar h3 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 600;
          font-size: clamp(1.6rem, 2.6vw, 2.3rem);
          line-height: 1.12;
          margin-bottom: .7rem;
          color: #F6F1E7;
          max-width: 24ch;
        }
        .acad-bar p {
          color: rgba(246,241,231,.72);
          font-size: 1.05rem;
          line-height: 1.6;
          max-width: 62ch;
        }
        .acad-bar .acad-cta {
          background: transparent;
          color: #D8B97A;
          border: 1px solid rgba(176,141,79,.6);
        }
        .acad-bar .acad-cta:hover { background: rgba(224,192,120,.10); }

        /* Reveal */
        .acad-r {
          opacity: 0;
          transform: translateY(26px);
          transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1);
        }
        .acad-section.revealed .acad-r { opacity: 1; transform: translateY(0); }
        .acad-section.revealed .acad-rh { transition-delay: .02s; }
        .acad-section.revealed .acad-c1 { transition-delay: .12s; }
        .acad-section.revealed .acad-c2 { transition-delay: .22s; }
        .acad-section.revealed .acad-rb { transition-delay: .32s; }

        @media (max-width: 840px) {
          .acad-pillars { grid-template-columns: 1fr; gap: 18px; }
          .acad-bar { grid-template-columns: 1fr; gap: 18px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .acad-r { transition: none; }
          .acad-card { transition: none; }
        }
      `}</style>

      <div className="acad-head">
        <span className="acad-eyebrow acad-r acad-rh">LXQ Academy</span>
        <h2 className="acad-r acad-rh">Online Leerplatform &amp; Persoonlijk Traject</h2>
        <p className="acad-r acad-rh">Leer op jouw eigen tempo via onze videocursussen, of kies voor een persoonlijk traject bij Chiva op locatie.</p>
      </div>

      <div className="acad-pillars">
        <article className="acad-card gold acad-r acad-c1">
          <span className="acad-badge">Meest gekozen</span>
          <div className="acad-ico-badge">
            <svg className="acad-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M9.7 8.4l5 3.1-5 3.1z" fill="currentColor" stroke="none"/><path d="M8 20.5h8"/>
            </svg>
          </div>
          <h3>Online Leerplatform</h3>
          <p className="acad-desc">Videocursussen op jouw eigen tempo. Start wanneer jij wilt, leer waar je wilt.</p>
          <ul className="acad-checks">
            <li><span className="acad-ck">✓</span>Medusa cursus — beginnersniveau</li>
            <li><span className="acad-ck">✓</span>Wispy cursus — vervolgmodule</li>
            <li><span className="acad-ck">✓</span>Certificaat bij afronding</li>
            <li><span className="acad-ck">✓</span>Levenslange toegang</li>
          </ul>
          <a className="acad-cta" href="/courses">Bekijk de cursussen <span className="arr">→</span></a>
        </article>

        <article className="acad-card dark acad-r acad-c2">
          <div className="acad-ico-badge">
            <svg className="acad-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="8" r="3.2"/><path d="M3.4 19.5c0-3.3 2.5-5.5 5.6-5.5s5.6 2.2 5.6 5.5"/><path d="M16.6 5.3a3 3 0 0 1 0 5.6"/><path d="M18.7 19.5c0-2.3-.9-4-2.3-5.1"/>
            </svg>
          </div>
          <h3>Persoonlijk Traject</h3>
          <p className="acad-desc">Verspreid over meerdere dagen leer je alle kneepjes van het vak bij Chiva op locatie in Arnhem.</p>
          <ul className="acad-checks">
            <li><span className="acad-ck">✓</span>Hands-on op locatie Arnhem</li>
            <li><span className="acad-ck">✓</span>Alle materialen inbegrepen</li>
            <li><span className="acad-ck">✓</span>Volledig op maat</li>
          </ul>
          <a className="acad-cta" href="/persoonlijk-traject">Meer informatie <span className="arr">→</span></a>
        </article>
      </div>

      <div className="acad-bar acad-r acad-rb">
        <div>
          <div className="lbl">De academie</div>
          <h3>Leren denken als een artist.</h3>
          <p>LXQ Academy is onze manier om alles door te geven wat wij hebben geleerd. Niet alleen de techniek, maar het denken als een artist. Chiva heeft al vele studenten opgeleid, en haar filosofie is simpel: elke oogvorm verdient een unieke aanpak.</p>
        </div>
        <a className="acad-cta" href="/about">Lees meer <span className="arr">→</span></a>
      </div>
    </section>
  )
}
