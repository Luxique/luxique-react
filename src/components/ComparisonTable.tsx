export default function ComparisonTable() {
  const features = [
    { name: 'Groepsgrootte', standard: '10–20 cursisten', lxq: 'Max. 2 per dag' },
    { name: 'Begeleiding na de cursus', standard: '✗', lxq: '✓ Wekelijkse mentorship calls' },
    { name: 'Werken met oogvormen', standard: 'Basis of geen', lxq: '✓ Diepgaand — elke oogvorm' },
    { name: 'Curl theorie', standard: 'Standaard curls', lxq: '✓ Alle curls + strategische toepassing' },
    { name: 'Werken op echte modellen', standard: 'Soms', lxq: '✓ Altijd' },
    { name: 'Content editing meegegeven', standard: '✗', lxq: '✓ Mini cursus editen inbegrepen' },
    { name: 'Certificering', standard: 'Soms', lxq: '✓ Officieus LXQ certificaat' },
    { name: 'Online leeromgeving', standard: '✗', lxq: '✓ Volledig platform met videolessen' },
    { name: 'Persoonlijk contact met docent', standard: '✗', lxq: '✓ Direct met Chiva' },
    { name: 'Bottom lashes technieken', standard: 'Zelden', lxq: '✓ Onderdeel van de opleiding' },
  ]

  return (
    <section className="py-24 bg-white">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="section-tag text-center">Vergelijking</div>
        <h2 className="section-title text-center mb-4">
          Niet elke opleiding is<br />hetzelfde. <em>Dit is het verschil.</em>
        </h2>

        {/* Two-column card layout */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {/* Standard Column */}
          <div className="bg-[var(--bg2)] rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)]">
              <h3 className="font-['Cormorant_Garamond'] text-[18px] font-normal text-[var(--text2)]">Standard Lash Course</h3>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {features.map((f, i) => (
                <div key={i} className="px-6 py-4 flex items-start gap-3">
                  <span className={`flex-shrink-0 mt-0.5 text-[14px] ${f.standard === '✗' ? 'text-red-400' : 'text-[var(--text3)]'}`}>
                    {f.standard === '✗' ? '✗' : '○'}
                  </span>
                  <div>
                    <div className="text-[12px] font-semibold text-[var(--text2)] mb-0.5">{f.name}</div>
                    {f.standard !== '✗' && (
                      <div className="text-[11px] text-[var(--text3)]">{f.standard}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LXQ Academy Column */}
          <div className="bg-[#faf7f2] rounded-2xl border border-[var(--rose)]/20 overflow-hidden shadow-[0_0_30px_rgba(201,169,106,0.08)] relative">
            <div className="px-6 py-5 border-b border-[var(--rose)]/15 bg-[var(--rose)]/[0.04]">
              <h3 className="font-['Cormorant_Garamond'] text-[18px] font-normal text-[var(--rose)]">LXQ Academy ✦</h3>
            </div>
            <div className="divide-y divide-[var(--rose)]/10">
              {features.map((f, i) => (
                <div key={i} className="px-6 py-4 flex items-start gap-3">
                  <span className="flex-shrink-0 mt-0.5 text-[14px] text-[var(--rose)] font-bold">✓</span>
                  <div>
                    <div className="text-[12px] font-semibold text-[var(--text)] mb-0.5">{f.name}</div>
                    <div className="text-[11px] text-[var(--text2)]">{f.lxq.replace('✓ ', '')}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Premium badge */}
            <div className="absolute top-4 right-4 bg-[var(--rose)] text-white text-[9px] font-bold tracking-wider uppercase px-3 py-1 rounded-full">
              Premium
            </div>
          </div>
        </div>

        {/* Footer quote */}
        <p className="text-center text-[15px] text-[var(--text2)] mt-10 max-w-[600px] mx-auto leading-relaxed">
          Bij mij ga je niet afstuderen als iemand die weet <em>hoe</em> het moet. Je gaat afstuderen als iemand die weet <em>waarom</em>.
        </p>
      </div>
    </section>
  )
}
