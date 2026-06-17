'use client'

import { useEffect, useRef } from 'react'
import Navbar from '@/components/Navbar'

export default function PersoonlijkTrajectPage() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    // Reveal on scroll
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
    }), { threshold: 0.14 })
    root.querySelectorAll('.reveal').forEach(el => io.observe(el))

    // Open/close dagprogramma's (één tegelijk)
    const closeAll = () => root.querySelectorAll('.pt-detail').forEach((d: Element) => d.classList.remove('open'))

    const openBtns = root.querySelectorAll('[data-open]')
    const handlers: Array<{ el: Element; fn: EventListener }> = []

    openBtns.forEach(btn => {
      const fn: EventListener = () => {
        const id = 'd-' + (btn as HTMLElement).dataset.open
        const target = root.querySelector('#' + id)
        const wasOpen = target?.classList.contains('open')
        closeAll()
        if (!wasOpen && target) {
          target.classList.add('open')
          setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
        }
      }
      btn.addEventListener('click', fn)
      handlers.push({ el: btn, fn })
    })

    const closeBtns = root.querySelectorAll('[data-close]')
    closeBtns.forEach(btn => {
      const fn: EventListener = () => {
        const d = btn.closest('.pt-detail')
        d?.classList.remove('open')
        root.querySelector('.pt-tracks')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      btn.addEventListener('click', fn)
      handlers.push({ el: btn, fn })
    })

    // Lux chatbot buttons
    const luxBtns = root.querySelectorAll('[data-lux]')
    luxBtns.forEach(btn => {
      const fn: EventListener = () => window.dispatchEvent(new Event('open-lux-chat'))
      btn.addEventListener('click', fn)
      handlers.push({ el: btn, fn })
    })

    return () => {
      io.disconnect()
      handlers.forEach(({ el, fn }) => el.removeEventListener('click', fn))
    }
  }, [])

  return (
    <>
      <Navbar />
      <div ref={rootRef}>
        <style>{`
          .pt-page{
            --bg:#F3EFE7;--panel:#FBF8F2;--ink:#1C1814;--ink-soft:#46403A;
            --gold:#B08D4F;--gold-soft:#C9A86A;--gold-bright:#D8B97A;
            --line:rgba(28,24,20,.13);--line-soft:rgba(28,24,20,.07);
            --dark2:#0e0b09;--on-dark:#F6F1E7;--on-dark-soft:rgba(246,241,231,.62);
            --green1:#2a3128;--green-deep:#141811;
            background:var(--bg);color:var(--ink);
            font-family:'Jost',sans-serif;font-size:1.04rem;line-height:1.6;
            -webkit-font-smoothing:antialiased;
          }
          .pt-page .wrap{max-width:1180px;margin:0 auto;padding:0 28px}
          .pt-page .serif{font-family:'Cormorant Garamond',serif}
          .pt-page em{font-style:italic}
          .pt-page .eyebrow{font-size:.74rem;text-transform:uppercase;letter-spacing:.24em;color:var(--gold);font-weight:500}
          .pt-page .reveal{opacity:0;transform:translateY(24px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
          .pt-page .reveal.in{opacity:1;transform:none}
          @media(prefers-reduced-motion:reduce){.pt-page .reveal{opacity:1;transform:none}}

          /* HERO */
          .pt-hero{position:relative;padding:140px 0 80px;text-align:center;overflow:hidden;background:radial-gradient(120% 80% at 50% 0%,rgba(176,141,79,.1),transparent 55%)}
          .pt-hero .eyebrow{display:inline-flex;align-items:center;gap:10px;margin-bottom:22px}
          .pt-hero .eyebrow::before,.pt-hero .eyebrow::after{content:"";width:30px;height:1px;background:linear-gradient(90deg,transparent,var(--gold))}
          .pt-hero .eyebrow::after{background:linear-gradient(90deg,var(--gold),transparent)}
          .pt-hero h1{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:clamp(3rem,7vw,5.6rem);line-height:.98;letter-spacing:.01em;margin-bottom:24px;margin-top:0}
          .pt-hero h1 em{color:var(--gold)}
          .pt-hero p{max-width:60ch;margin:0 auto;color:var(--ink-soft);font-size:1.1rem}
          .pt-hero .scroll-cue{margin-top:46px;font-size:.78rem;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);opacity:.8}

          /* INTRO */
          .pt-intro{padding:30px 0 70px}
          .pt-intro-inner{max-width:760px;margin:0 auto;text-align:center}
          .pt-intro h2{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:clamp(1.8rem,3.4vw,2.6rem);line-height:1.15;margin-bottom:18px;margin-top:0}
          .pt-intro p{color:var(--ink-soft)}

          /* TRACKS */
          .pt-tracks{padding:30px 0 40px}
          .pt-tracks-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;align-items:stretch}
          .pt-track{position:relative;display:flex;flex-direction:column;background:var(--panel);border:1px solid var(--line);border-radius:22px;padding:34px 28px 30px;transition:transform .5s cubic-bezier(.16,1,.3,1),box-shadow .5s,border-color .5s}
          .pt-track:hover{transform:translateY(-6px);box-shadow:0 30px 60px -34px rgba(28,24,20,.4);border-color:rgba(176,141,79,.4)}
          .pt-track.feat{background:linear-gradient(180deg,#221d16,var(--dark2));border-color:rgba(216,185,122,.4);color:var(--on-dark)}
          .pt-track.feat .t-sub,.pt-track.feat .t-for{color:var(--on-dark-soft)}
          .pt-track.feat .incl li{color:var(--on-dark-soft)}
          .pt-badge{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--gold);color:var(--dark2);font-size:.66rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;padding:6px 16px;border-radius:100px;white-space:nowrap}
          .t-dur{font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);font-weight:500;margin-bottom:12px}
          .pt-track.feat .t-dur{color:var(--gold-bright)}
          .t-name{font-family:'Cormorant Garamond',serif;font-size:1.95rem;font-weight:600;line-height:1.05;margin-bottom:6px}
          .t-sub{font-size:.92rem;color:var(--ink-soft);margin-bottom:20px;min-height:2.6em}
          .t-price{display:flex;align-items:baseline;gap:8px;margin-bottom:4px}
          .t-price .amt{font-family:'Cormorant Garamond',serif;font-size:2.4rem;font-weight:600;color:var(--gold)}
          .pt-track.feat .t-price .amt{color:var(--gold-bright)}
          .t-price .vat{font-size:.82rem;color:var(--ink-soft)}
          .pt-track.feat .t-price .vat{color:var(--on-dark-soft)}
          .t-incl-vat{font-size:.8rem;color:var(--ink-soft);margin-bottom:22px}
          .pt-track.feat .t-incl-vat{color:var(--on-dark-soft)}
          .t-for{font-size:.9rem;color:var(--ink-soft);padding:16px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin-bottom:20px}
          .pt-track.feat .t-for{border-color:rgba(246,241,231,.14)}
          .t-for b{color:inherit;font-weight:600}
          .incl{list-style:none;display:flex;flex-direction:column;gap:9px;margin-bottom:26px;flex:1;padding:0}
          .incl li{position:relative;padding-left:26px;font-size:.92rem;color:var(--ink-soft)}
          .incl li::before{content:"";position:absolute;left:0;top:7px;width:14px;height:14px;border-radius:50%;background:rgba(176,141,79,.16);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23B08D4F' stroke-width='3'%3E%3Cpath d='M5 12l4 4L19 7'/%3E%3C/svg%3E");background-size:9px;background-repeat:no-repeat;background-position:center}
          .pt-btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:15px 22px;border-radius:100px;background:var(--ink);color:var(--panel);font-size:.92rem;font-weight:500;letter-spacing:.02em;text-decoration:none;border:0;cursor:pointer;transition:background .3s,transform .3s}
          .pt-btn:hover{transform:translateY(-2px)}
          .pt-track.feat .pt-btn{background:var(--gold);color:var(--dark2)}
          .pt-btn.ghost{background:transparent;color:var(--ink);border:1px solid var(--line)}
          .pt-track.feat .pt-btn.ghost{color:var(--on-dark);border-color:rgba(246,241,231,.3)}

          /* DETAIL */
          .pt-detail{background:var(--dark2);color:var(--on-dark);overflow:hidden;max-height:0;transition:max-height .6s cubic-bezier(.16,1,.3,1)}
          .pt-detail.open{max-height:6000px}
          .pt-detail-inner{padding:80px 0 90px;position:relative;background:radial-gradient(110% 70% at 50% 0%,rgba(176,141,79,.12),transparent 55%)}
          .pt-detail .eyebrow{color:var(--gold-bright)}
          .pt-detail h3{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:clamp(2.2rem,4.5vw,3.4rem);line-height:1;margin:14px 0 10px;margin-top:0}
          .pt-detail .dlead{color:var(--on-dark-soft);max-width:60ch;margin-bottom:46px}
          .days{display:flex;flex-direction:column;gap:18px;margin-bottom:46px}
          .day{background:rgba(246,241,231,.04);border:1px solid rgba(246,241,231,.1);border-radius:18px;padding:28px 30px;transition:border-color .4s,background .4s}
          .day:hover{border-color:rgba(216,185,122,.32);background:rgba(246,241,231,.055)}
          .day-h{display:flex;align-items:baseline;gap:16px;margin-bottom:8px}
          .day-num{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1.3rem;color:var(--gold-bright);white-space:nowrap}
          .day-t{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:500}
          .day-d{color:var(--on-dark-soft);font-size:.94rem;margin-bottom:16px}
          .day-cols{display:grid;grid-template-columns:1fr 1fr;gap:28px}
          .day-cols.one{grid-template-columns:1fr}
          .col-h{font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin-bottom:12px;font-weight:600}
          .col ul{list-style:none;display:flex;flex-direction:column;gap:7px;padding:0}
          .col li{position:relative;padding-left:18px;font-size:.9rem;color:var(--on-dark-soft);line-height:1.5}
          .col li::before{content:"";position:absolute;left:0;top:9px;width:5px;height:5px;border-radius:50%;background:var(--gold)}
          .incl-block{display:grid;grid-template-columns:1.3fr 1fr;gap:30px;align-items:start;background:rgba(246,241,231,.04);border:1px solid rgba(246,241,231,.1);border-radius:18px;padding:30px 34px;margin-bottom:30px}
          .incl-block h4{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:500;margin-bottom:14px;margin-top:0}
          .incl-grid{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:0}
          .incl-grid li{position:relative;padding-left:24px;font-size:.9rem;color:var(--on-dark-soft)}
          .incl-grid li::before{content:"✓";position:absolute;left:0;color:var(--gold-bright);font-weight:700}
          .invest{display:flex;flex-direction:column;justify-content:center;background:rgba(176,141,79,.1);border:1px solid rgba(216,185,122,.3);border-radius:16px;padding:24px}
          .invest .lab{font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--gold-bright);margin-bottom:8px}
          .invest .amt{font-family:'Cormorant Garamond',serif;font-size:2.4rem;font-weight:600;color:var(--on-dark);line-height:1}
          .invest .vat{font-size:.84rem;color:var(--on-dark-soft);margin-top:4px}
          .invest .pay{font-size:.82rem;color:var(--on-dark-soft);margin-top:12px;line-height:1.5}
          .not-incl{font-size:.86rem;color:var(--on-dark-soft);font-style:italic;margin-bottom:24px;padding-left:18px;border-left:2px solid rgba(216,185,122,.4)}
          .pt-detail .btn-row{display:flex;gap:14px;flex-wrap:wrap}
          .pt-detail .pt-btn{width:auto;padding:15px 32px}
          .pt-detail .pt-btn.ghost{color:var(--on-dark);border-color:rgba(246,241,231,.3)}
          .close-d{display:inline-flex;align-items:center;gap:8px;background:none;border:0;color:var(--gold-bright);cursor:pointer;font-family:'Jost';font-size:.86rem;margin-top:24px;letter-spacing:.02em}
          .aanvraag-note{margin-top:18px;font-size:.86rem;color:var(--on-dark-soft);font-style:italic}
          .aanvraag-note a{color:var(--gold-bright)}
          [data-lux]{cursor:pointer}

          /* CTA */
          .pt-cta{padding:110px 0;text-align:center;background:linear-gradient(160deg,var(--green1),var(--green-deep));color:var(--on-dark)}
          .pt-cta h2{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:clamp(2.4rem,5vw,3.8rem);line-height:1.05;margin-bottom:18px;margin-top:0}
          .pt-cta h2 em{color:var(--gold-bright)}
          .pt-cta p{color:var(--on-dark-soft);max-width:52ch;margin:0 auto 32px}
          .pt-cta .pt-btn{background:var(--gold);color:var(--dark2);width:auto;display:inline-flex;padding:16px 38px}
          .pt-cta-btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
          .pt-btn.ghost-light{background:transparent;color:var(--on-dark);border:1px solid rgba(246,241,231,.32);width:auto;padding:16px 32px}

          @media(max-width:900px){
            .pt-tracks-grid{grid-template-columns:1fr;gap:30px;max-width:440px;margin:0 auto}
            .pt-track.feat{order:-1}
            .day-cols{grid-template-columns:1fr;gap:20px}
            .incl-block{grid-template-columns:1fr;gap:20px}
            .incl-grid{grid-template-columns:1fr}
            .pt-hero{padding:110px 0 60px}
          }
        `}</style>

        <div className="pt-page">
          {/* HERO */}
          <section className="pt-hero">
            <div className="wrap">
              <span className="eyebrow reveal">In-person bij Chiva · Op locatie mogelijk</span>
              <h1 className="serif reveal">Jouw <em>persoonlijk</em><br />traject</h1>
              <p className="reveal">Een traject is een opleiding in het echt, bij Chiva — niet in een klas vol mensen, maar in de kleinste setting die er is: maximaal 1 op 2, of volledig 1 op 1. Je leert in jouw tempo, en als je wilt zelfs in je eigen salon. Wil je meerdere trajecten combineren omdat je precies dát ene mist — bijvoorbeeld als lash tech doorgroeien naar artist mét oogvormen én de Medusa-techniek? Dat stemmen we samen af.</p>
              <div className="scroll-cue reveal">↓ Bekijk de trajecten</div>
            </div>
          </section>

          {/* INTRO */}
          <section className="pt-intro">
            <div className="wrap">
              <div className="pt-intro-inner reveal">
                <h2 className="serif">Welke past bij <em>jou?</em></h2>
                <p>Begin je net, of kun je al sets plaatsen en wil je doorgroeien? Hieronder zie je de drie trajecten. Klik op een traject voor het volledige dagprogramma. Niet zeker welke past, of wil je er meerdere combineren? Lux helpt je kiezen — of mail direct naar info@luxique.nl.</p>
              </div>
            </div>
          </section>

          {/* TRACKS */}
          <section className="pt-tracks">
            <div className="wrap">
              <div className="pt-tracks-grid">
                {/* WISPY */}
                <div className="pt-track reveal">
                  <div className="t-dur">1 dag · Specialisatie</div>
                  <div className="t-name serif">Wispy Masterclass</div>
                  <div className="t-sub">Specialiseer je in wispy styling, spikes en wet sets.</div>
                  <div className="t-price"><span className="amt serif">€500</span><span className="vat">excl. btw</span></div>
                  <div className="t-incl-vat">€605 incl. btw</div>
                  <div className="t-for"><b>Voor wie?</b> Lash techs die al met extensions werken en zich willen specialiseren in wispy styling.</div>
                  <ul className="incl">
                    <li>Spikes creëren &amp; plaatsen</li>
                    <li>Wispy volume &amp; wet sets</li>
                    <li>Werken met J, B &amp; L curl</li>
                    <li>Texture, lagen &amp; bottom lashes</li>
                    <li>Modelwerk tijdens de cursus</li>
                  </ul>
                  <button className="pt-btn ghost" data-open="wispy">Bekijk dagprogramma</button>
                </div>

                {/* TECH TO ARTIST (featured) */}
                <div className="pt-track feat reveal">
                  <span className="pt-badge">Meest gekozen</span>
                  <div className="t-dur">3 dagen · Omscholing</div>
                  <div className="t-name serif">Lash Tech to Artist</div>
                  <div className="t-sub">Van technisch sets plaatsen naar volledig op maat stylen, corrigeren en ontwerpen.</div>
                  <div className="t-price"><span className="amt serif">€1.200</span><span className="vat">excl. btw</span></div>
                  <div className="t-incl-vat">€1.452 incl. btw</div>
                  <div className="t-for"><b>Voor wie?</b> Lash techs die al sets kunnen plaatsen en willen doorgroeien naar een échte lash artist.</div>
                  <ul className="incl">
                    <li>Wispy styling &amp; texture (modeldag)</li>
                    <li>Oog-, gezichts- &amp; stylinganalyse</li>
                    <li>Correctief stylen &amp; consultatie</li>
                    <li>Volledige artist-transformatie</li>
                    <li>Content creatie &amp; editing training</li>
                  </ul>
                  <button className="pt-btn ghost" data-open="tech">Bekijk dagprogramma</button>
                </div>

                {/* BEGINNER */}
                <div className="pt-track reveal">
                  <div className="t-dur">4 dagen · Beginner</div>
                  <div className="t-name serif">Beginner Lash Artist</div>
                  <div className="t-sub">De volledige basis van wimperextensions — een sterke, professionele fundering.</div>
                  <div className="t-price"><span className="amt serif">€1.650</span><span className="vat">excl. btw</span></div>
                  <div className="t-incl-vat">Incl. professioneel starterpakket</div>
                  <div className="t-for"><b>Voor wie?</b> Beginners die direct een sterke, professionele basis willen leggen.</div>
                  <ul className="incl">
                    <li>Techniek, isoleren &amp; plaatsen</li>
                    <li>Fans maken voor volume sets</li>
                    <li>Werken op echte modellen</li>
                    <li>Ooganalyse, styling &amp; spikes</li>
                    <li>Professioneel lash starterpakket</li>
                  </ul>
                  <button className="pt-btn ghost" data-open="beginner">Bekijk dagprogramma</button>
                </div>
              </div>
            </div>
          </section>

          {/* DETAIL: BEGINNER */}
          <div className="pt-detail" id="d-beginner">
            <div className="pt-detail-inner">
              <div className="wrap">
                <span className="eyebrow">4-daagse opleiding</span>
                <h3 className="serif">Beginner Lash Artist</h3>
                <p className="dlead">Een intensieve vierdaagse waarin je de volledige basis van wimperextensions leert. Ontwikkeld om beginners direct een sterke, professionele fundering te geven — van techniek tot het oog van een lash artist.</p>
                <div className="days">
                  <div className="day">
                    <div className="day-h"><span className="day-num">Dag 1</span><span className="day-t serif">Basis &amp; techniek</span></div>
                    <div className="day-d">Volledig gericht op techniek begrijpen en controle krijgen over je pincetten en plaatsing.</div>
                    <div className="day-cols one"><div className="col"><ul>
                      <li>Hygiëne en veiligheid</li><li>Basis van het oog en de natuurlijke wimper</li><li>De verschillende oogvormen</li>
                      <li>Betekenis van curls en hoe je deze gebruikt</li><li>Correct isoleren van wimpers</li><li>Het plaatsen van wimperextensions</li>
                      <li>Fans creëren voor volume sets</li><li>Oefenen op oefenmateriaal</li>
                    </ul></div></div>
                  </div>
                  <div className="day">
                    <div className="day-h"><span className="day-num">Dag 2</span><span className="day-t serif">Werken op een model</span></div>
                    <div className="day-d">Voor het eerst werken op een echt model — rustig en gecontroleerd leren werken.</div>
                    <div className="day-cols one"><div className="col"><ul>
                      <li>Plaatsen van een volledige set extensions</li><li>Correct isoleren op een echt oog</li><li>Werken met lash mapping</li>
                      <li>Tempo en precisie verbeteren</li><li>Een set veilig verwijderen</li>
                    </ul></div></div>
                  </div>
                  <div className="day">
                    <div className="day-h"><span className="day-num">Dag 3</span><span className="day-t serif">Styling &amp; ooganalyse</span></div>
                    <div className="day-d">Uitgebreide theorie- en stylingdag — verder leren kijken dan de standaard set.</div>
                    <div className="day-cols one"><div className="col"><ul>
                      <li>Oogvormen analyseren</li><li>Welke curls bij welke oogvorm passen</li><li>Sets leren customizen</li>
                      <li>Introductie tot wispy styling</li><li>Spikes plaatsen en gebruiken</li><li>Werken met verschillende mappings</li>
                    </ul></div></div>
                  </div>
                  <div className="day">
                    <div className="day-h"><span className="day-num">Dag 4</span><span className="day-t serif">Model &amp; customised set</span></div>
                    <div className="day-d">Je laat zien dat je een set kunt analyseren, plannen en uitvoeren.</div>
                    <div className="day-cols one"><div className="col"><ul>
                      <li>Zelf de lash mapping maken</li><li>De oogvorm van het model analyseren</li>
                      <li>Zelf de juiste curls en styling kiezen</li><li>Een volledige set creëren op basis van dag 3</li>
                    </ul></div></div>
                  </div>
                </div>
                <div className="incl-block">
                  <div>
                    <h4 className="serif">Inclusief</h4>
                    <ul className="incl-grid">
                      <li>Professioneel lash starterpakket</li><li>Certificaat Beginner Lash Artist</li><li>Begeleiding in kleine groepen</li>
                      <li>Lunch en drankjes</li><li>Gratis parkeren</li><li>Nazorg en mentoring na de cursus</li>
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
                  <a href="mailto:info@luxique.nl?subject=Aanvraag%20traject" className="pt-btn">Vraag dit traject aan</a>
                  <button className="pt-btn ghost" data-lux>Krijg direct antwoord van Lux</button>
                </div>
                <p className="aanvraag-note">Trajecten zijn op aanvraag en in overleg. Mail naar <a href="mailto:info@luxique.nl">info@luxique.nl</a> of laat Lux je helpen kiezen.</p>
                <button className="close-d" data-close>↑ Sluit dagprogramma</button>
              </div>
            </div>
          </div>

          {/* DETAIL: TECH TO ARTIST */}
          <div className="pt-detail" id="d-tech">
            <div className="pt-detail-inner">
              <div className="wrap">
                <span className="eyebrow">3-daagse omscholing · 2 modeldagen</span>
                <h3 className="serif">Lash Tech to Artist</h3>
                <p className="dlead">Voor lash techs die technisch al sets kunnen plaatsen, maar willen doorgroeien naar een échte lash artist die volledig op maat kan stylen, corrigeren en ontwerpen.</p>
                <div className="days">
                  <div className="day">
                    <div className="day-h"><span className="day-num">Dag 1</span><span className="day-t serif">Wispy styling &amp; texture · modeldag</span></div>
                    <div className="day-cols">
                      <div className="col"><div className="col-h">Theorie</div><ul>
                        <li>Lash Tech vs Lash Artist</li><li>Werken met lagen</li><li>Texture creëren</li><li>Wispy styling begrijpen</li>
                        <li>Verschillende soorten spikes</li><li>Lengteverhoudingen &amp; plaatsing van textuur</li><li>Balans binnen een wispy set</li>
                      </ul></div>
                      <div className="col"><div className="col-h">Praktijk op model</div><ul>
                        <li>Wispy mapping maken</li><li>Werken met lagen</li><li>Texture opbouwen</li><li>Spikes plaatsen</li><li>Complete customised wispy set</li>
                      </ul></div>
                    </div>
                  </div>
                  <div className="day">
                    <div className="day-h"><span className="day-num">Dag 2</span><span className="day-t serif">De kunst van customisation</span></div>
                    <div className="day-d">Uitgebreide theoriedag: van ooganalyse tot consultatie.</div>
                    <div className="day-cols">
                      <div className="col"><div className="col-h">Analyse</div><ul>
                        <li>Ooganalyse: vormen, standen &amp; oogleden</li><li>Sterke en zwakke punten herkennen</li>
                        <li>Styling: Fox, Squirrel, Open, Doll &amp; Wispy</li><li>Gezichtsanalyse &amp; balans met lashes</li>
                      </ul></div>
                      <div className="col"><div className="col-h">Correctie &amp; curls</div><ul>
                        <li>Symmetrie creëren, asymmetrie corrigeren</li><li>Hangende ogen &amp; kleine ogen optisch corrigeren</li>
                        <li>J, B, C, CC, L &amp; M curl en hun functie</li><li>Professionele intake &amp; consultatie</li>
                      </ul></div>
                    </div>
                  </div>
                  <div className="day">
                    <div className="day-h"><span className="day-num">Dag 3</span><span className="day-t serif">Volledige artist-transformatie · modeldag</span></div>
                    <div className="day-d">De student voert zelfstandig een volledige customised set uit.</div>
                    <div className="day-cols">
                      <div className="col"><div className="col-h">Werkwijze</div><ul>
                        <li>Consult &amp; ooganalyse uitvoeren</li><li>Gezicht analyseren &amp; correcties bepalen</li>
                        <li>Styling kiezen &amp; mapping ontwerpen</li><li>Complete set plaatsen</li>
                      </ul></div>
                      <div className="col"><div className="col-h">Content &amp; editing</div><ul>
                        <li>Before &amp; after foto&apos;s en video</li><li>Belichting &amp; filmen voor IG/TikTok</li>
                        <li>Basis videobewerking &amp; reels maken</li><li>Professionele before/after content</li>
                      </ul></div>
                    </div>
                  </div>
                </div>
                <div className="incl-block">
                  <div>
                    <h4 className="serif">Inclusief</h4>
                    <ul className="incl-grid">
                      <li>3 volledige lesdagen</li><li>2 modeldagen</li><li>Lunch op alle dagen</li>
                      <li>Lesmateriaal</li><li>Persoonlijke begeleiding</li><li>Content &amp; editing training</li><li>Lash Tech to Artist certificaat</li>
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
                  <a href="mailto:info@luxique.nl?subject=Aanvraag%20traject" className="pt-btn">Vraag dit traject aan</a>
                  <button className="pt-btn ghost" data-lux>Krijg direct antwoord van Lux</button>
                </div>
                <p className="aanvraag-note">Trajecten zijn op aanvraag en in overleg. Mail naar <a href="mailto:info@luxique.nl">info@luxique.nl</a> of laat Lux je helpen kiezen.</p>
                <button className="close-d" data-close>↑ Sluit dagprogramma</button>
              </div>
            </div>
          </div>

          {/* DETAIL: WISPY */}
          <div className="pt-detail" id="d-wispy">
            <div className="pt-detail-inner">
              <div className="wrap">
                <span className="eyebrow">1-daagse masterclass</span>
                <h3 className="serif">Wispy Masterclass</h3>
                <p className="dlead">Voor lash techs die al kunnen werken met wimperextensions en zich willen specialiseren in wispy styling. Eén dag, vol techniek — direct toepasbaar op een model.</p>
                <div className="days">
                  <div className="day">
                    <div className="day-h"><span className="day-t serif">Wat je leert</span></div>
                    <div className="day-cols">
                      <div className="col"><div className="col-h">Spikes &amp; wispy styling</div><ul>
                        <li>Handmatige spikes &amp; fanstructuren</li><li>Spikes voor verschillende effecten</li>
                        <li>Opbouw van een wispy volume set</li><li>Balans tussen textuur en volume</li><li>Werken met lagen &amp; diepte opbouwen</li>
                      </ul></div>
                      <div className="col"><div className="col-h">Wet sets &amp; curls</div><ul>
                        <li>Closed fan technieken &amp; wet lash styling</li><li>Verschil wet sets vs wispy sets</li>
                        <li>Werken met J, B &amp; L curl</li><li>Welke oogvormen erbij passen</li><li>Curls combineren voor customisation</li>
                      </ul></div>
                    </div>
                  </div>
                  <div className="day">
                    <div className="day-h"><span className="day-t serif">Texture, bottom lashes &amp; praktijk</span></div>
                    <div className="day-cols">
                      <div className="col"><div className="col-h">Texture &amp; lagen</div><ul>
                        <li>Werken met meerdere lagen</li><li>Diepte &amp; dimensionale sets</li><li>Professionele textuur opbouwen</li>
                      </ul></div>
                      <div className="col"><div className="col-h">Bottom lashes &amp; afwerking</div><ul>
                        <li>Veilig plaatsen van bottom lashes</li><li>Lengtes kiezen &amp; balans creëren</li><li>Complete look afwerken op model</li>
                      </ul></div>
                    </div>
                  </div>
                </div>
                <p className="not-incl">Let op: deze masterclass behandelt niet de Medusa-techniek.</p>
                <div className="incl-block">
                  <div>
                    <h4 className="serif">Inclusief</h4>
                    <ul className="incl-grid">
                      <li>Lunch</li><li>Lesmateriaal</li><li>Praktijkbegeleiding</li><li>Certificaat</li><li>Modelwerk tijdens de cursus</li>
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
                  <a href="mailto:info@luxique.nl?subject=Aanvraag%20traject" className="pt-btn">Vraag dit traject aan</a>
                  <button className="pt-btn ghost" data-lux>Krijg direct antwoord van Lux</button>
                </div>
                <p className="aanvraag-note">Trajecten zijn op aanvraag en in overleg. Mail naar <a href="mailto:info@luxique.nl">info@luxique.nl</a> of laat Lux je helpen kiezen.</p>
                <button className="close-d" data-close>↑ Sluit dagprogramma</button>
              </div>
            </div>
          </div>

          {/* CTA */}
          <section className="pt-cta">
            <div className="wrap">
              <h2 className="serif reveal">Niet zeker welk traject<br /><em>bij je past?</em></h2>
              <p className="reveal">Lux, onze chatbot, denkt met je mee — welk traject past, of hoe je er meerdere combineert tot één route op maat. Liever direct contact? Mail naar info@luxique.nl.</p>
              <div className="pt-cta-btns reveal">
                <button className="pt-btn" data-lux>Krijg direct antwoord van Lux</button>
                <a href="mailto:info@luxique.nl?subject=Vraag%20over%20trajecten" className="pt-btn ghost-light">Mail info@luxique.nl</a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
