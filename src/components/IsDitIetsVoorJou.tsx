'use client'

import { useEffect, useRef } from 'react'

const checkPath = 'M96.975 24.985 36.627 85.332c-.702.7-1.839.7-2.542 0L3.025 54.27c-.7-.703-.7-1.84 0-2.542l7.775-7.775c.703-.7 1.84-.7 2.542 0L35.358 65.97l51.3-51.3c.703-.7 1.84-.7 2.542 0l7.775 7.774c.7.703.7 1.84 0 2.542z'

const defaultYesItems = [
  'Je wilt begrijpen wáárom een techniek werkt, niet alleen nadoen.',
  'Je wilt van lashes je vak maken, niet je bijbaan.',
  'Je bent bereid te oefenen en feedback aan te nemen.',
  'Je wilt klanten met vertrouwen kunnen aannemen.',
  'Je wilt een prijs durven vragen die je werk waard is.',
]

const defaultNoItems = [
  'Je zoekt een snelle truc of een certificaatje voor de show.',
  'Je wilt alleen kijken, niet oefenen.',
  'Je verwacht resultaat zonder feedback op je eigen werk.',
  'Je wilt de basis — anatomie, oogvormen — overslaan.',
]

const defaultStatements = [
  'Ik plak lashes, maar snap niet waarom een set bij de één weken houdt en bij de ander loslaat.',
  'Ik heb genoeg YouTube gezien — nu wil ik écht begrijpen wat ik doe.',
  'Ik wil hier mijn beroep van maken, niet mijn bijbaan.',
  'Ik durf nog geen prijs te vragen die past bij wat ik kan.',
  'Ik mis iemand die naar mijn werk kijkt en eerlijk zegt wat beter kan.',
]

