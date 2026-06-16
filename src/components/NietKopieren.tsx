'use client'

import { useRef, useEffect } from 'react'

export default function NietKopieren() {
  const sectionRef = useRef<HTMLElement>(null)
  const photoLeftRef = useRef<HTMLDivElement>(null)
  const photoRightRef = useRef<HTMLDivElement>(null)

  // Reveal on scroll
  useEffect(() => {
    const sec = sectionRef.current
    if (!sec) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          sec.classList.add('revealed')
          io.unobserve(e.target)
        }
      })
    }, { threshold: 0.25 })
    io.observe(sec)
    return () => io.disconnect()
  }, [])

  // Parallax for photos
  useEffect(() => {
    const sec = sectionRef.current
    const pL = photoLeftRef.current
    const pR = photoRightRef.current
    if (!sec || !pL || !pR) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const RANGE = 90
    let ticking = false

    const parallax = () => {
      const r = sec.getBoundingClientRect()
      const vh = window.innerHeight
      let p = (vh - r.top) / (vh + r.height)
      p = Math.max(0, Math.min(1, p))
      const off = (p - 0.5) * RANGE * 2
      pL.style.setProperty('--py', `${-off}px`)
      pR.style.setProperty('--py', `${off}px`)
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(parallax)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    parallax()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
 className="nkc-section"
    >
      <style>{`
        .nkc-section {
          position: relative;
          display: flex;
          justify-content: center;
          overflow: hidden;
          padding: clamp(80px, 11vw, 160px) clamp(20px, 5vw, 48px);
        }
        .nkc-section::before {
          content: "";
          position: absolute;
          left: 50%; top: 8%;
          transform: translateX(-50%);
          width: min(900px, 120%);
          height: 60%;
          z-index: 0;
          background: radial-gradient(60% 60% at 50% 30%, rgba(176,141,79,.16), transparent 70%);
          pointer-events: none;
        }
        .nkc-watermark {
          position: absolute;
          left: 50%; top: 50%;
          transform: translate(-50%, -50%);
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic;
          font-weight: 500;
          font-size: clamp(12rem, 28vw, 24rem);
          color: #B08D4F;
          opacity: .045;
          white-space: nowrap;
          pointer-events: none;
          user-select: none;
          z-index: 0;
        }
        .nkc-pphoto {
          position: absolute;
          left: 50%;
          z-index: 1;
          width: clamp(300px, 32vw, 456px);
          aspect-ratio: 5/7;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 30px 60px -28px rgba(28,24,20,.5), 0 0 0 1px rgba(176,141,79,.18);
          transform: translateY(var(--py, 0));
          will-change: transform;
          transition: transform .1s linear;
        }
        .nkc-pphoto img {
          width: 100%; height: 100%;
          object-fit: cover; display: block;
        }
        .nkc-pphoto::after {
          content: "";
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(243,239,231,.10), rgba(243,239,231,.04));
          pointer-events: none;
        }
        .nkc-pphoto.left { margin-left: -820px; top: 3%; }
        .nkc-pphoto.right { margin-left: 340px; bottom: 3%; }
        .nkc-photo-placeholder {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          text-align: center;
          font-family: 'Jost', system-ui, sans-serif;
          font-size: .66rem;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: rgba(255,255,255,.7);
          padding: 14px;
          background: linear-gradient(135deg, #4a4236, #6b5f4d 60%, #7d6f59);
        }

        .nkc-plaque {
          position: relative; z-index: 2;
          width: 100%; max-width: 720px;
          background:
            radial-gradient(120% 120% at 50% 0%, rgba(176,141,79,.08), transparent 55%),
            #FBF8F2;
          border: 1px solid rgba(176,141,79,.38);
          border-radius: 22px;
          padding: clamp(54px, 6vw, 88px) clamp(28px, 5vw, 72px) clamp(46px, 5vw, 72px);
          text-align: center;
          display: flex; flex-direction: column; align-items: center;
          box-shadow:
            0 40px 90px -40px rgba(28,24,20,.30),
            0 0 0 1px rgba(176,141,79,.06),
            inset 0 1px 0 rgba(255,255,255,.5);
        }
        .nkc-medallion {
          position: absolute; top: -21px; left: 50%;
          transform: translateX(-50%);
          width: 42px; height: 42px;
          border-radius: 50%;
          background: #F3EFE7;
          border: 1px solid rgba(176,141,79,.5);
          display: flex; align-items: center; justify-content: center;
          color: #B08D4F; font-size: 1rem;
          box-shadow: 0 6px 16px -6px rgba(176,141,79,.4);
        }

        .nkc-r {
          opacity: 0; transform: translateY(22px);
          transition: opacity .75s cubic-bezier(.16,1,.3,1), transform .75s cubic-bezier(.16,1,.3,1);
        }
        .nkc-section.revealed .nkc-r { opacity: 1; transform: translateY(0); }
        .nkc-section.revealed .nkc-r1 { transition-delay: .05s; }
        .nkc-section.revealed .nkc-r2 { transition-delay: .14s; }
        .nkc-section.revealed .nkc-r3 { transition-delay: .22s; }
        .nkc-section.revealed .nkc-r4 { transition-delay: .30s; }
        .nkc-section.revealed .nkc-r5 { transition-delay: .38s; }
        .nkc-section.revealed .nkc-r6 { transition-delay: .46s; }
        .nkc-section.revealed .nkc-r7 { transition-delay: .54s; }

        .nkc-eyebrow {
          display: inline-block;
          font-family: 'Jost', system-ui, sans-serif;
          font-weight: 500;
          font-size: .78rem;
          letter-spacing: .22em;
          text-transform: uppercase;
          color: #1C1814;
          border: 1px solid rgba(28,24,20,.14);
          border-radius: 999px;
          padding: .5em 1.25em;
          margin-bottom: 1.5rem;
          background: transparent;
        }
        .nkc-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 600;
          line-height: 1.0;
          letter-spacing: -.01em;
          font-size: clamp(2.8rem, 5.5vw, 4.4rem);
          margin-bottom: 1.6rem;
          color: #1C1814;
        }
        .nkc-title .crea {
          display: block;
          font-style: italic;
          font-weight: 500;
          color: #B08D4F;
          font-size: .92em;
          margin-top: .04em;
        }
        .nkc-lead {
          font-size: 1.15rem;
          color: #4A433B;
          max-width: 48ch;
          margin-bottom: 1.15rem;
          line-height: 1.65;
        }
        .nkc-lead em { font-style: italic; color: #1C1814; }
        .nkc-body {
          font-size: 1.075rem;
          color: #4A433B;
          max-width: 48ch;
          margin-bottom: 1.15rem;
          line-height: 1.65;
        }
        .nkc-body em { font-style: italic; color: #1C1814; }
        .nkc-pullquote {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic;
          font-weight: 500;
          font-size: clamp(1.5rem, 2.8vw, 2.05rem);
          line-height: 1.3;
          color: #1C1814;
          max-width: 24ch;
          margin: 1.4rem 0 1.6rem;
          position: relative;
        }
        .nkc-pullquote .g { color: #B08D4F; }
        .nkc-pullquote::after {
          content: "";
          display: block;
          width: 34px; height: 2px;
          background: #B08D4F;
          margin: 1.05rem auto;
          opacity: .7;
        }
        .nkc-cta {
          display: inline-flex;
          align-items: center;
          gap: .6rem;
          font-family: 'Jost', system-ui, sans-serif;
          font-weight: 500;
          font-size: .98rem;
          letter-spacing: .01em;
          background: #B08D4F;
          color: #1A1611;
          border: none;
          border-radius: 999px;
          padding: .95em 1.9em;
          cursor: pointer;
          text-decoration: none;
          box-shadow: 0 12px 30px -10px rgba(176,141,79,.4);
          transition: transform .15s, background .2s;
          margin-top: .4rem;
        }
        .nkc-cta:hover { background: #C9A86A; transform: translateY(-1px); }
        .nkc-cta .arr { transition: transform .2s; }
        .nkc-cta:hover .arr { transform: translateX(4px); }
        .nkc-signature {
          margin-top: 2.1rem;
          display: flex; flex-direction: column;
          align-items: center; gap: .1rem;
        }
        .nkc-signature .name {
          font-family: 'Pinyon Script', cursive;
          font-size: 2.5rem;
          color: #1C1814;
          line-height: 1;
        }
        .nkc-signature .role {
          font-family: 'Jost', system-ui, sans-serif;
          font-weight: 400;
          font-size: .72rem;
          letter-spacing: .16em;
          text-transform: uppercase;
          color: #7A7167;
        }

        @media (max-width: 900px) {
          .nkc-pphoto { display: none; }
          .nkc-title { font-size: clamp(2.5rem, 12vw, 3.4rem); }
          .nkc-pullquote { font-size: clamp(1.4rem, 7vw, 1.8rem); }
          .nkc-signature .name { font-size: 2.2rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nkc-r { transition: none; }
          .nkc-pphoto { transition: none; }
        }
      `}</style>

      <div className="nkc-watermark" aria-hidden="true">Creëren</div>

      <div className="nkc-pphoto left" ref={photoLeftRef}>
        <img src="https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/creeeren-right.jpg" alt="Close-up wispy set" />
      </div>
      <div className="nkc-pphoto right" ref={photoRightRef}>
        <img src="https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/creeeren-left.jpg" alt="Chiva aan het werk" />
      </div>

      <div className="nkc-plaque">
        <div className="nkc-medallion" aria-hidden="true">✦</div>
        <span className="nkc-eyebrow nkc-r nkc-r1">Onze filosofie</span>
        <h2 className="nkc-title nkc-r nkc-r2">
          Niet kopiëren.
          <span className="crea">Creëren.</span>
        </h2>
        <p className="nkc-lead nkc-r nkc-r3">
          In een markt waar Russian volume de standaard was, koos ik voor wispy — lichter, natuurlijker, meer <em>&ldquo;me&rdquo;</em>. Mensen snapten het niet altijd in het begin. Maar ik bleef consistent, en nu is wispy één van de meest gevraagde styles.
        </p>
        <p className="nkc-body nkc-r nkc-r4">
          LXQ Academy is onze manier om alles door te geven wat wij hebben geleerd. Niet alleen de techniek, maar het denken als een artist. Mijn aanpak is eenvoudig: <em>begin met het waarom, niet met het hoe.</em>
        </p>
        <div className="nkc-pullquote nkc-r nkc-r5">
          Geen standaard maps.<br />
          <span className="g">Customized only.</span>
        </div>
        <p className="nkc-body nkc-r nkc-r6">
          Elke oogvorm is anders en verdient een unieke aanpak. Wij leren je kijken naar het oog, begrijpen wat nodig is, en een set ontwerpen die écht bij de persoon past.
        </p>
        <a className="nkc-cta nkc-r nkc-r6" href="/about">
          Lees mijn verhaal <span className="arr">→</span>
        </a>
        <div className="nkc-signature nkc-r nkc-r7">
          <span className="name">Chiva</span>
          <span className="role">Oprichter &amp; Lash Artist</span>
        </div>
      </div>
    </section>
  )
}
