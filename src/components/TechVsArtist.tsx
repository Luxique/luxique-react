export default function TechVsArtist() {
  return (
    <section className="pt-0 pb-24">
      <div className="max-w-[940px] mx-auto bg-[var(--bg2)] rounded-t-[36px] overflow-hidden relative z-[2] -mt-9">
      <div className="px-6 py-20">
        {/* Intro — two-layer typography */}
        <div className="text-center px-6 mb-16">
          <span className="block font-['Outfit'] text-[11px] font-semibold tracking-[0.18em] uppercase text-[#D4AF37] mb-5">Lash Tech vs. Lash Artist</span>
          <h2 className="font-['Cormorant_Garamond'] font-normal leading-[1.15] flex flex-col gap-[2px] items-center">
            <span className="text-[clamp(32px,7vw,52px)] text-[#1a1a1a]">Er is een verschil tussen</span>
            <span className="text-[clamp(32px,7vw,52px)] text-[#1a1a1a]">wimpers zetten</span>
            <span className="text-[clamp(34px,7.5vw,56px)] italic text-[#D4AF37]">en wimpers creëren.</span>
            <span className="text-[clamp(18px,4vw,28px)] italic text-[#888] mt-2.5 tracking-[0.01em]">Wij leren je het tweede.</span>
          </h2>
        </div>

        {/* Two columns */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Lash Tech */}
          <div className="bg-white rounded-2xl p-8 border border-[var(--border)]">
            <div className="text-3xl mb-3">🔧</div>
            <h3 className="font-['Cormorant_Garamond'] text-[20px] font-normal mb-4">Lash Technician</h3>
            <p className="text-[13px] text-[var(--text2)] leading-[1.9]">
              Een lash technician beheerst de basistechniek: het aanbrengen van fans, het werken met verschillende lash types, en het volgen van standaard maps. De klant gaat tevreden naar huis.
            </p>
            <p className="text-[13px] text-[var(--text2)] leading-[1.9] mt-4">
              Het werk is voornamelijk uitvoerend — Russian volume, hybrids, classics volgens vaste patronen. Er wordt gewerkt vanuit wat bekend is, niet vanuit wat het oog vraagt.
            </p>
            <p className="text-[13px] text-[var(--text2)] leading-[1.9] mt-4">
              Solide vakmanschap. Maar er is een verschil tussen goed kunnen en echt begrijpen.
            </p>
            <div className="mt-6 pt-4 border-t border-[var(--border)] text-[11px] text-[var(--text3)] tracking-wide uppercase">
              De basis. Het startpunt.
            </div>
          </div>

          {/* Lash Artist — Gold animated gradient card */}
          <div className="relative rounded-2xl p-8 overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.25),0_0_80px_rgba(212,175,55,0.1)]">
            {/* Animated organic gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37] via-[#C5A028] to-[#B8941F] opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#F5E6A3] via-transparent to-[#D4AF37] opacity-40" />
            {/* Moving shine overlay */}
            <div className="absolute inset-0 animate-[shine_4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full" />
            {/* Content */}
            <div className="relative z-10">
              <div className="text-3xl mb-3">✦</div>
              <h3 className="font-['Cormorant_Garamond'] text-[20px] font-normal text-white mb-4">Lash Artist</h3>
              <p className="text-[13px] text-white/90 leading-[1.9] font-medium">
                Je ziet het oog. Niet de wimper.
              </p>
              <p className="text-[13px] text-white/80 leading-[1.9] mt-4">
                Een lash artist analyseert de oogvorm vóórdat er een wimper wordt geplaatst. Weet welke curl past bij welk oog — en waarom. Ontwerpt een set die écht bij die persoon past. Geen kopie, geen standaard map. Een uniek ontwerp, elke keer weer.
              </p>
              <div className="mt-6 pt-4 border-t border-white/20 text-[11px] text-white/60 tracking-wide uppercase">
                Waar wij je naartoe brengen.
              </div>
            </div>
          </div>
        </div>

        {/* Pull Quote */}
        <div className="pull-quote text-center">
          &ldquo;A normal lash tech just copies and pastes. I look at eye shapes. I have knowledge about every curl and I know how to use it, when to use it.&rdquo;
        </div>

        {/* Bridge */}
        <p className="text-center text-[15px] text-[var(--text2)] mt-8">
          Bij LXQ Academy leren wij je denken als een artist. Vanaf dag één.
        </p>

        {/* CTA */}
        <div className="text-center mt-8">
          <a href="#academy" className="btn-filled">Bekijk de opleidingen →</a>
        </div>
      </div>
      </div>
    </section>
  )
}
