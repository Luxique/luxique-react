'use client'

import { useEffect } from 'react'

export default function BeforeAfter() {
  useEffect(() => {
    document.querySelectorAll('[data-ba]').forEach(ba => {
      const after = ba.querySelector('.after-img') as HTMLImageElement
      const handle = ba.querySelector('.handle') as HTMLDivElement
      const grip = ba.querySelector('.grip') as HTMLDivElement
      let dragging = false

      function set(clientX: number) {
        const r = ba.getBoundingClientRect()
        let pct = ((clientX - r.left) / r.width) * 100
        pct = Math.max(0, Math.min(100, pct))
        after.style.clipPath = 'inset(0 0 0 ' + pct + '%)'
        handle.style.left = pct + '%'
        grip.style.left = pct + '%'
      }

      after.style.clipPath = 'inset(0 0 0 50%)'

      const start = (e: Event) => {
        dragging = true
        const t = (e as TouchEvent).touches
        set(t ? t[0].clientX : (e as MouseEvent).clientX)
      }
      const move = (e: Event) => {
        if (!dragging) return
        const t = (e as TouchEvent).touches
        set(t ? t[0].clientX : (e as MouseEvent).clientX)
      }
      const end = () => { dragging = false }

      ba.addEventListener('mousedown', start)
      ba.addEventListener('touchstart', start, { passive: true })
      window.addEventListener('mousemove', move)
      window.addEventListener('touchmove', move, { passive: true })
      window.addEventListener('mouseup', end)
      window.addEventListener('touchend', end)
      ba.addEventListener('click', (e: Event) => set((e as MouseEvent).clientX))
    })

    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in')
        io.unobserve(e.target)
      }
    }), { threshold: 0.15 })
    document.querySelectorAll('.ba-section .reveal').forEach(el => io.observe(el))

    return () => { io.disconnect() }
  }, [])

  const CDN = 'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images'

  return (
    <>
      <style>{`
        .ba-section{padding:96px 0;background:#FBF8F2}
        .ba-section .wrap{max-width:1180px;margin:0 auto;padding:0 28px}
        .ba-section .serif{font-family:'Cormorant Garamond',serif}
        .ba-section .eyebrow{font-size:.74rem;text-transform:uppercase;letter-spacing:.24em;color:#B08D4F;font-weight:500}
        .ba-section .ba-grid{display:grid;grid-template-columns:0.85fr 1.15fr;gap:48px;align-items:center}
        .ba-section .ba-copy .eyebrow{display:block;margin-bottom:16px}
        .ba-section .ba-copy h2{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:clamp(2.6rem,4.5vw,4rem);line-height:1.02;margin-bottom:20px}
        .ba-section .ba-copy h2 em{font-style:italic;color:#B08D4F}
        .ba-section .ba-copy p{color:#46403A;font-size:1rem;max-width:42ch;margin-bottom:14px}
        .ba-section .ba-copy .hint{display:inline-flex;align-items:center;gap:8px;margin-top:10px;font-size:.84rem;color:#B08D4F;font-weight:500}
        .ba-section .ba-pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        .ba-section .ba{position:relative;overflow:hidden;border-radius:16px;aspect-ratio:4/5;user-select:none;cursor:ew-resize;background:#ccc}
        .ba-section .ba img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none}
        .ba-section .ba .handle{position:absolute;top:0;bottom:0;left:50%;width:2px;background:rgba(251,248,242,.9);transform:translateX(-1px);pointer-events:none;box-shadow:0 0 14px rgba(0,0,0,.35)}
        .ba-section .ba .grip{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:44px;height:44px;border-radius:50%;background:rgba(251,248,242,.92);display:grid;place-items:center;pointer-events:none;box-shadow:0 6px 20px rgba(0,0,0,.3)}
        .ba-section .ba .grip svg{width:20px;height:20px;color:#B08D4F}
        .ba-section .ba .tag{position:absolute;z-index:3;font-size:.66rem;letter-spacing:.16em;text-transform:uppercase;font-weight:600;padding:6px 13px;border-radius:100px;background:rgba(28,24,20,.55);color:#fff;backdrop-filter:blur(4px)}
        .ba-section .ba .tag.before{top:14px;left:14px}
        .ba-section .ba .tag.after{top:14px;right:14px;background:#B08D4F;color:#0e0b09}
        .ba-section .ba .name{position:absolute;z-index:3;left:50%;bottom:16px;transform:translateX(-50%);background:rgba(251,248,242,.92);color:#1C1814;font-size:.82rem;font-weight:500;padding:7px 16px;border-radius:100px;letter-spacing:.02em;white-space:nowrap}
        .ba-section .reveal{opacity:0;transform:translateY(22px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
        .ba-section .reveal.in{opacity:1;transform:none}
        @media(prefers-reduced-motion:reduce){.ba-section .reveal{opacity:1;transform:none}}
        @media(max-width:860px){
          .ba-section .ba-grid{grid-template-columns:1fr;gap:30px}
          .ba-section .ba-pair{grid-template-columns:1fr;gap:18px}
          .ba-section .ba{max-width:440px;margin:0 auto;width:100%}
          .ba-section{padding:70px 0}
        }
      `}</style>

      <section className="ba-section">
        <div className="wrap">
          <div className="ba-grid">
            <div className="ba-copy reveal">
              <span className="eyebrow">Resultaten</span>
              <h2 className="serif">Before &amp; <em>After</em></h2>
              <p>Geen voor-en-na om indruk te maken, maar om te laten zien hoe een set rond jouw oog wordt gebouwd.</p>
              <p>Sleep over elke foto en zie het verschil zelf.</p>
              <span className="hint">← sleep om te onthullen →</span>
            </div>
            <div className="ba-pair reveal">
              <div className="ba" data-ba>
                <img className="before-img" src={`${CDN}/ba-wispy-before.webp`} alt="" />
                <img className="after-img" src={`${CDN}/ba-wispy-after.webp`} alt="" />
                <span className="tag before">Before</span><span className="tag after">After</span>
                <div className="handle"></div>
                <div className="grip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/></svg></div>
                <span className="name">Wispy Set</span>
              </div>
              <div className="ba" data-ba>
                <img className="before-img" src={`${CDN}/ba-medusa-before.webp`} alt="" />
                <img className="after-img" src={`${CDN}/ba-medusa-after.webp`} alt="" />
                <span className="tag before">Before</span><span className="tag after">After</span>
                <div className="handle"></div>
                <div className="grip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/></svg></div>
                <span className="name">Medusa Set</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
