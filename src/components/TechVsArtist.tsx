'use client'

import { useEffect, useRef } from 'react'

export default function TechVsArtist() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const sec = sectionRef.current
    if (!sec) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          sec.classList.add('revealed')
          io.disconnect()
        }
      })
    }, { threshold: 0.3 })
    io.observe(sec)
    return () => io.disconnect()
  }, [])

  return (
    <>
      <style>{`
        :root {
          --bg-soft:#EDE7DB;
          --ink:#1C1814; --ink-soft:#4A433B;
          --card-dark:#1A1611; --card-dark-2:#241D14;
          --gold:#B08D4F; --gold-soft:#C9A86A; --gold-bright:#E0C078;
          --gold-glow:rgba(176,141,79,.55);
          --line:rgba(28,24,20,.14);
          --display:"Cormorant Garamond",Georgia,serif;
          --body:"Jost",system-ui,sans-serif;
          --stagger:64px;
        }
        .tva-section { padding-block:clamp(32px,4vw,56px); background:#F3EFE7; }
        .tva-container { width:100%; max-width:1180px; margin-inline:auto; padding-inline:clamp(24px,5vw,64px); }
        
        .tva-head { text-align:center; max-width:780px; margin-inline:auto; margin-bottom:clamp(40px,5vw,64px); position:relative; z-index:6; }
        .tva-eyebrow { display:inline-block; font-family:var(--body); font-weight:500; font-size:.78rem; letter-spacing:.22em; text-transform:uppercase; color:var(--ink); border:1px solid var(--line); border-radius:999px; padding:.5em 1.25em; margin-bottom:1.4rem; }
        .tva-head h2 { font-family:var(--display); font-weight:500; font-size:clamp(2.6rem,5.2vw,4.1rem); line-height:1.04; letter-spacing:-.01em; color:var(--ink); }
        .tva-head h2 em { font-style:italic; color:var(--gold); }
        .tva-head p { margin-top:1.1rem; color:var(--ink-soft); font-size:1.15rem; position:relative; display:inline-block; }
        
        .word-anchor { position:relative; }
        .curl { position:absolute; left:calc(100% + 8px); top:-6px; width:140px; height:104px; pointer-events:none; color:var(--gold); overflow:visible; }
        .curl path { fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:560; stroke-dashoffset:560; transition:stroke-dashoffset 1.5s cubic-bezier(.6,.1,.3,1) .6s; }
        .revealed .curl path { stroke-dashoffset:0; }
        .curl .head-arrow { stroke-dasharray:42; stroke-dashoffset:42; transition:stroke-dashoffset .35s ease 1.95s; }
        .revealed .curl .head-arrow { stroke-dashoffset:0; }
        
        .tva-cards { position:relative; display:grid; grid-template-columns:1fr 1fr; gap:clamp(20px,3vw,44px); align-items:start; }
        .tva-card { position:relative; border-radius:20px; overflow:hidden; display:flex; flex-direction:column; opacity:0; transform:translateY(34px); transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1); }
        .revealed .tva-card { opacity:1; transform:translateY(0); }
        .revealed .card--tech { transition-delay:.12s; }
        .revealed .card--artist { transition-delay:.30s; }
        
        .card--tech { margin-top:var(--stagger); background:var(--bg-soft); border:1px solid var(--line); }
        .card--tech .card-body h3 { color:var(--ink); }
        .card--tech .card-body p { color:var(--ink-soft); }
        
        .card--artist {
          background: radial-gradient(135% 95% at 50% -12%, rgba(224,192,120,.45), transparent 56%), linear-gradient(165deg,var(--card-dark-2),var(--card-dark));
          border:1px solid rgba(176,141,79,.6);
          box-shadow: 0 0 0 1px rgba(176,141,79,.18), 0 36px 90px -26px var(--gold-glow), inset 0 0 120px -6px rgba(224,192,120,.55), inset 0 2px 0 rgba(224,192,120,.35);
        }
        .card--artist::before { content:""; position:absolute; inset:-14px; border-radius:30px; background:radial-gradient(60% 55% at 50% 10%,rgba(224,192,120,.42),transparent 70%); pointer-events:none; z-index:0; filter:blur(22px); }
        .card--artist > * { position:relative; z-index:1; }
        .card--artist .card-body h3 { color:#F8F3E9; }
        .card--artist .card-body p { color:rgba(248,243,233,.85); }
        
        .card-media { position:relative; aspect-ratio:4/3.4; width:100%; overflow:hidden; background:#ddd; }
        .card-media img { width:100%; height:100%; object-fit:cover; display:block; }
        
        .tva-pill { position:absolute; z-index:3; top:16px; left:16px; font-family:var(--body); font-weight:600; font-size:.74rem; letter-spacing:.14em; text-transform:uppercase; padding:.62em 1.15em; border-radius:999px; background:var(--gold); color:#1A1611; box-shadow:0 6px 20px -6px var(--gold-glow); }
        
        .card-body { padding:clamp(24px,3vw,38px); display:flex; flex-direction:column; gap:1rem; flex:1; }
        .card-body h3 { font-family:var(--display); font-weight:500; font-size:clamp(1.7rem,2.6vw,2.15rem); line-height:1.1; }
        .lede { font-weight:500; font-size:1.15rem; }
        .card--artist .lede { color:var(--gold-soft)!important; }
        .card-body p { font-size:1.075rem; line-height:1.65; }
        .card-foot { margin-top:auto; padding-top:.4rem; }
        .foot-note { font-family:var(--body); font-size:.74rem; letter-spacing:.16em; text-transform:uppercase; color:var(--ink-soft); }
        .tva-btn { display:inline-flex; align-items:center; gap:.5em; font-family:var(--body); font-weight:600; font-size:.92rem; letter-spacing:.02em; color:#1A1611; background:var(--gold); border:none; border-radius:999px; padding:.85em 1.6em; cursor:pointer; text-decoration:none; transition:transform .2s,box-shadow .2s; }
        .tva-btn:hover { transform:translateY(-2px); box-shadow:0 12px 28px -10px var(--gold-glow); }
        
        .tva-vs { position:absolute; z-index:5; left:50%; top:calc(25% + (var(--stagger) / 2)); transform:translate(-50%,-50%) scale(.5); width:78px; height:78px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:radial-gradient(circle at 50% 32%,#2a2117,#130F0A); border:1px solid rgba(224,192,120,.65); box-shadow:0 16px 40px -10px rgba(0,0,0,.55), inset 0 0 24px -2px rgba(224,192,120,.55), 0 0 0 7px rgba(243,239,231,.6), 0 0 34px 2px rgba(224,192,120,.35); font-family:var(--display); font-style:italic; font-weight:600; font-size:2.6rem; line-height:1; color:var(--gold-bright); letter-spacing:.02em; opacity:0; transition:opacity .5s ease .55s,transform .6s cubic-bezier(.34,1.56,.64,1) .55s; }
        .revealed .tva-vs { opacity:1; transform:translate(-50%,-50%) scale(1); animation:tva-vspulse 2.8s ease-in-out 1.3s infinite; }
        @keyframes tva-vspulse {
          0%,100% { box-shadow:0 16px 40px -10px rgba(0,0,0,.55), inset 0 0 24px -2px rgba(224,192,120,.55), 0 0 0 7px rgba(243,239,231,.6), 0 0 34px 2px rgba(224,192,120,.35); }
          50% { box-shadow:0 16px 40px -10px rgba(0,0,0,.55), inset 0 0 32px 0 rgba(224,192,120,.78), 0 0 0 7px rgba(243,239,231,.6), 0 0 56px 6px rgba(224,192,120,.55); }
        }
        
        /* Chiva quote — subtle, cream bg, words do the work */
        .quote-block {
          margin-top:clamp(48px,6vw,84px);
          max-width:780px; margin-inline:auto;
          display:flex; align-items:center; gap:clamp(20px,3vw,36px);
          opacity:0; transform:translateY(22px);
          transition:opacity .8s cubic-bezier(.16,1,.3,1) .45s,transform .8s cubic-bezier(.16,1,.3,1) .45s;
          flex-direction:row-reverse;
        }
        .revealed .quote-block { opacity:1; transform:translateY(0); }
        .quote-portrait {
          position:relative; width:clamp(64px,8vw,84px); aspect-ratio:1;
          border-radius:50%; overflow:hidden; flex-shrink:0;
          background: linear-gradient(135deg, #C9A86A 0%, #B08D4F 40%, #8A6D38 70%, #6B5429 100%);
        }
        .quote-portrait img { width:100%; height:100%; object-fit:cover; display:block; }
        .quote-body {
          padding-left:0;
          padding-right:clamp(18px,2.4vw,28px);
          border-right:2px solid var(--gold);
        }
        .quote-body blockquote {
          font-family:var(--display); font-style:italic; font-weight:500;
          font-size:clamp(1.25rem,2.2vw,1.6rem); line-height:1.4; color:var(--ink);
          margin:0; text-align:right;
        }
        .quote-cite { margin-top:.9rem; display:flex; align-items:baseline; gap:.6rem; flex-wrap:wrap; justify-content:flex-end; }
        .quote-name { font-family:var(--body); font-weight:600; font-size:.92rem; letter-spacing:.02em; color:var(--ink); }
        .quote-role { font-family:var(--body); font-weight:400; font-size:.76rem; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-soft); }

        @media (max-width:820px) {
          .curl { display:none; }
          .tva-cards { grid-template-columns:1fr; }
          .card--tech { margin-top:0; }
          .tva-vs { display:none; }
        }
        @media (max-width:600px) {
          .quote-block { gap:16px; align-items:center; flex-direction:row!important; text-align:left!important; }
          .quote-portrait { width:60px; }
          .quote-body { border-left:2px solid var(--gold)!important; border-right:none!important; border-top:none!important; padding-left:16px!important; padding-right:0!important; }
          .quote-body blockquote { font-size:1.05rem; line-height:1.36; text-align:left!important; }
          .quote-cite { margin-top:.6rem; gap:.35rem; justify-content:flex-start!important; }
          .quote-name { font-size:.86rem; }
          .quote-role { font-size:.68rem; letter-spacing:.1em; }
        }
        @media (prefers-reduced-motion:reduce) {
          .tva-card,.curl path,.tva-vs,.quote-block { transition:none!important; animation:none!important; opacity:1!important; transform:none!important; }
          .tva-vs { transform:translate(-50%,-50%) scale(1)!important; }
          .curl path { stroke-dashoffset:0!important; }
        }
      `}</style>

      <section className="tva-section" ref={sectionRef}>
        <div className="tva-container">
          <div className="tva-head">
            <span className="tva-eyebrow">Lash tech vs. lash artist</span>
            <h2>Er is een verschil tussen wimpers <em>zetten</em> en wimpers <em>creëren</em>.</h2>
            <p>Wij leren je het <span className="word-anchor">tweede.<svg className="curl" viewBox="0 0 140 104" fill="none"><path d="M2 19 C 34 5, 62 13, 54 39 C 47 60, 14 57, 22 36 C 28 20, 56 24, 72 40 C 90 56, 100 66, 104 76"/><path className="head-arrow" d="M104 76 l -15 -1 M104 76 l 1 -15"/></svg></span></p>
          </div>

          <div className="tva-cards">
            {/* LASH TECHNICIAN */}
            <article className="tva-card card--tech">
              <div className="card-media">
                <img src="https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/tva-lash-tech.webp" alt="Lash Technician" />
              </div>
              <div className="card-body">
                <h3>Lash Technician</h3>
                <p>Beheerst de basis: fans aanbrengen, werken met verschillende lash types, en standaard maps volgen.</p>
                <p>Het werk is uitvoerend — Russian volume, hybrids, classics volgens vaste patronen. Maar niet vanuit wat het oog vraagt.</p>
                <div className="card-foot"><span className="foot-note">Een goede start, maar er is meer</span></div>
              </div>
            </article>

            {/* LASH ARTIST */}
            <article className="tva-card card--artist">
              <div className="card-media">
                <span className="tva-pill">Waar wij je naartoe brengen</span>
                <img src="https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/tva-lash-artist.webp" alt="Lash Artist" />
              </div>
              <div className="card-body">
                <h3>Lash Artist</h3>
                <p className="lede">Je ziet het oog. Niet de wimper.</p>
                <p>Een lash artist leest de oogvorm vóórdat er één wimmer wordt geplaatst — welke curl past, en waaróm. Een set die écht bij de persoon hoort. Geen kopie, geen standaard map. Uniek ontwerp, per persoon.</p>
                <div className="card-foot">
                  <a className="tva-btn" href="/courses">Bekijk de academy
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </a>
                </div>
              </div>
            </article>

            <div className="tva-vs">VS</div>
          </div>

          {/* Chiva quote — subtle */}
          <figure className="quote-block">
            <div className="quote-portrait">
              <img src="https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/tva-chiva-quote.webp" alt="Chiva Daams" />
            </div>
            <div className="quote-body">
              <blockquote>“A normal lash tech just copies and pastes. I look at eye shapes. I have knowledge about every face that sits in my chair.”</blockquote>
              <figcaption className="quote-cite">
                <span className="quote-name">Chiva Daams</span>
                <span className="quote-role">Founder & Lash Artist</span>
              </figcaption>
            </div>
          </figure>
        </div>
      </section>
    </>
  )
}
