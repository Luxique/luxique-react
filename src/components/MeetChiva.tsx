export default function MeetChiva() {
  return (
    <section id="over-mij" className="py-12 md:py-24 bg-white">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Image with overlay */}
          <div className="relative aspect-[3/4] bg-gradient-to-br from-[#f5f0eb] to-[#e8ddd0] rounded-2xl overflow-hidden border border-[var(--border)]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-3">📸</div>
                <p className="text-[12px] text-[var(--text3)]">Chiva — Portrait Photo</p>
              </div>
            </div>
            {/* Text overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6 pt-16">
              <p className="text-white text-[13px] font-['Outfit'] font-semibold tracking-[0.12em] uppercase">The woman behind LUXIQUE</p>
              <p className="text-white/60 text-[11px] mt-1">Chiva — Lash Artist & Educator</p>
            </div>
          </div>

          {/* Text with fade */}
          <div>
            <div className="section-tag">Over ons</div>
            <h2 className="section-title mb-6">
              Meet <em>Chiva</em>
            </h2>
            <div className="relative">
              <div className="space-y-4 text-[14px] text-[var(--text2)] leading-[1.9]">
                <p>
                  Wij zijn LUXIQUE — opgericht door Chiva, lash artist en educator in Arnhem. Toen Chiva begon met lashes, wist ze meteen: dit wil ik doen. Maar op mijn eigen manier.
                </p>
                <p>
                  In een markt waar Russian volume de standaard was, koos zij voor wispy — lichter, natuurlijker, meer &ldquo;me&rdquo;. Mensen snapten het niet altijd in het begin. Maar zij bleef consistent, en nu is wispy één van de meest gevraagde styles.
                </p>
                <p>
                  LXQ Academy is onze manier om alles door te geven wat wij hebben geleerd. Niet alleen de techniek, maar het denken als een artist. Chiva heeft honderden studenten opgeleid en haar aanpak is eenvoudig: begin met het waarom, niet met het hoe.
                </p>
                <p>
                  Onze filosofie is dat elke oogvorm anders is en een unieke aanpak verdient. Geen standaard maps, geen kopieën. Wij leren je kijken naar het oog, begrijpen wat nodig is, en een set ontwerpen die écht bij de persoon past.
                </p>
                <p>
                  Van beginners tot gevorderden — iedereen is welkom. Wij geloven dat de juiste kennis, gecombineerd met de juiste mindset, het verschil maakt tussen een technician en een artist.
                </p>
              </div>
              {/* Fade overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            </div>
            <div className="mt-4 flex items-center gap-6">
              <a href="/about" className="text-[13px] text-[#D4AF37] font-semibold hover:underline transition">
                Lees meer →
              </a>
              <a href="https://instagram.com/lashedbychiva" target="_blank" className="text-[13px] text-[var(--text3)] hover:text-[#D4AF37] transition">
                @lashedbychiva
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