export default function IsDitIetsVoorJou({
  yesItems: yesItemsProp,
  noItems: noItemsProp,
  statements: statementsProp,
}: {
  yesItems?: string[]
  noItems?: string[]
  statements?: string[]
}) {
  const yesItems = yesItemsProp && yesItemsProp.length > 0 ? yesItemsProp : defaultYesItems
  const noItems = noItemsProp && noItemsProp.length > 0 ? noItemsProp : defaultNoItems
  const statements = statementsProp && statementsProp.length > 0 ? statementsProp : defaultStatements
  const statementsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const grid = statementsRef.current
    if (!grid) return
    const pills = grid.querySelectorAll('.vdj-st')
    const pillArray = Array.from(pills)
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const i = pillArray.indexOf(e.target as Element)
          setTimeout(() => e.target.classList.add('in'), i * 120)
          io.unobserve(e.target)
        }
      })
    }, { threshold: 0.3 })
    pills.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])

  return (
    <section className="vdj-section">
      {/* Ambient blobs */}
      <div className="vdj-ambient">
        <span className="vdj-blob b1" />
        <span className="vdj-blob b2" />
        <span className="vdj-blob b3" />
      </div>
      <div className="vdj-dots" />

      <div className="vdj-wrap">
        {/* Heading */}
        <div className="vdj-head">
          <p className="vdj-eyebrow">Eerlijk is eerlijk</p>
          <h2 className="vdj-title">Is dit iets <em>voor jou?</em></h2>
        </div>

        {/* Deel A — Two columns */}
        <div className="vdj-cols">
          {/* YES */}
          <div className="vdj-col yes">
            <div className="vdj-col-head">
              <span className="vdj-col-badge badge-yes">
                <svg viewBox="0 0 100 100" width="17" height="17"><path d={checkPath} fill="#fff" /></svg>
              </span>
              <span className="vdj-col-title title-yes">Dit is voor jou als…</span>
            </div>
            <ul>
              {yesItems.map((text, i) => (
                <li key={i}>
                  <span className="vdj-mark mark-yes">
                    <svg viewBox="0 0 100 100" width="11" height="11"><path d={checkPath} fill="#7BA081" /></svg>
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* NO */}
          <div className="vdj-col no">
            <div className="vdj-col-head">
              <span className="vdj-col-badge badge-no">
                <span className="vdj-x">✕</span>
              </span>
              <span className="vdj-col-title title-no">Niet voor jou als…</span>
            </div>
            <ul>
              {noItems.map((text, i) => (
                <li key={i}>
                  <span className="vdj-mark mark-no"><span>✕</span></span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Deel B — Statements */}
        <div className="vdj-statements">
          <div className="vdj-st-divider" />
          <p className="vdj-st-eyebrow">Herken je <em>jezelf</em> hierin?</p>
          <div className="vdj-st-grid" ref={statementsRef}>
            {statements.map((text, i) => (
              <span className="vdj-st" key={i}>
                <span className="vdj-q">{'"'}</span>{text}<span className="vdj-q">{'"'}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .vdj-section { position:relative; overflow:hidden; padding:100px 0 92px; }

        /* Ambient */
        .vdj-ambient { position:absolute; inset:0; pointer-events:none; overflow:hidden; }
        .vdj-blob { position:absolute; border-radius:50%; filter:blur(70px); opacity:.5; }
        .vdj-blob.b1 { width:680px; height:480px; left:-8%; top:8%; background:radial-gradient(circle, rgba(196,162,101,.5), transparent 68%); animation:drift1 16s ease-in-out infinite alternate; }
        .vdj-blob.b2 { width:560px; height:520px; right:-6%; top:24%; background:radial-gradient(circle, rgba(94,132,99,.40), transparent 66%); animation:drift2 19s ease-in-out infinite alternate; }
        .vdj-blob.b3 { width:720px; height:420px; left:30%; bottom:-12%; background:radial-gradient(circle, rgba(228,201,138,.34), transparent 70%); animation:drift3 22s ease-in-out infinite alternate; }
        @keyframes drift1 { from{transform:translate(0,0) scale(1)} to{transform:translate(40px,30px) scale(1.08)} }
        @keyframes drift2 { from{transform:translate(0,0) scale(1)} to{transform:translate(-36px,26px) scale(1.1)} }
        @keyframes drift3 { from{transform:translate(0,0) scale(1)} to{transform:translate(30px,-28px) scale(1.06)} }

        .vdj-dots { position:absolute; left:0; right:0; top:0; height:340px; pointer-events:none; background-image:radial-gradient(rgba(228,201,138,.5) 1px, transparent 1.4px); background-size:22px 22px; -webkit-mask-image:radial-gradient(60% 70% at 50% 0%, #000, transparent 72%); mask-image:radial-gradient(60% 70% at 50% 0%, #000, transparent 72%); opacity:.5; animation:dots-drift 13s ease-in-out infinite alternate; }
        @keyframes dots-drift { from{transform:translateY(0)} to{transform:translateY(-10px)} }

        .vdj-wrap { position:relative; z-index:2; max-width:1060px; margin:0 auto; padding:0 40px; }

        /* Heading */
        .vdj-head { text-align:center; max-width:680px; margin:0 auto 58px; }
        .vdj-eyebrow { font-family:'Outfit',sans-serif; font-size:12px; font-weight:600; letter-spacing:.34em; text-transform:uppercase; color:#C4A265; margin:0 0 18px; }
        .vdj-title { font-family:'Cormorant Garamond',serif; font-size:54px; font-weight:500; line-height:1.08; letter-spacing:-.01em; color:#EDE7DB; margin:0; }
        .vdj-title em { font-style:italic; color:#E4C98A; }

        /* Columns */
        .vdj-cols { display:grid; grid-template-columns:1fr 1fr; gap:26px; margin-bottom:80px; }
        .vdj-col { position:relative; border-radius:24px; padding:40px 36px; overflow:hidden; border:1px solid rgba(228,201,138,.10); }

        /* YES column */
        .vdj-col.yes { background:radial-gradient(130% 120% at 20% 12%, rgba(94,132,99,.20), transparent 55%), linear-gradient(180deg, #211A11, #1A150E); border-color:rgba(123,160,129,.30); }
        .vdj-col.yes::before { content:""; position:absolute; inset:0; pointer-events:none; border-radius:24px; box-shadow:inset 0 2px 40px -10px rgba(123,160,129,.6), inset 0 18px 70px -30px rgba(94,132,99,.5); animation:pulse-green 5.5s ease-in-out infinite; }
        @keyframes pulse-green {
          0%,100% { box-shadow:inset 0 2px 40px -10px rgba(123,160,129,.35), inset 0 18px 70px -30px rgba(94,132,99,.3); }
          50% { box-shadow:inset 0 2px 70px -4px rgba(123,160,129,.7), inset 0 30px 110px -24px rgba(94,132,99,.55); }
        }
        .vdj-col.yes::after { content:""; position:absolute; inset:-1px; border-radius:24px; pointer-events:none; box-shadow:0 0 60px -6px rgba(123,160,129,.32); }

        /* NO column */
        .vdj-col.no { background:radial-gradient(130% 120% at 80% 12%, rgba(181,99,92,.16), transparent 55%), linear-gradient(180deg, #1A1109, #120C07); border-color:rgba(181,99,92,.26); }
        .vdj-col.no::before { content:""; position:absolute; inset:0; pointer-events:none; border-radius:24px; box-shadow:inset 0 2px 40px -12px rgba(181,99,92,.4), inset 0 18px 70px -34px rgba(181,99,92,.3); }
        .vdj-col.no::after { content:""; position:absolute; inset:-1px; border-radius:24px; pointer-events:none; box-shadow:0 0 50px -10px rgba(181,99,92,.22); }

        /* Column header */
        .vdj-col-head { display:flex; align-items:center; gap:13px; margin-bottom:28px; position:relative; z-index:1; }
        .vdj-col-badge { width:36px; height:36px; border-radius:50%; flex:0 0 36px; display:flex; align-items:center; justify-content:center; }
        .badge-yes { background:linear-gradient(180deg,#7BA081,#5E8463); box-shadow:0 0 18px rgba(123,160,129,.5); }
        .badge-no { background:linear-gradient(180deg,#C97B72,#B5635C); box-shadow:0 0 16px rgba(181,99,92,.45); }
        .vdj-x { color:#fff; font-size:16px; line-height:1; }
        .vdj-col-title { font-family:'Outfit',sans-serif; font-size:13px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; }
        .title-yes { color:#7BA081; }
        .title-no { color:#C97B72; }

        /* Lists */
        .vdj-col ul { list-style:none; margin:0; padding:0; position:relative; z-index:1; }
        .vdj-col li { display:flex; align-items:flex-start; gap:14px; padding:14px 0; border-bottom:1px solid rgba(228,201,138,.10); font-size:15.5px; line-height:1.45; }
        .vdj-col li:last-child { border-bottom:none; }
        .vdj-col.yes li { color:#EDE7DB; }
        .vdj-col.no li { color:#C9BFB2; border-bottom-color:rgba(181,99,92,.12); }
        .vdj-mark { flex:0 0 23px; width:23px; height:23px; border-radius:50%; margin-top:1px; display:flex; align-items:center; justify-content:center; }
        .mark-yes { background:rgba(123,160,129,.18); }
        .mark-no { background:rgba(181,99,92,.16); }
        .mark-no span { color:#C97B72; font-size:12px; line-height:1; font-weight:600; }

        /* Deel B — Statements */
        .vdj-statements { position:relative; padding-top:58px; text-align:center; }
        .vdj-statements::before { content:""; position:absolute; top:-40px; left:50%; transform:translateX(-50%); width:70%; height:200px; pointer-events:none; background:radial-gradient(60% 80% at 50% 50%, rgba(228,201,138,.16), transparent 70%); filter:blur(20px); }
        .vdj-st-divider { width:60px; height:1px; background:linear-gradient(90deg,transparent,#C4A265,transparent); margin:0 auto 28px; }
        .vdj-st-eyebrow { font-family:'Cormorant Garamond',serif; font-style:italic; font-size:26px; color:#EDE7DB; margin:0 0 34px; position:relative; }
        .vdj-st-eyebrow em { color:#E4C98A; font-style:italic; }
        .vdj-st-grid { display:flex; flex-wrap:wrap; gap:14px; justify-content:center; max-width:900px; margin:0 auto; position:relative; z-index:1; }
        .vdj-st { background:rgba(228,201,138,.05); border:1px solid rgba(228,201,138,.18); border-radius:100px; padding:14px 26px; font-style:italic; font-family:'Cormorant Garamond',serif; font-size:18px; line-height:1.3; color:#EDE7DB; backdrop-filter:blur(4px); box-shadow:0 0 24px -8px rgba(228,201,138,.25), inset 0 0 20px -12px rgba(228,201,138,.4); opacity:0; transform:translateY(22px); transition:opacity .7s ease, transform .7s ease, border-color .4s, background .4s; }
        .vdj-st.in { opacity:1; transform:translateY(0); }
        .vdj-st:hover { border-color:rgba(228,201,138,.45); background:rgba(228,201,138,.09); }
        .vdj-q { color:#C4A265; font-style:normal; margin:0 2px; }

        /* Responsive */
        @media (max-width:860px) {
          .vdj-title { font-size:40px; }
          .vdj-cols { grid-template-columns:1fr; gap:18px; margin-bottom:60px; }
          .vdj-col { padding:32px 26px; }
        }
        @media (max-width:600px) {
          .vdj-section { padding:68px 0 62px; }
          .vdj-wrap { padding:0 22px; }
          .vdj-title { font-size:33px; }
          .vdj-st-eyebrow { font-size:22px; }
          .vdj-st { font-size:16px; padding:12px 20px; }
          .vdj-blob { filter:blur(50px); }
        }
      `}</style>
    </section>
  )
}
