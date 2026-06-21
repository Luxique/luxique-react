'use client'

import { useEffect, useRef } from 'react'
import Navbar from '@/components/Navbar'

export default function PersoonlijkTrajectPage() {
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
        .detail{background:var(--dark2);color:var(--on-dark);overflow:hidden;max-height:0;transition:max-height .6s cubic-bezier(.16,1,.3,1)}
        .detail.open{max-height:7000px}
        .detail-inner{padding:80px 0 90px;position:relative;
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
          <span className="eyebrow reveal">In-person bij Chiva · Op locatie mogelijk</span>
          <h1 className="serif reveal">Jouw <em>persoonlijk</em><br />traject</h1>
          <p className="reveal">Een traject is een opleiding in het echt, bij Chiva — niet in een klas vol mensen, maar in de kleinste setting die er is: maximaal 1 op 2, of volledig 1 op 1. Je leert in jouw tempo, en als je wilt zelfs in je eigen salon. Hieronder vind je per niveau het juiste traject — van je allereerste set tot specialisatie op artist-niveau.</p>
          <div className="scroll-cue reveal">↓ Ontdek jouw route</div>
        </div>
      </section>

      {/* ===== WORKSHOP ===== */}
      <section className="start">
        <div className="wrap">
          <div className="start-card reveal">
            <div className="start-l">
              <span className="start-tag">Start hier · Twijfel je?</span>
              <h2 className="serif">Kennismakings­<em>workshop</em></h2>
              <p>Niet zeker of een traject iets voor je is, of waar je staat? In één uur ontdek je samen met Chiva of de lash-wereld bij je past en welk traject aansluit op jouw niveau en ambitie.</p>
              <p className="micro">Een laagdrempelige eerste kennismaking — ideaal vóórdat je je inschrijft voor een volledig traject.</p>
              <div className="start-meta">
                <div className="m"><span className="k">Duur</span><span className="v serif">1 uur</span></div>
                <div className="m"><span className="k">Vorm</span><span className="v serif">Kennismaking</span></div>
                <div className="m"><span className="k">Niveau</span><span className="v serif">Iedereen</span></div>
              </div>
              <div className="start-btns">
                <a href="mailto:info@luxique.nl?subject=Aanmelden%20kennismakingsworkshop" className="btn">Plan een workshop</a>
                <button className="btn ghost" data-loenique>Vraag het Loenique</button>
              </div>
            </div>
            <div className="start-r">
              <h3>In dit uur</h3>
              <ul>
                <li>Kennismaken met Chiva en de werkwijze</li>
                <li>Ontdekken of lashen bij je past</li>
                <li>Inzicht in welk traject bij jouw niveau hoort</li>
                <li>Al je vragen over de opleidingen stellen</li>
                <li>Een eerlijk advies over je startpunt</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== NIVEAU-INTRO ===== */}
      <section className="levels-intro">
        <div className="wrap">
          <div className="reveal">
            <h2 className="serif">Van je eerste set naar <em>lash artist</em></h2>
            <p>De trajecten vormen samen één leerroute — van complete beginner zonder ervaring, links, tot specialist en artist op het hoogste niveau, rechts. Elke kaart toont met de stipjes waar dat traject in jouw reis valt. Lees goed wie het wél en niet voor is, zodat je op de juiste plek begint. Twijfel je nog? Begin met de kennismakingsworkshop hierboven, of laat Loenique je helpen kiezen.</p>
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
              <span className="journey-cap start">Beginner</span>
              <span className="journey-cap end">Pro Lash Artist <span className="ar">→</span></span>
            </div>
          </div>

          <div className="tracks-grid four">
            {/* BEGINNER LASH ARTIST */}
            <div className="track reveal">
              <span className="lvl-tag l1"><span className="dot"><i></i><i></i><i></i></span>Beginner</span>
              <div className="t-dur">4 dagen · Basisopleiding</div>
              <div className="t-name serif">Beginner Lash Artist</div>
              <div className="t-sub">De volledige basis van wimperextensions — een sterke, professionele fundering vanaf nul.</div>
              <div className="t-price"><span className="amt serif">€1.650</span><span className="vat">excl. btw</span></div>
              <div className="t-incl-vat">Incl. professioneel starterpakket</div>
              <div className="fitbox">
                <div className="fit">
                  <span className="fit-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#5C6B4E" strokeWidth="3.2"><path d="M5 12l4 4L19 7"/></svg></span>
                  <span><span className="lab">Voor jou als</span>je <b>nog geen of nauwelijks ervaring</b> hebt en vanaf de basis een professionele opleiding wilt. Geen voorkennis vereist.</span>
                </div>
                <div className="nofit">
                  <span className="fit-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#9B5B47" strokeWidth="3.2"><path d="M6 6l12 12M18 6L6 18"/></svg></span>
                  <span><span className="lab">Minder geschikt als</span>je al ervaren bent en zelfstandig sets plaatst — kies dan een specialisatie of doorgroeitraject.</span>
                </div>
              </div>
              <ul className="incl">
                <li>Techniek, isoleren &amp; plaatsen vanaf nul</li>
                <li>Fans maken voor volume sets</li>
                <li>Werken op echte modellen</li>
                <li>Ooganalyse, styling &amp; spikes</li>
                <li>Professioneel lash starterpakket</li>
              </ul>
              <button className="btn ghost" data-open="beginner">Bekijk dagprogramma</button>
            </div>

            {/* WISPY MASTERCLASS */}
            <div className="track reveal">
              <span className="lvl-tag l2"><span className="dot"><i></i><i></i><i></i></span>Intermediate</span>
              <div className="t-dur">1 dag · Specialisatie</div>
              <div className="t-name serif">Wispy Masterclass</div>
              <div className="t-sub">Specialiseer je in wispy styling, spikes en wet sets.</div>
              <div className="t-price"><span className="amt serif">€500</span><span className="vat">excl. btw</span></div>
              <div className="t-incl-vat">€605 incl. btw</div>
              <div className="fitbox">
                <div className="fit">
                  <span className="fit-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#5C6B4E" strokeWidth="3.2"><path d="M5 12l4 4L19 7"/></svg></span>
                  <span><span className="lab">Voor jou als</span>je de <b>one by one én Russian volume techniek goed beheerst</b> en je wilt specialiseren in wispy styling.</span>
                </div>
                <div className="nofit">
                  <span className="fit-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#9B5B47" strokeWidth="3.2"><path d="M6 6l12 12M18 6L6 18"/></svg></span>
                  <span><span className="lab">Niet geschikt als</span>je one by one of Russian volume <b>nog niet onder de knie</b> hebt. Deze worden niet opnieuw behandeld.</span>
                </div>
              </div>
              <ul className="incl">
                <li>Spikes creëren &amp; plaatsen</li>
                <li>Wispy volume &amp; wet sets</li>
                <li>Werken met J, B &amp; L curl</li>
                <li>Texture, lagen &amp; bottom lashes</li>
                <li>Modelwerk tijdens de cursus</li>
              </ul>
              <button className="btn ghost" data-open="wispy">Bekijk dagprogramma</button>
            </div>

            {/* MEDUSA MASTERCLASS */}
            <div className="track reveal">
              <span className="lvl-tag l2"><span className="dot"><i></i><i></i><i></i></span>Intermediate</span>
              <div className="t-dur">2 dagen · Specialisatie</div>
              <div className="t-name serif">Medusa Masterclass</div>
              <div className="t-sub">Beheers de kenmerkende Medusa-styling: spikes, textuur, lagen en L-curls.</div>
              <div className="t-price"><span className="amt serif">€1.000</span><span className="vat">excl. btw</span></div>
              <div className="t-incl-vat">€1.210 incl. btw</div>
              <div className="fitbox">
                <div className="fit">
                  <span className="fit-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#5C6B4E" strokeWidth="3.2"><path d="M5 12l4 4L19 7"/></svg></span>
                  <span><span className="lab">Voor jou als</span>je een <b>ervaren lash tech</b> bent met minimaal een <b>one by one certificaat</b>. Volume is mooi meegenomen, niet verplicht.</span>
                </div>
                <div className="nofit">
                  <span className="fit-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#9B5B47" strokeWidth="3.2"><path d="M6 6l12 12M18 6L6 18"/></svg></span>
                  <span><span className="lab">Niet geschikt als</span>je <b>geen ervaren lash tech</b> bent of geen one by one certificaat hebt. Dan kun je deze cursus (nog) niet volgen.</span>
                </div>
              </div>
              <ul className="incl">
                <li>Medusa mapping &amp; spike placement</li>
                <li>Volledige L-curl specialisatie</li>
                <li>Textuur opbouwen &amp; werken met lagen</li>
                <li>Bottom lashes &amp; balans</li>
                <li>Live demonstratie + modeldag</li>
              </ul>
              <button className="btn ghost" data-open="medusa">Bekijk dagprogramma</button>
            </div>

            {/* LASH TECH TO ARTIST (featured) */}
            <div className="track feat reveal">
              <span className="badge">Meest gekozen</span>
              <span className="lvl-tag l3"><span className="dot"><i></i><i></i><i></i></span>Pro</span>
              <div className="t-dur">3 dagen · 2 modeldagen</div>
              <div className="t-name serif">Lash Tech to Artist</div>
              <div className="t-sub">Van technisch sets plaatsen naar volledig op maat stylen, corrigeren en ontwerpen.</div>
              <div className="t-price"><span className="amt serif">€1.200</span><span className="vat">excl. btw</span></div>
              <div className="t-incl-vat">€1.452 incl. btw</div>
              <div className="fitbox">
                <div className="fit">
                  <span className="fit-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#5C6B4E" strokeWidth="3.2"><path d="M5 12l4 4L19 7"/></svg></span>
                  <span><span className="lab">Voor jou als</span>je de <b>one by one én Russian volume techniek goed beheerst</b> en wilt doorgroeien van lash tech naar lash artist.</span>
                </div>
                <div className="nofit">
                  <span className="fit-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#9B5B47" strokeWidth="3.2"><path d="M6 6l12 12M18 6L6 18"/></svg></span>
                  <span><span className="lab">Niet geschikt als</span>je one by one of Russian volume <b>nog niet beheerst</b>. Deze basistechnieken worden niet opnieuw behandeld.</span>
                </div>
              </div>
              <ul className="incl">
                <li>Wispy styling &amp; texture (modeldag)</li>
                <li>Oog-, gezichts- &amp; stylinganalyse</li>
                <li>Correctief stylen &amp; consultatie</li>
                <li>Volledige artist-transformatie</li>
                <li>Content creatie &amp; editing training</li>
              </ul>
              <button className="btn ghost" data-open="tech">Bekijk dagprogramma</button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== COMBINATIE-CTA ===== */}
      <section className="combo">
        <div className="wrap">
          <div className="combo-card reveal">
            <div className="combo-l">
              <span className="eyebrow">Iets specifieks in gedachten?</span>
              <h3 className="serif">Wil je één techniek leren, of juist een <em>combinatie</em> uit meerdere trajecten?</h3>
              <p>Niet elk leerdoel past in één vast traject. Wil je je op één specifieke techniek richten, of onderdelen uit verschillende cursussen samenvoegen tot een route op maat? Neem contact op — Chiva denkt met je mee en stelt samen met jou een persoonlijk programma samen.</p>
            </div>
            <div className="combo-r">
              <a href="mailto:info@luxique.nl?subject=Traject%20op%20maat" className="btn">Neem contact op</a>
              <button className="btn ghost" data-loenique>Vraag het Loenique</button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== DETAIL: BEGINNER ===== */}
      <div className="detail" id="d-beginner">
        <div className="detail-inner">
          <div className="wrap">
            <span className="eyebrow">4-daagse opleiding · Beginner</span>
            <h3 className="serif">Beginner Lash Artist</h3>
            <p className="dlead">Een intensieve vierdaagse waarin je de volledige basis van wimperextensions leert. Ontwikkeld om beginners direct een sterke, professionele fundering te geven — van techniek tot het oog van een lash artist.</p>
            <div className="days">
              <div className="day">
                <div className="day-h"><span className="day-num">Dag 1</span><span className="day-t serif">Basis &amp; techniek</span></div>
                <div className="day-d">Volledig gericht op techniek begrijpen en controle krijgen over je pincetten en plaatsing.</div>
                <div className="day-cols one"><div className="col"><ul>
                  <li>Hygiëne en veiligheid</li>
                  <li>Basis van het oog en de natuurlijke wimper</li>
                  <li>De verschillende oogvormen</li>
                  <li>Betekenis van curls en hoe je deze gebruikt</li>
                  <li>Correct isoleren van wimpers</li>
                  <li>Het plaatsen van wimperextensions</li>
                  <li>Fans creëren voor volume sets</li>
                  <li>Oefenen op oefenmateriaal</li>
                </ul></div></div>
              </div>
              <div className="day">
                <div className="day-h"><span className="day-num">Dag 2</span><span className="day-t serif">Werken op een model</span></div>
                <div className="day-d">Voor het eerst werken op een echt model — rustig en gecontroleerd leren werken.</div>
                <div className="day-cols one"><div className="col"><ul>
                  <li>Plaatsen van een volledige set extensions</li>
                  <li>Correct isoleren op een echt oog</li>
                  <li>Werken met lash mapping</li>
                  <li>Tempo en precisie verbeteren</li>
                  <li>Een set veilig verwijderen</li>
                </ul></div></div>
              </div>
              <div className="day">
                <div className="day-h"><span className="day-num">Dag 3</span><span className="day-t serif">Styling &amp; ooganalyse</span></div>
                <div className="day-d">Uitgebreide theorie- en stylingdag — verder leren kijken dan de standaard set.</div>
                <div className="day-cols one"><div className="col"><ul>
                  <li>Oogvormen analyseren</li>
                  <li>Welke curls bij welke oogvorm passen</li>
                  <li>Sets leren customizen</li>
                  <li>Introductie tot wispy styling</li>
                  <li>Spikes plaatsen en gebruiken</li>
                  <li>Werken met verschillende mappings</li>
                </ul></div></div>
              </div>
              <div className="day">
                <div className="day-h"><span className="day-num">Dag 4</span><span className="day-t serif">Model &amp; customised set</span></div>
                <div className="day-d">Je laat zien dat je een set kunt analyseren, plannen en uitvoeren.</div>
                <div className="day-cols one"><div className="col"><ul>
                  <li>Zelf de lash mapping maken</li>
                  <li>De oogvorm van het model analyseren</li>
                  <li>Zelf de juiste curls en styling kiezen</li>
                  <li>Een volledige set creëren op basis van dag 3</li>
                </ul></div></div>
              </div>
            </div>
            <div className="incl-block">
              <div>
                <h4 className="serif">Inclusief</h4>
                <ul className="incl-grid">
                  <li>Professioneel lash starterpakket</li>
                  <li>Certificaat Beginner Lash Artist</li>
                  <li>Begeleiding in kleine groepen</li>
                  <li>Lunch en drankjes</li>
                  <li>Gratis parkeren</li>
                  <li>Nazorg en mentoring na de cursus</li>
                </ul>
              </div>
              <div className="invest">
                <div className="lab">Investering</div>
                <div className="amt serif">€1.650</div>
                <div className="vat">excl. btw</div>
                <div className="pay">50% aanbetaling bij reservering. Restbedrag vóór aanvang van de cursus voldaan.</div>
              </div>
            </div>
            <div className="btn-row">
              <a href="mailto:info@luxique.nl?subject=Aanvraag%20traject" className="btn">Vraag dit traject aan</a>
              <button className="btn ghost" data-loenique>Vraag het Loenique</button>
            </div>
            <p className="aanvraag-note">Trajecten zijn op aanvraag en in overleg. Mail naar <a href="mailto:info@luxique.nl">info@luxique.nl</a> of laat Loenique je helpen kiezen.</p>
            <button className="close-d" data-close>↑ Sluit dagprogramma</button>
          </div>
        </div>
      </div>

      {/* ===== DETAIL: WISPY ===== */}
      <div className="detail" id="d-wispy">
        <div className="detail-inner">
          <div className="wrap">
            <span className="eyebrow">1-daagse masterclass · Intermediate</span>
            <h3 className="serif">Wispy Masterclass</h3>
            <p className="dlead">Voor lash techs die al kunnen werken met wimperextensions en zich willen specialiseren in wispy styling. Eén dag, vol techniek — direct toepasbaar op een model.</p>
            <div className="req">
              <svg viewBox="0 0 24 24" fill="none" stroke="#D8B97A" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
              <div>
                <div className="rt">Vereiste voorkennis</div>
                <p>Je beheerst de one by one én Russian volume techniek goed. Deze technieken worden tijdens de cursus niet opnieuw behandeld. Voldoe je hier bij aanvang niet aan, dan kan de cursus worden stopgezet zonder restitutie — dit is je eigen verantwoordelijkheid.</p>
              </div>
            </div>
            <div className="days">
              <div className="day">
                <div className="day-h"><span className="day-t serif">Wat je leert</span></div>
                <div className="day-cols">
                  <div className="col"><div className="col-h">Spikes &amp; wispy styling</div><ul>
                    <li>Handmatige spikes &amp; fanstructuren</li>
                    <li>Spikes voor verschillende effecten</li>
                    <li>Opbouw van een wispy volume set</li>
                    <li>Balans tussen textuur en volume</li>
                    <li>Werken met lagen &amp; diepte opbouwen</li>
                  </ul></div>
                  <div className="col"><div className="col-h">Wet sets &amp; curls</div><ul>
                    <li>Closed fan technieken &amp; wet lash styling</li>
                    <li>Verschil wet sets vs wispy sets</li>
                    <li>Werken met J, B &amp; L curl</li>
                    <li>Welke oogvormen erbij passen</li>
                    <li>Curls combineren voor customisation</li>
                  </ul></div>
                </div>
              </div>
              <div className="day">
                <div className="day-h"><span className="day-t serif">Texture, bottom lashes &amp; praktijk</span></div>
                <div className="day-cols">
                  <div className="col"><div className="col-h">Texture &amp; lagen</div><ul>
                    <li>Werken met meerdere lagen</li>
                    <li>Diepte &amp; dimensionale sets</li>
                    <li>Professionele textuur opbouwen</li>
                  </ul></div>
                  <div className="col"><div className="col-h">Bottom lashes &amp; afwerking</div><ul>
                    <li>Veilig plaatsen van bottom lashes</li>
                    <li>Lengtes kiezen &amp; balans creëren</li>
                    <li>Complete look afwerken op model</li>
                  </ul></div>
                </div>
              </div>
            </div>
            <p className="not-incl">Let op: deze masterclass behandelt niet de Medusa-techniek.</p>
            <div className="incl-block">
              <div>
                <h4 className="serif">Inclusief</h4>
                <ul className="incl-grid">
                  <li>Lunch</li>
                  <li>Lesmateriaal</li>
                  <li>Praktijkbegeleiding</li>
                  <li>Certificaat</li>
                  <li>Modelwerk tijdens de cursus</li>
                </ul>
              </div>
              <div className="invest">
                <div className="lab">Investering</div>
                <div className="amt serif">€500</div>
                <div className="vat">excl. btw · €605 incl. btw</div>
                <div className="pay">Na afloop kun je professionele wispy sets creëren, spike-technieken toepassen en je onderscheiden als specialist.</div>
              </div>
            </div>
            <div className="btn-row">
              <a href="mailto:info@luxique.nl?subject=Aanvraag%20traject" className="btn">Vraag dit traject aan</a>
              <button className="btn ghost" data-loenique>Vraag het Loenique</button>
            </div>
            <p className="aanvraag-note">Trajecten zijn op aanvraag en in overleg. Mail naar <a href="mailto:info@luxique.nl">info@luxique.nl</a> of laat Loenique je helpen kiezen.</p>
            <button className="close-d" data-close>↑ Sluit dagprogramma</button>
          </div>
        </div>
      </div>

      {/* ===== DETAIL: MEDUSA ===== */}
      <div className="detail" id="d-medusa">
        <div className="detail-inner">
          <div className="wrap">
            <span className="eyebrow">2-daagse masterclass · Intermediate</span>
            <h3 className="serif">Medusa Masterclass</h3>
            <p className="dlead">De Medusa Set is een uitgesproken, gestructureerde styling waarbij strategisch geplaatste spikes, textuur, lagen en L-curls samenkomen tot een krachtige, liftende en opvallende look. Deze cursus is volledig gericht op het beheersen van die techniek.</p>
            <div className="req">
              <svg viewBox="0 0 24 24" fill="none" stroke="#D8B97A" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
              <div>
                <div className="rt">Vereiste voorkennis</div>
                <p>Je bent een ervaren lash tech met minimaal een one by one certificaat. Volume-beheersing (certificaat) is niet per se nodig. Ben je geen ervaren lash tech of heb je geen one by one certificaat, dan kun je deze cursus niet volgen.</p>
              </div>
            </div>
            <div className="days">
              <div className="day">
                <div className="day-h"><span className="day-num">Dag 1</span><span className="day-t serif">Fundament &amp; demonstratie</span></div>
                <div className="day-d">Theorie en techniek: van Medusa mapping tot L-curl specialisatie, afgesloten met een live demonstratie op model.</div>
                <div className="day-cols">
                  <div className="col"><div className="col-h">Medusa mapping</div><ul>
                    <li>Opbouw van de Medusa Set</li>
                    <li>Lengteverhoudingen</li>
                    <li>Plaatsing van spikes</li>
                    <li>Verdeling van textuur</li>
                    <li>Werken met lagen</li>
                    <li>Symmetrie binnen de styling</li>
                  </ul></div>
                  <div className="col"><div className="col-h">L-curl specialisatie &amp; bottom lashes</div><ul>
                    <li>Werken met de volledige L-curl lijn</li>
                    <li>Verschillen tussen de diverse L-curls</li>
                    <li>Wanneer welke krul wordt toegepast</li>
                    <li>Liftende effecten creëren</li>
                    <li>Bottom lashes: plaatsing, lengte &amp; balans</li>
                  </ul></div>
                </div>
              </div>
              <div className="day">
                <div className="day-h"><span className="day-num">Dag 1</span><span className="day-t serif">Oefenen &amp; live demonstratie</span></div>
                <div className="day-cols">
                  <div className="col"><div className="col-h">Oefenen op trainingshoofd</div><ul>
                    <li>Mapping tekenen</li>
                    <li>Plaatsing oefenen</li>
                    <li>Structuur begrijpen</li>
                    <li>Techniek verfijnen</li>
                  </ul></div>
                  <div className="col"><div className="col-h">Live demonstratie op model</div><ul>
                    <li>Waarom bepaalde keuzes worden gemaakt</li>
                    <li>Hoe de mapping wordt opgebouwd</li>
                    <li>Hoe de textuur wordt gecreëerd</li>
                    <li>Hoe de set in balans blijft</li>
                  </ul></div>
                </div>
              </div>
              <div className="day">
                <div className="day-h"><span className="day-num">Dag 2</span><span className="day-t serif">Modeldag · praktijk</span></div>
                <div className="day-d">Je voert zelfstandig een volledige Medusa Set uit op een model, met persoonlijke begeleiding en feedback gedurende de dag.</div>
                <div className="day-cols one"><div className="col"><ul>
                  <li>Consult uitvoeren</li>
                  <li>Mapping maken</li>
                  <li>Werken met de Medusa-techniek</li>
                  <li>L-curls toepassen</li>
                  <li>Textuur opbouwen</li>
                  <li>Bottom lashes plaatsen</li>
                  <li>Set afwerken en perfectioneren</li>
                </ul></div></div>
              </div>
            </div>
            <div className="incl-block">
              <div>
                <h4 className="serif">Inclusief</h4>
                <ul className="incl-grid">
                  <li>2 volledige lesdagen</li>
                  <li>Starterskit</li>
                  <li>Lunch op beide dagen</li>
                  <li>Lesmateriaal</li>
                  <li>Praktijkbegeleiding</li>
                  <li>Demonstratie op live model</li>
                  <li>Modeldag</li>
                  <li>Medusa Masterclass certificaat</li>
                </ul>
              </div>
              <div className="invest">
                <div className="lab">Investering</div>
                <div className="amt serif">€1.000</div>
                <div className="vat">excl. btw · €1.210 incl. btw</div>
                <div className="pay">Na afloop kun je zelfstandig een professionele Medusa Set uitvoeren en deze als gespecialiseerde behandeling aanbieden binnen jouw salon.</div>
              </div>
            </div>
            <div className="btn-row">
              <a href="mailto:info@luxique.nl?subject=Aanvraag%20traject" className="btn">Vraag dit traject aan</a>
              <button className="btn ghost" data-loenique>Vraag het Loenique</button>
            </div>
            <p className="aanvraag-note">Trajecten zijn op aanvraag en in overleg. Mail naar <a href="mailto:info@luxique.nl">info@luxique.nl</a> of laat Loenique je helpen kiezen.</p>
            <button className="close-d" data-close>↑ Sluit dagprogramma</button>
          </div>
        </div>
      </div>

      {/* ===== DETAIL: TECH TO ARTIST ===== */}
      <div className="detail" id="d-tech">
        <div className="detail-inner">
          <div className="wrap">
            <span className="eyebrow">3-daagse omscholing · 2 modeldagen · Pro</span>
            <h3 className="serif">Lash Tech to Artist</h3>
            <p className="dlead">Voor lash techs die technisch al sets kunnen plaatsen, maar willen doorgroeien naar een échte lash artist die volledig op maat kan stylen, corrigeren en ontwerpen.</p>
            <div className="req">
              <svg viewBox="0 0 24 24" fill="none" stroke="#D8B97A" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
              <div>
                <div className="rt">Vereiste voorkennis</div>
                <p>Je beheerst de one by one én Russian volume techniek goed. Deze technieken worden tijdens de cursus niet opnieuw behandeld. Voldoe je hier bij aanvang niet aan, dan kan de cursus worden stopgezet zonder restitutie — dit is je eigen verantwoordelijkheid.</p>
              </div>
            </div>
            <div className="days">
              <div className="day">
                <div className="day-h"><span className="day-num">Dag 1</span><span className="day-t serif">Wispy styling &amp; texture · modeldag</span></div>
                <div className="day-cols">
                  <div className="col"><div className="col-h">Theorie</div><ul>
                    <li>Lash Tech vs Lash Artist</li>
                    <li>Werken met lagen</li>
                    <li>Texture creëren</li>
                    <li>Wispy styling begrijpen</li>
                    <li>Verschillende soorten spikes</li>
                    <li>Lengteverhoudingen &amp; plaatsing van textuur</li>
                    <li>Balans binnen een wispy set</li>
                  </ul></div>
                  <div className="col"><div className="col-h">Praktijk op model</div><ul>
                    <li>Wispy mapping maken</li>
                    <li>Werken met lagen</li>
                    <li>Texture opbouwen</li>
                    <li>Spikes plaatsen</li>
                    <li>Complete customised wispy set</li>
                  </ul></div>
                </div>
              </div>
              <div className="day">
                <div className="day-h"><span className="day-num">Dag 2</span><span className="day-t serif">De kunst van customisation</span></div>
                <div className="day-d">Uitgebreide theoriedag: van ooganalyse tot consultatie.</div>
                <div className="day-cols">
                  <div className="col"><div className="col-h">Analyse</div><ul>
                    <li>Ooganalyse: vormen, standen &amp; oogleden</li>
                    <li>Sterke en zwakke punten herkennen</li>
                    <li>Styling: Fox, Squirrel, Open, Doll &amp; Wispy</li>
                    <li>Gezichtsanalyse &amp; balans met lashes</li>
                  </ul></div>
                  <div className="col"><div className="col-h">Correctie &amp; curls</div><ul>
                    <li>Symmetrie creëren, asymmetrie corrigeren</li>
                    <li>Hangende ogen &amp; kleine ogen optisch corrigeren</li>
                    <li>J, B, C, CC, L &amp; M curl en hun functie</li>
                    <li>Professionele intake &amp; consultatie</li>
                  </ul></div>
                </div>
              </div>
              <div className="day">
                <div className="day-h"><span className="day-num">Dag 3</span><span className="day-t serif">Volledige artist-transformatie · modeldag</span></div>
                <div className="day-d">De student voert zelfstandig een volledige customised set uit.</div>
                <div className="day-cols">
                  <div className="col"><div className="col-h">Werkwijze</div><ul>
                    <li>Consult &amp; ooganalyse uitvoeren</li>
                    <li>Gezicht analyseren &amp; correcties bepalen</li>
                    <li>Styling kiezen &amp; mapping ontwerpen</li>
                    <li>Complete set plaatsen</li>
                  </ul></div>
                  <div className="col"><div className="col-h">Content &amp; editing</div><ul>
                    <li>Before &amp; after foto's en video</li>
                    <li>Belichting &amp; filmen voor IG/TikTok</li>
                    <li>Basis videobewerking &amp; reels maken</li>
                    <li>Professionele before/after content</li>
                  </ul></div>
                </div>
              </div>
            </div>
            <div className="incl-block">
              <div>
                <h4 className="serif">Inclusief</h4>
                <ul className="incl-grid">
                  <li>3 volledige lesdagen</li>
                  <li>2 modeldagen</li>
                  <li>Lunch op alle dagen</li>
                  <li>Lesmateriaal</li>
                  <li>Persoonlijke begeleiding</li>
                  <li>Content &amp; editing training</li>
                  <li>Lash Tech to Artist certificaat</li>
                </ul>
              </div>
              <div className="invest">
                <div className="lab">Investering</div>
                <div className="amt serif">€1.200</div>
                <div className="vat">excl. btw · €1.452 incl. btw</div>
                <div className="pay">Certificaat als bewijs van ooganalyse, correctief stylen, customisation, wispy technieken &amp; artist-level consultatie.</div>
              </div>
            </div>
            <div className="btn-row">
              <a href="mailto:info@luxique.nl?subject=Aanvraag%20traject" className="btn">Vraag dit traject aan</a>
              <button className="btn ghost" data-loenique>Vraag het Loenique</button>
            </div>
            <p className="aanvraag-note">Trajecten zijn op aanvraag en in overleg. Mail naar <a href="mailto:info@luxique.nl">info@luxique.nl</a> of laat Loenique je helpen kiezen.</p>
            <button className="close-d" data-close>↑ Sluit dagprogramma</button>
          </div>
        </div>
      </div>

      {/* ===== DISCLAIMER ===== */}
      <section className="disclaimer">
        <div className="wrap">
          <div className="disc-card reveal">
            <span className="eyebrow">Goed om te weten</span>
            <h2 className="serif">Het kiezen van het juiste niveau is erg belangrijk</h2>
            <p>Onze trajecten bouwen voort op een bepaald startniveau. Bij de specialisatie- en doorgroeitrajecten (Wispy, Medusa en Lash Tech to Artist) gaan we ervan uit dat je de vereiste basistechnieken al beheerst — deze worden tijdens de cursus niet opnieuw behandeld.</p>
            <p>Het goed inschatten van jouw eigen niveau is jouw verantwoordelijkheid. <b>Mochten we tijdens de cursus constateren dat je niet aan het vereiste niveau voldoet, dan kan de cursus worden stopgezet zonder restitutie van het cursusbedrag.</b></p>
            <p>Twijfel je of je aan de voorwaarden voldoet? Neem dan eerst contact op, plan de kennismakingsworkshop, of laat Loenique met je meedenken. We adviseren je graag eerlijk over het juiste startpunt — zodat je traject vanaf dag één bij je past.</p>
            <div className="cta-btns" style={{marginTop:'24px'}}>
              <a href="mailto:info@luxique.nl?subject=Vraag%20over%20niveau%20en%20trajecten" className="btn" style={{width:'auto',padding:'14px 28px'}}>Neem contact op</a>
              <button className="btn ghost" data-loenique style={{width:'auto',padding:'14px 28px'}}>Vraag het Loenique</button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta">
        <div className="wrap">
          <h2 className="serif reveal">Niet zeker welk traject<br /><em>bij je past?</em></h2>
          <p className="reveal">Loenique, onze chatbot, denkt met je mee — welk traject past bij jouw niveau, of hoe je er meerdere combineert tot één route op maat. Liever direct contact? Mail naar info@luxique.nl.</p>
          <div className="cta-btns reveal">
            <button className="btn" data-loenique>Vraag het Loenique</button>
            <a href="mailto:info@luxique.nl?subject=Vraag%20over%20trajecten" className="btn ghost-light">Mail info@luxique.nl</a>
          </div>
        </div>
      </section>
    </div>
  )
}
