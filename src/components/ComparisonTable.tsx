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
    <svg viewBox="0 0 13 13" fill="none" className="w-[13px] h-[13px]">
      <path d="M2 6.5l3 3L11 3" stroke="#b07050" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  return (
    <section className="py-24 bg-white">
      <div className="w-full max-w-[500px] mx-auto px-5">
        <div className="text-[11px] font-semibold tracking-[0.2em] text-[#D4AF37] uppercase mb-3.5">Vergelijking</div>
        <h2 className="font-['Cormorant_Garamond'] text-[clamp(26px,5vw,38px)] font-normal leading-[1.2] text-[#1a1a1a] mb-10">
          Niet elke opleiding is<br />hetzelfde. <em>Dit is het verschil.</em>
        </h2>

        {/* CSS Grid — 3 columns with gaps */}
        <div className="grid grid-cols-[1fr_90px_78px] gap-x-[8px]"
          style={{
            gridTemplateRows: '100px repeat(9, 58px)',
          }}
        >

          {/* COL 1: Feature labels — rows 2-10 */}
          <div className="col-start-1 row-start-2 row-end-11 bg-[#f5f4f2] rounded-2xl overflow-hidden flex flex-col">
            {features.map((f, i) => (
              <div key={i} className="flex-1 flex items-center px-4 text-[13px] text-[#2a2a2a] leading-[1.35] border-t border-[#e9e7e4] first:border-t-0">
                {f}
              </div>
            ))}
          </div>

          {/* COL 2: LXQ Academy — rows 1-10, gradient */}
          <div className="col-start-2 row-start-1 row-end-11 rounded-[18px] overflow-hidden flex flex-col"
            style={{ background: 'linear-gradient(180deg, #cfa080 0%, #a8714e 100%)' }}
          >
            {/* Header */}
            <div className="h-[100px] flex flex-col items-center justify-end pb-3.5 gap-1 shrink-0">
              <span className="text-white/70 text-[12px]">✦</span>
              <span className="text-white text-[12px] font-semibold text-center leading-[1.3]">LXQ<br />Academy</span>
            </div>
            {/* Check rows */}
            {features.map((_, i) => (
              <div key={i} className="h-[58px] shrink-0 flex items-center justify-center border-t border-white/15">
                <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm">
                  {checkSVG}
                </span>
              </div>
            ))}
          </div>

          {/* COL 3: Standaard cursus — rows 1-10 */}
          <div className="col-start-3 row-start-1 row-end-11 rounded-2xl bg-white border border-[#e8e6e3] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="h-[100px] shrink-0 flex items-end justify-center pb-3.5">
              <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-[#c0bbb5] text-center leading-[1.45]">Standaard<br />cursus</span>
            </div>
            {/* Cross rows */}
            {features.map((_, i) => (
              <div key={i} className="h-[58px] shrink-0 flex items-center justify-center border-t border-[#f0edea]">
                <span className="w-7 h-7 rounded-full bg-white border border-[#e8e6e3] flex items-center justify-center">
                  <span className="text-[#d44f4f] text-[13px] font-medium leading-none">✕</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tagline */}
        <p className="mt-8 font-['Cormorant_Garamond'] text-[clamp(15px,2.8vw,19px)] text-[#3a3a3a] leading-[1.6]">
          Bij mij ga je niet afstuderen als iemand die weet <em>hoe</em> het moet.<br />
          Je gaat afstuderen als iemand die weet <em>waarom.</em>
        </p>
      </div>
    </section>
  )
}
