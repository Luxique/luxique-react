export default function TechVsArtist() {
  return (
    <section className="px-[14px] max-[860px]:px-[10px] pt-0 pb-0">
      <div className="bg-[#FAF8F4] rounded-[22px] overflow-hidden grid grid-cols-1 min-[860px]:grid-cols-[280px_1fr] min-h-[520px] relative">

        {/* LEFT COLUMN */}
        <div className="p-[44px_36px_44px_40px] max-[860px]:p-[32px_28px] flex flex-col justify-between max-[860px]:flex-row max-[860px]:flex-wrap max-[860px]:items-start max-[860px]:gap-[20px] border-r-0 max-[860px]:border-b border-[rgba(30,26,20,0.07)] relative max-[860px]:border-r-0 min-[860px]:border-r min-[860px]:border-[rgba(30,26,20,0.07)]">

          {/* Gold glow */}
          <div className="absolute -top-[40px] -left-[40px] w-[160px] h-[160px] rounded-full bg-[radial-gradient(circle,rgba(196,162,101,0.18)_0%,transparent_70%)] pointer-events-none max-[860px]:hidden min-[860px]:block" />

          <div>
            <span className="font-['Avenir_Next'] max-md:font-['Josefin_Sans'] text-[9.5px] font-[400] tracking-[0.22em] uppercase text-[#C4A265] inline-block px-[11px] py-[4px] border border-[rgba(196,162,101,0.28)] rounded-full mb-[28px]">
              Lash Tech vs. Lash Artist
            </span>

            <h2 className="font-['Cormorant_Garamond'] font-normal text-[clamp(26px,2.8vw,38px)] leading-[1.1] text-[#1E1A14] tracking-[-0.01em]">
              Er is een verschil<br />
              tussen wimpers zetten<br />
              <em className="italic text-[#C4A265]">en wimpers creëren.</em>
            </h2>

            <p className="mt-[14px] text-[13px] font-light text-[#7A7268] leading-[1.75] max-w-[200px]">
              Wij leren je het tweede.
            </p>
          </div>

          <div className="mt-auto max-[860px]:mt-0">
            <div className="hidden min-[860px]:inline-flex items-center gap-[7px] px-[14px] py-[6px] rounded-full border border-[rgba(196,162,101,0.35)] bg-[rgba(196,162,101,0.07)] font-['Avenir_Next'] text-[10px] font-[400] tracking-[0.22em] uppercase text-[#C4A265] mb-[12px]">
              <span className="text-[8px] text-[#7A6340]">✦</span>
              Luxique Academy
            </div>
            <p className="hidden min-[860px]:block text-[12px] font-light text-[#7A7268] leading-[1.5] max-w-[160px]">
              De plek waar de volgende generatie lash artists wordt opgeleid.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col">
          <div className="p-[32px_32px_32px_28px] max-[860px]:p-[24px_20px] grid grid-cols-1 min-[540px]:grid-cols-2 gap-[16px] max-[860px]:gap-[12px] items-stretch">

            {/* TECH CARD */}
            <div className="rounded-[16px] overflow-hidden flex flex-col relative transition-transform duration-300 ease-in-out hover:-translate-y-[3px] bg-[rgba(30,26,20,0.05)] border-[1.5px] border-[rgba(30,26,20,0.08)] hover:shadow-[0_8px_28px_rgba(30,26,20,0.08)] cursor-default max-[540px]:order-[-1]">
              <div className="w-full aspect-[4/3] overflow-hidden relative shrink-0 bg-[linear-gradient(140deg,#e8e4dc_0%,#d4cfc6_100%)]">
                {/* GEORGE: img tag for lash-tech.jpg */}
                {/* <img src="/images/lash-tech.jpg" alt="Lash Technician" className="w-full h-full object-cover" /> */}
                <div className="w-full h-full flex items-center justify-center text-[rgba(30,26,20,0.15)]">
                  <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="0.75">
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <span className="absolute top-[12px] left-[12px] text-[9.5px] font-medium tracking-[0.12em] uppercase px-[11px] py-[4px] rounded-full bg-[rgba(255,255,255,0.7)] text-[#7A7268] border border-[rgba(255,255,255,0.4)] z-[2]">
                  Een solide basis
                </span>
              </div>
              <div className="p-[22px_22px_26px] flex flex-col flex-1 relative z-[1]">
                <h3 className="font-['Cormorant_Garamond'] text-[22px] font-normal leading-[1.2] mb-[10px] tracking-[-0.01em] text-[#1E1A14]">Lash Technician</h3>
                <div className="h-[1px] my-[16px] bg-[rgba(30,26,20,0.08)]" />
                <p className="text-[12.5px] font-light leading-[1.75] text-[#7A7268] flex-1">
                  Een lash technician beheerst de basistechniek: het aanbrengen van fans, het werken met verschillende lash types, en het volgen van standaard maps.
                  <br /><br />
                  Het werk is voornamelijk uitvoerend: Russian volume, hybrids, classics volgens vaste patronen. Er wordt gewerkt vanuit wat bekend is. Alleen wordt er niet bepaald gewerkt vanuit wat het oog vraagt.
                </p>
                <span className="text-[9.5px] font-semibold tracking-[0.2em] uppercase mt-[14px] text-[rgba(30,26,20,0.28)]">Een goede start, maar er is meer</span>
              </div>
            </div>

            {/* ARTIST CARD */}
            <div className="rounded-[16px] overflow-hidden flex flex-col relative transition-transform duration-300 ease-in-out hover:-translate-y-[3px] bg-[#0C0A07] border-[1.5px] border-[rgba(196,162,101,0.2)] shadow-[0_16px_56px_rgba(12,10,7,0.35),0_0_0_1px_rgba(196,162,101,0.1)] hover:shadow-[0_24px_72px_rgba(12,10,7,0.45),0_0_0_1px_rgba(196,162,101,0.18)] cursor-default">
              {/* Gold glow */}
              <div className="absolute -top-[30px] -right-[30px] w-[140px] h-[140px] rounded-full bg-[radial-gradient(circle,rgba(196,162,101,0.14)_0%,transparent_70%)] pointer-events-none z-0" />
              <div className="w-full aspect-[4/3] overflow-hidden relative shrink-0 bg-[linear-gradient(140deg,#1e1a12_0%,#2a2218_100%)]">
                {/* GEORGE: img tag for lash-artist.jpg */}
                {/* <img src="/images/lash-artist.jpg" alt="Lash Artist" className="w-full h-full object-cover" /> */}
                <div className="w-full h-full flex items-center justify-center text-[rgba(196,162,101,0.18)]">
                  <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="0.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <span className="absolute top-[12px] left-[12px] text-[9.5px] font-medium tracking-[0.12em] uppercase px-[11px] py-[4px] rounded-full bg-[rgba(12,10,7,0.65)] text-[#C4A265] border border-[rgba(196,162,101,0.25)] z-[2]">
                  Waar wij je naartoe brengen
                </span>
                <div className="absolute bottom-0 left-0 right-0 p-[28px_14px_12px] bg-[linear-gradient(0deg,rgba(12,10,7,0.72)_0%,transparent_100%)] flex items-end justify-between">
                  <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[#DFC08A]">Lash Artist</span>
                </div>
              </div>
              <div className="p-[22px_22px_26px] flex flex-col flex-1 relative z-[1]">
                <h3 className="font-['Cormorant_Garamond'] text-[22px] font-normal leading-[1.2] mb-[10px] tracking-[-0.01em] text-[#FAF8F4]">Lash Artist</h3>
                <div className="h-[1px] my-[16px] bg-[rgba(196,162,101,0.15)]" />
                <p className="text-[12.5px] font-light leading-[1.75] text-[rgba(250,248,244,0.55)] flex-1">
                  <strong className="text-[rgba(250,248,244,0.85)] font-normal">Je ziet het oog. Niet de wimper.</strong>
                  <br /><br />
                  Een lash artist analyseert de oogvorm vóórdat er ook maar één wimper wordt geplaatst. De artist weet precies welke curl past bij welk oog — en waaróm. Er wordt een set ontwikkeld die écht bij de persoon past. Geen kopie, geen standaard map. Een uniek ontwerp, dat verschilt per persoon.
                </p>
                <a href="/courses" className="inline-flex items-center gap-[7px] mt-[18px] px-[20px] py-[10px] rounded-full bg-[#C4A265] text-[#0C0A07] font-['Outfit'] text-[12px] font-semibold tracking-[0.04em] border-none cursor-pointer transition-all duration-200 w-fit hover:bg-[#DFC08A] hover:scale-[1.02]">
                  Bekijk de academy
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Quote strip */}
          <div className="px-[40px] max-[860px]:px-[20px] pb-[36px] max-[860px]:pb-[28px] pl-[28px] max-[860px]:pl-[20px] flex items-start gap-[16px]">
            <div className="flex flex-col items-center gap-[6px] shrink-0">
              <div className="w-[40px] h-[40px] rounded-full bg-[linear-gradient(140deg,#2a2218,#1e1a12)] border-[1.5px] border-[rgba(196,162,101,0.35)] flex items-center justify-center">
                <span className="font-['Cormorant_Garamond'] text-[16px] italic text-[#C4A265] leading-none">C</span>
              </div>
              <div className="w-[2px] h-[32px] bg-[linear-gradient(180deg,#C4A265_0%,transparent_100%)] rounded-[2px]" />
            </div>
            <div>
              <p className="font-['Cormorant_Garamond'] text-[17px] italic font-light leading-[1.6] text-[#1E1A14] max-w-[600px]">
                &ldquo;A normal lash tech just copies and pastes. I look at eye shapes. I have knowledge about every face that sits in my chair.&rdquo;
              </p>
              <p className="mt-[6px] text-[10.5px] font-medium tracking-[0.16em] uppercase text-[#7A6340]">
                — Chiva · Founder, Luxique Academy
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
