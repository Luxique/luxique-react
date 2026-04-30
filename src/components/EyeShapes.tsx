export default function EyeShapes() {
  const shapes = [
    { name: 'Almond', emoji: '👁️', desc: 'De meest veelzijdige oogvorm. Bijna elke style werkt.' },
    { name: 'Round', emoji: '🔵', desc: 'Verlenging en lift nodig om de ogen te openen.' },
    { name: 'Hooded', emoji: ' Crescent', desc: 'Crease verdwijnt. Strategische curl keuze is essentieel.' },
    { name: 'Monolid', emoji: '🪬', desc: 'Vlakke oogleden. Volume technieken voor diepte.' },
    { name: 'Downturned', emoji: '↘️', desc: 'Outer corners zakken. Lift met de juiste curl.' },
    { name: 'Upturned', emoji: '↗️', desc: 'Cat-eye ogen. Natuurlijke lift, speels effect.' },
    { name: 'Deep Set', emoji: '🕳️', desc: 'Ogen liggen dieper. Lange curls voor zichtbaarheid.' },
    { name: 'Close Set', emoji: '⬅️', desc: 'Ogen dicht bij elkaar. Focus op outer corners.' },
  ]

  return (
    <section className="py-24 bg-white">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="section-tag text-center">Kennis</div>
        <h2 className="section-title text-center mb-4">
          Ken de <em>oogvormen</em>
        </h2>
        <p className="text-center text-[14px] text-[var(--text2)] max-w-[500px] mx-auto mb-12">
          Bij LXQ Academy leer je elke oogvorm herkennen en de perfecte lash map ontwerpen. Dit is wat de meeste cursussen overslaan.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {shapes.map((s, i) => (
            <div key={i} className="bg-[var(--bg2)] rounded-2xl p-5 text-center border border-[var(--border)] hover:border-[var(--rose)]/30 transition">
              <div className="text-3xl mb-3">{s.emoji}</div>
              <h4 className="font-['Cormorant_Garamond'] text-[16px] font-normal mb-2">{s.name}</h4>
              <p className="text-[11px] text-[var(--text3)] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
