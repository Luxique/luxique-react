'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

const CDN = 'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/render/image/public/images'

export default function BeforeAfter() {
  const t = useTranslations('BeforeAfter')

  const BA_PAIRS = [
    { name: t('set1Label'), before: `${CDN}/ba-wispy-before.webp?width=1500&quality=75`, after: `${CDN}/ba-wispy-after.webp?width=1500&quality=75` },
    { name: t('set2Label'), before: `${CDN}/ba-medusa-before.webp?width=1500&quality=75`, after: `${CDN}/ba-medusa-after.webp?width=1500&quality=75` },
  ]
  useEffect(() => {
    document.querySelectorAll('[data-ba]').forEach(ba => {
      const after = ba.querySelector('.after-img') as HTMLImageElement
      const handle = ba.querySelector('.handle') as HTMLDivElement
      const name = ba.querySelector('.name') as HTMLDivElement
      let dragging = false

      function set(clientX: number) {
        const r = ba.getBoundingClientRect()
        let pct = ((clientX - r.left) / r.width) * 100
        pct = Math.max(4, Math.min(96, pct))
        after.style.clipPath = 'inset(0 0 0 ' + pct + '%)'
        handle.style.left = pct + '%'
        name.style.left = pct + '%'
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
        .ba-section .ba .handle{position:absolute;top:0;bottom:0;left:50%;width:2px;background:rgba(251,248,242,.92);transform:translateX(-1px);pointer-events:none;box-shadow:0 0 14px rgba(0,0,0,.4)}
        .ba-section .ba .tag{position:absolute;z-index:3;font-size:.66rem;letter-spacing:.16em;text-transform:uppercase;font-weight:600;padding:6px 13px;border-radius:100px;background:rgba(28,24,20,.55);color:#fff;backdrop-filter:blur(4px)}
        .ba-section .ba .tag.before{top:14px;left:14px}
        .ba-section .ba .tag.after{top:14px;right:14px;background:#B08D4F;color:#0e0b09}
        .ba-section .ba .name{position:absolute;z-index:4;bottom:18px;left:50%;transform:translateX(-50%);display:inline-flex;align-items:center;gap:9px;background:rgba(251,248,242,.95);color:#1C1814;font-size:.84rem;font-weight:500;padding:9px 16px;border-radius:100px;letter-spacing:.02em;white-space:nowrap;box-shadow:0 6px 22px rgba(0,0,0,.28);cursor:ew-resize;border:1px solid rgba(176,141,79,.25)}
        .ba-section .ba .name .arrows{display:inline-flex;color:#B08D4F}
        .ba-section .ba .name .arrows svg{width:15px;height:15px}
        .ba-section .ba .name::before{content:"";position:absolute;left:50%;top:-14px;transform:translateX(-50%);width:2px;height:14px;background:rgba(251,248,242,.92)}
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
              <span className="eyebrow">{t('eyebrow')}</span>
              <h2 className="serif">{t('title')}</h2>
              <p>{t('description')}</p>
              <p>{t('instruction')}</p>
              <span className="hint">{t('dragHint')}</span>
            </div>
            <div className="ba-pair reveal">
              {BA_PAIRS.map((pair) => (
                <div key={pair.name} className="ba" data-ba>
                  <img className="before-img" src={pair.before} alt="" />
                  <img className="after-img" src={pair.after} alt="" />
                  <span className="tag before">{t('beforeLabel')}</span><span className="tag after">{t('afterLabel')}</span>
                  <div className="handle"></div>
                  <div className="name" data-grip>
                    <span className="arrows"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 7l-4 5 4 5M15 7l4 5-4 5"/></svg></span>
                    {pair.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
