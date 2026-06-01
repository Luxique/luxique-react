'use client'

export default function ComparisonTable() {
  const features = [
    'Werken met oogvormen',
    'Droopyness actief voorkomen',
    'Alle curls — J, B, L en verder',
    'Spikes maken én correct plaatsen',
    'Bottom lashes technieken',
    'Wet sets creëren',
    'Je werk professioneel fotograferen',
    'Mentorship na de cursus',
    'Leer in jouw eigen tempo',
  ]

  const checkSVG = (
    <svg viewBox="0 0 100 100" width="14" height="14">
      <path d="M96.975 24.985 36.627 85.332c-.702.7-1.839.7-2.542 0L3.025 54.27c-.7-.703-.7-1.84 0-2.542l7.775-7.775c.703-.7 1.84-.7 2.542 0L35.358 65.97l51.3-51.3c.703-.7 1.84-.7 2.542 0l7.775 7.774c.7.703.7 1.84 0 2.542z" fill="#9E7E45"/>
    </svg>
  )

  return (
    <section className="comp-section">
      <div className="comp-page-width">
        <div className="comp-grid">

          {/* LEFT — Title + description */}
          <div className="comp-content">
            <p className="comp-eyebrow">Vergelijking</p>
            <h2 className="comp-title">
              Niet elke opleiding is hetzelfde. <em>Dit is het verschil.</em>
            </h2>
            <div className="comp-desc">
              <p>De meeste cursussen leren je een set kunstjes. Bij Luxique Academy leer je het vak — van oogvorm tot fotografie, met begeleiding die doorgaat na je diploma.</p>
            </div>
          </div>

          {/* RIGHT — Table */}
          <div className="comp-features">

            {/* Header row */}
            <div className="comp-header-row">
              <div className="comp-header comp-header-spacer" />
              <div className="comp-header comp-header-lxq">
                <span className="comp-spark">✦</span>
                <span className="comp-col-name">LXQ<br />Academy</span>
              </div>
              <div className="comp-header comp-header-std">
                <span className="comp-col-name-std">Standaard<br />cursus</span>
              </div>
            </div>

            {/* Body row */}
            <div className="comp-body-row">
              {/* Feature labels */}
              <div className="comp-features-list">
                {features.map((f, i) => (
                  <div key={i} className="comp-feature-item">{f}</div>
                ))}
              </div>

              {/* LXQ column — all checks */}
              <div className="comp-check-col">
                {features.map((_, i) => (
                  <div key={i} className="comp-check-item">
                    <span className="comp-check-circle">{checkSVG}</span>
                  </div>
                ))}
              </div>

              {/* Standaard column — all crosses */}
              <div className="comp-cross-col">
                {features.map((_, i) => (
                  <div key={i} className="comp-check-item">
                    <span className="comp-cross-circle"><span className="comp-cross-mark">✕</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Closing quote */}
        <p className="comp-closing">
          Bij Luxique Academy studeer je niet af als iemand die weet <em>hoe</em> het moet, maar als iemand die begrijpt <em>waarom</em> — en dat is precies wat je klanten laten terugkomen.
        </p>
      </div>

      <style jsx>{`
        :root {
          --comp-gold: #C4A265;
          --comp-gold-bright: #E4C98A;
          --comp-gold-deep: #9E7E45;
          --comp-cream: #FAF8F4;
          --comp-dark: #0C0A07;
          --comp-text: #2C2A25;
          --comp-muted: #9a958b;
          --comp-line: rgba(12,10,7,.08);
          --comp-feature-h: 74px;
          --comp-feature-h-m: 60px;
          --comp-fs: 16px;
          --comp-fs-m: 13px;
        }
        .comp-section {
          position: relative;
          overflow: hidden;
          padding: 90px 0 70px;
        }
        .comp-page-width {
          margin: 0 auto;
          width: 100%;
          max-width: 1180px;
          padding: 0 40px;
        }
        .comp-grid {
          display: grid;
          grid-template-columns: 1fr 1.05fr;
          gap: 64px;
          align-items: center;
        }

        /* LEFT */
        .comp-content { max-width: 520px; }
        .comp-eyebrow {
          font-family: 'Outfit', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: .32em;
          text-transform: uppercase;
          color: #C4A265;
          margin: 0 0 22px;
        }
        .comp-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 64px;
          font-weight: 500;
          line-height: 1.04;
          margin: 0 0 28px;
          color: #0C0A07;
          letter-spacing: -.01em;
        }
        .comp-title em { font-style: italic; color: #C4A265; }
        .comp-desc p {
          font-family: 'Cormorant Garamond', serif;
          font-size: 21px;
          font-style: italic;
          line-height: 1.5;
          color: #2C2A25;
          margin: 0;
          max-width: 430px;
        }

        /* RIGHT */
        .comp-features {
          display: flex;
          flex-direction: column;
          width: 100%;
          position: relative;
        }
        .comp-header-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 14px;
          align-items: end;
        }
        .comp-header {
          padding: 20px 12px 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 6px;
          border-radius: 16px 16px 0 0;
          width: 100%;
          text-align: center;
        }
        .comp-header-spacer { background: transparent; padding: 0; }
        .comp-header-lxq {
          background: linear-gradient(180deg, #E4C98A, #C4A265);
          margin-top: -26px;
          padding-top: 30px;
          box-shadow: 0 -14px 40px rgba(196,162,101,.35);
          position: relative;
        }
        .comp-spark { font-size: 14px; color: rgba(255,255,255,.9); line-height: 1; margin-bottom: 2px; }
        .comp-col-name {
          font-family: 'Outfit', sans-serif;
          font-weight: 600; font-size: 14px; line-height: 1.25; color: #fff;
          letter-spacing: .02em;
        }
        .comp-header-std { background: transparent; }
        .comp-col-name-std {
          font-family: 'Outfit', sans-serif;
          font-weight: 600; font-size: 11px; line-height: 1.3;
          letter-spacing: .18em; text-transform: uppercase; color: #9a958b;
        }

        /* Body */
        .comp-body-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 14px;
        }
        .comp-features-list {
          background: #F2EEE6;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(12,10,7,.08);
        }
        .comp-feature-item {
          padding: 0 26px;
          height: 74px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(12,10,7,.08);
          font-size: 16px;
          font-weight: 400;
          line-height: 1.35;
          color: #2C2A25;
          font-family: 'Outfit', sans-serif;
        }
        .comp-feature-item:last-child { border-bottom: none; }

        /* Check column (LXQ) */
        .comp-check-col {
          background: linear-gradient(180deg, #E4C98A, #9E7E45);
          border-radius: 0 0 18px 18px;
          overflow: hidden;
          margin-bottom: -26px;
          padding-bottom: 26px;
          box-shadow: 0 24px 50px rgba(196,162,101,.3);
        }
        .comp-check-item {
          height: 74px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid rgba(255,255,255,.16);
        }
        .comp-check-item:last-child { border-bottom: none; }
        .comp-check-circle {
          width: 30px; height: 30px; border-radius: 50%;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,.12);
        }

        /* Cross column (Standaard) */
        .comp-cross-col {
          background: #fff;
          border: 1px solid rgba(12,10,7,.08);
          border-radius: 0 0 18px 18px;
          overflow: hidden;
        }
        .comp-cross-col .comp-check-item { border-bottom: 1px solid rgba(12,10,7,.08); }
        .comp-cross-circle {
          width: 30px; height: 30px; border-radius: 50%;
          border: 1.5px solid rgba(12,10,7,.12);
          display: flex; align-items: center; justify-content: center;
        }
        .comp-cross-mark { color: #C77; font-size: 13px; font-weight: 400; }

        /* Closing */
        .comp-closing {
          max-width: 680px;
          margin: 54px auto 0;
          text-align: center;
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 23px;
          line-height: 1.5;
          color: #2C2A25;
        }
        .comp-closing em { color: #C4A265; font-style: italic; font-weight: 600; }

        /* RESPONSIVE — 1024 */
        @media (max-width: 1024px) {
          .comp-grid { grid-template-columns: 1fr; gap: 44px; }
          .comp-content { max-width: 100%; text-align: center; }
          .comp-title { text-align: center; font-size: 54px; }
          .comp-desc p { margin: 0 auto; }
          .comp-features { max-width: 720px; margin: 0 auto; width: 100%; }
        }
        /* RESPONSIVE — 768 */
        @media (max-width: 768px) {
          .comp-section { padding: 56px 0 44px; }
          .comp-page-width { padding: 0 20px; }
          .comp-title { font-size: 34px; }
          .comp-desc p { font-size: 18px; }
          .comp-header-row { grid-template-columns: minmax(140px,2fr) minmax(64px,1fr) minmax(64px,1fr); gap: 8px; }
          .comp-body-row { grid-template-columns: minmax(140px,2fr) minmax(64px,1fr) minmax(64px,1fr); gap: 8px; }
          .comp-feature-item { height: 60px; padding: 0 16px; font-size: 13px; }
          .comp-check-item { height: 60px; }
          .comp-check-circle, .comp-cross-circle { width: 26px; height: 26px; }
          .comp-header { padding: 14px 6px 12px; border-radius: 12px 12px 0 0; }
          .comp-header-lxq { margin-top: -18px; padding-top: 20px; }
          .comp-col-name { font-size: 12px; }
          .comp-check-col { margin-bottom: -18px; padding-bottom: 18px; }
          .comp-closing { font-size: 19px; margin-top: 38px; }
        }
        /* RESPONSIVE — 480 */
        @media (max-width: 480px) {
          .comp-header-row { gap: 5px; }
          .comp-body-row { gap: 5px; }
          .comp-feature-item { padding: 0 12px; font-size: 12px; }
          .comp-col-name-std { font-size: 10px; letter-spacing: .1em; }
        }
      `}</style>
    </section>
  )
}
