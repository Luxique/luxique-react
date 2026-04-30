export default function AcademySection() {
  return (
    <section id="academy" className="py-24 bg-[var(--dark)] text-white relative overflow-hidden">
      <div className="max-w-[900px] mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="section-tag" style={{ color: 'var(--rose-light)' }}>Academy</div>
          <h2 className="font-['Cormorant_Garamond'] text-[clamp(36px,4vw,56px)] font-light leading-[1.15]">
            Online leeromgeving<br />& <em>IRL traject</em>
          </h2>
          <p className="text-[13px] text-white/40 max-w-[340px] mx-auto leading-[1.8] mt-4">
            Leer op jouw eigen tempo via onze videocursussen, of kies voor een persoonlijk traject bij Chiva op locatie.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Online */}
          <a href="#online-cursussen" id="online-cursussen" className="bg-white/[0.04] backdrop-blur border border-white/[0.08] rounded-2xl p-8 hover:border-[var(--rose)]/30 transition group">
            <div className="text-3xl mb-4">🎬</div>
            <h3 className="font-['Cormorant_Garamond'] text-[22px] mb-3">Online Leerplatform</h3>
            <p className="text-[13px] text-white/50 leading-[1.7] mb-6">
              Videocursussen op jouw eigen tempo. Start wanneer jij wilt, leer waar je wilt.
            </p>
            <ul className="space-y-3 mb-8">
              {['Medusa cursus — beginnersniveau', 'Wispy cursus — vervolgmodule', 'Certificaat bij afronding', 'Levenslange toegang'].map((f, i) => (
                <li key={i} className="text-[12px] text-white/60 flex items-start gap-2">
                  <span className="text-[var(--rose)] mt-0.5">✓</span> {f}
                </li>
              ))}
            </ul>
            <span className="inline-block text-[13px] text-[var(--rose)] font-semibold group-hover:text-[var(--rose-light)] transition">
              Bekijk de cursussen →
            </span>
          </a>

          {/* Persoonlijk Traject */}
          <a href="#persoonlijk-traject" id="persoonlijk-traject" className="bg-white/[0.04] backdrop-blur border border-white/[0.08] rounded-2xl p-8 hover:border-[var(--rose)]/30 transition group">
            <div className="text-3xl mb-4">🤝</div>
            <h3 className="font-['Cormorant_Garamond'] text-[22px] mb-3">Persoonlijk Traject</h3>
            <p className="text-[13px] text-white/50 leading-[1.7] mb-6">
              Verspreid over meerdere dagen leer je alle kneepjes van het vak bij Chiva op locatie in Arnhem.
            </p>
            <ul className="space-y-3 mb-8">
              {['Hands-on op locatie Arnhem', 'Alle materialen inbegrepen', 'Volledig op maat'].map((f, i) => (
                <li key={i} className="text-[12px] text-white/60 flex items-start gap-2">
                  <span className="text-[var(--rose)] mt-0.5">✓</span> {f}
                </li>
              ))}
            </ul>
            <span className="inline-block text-[13px] text-[var(--rose)] font-semibold group-hover:text-[var(--rose-light)] transition">
              Meer informatie →
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}
