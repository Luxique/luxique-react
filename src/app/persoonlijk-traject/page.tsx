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

    // open/close dagprogramma's (één tegelijk)
    function closeAll() {
      root!.querySelectorAll('.detail').forEach((d: Element) => d.classList.remove('open'))
    }

    const openBtns = root.querySelectorAll('[data-open]')
    const closeBtns = root.querySelectorAll('[data-close]')
    
    openBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = 'd-' + (btn as HTMLElement).dataset.open
        const target = root.querySelector('#' + id)
        const wasOpen = target?.classList.contains('open')
        closeAll()
        if (!wasOpen) {
          target?.classList.add('open')
          setTimeout(() => target?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
        }
      })
    })

    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const d = btn.closest('.detail')
        d?.classList.remove('open')
        root.querySelector('.levels-intro')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })

    // Loenique chatbot buttons
    const luxBtns = root.querySelectorAll('[data-loenique]')
    luxBtns.forEach(btn => {
      btn.addEventListener('click', () => window.dispatchEvent(new Event('open-loenique-chat')))
    })

    return () => {
      io.disconnect()
    }
  }, [])

  return (
    <>
      <Navbar />
      <div ref={rootRef}>
        <style>{`
  :root{
    --bg:#F3EFE7; --panel:#FBF8F2; --ink:#1C1814; --ink-soft:#46403A;
    --gold:#B08D4F; --gold-soft:#C9A86A; --gold-bright:#D8B97A;
    --line:rgba(28,24,20,.13); --line-soft:rgba(28,24,20,.07);
    --dark2:#0e0b09; --on-dark:#F6F1E7; --on-dark-soft:rgba(246,241,231,.62);
    --green1:#2a3128; --green-deep:#141811;
    /* verfijnde "wel/niet" tinten — passend bij luxe palet, geen fel rood/groen */
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

  /* ===== WORKSHOP — START HIER ===== */
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
  .level{padding:34px 0 6px}
  .level-head{display:flex;align-items:center;gap:18px;margin-bottom:26px}
  .level-badge{display:inline-flex;align-items:center;gap:10px;font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;
    font-weight:600;color:var(--gold);white-space:nowrap}
  .level-badge .dot{display:flex;gap:4px}
  .level-badge .dot i{width:7px;height:7px;border-radius:50%;background:var(--gold);display:block;opacity:.3}
  .level-badge.l1 .dot i:nth-child(1){opacity:1}
  .level-badge.l2 .dot i:nth-child(1),.level-badge.l2 .dot i:nth-child(2){opacity:1}
  .level-badge.l3 .dot i{opacity:1}
  .level-line{flex:1;height:1px;background:var(--line)}
  .level-note{font-size:.86rem;color:var(--ink-soft);font-style:italic;white-space:nowrap}

  /* ===== TRAJECT-KAARTEN ===== */
  .tracks-grid{display:grid;gap:22px;align-items:stretch}
  .tracks-grid.two{grid-template-columns:repeat(2,1fr)}
  .tracks-grid.one{grid-template-columns:1fr;max-width:560px}
  .track{position:relative;display:flex;flex-direction:column;background:var(--panel);border:1px solid var(--line);
    border-radius:22px;padding:34px 30px 30px;transition:transform .5s cubic-bezier(.16,1,.3,1),box-shadow .5s,border-color .5s}
  .track:hover{transform:translateY(-6px);box-shadow:0 30px 60px -34px rgba(28,24,20,.4);border-color:rgba(176,141,79,.4)}
  .track.feat{background:linear-gradient(180deg,#221d16,var(--dark2));border-color:rgba(216,185,122,.4);color:var(--on-dark)}
  .track.feat .t-sub{color:var(--on-dark-soft)}
  .track.feat .incl li{color:var(--on-dark-soft)}
  .badge{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--gold);color:var(--dark2);
    font-size:.66rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;padding:6px 16px;border-radius:100px;white-space:nowrap}
  .t-dur{font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);font-weight:500;margin-bottom:12px}
  .track.feat .t-dur{color:var(--gold-bright)}
  .t-name{font-family:'Cormorant Garamond',serif;font-size:1.95rem;font-weight:600;line-height:1.05;margin-bottom:6px}
  .t-sub{font-size:.92rem;color:var(--ink-soft);margin-bottom:20px;min-height:2.6em}
  .t-price{display:flex;align-items:baseline;gap:8px;margin-bottom:4px}
  .t-price .amt{font-family:'Cormorant Garamond',serif;font-size:2.4rem;font-weight:600;color:var(--gold)}
  .track.feat .t-price .amt{color:var(--gold-bright)}
  .t-price .vat{font-size:.82rem;color:var(--ink-soft)}
  .track.feat .t-price .vat{color:var(--on-dark-soft)}
  .t-incl-vat{font-size:.8rem;color:var(--ink-soft);margin-bottom:22px}
  .track.feat .t-incl-vat{color:var(--on-dark-soft)}

  /* voor wie / niet voor wie */
  .fitbox{border-radius:14px;overflow:hidden;border:1px solid var(--line);margin-bottom:22px}
  .fit,.nofit{padding:13px 16px 13px 16px;display:flex;gap:11px;align-items:flex-start;font-size:.86rem;line-height:1.45}
  .fit{background:var(--fit-bg);color:var(--ink)}
  .nofit{background:var(--nofit-bg);color:var(--ink);border-top:1px solid var(--line-soft)}
  .track.feat .fit{color:var(--on-dark)}
  .track.feat .nofit{color:var(--on-dark)}
  .fit-ic{flex-shrink:0;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-top:1px}
  .fit .fit-ic{background:var(--fit-line)}
  .nofit .fit-ic{background:var(--nofit-line)}
  .fit-ic svg{width:11px;height:11px;display:block}
  .fit b,.nofit b{font-weight:600}
  .fit .lab,.nofit .lab{display:block;font-size:.66rem;letter-spacing:.14em;text-transform:uppercase;font-weight:600;margin-bottom:3px}
  .fit .lab{color:var(--fit)}
  .nofit .lab{color:var(--nofit)}

  .incl{list-style:none;display:flex;flex-direction:column;gap:9px;margin-bottom:26px;flex:1}
  .incl li{position:relative;padding-left:26px;font-size:.92rem;color:var(--ink-soft)}
  .incl li::before{content:"";position:absolute;left:0;top:7px;width:14px;height:14px;border-radius:50%;
    background:rgba(176,141,79,.16);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23B08D4F' stroke-width='3'%3E%3Cpath d='M5 12l4 4L19 7'/%3E%3C/svg%3E");background-size:9px;background-repeat:no-repeat;background-position:center}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:15px 22px;border-radius:100px;
    background:var(--ink);color:var(--panel);font-size:.92rem;font-weight:500;letter-spacing:.02em;text-decoration:none;
    border:0;cursor:pointer;transition:background .3s,transform .3s}
  .btn:hover{transform:translateY(-2px)}
  .track.feat .btn{background:var(--gold);color:var(--dark2)}
  .btn.ghost{background:transparent;color:var(--ink);border:1px solid var(--line)}
  .track.feat .btn.ghost{color:var(--on-dark);border-color:rgba(246,241,231,.3)}
  .start-btns .btn{width:auto}
  .start-btns .btn.ghost{color:var(--on-dark);border-color:rgba(246,241,231,.3)}

  /* ===== DAGPROGRAMMA (uitklapbaar per traject) ===== */
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

  @media(max-width:900px){
    .tracks-grid.two{grid-template-columns:1fr;gap:30px;max-width:460px;margin:0 auto}
    .start-card{grid-template-columns:1fr}
    .start-r{border-left:0;border-top:1px solid rgba(246,241,231,.1)}
    .day-cols{grid-template-columns:1fr;gap:20px}
    .incl-block{grid-template-columns:1fr;gap:20px}
    .incl-grid{grid-template-columns:1fr}
    .hero{padding:110px 0 60px}
    .level-note{display:none}
  }
`}</style>
        <div className="pt-page">
          <section className="hero">
              <div className="wrap">
                <span className="eyebrow reveal">In-person bij Chiva · Op locatie mogelijk</span>
                <h1 className="serif reveal">Jouw <em>persoonlijk</em><br />traject</h1>
                <p className="reveal">Een traject is een opleiding in het echt, bij Chiva — niet in een klas vol mensen, maar in de kleinste setting die er is: maximaal 1 op 2, of volledig 1 op 1. Je leert in jouw tempo, en als je wilt zelfs in je eigen salon. Hieronder vind je per niveau het juiste traject — van je allereerste set tot specialisatie op artist-niveau.</p>
                <div className="scroll-cue reveal">↓ Ontdek jouw route</div>
              </div>
            </section>
          
            
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
          
            
            <section className="levels-intro">
              <div className="wrap">
                <div className="reveal">
                  <h2 className="serif">Vind jouw <em>niveau</em></h2>
                  <p>Elk traject vraagt een ander startpunt. Lees bij elk traject goed wie het wél en niet voor is — zo weet je zeker dat je op de juiste plek begint vóórdat je contact opneemt. Twijfel je nog? Begin met de kennismakingsworkshop hierboven, of laat Loenique je helpen kiezen.</p>
                </div>
              </div>
            </section>
          
            
            <section className="level">
              <div className="wrap">
                <div className="level-head reveal">
                  <span className="level-badge l1"><span className="dot"><i></i><i></i><i></i></span>Beginner</span>
                  <span className="level-line"></span>
                  <span className="level-note">Geen ervaring nodig — je start bij de basis</span>
                </div>
                <div className="tracks-grid one reveal">
          
                  
                  <div className="track">
                    <div className="t-dur">4 dagen · Volledige basisopleiding</div>
                    <div className="t-name serif">Beginner Lash Artist</div>
                    <div className="t-sub">De volledige basis van wimperextensions — een sterke, professionele fundering vanaf nul.</div>
                    <div className="t-price"><span className="amt serif">€1.650</span><span className="vat">excl. btw</span></div>
                    <div className="t-incl-vat">Incl. professioneel starterpakket</div>
                    <div className="fitbox">
                      <div className="fit">
                        <span className="fit-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#5C6B4E" strokeWidth="3.2"><path d="M5 12l4 4L19 7"/></svg></span>
                        <span><span className="lab">Dit traject past bij jou als</span>je <b>nog geen of nauwelijks ervaring</b> hebt en vanaf de basis een professionele lash-opleiding wilt volgen. Geen voorkennis vereist.</span>
                      </div>
                      <div className="nofit">
                        <span className="fit-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#9B5B47" strokeWidth="3.2"><path d="M6 6l12 12M18 6L6 18"/></svg></span>
                        <span><span className="lab">Minder geschikt als</span>je al ervaren bent en zelfstandig sets plaatst — dan sluit een specialisatie of doorgroeitraject beter aan.</span>
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
          
                </div>
              </div>
            </section>
          
            
            <section className="level">
              <div className="wrap">
                <div className="level-head reveal">
                  <span className="level-badge l2"><span className="dot"><i></i><i></i><i></i></span>Intermediate</span>
                  <span className="level-line"></span>
                  <span className="level-note">Je werkt al met extensions — nu specialiseren</span>
                </div>
                <div className="tracks-grid two">
          
                  
                  <div className="track reveal">
                    <div className="t-dur">1 dag · Specialisatie</div>
                    <div className="t-name serif">Wispy Masterclass</div>
                    <div className="t-sub">Specialiseer je in wispy styling, spikes en wet sets.</div>
                    <div className="t-price"><span className="amt serif">€500</span><span className="vat">excl. btw</span></div>
                    <div className="t-incl-vat">€605 incl. btw</div>
                    <div className="fitbox">
                      <div className="fit">
                        <span className="fit-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#5C6B4E" strokeWidth="3.2"><path d="M5 12l4 4L19 7"/></svg></span>
                        <span><span className="lab">Dit traject past bij jou als</span>je de <b>one by one én Russian volume techniek goed beheerst</b> en je wilt specialiseren in wispy styling.</span>
                      </div>
                      <div className="nofit">
                        <span className="fit-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#9B5B47" strokeWidth="3.2"><path d="M6 6l12 12M18 6L6 18"/></svg></span>
                        <span><span className="lab">Niet geschikt als</span>je one by one of Russian volume <b>nog niet onder de knie</b> hebt. Deze technieken worden tijdens de cursus niet opnieuw behandeld.</span>
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
          
                  
                  <div className="track reveal">
                    <div className="t-dur">2 dagen · Specialisatie</div>
                    <div className="t-name serif">Medusa Masterclass</div>
                    <div className="t-sub">Beheers de kenmerkende Medusa-styling: spikes, textuur, lagen en L-curls.</div>
                    <div className="t-price"><span className="amt serif">€1.000</span><span className="vat">excl. btw</span></div>
                    <div className="t-incl-vat">€1.210 incl. btw</div>
                    <div className="fitbox">
                      <div className="fit">
                        <span className="fit-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#5C6B4E" strokeWidth="3.2"><path d="M5 12l4 4L19 7"/></svg></span>
                        <span><span className="lab">Dit traject past bij jou als</span>je een <b>ervaren lash tech</b> bent met minimaal een <b>one by one certificaat</b>. Volume-beheersing is mooi meegenomen, maar niet verplicht.</span>
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
          
                </div>
              </div>
            </section>
          
            
            <section className="level">
              <div className="wrap">
                <div className="level-head reveal">
                  <span className="level-badge l3"><span className="dot"><i></i><i></i><i></i></span>Pro</span>
                  <span className="level-line"></span>
                  <span className="level-note">Je plaatst al sets — groei door naar artist</span>
                </div>
                <div className="tracks-grid one reveal">
          
                  
                  <div className="track feat">
                    <span className="badge">Meest gekozen</span>
                    <div className="t-dur">3 dagen · 2 modeldagen · Omscholing</div>
                    <div className="t-name serif">Lash Tech to Artist</div>
                    <div className="t-sub">Van technisch sets plaatsen naar volledig op maat stylen, corrigeren en ontwerpen.</div>
                    <div className="t-price"><span className="amt serif">€1.200</span><span className="vat">excl. btw</span></div>
                    <div className="t-incl-vat">€1.452 incl. btw</div>
                    <div className="fitbox">
                      <div className="fit">
                        <span className="fit-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#5C6B4E" strokeWidth="3.2"><path d="M5 12l4 4L19 7"/></svg></span>
                        <span><span className="lab">Dit traject past bij jou als</span>je de <b>one by one én Russian volume techniek goed beheerst</b> en wilt doorgroeien van lash tech naar een échte lash artist.</span>
                      </div>
                      <div className="nofit">
                        <span className="fit-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#9B5B47" strokeWidth="3.2"><path d="M6 6l12 12M18 6L6 18"/></svg></span>
                        <span><span className="lab">Niet geschikt als</span>je one by one of Russian volume <b>nog niet beheerst</b>. Deze basistechnieken worden tijdens de cursus niet opnieuw behandeld.</span>
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
          
            
            <section className="disclaimer">
              <div className="wrap">
                <div className="disc-card reveal">
                  <span className="eyebrow">Goed om te weten</span>
                  <h2 className="serif">Het juiste niveau is jouw verantwoordelijkheid</h2>
                  <p>Onze trajecten bouwen voort op een bepaald startniveau. Bij de specialisatie- en doorgroeitrajecten (Wispy, Medusa en Lash Tech to Artist) gaan we ervan uit dat je de vereiste basistechnieken al beheerst — deze worden tijdens de cursus niet opnieuw behandeld.</p>
                  <p><b>Mochten we tijdens de cursus constateren dat je niet aan het vereiste niveau voldoet, dan kan de cursus worden stopgezet zonder restitutie van het cursusbedrag.</b> Het inschatten van je eigen niveau is je eigen verantwoordelijkheid.</p>
                  <p>Twijfel je of je aan de voorwaarden voldoet? Neem dan eerst contact op via <a href="mailto:info@luxique.nl" style={{ color: 'var(--gold)' }}>info@luxique.nl</a>, plan de kennismakingsworkshop, of laat Loenique met je meedenken. We adviseren je graag eerlijk over het juiste startpunt — zodat je traject vanaf dag één bij je past.</p>
                </div>
              </div>
            </section>
          
            
            <section className="cta">
              <div className="wrap">
                <h2 className="serif reveal">Niet zeker welk traject<br /><em>bij je past?</em></h2>
                <p className="reveal">Lux, onze chatbot, denkt met je mee — welk traject past bij jouw niveau, of hoe je er meerdere combineert tot één route op maat. Liever direct contact? Mail naar info@luxique.nl.</p>
                <div className="cta-btns reveal">
                  <button className="btn" data-loenique>Vraag het Loenique</button>
                  <a href="mailto:info@luxique.nl?subject=Vraag%20over%20trajecten" className="btn ghost-light">Mail info@luxique.nl</a>
                </div>
              </div>
            </section>
        </div>
      </div>
    </>
  )
}
