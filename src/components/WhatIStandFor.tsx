export default function WhatIStandFor() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-[800px] mx-auto px-6">
        <div className="section-tag">Missie</div>
        <h2 className="section-title mb-10">
          Wij willen de standaard<br /><em>veranderen.</em>
        </h2>

        {/* Body part 1 */}
        <p className="text-[14px] text-[var(--text2)] leading-[1.9] mb-6">
          Vraag een willekeurig iemand op straat wat lash extensions zijn. Ze zeggen:
        </p>
        <p className="text-[16px] text-[var(--text2)] mb-8 pl-4 border-l-2 border-[#D4AF37]">
          &ldquo;Die grote zwarte dingen op je wimpers.&rdquo;
        </p>

        {/* Body part 2 */}
        <p className="text-[14px] text-[var(--text2)] leading-[1.9] mb-6">
          Dat is niet wat lash extensions zijn. En dat is precies wat wij willen veranderen.
        </p>
        <p className="text-[14px] text-[var(--text2)] leading-[1.9] mb-8">
          In Nederland is Russian volume de norm. Zwaar, donker, vol. Chiva koos daar bewust niet voor. Toen zij begon, deed zij direct wispy — naturel, passend bij het oog van de klant. Mensen begrepen het niet altijd in het begin. Maar zij bleef gaan. En uiteindelijk wilden mensen precies dat hebben wat zij maakte.
        </p>

        {/* Pull Quote */}
        <div className="pull-quote">
          &ldquo;It&apos;s good to be different. Start off different. Just be you — and people will love you eventually.&rdquo;
          <div className="text-[13px] not-italic text-[var(--text3)] mt-3">— Chiva</div>
        </div>

        {/* Body part 3 */}
        <p className="text-[14px] text-[var(--text2)] leading-[1.9] mt-8 mb-6">
          LXQ Academy bestaat omdat er een verschil is tussen een lash tech en een lash artist — en dat verschil er écht toe doet. Niet alleen voor de klant die in jouw stoel zit, maar voor het niveau van het hele vak.
        </p>
        <p className="text-[15px] text-[var(--text)] font-medium mb-10">
          Wij leiden geen technici op. Wij leiden artists op.
        </p>

        {/* Three Statements */}
        <div className="space-y-4">
          {[
            'Kennis over elke curl die bestaat — en wanneer je welke gebruikt',
            'Werken mét oogvormen, niet ondanks ze',
            'Sets die passen bij de persoon, niet bij de trend'
          ].map((stmt, i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-[var(--bg2)] rounded-xl">
              <span className="text-[var(--rose)] mt-0.5">✦</span>
              <span className="text-[13px] text-[var(--text2)] leading-relaxed">{stmt}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
