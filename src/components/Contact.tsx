export default function Contact() {
  return (
    <section id="contact" className="py-24 bg-[var(--bg2)]">
      <div className="max-w-[600px] mx-auto px-6 text-center">
        <div className="section-tag">Contact</div>
        <h2 className="section-title mb-6">
          Laten we <em>praten</em>
        </h2>
        <p className="text-[14px] text-[var(--text2)] mb-10">
          Vragen over een behandeling, cursus of samenwerking? Stuur me een bericht.
        </p>

        <div className="grid grid-cols-1 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-[var(--border)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--rose-pale)] flex items-center justify-center text-xl">📍</div>
            <div className="text-left">
              <div className="text-[13px] font-semibold">Locatie</div>
              <div className="text-[12px] text-[var(--text2)]">Arnhem, Nederland</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-[var(--border)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--rose-pale)] flex items-center justify-center text-xl">📸</div>
            <div className="text-left">
              <div className="text-[13px] font-semibold">Instagram</div>
              <a href="https://instagram.com/lashedbychiva" target="_blank" className="text-[12px] text-[var(--rose)]">@lashedbychiva</a>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-[var(--border)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--rose-pale)] flex items-center justify-center text-xl">📅</div>
            <div className="text-left">
              <div className="text-[13px] font-semibold">Direct boeken</div>
              <a href="#boeken" className="text-[12px] text-[var(--rose)]">Plan een afspraak →</a>
            </div>
          </div>
        </div>

        <p className="text-[12px] text-[var(--text3)]">
          Reactietijd: meestal binnen 24 uur
        </p>
      </div>
    </section>
  )
}
