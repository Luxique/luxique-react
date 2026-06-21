'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'

export default function FAQ() {
  const t = useTranslations('FAQ')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (!list) return

    const items = list.querySelectorAll('.faq-item')

    items.forEach(item => {
      const q = item.querySelector('.q') as HTMLButtonElement
      const a = item.querySelector('.a') as HTMLDivElement

      // Set initial open state
      if (item.classList.contains('open')) {
        a.style.maxHeight = a.scrollHeight + 'px'
      }

      q.addEventListener('click', () => {
        const isOpen = item.classList.contains('open')

        // Close all
        items.forEach(o => {
          o.classList.remove('open')
          const oa = o.querySelector('.a') as HTMLDivElement
          oa.style.maxHeight = ''
        })

        // Open clicked (if it was closed)
        if (!isOpen) {
          item.classList.add('open')
          a.style.maxHeight = a.scrollHeight + 'px'
        }
      })
    })
  }, [])

  const faqs = [
    { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') },
    { q: t('q3'), a: t('a3') },
    { q: t('q4'), a: t('a4') },
    { q: t('q5'), a: t('a5') },
    { q: t('q6'), a: t('a6') },
    { q: t('q7'), a: t('a7') },
    { q: t('q8'), a: t('a8') },
    { q: t('q9'), a: t('a9') },
  ]

  return (
    <>
      <style>{`
        .faq-dark{
          position:relative;
          background:
            radial-gradient(120% 80% at 50% -10%, rgba(176,141,79,.18), transparent 55%),
            radial-gradient(90% 60% at 50% 120%, rgba(176,141,79,.1), transparent 60%),
            linear-gradient(180deg,#0b0908, #120d0a 40%, #0b0908);
          padding:104px 0 120px;
          overflow:hidden;
        }
        .faq-dark::before{
          content:"";position:absolute;top:0;left:50%;transform:translateX(-50%);
          width:min(760px,82%);height:1px;
          background:linear-gradient(90deg,transparent,rgba(216,185,122,.45),transparent);
        }
        .faq-dark .wrap{max-width:1180px;margin:0 auto;padding:0 28px}
        .faq-dark .head{text-align:center;margin-bottom:58px;position:relative}
        .faq-dark .eyebrow{
          display:inline-flex;align-items:center;gap:10px;margin-bottom:20px;
          font-size:.74rem;text-transform:uppercase;letter-spacing:.26em;
          color:#D8B97A;font-weight:500;
        }
        .faq-dark .eyebrow::before,.faq-dark .eyebrow::after{
          content:"";width:26px;height:1px;
          background:linear-gradient(90deg,transparent,#B08D4F);
        }
        .faq-dark .eyebrow::after{background:linear-gradient(90deg,#B08D4F,transparent)}
        .faq-dark h2{
          font-family:'Cormorant Garamond',serif;font-weight:500;
          font-size:clamp(2.7rem,5.2vw,4.4rem);line-height:1;
          color:#F6F1E7;letter-spacing:.01em;
        }
        .faq-dark h2 em{font-style:italic;color:#D8B97A}
        .faq-dark .head p{margin-top:16px;color:rgba(246,241,231,.6);font-size:1rem}

        .faq-list{max-width:780px;margin:0 auto;display:flex;flex-direction:column;gap:13px}
        .faq-item{
          position:relative;
          background:linear-gradient(180deg, rgba(246,241,231,.045), rgba(246,241,231,.02));
          border:1px solid rgba(246,241,231,.1);
          border-radius:18px;overflow:hidden;
          transition:border-color .4s, box-shadow .4s, background .4s;
          backdrop-filter:blur(2px);
        }
        .faq-item:hover{border-color:rgba(216,185,122,.28)}
        .faq-item.open{
          border-color:rgba(216,185,122,.5);
          background:linear-gradient(180deg, rgba(176,141,79,.1), rgba(246,241,231,.02));
          box-shadow:0 20px 50px -24px rgba(176,141,79,.5), inset 0 1px 0 rgba(246,241,231,.06);
        }
        .faq-item.open::before{
          content:"";position:absolute;top:14px;bottom:14px;left:0;width:2px;border-radius:2px;
          background:linear-gradient(180deg,#D8B97A,#B08D4F);box-shadow:0 0 12px rgba(216,185,122,.6);
        }

        .faq-item .q{
          width:100%;display:flex;align-items:center;gap:18px;
          padding:24px 28px;cursor:pointer;background:none;border:0;text-align:left;
          font-family:'Jost',sans-serif;font-size:1.08rem;font-weight:400;color:#F6F1E7;
          transition:color .3s;
        }
        .faq-item .num{
          font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1.15rem;
          color:#B08D4F;min-width:30px;transition:color .3s;
        }
        .faq-item.open .num{color:#D8B97A}
        .faq-item .q-text{flex:1}
        .faq-item.open .q,.faq-item .q:hover{color:#D8B97A}
        .faq-item .ic{
          flex-shrink:0;width:30px;height:30px;position:relative;
          border:1px solid rgba(216,185,122,.3);border-radius:50%;
          transition:border-color .35s,background .35s;
        }
        .faq-item.open .ic{border-color:rgba(216,185,122,.6);background:rgba(216,185,122,.12)}
        .faq-item .ic::before,.faq-item .ic::after{
          content:"";position:absolute;top:50%;left:50%;width:11px;height:1.5px;
          background:#D8B97A;transform:translate(-50%,-50%);
          transition:transform .4s cubic-bezier(.16,1,.3,1);
        }
        .faq-item .ic::after{transform:translate(-50%,-50%) rotate(90deg)}
        .faq-item.open .ic::after{transform:translate(-50%,-50%) rotate(0)}

        .faq-item .a{max-height:0;overflow:hidden;transition:max-height .45s cubic-bezier(.16,1,.3,1)}
        .faq-item .a-inner{
          padding:0 28px 26px 76px;color:rgba(246,241,231,.6);
          font-size:.99rem;line-height:1.75;max-width:64ch;
        }

        @media(max-width:860px){
          .faq-dark{padding:70px 0 84px}
          .faq-item .q{padding:19px 20px;font-size:1rem;gap:14px}
          .faq-item .num{min-width:24px;font-size:1.05rem}
          .faq-item .a-inner{padding:0 20px 22px 54px}
        }
      `}</style>

      <section id="faq" className="faq-dark">
        <div className="wrap">
          <div className="head">
            <span className="eyebrow">{t('eyebrow')}</span>
            <h2>{t('title')}</h2>
            <p>{t('subtitle')}</p>
          </div>
          <div className="faq-list" ref={listRef}>
            {faqs.map((f, i) => (
              <div key={i} className={`faq-item${i === 0 ? ' open' : ''}`}>
                <button className="q">
                  <span className="num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="q-text">{f.q}</span>
                  <span className="ic" />
                </button>
                <div className="a">
                  <div className="a-inner">{f.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
