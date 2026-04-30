export default function ComparisonTable() {
  const features = [
    { name: 'Groepsgrootte', standard: '10–20 cursisten', lxq: 'Max. 2 per dag' },
    { name: 'Begeleiding na de cursus', standard: '✗', lxq: '✓ Wekelijkse mentorship calls' },
    { name: 'Werken met oogvormen', standard: 'Basis of geen', lxq: '✓ Diepgaand — elke oogvorm' },
    { name: 'Curl theorie', standard: 'Standaard curls', lxq: '✓ Alle curls + strategische toepassing' },
    { name: 'Werken op echte modellen', standard: 'Soms', lxq: '✓ Altijd' },
    { name: 'Content editing meegegeven', standard: '✗', lxq: '✓ Mini cursus editen inbegrepen' },
    { name: 'Certificering', standard: 'Soms', lxq: '✓ Officieel LXQ certificaat' },
    { name: 'Online leeromgeving', standard: '✗', lxq: '✓ Volledig platform met videolessen' },
    { name: 'Persoonlijk contact met docent', standard: '✗', lxq: '✓ Direct met Chiva' },
    { name: 'Bottom lashes technieken', standard: 'Zelden', lxq: '✓ Onderdeel van de opleiding' },
  ]

  return (
    <section className="py-24 bg-[var(--bg2)]">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="section-tag">Vergelijking</div>
        <h2 className="section-title mb-4">
          Niet elke opleiding is<br />hetzelfde. <em>Dit is het verschil.</em>
        </h2>

        <div className="mt-12 bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
          <table className="compare-table">
            <thead>
              <tr className="bg-[var(--bg2)]">
                <th className="w-[35%]">Feature</th>
                <th className="w-[32.5%]">Standaard cursus</th>
                <th className="w-[32.5%]">LXQ Academy ✦</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <tr key={i}>
                  <td className="font-medium text-[var(--text)]">{f.name}</td>
                  <td className="text-[var(--text3)]">{f.standard}</td>
                  <td>{f.lxq}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer quote */}
        <p className="text-center text-[15px] text-[var(--text2)] mt-10 max-w-[600px] mx-auto leading-relaxed">
          Bij mij ga je niet afstuderen als iemand die weet <em>hoe</em> het moet. Je gaat afstuderen als iemand die weet <em>waarom</em>.
        </p>
      </div>
    </section>
  )
}
