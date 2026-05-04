export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-['Cormorant_Garamond'] text-[clamp(32px,6vw,48px)] text-[#1a1a1a] mb-4">
          The woman behind <em>LUXIQUE</em>
        </h1>
        <div className="w-20 h-0.5 bg-[#D4AF37] mb-10" />

        <div className="space-y-5 text-[15px] text-[#555] leading-[1.9]">
          <p>
            Wij zijn LUXIQUE — opgericht door Chiva, lash artist en educator gevestigd in Arnhem. Wat begon als een passie voor beauty is uitgegroeid tot een academy die de standaard in de lash industrie wil veranderen.
          </p>
          <p>
            Toen Chiva begon met lashes, wist ze het direct: dit is mijn ding. Maar ze wilde het op haar eigen manier doen. In een markt gedomineerd door Russian volume — zwaar, donker, vol — koos zij voor wispy. Lichter, natuurlijker, passend bij het individu.
          </p>
          <p>
            In het begin begrepen mensen het niet altijd. Waarom niet gewoon Russian volume? Waarom anders? Maar Chiva bleef consistent. En langzaam maar zeker begonnen mensen precies dat te zoeken wat zij maakte. Wispy groeide uit tot een van de meest gevraagde styles.
          </p>
          <p>
            LXQ Academy is geboren uit de wens om alles door te geven — niet alleen de techniek, maar het denken als een artist. Chiva heeft inmiddels honderden studenten opgeleid en haar aanpak is simpel: begin met het waarom, niet met het hoe.
          </p>
          <div className="bg-[#f9f8f6] rounded-2xl p-8 my-10 border border-[#eee]">
            <p className="text-[16px] italic text-[#1a1a1a] font-['Cormorant_Garamond'] leading-[1.7]">
              &ldquo;It&apos;s good to be different. Start off different. Just be you — and people will love you eventually.&rdquo;
            </p>
            <p className="text-[12px] text-[#aaa] mt-3">— Chiva</p>
          </div>
          <p>
            Onze filosofie is simpel: elke oogvorm is uniek en verdient een unieke aanpak. Geen standaard maps, geen kopieën. Wij leren je kijken naar het oog, begrijpen wat nodig is, en een set ontwerpen die écht bij de persoon past.
          </p>
          <p>
            Van complete beginners tot gevorderden die hun skills willen verfijnen — iedereen is welkom bij LXQ Academy. Wij geloven dat de juiste kennis, gecombineerd met de juiste mindset, het verschil maakt tussen een technician en een artist.
          </p>
          <p>
            Onze cursussen combineren online lesmateriaal met persoonlijke begeleiding, zodat je niet alleen leert, maar ook groeit. En met onze community van gelijkgestemde artists sta je er nooit alleen voor.
          </p>
        </div>

        <div className="mt-12 flex items-center gap-6">
          <a href="/courses" className="px-8 py-3 rounded-full bg-[#D4AF37] text-white font-semibold text-[14px] hover:bg-[#C5A028] transition">
            Bekijk de opleidingen
          </a>
          <a href="https://instagram.com/lashedbychiva" target="_blank" className="text-[14px] text-[#D4AF37] font-semibold hover:underline">
            @lashedbychiva
          </a>
        </div>
      </div>
    </div>
  )
}
