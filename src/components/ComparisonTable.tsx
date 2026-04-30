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

  return (
    <section className="py-24 bg-white">
      <div className="max-w-[700px] mx-auto px-4">
        <div className="section-tag text-center">Vergelijking</div>
        <h2 className="section-title text-center mb-12">
          Niet elke opleiding is<br />hetzelfde. <em>Dit is het verschil.</em>
        </h2>

        {/* Three-column table — no stacking, fits on mobile */}
        <div className="grid grid-cols-3 rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm">
          
          {/* Column 1 — Feature labels */}
          <div className="bg-[#f5f5f5]">
            {/* Header */}
            <div className="px-3 py-4 border-b border-[var(--border)]">
              <span className="text-[11px] font-semibold text-[var(--text3)] uppercase tracking-wider">Feature</span>
            </div>
            {/* Rows */}
            {features.map((f, i) => (
              <div key={i} className="px-3 py-3.5 border-b border-[var(--border)] last:border-b-0 flex items-center">
                <span className="text-[12px] md:text-[13px] text-[var(--text2)] leading-tight">{f}</span>
              </div>
            ))}
          </div>

          {/* Column 2 — LXQ Academy (highlighted, rises up) */}
          <div className="bg-gradient-to-b from-[#C9967A] to-[#a8795f] relative -mt-3 mb-[-3px] rounded-t-2xl shadow-lg z-10">
            {/* Header */}
            <div className="px-3 py-5 border-b border-white/20 text-center">
              <span className="text-[12px] md:text-[13px] font-semibold text-white tracking-wide">LXQ Academy ✦</span>
            </div>
            {/* Rows */}
            {features.map((_, i) => (
              <div key={i} className="px-3 py-3.5 border-b border-white/10 last:border-b-0 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-[#C9967A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          {/* Column 3 — Standaard cursus */}
          <div className="bg-white">
            {/* Header */}
            <div className="px-3 py-4 border-b border-[var(--border)] text-center">
              <span className="text-[11px] font-semibold text-[var(--text3)] uppercase tracking-wider">Standaard</span>
            </div>
            {/* Rows */}
            {features.map((_, i) => (
              <div key={i} className="px-3 py-3.5 border-b border-[var(--border)] last:border-b-0 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#e05c5c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* Footer quote */}
        <p className="text-center text-[14px] text-[var(--text2)] mt-10 max-w-[500px] mx-auto leading-relaxed">
          Bij mij ga je niet afstuderen als iemand die weet <em>hoe</em> het moet. Je gaat afstuderen als iemand die weet <em>waarom</em>.
        </p>
      </div>
    </section>
  )
}
