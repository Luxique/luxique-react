'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import Navbar from '@/components/Navbar'

export default function PersoonlijkTrajectContent() {
  const t = useTranslations('PersoonlijkTraject')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    // reveal on scroll
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
    }), { threshold: 0.14 })
    root.querySelectorAll('.reveal').forEach(el => io.observe(el))

    // Loenique chat buttons
    const luxBtns = root.querySelectorAll('[data-loenique]')
    luxBtns.forEach(btn => {
      btn.addEventListener('click', () => window.dispatchEvent(new Event('open-loenique-chat')))
    })

    // === DAGPROGRAMMA OPEN/CLOSE WITH MOBILE REPOSITIONING ===
    const MOBILE = () => window.matchMedia('(max-width:900px)').matches

    // Remember original position of each detail block
    const detailHome = new Map<string, { parent: Node; next: Node | null }>()
    root.querySelectorAll<HTMLElement>('.detail').forEach(d => {
      detailHome.set(d.id, { parent: d.parentNode!, next: d.nextSibling })
    })

    function restoreHome(d: HTMLElement) {
      const h = detailHome.get(d.id)
      if (h && d.parentNode !== h.parent) {
        h.parent.insertBefore(d, h.next)
      }
    }

    function closeAll() {
      root!.querySelectorAll('.detail').forEach((d: Element) => {
        d.classList.remove('open')
        restoreHome(d as HTMLElement)
      })
    }

    const openBtns = root.querySelectorAll('[data-open]')
    openBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = 'd-' + (btn as HTMLElement).dataset.open
        const target = root.querySelector<HTMLElement>('#' + id)
        if (!target) return
        const wasOpen = target.classList.contains('open')
        closeAll()
        if (!wasOpen) {
          if (MOBILE()) {
            // Move detail block directly after the clicked card
            const card = (btn as HTMLElement).closest('.track')
            if (card) card.insertAdjacentElement('afterend', target)
          }
          target.classList.add('open')
          setTimeout(() => {
            const block = MOBILE() ? 'nearest' : 'start'
            const scrollTarget = MOBILE() ? (btn as HTMLElement).closest('.track') : target
            scrollTarget?.scrollIntoView({ behavior: 'smooth', block: block as ScrollIntoViewOptions['block'] })
          }, 140)
        }
      })
    })

    const closeBtns = root.querySelectorAll('[data-close]')
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const d = (btn as HTMLElement).closest('.detail') as HTMLElement
        if (!d) return
        d.classList.remove('open')
        const wasMobile = d.parentNode && (d.parentNode as HTMLElement).classList && (d.parentNode as HTMLElement).classList.contains('track')
        let anchor: Element | null = null
        if (wasMobile) {
          anchor = d.previousElementSibling
        }
        restoreHome(d)
        if (anchor) {
          anchor.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else {
          root.querySelector('.levels-intro')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
    })

    // Resize handler: close all and restore positions
    let rt: ReturnType<typeof setTimeout>
    const resizeHandler = () => {
      clearTimeout(rt)
      rt = setTimeout(closeAll, 200)
    }
    window.addEventListener('resize', resizeHandler)

    return () => {
      io.disconnect()
      window.removeEventListener('resize', resizeHandler)
    }
  }, [])

  return (
    <div ref={rootRef}>
      <Navbar />
      <style>{`
        :root{
          --bg:#F3EFE7; --panel:#FBF8F2; --ink:#1C1814; --ink-soft:#46403A;
          --gold:#B08D4F; --gold-soft:#C9A86A; --gold-bright:#D8B97A;
          --line:rgba(28,24,20,.13); --line-soft:rgba(28,24,20,.07);
          --dark2:#0e0b09; --on-dark:#F6F1E7; --on-dark-soft:rgba(246,241,231,.62);
          --green1:#2a3128; --green-deep:#141811;
          --fit:#5C6B4E; --fit-bg:rgba(92,107,78,.10); --fit-line:rgba(92,107,78,.28);
          --nofit:#9B5B47; --nofit-bg:rgba(155,91,71,.09); --nofit-line:rgba(155,91,71,.26);
        }
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{background:var(--bg);color:var(--ink);font-family:'Jost',sans-serif;font-size:1.04rem;line-height:1.6;-webkit-font-smoothing:antialiased}
        .wrap{max-width:1180px;margin:0 auto;padding:0 28px}
        .serif{font-family:'Cormorant Garamond',serif}
        .eyebrow{font-size:.74rem;text-transform:uppercase;letter-spacing:.24em;color:var(--gold);font-weight:500}
        em{font-style:italic}

        .reveal{opacity:0;transform:translateY(24px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
        .reveal.in{opacity:1;transform:none}
        @media(prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none}}

        /* ===== HERO ===== */
        .hero{position:relative;padding:140px 0 70px;text-align:center;overflow:hidden;
          background:radial-gradient(120% 80% at 50% 0%, rgba(176,141,79,.1), transparent 55%)}
        .hero .eyebrow{display:inline-flex;align-items:center;gap:10px;margin-bottom:22px}
        .hero .eyebrow::before,.hero .eyebrow::after{content:"";width:30px;height:1px;background:linear-gradient(90deg,transparent,var(--gold))}
        .hero .eyebrow::after{background:linear-gradient(90deg,var(--gold),transparent)}
        .hero h1{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:clamp(3rem,7vw,5.6rem);line-height:.98;letter-spacing:.01em;margin-bottom:24px}
        .hero h1 em{color:var(--gold)}
        .hero p{max-width:62ch;margin:0 auto;color:var(--ink-soft);font-size:1.1rem}
        .hero .scroll-cue{margin-top:46px;font-size:.78rem;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);opacity:.8}

        /* ===== WORKSHOP ===== */
        .start{padding:40px 0 20px}
        .start-card{position:relative;display:grid;grid-template-columns:1.15fr 1fr;gap:0;
          background:linear-gradient(180deg,#221d16,var(--dark2));border:1px solid rgba(216,185,122,.34);
          border-radius:24px;overflow:hidden;color:var(--on-dark)}
        .start-l{padding:46px 44px 44px}
        .start-tag{display:inline-flex;align-items:center;gap:9px;font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;
          color:var(--dark2);background:var(--gold-bright);padding:7px 15px;border-radius:100px;font-weight:600;margin-bottom:20px}
        .start-l h2{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:clamp(2rem,3.6vw,2.8rem);line-height:1.04;margin-bottom:14px}
        .start-l h2 em{color:var(--gold-bright)}
        .start-l p{color:var(--on-dark-soft);font-size:.98rem;margin-bottom:14px}
        .start-l .micro{font-size:.84rem;color:var(--on-dark-soft);font-style:italic;border-left:2px solid rgba(216,185,122,.4);padding-left:14px;margin-bottom:26px}
        .start-meta{display:flex;gap:26px;margin-bottom:28px;flex-wrap:wrap}
        .start-meta .m{display:flex;flex-direction:column;gap:2px}
        .start-meta .m .k{font-size:.68rem;letter-spacing:.16em;text-transform:uppercase;color:var(--gold-bright)}
        .start-meta .m .v{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:600}
        .start-r{position:relative;background:rgba(246,241,231,.04);border-left:1px solid rgba(246,241,231,.1);
          padding:46px 40px;display:flex;flex-direction:column;justify-content:center}
        .start-r h3{font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--gold-bright);margin-bottom:16px;font-weight:600}
        .start-r ul{list-style:none;display:flex;flex-direction:column;gap:10px}
        .start-r li{position:relative;padding-left:22px;font-size:.92rem;color:var(--on-dark-soft)}
        .start-r li::before{content:"";position:absolute;left:0;top:8px;width:6px;height:6px;border-radius:50%;background:var(--gold-bright)}
        .start-btns{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px}

        /* ===== NIVEAU-INTRO ===== */
        .levels-intro{padding:64px 0 10px;text-align:center}
        .levels-intro h2{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:clamp(1.9rem,3.6vw,2.8rem);line-height:1.1;margin-bottom:16px}
        .levels-intro h2 em{color:var(--gold)}
        .levels-intro p{max-width:64ch;margin:0 auto;color:var(--ink-soft)}

        /* ===== NIVEAU-BLOK ===== */
        .level{padding:20px 0 6px}

        /* journey timeline */
        .journey{position:relative;margin:0 auto 14px;max-width:1180px;padding:0}
        .journey-track{position:relative;height:54px}
        .journey-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
        .journey-dots{position:absolute;inset:0;display:grid;grid-template-columns:repeat(4,1fr);gap:18px;align-items:center}
        .journey-dots .cell{display:flex;justify-content:center;align-items:center}
        .journey-dot{width:13px;height:13px;border-radius:50%;background:var(--gold);
          box-shadow:0 0 0 5px var(--bg),0 0 0 6px rgba(196,162,101,.32),0 0 14px rgba(196,162,101,.5);position:relative;z-index:2}
        .journey-dot.last{width:16px;height:16px;background:var(--gold-bright);
          box-shadow:0 0 0 5px var(--bg),0 0 0 7px rgba(216,185,122,.5),0 0 20px rgba(216,185,122,.7)}
        .journey-cap{position:absolute;top:-2px;font-size:.64rem;letter-spacing:.16em;text-transform:uppercase;
          font-weight:600;color:var(--gold)}
        .journey-cap.start{left:2px}
        .journey-cap.end{right:2px;color:var(--gold-bright);text-align:right}
        .journey-cap .ar{font-style:normal}

        /* ===== TRAJECT-KAARTEN ===== */
        .tracks-grid{display:grid;gap:18px;align-items:stretch}
        .tracks-grid.four{grid-template-columns:repeat(4,1fr)}
        .track{position:relative;display:flex;flex-direction:column;background:var(--panel);border:1px solid var(--line);
          border-radius:20px;padding:30px 24px 26px;transition:transform .5s cubic-bezier(.16,1,.3,1),box-shadow .5s,border-color .5s;
          box-shadow:
            inset 0 1px 28px -10px rgba(196,162,101,.30),
            inset 0 18px 50px -34px rgba(196,162,101,.40),
            0 14px 36px -28px rgba(28,24,20,.30)}
        .track::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;
          background:radial-gradient(46% 30% at 50% 0%, rgba(216,185,122,.16), transparent 72%)}
        .track:hover{transform:translateY(-6px);border-color:rgba(176,141,79,.4);
          box-shadow:
            inset 0 1px 30px -8px rgba(196,162,101,.40),
            inset 0 18px 54px -30px rgba(196,162,101,.50),
            0 30px 60px -34px rgba(28,24,20,.42)}
        .track.feat{box-shadow:
            inset 0 2px 34px -6px rgba(228,201,138,.42),
            inset 0 14px 60px -22px rgba(196,162,101,.52),
            0 20px 50px -30px rgba(0,0,0,.5)}
        .track.feat::after{background:radial-gradient(42% 28% at 48% 0%, rgba(255,243,214,.30), transparent 70%);mix-blend-mode:screen}
        .track.feat:hover{box-shadow:
            inset 0 2px 36px -4px rgba(228,201,138,.55),
            inset 0 14px 64px -20px rgba(196,162,101,.62),
            0 30px 60px -30px rgba(0,0,0,.55)}
        .track.feat{background:linear-gradient(180deg,#221d16,var(--dark2));border-color:rgba(216,185,122,.4);color:var(--on-dark)}
        .track.feat .t-sub{color:var(--on-dark-soft)}
        .track.feat .incl li{color:var(--on-dark-soft)}
        .badge{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--gold);color:var(--dark2);
          font-size:.62rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;padding:6px 14px;border-radius:100px;white-space:nowrap;z-index:2}
        .lvl-tag{display:inline-flex;align-items:center;gap:8px;font-size:.64rem;letter-spacing:.16em;text-transform:uppercase;
          font-weight:600;color:var(--gold);margin-bottom:14px}
        .track.feat .lvl-tag{color:var(--gold-bright)}
        .lvl-tag .dot{display:flex;gap:3px}
        .lvl-tag .dot i{width:6px;height:6px;border-radius:50%;background:var(--gold);display:block;opacity:.28}
        .track.feat .lvl-tag .dot i{background:var(--gold-bright)}
        .lvl-tag.l1 .dot i:nth-child(1){opacity:1}
        .lvl-tag.l2 .dot i:nth-child(1),.lvl-tag.l2 .dot i:nth-child(2){opacity:1}
        .lvl-tag.l3 .dot i{opacity:1}
        .t-dur{font-size:.66rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);font-weight:500;margin-bottom:10px}
        .track.feat .t-dur{color:var(--on-dark-soft)}
        .t-name{font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:600;line-height:1.06;margin-bottom:6px}
        .t-sub{font-size:.86rem;color:var(--ink-soft);margin-bottom:18px;min-height:3.4em;line-height:1.45}
        .t-price{display:flex;align-items:baseline;gap:7px;margin-bottom:3px;flex-wrap:wrap}
        .t-price .amt{font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:600;color:var(--gold)}
        .track.feat .t-price .amt{color:var(--gold-bright)}
        .t-price .vat{font-size:.78rem;color:var(--ink-soft)}
        .track.feat .t-price .vat{color:var(--on-dark-soft)}
        .t-incl-vat{font-size:.76rem;color:var(--ink-soft);margin-bottom:18px}
        .track.feat .t-incl-vat{color:var(--on-dark-soft)}

        .fitbox{border-radius:12px;overflow:hidden;border:1px solid var(--line);margin-bottom:18px}
        .fit,.nofit{padding:11px 13px;display:flex;gap:9px;align-items:flex-start;font-size:.78rem;line-height:1.4}
        .fit{background:var(--fit-bg);color:var(--ink)}
        .nofit{background:var(--nofit-bg);color:var(--ink);border-top:1px solid var(--line-soft)}
        .track.feat .fit{color:var(--on-dark)}
        .track.feat .nofit{color:var(--on-dark)}
        .fit-ic{flex-shrink:0;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-top:1px}
        .fit .fit-ic{background:var(--fit-line)}
        .nofit .fit-ic{background:var(--nofit-line)}
        .fit-ic svg{width:10px;height:10px;display:block}
        .fit b,.nofit b{font-weight:600}
        .fit .lab,.nofit .lab{display:block;font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;font-weight:600;margin-bottom:2px}
        .fit .lab{color:var(--fit)}
        .nofit .lab{color:var(--nofit)}

        .incl{list-style:none;display:flex;flex-direction:column;gap:7px;margin-bottom:22px;flex:1}
        .incl li{position:relative;padding-left:22px;font-size:.82rem;color:var(--ink-soft);line-height:1.4}
        .incl li::before{content:"";position:absolute;left:0;top:6px;width:13px;height:13px;border-radius:50%;
          background:rgba(176,141,79,.16);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23B08D4F' stroke-width='3'%3E%3Cpath d='M5 12l4 4L19 7'/%3E%3C/svg%3E");background-size:8px;background-repeat:no-repeat;background-position:center}
        .btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:13px 18px;border-radius:100px;
          background:var(--ink);color:var(--panel);font-size:.86rem;font-weight:500;letter-spacing:.02em;text-decoration:none;
          border:0;cursor:pointer;transition:background .3s,transform .3s}
        .btn:hover{transform:translateY(-2px)}
        .track.feat .btn{background:var(--gold);color:var(--dark2)}
        .btn.ghost{background:transparent;color:var(--ink);border:1px solid var(--line)}
        .track.feat .btn.ghost{color:var(--on-dark);border-color:rgba(246,241,231,.3)}
        .start-btns .btn{width:auto}
        .start-btns .btn.ghost{color:var(--on-dark);border-color:rgba(246,241,231,.3)}

        /* ===== DAGPROGRAMMA ===== */
        .detail{background:var(--dark2);color:var(--on-dark);overflow:hidden;display:grid;grid-template-rows:0fr;transition:grid-template-rows .6s cubic-bezier(.16,1,.3,1)}
        .detail.open{grid-template-rows:1fr}
        .detail-inner{padding:80px 0 90px;position:relative;overflow:hidden;
          background:radial-gradient(110% 70% at 50% 0%, rgba(176,141,79,.12), transparent 55%)}
        .detail .eyebrow{color:var(--gold-bright)}
        .detail h3{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:clamp(2.2rem,4.5vw,3.4rem);line-height:1;margin:14px 0 10px}
        .detail .dlead{color:var(--on-dark-soft);max-width:62ch;margin-bottom:30px}
        .req{display:flex;gap:12px;align-items:flex-start;background:rgba(216,185,122,.08);border:1px solid rgba(216,185,122,.26);
          border-radius:14px;padding:16px 20px;margin-bottom:42px;max-width:760px}
        .req svg{flex-shrink:0;width:20px;height:20px;margin-top:2px}
        .req .rt{font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold-bright);font-weight:600;margin-bottom:4px}
        .req p{color:var(--on-dark-soft);font-size:.9rem;margin:0}
        .days{display:flex;flex-direction:column;gap:18px;margin-bottom:46px}
        .day{background:rgba(246,241,231,.04);border:1px solid rgba(246,241,231,.1);border-radius:18px;padding:28px 30px;
          transition:border-color .4s,background .4s}
        .day:hover{border-color:rgba(216,185,122,.32);background:rgba(246,241,231,.055)}
        .day-h{display:flex;align-items:baseline;gap:16px;margin-bottom:8px}
        .day-num{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1.3rem;color:var(--gold-bright);white-space:nowrap}
        .day-t{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:500}
        .day-d{color:var(--on-dark-soft);font-size:.94rem;margin-bottom:16px}
        .day-cols{display:grid;grid-template-columns:1fr 1fr;gap:28px}
        .day-cols.one{grid-template-columns:1fr}
        .col-h{font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin-bottom:12px;font-weight:600}
        .col ul{list-style:none;display:flex;flex-direction:column;gap:7px}
        .col li{position:relative;padding-left:18px;font-size:.9rem;color:var(--on-dark-soft);line-height:1.5}
        .col li::before{content:"";position:absolute;left:0;top:9px;width:5px;height:5px;border-radius:50%;background:var(--gold)}
        .incl-block{display:grid;grid-template-columns:1.3fr 1fr;gap:30px;align-items:start;
          background:rgba(246,241,231,.04);border:1px solid rgba(246,241,231,.1);border-radius:18px;padding:30px 34px;margin-bottom:30px}
        .incl-block h4{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:500;margin-bottom:14px}
        .incl-grid{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:9px}
        .incl-grid li{position:relative;padding-left:24px;font-size:.9rem;color:var(--on-dark-soft)}
        .incl-grid li::before{content:"✓";position:absolute;left:0;color:var(--gold-bright);font-weight:700}
        .invest{display:flex;flex-direction:column;justify-content:center;background:rgba(176,141,79,.1);border:1px solid rgba(216,185,122,.3);border-radius:16px;padding:24px}
        .invest .lab{font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--gold-bright);margin-bottom:8px}
        .invest .amt{font-family:'Cormorant Garamond',serif;font-size:2.4rem;font-weight:600;color:var(--on-dark);line-height:1}
        .invest .vat{font-size:.84rem;color:var(--on-dark-soft);margin-top:4px}
        .invest .pay{font-size:.82rem;color:var(--on-dark-soft);margin-top:12px;line-height:1.5}
        .not-incl{font-size:.86rem;color:var(--on-dark-soft);font-style:italic;margin-bottom:24px;padding-left:18px;border-left:2px solid rgba(216,185,122,.4)}
        .detail .btn-row{display:flex;gap:14px;flex-wrap:wrap}
        .detail .btn{width:auto;padding:15px 32px}
        .detail .btn.ghost{color:var(--on-dark);border-color:rgba(246,241,231,.3)}
        .close-d{display:inline-flex;align-items:center;gap:8px;background:none;border:0;color:var(--gold-bright);cursor:pointer;font-family:'Jost';font-size:.86rem;margin-top:24px;letter-spacing:.02em}
        .aanvraag-note{margin-top:18px;font-size:.86rem;color:var(--on-dark-soft);font-style:italic}
        .aanvraag-note a{color:var(--gold-bright)}

        /* ===== COMBINATIE-CTA ===== */
        .combo{padding:30px 0 10px}
        .combo-card{position:relative;background:var(--panel);border:1px solid var(--line);border-radius:20px;
          padding:38px 44px;display:flex;align-items:center;justify-content:space-between;gap:30px;overflow:hidden}
        .combo-card::before{content:"";position:absolute;inset:0;
          background:radial-gradient(80% 120% at 100% 0%, rgba(176,141,79,.12), transparent 60%);pointer-events:none}
        .combo-l{position:relative;max-width:62%}
        .combo-l .eyebrow{display:block;margin-bottom:10px}
        .combo-l h3{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:clamp(1.5rem,2.6vw,2.1rem);line-height:1.12;margin-bottom:10px}
        .combo-l h3 em{color:var(--gold)}
        .combo-l p{color:var(--ink-soft);font-size:.95rem;margin:0}
        .combo-r{position:relative;display:flex;flex-direction:column;gap:10px;flex-shrink:0}
        .combo-r .btn{width:auto;padding:14px 28px;white-space:nowrap}

        /* ===== DISCLAIMER ===== */
        .disclaimer{padding:70px 0 20px}
        .disc-card{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:40px 44px;max-width:900px;margin:0 auto}
        .disc-card .eyebrow{margin-bottom:14px;display:block}
        .disc-card h2{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:clamp(1.7rem,3vw,2.3rem);margin-bottom:18px;line-height:1.1}
        .disc-card p{color:var(--ink-soft);font-size:.96rem;margin-bottom:14px}
        .disc-card p:last-child{margin-bottom:0}
        .disc-card b{color:var(--ink);font-weight:600}

        /* ===== CTA ===== */
        .cta{margin-top:70px;padding:110px 0;text-align:center;background:linear-gradient(160deg,var(--green1),var(--green-deep));color:var(--on-dark)}
        .cta h2{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:clamp(2.4rem,5vw,3.8rem);line-height:1.05;margin-bottom:18px}
        .cta h2 em{color:var(--gold-bright)}
        .cta p{color:var(--on-dark-soft);max-width:54ch;margin:0 auto 32px}
        .cta .btn{background:var(--gold);color:var(--dark2);width:auto;display:inline-flex;padding:16px 38px}
        .cta-btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
        .btn.ghost-light{background:transparent;color:var(--on-dark);border:1px solid rgba(246,241,231,.32);width:auto;padding:16px 32px}
        [data-loenique]{cursor:pointer}

        @media(max-width:1080px){
          .tracks-grid.four{grid-template-columns:repeat(2,1fr);gap:20px;max-width:680px;margin:0 auto}
          .journey{display:none}
        }
        @media(max-width:900px){
          .tracks-grid.four{grid-template-columns:1fr;gap:30px;max-width:460px;margin:0 auto}
          .start-card{grid-template-columns:1fr}
          .start-r{border-left:0;border-top:1px solid rgba(246,241,231,.1)}
          .day-cols{grid-template-columns:1fr;gap:20px}
          .incl-block{grid-template-columns:1fr;gap:20px}
          .incl-grid{grid-template-columns:1fr}
          .hero{padding:110px 0 60px}
          .combo-card{flex-direction:column;align-items:flex-start;padding:30px 26px}
          .combo-l{max-width:100%}
          .combo-r{width:100%}
          .combo-r .btn{width:100%}
        }
        @media(max-width:620px){
          .tracks-grid.four{max-width:420px}
          .t-sub{min-height:0}
        }
      `}</style>

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="wrap">
          <span className="eyebrow reveal">{t('heroBadge')}</span>
          <h1 className="serif reveal">{t('heroTitlePlain1')} <em>{t('heroTitleEm')}</em><br />{t('heroTitlePlain2')}</h1>
          <p className="reveal">{t('heroIntro')}</p>
          <div className="scroll-cue reveal">{t('heroScroll')}</div>
        </div>
      </section>

      {/* ===== WORKSHOP ===== */}
      <section className="start">
        <div className="wrap">
          <div className="start-card reveal">
            <div className="start-l">
              <span className="start-tag">{t('workshopEyebrow')}</span>
              <h2 className="serif">{t('workshopTitlePlain')}<em>{t('workshopTitleEm')}</em></h2>
              <p>{t('workshopIntro')}</p>
              <p className="micro">{t('workshopSubIntro')}</p>
              <div className="start-meta">
                <div className="m"><span className="k">{t('workshopMetaDurationLabel')}</span><span className="v serif">{t('workshopMetaDurationValue')}</span></div>
                <div className="m"><span className="k">{t('workshopMetaFormLabel')}</span><span className="v serif">{t('workshopMetaFormValue')}</span></div>
                <div className="m"><span className="k">{t('workshopMetaLevelLabel')}</span><span className="v serif">{t('workshopMetaLevelValue')}</span></div>
              </div>
              <div className="start-btns">
                <a href="mailto:info@luxique.nl?subject=Aanmelden%20kennismakingsworkshop" className="btn">{t('workshopCta')}</a>
                <button className="btn ghost" data-loenique>{t('workshopAskLoenique')}</button>
              </div>
            </div>
            <div className="start-r">
              <h3>{t('workshopListTitle')}</h3>
              <ul>
                <li>{t('workshopItem1')}</li>
                <li>{t('workshopItem2')}</li>
                <li>{t('workshopItem3')}</li>
                <li>{t('workshopItem4')}</li>
                <li>{t('workshopItem5')}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== NIVEAU-INTRO ===== */}
      <section className="levels-intro">
        <div className="wrap">
          <div className="reveal">
            <h2 className="serif">{t('levelsTitlePlain')} <em>{t('levelsTitleEm')}</em></h2>
            <p>{t('levelsIntro')}</p>
          </div>
        </div>
      </section>

      {/* ===== TRAJECTEN ===== */}
      <section className="level">
        <div className="wrap">
          {/* Journey timeline */}
          <div className="journey reveal" aria-hidden="true">
            <div className="journey-track">
              <svg className="journey-svg" viewBox="0 0 1000 54" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="jgrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(196,162,101,.18)"/>
                    <stop offset="55%" stopColor="rgba(201,168,106,.7)"/>
                    <stop offset="100%" stopColor="rgba(216,185,122,1)"/>
                  </linearGradient>
                </defs>
                <path d="M 20,30 C 90,18 110,18 125,27 C 200,42 300,42 375,27 C 450,14 550,14 625,27 C 700,40 800,40 875,27 C 920,21 960,20 980,24"
                      fill="none" stroke="url(#jgrad)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div className="journey-dots">
                <div className="cell"><span className="journey-dot"></span></div>
                <div className="cell"><span className="journey-dot"></span></div>
                <div className="cell"><span className="journey-dot"></span></div>
                <div className="cell"><span className="journey-dot last"></span></div>
              </div>
              <span className="journey-cap start">{t('levelsScaleStart')}</span>
              <span className="journey-cap end">{t('levelsScaleEnd')} <span className="ar">→</span></span>
            </div>
          </div>

          <div className="tracks-grid four">
            {/* BEGINNER LASH ARTIST */}
            <div className="track reveal">
              <span className="lvl-tag l1"><span className="dot"><i></i><i></i><i></i></span>{t('card1Level')}</span>
              <div className="t-dur">{t('card1Meta')}</div>
              <div className="t-name serif">{t('card1Name')}</div>
              <div className="t-sub">{t('card1Desc')}</div>
              <div className="t-price"><span className="amt serif">{t('card1PriceExcl')}</span><span className="vat">{t('card1PriceExclLabel')}</span></div>
              <div className="t-incl-vat">{t('card1PriceNote')}</div>
              <div className="fitbox">
                <div className="fit">
                  <span className="fit-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#5C6B4E" strokeWidth="3.2"><path d="M5 12l4 4L19 7"/></svg></span>
                  <span><span className="lab">{t('card1ForLabel')}</span>je <b>{t('card1ForEm')}</b>{t('card1ForPost')}</span>
                </div>
                <div className="nofit">
                  <span className="fit-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#9B5B47" strokeWidth="3.2"><path d="M6 6l12 12M18 6L6 18"/></svg></span>
                  <span><span className="lab">{t('card1NotForLabel')}</span>{t('card1NotForText')}</span>
                </div>
              </div>
              <ul className="incl">
                <li>{t('card1Feature1')}</li>
                <li>{t('card1Feature2')}</li>
                <li>{t('card1Feature3')}</li>
                <li>{t('card1Feature4')}</li>
                <li>{t('card1Feature5')}</li>
              </ul>
              <button className="btn ghost" data-open="beginner">{t('cardViewProgram')}</button>
            </div>

            {/* WISPY MASTERCLASS */}
            <div className="track reveal">
              <span className="lvl-tag l2"><span className="dot"><i></i><i></i><i></i></span>{t('card2Level')}</span>
              <div className="t-dur">{t('card2Meta')}</div>
              <div className="t-name serif">{t('card2Name')}</div>
              <div className="t-sub">{t('card2Desc')}</div>
              <div className="t-price"><span className="amt serif">{t('card2PriceExcl')}</span><span className="vat">{t('card2PriceExclLabel')}</span></div>
              <div className="t-incl-vat">{t('card2PriceIncl')}</div>
              <div className="fitbox">
                <div className="fit">
                  <span className="fit-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#5C6B4E" strokeWidth="3.2"><path d="M5 12l4 4L19 7"/></svg></span>
                  <span><span className="lab">{t('card2ForLabel')}</span>je <b>{t('card2ForEm')}</b>{t('card2ForPost')}</span>
                </div>
                <div className="nofit">
                  <span className="fit-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#9B5B47" strokeWidth="3.2"><path d="M6 6l12 12M18 6L6 18"/></svg></span>
                  <span><span className="lab">{t('card2NotForLabel')}</span>{t('card2NotForPre')}<b>{t('card2NotForEm')}</b>{t('card2NotForPost')}</span>
                </div>
              </div>
              <ul className="incl">
                <li>{t('card2Feature1')}</li>
                <li>{t('card2Feature2')}</li>
                <li>{t('card2Feature3')}</li>
                <li>{t('card2Feature4')}</li>
                <li>{t('card2Feature5')}</li>
              </ul>
              <button className="btn ghost" data-open="wispy">{t('cardViewProgram')}</button>
            </div>

            {/* MEDUSA MASTERCLASS */}
            <div className="track reveal">
              <span className="lvl-tag l2"><span className="dot"><i></i><i></i><i></i></span>{t('card3Level')}</span>
              <div className="t-dur">{t('card3Meta')}</div>
              <div className="t-name serif">{t('card3Name')}</div>
              <div className="t-sub">{t('card3Desc')}</div>
              <div className="t-price"><span className="amt serif">{t('card3PriceExcl')}</span><span className="vat">{t('card3PriceExclLabel')}</span></div>
              <div className="t-incl-vat">{t('card3PriceIncl')}</div>
              <div className="fitbox">
                <div className="fit">
                  <span className="fit-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#5C6B4E" strokeWidth="3.2"><path d="M5 12l4 4L19 7"/></svg></span>
                  <span><span className="lab">{t('card3ForLabel')}</span>je <b>{t('card3ForEm')}</b>{t('card3ForMid')}<b>{t('card3ForEm2')}</b>{t('card3ForPost')}</span>
                </div>
                <div className="nofit">
                  <span className="fit-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#9B5B47" strokeWidth="3.2"><path d="M6 6l12 12M18 6L6 18"/></svg></span>
                  <span><span className="lab">{t('card3NotForLabel')}</span>{t('card3NotForPre')}<b>{t('card3NotForEm')}</b>{t('card3NotForPost')}</span>
                </div>
              </div>
              <ul className="incl">
                <li>{t('card3Feature1')}</li>
                <li>{t('card3Feature2')}</li>
                <li>{t('card3Feature3')}</li>
                <li>{t('card3Feature4')}</li>
                <li>{t('card3Feature5')}</li>
              </ul>
              <button className="btn ghost" data-open="medusa">{t('cardViewProgram')}</button>
            </div>

            {/* LASH TECH TO ARTIST (featured) */}
            <div className="track feat reveal">
              <span className="badge">{t('card4Badge')}</span>
              <span className="lvl-tag l3"><span className="dot"><i></i><i></i><i></i></span>{t('card4Level')}</span>
              <div className="t-dur">{t('card4Meta')}</div>
              <div className="t-name serif">{t('card4Name')}</div>
              <div className="t-sub">{t('card4Desc')}</div>
              <div className="t-price"><span className="amt serif">{t('card4PriceExcl')}</span><span className="vat">{t('card4PriceExclLabel')}</span></div>
              <div className="t-incl-vat">{t('card4PriceIncl')}</div>
              <div className="fitbox">
                <div className="fit">
                  <span className="fit-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#5C6B4E" strokeWidth="3.2"><path d="M5 12l4 4L19 7"/></svg></span>
                  <span><span className="lab">{t('card4ForLabel')}</span>je <b>{t('card4ForEm')}</b>{t('card4ForPost')}</span>
                </div>
                <div className="nofit">
                  <span className="fit-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#9B5B47" strokeWidth="3.2"><path d="M6 6l12 12M18 6L6 18"/></svg></span>
                  <span><span className="lab">{t('card4NotForLabel')}</span>{t('card4NotForPre')}<b>{t('card4NotForEm')}</b>{t('card4NotForPost')}</span>
                </div>
              </div>
              <ul className="incl">
                <li>{t('card4Feature1')}</li>
                <li>{t('card4Feature2')}</li>
                <li>{t('card4Feature3')}</li>
                <li>{t('card4Feature4')}</li>
                <li>{t('card4Feature5')}</li>
              </ul>
              <button className="btn ghost" data-open="tech">{t('cardViewProgram')}</button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== COMBINATIE-CTA ===== */}
      <section className="combo">
        <div className="wrap">
          <div className="combo-card reveal">
            <div className="combo-l">
              <span className="eyebrow">{t('comboEyebrow')}</span>
              <h3 className="serif">{t('comboTitlePre')} <em>{t('comboTitleEm')}</em>{t('comboTitlePost')}</h3>
              <p>{t('comboText')}</p>
            </div>
            <div className="combo-r">
              <a href="mailto:info@luxique.nl?subject=Traject%20op%20maat" className="btn">{t('comboContact')}</a>
              <button className="btn ghost" data-loenique>{t('comboAskLoenique')}</button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== DETAIL: BEGINNER ===== */}
      <div className="detail" id="d-beginner">
        <div className="detail-inner">
          <div className="wrap">
            <span className="eyebrow">{t('dp1Meta')}</span>
            <h3 className="serif">{t('dp1Name')}</h3>
            <p className="dlead">{t('dp1Intro')}</p>
            <div className="days">
              <div className="day">
                <div className="day-h"><span className="day-num">{t('dp1Day1Label')}</span><span className="day-t serif">{t('dp1Day1Title')}</span></div>
                <div className="day-d">{t('dp1Day1Desc')}</div>
                <div className="day-cols one"><div className="col"><ul>
                  <li>{t('dp1Day1Item1')}</li>
                  <li>{t('dp1Day1Item2')}</li>
                  <li>{t('dp1Day1Item3')}</li>
                  <li>{t('dp1Day1Item4')}</li>
                  <li>{t('dp1Day1Item5')}</li>
                  <li>{t('dp1Day1Item6')}</li>
                  <li>{t('dp1Day1Item7')}</li>
                  <li>{t('dp1Day1Item8')}</li>
                </ul></div></div>
              </div>
              <div className="day">
                <div className="day-h"><span className="day-num">{t('dp1Day2Label')}</span><span className="day-t serif">{t('dp1Day2Title')}</span></div>
                <div className="day-d">{t('dp1Day2Desc')}</div>
                <div className="day-cols one"><div className="col"><ul>
                  <li>{t('dp1Day2Item1')}</li>
                  <li>{t('dp1Day2Item2')}</li>
                  <li>{t('dp1Day2Item3')}</li>
                  <li>{t('dp1Day2Item4')}</li>
                  <li>{t('dp1Day2Item5')}</li>
                </ul></div></div>
              </div>
              <div className="day">
                <div className="day-h"><span className="day-num">{t('dp1Day3Label')}</span><span className="day-t serif">{t('dp1Day3Title')}</span></div>
                <div className="day-d">{t('dp1Day3Desc')}</div>
                <div className="day-cols one"><div className="col"><ul>
                  <li>{t('dp1Day3Item1')}</li>
                  <li>{t('dp1Day3Item2')}</li>
                  <li>{t('dp1Day3Item3')}</li>
                  <li>{t('dp1Day3Item4')}</li>
                  <li>{t('dp1Day3Item5')}</li>
                  <li>{t('dp1Day3Item6')}</li>
                </ul></div></div>
              </div>
              <div className="day">
                <div className="day-h"><span className="day-num">{t('dp1Day4Label')}</span><span className="day-t serif">{t('dp1Day4Title')}</span></div>
                <div className="day-d">{t('dp1Day4Desc')}</div>
                <div className="day-cols one"><div className="col"><ul>
                  <li>{t('dp1Day4Item1')}</li>
                  <li>{t('dp1Day4Item2')}</li>
                  <li>{t('dp1Day4Item3')}</li>
                  <li>{t('dp1Day4Item4')}</li>
                </ul></div></div>
              </div>
            </div>
            <div className="incl-block">
              <div>
                <h4 className="serif">{t('dp1InclTitle')}</h4>
                <ul className="incl-grid">
                  <li>{t('dp1Incl1')}</li>
                  <li>{t('dp1Incl2')}</li>
                  <li>{t('dp1Incl3')}</li>
                  <li>{t('dp1Incl4')}</li>
                  <li>{t('dp1Incl5')}</li>
                  <li>{t('dp1Incl6')}</li>
                </ul>
              </div>
              <div className="invest">
                <div className="lab">{t('dp1InvestTitle')}</div>
                <div className="amt serif">{t('dp1InvestPrice')}</div>
                <div className="vat">{t('dp1InvestPriceLabel')}</div>
                <div className="pay">{t('dp1InvestNote')}</div>
              </div>
            </div>
            <div className="btn-row">
              <a href="mailto:info@luxique.nl?subject=Aanvraag%20traject" className="btn">{t('dpRequestCta')}</a>
              <button className="btn ghost" data-loenique>{t('dpAskLoenique')}</button>
            </div>
            <p className="aanvraag-note">{t('dpFootnotePre')} <a href="mailto:info@luxique.nl">info@luxique.nl</a> {t('dpFootnotePost')}</p>
            <button className="close-d" data-close>{t('dpClose')}</button>
          </div>
        </div>
      </div>

      {/* ===== DETAIL: WISPY ===== */}
      <div className="detail" id="d-wispy">
        <div className="detail-inner">
          <div className="wrap">
            <span className="eyebrow">{t('dp2Meta')}</span>
            <h3 className="serif">{t('dp2Name')}</h3>
            <p className="dlead">{t('dp2Intro')}</p>
            <div className="req">
              <svg viewBox="0 0 24 24" fill="none" stroke="#D8B97A" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
              <div>
                <div className="rt">{t('dp2PrereqTitle')}</div>
                <p>{t('dp2PrereqText')}</p>
              </div>
            </div>
            <div className="days">
              <div className="day">
                <div className="day-h"><span className="day-t serif">{t('dp2LearnTitle')}</span></div>
                <div className="day-cols">
                  <div className="col"><div className="col-h">{t('dp2Group1Title')}</div><ul>
                    <li>{t('dp2Group1Item1')}</li>
                    <li>{t('dp2Group1Item2')}</li>
                    <li>{t('dp2Group1Item3')}</li>
                    <li>{t('dp2Group1Item4')}</li>
                    <li>{t('dp2Group1Item5')}</li>
                  </ul></div>
                  <div className="col"><div className="col-h">{t('dp2Group2Title')}</div><ul>
                    <li>{t('dp2Group2Item1')}</li>
                    <li>{t('dp2Group2Item2')}</li>
                    <li>{t('dp2Group2Item3')}</li>
                    <li>{t('dp2Group2Item4')}</li>
                    <li>{t('dp2Group2Item5')}</li>
                  </ul></div>
                </div>
              </div>
              <div className="day">
                <div className="day-h"><span className="day-t serif">{t('dp2Group3Title')}</span></div>
                <div className="day-cols">
                  <div className="col"><div className="col-h">{t('dp2Group1Item1')}</div><ul>
                    <li>{t('dp2Group3Item1')}</li>
                    <li>{t('dp2Group3Item2')}</li>
                    <li>{t('dp2Group3Item3')}</li>
                  </ul></div>
                  <div className="col"><div className="col-h">{t('dp2Group3Item4')}</div><ul>
                    <li>{t('dp2Group3Item5')}</li>
                    <li>{t('dp2Group3Item6')}</li>
                    <li>{t('dp2Group3Item7')}</li>
                    <li>{t('dp2Group3Item8')}</li>
                  </ul></div>
                </div>
              </div>
            </div>
            <p className="not-incl">{t('dp2Note')}</p>
            <div className="incl-block">
              <div>
                <h4 className="serif">{t('dp2InclTitle')}</h4>
                <ul className="incl-grid">
                  <li>{t('dp2Incl1')}</li>
                  <li>{t('dp2Incl2')}</li>
                  <li>{t('dp2Incl3')}</li>
                  <li>{t('dp2Incl4')}</li>
                  <li>{t('dp2Incl5')}</li>
                </ul>
              </div>
              <div className="invest">
                <div className="lab">{t('dp2InvestTitle')}</div>
                <div className="amt serif">{t('dp2InvestPrice')}</div>
                <div className="vat">{t('dp2InvestPriceLabel')}</div>
                <div className="pay">{t('dp2Outro')}</div>
              </div>
            </div>
            <div className="btn-row">
              <a href="mailto:info@luxique.nl?subject=Aanvraag%20traject" className="btn">{t('dpRequestCta')}</a>
              <button className="btn ghost" data-loenique>{t('dpAskLoenique')}</button>
            </div>
            <p className="aanvraag-note">{t('dpFootnotePre')} <a href="mailto:info@luxique.nl">info@luxique.nl</a> {t('dpFootnotePost')}</p>
            <button className="close-d" data-close>{t('dpClose')}</button>
          </div>
        </div>
      </div>

      {/* ===== DETAIL: MEDUSA ===== */}
      <div className="detail" id="d-medusa">
        <div className="detail-inner">
          <div className="wrap">
            <span className="eyebrow">{t('dp3Meta')}</span>
            <h3 className="serif">{t('dp3Name')}</h3>
            <p className="dlead">{t('dp3Intro')}</p>
            <div className="req">
              <svg viewBox="0 0 24 24" fill="none" stroke="#D8B97A" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
              <div>
                <div className="rt">{t('dp3PrereqTitle')}</div>
                <p>{t('dp3PrereqText')}</p>
              </div>
            </div>
            <div className="days">
              <div className="day">
                <div className="day-h"><span className="day-num">{t('dp3Day1Label')}</span><span className="day-t serif">{t('dp3Day1Title')}</span></div>
                <div className="day-d">{t('dp3Day1Desc')}</div>
                <div className="day-cols">
                  <div className="col"><div className="col-h">{t('dp3Day1Group1Title')}</div><ul>
                    <li>{t('dp3Day1Group1Item1')}</li>
                    <li>{t('dp3Day1Group1Item2')}</li>
                    <li>{t('dp3Day1Group1Item3')}</li>
                    <li>{t('dp3Day1Group1Item4')}</li>
                    <li>{t('dp3Day1Group1Item5')}</li>
                    <li>{t('dp3Day1Group1Item6')}</li>
                  </ul></div>
                  <div className="col"><div className="col-h">{t('dp3Day1Group2Title')}</div><ul>
                    <li>{t('dp3Day1Group2Item1')}</li>
                    <li>{t('dp3Day1Group2Item2')}</li>
                    <li>{t('dp3Day1Group2Item3')}</li>
                    <li>{t('dp3Day1Group2Item4')}</li>
                    <li>{t('dp3Day1Group2Item5')}</li>
                  </ul></div>
                </div>
              </div>
              <div className="day">
                <div className="day-h"><span className="day-num">{t('dp3Day1bLabel')}</span><span className="day-t serif">{t('dp3Day1bTitle')}</span></div>
                <div className="day-cols">
                  <div className="col"><div className="col-h">{t('dp3Day1bGroup1Item1')}</div><ul>
                    <li>{t('dp3Day1bGroup1Item2')}</li>
                    <li>{t('dp3Day1bGroup1Item3')}</li>
                    <li>{t('dp3Day1bGroup1Item4')}</li>
                    <li>{t('dp3Day1bGroup1Item5')}</li>
                  </ul></div>
                  <div className="col"><div className="col-h">{t('dp3Day1bGroup2Title')}</div><ul>
                    <li>{t('dp3Day1bGroup2Item1')}</li>
                    <li>{t('dp3Day1bGroup2Item2')}</li>
                    <li>{t('dp3Day1bGroup2Item3')}</li>
                    <li>{t('dp3Day1bGroup2Item4')}</li>
                  </ul></div>
                </div>
              </div>
              <div className="day">
                <div className="day-h"><span className="day-num">{t('dp3Day2Label')}</span><span className="day-t serif">{t('dp3Day2Title')}</span></div>
                <div className="day-d">{t('dp3Day2Desc')}</div>
                <div className="day-cols one"><div className="col"><ul>
                  <li>{t('dp3Day2Item1')}</li>
                  <li>{t('dp3Day2Item2')}</li>
                  <li>{t('dp3Day2Item3')}</li>
                  <li>{t('dp3Day2Item4')}</li>
                  <li>{t('dp3Day2Item5')}</li>
                  <li>{t('dp3Day2Item6')}</li>
                  <li>{t('dp3Day2Item7')}</li>
                </ul></div></div>
              </div>
            </div>
            <div className="incl-block">
              <div>
                <h4 className="serif">{t('dp3InclTitle')}</h4>
                <ul className="incl-grid">
                  <li>{t('dp3Incl1')}</li>
                  <li>{t('dp3Incl2')}</li>
                  <li>{t('dp3Incl3')}</li>
                  <li>{t('dp3Incl4')}</li>
                  <li>{t('dp3Incl5')}</li>
                  <li>{t('dp3Incl6')}</li>
                  <li>{t('dp3Incl7')}</li>
                  <li>{t('dp3Incl8')}</li>
                </ul>
              </div>
              <div className="invest">
                <div className="lab">{t('dp3InvestTitle')}</div>
                <div className="amt serif">{t('dp3InvestPrice')}</div>
                <div className="vat">{t('dp3InvestPriceLabel')}</div>
                <div className="pay">{t('dp3Outro')}</div>
              </div>
            </div>
            <div className="btn-row">
              <a href="mailto:info@luxique.nl?subject=Aanvraag%20traject" className="btn">{t('dpRequestCta')}</a>
              <button className="btn ghost" data-loenique>{t('dpAskLoenique')}</button>
            </div>
            <p className="aanvraag-note">{t('dpFootnotePre')} <a href="mailto:info@luxique.nl">info@luxique.nl</a> {t('dpFootnotePost')}</p>
            <button className="close-d" data-close>{t('dpClose')}</button>
          </div>
        </div>
      </div>

      {/* ===== DETAIL: TECH TO ARTIST ===== */}
      <div className="detail" id="d-tech">
        <div className="detail-inner">
          <div className="wrap">
            <span className="eyebrow">{t('dp4Meta')}</span>
            <h3 className="serif">{t('dp4Name')}</h3>
            <p className="dlead">{t('dp4Intro')}</p>
            <div className="req">
              <svg viewBox="0 0 24 24" fill="none" stroke="#D8B97A" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
              <div>
                <div className="rt">{t('dp4PrereqTitle')}</div>
                <p>{t('dp4PrereqText')}</p>
              </div>
            </div>
            <div className="days">
              <div className="day">
                <div className="day-h"><span className="day-num">{t('dp4Day1Label')}</span><span className="day-t serif">{t('dp4Day1Title')}</span></div>
                <div className="day-cols">
                  <div className="col"><div className="col-h">{t('dp4Day1Group1Title')}</div><ul>
                    <li>{t('dp4Day1Group1Item1')}</li>
                    <li>{t('dp4Day1Group1Item2')}</li>
                    <li>{t('dp4Day1Group1Item3')}</li>
                    <li>{t('dp4Day1Group1Item4')}</li>
                    <li>{t('dp4Day1Group1Item5')}</li>
                    <li>{t('dp4Day1Group1Item6')}</li>
                    <li>{t('dp4Day1Group1Item7')}</li>
                  </ul></div>
                  <div className="col"><div className="col-h">{t('dp4Day1Group2Title')}</div><ul>
                    <li>{t('dp4Day1Group2Item1')}</li>
                    <li>{t('dp4Day1Group2Item2')}</li>
                    <li>{t('dp4Day1Group2Item3')}</li>
                    <li>{t('dp4Day1Group2Item4')}</li>
                    <li>{t('dp4Day1Group2Item5')}</li>
                  </ul></div>
                </div>
              </div>
              <div className="day">
                <div className="day-h"><span className="day-num">{t('dp4Day2Label')}</span><span className="day-t serif">{t('dp4Day2Title')}</span></div>
                <div className="day-d">{t('dp4Day2Desc')}</div>
                <div className="day-cols">
                  <div className="col"><div className="col-h">{t('dp4Day2Group1Title')}</div><ul>
                    <li>{t('dp4Day2Group1Item1')}</li>
                    <li>{t('dp4Day2Group1Item2')}</li>
                    <li>{t('dp4Day2Group1Item3')}</li>
                    <li>{t('dp4Day2Group1Item4')}</li>
                  </ul></div>
                  <div className="col"><div className="col-h">{t('dp4Day2Group2Title')}</div><ul>
                    <li>{t('dp4Day2Group2Item1')}</li>
                    <li>{t('dp4Day2Group2Item2')}</li>
                    <li>{t('dp4Day2Group2Item3')}</li>
                    <li>{t('dp4Day2Group2Item4')}</li>
                  </ul></div>
                </div>
              </div>
              <div className="day">
                <div className="day-h"><span className="day-num">{t('dp4Day3Label')}</span><span className="day-t serif">{t('dp4Day3Title')}</span></div>
                <div className="day-d">{t('dp4Day3Desc')}</div>
                <div className="day-cols">
                  <div className="col"><div className="col-h">{t('dp4Day3Group1Title')}</div><ul>
                    <li>{t('dp4Day3Group1Item1')}</li>
                    <li>{t('dp4Day3Group1Item2')}</li>
                    <li>{t('dp4Day3Group1Item3')}</li>
                    <li>{t('dp4Day3Group1Item4')}</li>
                  </ul></div>
                  <div className="col"><div className="col-h">{t('dp4Day3Group2Title')}</div><ul>
                    <li>{t('dp4Day3Group2Item1')}</li>
                    <li>{t('dp4Day3Group2Item2')}</li>
                    <li>{t('dp4Day3Group2Item3')}</li>
                    <li>{t('dp4Day3Group2Item4')}</li>
                  </ul></div>
                </div>
              </div>
            </div>
            <div className="incl-block">
              <div>
                <h4 className="serif">{t('dp4InclTitle')}</h4>
                <ul className="incl-grid">
                  <li>{t('dp4Incl1')}</li>
                  <li>{t('dp4Incl2')}</li>
                  <li>{t('dp4Incl3')}</li>
                  <li>{t('dp4Incl4')}</li>
                  <li>{t('dp4Incl5')}</li>
                  <li>{t('dp4Incl6')}</li>
                  <li>{t('dp4Incl7')}</li>
                </ul>
              </div>
              <div className="invest">
                <div className="lab">{t('dp4InvestTitle')}</div>
                <div className="amt serif">{t('dp4InvestPrice')}</div>
                <div className="vat">{t('dp4InvestPriceLabel')}</div>
                <div className="pay">{t('dp4Outro')}</div>
              </div>
            </div>
            <div className="btn-row">
              <a href="mailto:info@luxique.nl?subject=Aanvraag%20traject" className="btn">{t('dpRequestCta')}</a>
              <button className="btn ghost" data-loenique>{t('dpAskLoenique')}</button>
            </div>
            <p className="aanvraag-note">{t('dpFootnotePre')} <a href="mailto:info@luxique.nl">info@luxique.nl</a> {t('dpFootnotePost')}</p>
            <button className="close-d" data-close>{t('dpClose')}</button>
          </div>
        </div>
      </div>

      {/* ===== DISCLAIMER ===== */}
      <section className="disclaimer">
        <div className="wrap">
          <div className="disc-card reveal">
            <span className="eyebrow">{t('closingEyebrow')}</span>
            <h2 className="serif">{t('closingTitle')}</h2>
            <p>{t('closingPara1')}</p>
            <p>{t('closingPara2')}<b>{t('closingPara3')}</b></p>
            <p>{t('closingPara4')}</p>
            <div className="cta-btns" style={{marginTop:'24px'}}>
              <a href="mailto:info@luxique.nl?subject=Vraag%20over%20niveau%20en%20trajecten" className="btn" style={{width:'auto',padding:'14px 28px'}}>{t('closingContact')}</a>
              <button className="btn ghost" data-loenique style={{width:'auto',padding:'14px 28px'}}>{t('closingAskLoenique')}</button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta">
        <div className="wrap">
          <h2 className="serif reveal">{t('finalTitlePlain')}<br /><em>{t('finalTitleEm')}</em></h2>
          <p className="reveal">{t('finalText')}</p>
          <div className="cta-btns reveal">
            <button className="btn" data-loenique>{t('finalAskLoenique')}</button>
            <a href="mailto:info@luxique.nl?subject=Vraag%20over%20trajecten" className="btn ghost-light">{t('finalMail')}</a>
          </div>
        </div>
      </section>
    </div>
  )
}