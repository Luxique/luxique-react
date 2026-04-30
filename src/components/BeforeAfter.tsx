export default function BeforeAfter() {
  const items = [
    { label: 'Wispy Set', before: 'Natuurlijke wimpers', after: 'Lichte wispy volume' },
    { label: 'Classic Set', before: 'Korte rechte wimpers', after: 'Verlengde natuurlijke look' },
    { label: 'Volume Set', before: 'Dunne wimpers', after: 'Volle wispy volume' },
  ]

  return (
    <section id="behandelingen" className="py-24 bg-[var(--bg2)]">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="section-tag text-center">Resultaten</div>
        <h2 className="section-title text-center mb-4">
          Before & <em>After</em>
        </h2>
        <p className="text-center text-[14px] text-[var(--text2)] max-w-[500px] mx-auto mb-12">
          Elke set is op maat. Geen standaard maps — wat past bij jouw ogen.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-[var(--border)]">
              {/* Before placeholder */}
              <div className="relative">
                <div className="grid grid-cols-2">
                  <div className="aspect-square bg-gradient-to-br from-[#f5f0eb] to-[#e8e0d6] flex items-center justify-center">
                    <span className="text-[11px] text-[var(--text3)] uppercase tracking-wider">Before</span>
                  </div>
                  <div className="aspect-square bg-gradient-to-br from-[#f0ebe5] to-[#ddd4c8] flex items-center justify-center">
                    <span className="text-[11px] text-[var(--rose)] uppercase tracking-wider font-semibold">After</span>
                  </div>
                </div>
                {/* Placeholder — replace with actual before/after images */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] text-[var(--text3)]">📸 {item.label}</span>
                </div>
              </div>
              <div className="p-4 text-center">
                <h4 className="font-['Cormorant_Garamond'] text-[16px]">{item.label}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
